'use client';

import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

type OrderRow = {
  id: string;
  status: string;
  productionStage?: string | null;
  productionError?: string | null;
  email?: string | null;
  names: string;
  amountCents: number;
  reprocessCount: number;
  notes?: string | null;
};

export default function AdminPage() {
  const [token, setToken] = useState('');
  const [authed, setAuthed] = useState('');
  const [q, setQ] = useState('');

  const orders = useQuery({
    queryKey: ['admin-orders', authed, q],
    enabled: Boolean(authed),
    queryFn: async () => {
      const { data } = await api.get<OrderRow[]>('/admin/orders', {
        params: { q: q || undefined },
        headers: { 'x-admin-token': authed },
      });
      return data;
    },
  });

  const funnel = useQuery({
    queryKey: ['admin-funnel', authed],
    enabled: Boolean(authed),
    queryFn: async () => {
      const { data } = await api.get<{ name: string; count: number }[]>('/admin/funnel', {
        headers: { 'x-admin-token': authed },
      });
      return data;
    },
  });

  const reprocess = useMutation({
    mutationFn: async (id: string) => {
      await api.post(`/admin/orders/${id}/reprocess`, null, {
        headers: { 'x-admin-token': authed },
      });
    },
    onSuccess: () => orders.refetch(),
  });

  const resend = useMutation({
    mutationFn: async (id: string) => {
      await api.post(`/admin/orders/${id}/resend-access`, null, {
        headers: { 'x-admin-token': authed },
      });
    },
  });

  const notes = useMutation({
    mutationFn: async ({ id, text }: { id: string; text: string }) => {
      await api.patch(
        `/admin/orders/${id}/notes`,
        { notes: text },
        { headers: { 'x-admin-token': authed } },
      );
    },
    onSuccess: () => orders.refetch(),
  });

  if (!authed) {
    return (
      <main className="mx-auto flex min-h-[100svh] max-w-md flex-col justify-center px-6 text-mist">
        <h1 className="font-display text-3xl text-champagne">Admin Entre Nós</h1>
        <p className="mt-2 text-sm text-mist-dim">Entre com o ADMIN_TOKEN.</p>
        <input
          type="password"
          className="mt-6 rounded-md border border-white/15 bg-ink-soft px-3 py-2"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="ADMIN_TOKEN"
        />
        <button
          type="button"
          className="mt-4 rounded-md bg-champagne px-4 py-2 text-sm font-semibold text-ink"
          onClick={() => setAuthed(token)}
        >
          Entrar
        </button>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-10 text-mist">
      <h1 className="font-display text-3xl text-champagne">Pedidos</h1>
      <div className="mt-4 flex gap-2">
        <input
          className="flex-1 rounded-md border border-white/15 bg-ink-soft px-3 py-2 text-sm"
          placeholder="Buscar por e-mail, nome, id…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <button
          type="button"
          className="rounded-md border border-white/20 px-3 text-sm"
          onClick={() => orders.refetch()}
        >
          Buscar
        </button>
      </div>

      <section className="mt-8">
        <h2 className="font-display text-xl">Funil (eventos)</h2>
        <ul className="mt-3 grid gap-2 sm:grid-cols-3">
          {(funnel.data ?? []).map((f) => (
            <li key={f.name} className="rounded-sm border border-white/10 px-3 py-2 text-sm">
              {f.name}: <strong>{f.count}</strong>
            </li>
          ))}
        </ul>
      </section>

      <div className="mt-8 space-y-4">
        {(orders.data ?? []).map((o) => (
          <article key={o.id} className="rounded-sm border border-white/10 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-display text-lg">{o.names}</p>
                <p className="text-xs text-mist-dim">
                  {o.id} · {o.email} · {(o.amountCents / 100).toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  })}
                </p>
                <p className="mt-1 text-sm">
                  {o.status} / {o.productionStage ?? '—'}
                  {o.productionError ? ` · erro: ${o.productionError}` : ''}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="rounded-md border border-white/20 px-3 py-1 text-xs"
                  onClick={() => reprocess.mutate(o.id)}
                >
                  Reprocessar ({o.reprocessCount})
                </button>
                <button
                  type="button"
                  className="rounded-md border border-white/20 px-3 py-1 text-xs"
                  onClick={() => resend.mutate(o.id)}
                >
                  Reenviar acesso
                </button>
              </div>
            </div>
            <textarea
              className="mt-3 w-full rounded-md border border-white/10 bg-ink-soft px-3 py-2 text-sm"
              defaultValue={o.notes ?? ''}
              placeholder="Notas de atendimento"
              onBlur={(e) => notes.mutate({ id: o.id, text: e.target.value })}
            />
          </article>
        ))}
      </div>
    </main>
  );
}
