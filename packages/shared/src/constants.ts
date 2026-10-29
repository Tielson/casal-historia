/** Server-authoritative price in BRL cents. Never trust client. */
export const PRICE_CENTS = 4990;
export const PRICE_CURRENCY = 'brl';
export const PRICE_LABEL = 'R$ 49,90';

export const BOOK_PAGE_COUNT = 12;
/** The preview shows the cover and the next three pages in sequence. */
export const PREVIEW_PAGES = [1, 2, 3, 4] as const;
export const PREVIEW_PAGE_COUNT = PREVIEW_PAGES.length;
export const MAX_PREVIEW_REGENS = 3;

export const OCCASIONS = [
  { id: 'namoro', label: 'Aniversário de namoro', short: 'Namoro' },
  { id: 'casamento', label: 'Aniversário de casamento', short: 'Casamento' },
  { id: 'aniversario', label: 'Aniversário de alguém', short: 'Aniversário' },
  { id: 'surpresa', label: 'Surpresa, só porque sim', short: 'Surpresa' },
] as const;

export type OccasionId = (typeof OCCASIONS)[number]['id'];

export const STYLES = [
  {
    id: 'desenho',
    name: 'Desenho romântico 2D',
    description: 'Traços delicados, personagens reconhecíveis e cenários ilustrados.',
  },
  {
    id: 'caricatura',
    name: 'Caricatura afetiva',
    description: 'Traços levemente exagerados, muita expressão e humor carinhoso.',
  },
  {
    id: 'animacao',
    name: 'Animação 3D',
    description: 'Volume, formas suaves e luz de filme animado.',
  },
  {
    id: 'aquarela',
    name: 'Aquarela',
    description: 'Pintura, textura de papel e cores delicadas.',
  },
  {
    id: 'quadrinhos',
    name: 'Quadrinhos',
    description: 'Traço definido, cenas em sequência e falas pontuais.',
  },
  {
    id: 'cinema',
    name: 'Realista cinematográfico',
    description: 'Aparência fotográfica, ação e enquadramentos de cinema.',
  },
] as const;

export type StyleId = (typeof STYLES)[number]['id'];

export const STYLE_IDS = ['desenho', 'caricatura', 'animacao', 'aquarela', 'quadrinhos', 'cinema'] as const satisfies readonly StyleId[];

export const DEFAULT_STYLE_ID: StyleId = 'desenho';

/** Color and atmosphere applied on top of any style. */
export const FILM_FINISH = {
  name: 'Acabamento filme antigo',
  description: 'Tons quentes, grão suave e vinheta, aplicados sobre o estilo escolhido.',
} as const;

export const STORY_MODES = [
  {
    id: 'real',
    short: 'Real',
    name: 'Nossa história real',
    hint: 'Contem os fatos. A gente dá cheiro, luz e som, mas não inventa nada.',
    description: 'Desenvolve os acontecimentos que vocês contaram e preserva os fatos.',
  },
  {
    id: 'inspired',
    short: 'Inspirada',
    name: 'Inspirada em nós',
    hint: 'Uma lembrança vira cena. A gente cria falas e detalhes em volta dela.',
    description: 'Usa as lembranças como base e cria cenas, diálogos e detalhes literários.',
  },
  {
    id: 'adventure',
    short: 'Aventura',
    name: 'Uma aventura nossa',
    hint: 'Vocês viram protagonistas de uma história inventada. Escolham o mundo.',
    description: 'Cria uma história fictícia protagonizada pelo casal, no universo do estilo escolhido.',
  },
] as const;

export type StoryModeId = (typeof STORY_MODES)[number]['id'];

export const STORY_MODE_NOTICE: Record<StoryModeId, string> = {
  real: 'Esta história desenvolve só o que vocês contaram.',
  inspired:
    'Esta história é inspirada em vocês: as lembranças são a base e os detalhes literários são criação.',
  adventure: 'Esta é uma aventura fictícia protagonizada por vocês.',
};

/** Page 1 is the cover, 2–11 tell the story, 12 closes it with the dedication. */
export const PAGE_ROLES = ['cover', 'story', 'closing'] as const;
export type PageRole = (typeof PAGE_ROLES)[number];

export function pageRole(index: number): PageRole {
  if (index === 1) return 'cover';
  if (index === BOOK_PAGE_COUNT) return 'closing';
  return 'story';
}

/** Storage key of a page illustration, also used in `sceneKeys`. */
export function pageSceneKey(index: number): string {
  return `p${String(index).padStart(2, '0')}`;
}

/** The character reference sheet every page is drawn from. */
export const CAST_SCENE_KEY = 'cast';

/**
 * scene: full illustration with the text integrated.
 * dialogue: full illustration with a few short lines of speech.
 * impact: a turning point carried by one short sentence.
 */
export const PAGE_LAYOUTS = ['scene', 'dialogue', 'impact'] as const;
export type PageLayout = (typeof PAGE_LAYOUTS)[number];

/** The calm part of the illustration that receives the text. */
export const TEXT_ZONES = ['top', 'bottom', 'left', 'right'] as const;
export type TextZone = (typeof TEXT_ZONES)[number];

export const SHOTS = ['wide', 'medium', 'close', 'detail'] as const;
export type Shot = (typeof SHOTS)[number];

