'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  STORY_DIRECTION_KEY,
  STORY_DIRECTION_MAX,
  STORY_MODES,
  STORY_QUESTIONS,
  memoriesSchema,
  questionLabel,
  type MemoriesForm,
  type StoryModeId,
} from '@entre-nos/shared';
import { FunnelShell } from '@/components/FunnelShell';
import { ensureDraft, patchDraft } from '@/lib/api';
import { cacheDraft, draftSaveError, reachedPreview } from '@/lib/funnel';
import { trackFunnel } from '@/lib/meta';

const FIELD = 'w-full rounded-md border border-white/15 bg-ink-soft px-3 py-2 text-sm';

export default function MemoriesPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const draftQuery = useQuery({ queryKey: ['draft'], queryFn: ensureDraft });
  const answers = draftQuery.data?.memories?.answers ?? {};
  const names = draftQuery.data?.couple ?? {};
  const [customPlot, setCustomPlot] = useState<boolean | null>(null);
  const plotOn = customPlot ?? Boolean(answers[STORY_DIRECTION_KEY]?.trim());

  const form = useForm<MemoriesForm>({
    resolver: zodResolver(memoriesSchema),
    values: {
      answers: { ...answers },
      dedication: draftQuery.data?.memories?.dedication ?? '',
      storyMode: (draftQuery.data?.storyMode as StoryModeId | undefined) ?? 'inspired',
    },
  });
  const storyMode = form.watch('storyMode');
  const mode = STORY_MODES.find((item) => item.id === storyMode) ?? STORY_MODES[1];
  const questions = STORY_QUESTIONS[mode.id];
  const errors = form.formState.errors.answers as
    | Record<string, { message?: string } | undefined>
    | undefined;

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
    onSuccess: (updated) => {
      cacheDraft(queryClient, updated);
      router.push('/criar/previa');
    },
  });

  const submit = form.handleSubmit((values) => {
    const rumo = plotOn ? (values.answers[STORY_DIRECTION_KEY] ?? '').trim() : '';
    if (plotOn && rumo.length < 12) {
      form.setError(`answers.${STORY_DIRECTION_KEY}`, {
        message: 'Conte em uma frase como a história deve seguir, ou desligue a opção.',
      });
      return;
    }
    const kept: Record<string, string> = {};
    for (const question of questions) {
      kept[question.id] = (values.answers[question.id] ?? '').trim();
    }
    kept[STORY_DIRECTION_KEY] = rumo;
    save.mutate({ ...values, answers: kept });
  });

  return (
    <FunnelShell
      step={4}
      title="Lembranças"
      subtitle="Escolham o tipo de história. As perguntas mudam com ela."
    >
      <form className="space-y-6" onSubmit={submit}>
        <div className="space-y-3">
          <div
            role="radiogroup"
            aria-label="Tipo de história"
            className="flex gap-1 rounded-full border border-white/10 bg-ink-soft p-1"
          >
            {STORY_MODES.map((item) => {
              const selected = item.id === mode.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  title={item.name}
                  onClick={() => {
                    form.setValue('storyMode', item.id);
                    form.clearErrors('answers');
                  }}
                  className={`flex-1 rounded-full py-2 text-sm transition-colors ${
                    selected ? 'bg-blush-soft font-semibold text-ink' : 'font-medium text-mist-dim'
                  }`}
                >
                  {item.short}
                </button>
              );
            })}
          </div>
          <p className="font-display text-lg italic leading-6 text-champagne">{mode.hint}</p>
        </div>

        {questions.map((question) => {
          const id = `q-${question.id}`;
          const error = errors?.[question.id]?.message;
          return (
            <div key={`${mode.id}-${question.id}`}>
              <label id={id} htmlFor={question.kind === 'text' ? `${id}-input` : undefined} className="text-sm font-semibold">
                {questionLabel(question.label, names)}
                {question.required ? null : (
                  <span className="font-normal text-mist-dim"> (opcional)</span>
                )}
              </label>
              <p className="mt-1 text-xs italic text-mist-dim">{question.example}</p>
              {question.kind === 'choice' ? (
                <div role="radiogroup" aria-labelledby={id} className="mt-3 flex flex-wrap gap-2">
                  {question.options?.map((option) => {
                    const selected = form.watch(`answers.${question.id}`) === option;
                    return (
                      <button
                        key={option}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        onClick={() =>
                          form.setValue(`answers.${question.id}`, option, { shouldValidate: true })
                        }
                        className={`rounded-full px-4 py-2 text-sm transition-colors ${
                          selected
                            ? 'bg-blush-soft font-semibold text-ink'
                            : 'border border-white/20 text-mist'
                        }`}
                      >
                        {option}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <textarea
                  id={`${id}-input`}
                  rows={question.required ? 3 : 2}
                  className={`mt-2 ${FIELD}`}
                  {...form.register(`answers.${question.id}`)}
                />
              )}
              {error ? <p className="mt-1 text-xs text-[var(--danger)]">{error}</p> : null}
            </div>
          );
        })}

        <div className="rounded-md border border-white/15 px-4 py-3">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p id="plot-label" className="text-sm font-semibold text-champagne">
                {mode.id === 'adventure'
                  ? 'Quero dizer como a aventura se desenvolve'
                  : 'Quero dizer como a história se desenvolve'}
              </p>
              <p className="mt-1 text-sm text-mist-dim">
                {plotOn
                  ? 'Conte o rumo do enredo e a gente escreve em cima dele.'
                  : 'Desligado: a gente monta o enredo com as respostas acima.'}
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={plotOn}
              aria-labelledby="plot-label"
              onClick={() => {
                setCustomPlot(!plotOn);
                form.clearErrors(`answers.${STORY_DIRECTION_KEY}`);
              }}
              className={`relative mt-0.5 inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
                plotOn ? 'bg-blush' : 'bg-white/20'
              }`}
            >
              <span
                className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${
                  plotOn ? 'translate-x-5' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>
          {plotOn ? (
            <div className="mt-3">
              <textarea
                rows={4}
                maxLength={STORY_DIRECTION_MAX}
                aria-labelledby="plot-label"
                placeholder={
                  mode.id === 'adventure'
                    ? 'Ex.: Começa com um mapa roubado, os dois se perdem num mercado e terminam dançando no convés.'
                    : 'Ex.: Comece no dia em que se conheceram, passe pela primeira viagem e termine com os dois planejando a próxima.'
                }
                className={FIELD}
                {...form.register(`answers.${STORY_DIRECTION_KEY}`)}
              />
              {errors?.[STORY_DIRECTION_KEY]?.message ? (
                <p className="mt-1 text-xs text-[var(--danger)]">
                  {errors[STORY_DIRECTION_KEY]?.message}
                </p>
              ) : null}
            </div>
          ) : null}
        </div>

        <div>
          <label htmlFor="dedication" className="text-sm font-semibold">
            Dedicatória <span className="font-normal text-mist-dim">(opcional)</span>
          </label>
          <textarea
            id="dedication"
            rows={2}
            className="mt-2 w-full rounded-md border border-blush-soft/50 bg-ink-soft px-3 py-2 font-display text-lg italic text-champagne"
            {...form.register('dedication')}
          />
        </div>
        {save.isError ? (
          <p className="text-sm text-[var(--danger)]">{draftSaveError(save.error)}</p>
        ) : null}
        <button
          type="submit"
          disabled={save.isPending}
          className="rounded-md bg-champagne px-5 py-3 text-sm font-semibold text-ink"
        >
          {reachedPreview(draftQuery.data?.step) ? 'Salvar e ver a prévia' : 'Criar nossa prévia'}
        </button>
      </form>
    </FunnelShell>
  );
}
