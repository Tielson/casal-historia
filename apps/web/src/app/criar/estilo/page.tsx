'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from '@tanstack/react-query';
import { STYLES, styleSchema, type StyleForm } from '@entre-nos/shared';
import { FunnelShell } from '@/components/FunnelShell';
import { ensureDraft, patchDraft } from '@/lib/api';
import { trackFunnel } from '@/lib/meta';

const STYLE_PREVIEW: Record<string, string> = {
  aquarela: '/cute/cute-couple-cover.jpg',
  editorial: '/styles/editorial.svg',
  linha: '/styles/linha.svg',
  filme: '/cute/cute-rain-walk.jpg',
  noturno: '/styles/noturno.svg',
  papel: '/styles/papel.svg',
};

export default function StylePage() {
  const router = useRouter();
  const draftQuery = useQuery({ queryKey: ['draft'], queryFn: ensureDraft });
  const form = useForm<StyleForm>({
    resolver: zodResolver(styleSchema),
    values: {
      styleId: (draftQuery.data?.styleId as StyleForm['styleId']) ?? 'editorial',
    },
  });

  const save = useMutation({
    mutationFn: async (values: StyleForm) => {
      const draft = draftQuery.data ?? (await ensureDraft());
      const updated = await patchDraft(draft.token, {
        styleId: values.styleId,
        step: 'memories',
      });
      trackFunnel('style_chosen', {
        draftId: updated.id,
        meta: { styleId: values.styleId },
      });
      return updated;
    },
    onSuccess: () => router.push('/criar/lembrancas'),
  });

  return (
    <FunnelShell
      step={3}
      title="Escolham o estilo"
      subtitle="Exemplos ilustrativos — pastéis, corações e doodles. Não são o livro final."
    >
      <form className="space-y-5" onSubmit={form.handleSubmit((v) => save.mutate(v))}>
        <div className="grid gap-4 sm:grid-cols-2">
          {STYLES.map((style) => {
            const selected = form.watch('styleId') === style.id;
            return (
              <label
                key={style.id}
                className={`cursor-pointer overflow-hidden rounded-sm border ${
                  selected ? 'border-blush-soft' : 'border-white/15'
                }`}
              >
                <input
                  type="radio"
                  className="sr-only"
                  value={style.id}
                  {...form.register('styleId')}
                />
                <div className="relative aspect-[3/4]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={STYLE_PREVIEW[style.id] ?? `/styles/${style.id}.svg`}
                    alt={`Exemplo ${style.name}`}
                    className="h-full w-full object-cover"
                  />
                  <span className="absolute left-2 top-2 bg-ink/70 px-2 py-0.5 text-[10px] uppercase tracking-wider text-champagne">
                    Exemplo
                  </span>
                </div>
                <div className="p-3">
                  <p className="font-display text-lg">{style.name}</p>
                  <p className="mt-1 text-xs text-mist-dim">{style.description}</p>
                </div>
              </label>
            );
          })}
        </div>
        <button
          type="submit"
          disabled={save.isPending}
          className="rounded-md bg-champagne px-5 py-3 text-sm font-semibold text-ink"
        >
          Quero nossa história assim
        </button>
      </form>
    </FunnelShell>
  );
}
