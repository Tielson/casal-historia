import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { createTransport, type Transporter } from 'nodemailer';
import { existsSync } from 'fs';
import { readFile } from 'fs/promises';
import { join } from 'path';
import sharp from 'sharp';
import { pageSceneKey } from '@entre-nos/shared';
import { config } from '../config';
import { PrismaService } from '../prisma/prisma.service';
import { QueueService } from '../queue/queue.service';
import { StorageService } from '../storage/storage.service';
import {
  COVER_CID,
  LOGO_CID,
  bookReadyHtml,
  bookReadyText,
  paymentReceiptHtml,
  paymentReceiptText,
  type MailBrand,
} from './templates';

@Injectable()
export class MailService implements OnModuleInit {
  private readonly logger = new Logger(MailService.name);
  private readonly transport: Transporter | null;
  private logoPng: Buffer | null | undefined;

  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly queue: QueueService,
  ) {
    this.transport = this.smtpReady()
      ? createTransport({
          host: config.smtp.host,
          port: config.smtp.port,
          secure: config.smtp.secure,
          auth: { user: config.smtp.user, pass: config.smtp.pass },
        })
      : null;
  }

  onModuleInit() {
    this.queue.register('receipt', async (data) => {
      if (!data.orderId) return;
      await this.sendPaymentReceipt(data.orderId);
    });
  }

  async sendPaymentReceipt(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { draft: { include: { preview: true } } },
    });
    if (!order) return { ok: false, reason: 'missing' };
    if (order.receiptSentAt) return { ok: true, idempotent: true };

    const to = order.email ?? order.draft.email;
    if (!to) return { ok: false, reason: 'no_email' };

    const claimed = await this.prisma.order.updateMany({
      where: { id: order.id, receiptSentAt: null },
      data: { receiptSentAt: new Date() },
    });
    if (claimed.count === 0) return { ok: true, idempotent: true };

    const names = coupleNames(order.draft.nameA, order.draft.nameB);
    const paidAt = order.paidAt ?? new Date();
    const details = {
      brand: this.brand(),
      names,
      amount: formatMoney(order.amountCents, order.currency),
      paidAt: formatWhen(paidAt),
      orderId: order.id,
    };
    try {
      const cover = await this.coverBytes(coverKeyOf(order.draft.preview));
      const logo = await this.logoBytes();
      const result = await this.deliver({
        to,
        subject: `Comprovante ${config.appName} — ${names}`,
        text: paymentReceiptText(details),
        html: paymentReceiptHtml({ ...details, hasCover: Boolean(cover), hasLogo: Boolean(logo) }),
        cover,
        logo,
      });
      if (!result.ok) throw new Error('Falha ao enviar o comprovante');
      return result;
    } catch (err) {
      await this.prisma.order.update({
        where: { id: order.id },
        data: { receiptSentAt: null },
      });
      throw err;
    }
  }

  async sendBookReady(input: {
    to: string;
    manageUrl: string;
    giftUrl: string;
    names: string;
    coverKey?: string | null;
  }) {
    const details = {
      brand: this.brand(),
      names: input.names,
      manageUrl: input.manageUrl,
      giftUrl: input.giftUrl,
    };
    const cover = await this.coverBytes(input.coverKey);
    const logo = await this.logoBytes();
    return this.deliver({
      to: input.to,
      subject: `Seu livro ${config.appName} está pronto — ${input.names}`,
      text: bookReadyText(details),
      html: bookReadyHtml({ ...details, hasCover: Boolean(cover), hasLogo: Boolean(logo) }),
      cover,
      logo,
    });
  }

  private brand(): MailBrand {
    return { appName: config.appName, companyName: config.companyName };
  }

  private smtpReady() {
    return Boolean(
      config.smtp.host && config.smtp.user && config.smtp.pass && config.smtp.fromEmail,
    );
  }

  private async deliver(input: {
    to: string;
    subject: string;
    text: string;
    html: string;
    cover: Buffer | null;
    logo: Buffer | null;
  }) {
    if (!this.transport) {
      this.logger.log(`[email stub] to=${input.to} subject=${input.subject}\n${input.text}`);
      return { ok: true, stub: true };
    }

    const attachments = [];
    if (input.logo) {
      attachments.push({
        filename: 'logo.png',
        content: input.logo,
        cid: LOGO_CID,
        contentDisposition: 'inline' as const,
      });
    }
    if (input.cover) {
      attachments.push({
        filename: 'capa.jpg',
        content: input.cover,
        cid: COVER_CID,
        contentDisposition: 'inline' as const,
      });
    }

    const info = await this.transport.sendMail({
      from: `${config.smtp.fromName} <${config.smtp.fromEmail}>`,
      to: input.to,
      subject: input.subject,
      text: input.text,
      html: input.html,
      attachments,
    });
    this.logger.log(`Email sent to=${input.to} messageId=${info.messageId ?? ''}`);
    return { ok: true, stub: false, messageId: info.messageId };
  }

  private async logoBytes() {
    if (this.logoPng !== undefined) return this.logoPng;
    const path = logoPath();
    if (!path) {
      this.logoPng = null;
      return null;
    }
    try {
      const svg = await readFile(path);
      this.logoPng = await sharp(svg, { density: 192 }).resize(128, 128).png().toBuffer();
    } catch (err) {
      this.logger.warn(`Logo do e-mail indisponível: ${(err as Error).message}`);
      this.logoPng = null;
    }
    return this.logoPng;
  }

  private async coverBytes(key?: string | null) {
    if (!key) return null;
    try {
      const bytes = await this.storage.getObject(key);
      return bytes.length ? bytes : null;
    } catch (err) {
      this.logger.warn(`Capa do e-mail indisponível: ${(err as Error).message}`);
      return null;
    }
  }
}

function coupleNames(nameA?: string | null, nameB?: string | null) {
  const a = nameA?.trim();
  const b = nameB?.trim();
  if (a && b) return `${a} & ${b}`;
  return a || b || 'vocês';
}

function formatMoney(cents: number, currency: string) {
  try {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(cents / 100);
  } catch {
    return `${(cents / 100).toFixed(2)} ${currency.toUpperCase()}`;
  }
}

function formatWhen(date: Date) {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'long',
    timeStyle: 'short',
    timeZone: 'America/Sao_Paulo',
  }).format(date);
}

export function coverKeyOf(
  preview: { coverKey: string | null; sceneKeys: unknown } | null | undefined,
) {
  if (!preview) return null;
  if (preview.coverKey) return preview.coverKey;
  if (!preview.sceneKeys || typeof preview.sceneKeys !== 'object' || Array.isArray(preview.sceneKeys)) {
    return null;
  }
  const key = (preview.sceneKeys as Record<string, unknown>)[pageSceneKey(1)];
  return typeof key === 'string' && key ? key : null;
}

function logoPath() {
  const candidates = [
    join(process.cwd(), '../web/public/brand/entre-nos-mark.svg'),
    join(process.cwd(), 'apps/web/public/brand/entre-nos-mark.svg'),
    join(__dirname, '../../../web/public/brand/entre-nos-mark.svg'),
    join(__dirname, '../../../../web/public/brand/entre-nos-mark.svg'),
  ];
  return candidates.find((path) => existsSync(path)) ?? null;
}
