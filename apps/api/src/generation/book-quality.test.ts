import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { CAST_SCENE_KEY, memoriesSchema, pageSceneKey, type BookPage, type Manuscript } from '@entre-nos/shared';
import { composeLocalManuscript } from './local-author';
import { assessImages, assessManuscript, assessStory, fold } from './book-quality';

const answers = {
  como_conheceram: 'Nos conhecemos adolescentes e nada aconteceu naquele momento',
  momento_especial: 'Pagode juntos, ficamos de love lá',
  o_que_ama: 'Jeito dela',
};

const critiqueInput = {
  nameA: 'Ana',
  nameB: 'Leo',
  styleId: 'desenho',
  occasion: 'namoro',
  storyMode: 'inspired' as const,
  answers,
};

function verdictOf(book: Manuscript, pages: BookPage[] = book.pages) {
  return assessManuscript({
    pages,
    answers,
    storyMode: 'inspired',
    thread: book.thread,
    phases: book.phases,
  });
}

function withPage(book: Manuscript, index: number, change: (page: BookPage) => BookPage): BookPage[] {
  return book.pages.map((page) => (page.index === index ? change(structuredClone(page)) : page));
}

describe('manuscript from the critique answers', () => {
  const book = composeLocalManuscript(critiqueInput);
  const text = book.pages.map((page) => [page.text, ...(page.dialogue ?? [])].join('\n')).join('\n');

  it('tells a story of events, page by page, instead of pasting the answers', () => {
    const verdict = verdictOf(book);
    assert.equal(verdict.ok, true, verdict.reasons.join('\n'));
    const story = assessStory({ story: book.story, thread: book.thread, answers });
    assert.equal(story.ok, true, story.reasons.join('\n'));
    assert.match(book.thread, /reencontro/i);
    assert.match(text, /adolescentes/i);
    assert.match(text, /pagode/i);
    assert.match(text, /jeito/i);
    assert.equal(book.pages.some((page) => fold(page.text) === 'jeito dela'), false);
    assert.equal(book.pages.length, 12);
  });

  it('draws the teenage start with a youth phase and the reunion apart', () => {
    const youth = book.phases.find((phase) => /adolesc/.test(phase.label));
    assert.ok(youth);
    assert.equal(book.pages[1].visual.phase, youth.id);
    const message = book.pages.find((page) => /perfil/.test(page.text));
    assert.ok(message);
    assert.notEqual(message.visual.staging, 'together');
  });

  it('blocks two neighboring pages with the same scene', () => {
    const pages = withPage(book, 3, (page) => ({
      ...page,
      beat: { ...page.beat, event: book.pages[1].beat.event },
      visual: { ...book.pages[1].visual },
    }));
    const reasons = verdictOf(book, pages).reasons.join('\n');
    assert.match(reasons, /mesmo acontecimento/);
    assert.match(reasons, /quase a mesma imagem/);
  });

  it('blocks a kiss in the teenage phase', () => {
    const pages = withPage(book, 3, (page) => ({
      ...page,
      visual: { ...page.visual, action: 'Ana e Leo se beijam no banco da praça' },
    }));
    assert.match(verdictOf(book, pages).reasons.join('\n'), /adolescência/);
  });

  it('blocks a long conversation by message drawn with both together', () => {
    const pages = withPage(book, 6, (page) => ({ ...page, visual: { ...page.visual, staging: 'together' } }));
    assert.match(verdictOf(book, pages).reasons.join('\n'), /à distância/);
  });

  it('blocks three pages in a row with the text in the same place', () => {
    const pages = book.pages.map((page) =>
      page.index >= 2 && page.index <= 4 ? { ...page, visual: { ...page.visual, textZone: 'top' as const } } : page,
    );
    assert.match(verdictOf(book, pages).reasons.join('\n'), /mesmo lugar/);
  });

  it('blocks a page that reads like a chapter of the old book', () => {
    const long = Array.from({ length: 150 }, (_, i) => `palavra${i}`).join(' ');
    const pages = withPage(book, 5, (page) => ({ ...page, text: long }));
    assert.match(verdictOf(book, pages).reasons.join('\n'), /150 palavras/);
  });

  it('blocks the same reflection about time repeated across the book', () => {
    const pages = book.pages.map((page) =>
      page.index === 5 || page.index === 9
        ? { ...page, text: `${page.text} O tempo guardou aquele encontro.` }
        : page,
    );
    assert.match(verdictOf(book, pages).reasons.join('\n'), /reflexões sobre o tempo/);
  });

  it('requires a character sheet and one distinct illustration per page', () => {
    const sceneKeys: Record<string, string> = { [CAST_SCENE_KEY]: 'cast.jpg' };
    for (let index = 1; index <= 12; index++) sceneKeys[pageSceneKey(index)] = `p${index}.jpg`;
    assert.equal(assessImages({ sceneKeys, placeholder: false, allowPlaceholder: false }).ok, true);

    const shared = { ...sceneKeys, [pageSceneKey(4)]: sceneKeys[pageSceneKey(3)] };
    assert.match(
      assessImages({ sceneKeys: shared, placeholder: false, allowPlaceholder: false }).reasons.join(' '),
      /mesma ilustração/,
    );
    const stand = assessImages({ sceneKeys, placeholder: true, allowPlaceholder: false });
    assert.match(stand.reasons.join(' '), /decorativo/);
  });
});

describe('questions that follow the story mode', () => {
  it('asks adventure couples for a world, not for how they met', () => {
    const ok = memoriesSchema.safeParse({
      storyMode: 'adventure',
      answers: { aventura: 'Mar e piratas', talento_a: 'Calma quando tudo dá errado', talento_b: 'Conquista qualquer pessoa' },
    });
    assert.equal(ok.success, true);
    const missing = memoriesSchema.safeParse({
      storyMode: 'adventure',
      answers: { como_conheceram: 'Na faculdade, numa sexta chuvosa' },
    });
    assert.equal(missing.success, false);
  });

  it('writes an adventure from the world and what each one does best', () => {
    const adventureAnswers = {
      aventura: 'Mar e piratas',
      talento_a: 'Mantém a calma quando tudo dá errado',
      talento_b: 'Conquista qualquer pessoa em dois minutos',
      detalhe: 'Ele me chama de girassol',
    };
    const book = composeLocalManuscript({ ...critiqueInput, storyMode: 'adventure', answers: adventureAnswers });
    const verdict = assessManuscript({
      pages: book.pages,
      answers: adventureAnswers,
      storyMode: 'adventure',
      thread: book.thread,
      phases: book.phases,
    });
    assert.equal(verdict.ok, true, verdict.reasons.join('\n'));
    assert.match(book.thread, /girassol/);
  });
});
