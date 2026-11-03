'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  DEFAULT_STYLE_ID,
  FILM_FINISH,
  STYLES,
  STYLE_IDS,
  styleSchema,
  type StyleForm,
} from '@entre-nos/shared';
import { FunnelShell } from '@/components/FunnelShell';
import { StyleSample } from '@/components/StyleSample';
import { ensureDraft, patchDraft } from '@/lib/api';
import { cacheDraft, draftSaveError, hrefAfterEdit, reachedPreview } from '@/lib/funnel';
import { trackFunnel } from '@/lib/meta';

function knownStyle(id: string | null | undefined): StyleForm['styleId'] {
  return (STYLE_IDS as readonly string[]).includes(id ?? '') ? (id as StyleForm['styleId']) : DEFAULT_STYLE_ID;
}

export default function StylePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const draftQuery = useQuery({ queryKey: ['draft'], queryFn: ensureDraft });
  const form = useForm<StyleForm>({
    resolver: zodResolver(styleSchema),
    values: {
      styleId: knownStyle(draftQuery.data?.styleId),
      filmFinish: Boolean(draftQuery.data?.filmFinish),
    },
  });

  const save = useMutation({
    mutationFn: async (values: StyleForm) => {
      const draft = draftQuery.data ?? (await ensureDraft());
      const updated = await patchDraft(draft.token, {
        styleId: values.styleId,
        filmFinish: values.filmFinish,
        step: 'memories',
      });
      trackFunnel('style_chosen', {
        draftId: updated.id,
        meta: { styleId: values.styleId, filmFinish: values.filmFinish },
      });
      return updated;
    },
    onSuccess: (updated) => {
      cacheDraft(queryClient, updated);
      router.push(hrefAfterEdit(draftQuery.data?.step, '/criar/lembrancas'));
    },
  });

  return (
    <FunnelShell
      step={3}
      title="Escolham o estilo"
      subtitle="O estilo muda a linguagem do livro inteiro: traço, cor e luz. Os exemplos são ilustrativos."
    >
      <form className="space-y-5" onSubmit={form.handleSubmit((v) => save.mutate(v))}>
        <div className="grid gap-4 sm:grid-cols-2">
          {STYLES.map((style) => {
            const selected = form.watch('styleId') === style.id;
            return (
              <label
                key={style.id}
                className={`cursor-pointer overflow-hidden rounded-sm border-2 ${
                  selected ? 'border-blush' : 'border-white/15'
                }`}
              >
                <input
                  type="radio"
                  className="sr-only"
                  value={style.id}
                  {...form.register('styleId')}
                />
                <div className="relative aspect-[3/4]">
                  <StyleSample id={style.id} name={style.name} />
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
        <label className="flex cursor-pointer items-start gap-3 rounded-sm border border-white/15 p-4">
          <input type="checkbox" className="mt-1 h-4 w-4 accent-[var(--color-blush,#f2b6c1)]" {...form.register('filmFinish')} />
          <span>
            <span className="block text-sm font-semibold">{FILM_FINISH.name}</span>
            <span className="mt-1 block text-xs text-mist-dim">{FILM_FINISH.description}</span>
          </span>
        </label>
        {save.isError ? (
          <p className="text-sm text-[var(--danger)]">{draftSaveError(save.error)}</p>
        ) : null}
        <button
          type="submit"
          disabled={save.isPending}
          className="rounded-md bg-champagne px-5 py-3 text-sm font-semibold text-ink"
        >
          {reachedPreview(draftQuery.data?.step)
            ? 'Salvar e voltar à prévia'
            : 'Quero nossa história assim'}
        </button>
      </form>
    </FunnelShell>
  );
}
