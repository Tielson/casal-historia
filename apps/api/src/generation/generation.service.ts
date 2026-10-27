import { Injectable, Logger } from '@nestjs/common';
import sharp from 'sharp';
import { STYLES, MEMORY_QUESTIONS, BOOK_PAGE_COUNT } from '@entre-nos/shared';
import { config } from '../config';
import { StorageService } from '../storage/storage.service';

export interface BookInput {
  nameA: string;
  nameB: string;
  styleId: string;
  occasion?: string | null;
  startDate?: string | null;
  dedication?: string | null;
  answers: Record<string, string>;
}

@Injectable()
export class GenerationService {
  private readonly logger = new Logger(GenerationService.name);

  constructor(private readonly storage: StorageService) {}

  buildTexts(input: BookInput) {
    const style = STYLES.find((s) => s.id === input.styleId)?.name ?? 'nosso estilo';
    // Anti-invention: only use provided answers — never invent marriage/children/trips.
    const meet = input.answers.como_conheceram?.trim() || 'o início que vocês descreveram';
    const moment =
      input.answers.momento_especial?.trim() || 'o momento especial que vocês guardam';
    const love =
      input.answers.o_que_ama?.trim() || 'o que vocês mais valorizam um no outro';

    const coverText = `${input.nameA} & ${input.nameB}\nEntre Nós`;
    const pageText = [
      `No estilo ${style}, esta página abre com o começo: ${meet}.`,
      `Vocês guardam com carinho: ${moment}.`,
      `E o que sustenta o dia a dia: ${love}.`,
      input.dedication?.trim() ? `Dedicatória: ${input.dedication.trim()}` : null,
      input.startDate ? `Desde ${input.startDate}.` : null,
    ]
      .filter(Boolean)
      .join('\n\n');

    return { coverText, pageText };
  }

  async generatePreviewAssets(draftToken: string, input: BookInput) {
    const texts = this.buildTexts(input);
    const useMock = config.mockGeneration || !config.imageProviderApiKey;
    if (!useMock) {
      this.logger.warn(
        'Real image provider keys present but provider adapter is stub — using mock images',
      );
    }

    const cover = await this.mockImage(
      `${input.nameA} & ${input.nameB}`,
      'Capa — exemplo de prévia',
      input.styleId,
    );
    const page = await this.mockImage(
      'Página interna',
      texts.pageText.slice(0, 160),
      input.styleId,
    );
    const coverKey = `drafts/${draftToken}/preview/cover.jpg`;
    const pageKey = `drafts/${draftToken}/preview/page.jpg`;
    await this.storage.putObject(coverKey, cover, 'image/jpeg');
    await this.storage.putObject(pageKey, page, 'image/jpeg');
    return { ...texts, coverKey, pageKey, mock: true };
  }

  async generateRemainingPages(orderId: string, input: BookInput) {
    const pages: { index: number; key: string; text: string }[] = [];
    for (let i = 2; i < BOOK_PAGE_COUNT; i++) {
      const label = `Página ${i + 1}`;
      const q = MEMORY_QUESTIONS[i % MEMORY_QUESTIONS.length];
      const snippet = input.answers[q.id]?.trim() || q.label;
      const buf = await this.mockImage(label, snippet.slice(0, 140), input.styleId);
      const key = `orders/${orderId}/pages/page-${String(i + 1).padStart(2, '0')}.jpg`;
      await this.storage.putObject(key, buf, 'image/jpeg');
      pages.push({ index: i + 1, key, text: snippet });
    }
    return pages;
  }

  private async mockImage(title: string, subtitle: string, styleId: string) {
    const palette: Record<string, [string, string]> = {
      aquarela: ['#7ea8b8', '#f3efe6'],
      editorial: ['#2c3338', '#e7e2d8'],
      linha: ['#1d1d1d', '#f5f5f0'],
      filme: ['#6b4a35', '#efe0c8'],
      noturno: ['#1a2633', '#c9d6e2'],
      papel: ['#4a453d', '#ebe4d6'],
    };
    const [bg, fg] = palette[styleId] ?? ['#1a2633', '#e8eef2'];
    const safeTitle = escapeXml(title);
    const safeSub = escapeXml(subtitle);
    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1600" viewBox="0 0 1200 1600">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${bg}"/>
      <stop offset="100%" stop-color="#0f1216"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="1600" fill="url(#g)"/>
  <circle cx="980" cy="220" r="180" fill="${fg}" fill-opacity="0.08"/>
  <circle cx="180" cy="1320" r="260" fill="${fg}" fill-opacity="0.06"/>
  <text x="80" y="200" fill="${fg}" font-size="28" font-family="Georgia, serif" opacity="0.7">Entre Nós · exemplo</text>
  <text x="80" y="700" fill="${fg}" font-size="56" font-family="Georgia, serif">${safeTitle}</text>
  <text x="80" y="800" fill="${fg}" font-size="28" font-family="Georgia, serif" opacity="0.85">${safeSub}</text>
</svg>`;
    return sharp(Buffer.from(svg)).jpeg({ quality: 85 }).toBuffer();
  }
}

function escapeXml(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
