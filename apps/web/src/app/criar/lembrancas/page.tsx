'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  MEMORY_QUESTIONS,
  memoriesSchema,
  type MemoriesForm,
} from '@entre-nos/shared';
import { FunnelShell } from '@/components/FunnelShell';
import { ensureDraft, patchDraft } from '@/lib/api';
import { trackFunnel } from '@/lib/meta';

export default function MemoriesPage() {
  const router = useRouter();
  const draftQuery = useQuery({ queryKey: ['draft'], queryFn: ensureDraft });
  const answers = draftQuery.data?.memories?.answers ?? {};

  const form = useForm<MemoriesForm>({
    resolver: zodResolver(memoriesSchema),
    values: {
      answers: {
        como_conheceram: answers.como_conheceram ?? '',
        momento_especial: answers.momento_especial ?? '',
        o_que_ama: answers.o_que_ama ?? '',
      },
      dedication: draftQuery.data?.memories?.dedication ?? '',
    },
  });

  const save = useMutation({
    mutationFn: async (values: MemoriesForm) => {
      const draft = draftQuery.data ?? (await ensureDraft());
      const updated = await patchDraft(draft.token, {
        memories: values,
        step: 'preview',
      });
      trackFunnel('memories_done', { draftId: updated.id });
      return updated;
    },
    onSuccess: () => router.push('/criar/previa'),
  });

  return (
    <FunnelShell
      step={4}
      title="Lembranças"
      subtitle="Três respostas curtas alimentam o texto. Não inventamos o que vocês não contarem."
    >
      <form className="space-y-6" onSubmit={form.handleSubmit((v) => save.mutate(v))}>
        {MEMORY_QUESTIONS.map((q) => (
          <div key={q.id}>
            <label className="text-sm font-medium">{q.label}</label>
            <p className="mt-1 text-xs text-mist-dim">{q.example}</p>
            <textarea
              rows={3}
              className="mt-2 w-full rounded-md border border-white/15 bg-ink-soft px-3 py-2 text-sm"
              {...form.register(`answers.${q.id}` as const)}
            />
            {form.formState.errors.answers?.[q.id as keyof MemoriesForm['answers']] ? (
              <p className="mt-1 text-xs text-[var(--danger)]">
                {
                  form.formState.errors.answers?.[
                    q.id as keyof MemoriesForm['answers']
                  ]?.message
                }
              </p>
            ) : null}
          </div>
        ))}
        <div>
          <label className="text-sm font-medium">Dedicatória (opcional)</label>
          <textarea
            rows={2}
            className="mt-2 w-full rounded-md border border-white/15 bg-ink-soft px-3 py-2 text-sm"
            {...form.register('dedication')}
          />
        </div>
        <button
          type="submit"
          disabled={save.isPending}
          className="rounded-md bg-champagne px-5 py-3 text-sm font-semibold text-ink"
        >
          Criar nossa prévia
        </button>
      </form>
    </FunnelShell>
  );
}
