import sharp from 'sharp';
import type { BookPage, Manuscript, StyleId, TextZone } from '@entre-nos/shared';
import { config } from '../config';
import { buildScenePrompt, characterSheetPrompt } from './style-packs';
import type { AuthorInput } from './local-author';

/** Every page is a 3:4 portrait. The model draws 2:3 and we trim top and bottom. */
export const PAGE_IMAGE = { width: 1024, height: 1365 };

const PALETTE: Record<StyleId, [string, string, string]> = {
  desenho: ['#f4e9e4', '#3b3a4a', '#e07a8c'],
  caricatura: ['#fde7c8', '#2f3a56', '#f2795a'],
  animacao: ['#dfe9f5', '#33405a', '#f2a65a'],
  aquarela: ['#d7e4ea', '#5b6d78', '#c47b84'],
  quadrinhos: ['#fff4d6', '#1d1d1d', '#d9443c'],
  cinema: ['#3a3430', '#d8c3a5', '#f0b46a'],
};

export async function renderScene(input: {
  author: AuthorInput;
  manuscript: Manuscript;
  page: BookPage;
  /** Character sheet first, then the couple's photos. */
  references: Buffer[];
}): Promise<{ buffer: Buffer; placeholder: boolean }> {
  const { author, manuscript, page } = input;
  const prompt = buildScenePrompt({
    styleId: author.styleId,
    filmFinish: author.filmFinish,
    storyMode: author.storyMode,
    page,
    cast: manuscript.cast,
    phases: manuscript.phases,
    names: { nameA: author.nameA, nameB: author.nameB },
    hasTogether: Boolean(author.photoTogetherKey),
  });
  if (config.mockGeneration) {
    return { buffer: await renderMockScene(author.styleId, page), placeholder: true };
  }
  if (input.references.length < 3) {
    throw new Error('Faltam a referência dos personagens e as fotos do casal.');
  }
  const raw = await generateWithOpenAI({ prompt, references: input.references, size: '1024x1536' });
  return { buffer: await toPagePortrait(raw), placeholder: false };
}

/** Both characters in the chosen style, drawn once from the photos and reused by every page. */
export async function renderCharacterSheet(input: {
  author: AuthorInput;
  manuscript: Manuscript;
  photos: Buffer[];
}): Promise<{ buffer: Buffer; placeholder: boolean }> {
  const { author } = input;
  const prompt = characterSheetPrompt({
    styleId: author.styleId,
    filmFinish: author.filmFinish,
    cast: input.manuscript.cast,
    names: { nameA: author.nameA, nameB: author.nameB },
    hasTogether: Boolean(author.photoTogetherKey),
  });
  if (config.mockGeneration) {
    return { buffer: await renderMockSheet(author.styleId), placeholder: true };
  }
  if (input.photos.length < 2) {
    throw new Error('Foto de referência ausente para ilustrar o casal.');
  }
  const buffer = await generateWithOpenAI({ prompt, references: input.photos, size: '1536x1024' });
  return { buffer, placeholder: false };
}

export async function toPagePortrait(image: Buffer): Promise<Buffer> {
  return sharp(image)
    .resize(PAGE_IMAGE.width, PAGE_IMAGE.height, { fit: 'cover', position: 'centre' })
    .jpeg({ quality: 90 })
    .toBuffer();
}

