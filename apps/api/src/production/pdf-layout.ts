import PDFDocument from 'pdfkit';

/**
 * A4 page with the illustration bleeding to every edge and the text on a paper
 * panel over the calm lower part of the image. The panel grows with the text.
 */
export const PDF_LAYOUT = {
  pageWidth: 595.28,
  pageHeight: 841.89,
  marginX: 52,
  padTop: 30,
  padBottom: 38,
  titleSize: 20,
  coverTitleSize: 30,
  bodySize: 12.5,
  coverBodySize: 14,
  bodyLineGap: 4,
  paragraphGap: 6,
  ornamentHeight: 14,
  ornamentGap: 8,
  fadeHeight: 70,
  panelMin: 0.26,
  panelMax: 0.5,
  paper: '#fbf4ef',
  ink: '#2b1d22',
  accent: '#e07a8c',
};

export interface PageMeasure {
  cover: boolean;
  titleSize: number;
  bodySize: number;
  titleHeight: number;
  bodyHeight: number;
  contentHeight: number;
  panelHeight: number;
  fits: boolean;
}

let ruler: PDFKit.PDFDocument | null = null;

export const textWidth = PDF_LAYOUT.pageWidth - PDF_LAYOUT.marginX * 2;

export const TITLE_FONT = 'Times-Bold';

export function bodyFont(cover: boolean) {
  return cover ? 'Times-Italic' : 'Times-Roman';
}

export function bodyOptions(cover: boolean): PDFKit.Mixins.TextOptions {
  return {
    width: textWidth,
    lineGap: PDF_LAYOUT.bodyLineGap,
    paragraphGap: PDF_LAYOUT.paragraphGap,
    align: cover ? 'center' : 'justify',
  };
}

export function titleOptions(): PDFKit.Mixins.TextOptions {
  return { width: textWidth, align: 'center', lineGap: 2 };
}

export function measurePage(
  page: { index: number; title: string; body: string },
  doc?: PDFKit.PDFDocument,
): PageMeasure {
  const measurer = doc ?? (ruler ??= new PDFDocument({ size: 'A4', margin: 0 }));
  const cover = page.index === 1;
  const titleSize = cover ? PDF_LAYOUT.coverTitleSize : PDF_LAYOUT.titleSize;
  const bodySize = cover ? PDF_LAYOUT.coverBodySize : PDF_LAYOUT.bodySize;
  measurer.font(TITLE_FONT).fontSize(titleSize);
  const titleHeight = measurer.heightOfString(page.title, titleOptions());
  measurer.font(bodyFont(cover)).fontSize(bodySize);
  const bodyHeight = measurer.heightOfString(page.body, bodyOptions(cover));
  const contentHeight =
    titleHeight + PDF_LAYOUT.ornamentGap * 2 + PDF_LAYOUT.ornamentHeight + bodyHeight;
  const natural = PDF_LAYOUT.padTop + contentHeight + PDF_LAYOUT.padBottom;
  const min = PDF_LAYOUT.pageHeight * PDF_LAYOUT.panelMin;
  const max = PDF_LAYOUT.pageHeight * PDF_LAYOUT.panelMax;
  return {
    cover,
    titleSize,
    bodySize,
    titleHeight,
    bodyHeight,
    contentHeight,
    panelHeight: Math.max(min, natural),
    fits: natural <= max,
  };
}

export function textFits(title: string, body: string, index = 2): boolean {
  return measurePage({ index, title, body }).fits;
}
