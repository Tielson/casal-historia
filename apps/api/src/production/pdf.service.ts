import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import { StorageService } from '../storage/storage.service';

@Injectable()
export class PdfService {
  constructor(private readonly storage: StorageService) {}

  async assemble(orderId: string, imageKeys: string[], title: string) {
    const doc = new PDFDocument({ size: 'A4', margin: 36 });
    const chunks: Buffer[] = [];
    doc.on('data', (c) => chunks.push(c as Buffer));

    const done = new Promise<Buffer>((resolve, reject) => {
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);
    });

    doc.fontSize(22).text('Entre Nós', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(14).fillColor('#444').text(title, { align: 'center' });
    doc.addPage();

    for (const key of imageKeys) {
      try {
        const buf = await this.storage.getObject(key);
        const pageWidth = doc.page.width - 72;
        const pageHeight = doc.page.height - 72;
        doc.image(buf, 36, 36, {
          fit: [pageWidth, pageHeight],
          align: 'center',
          valign: 'center',
        });
        doc.addPage();
      } catch {
        doc.fontSize(12).fillColor('#666').text(`[imagem indisponível: ${key}]`);
        doc.addPage();
      }
    }

    doc.end();
    const pdf = await done;
    const pdfKey = `orders/${orderId}/book.pdf`;
    await this.storage.putObject(pdfKey, pdf, 'application/pdf');
    return pdfKey;
  }
}
