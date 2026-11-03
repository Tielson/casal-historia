import PDFDocument from 'pdfkit';
import type { BookPage, TextZone } from '@entre-nos/shared';

/**
 * 3:4 page (21 × 28 cm). The illustration bleeds to every edge and the text sits
 * on the calm part of the scene that the storyboard reserved for it.
 */
export const PDF_LAYOUT = {
  pageWidth: 595.28,
  pageHeight: 793.7,
  margin: 44,
  bodySize: 15,
  bodyLineGap: 6,
  paragraphGap: 8,
  dialogueSize: 15,
  dialogueGap: 7,
  impactSize: 24,
  impactLineGap: 6,
  coverTitleSize: 38,
  coverBodySize: 16,
  blockGap: 12,
  ornamentHeight: 12,
  /** Height share a top or bottom block may take. */
  bandMax: 0.34,
  /** Width share and height share of a side block. */
  sideWidth: 0.44,
  sideMax: 0.62,
  /** How far the legibility veil fades past the text. */
  veil: 64,
  paper: '#fbf4ef',
  ink: '#2b1d22',
  night: '#16131c',
  nightInk: '#fbf4ef',
  accent: '#e07a8c',
};

export interface BookFonts {
  body: string;
  italic: string;
  title: string;
}

const FALLBACK_FONTS: BookFonts = { body: 'Times-Roman', italic: 'Times-Italic', title: 'Times-Bold' };

const FONT_FILES: BookFonts = {
  body: '@fontsource/lora/files/lora-latin-400-normal.woff',
  italic: '@fontsource/lora/files/lora-latin-400-italic.woff',
  title: '@fontsource/lora/files/lora-latin-600-normal.woff',
};

let fontPaths: BookFonts | null | undefined;

function resolveFontPaths(): BookFonts | null {
  if (fontPaths !== undefined) return fontPaths;
  try {
    fontPaths = {
      body: require.resolve(FONT_FILES.body),
      italic: require.resolve(FONT_FILES.italic),
      title: require.resolve(FONT_FILES.title),
    };
  } catch {
    fontPaths = null;
  }
  return fontPaths;
}

/** Embeds the book serif in this document, or falls back to the built-in Times. */
export function useBookFonts(doc: PDFKit.PDFDocument): BookFonts {
  const paths = resolveFontPaths();
  if (!paths) return FALLBACK_FONTS;
  try {
    doc.registerFont('BookBody', paths.body);
    doc.registerFont('BookItalic', paths.italic);
    doc.registerFont('BookTitle', paths.title);
    return { body: 'BookBody', italic: 'BookItalic', title: 'BookTitle' };
  } catch {
    return FALLBACK_FONTS;
  }
}

export interface TextRun {
  kind: 'title' | 'body' | 'line' | 'impact';
  text: string;
  font: string;
  size: number;
  options: PDFKit.Mixins.TextOptions;
  /** Offset from the top of the block. */
  y: number;
  height: number;
}

export interface PageMeasure {
  zone: TextZone;
  box: { x: number; y: number; w: number; h: number };
  runs: TextRun[];
  /** Room for the heart under the cover title and after the closing text. */
  ornament: boolean;
  fits: boolean;
}

export type LayoutPage = Pick<BookPage, 'index' | 'role' | 'layout' | 'text' | 'dialogue'> & {
  visual: Pick<BookPage['visual'], 'textZone'>;
};

let ruler: PDFKit.PDFDocument | null = null;
let rulerFonts: BookFonts | null = null;

function zoneFrame(zone: TextZone): { x: number; w: number; maxH: number } {
  const { pageWidth, pageHeight, margin, sideWidth, sideMax, bandMax } = PDF_LAYOUT;
  if (zone === 'left') return { x: margin, w: pageWidth * sideWidth - margin, maxH: pageHeight * sideMax };
  if (zone === 'right') {
    return { x: pageWidth * (1 - sideWidth), w: pageWidth * sideWidth - margin, maxH: pageHeight * sideMax };
  }
  return { x: margin, w: pageWidth - margin * 2, maxH: pageHeight * bandMax - margin };
}

function zoneTop(zone: TextZone, height: number): number {
  const { pageHeight, margin } = PDF_LAYOUT;
  if (zone === 'top') return margin;
  if (zone === 'bottom') return pageHeight - margin - height;
  return (pageHeight - height) / 2;
}

/** Lays out the page text inside its zone. Measuring and drawing share it. */
export function measurePage(
  page: LayoutPage,
  title = '',
  doc?: PDFKit.PDFDocument,
  fonts?: BookFonts,
): PageMeasure {
  let measurer = doc;
  let faces = fonts;
  if (!measurer) {
    ruler ??= new PDFDocument({ size: [PDF_LAYOUT.pageWidth, PDF_LAYOUT.pageHeight], margin: 0 });
    rulerFonts ??= useBookFonts(ruler);
    measurer = ruler;
    faces = rulerFonts;
  }
  const face = faces ?? FALLBACK_FONTS;
  const zone = page.visual.textZone;
  const frame = zoneFrame(zone);
  const side = zone === 'left' || zone === 'right';
  const align = side ? 'left' : 'center';
  const runs: TextRun[] = [];
  let y = 0;

  const push = (kind: TextRun['kind'], text: string, font: string, size: number, options: PDFKit.Mixins.TextOptions) => {
    if (runs.length) y += kind === 'line' ? PDF_LAYOUT.dialogueGap : PDF_LAYOUT.blockGap;
    measurer.font(font).fontSize(size);
    const full = { width: frame.w, ...options };
    const height = measurer.heightOfString(text, full);
    runs.push({ kind, text, font, size, options: full, y, height });
    y += height;
  };

  const ornament = page.role === 'cover' || page.role === 'closing';
  if (page.role === 'cover') {
    if (title.trim()) {
      push('title', title.trim(), face.title, PDF_LAYOUT.coverTitleSize, { align: 'center', lineGap: 2 });
      y += PDF_LAYOUT.ornamentHeight + PDF_LAYOUT.blockGap / 2;
    }
    push('body', page.text, face.italic, PDF_LAYOUT.coverBodySize, { align: 'center', lineGap: 4 });
  } else if (page.layout === 'impact') {
    push('impact', page.text, face.italic, PDF_LAYOUT.impactSize, {
      align,
      lineGap: PDF_LAYOUT.impactLineGap,
    });
  } else {
    push('body', page.text, face.body, PDF_LAYOUT.bodySize, {
      align: side ? 'left' : 'justify',
      lineGap: PDF_LAYOUT.bodyLineGap,
      paragraphGap: PDF_LAYOUT.paragraphGap,
    });
    if (page.layout === 'dialogue') {
      for (const line of page.dialogue ?? []) {
        push('line', line, face.italic, PDF_LAYOUT.dialogueSize, { align, lineGap: 4 });
      }
    }
  }
  if (page.role === 'closing') y += PDF_LAYOUT.blockGap + PDF_LAYOUT.ornamentHeight;

  const height = y;
  return {
    zone,
    box: { x: frame.x, y: zoneTop(zone, height), w: frame.w, h: height },
    runs,
    ornament,
    fits: height <= frame.maxH,
  };
}

export function textFits(page: LayoutPage, title = ''): boolean {
  return measurePage(page, title).fits;
}
