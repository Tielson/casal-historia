import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { pageSceneKey } from '@entre-nos/shared';
import { PDF_LAYOUT, measurePage } from './pdf-layout';
import { renderBook } from './pdf.service';
import { composeLocalManuscript } from '../generation/local-author';
import { renderMockScene } from '../generation/scene-images';

const book = composeLocalManuscript({
  nameA: 'Ana',
  nameB: 'Leo',
  styleId: 'desenho',
  occasion: 'namoro',
  storyMode: 'inspired',
  answers: {
    como_conheceram: 'Nos conhecemos adolescentes e nada aconteceu naquele momento',
    momento_especial: 'Pagode juntos, ficamos de love lá',
    o_que_ama: 'Jeito dela',
  },
});

describe('page layout', () => {
  it('keeps every text block inside its zone and inside the page', () => {
    for (const page of book.pages) {
      const measure = measurePage(page, page.role === 'cover' ? book.title : '');
      const { x, y, w, h } = measure.box;
      assert.equal(measure.fits, true, `página ${page.index} não cabe`);
      assert.ok(x >= PDF_LAYOUT.margin - 0.01 && x + w <= PDF_LAYOUT.pageWidth - PDF_LAYOUT.margin + 0.01);
      assert.ok(y >= PDF_LAYOUT.margin - 0.01 && y + h <= PDF_LAYOUT.pageHeight - PDF_LAYOUT.margin + 0.01);
      if (page.visual.textZone === 'top') assert.ok(y + h < PDF_LAYOUT.pageHeight / 2);
      if (page.visual.textZone === 'bottom') assert.ok(y > PDF_LAYOUT.pageHeight / 2);
      if (page.visual.textZone === 'left') assert.ok(x + w < PDF_LAYOUT.pageWidth / 2);
      if (page.visual.textZone === 'right') assert.ok(x > PDF_LAYOUT.pageWidth / 2);
    }
  });

  it('has no title on interior pages and sets impact lines large', () => {
    for (const page of book.pages.filter((item) => item.role !== 'cover')) {
      const measure = measurePage(page);
      assert.equal(measure.runs.some((run) => run.kind === 'title'), false);
      if (page.layout === 'impact') {
        assert.equal(measure.runs[0].size, PDF_LAYOUT.impactSize);
      } else {
        assert.equal(measure.runs[0].size, PDF_LAYOUT.bodySize);
      }
    }
    const cover = measurePage(book.pages[0], book.title);
    assert.equal(cover.runs[0].kind, 'title');
  });

  it('rejects a page that would overflow its zone', () => {
    const page = book.pages.find((item) => item.role === 'story' && item.layout === 'scene');
    assert.ok(page);
    const long = { ...page, text: `${page.text} `.repeat(4) };
    assert.equal(measurePage(long).fits, false);
  });
});

describe('pdf', () => {
  it('builds 12 full-bleed 3:4 pages, each with its own illustration', async () => {
    const objects = new Map<string, Buffer>();
    for (const page of book.pages) {
      objects.set(pageSceneKey(page.index), await renderMockScene('desenho', page));
    }
    const loaded: string[] = [];
    const file = await renderBook(
      {
        title: book.title,
        styleId: 'desenho',
        pages: book.pages.map((page) => ({ page, imageKey: pageSceneKey(page.index) })),
      },
      async (key) => {
        loaded.push(key);
        const found = objects.get(key);
        if (!found) throw new Error(`missing ${key}`);
        return found;
      },
    );
    const raw = file.toString('latin1');
    assert.equal(raw.match(/\/Type\s*\/Page(?!s)/g)?.length ?? 0, 12);
    const boxes = [...raw.matchAll(/\/MediaBox\s*\[\s*0 0 ([\d.]+) ([\d.]+)\s*\]/g)];
    assert.equal(boxes.length, 12);
    for (const [, width, height] of boxes) {
      assert.equal(Number(width), PDF_LAYOUT.pageWidth);
      assert.equal(Number(height), PDF_LAYOUT.pageHeight);
    }
    assert.equal(new Set(loaded).size, 12);
    assert.match(raw, /Lora/);
  });
});
