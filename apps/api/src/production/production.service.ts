import {
  BadRequestException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GenerationService } from '../generation/generation.service';
import { StorageService } from '../storage/storage.service';
import { PdfService } from './pdf.service';
import { EmailService } from './email.service';
import { AnalyticsService } from '../analytics/analytics.service';
import { QueueService } from '../queue/queue.service';
import { config } from '../config';

@Injectable()
export class ProductionService implements OnModuleInit {
  constructor(
    private readonly prisma: PrismaService,
    private readonly generation: GenerationService,
    private readonly storage: StorageService,
    private readonly pdf: PdfService,
    private readonly email: EmailService,
    private readonly analytics: AnalyticsService,
    private readonly queue: QueueService,
  ) {}

  onModuleInit() {
    this.queue.register('production', async (data) => {
      if (data.orderId) await this.runProduction(data.orderId);
    });
    this.queue.register('pdf', async (data) => {
      if (data.orderId) await this.assemblePdf(data.orderId);
    });
    this.queue.register('email', async (data) => {
      if (data.orderId) await this.sendAccessEmail(data.orderId);
    });
  }

  async runProduction(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { draft: { include: { preview: true } } },
    });
    if (!order) return;
    if (order.status === 'delivered' && order.pdfKey) {
      return { ok: true, idempotent: true };
    }

    await this.prisma.order.update({
      where: { id: orderId },
      data: { status: 'producing', productionStage: 'pages', productionError: null },
    });
    await this.prisma.draft.update({
      where: { id: order.draftId },
      data: { status: 'producing' },
    });

    const draft = order.draft;
    const answers = (draft.memoriesAnswers as Record<string, string> | null) ?? {};
    const input = {
      nameA: draft.nameA ?? 'A',
      nameB: draft.nameB ?? 'B',
      styleId: draft.styleId ?? 'editorial',
      occasion: draft.occasion,
      startDate: draft.startDate,
      dedication: draft.dedication,
      answers,
    };

    // Reuse approved preview assets
    const keys: string[] = [];
    if (draft.preview?.coverKey) keys.push(draft.preview.coverKey);
    if (draft.preview?.pageKey) keys.push(draft.preview.pageKey);

    await this.prisma.order.update({
      where: { id: orderId },
      data: { productionStage: 'remaining_pages' },
    });
    const remaining = await this.generation.generateRemainingPages(orderId, input);
    keys.push(...remaining.map((p) => p.key));

    await this.prisma.order.update({
      where: { id: orderId },
      data: { productionStage: 'pdf' },
    });
    const pdfKey = await this.pdf.assemble(
      orderId,
      keys,
      `${input.nameA} & ${input.nameB}`,
    );

    await this.prisma.order.update({
      where: { id: orderId },
      data: {
        pdfKey,
        status: 'delivered',
        productionStage: 'delivered',
        deliveredAt: new Date(),
      },
    });
    await this.prisma.draft.update({
      where: { id: order.draftId },
      data: { status: 'delivered' },
    });

    await this.analytics.track({
      name: 'delivery',
      draftId: order.draftId,
      orderId,
    });

    await this.queue.enqueue({ kind: 'email', orderId });
    return { ok: true, pdfKey };
  }

  async assemblePdf(orderId: string) {
    return this.runProduction(orderId);
  }

  async sendAccessEmail(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { draft: true },
    });
    if (!order) return;
    const to = order.email ?? order.draft.email;
    if (!to) return { ok: false, reason: 'no_email' };
    return this.email.sendBookReady({
      to,
      names: `${order.draft.nameA ?? ''} & ${order.draft.nameB ?? ''}`,
      manageUrl: `${config.webUrl}/livro/${order.manageToken}`,
      giftUrl: `${config.webUrl}/presente/${order.giftToken}`,
    });
  }

  async getByManageToken(token: string) {
    const order = await this.prisma.order.findUnique({
      where: { manageToken: token },
      include: { draft: { include: { preview: true } } },
    });
    if (!order) throw new NotFoundException('Livro não encontrado');
    return this.toBookView(order, 'manage');
  }

  async getByGiftToken(token: string) {
    const order = await this.prisma.order.findUnique({
      where: { giftToken: token },
      include: { draft: { include: { preview: true } } },
    });
    if (!order) throw new NotFoundException('Presente não encontrado');
    if (order.giftRevoked) {
      throw new BadRequestException('Link de presente revogado');
    }
    return this.toBookView(order, 'gift');
  }

  async revokeGift(manageToken: string) {
    const order = await this.prisma.order.findUnique({ where: { manageToken } });
    if (!order) throw new NotFoundException('Pedido não encontrado');
    await this.prisma.order.update({
      where: { id: order.id },
      data: { giftRevoked: true },
    });
    return { ok: true, giftRevoked: true };
  }

  async status(orderId: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Pedido não encontrado');
    return {
      id: order.id,
      status: order.status,
      productionStage: order.productionStage,
      productionError: order.productionError,
      deliveredAt: order.deliveredAt,
      manageToken: order.manageToken,
      giftToken: order.giftRevoked ? null : order.giftToken,
    };
  }

  private async toBookView(
    order: {
      id: string;
      status: string;
      pdfKey: string | null;
      manageToken: string;
      giftToken: string;
      giftRevoked: boolean;
      draft: {
        nameA: string | null;
        nameB: string | null;
        preview: { coverKey: string | null; pageKey: string | null; coverText: string | null; pageText: string | null } | null;
      };
    },
    mode: 'manage' | 'gift',
  ) {
    const coverUrl = order.draft.preview?.coverKey
      ? await this.storage.getSignedGetUrl(order.draft.preview.coverKey)
      : null;
    const pageUrl = order.draft.preview?.pageKey
      ? await this.storage.getSignedGetUrl(order.draft.preview.pageKey)
      : null;
    const pdfUrl =
      mode === 'manage' && order.pdfKey
        ? await this.storage.getSignedGetUrl(order.pdfKey)
        : mode === 'gift' && order.pdfKey
          ? await this.storage.getSignedGetUrl(order.pdfKey)
          : null;

    return {
      mode,
      orderId: order.id,
      status: order.status,
      names: `${order.draft.nameA ?? ''} & ${order.draft.nameB ?? ''}`,
      coverUrl,
      pageUrl,
      coverText: order.draft.preview?.coverText,
      pageText: order.draft.preview?.pageText,
      pdfUrl,
      canRevokeGift: mode === 'manage',
      giftRevoked: order.giftRevoked,
      noindex: mode === 'gift',
    };
  }
}
