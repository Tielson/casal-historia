import { BadRequestException, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { DraftsService } from '../drafts/drafts.service';

const SLOT_TO_ROLE: Record<string, string> = {
  a: 'person_a',
  b: 'person_b',
  together: 'together',
  person_a: 'person_a',
  person_b: 'person_b',
};

const SLOT_TO_DRAFT_KEY: Record<string, 'photoAKey' | 'photoBKey' | 'photoTogetherKey'> = {
  a: 'photoAKey',
  person_a: 'photoAKey',
  b: 'photoBKey',
  person_b: 'photoBKey',
  together: 'photoTogetherKey',
};

@Injectable()
export class UploadsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly drafts: DraftsService,
  ) {}

  async uploadPhoto(opts: {
    token: string;
    slot: string;
    buffer: Buffer;
    mimeType: string;
  }) {
    const role = SLOT_TO_ROLE[opts.slot];
    const draftKey = SLOT_TO_DRAFT_KEY[opts.slot];
    if (!role || !draftKey) {
      throw new BadRequestException('slot inválido (a | b | together)');
    }
    if (!/^image\/(jpeg|png|webp)$/.test(opts.mimeType)) {
      throw new BadRequestException('Use JPG, PNG ou WebP');
    }
    if (opts.buffer.length > 8 * 1024 * 1024) {
      throw new BadRequestException('Arquivo acima de 8 MB');
    }

    const draft = await this.drafts.findByToken(opts.token);
    const key = `drafts/${draft.id}/${role}-${randomUUID()}`;
    await this.storage.putObject(key, opts.buffer, opts.mimeType);

    await this.prisma.photo.upsert({
      where: { draftId_role: { draftId: draft.id, role } },
      create: {
        draftId: draft.id,
        role,
        storageKey: key,
        mimeType: opts.mimeType,
      },
      update: {
        storageKey: key,
        mimeType: opts.mimeType,
      },
    });

    await this.prisma.draft.update({
      where: { id: draft.id },
      data: { [draftKey]: key },
    });

    const url = await this.storage.getSignedGetUrl(key);
    return { key, url };
  }

  async readLocal(key: string) {
    if (!key || key.includes('..')) {
      throw new BadRequestException('key inválida');
    }
    const body = await this.storage.getObject(key);
    return body;
  }
}
