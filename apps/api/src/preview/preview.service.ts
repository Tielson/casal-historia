import {
  BadRequestException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  DEFAULT_STYLE_ID,
  PREVIEW_PAGES,
  manuscriptSchema,
  pageSceneKey,
  type PageView,
  type StoryModeId,
} from '@entre-nos/shared';
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
        coverText: null,
        pageText: null,
        manuscript: Prisma.DbNull,
        sceneKeys: Prisma.DbNull,
        imagesMock: false,
        createdAt: new Date(),
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

    try {
      const answers = (draft.memoriesAnswers as Record<string, string> | null) ?? {};
      const result = await this.generation.generatePreviewAssets(
        draft.token,
        {
          nameA: draft.nameA ?? 'A',
          nameB: draft.nameB ?? 'B',
          styleId: draft.styleId ?? DEFAULT_STYLE_ID,
          filmFinish: draft.filmFinish,
          occasion: draft.occasion,
          startDate: draft.startDate,
          dedication: draft.dedication,
          answers,
          storyMode: (draft.storyMode as StoryModeId | null) ?? 'inspired',
          photoAKey: draft.photoAKey,
          photoBKey: draft.photoBKey,
          photoTogetherKey: draft.photoTogetherKey,
        },
        async (stage) => {
          await this.prisma.preview.update({ where: { draftId }, data: { stage } });
        },
      );

      const preview = await this.prisma.preview.update({
        where: { draftId },
        data: {
          stage: 'ready',
          coverKey: result.coverKey,
          pageKey: result.pageKey,
          coverText: result.coverText,
          pageText: result.pageText,
          manuscript: result.manuscript as unknown as Prisma.InputJsonValue,
          sceneKeys: result.sceneKeys as unknown as Prisma.InputJsonValue,
          imagesMock: result.imagesMock,
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
    if (!draft) throw new NotFoundException('Rascunho não encontrado');
    if (!draft.preview) {
      return {
        id: null,
        draftId: draft.id,
        stage: 'missing',
        coverUrl: null,
        pageUrl: null,
        coverText: null,
        pageText: null,
        pages: [],
        title: null,
        storyMode: draft.storyMode,
        imagesMock: false,
        error: null,
        updatedAt: null,
        startedAt: null,
        maxRegens: config.maxPreviewRegens,
      };
    }
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
    manuscript?: unknown;
    sceneKeys?: unknown;
    imagesMock?: boolean;
    error: string | null;
    createdAt: Date;
    updatedAt: Date;
  }) {
    const manuscript = preview.manuscript as { storyMode?: string; title?: string } | null;
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
      pages: await this.previewPages(preview.manuscript, preview.sceneKeys),
      title: manuscript?.title ?? null,
      storyMode: manuscript?.storyMode ?? null,
      imagesMock: Boolean(preview.imagesMock),
      error: preview.error,
      updatedAt: preview.updatedAt.toISOString(),
      startedAt: preview.createdAt.toISOString(),
      maxRegens: config.maxPreviewRegens,
    };
  }

  /** The cover and the pages that follow it, as the customer will see them in the book. */
  private async previewPages(stored: unknown, storedKeys: unknown): Promise<PageView[]> {
    const parsed = manuscriptSchema.safeParse(stored);
    const keys = (storedKeys as Record<string, string> | null) ?? {};
    if (!parsed.success) return [];
    const pages: PageView[] = [];
    for (const index of PREVIEW_PAGES) {
      const page = parsed.data.pages.find((item) => item.index === index);
      const key = keys[pageSceneKey(index)];
      if (!page || !key) continue;
      pages.push({
        index,
        url: await this.storage.getSignedGetUrl(key),
        text: page.text,
        dialogue: page.dialogue,
        layout: page.layout,
        textZone: page.visual.textZone,
      });
    }
    return pages;
  }
}
