'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from '@tanstack/react-query';
import { coupleSchema, type CoupleForm } from '@entre-nos/shared';
import { FunnelShell } from '@/components/FunnelShell';
import { PhotoUploader } from '@/components/PhotoUploader';
import { ensureDraft, patchDraft } from '@/lib/api';
import { trackFunnel } from '@/lib/meta';

export default function CouplePage() {
  const router = useRouter();
  const draftQuery = useQuery({ queryKey: ['draft'], queryFn: ensureDraft });
  const draft = draftQuery.data;

  const form = useForm<CoupleForm>({
    resolver: zodResolver(coupleSchema),
    values: {
      nameA: draft?.couple?.nameA ?? '',
      nameB: draft?.couple?.nameB ?? '',
      photoAKey: draft?.couple?.photoAKey ?? '',
      photoBKey: draft?.couple?.photoBKey ?? '',
      photoTogetherKey: draft?.couple?.photoTogetherKey ?? '',
      startDate: draft?.couple?.startDate ?? '',
      photoConsent: draft?.couple?.photoConsent ? true : (undefined as unknown as true),
    },
  });

  const save = useMutation({
    mutationFn: async (values: CoupleForm) => {
      const d = draft ?? (await ensureDraft());
      const updated = await patchDraft(d.token, {
        couple: values,
        step: 'style',
      });
      trackFunnel('photos_uploaded', { draftId: updated.id });
      return updated;
    },
    onSuccess: () => router.push('/criar/estilo'),
  });

  if (!draft) {
    return (
      <FunnelShell step={2} title="Sobre vocês">
        <p className="text-mist-dim">Carregando…</p>
      </FunnelShell>
    );
  }

  return (
    <FunnelShell
      step={2}
      title="Sobre vocês"
      subtitle="Nomes e uma foto de cada pessoa. Foto juntos é opcional. Data de início também."
    >
      <form className="space-y-6" onSubmit={form.handleSubmit((v) => save.mutate(v))}>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-sm">Nome da pessoa A</label>
            <input
              className="mt-1 w-full rounded-md border border-white/15 bg-ink-soft px-3 py-2"
              {...form.register('nameA')}
            />
            {form.formState.errors.nameA ? (
              <p className="mt-1 text-xs text-[var(--danger)]">
                {form.formState.errors.nameA.message}
              </p>
            ) : null}
          </div>
          <div>
            <label className="text-sm">Nome da pessoa B</label>
            <input
              className="mt-1 w-full rounded-md border border-white/15 bg-ink-soft px-3 py-2"
              {...form.register('nameB')}
            />
            {form.formState.errors.nameB ? (
              <p className="mt-1 text-xs text-[var(--danger)]">
                {form.formState.errors.nameB.message}
              </p>
            ) : null}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <PhotoUploader
            label="Foto da pessoa A"
            hint="obrigatória"
            required
            token={draft.token}
            slot="a"
            valueKey={form.watch('photoAKey')}
            valueUrl={draft.couple?.photoAUrl}
            onUploaded={(key) => form.setValue('photoAKey', key, { shouldValidate: true })}
          />
          <PhotoUploader
            label="Foto da pessoa B"
            hint="obrigatória"
            required
            token={draft.token}
            slot="b"
            valueKey={form.watch('photoBKey')}
            valueUrl={draft.couple?.photoBUrl}
            onUploaded={(key) => form.setValue('photoBKey', key, { shouldValidate: true })}
          />
        </div>

        <PhotoUploader
          label="Foto juntos"
          hint="opcional"
          token={draft.token}
          slot="together"
          valueKey={form.watch('photoTogetherKey')}
          valueUrl={draft.couple?.photoTogetherUrl}
          onUploaded={(key) =>
            form.setValue('photoTogetherKey', key, { shouldValidate: true })
          }
        />

        <div>
          <label className="text-sm">Desde quando? (opcional)</label>
          <input
            type="date"
            className="mt-1 w-full rounded-md border border-white/15 bg-ink-soft px-3 py-2"
            {...form.register('startDate')}
          />
        </div>

        <label className="flex items-start gap-3 text-sm text-mist-dim">
          <input
            type="checkbox"
            className="mt-1"
            checked={Boolean(form.watch('photoConsent'))}
            onChange={(e) =>
              form.setValue('photoConsent', e.target.checked as true, {
                shouldValidate: true,
              })
            }
          />
          <span>
            Autorizo o uso dessas fotos apenas para gerar o livro personalizado de vocês.
          </span>
        </label>
        {form.formState.errors.photoConsent ? (
          <p className="text-xs text-[var(--danger)]">
            {form.formState.errors.photoConsent.message}
          </p>
        ) : null}
        {form.formState.errors.photoAKey || form.formState.errors.photoBKey ? (
          <p className="text-xs text-[var(--danger)]">
            Envie e confirme as duas fotos obrigatórias.
          </p>
        ) : null}

        <button
          type="submit"
          disabled={save.isPending}
          className="rounded-md bg-champagne px-5 py-3 text-sm font-semibold text-ink"
        >
          Escolher nosso estilo
        </button>
      </form>
    </FunnelShell>
  );
}