/** Who is in the frame. `apart` shows each one in their own place. */
export const STAGINGS = ['together', 'apart', 'solo_a', 'solo_b', 'detail'] as const;
export type Staging = (typeof STAGINGS)[number];

/** Narration word range by kind of page. Dialogue lines are counted apart. */
export const PAGE_WORDS = {
  cover: { min: 4, max: 25 },
  scene: { min: 35, max: 70 },
  dialogue: { min: 10, max: 45 },
  impact: { min: 4, max: 25 },
  closing: { min: 25, max: 70 },
} as const;
export const DIALOGUE_MAX_LINES = 3;
export const DIALOGUE_LINE_MAX_WORDS = 14;
export const STORY_WORD_MIN = 350;
export const STORY_WORD_MAX = 1200;

export interface StoryQuestion {
  id: string;
  /** `{a}` and `{b}` become the couple's names. */
  label: string;
  example: string;
  required: boolean;
  kind: 'text' | 'choice';
  options?: readonly string[];
}

export const ADVENTURE_WORLDS = [
  'Missão secreta',
  'Viagem no tempo',
  'Conto de fadas',
  'Volta ao mundo',
  'Mar e piratas',
  'Rumo às estrelas',
] as const;

const SHARED_DETAIL: StoryQuestion = {
  id: 'detalhe',
  label: 'Um detalhe só de vocês',
  example: 'Ex.: Apelido, música, mania ou piada interna. Ele volta ao longo do livro.',
  required: false,
  kind: 'text',
};

/** The memories step asks different things for each kind of story. */
export const STORY_QUESTIONS: Record<StoryModeId, readonly StoryQuestion[]> = {
  real: [
    {
      id: 'como_conheceram',
      label: 'Como e onde vocês se conheceram?',
      example: 'Ex.: No estágio, em 2016. Dividíamos a mesma mesa e o mesmo café ruim.',
      required: true,
      kind: 'text',
    },
    {
      id: 'momento_especial',
      label: 'O momento que mudou tudo entre vocês',
      example: 'Ex.: A primeira viagem juntos, quando o carro quebrou na estrada.',
      required: true,
      kind: 'text',
    },
    {
      id: 'o_que_ama',
      label: 'O que você mais ama em {b}?',
      example: 'Ex.: A calma nos dias difíceis e o riso fácil.',
      required: true,
      kind: 'text',
    },
    SHARED_DETAIL,
  ],
  inspired: [
    {
      id: 'como_conheceram',
      label: 'Onde a história de vocês começou?',
      example: 'Ex.: Numa festa de amigos, num inverno chuvoso.',
      required: true,
      kind: 'text',
    },
    {
      id: 'momento_especial',
      label: 'Uma cena que vocês amam reviver',
      example: 'Ex.: Um jantar improvisado na cozinha, com música alta e vinho barato.',
      required: true,
      kind: 'text',
    },
    {
      id: 'o_que_ama',
      label: 'O que você mais admira em {b}?',
      example: 'Ex.: O cuidado com os detalhes e o jeito de ouvir.',
      required: true,
      kind: 'text',
    },
    SHARED_DETAIL,
  ],
  adventure: [
    {
      id: 'aventura',
      label: 'Que aventura vocês querem viver?',
      example: 'Escolham um mundo. O resto a gente inventa.',
      required: true,
      kind: 'choice',
      options: ADVENTURE_WORLDS,
    },
    {
      id: 'talento_a',
      label: 'O que {a} tem de melhor?',
      example: 'Vira o papel na trama. Ex.: Calma quando tudo dá errado.',
      required: true,
      kind: 'text',
    },
    {
      id: 'talento_b',
      label: 'E o que {b} tem de melhor?',
      example: 'Ex.: Conquista qualquer pessoa em dois minutos.',
      required: true,
      kind: 'text',
    },
    {
      ...SHARED_DETAIL,
      label: 'Um detalhe para esconder na aventura',
      example: 'Ex.: Apelido, música ou comida favorita. Aparece como pista.',
    },
  ],
};

export function questionLabel(label: string, names: { nameA?: string | null; nameB?: string | null }) {
  return label
    .replace('{a}', names.nameA?.trim() || 'a pessoa A')
    .replace('{b}', names.nameB?.trim() || 'essa pessoa');
}

/** Optional plot direction, stored with the answers under this key. */
export const STORY_DIRECTION_KEY = 'rumo';
export const STORY_DIRECTION_MAX = 600;

export const FUNNEL_STEPS = [
  'landing',
  'occasion',
  'couple',
  'style',
  'memories',
  'preview',
  'review',
  'checkout',
  'production',
] as const;

export type FunnelStep = (typeof FUNNEL_STEPS)[number];

export function funnelStepRank(step: string | null | undefined): number {
  if (!step) return 0;
  const index = FUNNEL_STEPS.indexOf(step as FunnelStep);
  return index < 0 ? 0 : index;
}

/** Editing an earlier stage must not rewind someone who already went further. */
export function keepFurthestStep(current: string | null | undefined, requested: string): string {
  if (!current) return requested;
  return funnelStepRank(current) >= funnelStepRank(requested) ? current : requested;
}
