/** Server-authoritative price in BRL cents. Never trust client. */
export const PRICE_CENTS = 4990;
export const PRICE_CURRENCY = 'brl';
export const PRICE_LABEL = 'R$ 49,90';

export const BOOK_PAGE_COUNT = 12;
export const PREVIEW_PAGE_COUNT = 2; // cover + 1 inner
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
    id: 'aquarela',
    name: 'Aquarela suave',
    description: 'Traços leves, cores diluídas, clima de caderno de viagem.',
  },
  {
    id: 'editorial',
    name: 'Editorial íntimo',
    description: 'Luz natural, composição fotográfica, tipografia limpa.',
  },
  {
    id: 'linha',
    name: 'Linha contemporânea',
    description: 'Ilustração de contorno, contraste alto, ar moderno.',
  },
  {
    id: 'filme',
    name: 'Filme antigo',
    description: 'Grão suave, tons quentes, sensação de revelação.',
  },
  {
    id: 'noturno',
    name: 'Noturno sereno',
    description: 'Azuis profundos, luz de janela, quietude.',
  },
  {
    id: 'papel',
    name: 'Papel artesanal',
    description: 'Textura de papel, carvão e aquarela seca.',
  },
] as const;

export type StyleId = (typeof STYLES)[number]['id'];

export const MEMORY_QUESTIONS = [
  {
    id: 'como_conheceram',
    label: 'Como vocês se conheceram?',
    example: 'Ex.: No café da faculdade, numa sexta chuvosa.',
    required: true,
  },
  {
    id: 'momento_especial',
    label: 'Qual momento especial vocês nunca esquecem?',
    example: 'Ex.: A primeira viagem de ônibus só de vocês dois.',
    required: true,
  },
  {
    id: 'o_que_ama',
    label: 'O que você mais ama nessa pessoa?',
    example: 'Ex.: O jeito de rir e a calma nos dias difíceis.',
    required: true,
  },
] as const;

export type MemoryQuestionId = (typeof MEMORY_QUESTIONS)[number]['id'];

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
