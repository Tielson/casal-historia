import type { BookPage, CastMember, LifePhase, StoryModeId, StyleId, TextZone } from '@entre-nos/shared';
import { isYouthPhase } from './book-quality';

/** Life events nobody told us about stay out of every book, adventure included. */
const BASE_NEGATIVE = [
  'text, letters, typography, watermark, logo, signature, frame border, split screen, collage,',
  'extra fingers, deformed hands, extra limbs, duplicate faces, uncanny eyes,',
  'wedding dress, bridal veil, engagement ring close-up, pregnancy, baby, small children,',
  'nsfw, erotic, violence, horror, gore',
].join(' ');

/** An adventure may travel; real and inspired books stay where the couple has been. */
const TRAVEL_NEGATIVE = 'passport, airplane cabin, luxury yacht, invented landmarks';

/** Photos win over any trait the story or the wish wrote down. */
const PHOTO_IDENTITY = [
  'Likeness: each person is the person in their own photo. Copy that face so they stay recognizable.',
  "Skin tone comes only from that person's photo and stays exact: do not lighten, darken, warm, cool, or mix the two tones.",
  'A written trait, wish, costume or age note may change clothes, hair length and how young they look. It never changes skin tone. If the text names a skin color, ignore it.',
].join(' ');

export interface StylePack {
  positive: string;
  negative: string;
}

/** Each style is a different visual language, kept the same across the whole book. */
export const STYLE_PACKS: Record<StyleId, StylePack> = {
  desenho: {
    positive: [
      'Romantic 2D storybook illustration, delicate clean linework, soft cel shading,',
      'recognizable characters with consistent proportions, fully illustrated backgrounds,',
      'gentle pastel palette with one warm accent, picture-book composition.',
    ].join(' '),
    negative: 'photoreal, 3D render, heavy grunge, harsh black shadows, anime chibi proportions',
  },
  caricatura: {
    positive: [
      'Affectionate caricature illustration, gently exaggerated features that stay recognizable,',
      'big expressive eyes and faces, playful body language, warm humor,',
      'bold clean shapes, bright friendly colors, illustrated background with the same exaggeration.',
    ].join(' '),
    negative: 'mean or grotesque exaggeration, photoreal, horror, realistic skin pores',
  },
  animacao: {
    positive: [
      '3D animated feature film still, soft rounded forms, stylized proportions,',
      'subsurface scattering on skin, soft global illumination, cinematic lighting,',
      'rich detailed set, shallow depth of field, warm and cozy color script.',
    ].join(' '),
    negative: 'flat 2D, photoreal humans, plastic toy look, uncanny realistic faces, low-poly',
  },
  aquarela: {
    positive: [
      'Romantic watercolor painting on textured cold-press paper,',
      'delicate translucent washes, soft pigment blooms, wet-on-wet edges,',
      'dusty rose, warm beige, soft blush, muted sage, visible paper tooth, painted backgrounds.',
    ].join(' '),
    negative: 'digital hard outlines, neon, photoreal skin, comic ink, heavy black shadows',
  },
  quadrinhos: {
    positive: [
      'Single comic book panel art, confident ink lines, flat cel shading with halftone texture,',
      'dynamic staging and clear action, bold readable silhouettes,',
      'graphic-novel color palette, one moment of a sequential story.',
    ].join(' '),
    negative: 'speech balloons, lettering, sound effects text, multi-panel grid, photoreal, watercolor bleeds',
  },
  cinema: {
    positive: [
      'Cinematic photorealistic film still, natural skin texture, motivated practical lighting,',
      'anamorphic framing, shallow depth of field, real locations, candid action,',
      'subtle color grade, characters caught in the middle of the moment, not posing.',
    ].join(' '),
    negative: 'illustration, cartoon, 3D render, beauty-filter plastic skin, stock-photo posing, HDR',
  },
};

export const FILM_FINISH_PROMPT = [
  'Finish: vintage film look over the art style,',
  'warm tungsten highlights, gentle film grain, soft vignette, slightly faded amber color.',
].join(' ');

const SHOT_PROMPT: Record<BookPage['visual']['shot'], string> = {
  wide: 'Framing: wide establishing shot; the place is as important as the people, who appear full body and smaller in frame.',
  medium: 'Framing: medium shot from the waist up, both bodies and the interaction readable.',
  close: 'Framing: close shot on faces and hands, emotion first, background soft.',
  detail: 'Framing: detail close-up of the object or gesture named in the action; faces may be out of frame.',
};

const ZONE_PROMPT: Record<TextZone, string> = {
  top: 'the top 30% of the image',
  bottom: 'the bottom 30% of the image',
  left: 'the left 42% of the image',
  right: 'the right 42% of the image',
};

export interface ScenePromptInput {
  styleId: string;
  filmFinish?: boolean;
  storyMode: StoryModeId;
  page: Pick<BookPage, 'visual'>;
  cast: CastMember[];
  phases: LifePhase[];
  names: { nameA: string; nameB: string };
  hasTogether: boolean;
}

export function stylePack(styleId: string): StylePack {
  return STYLE_PACKS[styleId as StyleId] ?? STYLE_PACKS.desenho;
}

