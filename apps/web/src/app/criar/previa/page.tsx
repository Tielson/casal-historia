'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { STORY_MODE_NOTICE, type StoryModeId } from '@entre-nos/shared';
import { FunnelShell } from '@/components/FunnelShell';
import { api, ensureDraft, type Draft } from '@/lib/api';

type Preview = {
  stage: string;
  coverUrl?: string | null;
  pageUrl?: string | null;
  coverText?: string | null;
  pageText?: string | null;
  error?: string | null;
  storyMode?: string | null;
  imagesMock?: boolean;
  maxRegens?: number;
};

const STAGE_LABEL: Record<string, string> = {
  queued: 'Na fila…',
  writing: 'Escrevendo o texto…',
  illustrating: 'Ilustrando as cenas…',
  layout: 'Montando o layout…',
  ready: 'Prévia pronta',
  failed: 'Falhou — você pode tentar de novo',
};

function isFrozenPreviewError(err: unknown) {
  if (!axios.isAxiosError(err) || err.response?.status !== 400) return false;
  const message = (err.response.data as { message?: string } | undefined)?.message ?? '';
  return message.includes('congelados');
}

function errorMessage(err: unknown) {
  if (axios.isAxiosError(err)) {
    const message = (err.response?.data as { message?: string } | undefined)?.message;
    if (message) return message;
  }
  return 'Não foi possível gerar a prévia.';
}

