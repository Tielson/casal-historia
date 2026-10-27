'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { trackFunnel, trackMeta } from '@/lib/meta';

function SuccessInner() {
  const params = useSearchParams();
  const orderId = params.get('orderId');
  const mock = params.get('mock') === '1';
  const [paidMock, setPaidMock] = useState(false);

  useEffect(() => {
    if (!orderId) return;
    if (mock && !paidMock) {
      void api.post(`/payments/mock-pay/${orderId}`).then(() => setPaidMock(true));
    }
  }, [orderId, mock, paidMock]);

  useEffect(() => {
    if (!orderId) return;
    if (mock && !paidMock) return;
    trackFunnel('payment', { orderId });
    trackMeta(
      'Purchase',
      {
        value: 49.9,
        currency: 'BRL',
        content_ids: [orderId],
        order_id: orderId,
      },
      `Purchase_${orderId}`,
    );
  }, [orderId, mock, paidMock]);

  const statusQuery = useQuery({
    queryKey: ['order-status', orderId, paidMock],
    enabled: Boolean(orderId) && (!mock || paidMock),
    queryFn: async () => {
      const { data } = await api.get<{
        status: string;
        productionStage?: string;
        manageToken: string;
      }>(`/orders/${orderId}/status`);
      return data;
    },
    refetchInterval: (q) =>
      q.state.data?.status === 'delivered' ? false : 1200,
  });

  const status = statusQuery.data?.status;
  const ready = status === 'delivered';

  return (
    <main className="mx-auto flex min-h-[100svh] max-w-xl flex-col justify-center px-6 py-16 text-mist">
      <p className="font-display text-4xl text-champagne">Entre Nós</p>
      <h1 className="mt-4 font-display text-3xl">
        {ready ? 'Seu livro está pronto' : 'Pagamento confirmado'}
      </h1>
      <p className="mt-3 text-mist-dim">
        {ready
          ? 'A produção terminou. Abra o livro no link de gerenciamento.'
          : `Estamos gerando as páginas restantes… (${statusQuery.data?.productionStage ?? 'iniciando'})`}
      </p>
      {ready && statusQuery.data?.manageToken ? (
        <Link
          href={`/livro/${statusQuery.data.manageToken}`}
          className="mt-8 inline-flex w-fit rounded-md bg-champagne px-5 py-3 text-sm font-semibold text-ink"
        >
          Abrir nosso livro
        </Link>
      ) : (
        <div className="mt-8 h-2 w-full overflow-hidden rounded-full bg-white/10">
          <div className="h-full w-1/2 animate-pulse bg-champagne/80" />
        </div>
      )}
      {mock ? (
        <p className="mt-6 text-xs text-mist-dim">
          Modo mock Stripe (sem chave). O pagamento foi simulado no servidor.
        </p>
      ) : null}
    </main>
  );
}

export default function SuccessPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-[100svh] items-center justify-center bg-ink text-mist">
          Carregando…
        </main>
      }
    >
      <SuccessInner />
    </Suspense>
  );
}
