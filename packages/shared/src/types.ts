import type { OccasionId, StyleId, FunnelStep } from './constants';

export type DraftStatus =
  | 'draft'
  | 'previewing'
  | 'preview_ready'
  | 'approved'
  | 'checkout'
  | 'paid'
  | 'producing'
  | 'delivered'
  | 'failed';

export type OrderStatus =
  | 'pending_payment'
  | 'paid'
  | 'producing'
  | 'delivered'
  | 'refunded'
  | 'cancelled';

export type GenerationStage =
  | 'queued'
  | 'writing'
  | 'illustrating'
  | 'layout'
  | 'ready'
  | 'failed';

export interface DraftPublic {
  id: string;
  token: string;
  step: FunnelStep | string;
  status: DraftStatus;
  occasion?: OccasionId | string | null;
  couple?: {
    nameA?: string | null;
    nameB?: string | null;
    photoAKey?: string | null;
    photoBKey?: string | null;
    photoTogetherKey?: string | null;
    startDate?: string | null;
    photoConsent?: boolean;
  } | null;
  styleId?: StyleId | string | null;
  memories?: {
    answers?: Record<string, string>;
    dedication?: string | null;
  } | null;
  email?: string | null;
  previewRegenCount: number;
  previewApproved: boolean;
  orderId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PreviewPublic {
  id: string;
  draftId: string;
  stage: GenerationStage;
  coverUrl?: string | null;
  pageUrl?: string | null;
  coverText?: string | null;
  pageText?: string | null;
  error?: string | null;
  updatedAt: string;
}