export default function PreviewPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const draftQuery = useQuery({ queryKey: ['draft'], queryFn: ensureDraft });
  const token = draftQuery.data?.token;
  const approved = Boolean(draftQuery.data?.previewApproved);
  const kickedFor = useRef<string | null>(null);

  const previewQuery = useQuery({
    queryKey: ['preview', token],
    enabled: Boolean(token),
    queryFn: async () => {
      try {
        const { data } = await api.get<Preview>(`/preview/${token}`);
        return data;
      } catch (err) {
        if (axios.isAxiosError(err) && err.response?.status === 404) return null;
        throw err;
      }
    },
    refetchInterval: (q) => {
      const stage = q.state.data?.stage;
      if (!stage || stage === 'ready' || stage === 'failed') return false;
      return 800;
    },
  });

  const start = useMutation({
    mutationFn: async (regen: boolean) => {
      const draft = draftQuery.data ?? (await ensureDraft());
      if (draft.previewApproved && !regen) {
        const { data } = await api.get<Preview>(`/preview/${draft.token}`);
        return data;
      }
      try {
        const { data } = await api.post<Preview>(
          `/preview/${draft.token}/start${regen ? '?regen=1' : ''}`,
        );
        return data;
      } catch (err) {
        if (!isFrozenPreviewError(err)) throw err;
        queryClient.setQueryData<Draft>(['draft'], (current) =>
          current ? { ...current, previewApproved: true } : current,
        );
        const { data } = await api.get<Preview>(`/preview/${draft.token}`);
        return data;
      }
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['preview', token], data);
    },
  });

  const approve = useMutation({
    mutationFn: async () => {
      const draft = draftQuery.data ?? (await ensureDraft());
      await api.post(`/preview/${draft.token}/approve`);
    },
    onSuccess: () => router.push('/criar/revisao'),
  });

  useEffect(() => {
    if (!token || approved || start.isPending) return;
    if (!previewQuery.isFetched || previewQuery.isError) return;
    const existing = previewQuery.data;
    if (existing && existing.stage !== 'failed') return;
    if (kickedFor.current === token) return;
    kickedFor.current = token;
    start.mutate(false);
  }, [
    token,
    approved,
    previewQuery.isFetched,
    previewQuery.isError,
    previewQuery.data,
    start.isPending,
    start,
  ]);

  const preview = previewQuery.data;
  const stage = preview?.stage ?? 'queued';
  const storyMode = (preview?.storyMode ??
    draftQuery.data?.storyMode ??
    'inspired') as StoryModeId;
  const modeNotice = STORY_MODE_NOTICE[storyMode] ?? STORY_MODE_NOTICE.inspired;

  return (
    <FunnelShell
      step={5}
      title="Sua prévia"
      subtitle="Capa e a cena central, com o texto ao lado da ilustração para você ler no celular."
    >
      <div className="mb-6 rounded-sm border border-white/10 bg-ink-soft px-4 py-3">
        <p className="text-sm text-champagne">{STAGE_LABEL[stage] ?? stage}</p>
        {draftQuery.data ? (
          <p className="mt-1 text-xs text-mist-dim">
            Regenerações: {draftQuery.data.previewRegenCount} /{' '}
            {preview?.maxRegens ?? 3}
          </p>
        ) : null}
      </div>

      {approved ? (
        <p className="mb-4 text-sm text-mist">
          Prévia aprovada. As ilustrações ficam congeladas — siga para a revisão do presente.
        </p>
      ) : null}

      {preview?.error ? (
        <p className="mb-4 text-sm text-[var(--danger)]">{preview.error}</p>
      ) : null}

      {start.isError ? (
        <p className="mb-4 text-sm text-[var(--danger)]">{errorMessage(start.error)}</p>
      ) : null}

      {previewQuery.isError ? (
        <p className="mb-4 text-sm text-[var(--danger)]">{errorMessage(previewQuery.error)}</p>
      ) : null}

      {stage === 'ready' ? (
        <div className="mb-6 space-y-3">
          <p className="text-sm text-mist">{modeNotice}</p>
          {preview?.imagesMock ? (
            <p className="rounded-sm border border-white/15 bg-white/5 px-4 py-3 text-sm text-mist-dim">
              Ilustração local de desenvolvimento. Ela mostra o casal em silhueta, sem o modelo de
              imagem. O texto já é a história, separado da figura.
            </p>
          ) : (
            <p className="text-sm text-mist-dim">
              A capa e a cena central usam as fotos como referência. O texto fica fora da imagem.
            </p>
          )}
        </div>
      ) : null}

      {stage === 'ready' ? (
        <div className="grid gap-8 md:grid-cols-2">
          <figure>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview?.coverUrl ?? ''}
              alt="Capa ilustrada do casal"
              className="w-full rounded-sm"
            />
            <figcaption className="mt-4 whitespace-pre-wrap text-base leading-7 text-mist">
              {preview?.coverText}
            </figcaption>
          </figure>
          <figure>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview?.pageUrl ?? ''}
              alt="Cena central do casal"
              className="w-full rounded-sm"
            />
            <figcaption className="mt-4 whitespace-pre-wrap text-base leading-7 text-mist">
              {preview?.pageText}
            </figcaption>
          </figure>
        </div>
      ) : start.isError || previewQuery.isError ? null : (
        <div className="grid gap-4 md:grid-cols-2">
          <div className="aspect-[3/4] animate-pulse rounded-sm bg-white/5" />
          <div className="aspect-[3/4] animate-pulse rounded-sm bg-white/5" />
        </div>
      )}

      <div className="mt-8 flex flex-wrap gap-3">
        {approved ? (
          <Link
            href="/criar/revisao"
            className="rounded-md bg-champagne px-5 py-3 text-sm font-semibold text-ink"
          >
            Continuar para a revisão
          </Link>
        ) : stage === 'ready' ? (
          <button
            type="button"
            onClick={() => approve.mutate()}
            className="rounded-md bg-champagne px-5 py-3 text-sm font-semibold text-ink"
          >
            Preparar meu presente
          </button>
        ) : null}
        {!approved &&
        (stage === 'ready' || stage === 'failed') &&
        (draftQuery.data?.previewRegenCount ?? 0) < (preview?.maxRegens ?? 3) ? (
          <button
            type="button"
            onClick={() => start.mutate(true)}
            className="rounded-md border border-white/20 px-5 py-3 text-sm"
          >
            Gerar de novo
          </button>
        ) : null}
        <Link href="/criar/lembrancas" className="px-3 py-3 text-sm text-mist-dim underline">
          Editar lembranças
        </Link>
      </div>
    </FunnelShell>
  );
}
