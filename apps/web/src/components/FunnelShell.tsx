'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';

const STEPS = [
  { href: '/criar/ocasiao', label: 'Ocasião' },
  { href: '/criar/casal', label: 'Casal' },
  { href: '/criar/estilo', label: 'Estilo' },
  { href: '/criar/lembrancas', label: 'Lembranças' },
  { href: '/criar/previa', label: 'Prévia' },
  { href: '/criar/revisao', label: 'Revisão' },
];

export function FunnelShell({
  title,
  subtitle,
  step,
  children,
}: {
  title: string;
  subtitle?: string;
  step: number;
  children: ReactNode;
}) {
  return (
    <main className="min-h-[100svh] bg-ink text-mist">
      <header className="mx-auto flex max-w-3xl items-center justify-between px-6 py-5">
        <Link href="/" className="font-display text-2xl text-champagne">
          Entre Nós
        </Link>
        <p className="text-xs text-mist-dim">
          Etapa {step} de {STEPS.length}
        </p>
      </header>
      <div className="mx-auto mb-6 flex max-w-3xl gap-1 px-6">
        {STEPS.map((s, i) => (
          <div
            key={s.href}
            className={`h-1 flex-1 rounded-full ${i < step ? 'bg-champagne' : 'bg-white/10'}`}
            title={s.label}
          />
        ))}
      </div>
      <div className="mx-auto max-w-3xl px-6 pb-20">
        <h1 className="font-display text-3xl text-mist md:text-4xl">{title}</h1>
        {subtitle ? <p className="mt-3 text-mist-dim">{subtitle}</p> : null}
        <div className="mt-8">{children}</div>
      </div>
    </main>
  );
}
