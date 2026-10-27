import { z } from 'zod';
import { MEMORY_QUESTIONS } from './constants';

export const occasionSchema = z.object({
  occasion: z.enum(['namoro', 'casamento', 'aniversario', 'surpresa']),
});

export const coupleSchema = z.object({
  nameA: z.string().trim().min(1, 'Informe o primeiro nome').max(60),
  nameB: z.string().trim().min(1, 'Informe o segundo nome').max(60),
  photoAKey: z.string().min(1, 'Envie a foto da pessoa A'),
  photoBKey: z.string().min(1, 'Envie a foto da pessoa B'),
  photoTogetherKey: z.string().optional().nullable(),
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use a data no formato AAAA-MM-DD')
    .optional()
    .or(z.literal(''))
    .nullable(),
  photoConsent: z.literal(true, {
    errorMap: () => ({ message: 'É necessário autorizar o uso das fotos' }),
  }),
});

export const styleSchema = z.object({
  styleId: z.enum(['aquarela', 'editorial', 'linha', 'filme', 'noturno', 'papel']),
});

export const memoriesSchema = z.object({
  answers: z.object({
    como_conheceram: z.string().trim().min(8, 'Conte um pouco mais'),
    momento_especial: z.string().trim().min(8, 'Conte um pouco mais'),
    o_que_ama: z.string().trim().min(8, 'Conte um pouco mais'),
  }),
  dedication: z.string().max(500).optional().nullable(),
});

export const draftPatchSchema = z.object({
  step: z
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
  occasion: occasionSchema.shape.occasion.optional(),
  couple: coupleSchema.partial().optional(),
  styleId: styleSchema.shape.styleId.optional(),
  memories: z
    .object({
      answers: z.record(z.string()).optional(),
      dedication: z.string().max(500).optional().nullable(),
    })
    .optional(),
  email: z.string().email().optional().nullable(),
});

export type OccasionForm = z.infer<typeof occasionSchema>;
export type CoupleForm = z.infer<typeof coupleSchema>;
export type StyleForm = z.infer<typeof styleSchema>;
export type MemoriesForm = z.infer<typeof memoriesSchema>;
export type DraftPatch = z.infer<typeof draftPatchSchema>;

export const memoryQuestionIds = MEMORY_QUESTIONS.map((q) => q.id);
