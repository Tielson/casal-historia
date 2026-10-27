import { z } from 'zod';

/** Internal funnel analytics (server + client). */
export const FUNNEL_EVENTS = [
  'visit',
  'create_started',
  'photos_uploaded',
  'style_chosen',
  'memories_done',
  'preview_ready',
  'checkout',
  'payment',
  'delivery',
] as const;

export type FunnelEventName = (typeof FUNNEL_EVENTS)[number];

export const funnelEventSchema = z.object({
  name: z.enum(FUNNEL_EVENTS),
  draftId: z.string().optional(),
  orderId: z.string().optional(),
  meta: z.record(z.unknown()).optional(),
  clientId: z.string().optional(),
  path: z.string().optional(),
});

export type FunnelEventPayload = z.infer<typeof funnelEventSchema>;

/** Meta Pixel / CAPI standard events used in MVP */
export const META_EVENTS = ['ViewContent', 'InitiateCheckout', 'Purchase'] as const;
export type MetaEventName = (typeof META_EVENTS)[number];
