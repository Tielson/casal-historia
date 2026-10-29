import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import { StorageService } from '../storage/storage.service';
import {
  PDF_LAYOUT,
  TITLE_FONT,
  bodyFont,
  bodyOptions,
  measurePage,
  titleOptions,
} from './pdf-layout';

export interface PdfPage {
  index: number;
  title: string;
  body: string;
  imageKey: string;
}

const HEART =
  'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z';

@Injectable()
export class PdfService {
  constructor(private readonly storage: StorageService) {}

  async assemble(orderId: string, pages: PdfPage[]) {
    if (pages.length !== 12) {
      throw new Error('O livro precisa de 12 páginas com texto e ilustração.');
    }

    const doc = new PDFDocument({ size: 'A4', margin: 0, autoFirstPage: false });
    const chunks: Buffer[] = [];
    doc.on('data', (chunk) => chunks.push(chunk as Buffer));
    const done = new Promise<Buffer>((resolve, reject) => {
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);
    });

    const { pageWidth: width, pageHeight: height, marginX, paper, ink, accent } = PDF_LAYOUT;
    for (const page of pages) {
      doc.addPage({ size: 'A4', margin: 0 });
      const measure = measurePage(page, doc);
      if (!measure.fits) throw new Error(`Texto cortado na página ${page.index}.`);

      const image = await this.storage.getObject(page.imageKey);
      doc.image(image, 0, 0, { cover: [width, height], align: 'center' });

      const panelTop = height - measure.panelHeight;
      const fadeTop = panelTop - PDF_LAYOUT.fadeHeight;
      const fade = doc.linearGradient(0, fadeTop, 0, panelTop);
      fade.stop(0, paper, 0).stop(1, paper, 0.95);
      doc.rect(0, fadeTop, width, PDF_LAYOUT.fadeHeight).fill(fade);
      doc.save().fillOpacity(0.95).rect(0, panelTop, width, measure.panelHeight).fill(paper).restore();

      const slack =
        measure.panelHeight - PDF_LAYOUT.padTop - PDF_LAYOUT.padBottom - measure.contentHeight;
      let y = panelTop + PDF_LAYOUT.padTop + slack / 2;

      doc.fillColor(ink).font(TITLE_FONT).fontSize(measure.titleSize);
      doc.text(page.title, marginX, y, titleOptions());
      y += measure.titleHeight + PDF_LAYOUT.ornamentGap;

      drawOrnament(doc, width / 2, y + PDF_LAYOUT.ornamentHeight / 2, accent);
      y += PDF_LAYOUT.ornamentHeight + PDF_LAYOUT.ornamentGap;

      doc.fillColor(ink).font(bodyFont(measure.cover)).fontSize(measure.bodySize);
      doc.text(page.body, marginX, y, bodyOptions(measure.cover));
    }

    doc.end();
    const pdf = await done;
    const pdfKey = `orders/${orderId}/book.pdf`;
    await this.storage.putObject(pdfKey, pdf, 'application/pdf');
    return pdfKey;
  }
}

function drawOrnament(doc: PDFKit.PDFDocument, cx: number, cy: number, color: string) {
  const size = PDF_LAYOUT.ornamentHeight;
  doc
    .save()
    .lineWidth(0.7)
    .strokeColor(color)
    .moveTo(cx - 54, cy)
    .lineTo(cx - size, cy)
    .moveTo(cx + size, cy)
    .lineTo(cx + 54, cy)
    .stroke()
    .restore();
  doc
    .save()
    .translate(cx - size / 2, cy - size / 2)
    .scale(size / 24)
    .path(HEART)
    .fill(color)
    .restore();
}
