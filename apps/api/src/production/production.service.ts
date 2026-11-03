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
import { coverKeyOf } from '../mail/mail.service';
import { AnalyticsService } from '../analytics/analytics.service';
import { QueueService } from '../queue/queue.service';
import { Prisma } from '@prisma/client';
import { DEFAULT_STYLE_ID, manuscriptSchema, pageSceneKey, type StoryModeId } from '@entre-nos/shared';
import { config } from '../config';
import {
  assessImages,
  assessManuscript,
  DeliveryBlocked,
  pageCopy,
} from '../generation/book-quality';
import { textFits } from './pdf-layout';

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

    try {
      const draft = order.draft;
      const preview = draft.preview;
      if (!preview?.manuscript) {
        throw new DeliveryBlocked([
          'Manuscrito aprovado ausente. A história precisa ser gerada de novo.',
        ]);
      }
      const manuscript = manuscriptSchema.parse(preview.manuscript);
      const answers = (draft.memoriesAnswers as Record<string, string> | null) ?? {};
      const storyMode = (draft.storyMode as StoryModeId | null) ?? manuscript.storyMode;
      const input = {
        nameA: draft.nameA ?? 'A',
        nameB: draft.nameB ?? 'B',
        styleId: draft.styleId ?? DEFAULT_STYLE_ID,
        filmFinish: draft.filmFinish,
        occasion: draft.occasion,
        startDate: draft.startDate,
        dedication: draft.dedication,
        answers,
        storyMode,
        photoAKey: draft.photoAKey,
        photoBKey: draft.photoBKey,
        photoTogetherKey: draft.photoTogetherKey,
      };

      const reuseMock = !config.mockGeneration && preview.imagesMock;
      const existing = reuseMock ? {} : keyMap(preview.sceneKeys);
      await this.prisma.order.update({
        where: { id: orderId },
        data: { productionStage: 'scenes' },
      });
      const illustrated = await this.generation.generateRemainingScenes(
        orderId,
        input,
        manuscript,
        existing,
      );
      await this.prisma.preview.update({
        where: { draftId: draft.id },
        data: {
          sceneKeys: illustrated.sceneKeys as Prisma.InputJsonValue,
          imagesMock: illustrated.imagesMock,
        },
      });

      const pages = [...manuscript.pages].sort((a, b) => a.index - b.index);

      const reasons = [
        ...assessManuscript({
          pages,
          answers,
          storyMode,
          thread: manuscript.thread,
          phases: manuscript.phases,
        }).reasons,
        ...assessImages({
          sceneKeys: illustrated.sceneKeys,
          placeholder: illustrated.imagesMock,
          allowPlaceholder: config.mockGeneration,
        }).reasons,
        ...pages
          .filter((page) => !textFits(page, page.role === 'cover' ? manuscript.title : ''))
          .map((page) => `Texto cortado na página ${page.index}.`),
      ];
      if (reasons.length) throw new DeliveryBlocked(reasons);

      await this.prisma.order.update({
        where: { id: orderId },
        data: { productionStage: 'pdf' },
      });
      const pdfPages = pages.map((page) => ({
        page,
        imageKey: illustrated.sceneKeys[pageSceneKey(page.index)],
      }));
      const pdfKey = await this.pdf.assemble(orderId, {
        title: manuscript.title,
        styleId: input.styleId,
        pages: pdfPages,
      });

      await this.prisma.deliverable.deleteMany({ where: { orderId } });
      for (const { page, imageKey } of pdfPages) {
        await this.prisma.deliverable.create({
          data: {
            orderId,
            kind: 'page',
            storageKey: imageKey,
            pageIndex: page.index,
            mimeType: 'image/jpeg',
            title: page.role === 'cover' ? manuscript.title : null,
            body: pageCopy(page),
          },
        });
      }
      await this.prisma.deliverable.create({
        data: {
          orderId,
          kind: 'pdf',
          storageKey: pdfKey,
          mimeType: 'application/pdf',
        },
      });

      await this.prisma.order.update({
        where: { id: orderId },
        data: {
          pdfKey,
          status: 'delivered',
          productionStage: 'delivered',
          productionError: null,
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
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Falha na produção';
      await this.prisma.order.update({
        where: { id: orderId },
        data: {
          status: 'needs_review',
          productionStage: 'needs_review',
          productionError: message.slice(0, 2000),
        },
      });
      await this.prisma.draft.update({
        where: { id: order.draftId },
        data: { status: 'failed' },
      });
      if (err instanceof DeliveryBlocked) return { ok: false, error: message };
      throw err;
    }
  }

  async assemblePdf(orderId: string) {
    return this.runProduction(orderId);
  }

  async sendAccessEmail(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { draft: { include: { preview: true } } },
    });
    if (!order || order.status !== 'delivered' || !order.pdfKey) {
      return { ok: false, reason: 'not_delivered' };
    }
    const to = order.email ?? order.draft.email;
    if (!to) return { ok: false, reason: 'no_email' };
    const names = [order.draft.nameA, order.draft.nameB].filter(Boolean).join(' & ');
    return this.email.sendBookReady({
      to,
      names: names || 'vocês',
      manageUrl: `${config.webUrl}/livro/${order.manageToken}`,
      giftUrl: `${config.webUrl}/presente/${order.giftToken}`,
      coverKey: coverKeyOf(order.draft.preview),
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

function keyMap(value: unknown): Record<string, string> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const keys: Record<string, string> = {};
  for (const [key, item] of Object.entries(value)) {
    if (typeof item === 'string' && item) keys[key] = item;
  }
  return keys;
}
