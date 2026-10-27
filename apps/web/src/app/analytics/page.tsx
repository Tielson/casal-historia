import Link from 'next/link';

export default function AnalyticsDocsPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16 text-mist">
      <p className="font-display text-3xl text-champagne">Entre Nós</p>
      <h1 className="mt-3 font-display text-3xl">Como ler Meta + funil interno</h1>
      <p className="mt-4 text-mist-dim">
        Use Events Manager (Pixel/CAPI) em paralelo com <code>/admin</code> ou{' '}
        <code>GET /analytics/funnel</code> para achar gargalos.
      </p>

      <section className="mt-10 space-y-4 text-sm leading-relaxed">
        <h2 className="font-display text-2xl">Eventos Meta</h2>
        <ul className="list-disc space-y-2 pl-5 text-mist-dim">
          <li>
            <strong className="text-mist">ViewContent</strong> — landing
          </li>
          <li>
            <strong className="text-mist">InitiateCheckout</strong> — botão Continuar para
            pagamento
          </li>
          <li>
            <strong className="text-mist">Purchase</strong> — página /sucesso após pagamento
          </li>
        </ul>

        <h2 className="mt-8 font-display text-2xl">Eventos internos</h2>
        <p className="text-mist-dim">
          visit → create_started → photos_uploaded → style_chosen → memories_done →
          preview_ready → checkout → payment → delivery
        </p>
        <p className="text-mist-dim">
          Compare contagens sequenciais: a maior queda relativa é o gargalo a otimizar
          (criativo, fotos, estilo, prévia ou preço).
        </p>

        <h2 className="mt-8 font-display text-2xl">Fórmula de margem</h2>
        <pre className="overflow-x-auto rounded-sm bg-ink-soft p-4 text-xs text-champagne">
{`margem_unitaria ≈ 49,90
  − taxa_pagamento
  − custo_geração_livro (inclui prévias não convertidas rateadas)
  − custo_ads_atribuído
  − impostos
  − custo_atendimento

margem_% = margem_unitaria / 49,90`}
        </pre>
      </section>

      <Link href="/admin" className="mt-10 inline-block text-sm text-foam underline">
        Abrir admin
      </Link>
    </main>
  );
}
