import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import sharp from 'sharp';
import { BOOK_PAGE_COUNT, type BookPage, type TextZone } from '@entre-nos/shared';
import { StorageService } from '../storage/storage.service';
import { PDF_LAYOUT, measurePage, useBookFonts, type PageMeasure } from './pdf-layout';

export interface PdfPage {
  page: BookPage;
  imageKey: string;
}

export interface PdfBook {
  title: string;
  styleId: string;
  pages: PdfPage[];
}

const HEART =
  'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z';

/** Below this mean luminance (0–255) the text zone is dark and gets light text. */
const DARK_ZONE = 110;

@Injectable()
export class PdfService {
  constructor(private readonly storage: StorageService) {}

  async assemble(orderId: string, book: PdfBook) {
    const pdf = await renderBook(book, (key) => this.storage.getObject(key));
    const pdfKey = `orders/${orderId}/book.pdf`;
    await this.storage.putObject(pdfKey, pdf, 'application/pdf');
    return pdfKey;
  }
}

export async function renderBook(book: PdfBook, load: (key: string) => Promise<Buffer>): Promise<Buffer> {
  if (book.pages.length !== BOOK_PAGE_COUNT) {
    throw new Error(`O livro precisa de ${BOOK_PAGE_COUNT} páginas com texto e ilustração.`);
  }
  const { pageWidth: width, pageHeight: height } = PDF_LAYOUT;
  const doc = new PDFDocument({ size: [width, height], margin: 0, autoFirstPage: false });
  const fonts = useBookFonts(doc);
  const chunks: Buffer[] = [];
  doc.on('data', (chunk) => chunks.push(chunk as Buffer));
  const done = new Promise<Buffer>((resolve, reject) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
  });

  for (const { page, imageKey } of [...book.pages].sort((a, b) => a.page.index - b.page.index)) {
    doc.addPage({ size: [width, height], margin: 0 });
    const measure = measurePage(page, page.role === 'cover' ? book.title : '', doc, fonts);
    if (!measure.fits) throw new Error(`Texto cortado na página ${page.index}.`);

    const image = await load(imageKey);
    doc.image(image, 0, 0, { cover: [width, height], align: 'center', valign: 'center' });

    const dark = (await zoneLuminance(image, measure.zone)) < DARK_ZONE;
    const veil = dark ? PDF_LAYOUT.night : PDF_LAYOUT.paper;
    const ink = dark ? PDF_LAYOUT.nightInk : PDF_LAYOUT.ink;
    drawVeil(doc, measure, veil);

    const captions = book.styleId === 'quadrinhos';
    const { x, y } = measure.box;
    for (const run of measure.runs) {
      if (run.kind === 'line' && captions) drawCaption(doc, x, y + run.y, measure.box.w, run.height, veil, ink);
      doc.fillColor(ink).font(run.font).fontSize(run.size);
      doc.text(run.text, x, y + run.y, run.options);
      if (run.kind === 'title') {
        drawHeart(doc, width / 2, y + run.y + run.height + PDF_LAYOUT.ornamentHeight / 2 + 2);
      }
    }
    if (page.role === 'closing') {
      const center = measure.zone === 'left' || measure.zone === 'right' ? x + PDF_LAYOUT.ornamentHeight / 2 : x + measure.box.w / 2;
      drawHeart(doc, center, y + measure.box.h - PDF_LAYOUT.ornamentHeight / 2);
    }
  }

  doc.end();
  return done;
}

/** Mean luminance of the image area under the text, in the image's own pixels. */
async function zoneLuminance(image: Buffer, zone: TextZone): Promise<number> {
  try {
    const meta = await sharp(image).metadata();
    const w = meta.width ?? 0;
    const h = meta.height ?? 0;
    if (!w || !h) return 255;
    const band = Math.round(h * PDF_LAYOUT.bandMax);
    const side = Math.round(w * PDF_LAYOUT.sideWidth);
    const region =
      zone === 'top'
        ? { left: 0, top: 0, width: w, height: band }
        : zone === 'bottom'
          ? { left: 0, top: h - band, width: w, height: band }
          : zone === 'left'
            ? { left: 0, top: 0, width: side, height: h }
            : { left: w - side, top: 0, width: side, height: h };
    const { channels } = await sharp(image).extract(region).stats();
    const [r, g, b] = channels.length >= 3 ? channels : [channels[0], channels[0], channels[0]];
    return 0.2126 * r.mean + 0.7152 * g.mean + 0.0722 * b.mean;
  } catch {
    return 255;
  }
}

/**
 * A soft wash of paper (or night) color under the text that fades into the
 * illustration instead of a solid strip.
 */
function drawVeil(doc: PDFKit.PDFDocument, measure: PageMeasure, color: string) {
  const { pageWidth: width, pageHeight: height, margin, veil } = PDF_LAYOUT;
  const { box, zone } = measure;
  if (zone === 'top' || zone === 'bottom') {
    const solid = zone === 'top' ? box.y + box.h + margin / 2 : height - box.y + margin / 2;
    const reach = Math.min(height, solid + veil);
    const top = zone === 'top' ? 0 : height - reach;
    const gradient = zone === 'top' ? doc.linearGradient(0, 0, 0, reach) : doc.linearGradient(0, height, 0, top);
    gradient.stop(0, color, 0.9).stop(solid / reach, color, 0.78).stop(1, color, 0);
    doc.rect(0, top, width, reach).fill(gradient);
    return;
  }
  const cx = box.x + box.w / 2;
  const cy = box.y + box.h / 2;
  const rx = box.w / 2 + veil;
  const ry = box.h / 2 + veil;
  const radius = Math.max(rx, ry);
  doc.save();
  doc.translate(cx, cy).scale(rx / radius, ry / radius);
  const gradient = doc.radialGradient(0, 0, 0, 0, 0, radius);
  gradient.stop(0, color, 0.86).stop(0.68, color, 0.8).stop(1, color, 0);
  doc.circle(0, 0, radius).fill(gradient);
  doc.restore();
}

/** Comic captions: a framed box behind each spoken line. */
function drawCaption(
  doc: PDFKit.PDFDocument,
  x: number,
  y: number,
  w: number,
  h: number,
  fill: string,
  stroke: string,
) {
  doc.save().lineWidth(1.2).fillOpacity(0.94).rect(x - 8, y - 5, w + 16, h + 8).fillAndStroke(fill, stroke).restore();
}

function drawHeart(doc: PDFKit.PDFDocument, cx: number, cy: number) {
  const size = PDF_LAYOUT.ornamentHeight;
  doc
    .save()
    .translate(cx - size / 2, cy - size / 2)
    .scale(size / 24)
    .path(HEART)
    .fill(PDF_LAYOUT.accent)
    .restore();
}
