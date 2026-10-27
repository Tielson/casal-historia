import { Suspense, type ReactNode } from 'react';

export default function ReviewLayout({ children }: { children: ReactNode }) {
  return <Suspense fallback={<main className="bg-ink p-8 text-mist">Carregando…</main>}>{children}</Suspense>;
}
