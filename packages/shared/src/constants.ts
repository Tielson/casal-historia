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
    description: 'Manchas leves, pastéis e corações diluídos no papel.',
  },
  {
    id: 'editorial',
    name: 'Editorial íntimo',
    description: 'Luz macia, tipografia carinhosa, clima de revista fofa.',
  },
  {
    id: 'linha',
    name: 'Linha contemporânea',
    description: 'Contornos limpos com doodles e laços delicados.',
  },
  {
    id: 'filme',
    name: 'Filme antigo',
    description: 'Tons quentes, grão suave e chuva de corações.',
  },
  {
    id: 'noturno',
    name: 'Noturno sereno',
    description: 'Luz de lanterna, lilás suave e corações no céu.',
  },
  {
    id: 'papel',
    name: 'Papel artesanal',
    description: 'Textura de caderno com laços, carimbo e corações.',
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
