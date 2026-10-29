import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { composeLocalManuscript } from './local-author';
import { APPROVED_LIMITS, assessImages, assessManuscript, fold } from './book-quality';
import { buildScenePrompt } from './style-packs';
import { memoriesSchema } from '@entre-nos/shared';

const answers = {
  como_conheceram: 'Nos conhecemos adolescentes e nada aconteceu naquele momento',
  momento_especial: 'Pagode juntos, ficamos de love lá',
  o_que_ama: 'Jeito dela',
};

const critiqueInput = {
  nameA: 'Ana',
  nameB: 'Leo',
  styleId: 'filme',
  occasion: 'namoro',
  storyMode: 'inspired' as const,
  answers,
};

describe('manuscript from the critique answers', () => {
  const book = composeLocalManuscript(critiqueInput);
  const text = book.pages.map((page) => `${page.title}\n${page.body}`).join('\n');

  it('writes a time-and-reunion story instead of pasting the answers', () => {
    const verdict = assessManuscript({
      pages: book.pages,
      answers,
      storyMode: 'inspired',
      thread: book.thread,
    });
    assert.equal(verdict.ok, true, verdict.reasons.join('\n'));
    assert.match(book.thread, /tempo/i);
    assert.match(book.thread, /reencontro/i);
    assert.match(text, /adolescentes/i);
    assert.match(text, /pagode/i);
    assert.match(text, /jeito/i);
    assert.equal(
      book.pages.some((page) => fold(page.body) === 'jeito dela' || fold(page.title) === 'jeito dela'),
      false,
    );
    assert.equal(
      book.pages.some((page) => /^pagina\s+\d+$/.test(fold(page.title))),
      false,
    );
    assert.equal(book.pages.length, 12);
    assert.equal(book.title.length > 2, true);
    assert.equal(new Set(book.scenes.map((scene) => scene.setting)).size, 7);
  });

  it('blocks a decorative stand-in when real images were required', () => {
    const verdict = assessImages({
      scenes: book.scenes.map((scene) => ({ id: scene.id, placeholder: true })),
      allowPlaceholder: false,
    });
    assert.equal(verdict.ok, false);
    assert.match(verdict.reasons.join(' '), /decorativo/);
  });
});

describe('a preview approved before the longer pages', () => {
  const book = composeLocalManuscript(critiqueInput);
  const shortened = book.pages.map((page) => ({
    ...page,
    body: page.body.split(/\s+/).slice(0, page.role === 'cover' ? 40 : 75).join(' '),
  }));

  it('is rewritten when generated now', () => {
    const verdict = assessManuscript({
      pages: shortened,
      answers,
      storyMode: 'inspired',
      thread: book.thread,
    });
    assert.equal(verdict.ok, false);
    assert.match(verdict.reasons.join(' '), /palavras/);
  });

  it('still goes to production once approved', () => {
    const verdict = assessManuscript({
      pages: shortened,
      answers,
      storyMode: 'inspired',
      thread: book.thread,
      limits: APPROVED_LIMITS,
    });
    assert.equal(verdict.ok, true, verdict.reasons.join('\n'));
  });
});

describe('the old pasted book', () => {
  it('is rejected before delivery', () => {
    const cycle = [answers.como_conheceram, answers.momento_especial, answers.o_que_ama];
    const pages = [
      { index: 1, role: 'cover', title: 'Ana & Leo', body: 'Entre Nós' },
      {
        index: 2,
        role: 'opening',
        title: 'Entre Nós',
        body: [
          `No estilo Filme antigo, esta página abre com o começo: ${answers.como_conheceram}.`,
          `Vocês guardam com carinho: ${answers.momento_especial}.`,
          `E o que sustenta o dia a dia: ${answers.o_que_ama}.`,
        ].join('\n\n'),
      },
    ];
    for (let index = 3; index <= 11; index += 1) {
      pages.push({
        index,
        role: 'meet_a',
        title: `Página ${index}`,
        body: cycle[(index - 3) % cycle.length],
      });
    }
    pages.push({ index: 12, role: 'closing', title: 'Encerramento', body: '' });

    const verdict = assessManuscript({
      pages,
      answers,
      storyMode: 'inspired',
      thread: 'O arquivo apenas repetiu as respostas nas páginas seguintes.',
    });
    assert.equal(verdict.ok, false);
    const reasons = verdict.reasons.join('\n');
    assert.match(reasons, /Página 3|Título genérico/);
    assert.match(reasons, /vazia/i);
    assert.match(reasons, /repete a resposta|modelo/i);
    assert.match(reasons, /repetid/i);
  });
});

describe('filme antigo prompt', () => {
  it('changes light, grain, framing and wardrobe', () => {
    const scene = composeLocalManuscript(critiqueInput).scenes.find((item) => item.id === 'memory');
    assert.ok(scene);
    const prompt = buildScenePrompt('filme', scene, 'Character lock for Ana and Leo.');
    assert.match(prompt, /warm tungsten/i);
    assert.match(prompt, /film grain/i);
    assert.match(prompt, /vignette/i);
    assert.match(prompt, /wardrobe/i);
    assert.match(prompt, /framing/i);
    assert.match(prompt, /no text/i);
    assert.doesNotMatch(prompt, /#6b4a35/);
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
    });
    assert.equal(verdict.ok, true, verdict.reasons.join('\n'));
    assert.match(book.thread, /girassol/);
  });
});
