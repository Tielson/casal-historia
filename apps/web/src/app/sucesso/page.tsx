'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Logo } from '@/components/Logo';
import { api } from '@/lib/api';
import { trackFunnel, trackMeta } from '@/lib/meta';

function SuccessInner() {
  const params = useSearchParams();
  const orderId = params.get('orderId');
  const mock = params.get('mock') === '1';
  const [paidMock, setPaidMock] = useState(!mock);

  useEffect(() => {
    if (!orderId || !mock) return;
    void api.post(`/payments/mock-pay/${orderId}`).then(() => setPaidMock(true));
  }, [orderId, mock]);

  useEffect(() => {
    if (!orderId || !paidMock) return;
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
  }, [orderId, paidMock]);

  const waiting = mock && !paidMock;

  return (
    <main className="mx-auto flex min-h-[100svh] max-w-xl flex-col justify-center px-6 py-16 text-mist">
      <p className="text-4xl">
        <Logo />
      </p>
      <h1 className="mt-4 font-display text-3xl">Pagamento confirmado</h1>
      <p className="mt-3 text-mist-dim">
        {!orderId
          ? 'Não encontramos este pagamento.'
          : waiting
            ? 'Confirmando o pagamento…'
            : 'Enviamos o comprovante para o e-mail informado na revisão. O livro está sendo confeccionado e chega nesse e-mail em alguns minutos.'}
      </p>
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
