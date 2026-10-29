import axios from 'axios';
import type { QueryClient } from '@tanstack/react-query';
import type { Draft } from '@/lib/api';

export const FUNNEL_PAGES = [
  { id: 'occasion', href: '/criar/ocasiao', label: 'Ocasião' },
  { id: 'couple', href: '/criar/casal', label: 'Casal' },
  { id: 'style', href: '/criar/estilo', label: 'Estilo' },
  { id: 'memories', href: '/criar/lembrancas', label: 'Lembranças' },
  { id: 'preview', href: '/criar/previa', label: 'Prévia' },
  { id: 'review', href: '/criar/revisao', label: 'Revisão' },
] as const;

export const PREVIEW_PAGE_INDEX = FUNNEL_PAGES.findIndex((page) => page.id === 'preview');

export function furthestPageIndex(step: string | null | undefined): number {
  if (!step) return 0;
  if (step === 'checkout' || step === 'production') return FUNNEL_PAGES.length - 1;
  const index = FUNNEL_PAGES.findIndex((page) => page.id === step);
  return index < 0 ? 0 : index;
}

export function reachedPreview(step: string | null | undefined) {
  return furthestPageIndex(step) >= PREVIEW_PAGE_INDEX;
}

export function hrefAfterEdit(step: string | null | undefined, nextHref: string) {
  return reachedPreview(step) ? '/criar/previa' : nextHref;
}

export function cacheDraft(queryClient: QueryClient, draft: Draft) {
  queryClient.setQueryData(['draft'], draft);
  queryClient.removeQueries({ queryKey: ['preview'] });
}

export function draftSaveError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { message?: string | string[] } | undefined;
    if (Array.isArray(data?.message)) return data.message.join(' ');
    if (typeof data?.message === 'string' && data.message.trim()) return data.message;
  }
  return 'Não foi possível salvar esta etapa.';
}
