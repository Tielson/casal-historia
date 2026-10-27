"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FUNNEL_STEPS = exports.MEMORY_QUESTIONS = exports.STYLES = exports.OCCASIONS = exports.MAX_PREVIEW_REGENS = exports.PREVIEW_PAGE_COUNT = exports.BOOK_PAGE_COUNT = exports.PRICE_LABEL = exports.PRICE_CURRENCY = exports.PRICE_CENTS = void 0;
/** Server-authoritative price in BRL cents. Never trust client. */
exports.PRICE_CENTS = 4990;
exports.PRICE_CURRENCY = 'brl';
exports.PRICE_LABEL = 'R$ 49,90';
exports.BOOK_PAGE_COUNT = 12;
exports.PREVIEW_PAGE_COUNT = 2; // cover + 1 inner
exports.MAX_PREVIEW_REGENS = 3;
exports.OCCASIONS = [
    { id: 'namoro', label: 'Aniversário de namoro', short: 'Namoro' },
    { id: 'casamento', label: 'Aniversário de casamento', short: 'Casamento' },
    { id: 'aniversario', label: 'Aniversário de alguém', short: 'Aniversário' },
    { id: 'surpresa', label: 'Surpresa, só porque sim', short: 'Surpresa' },
];
exports.STYLES = [
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
];
exports.MEMORY_QUESTIONS = [
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
];
exports.FUNNEL_STEPS = [
    'landing',
    'occasion',
    'couple',
    'style',
    'memories',
    'preview',
    'review',
    'checkout',
    'production',
];
//# sourceMappingURL=constants.js.map