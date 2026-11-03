import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { STYLES } from '@entre-nos/shared';
import { composeLocalManuscript } from './local-author';
import { STYLE_PACKS, buildScenePrompt, characterSheetPrompt, type ScenePromptInput } from './style-packs';

const book = composeLocalManuscript({
  nameA: 'Filipe',
  nameB: 'Rebeca',
  styleId: 'desenho',
  occasion: 'namoro',
  storyMode: 'inspired',
  answers: {
    como_conheceram: 'Adolescentes, na praça de São José',
    momento_especial: 'O reencontro pelas redes, anos depois',
    o_que_ama: 'O jeito dela',
  },
});

function promptFor(index: number, extra: Partial<ScenePromptInput> = {}) {
  const page = book.pages.find((item) => item.index === index);
  assert.ok(page);
  return buildScenePrompt({
    styleId: 'desenho',
    storyMode: 'inspired',
    page,
    cast: book.cast,
    phases: book.phases,
    names: { nameA: 'Filipe', nameB: 'Rebeca' },
    hasTogether: false,
    ...extra,
  });
}

describe('style packs', () => {
  it('has a distinct visual language for each of the six styles', () => {
    assert.deepEqual(Object.keys(STYLE_PACKS).sort(), STYLES.map((style) => style.id).sort());
    assert.equal(new Set(Object.values(STYLE_PACKS).map((pack) => pack.positive)).size, STYLES.length);
  });

  it('adds the old-film finish on top of any style only when asked', () => {
    const plain = promptFor(5, { styleId: 'animacao' });
    const film = promptFor(5, { styleId: 'animacao', filmFinish: true });
    assert.doesNotMatch(plain, /film grain/i);
    assert.match(film, /film grain/i);
    assert.match(film, /vignette/i);
    assert.match(film, /3D animated/);
  });
});

describe('scene prompt', () => {
  it('draws the teenage pages with their age and no romance', () => {
    const prompt = promptFor(2);
    assert.match(prompt, /15 a 17 anos/);
    assert.match(prompt, /teenagers/i);
    assert.match(prompt, /no romantic physical contact/i);
  });

  it('keeps the couple apart when the story is apart', () => {
    const apart = book.pages.find((page) => page.visual.staging === 'apart');
    assert.ok(apart);
    assert.match(promptFor(apart.index), /alone in their own/);
    const solo = book.pages.find((page) => page.visual.staging === 'solo_a');
    assert.ok(solo);
    assert.match(promptFor(solo.index), /Only Filipe appears/);
  });

  it('reserves the text area chosen by the storyboard and asks for full bleed', () => {
    const left = book.pages.find((page) => page.visual.textZone === 'left');
    assert.ok(left);
    const prompt = promptFor(left.index);
    assert.match(prompt, /left 42%/);
    assert.match(prompt, /Full-bleed/);
    assert.match(prompt, /no text/i);
    assert.doesNotMatch(prompt, /lower 40%/);
  });

  it('frames the scene by shot type', () => {
    const detail = book.pages.find((page) => page.visual.shot === 'detail');
    const wide = book.pages.find((page) => page.visual.shot === 'wide');
    assert.ok(detail && wide);
    assert.match(promptFor(detail.index), /detail close-up/);
    assert.match(promptFor(wide.index), /wide establishing shot/);
  });

  it('lets an adventure travel but never invents a wedding or a baby', () => {
    assert.match(promptFor(5), /airplane cabin/);
    const adventure = promptFor(5, { storyMode: 'adventure' });
    assert.doesNotMatch(adventure, /airplane cabin/);
    assert.match(adventure, /wedding dress/);
    assert.match(adventure, /pregnancy, baby/);
  });

  it('keeps each skin tone on that person\'s photo even when the text names traits', () => {
    const scene = promptFor(5);
    const sheet = characterSheetPrompt({
      styleId: 'desenho',
      cast: book.cast,
      names: { nameA: 'Filipe', nameB: 'Rebeca' },
      hasTogether: false,
    });
    for (const prompt of [scene, sheet]) {
      assert.match(prompt, /Skin tone comes only from that person's photo/);
      assert.match(prompt, /If the text names a skin color, ignore it/);
      assert.match(prompt, /clothes and age only/);
    }
  });

  it('builds a character sheet in the chosen style', () => {
    const prompt = characterSheetPrompt({
      styleId: 'quadrinhos',
      cast: book.cast,
      names: { nameA: 'Filipe', nameB: 'Rebeca' },
      hasTogether: true,
    });
    assert.match(prompt, /Character reference sheet/);
    assert.match(prompt, /comic book/);
    assert.match(prompt, /third photo/);
  });
});
