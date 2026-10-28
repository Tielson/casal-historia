import axios from 'axios';

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

const TOKEN_KEY = 'en_draft_token';

export function getDraftToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setDraftToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

api.interceptors.request.use((config) => {
  const token = getDraftToken();
  if (token) {
    config.headers['x-draft-token'] = token;
  }
  return config;
});

export type Draft = {
  id: string;
  token: string;
  step: string;
  status: string;
  occasion?: string | null;
  couple?: {
    nameA?: string | null;
    nameB?: string | null;
    photoAKey?: string | null;
    photoBKey?: string | null;
    photoTogetherKey?: string | null;
    photoAUrl?: string | null;
    photoBUrl?: string | null;
    photoTogetherUrl?: string | null;
    startDate?: string | null;
    photoConsent?: boolean;
  } | null;
  styleId?: string | null;
  memories?: {
    answers?: Record<string, string>;
    dedication?: string | null;
  } | null;
  email?: string | null;
  previewRegenCount: number;
  previewApproved: boolean;
  orderId?: string | null;
  manageToken?: string | null;
  giftToken?: string | null;
};

export async function ensureDraft(): Promise<Draft> {
  const existing = getDraftToken();
  if (existing) {
    try {
      const { data } = await api.get<Draft>(`/drafts/${existing}`);
      return data;
    } catch {
      // recreate
    }
  }
  const { data } = await api.post<Draft>('/drafts');
  setDraftToken(data.token);
  return data;
}

export async function patchDraft(token: string, body: Record<string, unknown>) {
  const { data } = await api.patch<Draft>(`/drafts/${token}`, body);
  return data;
}
