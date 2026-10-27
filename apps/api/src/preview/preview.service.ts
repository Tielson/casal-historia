import {
  BadRequestException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { QueueService } from '../queue/queue.service';
import { GenerationService } from '../generation/generation.service';
import { StorageService } from '../storage/storage.service';
import { AnalyticsService } from '../analytics/analytics.service';
import { config } from '../config';

@Injectable()
export class PreviewService implements OnModuleInit {
  constructor(
    private readonly prisma: PrismaService,
    private readonly queue: QueueService,
    private readonly generation: GenerationService,
    private readonly storage: StorageService,
    private readonly analytics: AnalyticsService,
  ) {}

  onModuleInit() {
    this.queue.register('preview', async (data) => {
      if (data.draftId) await this.runPreviewJob(data.draftId);
    });
  }

  async start(token: string, regenerate = false) {
    const draft = await this.prisma.draft.findUnique({ where: { token } });
    if (!draft) throw new NotFoundException('Rascunho não encontrado');
    if (!draft.nameA || !draft.nameB || !draft.styleId) {
      throw new BadRequestException('Complete nomes e estilo antes da prévia');
    }
    if (draft.previewApproved) {
      throw new BadRequestException('Prévia já aprovada — assets congelados');
    }
    if (regenerate && draft.previewRegenCount >= config.maxPreviewRegens) {
      throw new BadRequestException(
        `Limite de ${config.maxPreviewRegens} regenerações atingido`,
      );
    }

    if (regenerate) {
      await this.prisma.draft.update({
        where: { id: draft.id },
        data: { previewRegenCount: { increment: 1 } },
      });
    }

    const preview = await this.prisma.preview.upsert({
      where: { draftId: draft.id },
      create: { draftId: draft.id, stage: 'queued', error: null },
      update: {
        stage: 'queued',
        error: null,
        coverKey: null,
        pageKey: null,
      },
    });

    await this.prisma.draft.update({
      where: { id: draft.id },
      data: { status: 'previewing', step: 'preview' },
    });

    await this.prisma.generationJob.create({
      data: {
        draftId: draft.id,
        kind: 'preview',
        stage: 'queued',
      },
    });

    await this.queue.enqueue({ kind: 'preview', draftId: draft.id });
    return this.toPublic(preview);
  }

  async runPreviewJob(draftId: string) {
    const draft = await this.prisma.draft.findUnique({ where: { id: draftId } });
    if (!draft) return;

    const stages = ['writing', 'illustrating', 'layout'] as const;
    for (const stage of stages) {
      await this.prisma.preview.update({
        where: { draftId },
        data: { stage },
      });
      await sleep(400);
    }

    try {
      const answers = (draft.memoriesAnswers as Record<string, string> | null) ?? {};
      const result = await this.generation.generatePreviewAssets(draft.token, {
        nameA: draft.nameA ?? 'A',
        nameB: draft.nameB ?? 'B',
        styleId: draft.styleId ?? 'editorial',
        occasion: draft.occasion,
        startDate: draft.startDate,
        dedication: draft.dedication,
        answers,
      });

      const preview = await this.prisma.preview.update({
        where: { draftId },
        data: {
          stage: 'ready',
          coverKey: result.coverKey,
          pageKey: result.pageKey,
          coverText: result.coverText,
          pageText: result.pageText,
          error: null,
        },
      });

      await this.prisma.draft.update({
        where: { id: draftId },
        data: { status: 'preview_ready' },
      });

      await this.analytics.track({
        name: 'preview_ready',
        draftId,
      });

      return preview;
    } catch (err) {
      await this.prisma.preview.update({
        where: { draftId },
        data: { stage: 'failed', error: (err as Error).message },
      });
      throw err;
    }
  }

  async get(token: string) {
    const draft = await this.prisma.draft.findUnique({
      where: { token },
      include: { preview: true },
    });
    if (!draft?.preview) throw new NotFoundException('Prévia não encontrada');
    return this.toPublic(draft.preview);
  }

  async approve(token: string) {
    const draft = await this.prisma.draft.findUnique({
      where: { token },
      include: { preview: true },
    });
    if (!draft?.preview || draft.preview.stage !== 'ready') {
      throw new BadRequestException('Prévia ainda não está pronta');
    }
    await this.prisma.draft.update({
      where: { id: draft.id },
      data: { previewApproved: true, status: 'approved', step: 'review' },
    });
    return { ok: true, frozen: true };
  }

  private async toPublic(preview: {
    id: string;
    draftId: string;
    stage: string;
    coverKey: string | null;
    pageKey: string | null;
    coverText: string | null;
    pageText: string | null;
    error: string | null;
    updatedAt: Date;
  }) {
    return {
      id: preview.id,
      draftId: preview.draftId,
      stage: preview.stage,
      coverUrl: preview.coverKey
        ? await this.storage.getSignedGetUrl(preview.coverKey)
        : null,
      pageUrl: preview.pageKey
        ? await this.storage.getSignedGetUrl(preview.pageKey)
        : null,
      coverText: preview.coverText,
      pageText: preview.pageText,
      error: preview.error,
      updatedAt: preview.updatedAt.toISOString(),
      maxRegens: config.maxPreviewRegens,
    };
  }
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
