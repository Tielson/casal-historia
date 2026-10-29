import type {
  FunnelStep,
  OccasionId,
  PageLayout,
  StoryModeId,
  StyleId,
  TextZone,
} from './constants';

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
  | 'needs_review'
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
  filmFinish?: boolean;
  storyMode?: StoryModeId | string | null;
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

/** One page as the reader sees it: the illustration and the text laid over it. */
export interface PageView {
  index: number;
  url: string;
  text: string;
  dialogue?: string[];
  layout: PageLayout;
  textZone: TextZone;
}

export interface PreviewPublic {
  id: string;
  draftId: string;
  stage: GenerationStage;
  coverUrl?: string | null;
  pageUrl?: string | null;
  coverText?: string | null;
  pageText?: string | null;
  /** Cover and the next pages, in order. */
  pages?: PageView[];
  title?: string | null;
  error?: string | null;
  storyMode?: StoryModeId | string | null;
  imagesMock?: boolean;
  updatedAt: string;
}
