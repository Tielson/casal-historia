import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { draftPatchSchema, type DraftPatch } from '@entre-nos/shared';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';

@Injectable()
export class DraftsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  async create(clientId?: string) {
    return this.prisma.draft.create({
      data: {
        clientId: clientId ?? null,
        step: 'occasion',
        status: 'draft',
      },
    });
  }

  async findByToken(token: string) {
    const draft = await this.prisma.draft.findUnique({
      where: { token },
      include: { preview: true, order: true },
    });
    if (!draft) throw new NotFoundException('Rascunho não encontrado');
    return draft;
  }

  async patch(token: string, body: unknown) {
    const parsed = draftPatchSchema.parse(body) as DraftPatch;
    const draft = await this.findByToken(token);

    const data: Prisma.DraftUpdateInput = {};
    if (parsed.step) data.step = parsed.step;
    if (parsed.occasion) data.occasion = parsed.occasion;
    if (parsed.styleId) data.styleId = parsed.styleId;
    if (parsed.email !== undefined) data.email = parsed.email;
    if (parsed.couple) {
      if (parsed.couple.nameA !== undefined) data.nameA = parsed.couple.nameA;
      if (parsed.couple.nameB !== undefined) data.nameB = parsed.couple.nameB;
      if (parsed.couple.photoAKey !== undefined) data.photoAKey = parsed.couple.photoAKey;
      if (parsed.couple.photoBKey !== undefined) data.photoBKey = parsed.couple.photoBKey;
      if (parsed.couple.photoTogetherKey !== undefined) {
        data.photoTogetherKey = parsed.couple.photoTogetherKey ?? null;
      }
      if (parsed.couple.startDate !== undefined) {
        data.startDate = parsed.couple.startDate || null;
      }
      if (parsed.couple.photoConsent !== undefined) {
        data.photoConsent = Boolean(parsed.couple.photoConsent);
      }
    }
    if (parsed.memories) {
      if (parsed.memories.answers) data.memoriesAnswers = parsed.memories.answers;
      if (parsed.memories.dedication !== undefined) {
        data.dedication = parsed.memories.dedication ?? null;
      }
    }

    return this.prisma.draft.update({
      where: { id: draft.id },
      data,
      include: { preview: true, order: true },
    });
  }

  async toPublic(draft: Awaited<ReturnType<typeof this.findByToken>>) {
    const sign = async (key?: string | null) =>
      key ? this.storage.getSignedGetUrl(key) : null;

    return {
      id: draft.id,
      token: draft.token,
      step: draft.step,
      status: draft.status,
      occasion: draft.occasion,
      couple: {
        nameA: draft.nameA,
        nameB: draft.nameB,
        photoAKey: draft.photoAKey,
        photoBKey: draft.photoBKey,
        photoTogetherKey: draft.photoTogetherKey,
        photoAUrl: await sign(draft.photoAKey),
        photoBUrl: await sign(draft.photoBKey),
        photoTogetherUrl: await sign(draft.photoTogetherKey),
        startDate: draft.startDate,
        photoConsent: draft.photoConsent,
      },
      styleId: draft.styleId,
      memories: {
        answers: (draft.memoriesAnswers as Record<string, string> | null) ?? {},
        dedication: draft.dedication,
      },
      email: draft.email,
      previewRegenCount: draft.previewRegenCount,
      previewApproved: draft.previewApproved,
      orderId: draft.order?.id ?? null,
      manageToken: draft.order?.manageToken ?? null,
      giftToken: draft.order?.giftToken ?? null,
      createdAt: draft.createdAt.toISOString(),
      updatedAt: draft.updatedAt.toISOString(),
    };
  }
}
