import { z } from 'zod';
import {
  BOOK_PAGE_COUNT,
  DIALOGUE_MAX_LINES,
  PAGE_LAYOUTS,
  PAGE_ROLES,
  SHOTS,
  STAGINGS,
  STORY_DIRECTION_MAX,
  STORY_QUESTIONS,
  STYLE_IDS,
  TEXT_ZONES,
  pageRole,
} from './constants';

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
  styleId: z.enum(STYLE_IDS),
  filmFinish: z.boolean().default(false),
});

export const storyModeSchema = z.enum(['real', 'inspired', 'adventure']);

export const memoriesSchema = z
  .object({
    answers: z.record(
      z.string().trim().max(STORY_DIRECTION_MAX, 'Resuma em até 600 caracteres'),
    ),
    dedication: z.string().max(500).optional().nullable(),
    storyMode: storyModeSchema,
  })
  .superRefine((value, ctx) => {
    for (const question of STORY_QUESTIONS[value.storyMode]) {
      if (!question.required) continue;
      const answer = value.answers[question.id]?.trim() ?? '';
      if (question.kind === 'choice' ? !answer : answer.length < 8) {
        ctx.addIssue({
          code: 'custom',
          path: ['answers', question.id],
          message: question.kind === 'choice' ? 'Escolham uma opção' : 'Conte um pouco mais',
        });
      }
    }
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
  filmFinish: z.boolean().optional(),
  memories: z
    .object({
      answers: z.record(z.string()).optional(),
      dedication: z.string().max(500).optional().nullable(),
      storyMode: storyModeSchema.optional(),
    })
    .optional(),
  email: z.string().email().optional().nullable(),
});

export type OccasionForm = z.infer<typeof occasionSchema>;
export type CoupleForm = z.infer<typeof coupleSchema>;
export type StyleForm = z.infer<typeof styleSchema>;
export type MemoriesForm = z.infer<typeof memoriesSchema>;
export type DraftPatch = z.infer<typeof draftPatchSchema>;

const line = (min: number, max: number) => z.string().trim().min(min).max(max);

/** What the page does for the story. Answers the four questions every scene must answer. */
export const pageBeatSchema = z.object({
  event: line(8, 300),
  change: line(8, 300),
  next: line(8, 300),
  imageOnly: line(4, 300),
});

/** Visual script of one illustration. */
export const pageVisualSchema = z.object({
  phase: line(1, 40),
  staging: z.enum(STAGINGS),
  wardrobe: line(4, 300),
  location: line(4, 300),
  time: line(3, 120),
  action: line(8, 400),
  expression: line(4, 200),
  shot: z.enum(SHOTS),
  textZone: z.enum(TEXT_ZONES),
  linkToNext: line(4, 300),
});

export const bookPageSchema = z.object({
  index: z.number().int().min(1).max(BOOK_PAGE_COUNT),
  role: z.enum(PAGE_ROLES),
  layout: z.enum(PAGE_LAYOUTS),
  text: line(1, 900),
  dialogue: z.array(line(1, 160)).max(DIALOGUE_MAX_LINES).optional(),
  beat: pageBeatSchema,
  visual: pageVisualSchema,
});

export const castMemberSchema = z.object({
  name: line(1, 60),
  look: line(8, 400),
});

/** A moment of their lives with how each one looked then. */
export const lifePhaseSchema = z.object({
  id: line(1, 40),
  label: line(2, 80),
  age: line(1, 60),
  looks: z.record(line(4, 400)),
});

export const storyBibleSchema = z.object({
  storyMode: storyModeSchema,
  title: line(2, 80),
  thread: line(20, 600),
  interpretation: z.object({
    characters: z.array(line(1, 120)).min(2).max(6),
    facts: z.array(line(1, 300)).min(1).max(8),
    traits: z.array(line(1, 300)).min(1).max(8),
    expandable: z.array(z.string()).max(8),
  }),
  story: line(200, 12000),
  cast: z.array(castMemberSchema).min(2).max(4),
  phases: z.array(lifePhaseSchema).min(1).max(4),
});

export const manuscriptSchema = storyBibleSchema
  .extend({
    version: z.literal(2),
    pages: z.array(bookPageSchema).length(BOOK_PAGE_COUNT),
  })
  .superRefine((manuscript, ctx) => {
    const indexes = new Set(manuscript.pages.map((page) => page.index));
    if (indexes.size !== BOOK_PAGE_COUNT) {
      ctx.addIssue({ code: 'custom', message: 'Os índices das páginas precisam ser únicos.', path: ['pages'] });
    }
    const phases = new Set(manuscript.phases.map((phase) => phase.id));
    for (const page of manuscript.pages) {
      if (page.role !== pageRole(page.index)) {
        ctx.addIssue({
          code: 'custom',
          message: `A página ${page.index} precisa ter o papel ${pageRole(page.index)}.`,
          path: ['pages'],
        });
      }
      if (!phases.has(page.visual.phase)) {
        ctx.addIssue({
          code: 'custom',
          message: `A página ${page.index} usa a fase "${page.visual.phase}", que não está em phases.`,
          path: ['pages'],
        });
      }
    }
  });

export type Manuscript = z.infer<typeof manuscriptSchema>;
export type StoryBible = z.infer<typeof storyBibleSchema>;
export type BookPage = z.infer<typeof bookPageSchema>;
export type PageBeat = z.infer<typeof pageBeatSchema>;
export type PageVisual = z.infer<typeof pageVisualSchema>;
export type CastMember = z.infer<typeof castMemberSchema>;
export type LifePhase = z.infer<typeof lifePhaseSchema>;
