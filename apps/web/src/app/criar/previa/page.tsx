'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from '@tanstack/react-query';
import { FunnelShell } from '@/components/FunnelShell';
import { api, ensureDraft } from '@/lib/api';

type Preview = {
  stage: string;
  coverUrl?: string | null;
  pageUrl?: string | null;
  coverText?: string | null;
  pageText?: string | null;
  error?: string | null;
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

export default function PreviewPage() {
  const router = useRouter();
  const draftQuery = useQuery({ queryKey: ['draft'], queryFn: ensureDraft });
  const [started, setStarted] = useState(false);

  const previewQuery = useQuery({
    queryKey: ['preview', draftQuery.data?.token],
    enabled: Boolean(draftQuery.data?.token) && started,
    queryFn: async () => {
      const { data } = await api.get<Preview>(`/preview/${draftQuery.data!.token}`);
      return data;
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
      const { data } = await api.post<Preview>(
        `/preview/${draft.token}/start${regen ? '?regen=1' : ''}`,
      );
      return data;
    },
    onSuccess: () => {
      setStarted(true);
      void previewQuery.refetch();
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
    if (draftQuery.data && !started && !start.isPending) {
      start.mutate(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftQuery.data?.token]);

  const preview = previewQuery.data;
  const stage = preview?.stage ?? 'queued';

  return (
    <FunnelShell
      step={5}
      title="Sua prévia"
      subtitle="Capa + uma página interna. Exemplos gerados a partir do que vocês enviaram."
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

      {preview?.error ? (
        <p className="mb-4 text-sm text-[var(--danger)]">{preview.error}</p>
      ) : null}

      {stage === 'ready' ? (
        <div className="grid gap-6 md:grid-cols-2">
          <figure>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview?.coverUrl ?? ''}
              alt="Capa da prévia"
              className="w-full rounded-sm"
            />
            <figcaption className="mt-2 whitespace-pre-wrap text-sm text-mist-dim">
              {preview?.coverText}
            </figcaption>
          </figure>
          <figure>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview?.pageUrl ?? ''}
              alt="Página interna da prévia"
              className="w-full rounded-sm"
            />
            <figcaption className="mt-2 whitespace-pre-wrap text-sm text-mist-dim">
              {preview?.pageText}
            </figcaption>
          </figure>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          <div className="aspect-[3/4] animate-pulse rounded-sm bg-white/5" />
          <div className="aspect-[3/4] animate-pulse rounded-sm bg-white/5" />
        </div>
      )}

      <div className="mt-8 flex flex-wrap gap-3">
        {stage === 'ready' ? (
          <button
            type="button"
            onClick={() => approve.mutate()}
            className="rounded-md bg-champagne px-5 py-3 text-sm font-semibold text-ink"
          >
            Preparar meu presente
          </button>
        ) : null}
        {(stage === 'ready' || stage === 'failed') &&
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
