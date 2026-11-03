import {
  BOOK_PAGE_COUNT,
  CAST_SCENE_KEY,
  DIALOGUE_LINE_MAX_WORDS,
  DIALOGUE_MAX_LINES,
  PAGE_WORDS,
  STORY_WORD_MAX,
  STORY_WORD_MIN,
  pageSceneKey,
  type BookPage,
  type LifePhase,
  type StoryModeId,
} from '@entre-nos/shared';

export class DeliveryBlocked extends Error {
  readonly reasons: string[];

  constructor(reasons: string[]) {
    super(reasons.join(' '));
    this.name = 'DeliveryBlocked';
    this.reasons = reasons;
  }
}

const STOP = new Set([
  'para', 'pela', 'pelo', 'pelos', 'pelas', 'como', 'mais', 'muito', 'entre',
  'sobre', 'depois', 'antes', 'ainda', 'quando', 'onde', 'porque', 'assim',
  'isso', 'essa', 'esse', 'esta', 'este', 'aquele', 'aquela', 'naquele',
  'naquela', 'voces', 'voce', 'gente', 'sempre', 'nunca', 'nada', 'tudo',
  'cada', 'pelo', 'numa', 'num', 'nos', 'nas', 'dos', 'das', 'uma', 'uns',
  'com', 'sem', 'que', 'por', 'sua', 'seu', 'suas', 'seus', 'eles', 'elas',
  'ela', 'ele', 'nao', 'sim', 'foi', 'era', 'ser', 'ter', 'tem', 'sao',
  'esta', 'estao', 'havia', 'tinha', 'foram', 'ficou', 'ficaram', 'junto',
  'juntos', 'dia', 'vida', 'historia',
]);

const TEMPLATE_MARKERS = [
  /no estilo /,
  /esta pagina abre/,
  /voces guardam com carinho/,
  /o que sustenta o dia a dia/,
];

/** Reflections about time that the first versions repeated chapter after chapter. */
const TIME_CLICHES = [
  /o tempo guard/g,
  /o tempo cuid/g,
  /o tempo esper/g,
  /o tempo fez/g,
  /no tempo certo/g,
  /o destino/g,
  /como se o universo/g,
];

const ROMANTIC_CONTACT = /beij|abraco apaixon|abracad|maos dadas|de maos|caricia|toque romant/;
const REMOTE_CONTACT = /mensage|perfil|rede social|redes sociais|instagram|whatsapp|chamada de video|notificac/;

