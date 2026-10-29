import { Injectable, Logger } from '@nestjs/common';
import {
  BOOK_PAGE_COUNT,
  CAST_SCENE_KEY,
  OCCASIONS,
  PREVIEW_PAGES,
  pageSceneKey,
  type Manuscript,
  type StoryModeId,
} from '@entre-nos/shared';
import { config } from '../config';
import { StorageService } from '../storage/storage.service';
import { assessManuscript, DeliveryBlocked } from './book-quality';
import { authorWithClaude } from './claude-author';
import { composeLocalManuscript, type AuthorInput } from './local-author';
import { authorWithOpenAI } from './openai-author';
import { renderCharacterSheet, renderScene } from './scene-images';

export interface BookInput extends AuthorInput {
  storyMode: StoryModeId;
}

export interface PreviewAssets {
  manuscript: Manuscript;
  sceneKeys: Record<string, string>;
  coverKey: string;
  pageKey: string;
  coverText: string;
  pageText: string;
  imagesMock: boolean;
}

@Injectable()
export class GenerationService {
  private readonly logger = new Logger(GenerationService.name);

  constructor(private readonly storage: StorageService) {}

  async generatePreviewAssets(
    draftToken: string,
    input: BookInput,
    onStage?: (stage: 'writing' | 'illustrating' | 'layout') => Promise<void>,
  ): Promise<PreviewAssets> {
    await onStage?.('writing');
    const manuscript = await this.writeManuscript(input);
    const verdict = assessManuscript({
      pages: manuscript.pages,
      answers: input.answers,
      storyMode: input.storyMode,
      thread: manuscript.thread,
      phases: manuscript.phases,
    });
    if (!verdict.ok) throw new DeliveryBlocked(verdict.reasons);

    await onStage?.('illustrating');
    const { sceneKeys, imagesMock } = await this.illustrate({
      prefix: `drafts/${draftToken}/preview`,
      input,
      manuscript,
      existing: {},
      pages: [...PREVIEW_PAGES],
    });

    await onStage?.('layout');
    const second = manuscript.pages.find((page) => page.index === 2);
    if (!second) throw new DeliveryBlocked(['História incompleta: falta a primeira cena.']);
    const occasion = OCCASIONS.find((item) => item.id === input.occasion)?.label;
    this.logger.log(
      `Prévia de ${draftToken} escrita no modo ${input.storyMode}${imagesMock ? ' (ilustração local)' : ''}`,
    );
    return {
      manuscript,
      sceneKeys,
      coverKey: sceneKeys[pageSceneKey(1)],
      pageKey: sceneKeys[pageSceneKey(2)],
      coverText: [manuscript.title, `${input.nameA} & ${input.nameB}`, occasion]
        .filter(Boolean)
        .join('\n'),
      pageText: second.text,
      imagesMock,
    };
  }

  /** Draws the pages the preview did not show, from the same character sheet. */
  async generateRemainingScenes(
    orderId: string,
    input: BookInput,
    manuscript: Manuscript,
    existing: Record<string, string>,
  ): Promise<{ sceneKeys: Record<string, string>; imagesMock: boolean }> {
    const pages = Array.from({ length: BOOK_PAGE_COUNT }, (_, offset) => offset + 1);
    const result = await this.illustrate({
      prefix: `orders/${orderId}/scenes`,
      input,
      manuscript,
      existing,
      pages,
    });
    return { sceneKeys: result.sceneKeys, imagesMock: config.mockGeneration || result.imagesMock };
  }

  private async illustrate(input: {
    prefix: string;
    input: BookInput;
    manuscript: Manuscript;
    existing: Record<string, string>;
    pages: number[];
  }): Promise<{ sceneKeys: Record<string, string>; imagesMock: boolean }> {
    const author = input.input;
    const photos = await this.loadPhotos(author);
    const sceneKeys = { ...input.existing };
    let imagesMock = false;
    const accept = (placeholder: boolean) => {
      if (!config.mockGeneration && placeholder) {
        throw new DeliveryBlocked(['Geração de imagem substituída por fundo decorativo.']);
      }
      imagesMock = imagesMock || placeholder;
    };

    let sheet: Buffer;
    if (sceneKeys[CAST_SCENE_KEY]) {
      sheet = await this.storage.getObject(sceneKeys[CAST_SCENE_KEY]);
    } else {
      const rendered = await renderCharacterSheet({ author, manuscript: input.manuscript, photos });
      accept(rendered.placeholder);
      sheet = rendered.buffer;
      const key = `${input.prefix}/${CAST_SCENE_KEY}.jpg`;
      await this.storage.putObject(key, sheet, 'image/jpeg');
      sceneKeys[CAST_SCENE_KEY] = key;
    }

    for (const index of input.pages) {
      const id = pageSceneKey(index);
      if (sceneKeys[id]) continue;
      const page = input.manuscript.pages.find((item) => item.index === index);
      if (!page) throw new DeliveryBlocked([`História incompleta: falta a página ${index}.`]);
      const rendered = await renderScene({
        author,
        manuscript: input.manuscript,
        page,
        references: [sheet, ...photos],
      });
      accept(rendered.placeholder);
      const key = `${input.prefix}/${id}.jpg`;
      await this.storage.putObject(key, rendered.buffer, 'image/jpeg');
      sceneKeys[id] = key;
    }
    return { sceneKeys, imagesMock };
  }

  private async writeManuscript(input: BookInput): Promise<Manuscript> {
    if (config.mockGeneration) return composeLocalManuscript(input);
    if (config.openaiApiKey) return authorWithOpenAI(input);
    return authorWithClaude(input);
  }

  private async loadPhotos(input: BookInput): Promise<Buffer[]> {
    if (config.mockGeneration) return [];
    const keys = [input.photoAKey, input.photoBKey, input.photoTogetherKey].filter(
      (key): key is string => Boolean(key),
    );
    if (keys.length < 2) {
      throw new DeliveryBlocked(['Foto de referência ausente para ilustrar o casal.']);
    }
    const photos: Buffer[] = [];
    for (const key of keys) {
      photos.push(await this.storage.getObject(key));
    }
    return photos;
  }
}
