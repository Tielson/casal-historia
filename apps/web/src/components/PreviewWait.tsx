'use client';

import { useEffect, useState } from 'react';

const STEPS = [
  {
    id: 'queued',
    label: 'Na fila',
    detail: 'O livro de vocês entrou para ser feito.',
  },
  {
    id: 'writing',
    label: 'Escrevendo',
    detail: 'O texto está nascendo das lembranças que vocês contaram.',
  },
  {
    id: 'illustrating',
    label: 'Ilustrando',
    detail: 'Cada cena está sendo desenhada. Esta parte leva mais tempo.',
  },
  {
    id: 'layout',
    label: 'Montando',
    detail: 'O texto está encontrando o lugar em cada página.',
  },
] as const;

function stepIndex(stage: string) {
  if (stage === 'missing') return 0;
  const index = STEPS.findIndex((step) => step.id === stage);
  return index === -1 ? 0 : index;
}

function formatElapsed(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  if (minutes === 0) return `${seconds} s`;
  return `${minutes} min ${seconds.toString().padStart(2, '0')} s`;
}

function coupleLabel(nameA?: string | null, nameB?: string | null) {
  const a = nameA?.trim();
  const b = nameB?.trim();
  if (a && b) return `${a} e ${b}`;
  return null;
}

export function PreviewWait({
  stage,
  startedAt,
  nameA,
  nameB,
  regenCount,
  maxRegens,
  ignoreBefore,
}: {
  stage: string;
  startedAt?: string | null;
  nameA?: string | null;
  nameB?: string | null;
  regenCount?: number;
  maxRegens?: number;
  ignoreBefore?: number | null;
}) {
  const [now, setNow] = useState(() => Date.now());
  const [origin, setOrigin] = useState(() => Date.now());
  const index = stepIndex(stage);
  const current = STEPS[index] ?? STEPS[0];
  const couple = coupleLabel(nameA, nameB);
  const elapsed = Math.max(0, now - origin);
  const opening = stage === 'missing' || (!startedAt && stage === 'queued');
  const detail = opening
    ? 'Estamos abrindo a prévia. A escrita começa em seguida.'
    : current.detail;

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (!startedAt) return;
    const parsed = Date.parse(startedAt);
    if (Number.isNaN(parsed)) return;
    if (ignoreBefore != null && parsed < ignoreBefore - 2000) return;
    setOrigin(parsed);
  }, [startedAt, ignoreBefore]);

  return (
    <div className="space-y-8">
      <section
        className="rounded-sm border border-champagne/30 bg-ink-soft px-5 py-6"
        aria-busy="true"
      >
        <div className="flex items-start gap-4">
          <span className="relative grid size-14 shrink-0 place-items-center" aria-hidden="true">
            <span className="wait-spin absolute inset-0 rounded-full border-2 border-white/10 border-t-champagne" />
            <svg width="22" height="20" viewBox="0 0 22 20" className="heart-float text-blush">
              <path
                d="M11 18C11 18 2 12 2 6.5C2 3.5 4.2 1.5 6.8 1.5C8.6 1.5 10 2.8 11 4.4C12 2.8 13.4 1.5 15.2 1.5C17.8 1.5 20 3.5 20 6.5C20 12 11 18 11 18Z"
                fill="currentColor"
              />
            </svg>
          </span>
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-[0.18em] text-champagne">Aguarde</p>
            <h2 className="mt-1 font-display text-2xl text-mist md:text-3xl">
              {couple ? `A prévia de ${couple} está a caminho` : 'A prévia de vocês está a caminho'}
            </h2>
            <p className="mt-3 text-sm text-mist" role="status" aria-live="polite">
              {detail}
            </p>
            <p className="mt-2 text-sm text-mist-dim">
              Leva alguns minutos. Deixe esta página aberta: a capa e as primeiras páginas aparecem
              aqui sozinhas.
            </p>
            <p className="mt-4 text-sm font-medium tabular-nums text-champagne">
              Em andamento há {formatElapsed(elapsed)}
            </p>
            {elapsed >= 90_000 ? (
              <p className="mt-2 text-sm text-mist">
                Ainda estamos nesta etapa. O relógio acima mostra que a prévia segue em andamento.
              </p>
            ) : null}
          </div>
        </div>

        <ol className="mt-6 grid gap-3 sm:grid-cols-4" aria-label="Etapas da prévia">
          {STEPS.map((step, stepPosition) => {
            const done = stepPosition < index;
            const active = stepPosition === index;
            return (
              <li
                key={step.id}
                aria-current={active ? 'step' : undefined}
                className={active ? 'text-champagne' : done ? 'text-mist' : 'text-mist-dim'}
              >
                <span className="flex items-center gap-2 text-sm">
                  <span
                    className={`size-2 shrink-0 rounded-full ${
                      active ? 'animate-pulse bg-champagne' : done ? 'bg-blush' : 'bg-white/25'
                    }`}
                    aria-hidden="true"
                  />
                  {step.label}
                  {done ? <span className="sr-only">, concluída</span> : null}
                  {active ? <span className="sr-only">, em andamento</span> : null}
                </span>
              </li>
            );
          })}
        </ol>

        <div
          className="relative mt-5 h-1.5 overflow-hidden rounded-full bg-white/10"
          aria-hidden="true"
        >
          <div
            className="absolute inset-y-0 left-0 bg-champagne/80 transition-[width] duration-700"
            style={{ width: `${((index + 1) / STEPS.length) * 100}%` }}
          />
          <div className="wait-shimmer absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/60 to-transparent" />
        </div>

        {regenCount != null ? (
          <p className="mt-4 text-xs text-mist-dim">
            Regenerações: {regenCount} / {maxRegens ?? 3}
          </p>
        ) : null}
      </section>

      <div className="space-y-4" aria-hidden="true">
        <div className="relative mx-auto aspect-[3/4] max-w-md overflow-hidden rounded-sm border border-white/15 bg-gradient-to-b from-white/10 to-transparent">
          <div className="absolute inset-0 grid place-items-center px-6 text-center">
            <div>
              <p className="font-display text-2xl text-champagne/90">Capa</p>
              <p className="mt-2 text-xs text-mist-dim">Aparece aqui quando a prévia ficar pronta</p>
            </div>
          </div>
        </div>
        <ol className="grid gap-4 md:grid-cols-3">
          {[2, 3, 4].map((page) => (
            <li
              key={page}
              className="grid aspect-[3/4] place-items-center rounded-sm border border-white/10 bg-white/5 text-sm text-mist-dim"
            >
              Página {page}
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