async function generateWithOpenAI(input: {
  prompt: string;
  references: Buffer[];
  size: '1024x1536' | '1536x1024';
}): Promise<Buffer> {
  const key = config.openaiApiKey || config.imageProviderApiKey;
  if (!key) {
    throw new Error('Geração de imagem indisponível: falta OPENAI_API_KEY.');
  }
  const form = new FormData();
  form.append('model', config.imageModel);
  form.append('prompt', input.prompt);
  form.append('size', input.size);
  form.append('quality', 'medium');
  form.append('output_format', 'jpeg');
  const references = await Promise.all(input.references.slice(0, 4).map((photo) => referenceJpeg(photo)));
  references.forEach((photo, index) => {
    form.append(
      'image[]',
      new Blob([new Uint8Array(photo)], { type: 'image/jpeg' }),
      `ref-${index}.jpg`,
    );
  });
  const response = await fetch('https://api.openai.com/v1/images/edits', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}` },
    body: form,
    signal: AbortSignal.timeout(180_000),
  });
  const payload = (await response.json()) as {
    error?: { message?: string };
    data?: { b64_json?: string }[];
  };
  if (!response.ok) {
    throw new Error(payload.error?.message ?? `A ilustração falhou (${response.status}).`);
  }
  const b64 = payload.data?.[0]?.b64_json;
  if (!b64) throw new Error('A ilustração voltou vazia.');
  return Buffer.from(b64, 'base64');
}

const ZONE_RECT: Record<TextZone, { x: number; y: number; w: number; h: number }> = {
  top: { x: 0, y: 0, w: PAGE_IMAGE.width, h: Math.round(PAGE_IMAGE.height * 0.3) },
  bottom: { x: 0, y: Math.round(PAGE_IMAGE.height * 0.7), w: PAGE_IMAGE.width, h: Math.round(PAGE_IMAGE.height * 0.3) },
  left: { x: 0, y: 0, w: Math.round(PAGE_IMAGE.width * 0.42), h: PAGE_IMAGE.height },
  right: { x: Math.round(PAGE_IMAGE.width * 0.58), y: 0, w: Math.round(PAGE_IMAGE.width * 0.42), h: PAGE_IMAGE.height },
};

/**
 * Local stand-in without letters. Figures sit away from the text zone, which is
 * painted lighter so the layout can be checked without a real illustration.
 */
export async function renderMockScene(styleId: string, page: Pick<BookPage, 'index' | 'visual'>): Promise<Buffer> {
  const [paper, ink, accent] = PALETTE[styleId as StyleId] ?? PALETTE.desenho;
  const { width, height } = PAGE_IMAGE;
  const zone = ZONE_RECT[page.visual.textZone];
  const cx = page.visual.textZone === 'left' ? width * 0.72 : page.visual.textZone === 'right' ? width * 0.28 : width / 2;
  const cy = page.visual.textZone === 'top' ? height * 0.66 : page.visual.textZone === 'bottom' ? height * 0.4 : height / 2;
  const shift = ((page.index * 37) % 120) - 60;
  const people =
    page.visual.staging === 'detail'
      ? `<circle cx="${cx}" cy="${cy}" r="120" fill="${accent}" opacity="0.85"/>`
      : page.visual.staging === 'solo_a' || page.visual.staging === 'solo_b'
        ? figure(cx + shift / 2, cy, ink, accent)
        : figure(cx - 110 + shift / 3, cy, ink, accent) + figure(cx + 110 + shift / 3, cy + 20, ink, accent);
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="${width}" height="${height}" fill="${paper}"/>
  <circle cx="${(page.index * 151) % width}" cy="${(page.index * 89) % height}" r="260" fill="${accent}" opacity="0.18"/>
  ${people}
  <rect x="${zone.x}" y="${zone.y}" width="${zone.w}" height="${zone.h}" fill="#ffffff" opacity="0.35"/>
</svg>`;
  return sharp(Buffer.from(svg)).jpeg({ quality: 82 }).toBuffer();
}

function figure(x: number, y: number, ink: string, accent: string): string {
  return `<ellipse cx="${x}" cy="${y + 170}" rx="95" ry="190" fill="${ink}" opacity="0.8"/>
  <circle cx="${x}" cy="${y - 60}" r="62" fill="${accent}"/>`;
}

async function renderMockSheet(styleId: string): Promise<Buffer> {
  const [paper, ink, accent] = PALETTE[styleId as StyleId] ?? PALETTE.desenho;
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1536" height="1024" viewBox="0 0 1536 1024">
  <rect width="1536" height="1024" fill="${paper}"/>
  ${[300, 600, 936, 1236].map((x) => figure(x, 420, ink, accent)).join('\n  ')}
</svg>`;
  return sharp(Buffer.from(svg)).jpeg({ quality: 82 }).toBuffer();
}

async function referenceJpeg(photo: Buffer): Promise<Buffer> {
  return sharp(photo)
    .rotate()
    .resize({ width: 1536, height: 1536, fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 88 })
    .toBuffer();
}