function lookOf(name: string, cast: CastMember[], phase: LifePhase | undefined): string {
  const base = cast.find((member) => member.name.trim().toLowerCase() === name.trim().toLowerCase())?.look;
  const then = phase
    ? Object.entries(phase.looks).find(([key]) => key.trim().toLowerCase() === name.trim().toLowerCase())?.[1]
    : undefined;
  return [then, base].filter(Boolean).join('; ');
}

function characterLock(input: ScenePromptInput, phase: LifePhase | undefined): string {
  const { nameA, nameB } = input.names;
  const age = phase ? `about ${phase.age} (${phase.label})` : 'their present age';
  const youth = isYouthPhase(phase);
  return [
    `Characters: ${nameA} and ${nameB}. The first image is the character sheet in this art style; the next references are photos of ${nameA}, then ${nameB}${input.hasTogether ? ', then the two together' : ''}.`,
    PHOTO_IDENTITY,
    `In this scene depict both at ${age}.`,
    youth
      ? 'They are teenagers here. The references show them as adults today, so make both visibly younger: smooth teenage faces with no beard or stubble, slimmer teen builds, age-appropriate casual clothes, while keeping hair, skin tone and features recognizable. A wholesome moment with no romantic physical contact.'
      : '',
    `${nameA}, clothes and age only: ${lookOf(nameA, input.cast, phase) || 'as in the reference photo'}.`,
    `${nameB}, clothes and age only: ${lookOf(nameB, input.cast, phase) || 'as in the reference photo'}.`,
  ]
    .filter(Boolean)
    .join(' ');
}

function stagingPrompt(input: ScenePromptInput): string {
  const { nameA, nameB } = input.names;
  switch (input.page.visual.staging) {
    case 'together':
      return `Both ${nameA} and ${nameB} are in the same place, interacting, caught mid-action rather than posing for the camera.`;
    case 'apart':
      return `${nameA} and ${nameB} are far apart, each alone in their own place; one continuous image whose composition shows the two separate places side by side, connected only by the light or the object in the action. They do not touch or look at each other.`;
    case 'solo_a':
      return `Only ${nameA} appears, alone in their own place. ${nameB} is not in the image.`;
    case 'solo_b':
      return `Only ${nameB} appears, alone in their own place. ${nameA} is not in the image.`;
    case 'detail':
      return 'A detail scene: the object or gesture fills the frame; people appear only partially, if at all.';
  }
}

export function buildScenePrompt(input: ScenePromptInput): string {
  const pack = stylePack(input.styleId);
  const visual = input.page.visual;
  const phase = input.phases.find((item) => item.id === visual.phase);
  const negative = input.storyMode === 'adventure' ? BASE_NEGATIVE : `${BASE_NEGATIVE}, ${TRAVEL_NEGATIVE}`;
  return [
    pack.positive,
    input.filmFinish ? FILM_FINISH_PROMPT : '',
    characterLock(input, phase),
    `Wardrobe: ${visual.wardrobe}.`,
    `Place and time: ${visual.location}, ${visual.time}.`,
    `Action: ${visual.action}. Expression: ${visual.expression}.`,
    SHOT_PROMPT[visual.shot],
    stagingPrompt(input),
    `Text area: compose so that ${ZONE_PROMPT[visual.textZone]} falls on a naturally quiet part of the scene (sky, wall, floor, table, soft light) with no faces, hands or key objects, because text is laid over it later. The scene keeps going there with the same style, texture and light: never a blank band, fog, blur or fade.`,
    'Full-bleed portrait page: the scene reaches every edge; keep faces away from the top and bottom 6%, which may be trimmed.',
    'Phone and laptop screens show only abstract shapes and bubbles, never readable text.',
    'Absolutely no text, letters, logos, watermarks, signatures, or page numbers.',
    `Avoid: ${pack.negative}. ${negative}`,
  ]
    .filter(Boolean)
    .join('\n');
}

/** One reference of both characters in the chosen style, reused by every page. */
export function characterSheetPrompt(input: {
  styleId: string;
  filmFinish?: boolean;
  cast: CastMember[];
  names: { nameA: string; nameB: string };
  hasTogether: boolean;
}): string {
  const pack = stylePack(input.styleId);
  const { nameA, nameB } = input.names;
  return [
    pack.positive,
    input.filmFinish ? FILM_FINISH_PROMPT : '',
    `Character reference sheet of ${nameA} (first photo) and ${nameB} (second photo)${input.hasTogether ? '; the third photo shows them together' : ''}.`,
    'Each person appears full body, front view and three-quarter view, standing side by side on a plain light background.',
    'Translate their real faces, hair, skin tone and build into this art style so they stay recognizable.',
    PHOTO_IDENTITY,
    `${nameA}, clothes and age only: ${lookOf(nameA, input.cast, undefined) || 'as in the photo'}.`,
    `${nameB}, clothes and age only: ${lookOf(nameB, input.cast, undefined) || 'as in the photo'}.`,
    'Neutral friendly expressions, everyday clothes. No scenery, no props.',
    'Absolutely no text, labels, names, letters or color swatches.',
    `Avoid: ${pack.negative}. ${BASE_NEGATIVE}`,
  ]
    .filter(Boolean)
    .join('\n');
}
