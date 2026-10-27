'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from '@tanstack/react-query';
import { OCCASIONS, occasionSchema, type OccasionForm } from '@entre-nos/shared';
import { FunnelShell } from '@/components/FunnelShell';
import { ensureDraft, patchDraft } from '@/lib/api';

export default function OccasionPage() {
  const router = useRouter();
  const draftQuery = useQuery({ queryKey: ['draft'], queryFn: ensureDraft });
  const form = useForm<OccasionForm>({
    resolver: zodResolver(occasionSchema),
    values: {
      occasion: (draftQuery.data?.occasion as OccasionForm['occasion']) ?? 'namoro',
    },
  });

  const save = useMutation({
    mutationFn: async (values: OccasionForm) => {
      const draft = draftQuery.data ?? (await ensureDraft());
      return patchDraft(draft.token, { occasion: values.occasion, step: 'couple' });
    },
    onSuccess: () => router.push('/criar/casal'),
  });

  return (
    <FunnelShell
      step={1}
      title="Para qual ocasião?"
      subtitle="Escolha o motivo — o tom do livro se adapta ao que vocês celebram."
    >
      <form
        className="space-y-4"
        onSubmit={form.handleSubmit((v) => save.mutate(v))}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          {OCCASIONS.map((o) => {
            const selected = form.watch('occasion') === o.id;
            return (
              <label
                key={o.id}
                className={`cursor-pointer rounded-sm border px-4 py-5 transition ${
                  selected
                    ? 'border-champagne bg-champagne/10'
                    : 'border-white/15 hover:border-white/30'
                }`}
              >
                <input
                  type="radio"
                  className="sr-only"
                  value={o.id}
                  {...form.register('occasion')}
                />
                <span className="font-display text-xl text-mist">{o.short}</span>
                <span className="mt-1 block text-sm text-mist-dim">{o.label}</span>
              </label>
            );
          })}
        </div>
        {form.formState.errors.occasion ? (
          <p className="text-sm text-[var(--danger)]">
            {form.formState.errors.occasion.message}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={save.isPending}
          className="mt-4 rounded-md bg-champagne px-5 py-3 text-sm font-semibold text-ink disabled:opacity-60"
        >
          Continuar
        </button>
      </form>
    </FunnelShell>
  );
}