export function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function fold(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function contentTokens(text: string): string[] {
  return fold(text)
    .split(' ')
    .filter((token) => token.length >= 4 && !STOP.has(token));
}

function shingles(text: string, size = 8): Set<string> {
  const words = fold(text).split(' ').filter(Boolean);
  const found = new Set<string>();
  for (let i = 0; i <= words.length - size; i++) {
    found.add(words.slice(i, i + size).join(' '));
  }
  return found;
}

function jaccard(left: string[], right: string[]): number {
  const a = new Set(left);
  const b = new Set(right);
  if (!a.size || !b.size) return 0;
  let shared = 0;
  for (const token of a) if (b.has(token)) shared += 1;
  return shared / (a.size + b.size - shared);
}

function isRawDump(body: string, answer: string): boolean {
  const foldedBody = fold(body);
  const foldedAnswer = fold(answer);
  if (foldedAnswer.length < 4) return false;
  if (foldedBody === foldedAnswer) return true;
  const bodyWords = Math.max(wordCount(body), 1);
  const answerWords = wordCount(answer);
  if (!foldedBody.includes(foldedAnswer)) return false;
  const share = answerWords / bodyWords;
  if (answerWords <= 6) return share >= 0.45;
  return share >= 0.7;
}

export function isYouthPhase(phase: LifePhase | undefined): boolean {
  if (!phase) return false;
  const label = fold(`${phase.id} ${phase.label} ${phase.age}`);
  if (/adolesc|teen|escola|colegio|infan|crianc/.test(label)) return true;
  const ages = phase.age.match(/\d+/g)?.map(Number) ?? [];
  return ages.length > 0 && Math.min(...ages) < 18;
}

/** Narration plus spoken lines, as the reader sees the page. */
export function pageCopy(page: Pick<BookPage, 'text' | 'dialogue'>): string {
  return [page.text, ...(page.dialogue ?? [])].join('\n');
}

function wordRange(page: BookPage): { min: number; max: number; label: string } {
  if (page.role === 'cover') return { ...PAGE_WORDS.cover, label: 'a capa' };
  if (page.role === 'closing') return { ...PAGE_WORDS.closing, label: 'o encerramento' };
  const labels = { scene: 'páginas de cena', dialogue: 'páginas de diálogo', impact: 'páginas de impacto' };
  return { ...PAGE_WORDS[page.layout], label: labels[page.layout] };
}

function samePlace(left: string, right: string): boolean {
  const a = contentTokens(left);
  const b = contentTokens(right);
  if (!a.length || !b.length) return fold(left) === fold(right);
  return jaccard(a, b) >= 0.5;
}

/** How many of place, framing, who is in frame and moment change from one page to the next. */
function visualChanges(left: BookPage, right: BookPage): number {
  const a = left.visual;
  const b = right.visual;
  return [
    !samePlace(a.location, b.location),
    a.shot !== b.shot,
    a.staging !== b.staging,
    a.phase !== b.phase || fold(a.time) !== fold(b.time),
  ].filter(Boolean).length;
}

function countCliches(text: string): number {
  const folded = fold(text);
  return TIME_CLICHES.reduce((sum, cliche) => sum + (folded.match(cliche)?.length ?? 0), 0);
}

function answerLinks(corpus: string, answers: Record<string, string>): string[] {
  const reasons: string[] = [];
  const foldedCorpus = fold(corpus);
  const known = new Set(contentTokens(corpus));
  for (const answer of Object.values(answers)) {
    const tokens = contentTokens(answer ?? '');
    if (!tokens.length) {
      const folded = fold(answer ?? '');
      if (folded.length >= 4 && !foldedCorpus.includes(folded)) {
        reasons.push('História sem ligação com as respostas.');
      }
      continue;
    }
    const hits = tokens.filter((token) => known.has(token)).length;
    const needed = tokens.length <= 3 ? 1 : Math.min(2, Math.ceil(tokens.length * 0.25));
    if (hits < needed) reasons.push('História sem ligação com as respostas.');
  }
  return reasons;
}

/** The whole story, before it is split into pages. */
export function assessStory(input: {
  story: string;
  thread: string;
  answers: Record<string, string>;
}): { ok: boolean; reasons: string[] } {
  const reasons: string[] = [];
  const words = wordCount(input.story);
  if (words < STORY_WORD_MIN || words > STORY_WORD_MAX) {
    reasons.push(
      `A história completa tem ${words} palavras; ela precisa ficar entre ${STORY_WORD_MIN} e ${STORY_WORD_MAX}.`,
    );
  }
  if (input.thread.trim().length < 20) reasons.push('História incompleta: falta o fio narrativo.');
  reasons.push(...answerLinks(`${input.thread}\n${input.story}`, input.answers));
  const cliches = countCliches(input.story);
  if (cliches > 1) {
    reasons.push(
      `A história repete ${cliches} reflexões sobre o tempo; deixe no máximo uma e troque o resto por acontecimentos.`,
    );
  }
  return { ok: reasons.length === 0, reasons: unique(reasons) };
}

export function assessManuscript(input: {
  pages: BookPage[];
  answers: Record<string, string>;
  storyMode: StoryModeId;
  thread?: string;
  phases?: LifePhase[];
}): { ok: boolean; reasons: string[] } {
  const reasons: string[] = [];
  const pages = [...input.pages].sort((a, b) => a.index - b.index);
  const phases = new Map((input.phases ?? []).map((phase) => [phase.id, phase]));

  if (pages.length !== BOOK_PAGE_COUNT) {
    reasons.push(`História incompleta: o livro precisa ter ${BOOK_PAGE_COUNT} páginas.`);
  }

  const corpus = [input.thread ?? '', ...pages.map(pageCopy)].join('\n');
  const foldedCorpus = fold(corpus);

  for (const page of pages) {
    if (!page.text.trim()) {
      reasons.push(`Página vazia: ${page.index}.`);
      continue;
    }
    if (TEMPLATE_MARKERS.some((marker) => marker.test(fold(page.text)))) {
      reasons.push(`A página ${page.index} cola um modelo em vez de contar a história.`);
    }
    const count = wordCount(page.text);
    const range = wordRange(page);
    if (count < range.min || count > range.max) {
      reasons.push(
        `A página ${page.index} tem ${count} palavras; ${range.label} ficam entre ${range.min} e ${range.max}.`,
      );
    }
    const lines = page.dialogue ?? [];
    if (page.layout === 'dialogue' && !lines.length) {
      reasons.push(`A página ${page.index} é de diálogo, mas não traz falas.`);
    }
    if (page.layout !== 'dialogue' && lines.length) {
      reasons.push(
        `A página ${page.index} traz falas soltas; use o layout de diálogo ou coloque a fala dentro do texto.`,
      );
    }
    if (lines.length > DIALOGUE_MAX_LINES || lines.some((item) => wordCount(item) > DIALOGUE_LINE_MAX_WORDS)) {
      reasons.push(
        `As falas da página ${page.index} passam do limite: até ${DIALOGUE_MAX_LINES} falas de ${DIALOGUE_LINE_MAX_WORDS} palavras.`,
      );
    }

    const scene = fold(`${pageCopy(page)} ${page.visual.action} ${page.visual.expression} ${page.beat.event}`);
    if (isYouthPhase(phases.get(page.visual.phase)) && ROMANTIC_CONTACT.test(scene)) {
      reasons.push(
        `A página ${page.index} se passa na adolescência e precisa de uma cena sem contato romântico.`,
      );
    }
    const remote = fold(`${page.visual.action} ${page.visual.location} ${page.beat.event}`);
    if (page.visual.staging === 'together' && REMOTE_CONTACT.test(remote) && !/juntos|lado a lado/.test(remote)) {
      reasons.push(
        `A página ${page.index} conta uma conversa à distância, mas mostra os dois juntos; mostre cada um no seu lugar (apart, solo_a, solo_b ou detail).`,
      );
    }
  }

  for (const answer of Object.values(input.answers)) {
    if (!answer?.trim()) continue;
    for (const page of pages) {
      if (page.text.trim() && isRawDump(page.text, answer)) {
        reasons.push(`A página ${page.index} repete a resposta em vez de desenvolvê-la.`);
        break;
      }
    }
  }

  const seen = new Map<string, number>();
  for (const page of pages) {
    const key = fold(page.text);
    if (!key) continue;
    const previous = seen.get(key);
    if (previous) {
      reasons.push(`Trechos repetidos entre as páginas ${previous} e ${page.index}.`);
    } else {
      seen.set(key, page.index);
    }
  }

  for (let i = 0; i < pages.length; i++) {
    const leftGrams = shingles(pageCopy(pages[i]));
    for (let j = i + 1; j < pages.length; j++) {
      for (const gram of shingles(pageCopy(pages[j]))) {
        if (leftGrams.has(gram)) {
          reasons.push(`Trechos repetidos entre as páginas ${pages[i].index} e ${pages[j].index}.`);
          break;
        }
      }
      const leftTokens = contentTokens(pages[i].text);
      const rightTokens = contentTokens(pages[j].text);
      if (leftTokens.length >= 8 && rightTokens.length >= 8 && jaccard(leftTokens, rightTokens) >= 0.72) {
        reasons.push(`As páginas ${pages[i].index} e ${pages[j].index} contam a mesma coisa.`);
      }
    }
  }

  for (let i = 1; i < pages.length; i++) {
    const before = pages[i - 1];
    const page = pages[i];
    const events = [contentTokens(before.beat.event), contentTokens(page.beat.event)];
    if (events[0].length >= 2 && events[1].length >= 2 && jaccard(events[0], events[1]) >= 0.6) {
      reasons.push(
        `As páginas ${before.index} e ${page.index} mostram o mesmo acontecimento; a segunda precisa fazer a história avançar.`,
      );
    }
    if (visualChanges(before, page) < 2) {
      reasons.push(
        `As páginas ${before.index} e ${page.index} têm quase a mesma imagem; mude pelo menos dois entre lugar, enquadramento, quem aparece e momento.`,
      );
    }
    const zones = [pages[i - 2]?.visual.textZone, before.visual.textZone, page.visual.textZone];
    if (zones[0] && zones[0] === zones[1] && zones[1] === zones[2]) {
      reasons.push(
        `As páginas ${pages[i - 2].index} a ${page.index} põem o texto no mesmo lugar; varie a zona conforme a cena.`,
      );
    }
  }

  const story = pages.filter((page) => page.role === 'story');
  if (new Set(pages.map((page) => page.visual.shot)).size < 3) {
    reasons.push('Os enquadramentos se repetem; use cena aberta, plano médio e detalhe ao longo do livro.');
  }
  if (new Set(pages.map((page) => page.visual.textZone)).size < 2) {
    reasons.push('O texto está sempre no mesmo lugar da página.');
  }
  if (story.length && !story.some((page) => page.layout === 'impact')) {
    reasons.push('Falta uma página de impacto, com uma frase curta, numa virada da história.');
  }
  if (story.length && !story.some((page) => page.layout === 'dialogue')) {
    reasons.push('Falta uma página de diálogo num momento de aproximação ou descoberta.');
  }
  const cliches = countCliches(corpus);
  if (cliches > 1) {
    reasons.push(
      `O livro repete ${cliches} reflexões sobre o tempo; deixe no máximo uma e troque o resto por acontecimentos.`,
    );
  }

  reasons.push(...answerLinks(corpus, input.answers));

  if (input.storyMode === 'inspired' && !/inspirad/.test(foldedCorpus)) {
    reasons.push('O modo inspirado não aparece na história: diga na capa ou na página 2, com a palavra "inspirada", que a história é inspirada neles.');
  }
  if (input.storyMode === 'adventure' && !/fictici|inventad|aventura/.test(foldedCorpus)) {
    reasons.push('A aventura fictícia não fica declarada: diga na capa ou na página 2 que é uma aventura inventada.');
  }
  if (input.storyMode === 'real' && /historia ficticia|aventura inventada/.test(foldedCorpus)) {
    reasons.push('O modo real conta uma história fora dos fatos.');
  }
  if ((input.thread ?? '').trim().length < 20) {
    reasons.push('História incompleta: falta o fio narrativo.');
  }

  return { ok: reasons.length === 0, reasons: unique(reasons) };
}

/** Every page has its own illustration, drawn from the character sheet. */
export function assessImages(input: {
  sceneKeys: Record<string, string>;
  placeholder: boolean;
  allowPlaceholder: boolean;
}): { ok: boolean; reasons: string[] } {
  const reasons: string[] = [];
  if (!input.sceneKeys[CAST_SCENE_KEY]) reasons.push('Falta a referência dos personagens.');
  const keys: string[] = [];
  for (let index = 1; index <= BOOK_PAGE_COUNT; index++) {
    const key = input.sceneKeys[pageSceneKey(index)];
    if (key) keys.push(key);
    else reasons.push(`Imagem obrigatória ausente: página ${index}.`);
  }
  if (new Set(keys).size !== keys.length) {
    reasons.push('Duas páginas usam a mesma ilustração.');
  }
  if (!input.allowPlaceholder && input.placeholder) {
    reasons.push('Geração de imagem substituída por fundo decorativo.');
  }
  return { ok: reasons.length === 0, reasons };
}

function unique(items: string[]): string[] {
  return [...new Set(items)];
}
