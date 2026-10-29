import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { inflateSync } from 'node:zlib';
import sharp from 'sharp';
import { PdfService } from './pdf.service';
import type { StorageService } from '../storage/storage.service';
import { composeLocalManuscript } from '../generation/local-author';

describe('pdf layout', () => {
  it('builds 12 pages with selectable text and no trailing blank page', async () => {
    const book = composeLocalManuscript({
      nameA: 'Ana',
      nameB: 'Leo',
      styleId: 'filme',
      occasion: 'namoro',
      storyMode: 'inspired',
      answers: {
        como_conheceram: 'Nos conhecemos adolescentes e nada aconteceu naquele momento',
        momento_especial: 'Pagode juntos, ficamos de love lá',
        o_que_ama: 'Jeito dela',
      },
    });
    const jpeg = await sharp({
      create: { width: 80, height: 120, channels: 3, background: '#e7c8a4' },
    })
      .jpeg()
      .toBuffer();
    const objects = new Map<string, Buffer>();
    for (const scene of book.scenes) {
      objects.set(`scenes/${scene.id}.jpg`, jpeg);
    }
    const storage = {
      async getObject(key: string) {
        const found = objects.get(key);
        if (!found) throw new Error(`missing ${key}`);
        return found;
      },
      async putObject(key: string, body: Buffer) {
        objects.set(key, body);
        return key;
      },
    };
    const pdf = new PdfService(storage as unknown as StorageService);
    const pdfKey = await pdf.assemble(
      'order-1',
      book.pages.map((page) => ({
        index: page.index,
        title: page.title,
        body: page.body,
        imageKey: `scenes/${page.sceneId}.jpg`,
      })),
    );
    const file = objects.get(pdfKey);
    assert.ok(file);
    const raw = file.toString('latin1');
    const pageCount = raw.match(/\/Type\s*\/Page(?!s)/g)?.length ?? 0;
    assert.equal(pageCount, 12);
    const text = inflatePdfText(file);
    assert.match(text, /tempo/);
    assert.match(text, /pagode|adolescentes|jeito/i);
    assert.match(text, /Tj|TJ/);
  });
});

function inflatePdfText(file: Buffer): string {
  const source = file.toString('latin1');
  const parts: string[] = [];
  const streams = /stream\r?\n([\s\S]*?)endstream/g;
  for (const match of source.matchAll(streams)) {
    try {
      parts.push(inflateSync(Buffer.from(match[1], 'latin1')).toString('latin1'));
    } catch {
      // image streams are not flate text
    }
  }
  return parts
    .join('\n')
    .replace(/<([0-9a-fA-F]+)>/g, (_, hex: string) => Buffer.from(hex, 'hex').toString('latin1'));
}
