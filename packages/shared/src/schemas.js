"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.memoryQuestionIds = exports.draftPatchSchema = exports.memoriesSchema = exports.styleSchema = exports.coupleSchema = exports.occasionSchema = void 0;
const zod_1 = require("zod");
const constants_1 = require("./constants");
exports.occasionSchema = zod_1.z.object({
    occasion: zod_1.z.enum(['namoro', 'casamento', 'aniversario', 'surpresa']),
});
exports.coupleSchema = zod_1.z.object({
    nameA: zod_1.z.string().trim().min(1, 'Informe o primeiro nome').max(60),
    nameB: zod_1.z.string().trim().min(1, 'Informe o segundo nome').max(60),
    photoAKey: zod_1.z.string().min(1, 'Envie a foto da pessoa A'),
    photoBKey: zod_1.z.string().min(1, 'Envie a foto da pessoa B'),
    photoTogetherKey: zod_1.z.string().optional().nullable(),
    startDate: zod_1.z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use a data no formato AAAA-MM-DD')
        .optional()
        .or(zod_1.z.literal(''))
        .nullable(),
    photoConsent: zod_1.z.literal(true, {
        errorMap: () => ({ message: 'É necessário autorizar o uso das fotos' }),
    }),
});
exports.styleSchema = zod_1.z.object({
    styleId: zod_1.z.enum(['aquarela', 'editorial', 'linha', 'filme', 'noturno', 'papel']),
});
exports.memoriesSchema = zod_1.z.object({
    answers: zod_1.z.object({
        como_conheceram: zod_1.z.string().trim().min(8, 'Conte um pouco mais'),
        momento_especial: zod_1.z.string().trim().min(8, 'Conte um pouco mais'),
        o_que_ama: zod_1.z.string().trim().min(8, 'Conte um pouco mais'),
    }),
    dedication: zod_1.z.string().max(500).optional().nullable(),
});
exports.draftPatchSchema = zod_1.z.object({
    step: zod_1.z
        .enum([
        'occasion',
        'couple',
        'style',
        'memories',
        'preview',
        'review',
        'checkout',
        'production',
    ])
        .optional(),
    occasion: exports.occasionSchema.shape.occasion.optional(),
    couple: exports.coupleSchema.partial().optional(),
    styleId: exports.styleSchema.shape.styleId.optional(),
    memories: zod_1.z
        .object({
        answers: zod_1.z.record(zod_1.z.string()).optional(),
        dedication: zod_1.z.string().max(500).optional().nullable(),
    })
        .optional(),
    email: zod_1.z.string().email().optional().nullable(),
});
exports.memoryQuestionIds = constants_1.MEMORY_QUESTIONS.map((q) => q.id);
//# sourceMappingURL=schemas.js.map