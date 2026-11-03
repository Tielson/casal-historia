'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { z } from 'zod';
import { OCCASIONS, STORY_MODES, STYLES, PRICE_LABEL } from '@entre-nos/shared';
import { FunnelShell } from '@/components/FunnelShell';
import { api, ensureDraft } from '@/lib/api';
import { trackFunnel, trackMeta } from '@/lib/meta';

const emailSchema = z.object({
  email: z.string().email('Informe um e-mail válido'),
});

type EmailForm = z.infer<typeof emailSchema>;

const PAID_STATUSES = new Set(['paid', 'producing', 'delivered']);

function errorMessage(err: unknown) {
  if (axios.isAxiosError(err)) {
    const message = (err.response?.data as { message?: string } | undefined)?.message;
    if (message) return message;
  }
  return 'Não foi possível abrir o pagamento.';
}

export default function ReviewPage() {
  const params = useSearchParams();
  const canceled = params.get('canceled') === '1';
  const draftQuery = useQuery({ queryKey: ['draft'], queryFn: ensureDraft });
  const draft = draftQuery.data;

  const form = useForm<EmailForm>({
    resolver: zodResolver(emailSchema),
    values: { email: draft?.email ?? '' },
  });

  useEffect(() => {
    if (canceled) {
      // draft persists — nothing to recover besides messaging
    }
  }, [canceled]);

  const pay = useMutation({
    mutationFn: async (values: EmailForm) => {
      const d = draft ?? (await ensureDraft());
      const { data } = await api.post<{
        url: string;
        orderId: string;
        amountCents: number;
        mock?: boolean;
      }>('/payments/checkout', { token: d.token, email: values.email });
      trackFunnel('checkout', { draftId: d.id, orderId: data.orderId });
      trackMeta(
        'InitiateCheckout',
        {
          value: data.amountCents / 100,
          currency: 'BRL',
          content_ids: [data.orderId],
          order_id: data.orderId,
        },
        `InitiateCheckout_${data.orderId}`,
      );
      return data;
    },
    onSuccess: (data) => {
      window.location.href = data.url;
    },
  });

  const occasion = OCCASIONS.find((o) => o.id === draft?.occasion);
  const style = STYLES.find((s) => s.id === draft?.styleId);
  const storyMode = STORY_MODES.find((mode) => mode.id === draft?.storyMode);
  const alreadyPaid = PAID_STATUSES.has(draft?.status ?? '') && Boolean(draft?.manageToken);

  return (
    <FunnelShell
      step={6}
      title="Revisão"
      subtitle="Confira o resumo editável. O valor é sempre o definido no servidor."
    >
      {canceled ? (
        <p className="mb-6 rounded-sm border border-copper/40 bg-copper/10 px-4 py-3 text-sm">
          Pagamento cancelado. Seu rascunho continua aqui — pode tentar de novo quando quiser.
        </p>
      ) : null}

      <div className="space-y-4 rounded-sm border border-white/10 bg-ink-soft p-5 text-sm">
        <Row label="Ocasião" value={occasion?.label ?? '—'} href="/criar/ocasiao" />
        <Row
          label="Casal"
          value={`${draft?.couple?.nameA ?? '—'} & ${draft?.couple?.nameB ?? '—'}`}
          href="/criar/casal"
        />
        <Row
          label="Estilo"
          value={style ? `${style.name}${draft?.filmFinish ? ' · acabamento filme antigo' : ''}` : '—'}
          href="/criar/estilo"
        />
        <Row label="História" value={storyMode?.name ?? 'Inspirada em nós'} href="/criar/lembrancas" />
        <Row
          label="Lembranças"
          value={
            Object.values(draft?.memories?.answers ?? {})
              .filter(Boolean)
              .slice(0, 1)
              .join(' ') || '—'
          }
          href="/criar/lembrancas"
        />
        <Row label="Prévia" value={draft?.previewApproved ? 'Aprovada' : 'Pendente'} href="/criar/previa" />
        <div className="flex items-center justify-between border-t border-white/10 pt-4">
          <span className="text-mist-dim">Total</span>
          <span className="font-display text-2xl text-champagne">{PRICE_LABEL}</span>
        </div>
      </div>

      {alreadyPaid ? (
        <div className="mt-8 space-y-3">
          <p className="text-sm text-mist">
            Este presente já foi pago. O livro continua no link de gerenciamento.
          </p>
          <Link
            href={`/livro/${draft?.manageToken}`}
            className="inline-flex rounded-md bg-champagne px-5 py-3 text-sm font-semibold text-ink"
          >
            Abrir nosso livro
          </Link>
        </div>
      ) : (
        <form
          className="mt-8 space-y-4"
          onSubmit={form.handleSubmit((v) => pay.mutate(v))}
        >
          <div>
            <label htmlFor="checkout-email" className="text-sm">
              E-mail para o comprovante e o livro
            </label>
            <p className="mt-1 text-xs text-mist-dim">
              O comprovante sai na hora. O livro chega neste endereço em alguns minutos, depois da
              confecção.
            </p>
            <input
              id="checkout-email"
              type="email"
              autoComplete="email"
              className="mt-1 w-full rounded-md border border-white/15 bg-ink-soft px-3 py-2"
              {...form.register('email')}
            />
            {form.formState.errors.email ? (
              <p className="mt-1 text-xs text-[var(--danger)]">
                {form.formState.errors.email.message}
              </p>
            ) : null}
          </div>
          {pay.isError ? (
            <p className="text-sm text-[var(--danger)]">{errorMessage(pay.error)}</p>
          ) : null}
          <button
            type="submit"
            disabled={pay.isPending || !draft?.previewApproved}
            className="rounded-md bg-champagne px-5 py-3 text-sm font-semibold text-ink disabled:opacity-50"
          >
            Continuar para pagamento
          </button>
          {!draft?.previewApproved ? (
            <p className="text-xs text-mist-dim">
              Aprove a prévia antes de pagar.{' '}
              <Link href="/criar/previa" className="underline">
                Ir para prévia
              </Link>
            </p>
          ) : null}
        </form>
      )}
    </FunnelShell>
  );
}

function Row({
  label,
  value,
  href,
}: {
  label: string;
  value: string;
  href: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-xs uppercase tracking-wider text-mist-dim">{label}</p>
        <p className="mt-1 text-mist">{value}</p>
      </div>
      <Link href={href} className="text-xs text-foam underline">
        Editar
      </Link>
    </div>
  );
}
