'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { useDraft } from '@/hooks/useDraft';
import { FUNNEL_PAGES, PREVIEW_PAGE_INDEX, furthestPageIndex } from '@/lib/funnel';

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
  const draftQuery = useDraft();
  const furthest = Math.max(step - 1, furthestPageIndex(draftQuery.data?.step));
  const previous = step > 1 ? FUNNEL_PAGES[step - 2] : null;

  return (
    <main className="min-h-[100svh] bg-ink text-mist">
      <header className="mx-auto flex max-w-3xl items-center justify-between px-6 py-5">
        <Link href="/" className="font-display text-2xl text-champagne">
          Entre Nós
        </Link>
        <div className="flex items-center gap-4">
          {previous ? (
            <Link
              href={previous.href}
              className="text-sm text-mist-dim underline decoration-white/30 underline-offset-4"
            >
              Voltar
            </Link>
          ) : null}
          <p className="text-xs text-mist-dim">
            Etapa {step} de {FUNNEL_PAGES.length}
          </p>
        </div>
      </header>
      <ol
        className="mx-auto mb-6 grid max-w-3xl grid-cols-6 gap-1 px-4 sm:px-6"
        aria-label="Etapas do livro"
      >
        {FUNNEL_PAGES.map((page, index) => {
          const current = index === step - 1;
          const reached = index <= furthest;
          const interactive = reached && !current;
          const filled = reached;
          const heartClass = current ? 'text-champagne' : reached ? 'text-blush' : 'text-mist-dim';
          const label = (
            <span className="flex flex-col items-center gap-1 text-center">
              <svg
                width="22"
                height="20"
                viewBox="0 0 22 20"
                aria-hidden="true"
                className={heartClass}
              >
                <path
                  d="M11 18C11 18 2 12 2 6.5C2 3.5 4.2 1.5 6.8 1.5C8.6 1.5 10 2.8 11 4.4C12 2.8 13.4 1.5 15.2 1.5C17.8 1.5 20 3.5 20 6.5C20 12 11 18 11 18Z"
                  fill={filled ? 'currentColor' : 'none'}
                  stroke="currentColor"
                  strokeWidth={filled ? 0 : 1.3}
                />
              </svg>
              <span
                className={`text-[10px] leading-3 sm:text-xs ${
                  current ? 'text-champagne' : reached ? 'text-blush' : 'text-mist-dim'
                } ${interactive ? 'underline decoration-blush/50 underline-offset-2' : ''}`}
              >
                {page.label}
              </span>
            </span>
          );

          return (
            <li key={page.href} aria-current={current ? 'step' : undefined}>
              {interactive ? (
                <Link
                  href={page.href}
                  aria-label={`Editar ${page.label}`}
                  className="block rounded-sm px-0.5 py-1 hover:bg-white/5"
                >
                  {label}
                </Link>
              ) : (
                <div className="px-0.5 py-1" aria-label={reached ? page.label : `${page.label}, ainda não`}>
                  {label}
                </div>
              )}
            </li>
          );
        })}
      </ol>
      {furthest >= PREVIEW_PAGE_INDEX && step - 1 < PREVIEW_PAGE_INDEX ? (
        <p className="mx-auto mb-6 max-w-3xl px-6 text-xs text-mist-dim">
          Dá para reeditar o que já passou. Se mudar ocasião, casal, estilo ou lembranças, a prévia é refeita.
        </p>
      ) : null}
      <div className="mx-auto max-w-3xl px-6 pb-20">
        <h1 className="font-display text-3xl text-mist md:text-4xl">{title}</h1>
        {subtitle ? <p className="mt-3 text-mist-dim">{subtitle}</p> : null}
        <div className="mt-8">{children}</div>
      </div>
    </main>
  );
}
