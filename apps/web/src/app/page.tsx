import Link from 'next/link';
import { STYLES, PRICE_LABEL } from '@entre-nos/shared';
import { StickyMobileCta } from '@/components/StickyMobileCta';
import { LandingViewContent } from '@/components/LandingViewContent';

const faqs = [
  {
    q: 'O que é o Entre Nós?',
    a: 'Um livro digital personalizado de 12 páginas contando a história de vocês, com ilustrações no estilo que escolherem.',
  },
  {
    q: 'Posso ver antes de pagar?',
    a: 'Sim. A prévia gratuita mostra a capa e uma página interna. Você só paga se gostar.',
  },
  {
    q: 'É um livro impresso?',
    a: 'Não — a entrega é digital (PDF privado + links para ler e presentear).',
  },
  {
    q: 'Quanto custa?',
    a: `${PRICE_LABEL} no checkout. O preço é definido no servidor; sem add-ons nesta versão.`,
  },
  {
    q: 'Preciso criar conta?',
    a: 'Não. Seu rascunho fica salvo anonimamente enquanto você avança — inclusive se voltar do Stripe.',
  },
];

const STYLE_PREVIEW: Record<string, string> = {
  aquarela: '/cute/cute-couple-cover.jpg',
  editorial: '/styles/editorial.svg',
  linha: '/styles/linha.svg',
  filme: '/cute/cute-rain-walk.jpg',
  noturno: '/styles/noturno.svg',
  papel: '/styles/papel.svg',
};

export default function LandingPage() {
  return (
    <main className="sticky-cta-pad bg-ink text-mist">
      <LandingViewContent />

      {/* Hero — one warm cute composition */}
      <section className="relative min-h-[100svh] overflow-hidden">
        <div
          className="hero-drift absolute inset-0 scale-105 bg-cover bg-center"
          style={{
            backgroundImage:
              'linear-gradient(120deg, rgba(28,20,24,0.55) 6%, rgba(28,20,24,0.28) 42%, rgba(42,31,36,0.62) 100%), radial-gradient(ellipse at 72% 28%, rgba(242,182,193,0.35), transparent 55%), url(/cute/cute-couple-cover.jpg)',
          }}
          aria-hidden
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/decor/hearts-doodle.svg"
          alt=""
          aria-hidden
          className="heart-float pointer-events-none absolute right-[-4%] top-[8%] z-[1] hidden w-[min(42vw,420px)] opacity-80 md:block"
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/decor/hearts-doodle.svg"
          alt=""
          aria-hidden
          className="heart-float-delay pointer-events-none absolute bottom-[18%] left-[-8%] z-[1] w-[min(55vw,280px)] opacity-50 md:opacity-70"
        />
        <div className="relative z-10 mx-auto flex min-h-[100svh] max-w-6xl flex-col justify-end px-6 pb-28 pt-10 md:justify-center md:pb-20">
          <p className="animate-rise font-display text-5xl leading-none text-champagne sm:text-6xl md:text-7xl lg:text-8xl">
            Entre Nós
          </p>
          <h1 className="animate-rise-delay mt-6 max-w-xl font-display text-3xl leading-tight text-mist sm:text-4xl md:text-5xl">
            O livro da história de vocês — digital, carinhoso, só de vocês.
          </h1>
          <p className="animate-rise-delay-2 mt-5 max-w-md text-base leading-relaxed text-mist-dim md:text-lg">
            Doze páginas fofas a partir das suas fotos e lembranças. Prévia gratuita
            da capa e de uma página antes de pagar {PRICE_LABEL}.
          </p>
          <div className="animate-rise-delay-2 mt-8 flex flex-wrap items-center gap-4">
            <Link
              href="/criar"
              className="rounded-md bg-champagne px-6 py-3 text-sm font-semibold text-ink transition hover:bg-[#f7e2c8]"
            >
              Criar nossa história
            </Link>
            <a
              href="#como-fica"
              className="text-sm text-mist-dim underline-offset-4 hover:text-mist hover:underline"
            >
              Ver como fica por dentro
            </a>
          </div>
        </div>
      </section>

      {/* Style showcase */}
      <section id="como-fica" className="mx-auto max-w-6xl px-6 py-20 md:py-28">
        <p className="text-xs uppercase tracking-[0.22em] text-foam">Exemplos</p>
        <h2 className="mt-3 max-w-2xl font-display text-3xl text-mist md:text-4xl">
          Seis estilos. O mesmo casal, a mesma cena — agora com um ar mais fofo.
        </h2>
        <p className="mt-4 max-w-xl text-mist-dim">
          As imagens abaixo são exemplos ilustrativos do visual de cada estilo, não o
          livro final de um casal real.
        </p>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {STYLES.map((style) => (
            <figure key={style.id} className="group">
              <div className="relative aspect-[3/4] overflow-hidden rounded-sm bg-ink-soft ring-1 ring-blush-soft/20">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={STYLE_PREVIEW[style.id] ?? `/styles/${style.id}.svg`}
                  alt={`Exemplo do estilo ${style.name}`}
                  className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.03]"
                />
                <span className="absolute left-3 top-3 rounded-sm bg-ink/70 px-2 py-1 text-[10px] uppercase tracking-wider text-champagne">
                  Exemplo
                </span>
              </div>
              <figcaption className="mt-3">
                <p className="font-display text-xl text-mist">{style.name}</p>
                <p className="mt-1 text-sm text-mist-dim">{style.description}</p>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* Atmosphere strip — rain walk + stickers */}
      <section className="relative overflow-hidden border-y border-white/10 bg-ink-soft/60">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-6 py-16 md:grid-cols-2 md:py-24">
          <div className="relative aspect-[4/5] overflow-hidden rounded-sm md:aspect-[5/6]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/cute/cute-rain-walk.jpg"
              alt="Exemplo ilustrativo: casal sob a chuva com corações"
              className="h-full w-full object-cover"
            />
            <span className="absolute left-3 top-3 rounded-sm bg-ink/70 px-2 py-1 text-[10px] uppercase tracking-wider text-champagne">
              Exemplo
            </span>
          </div>
          <div>
            <h2 className="font-display text-3xl text-mist md:text-4xl">
              Corações, pastéis e um presente que parece feito à mão.
            </h2>
            <p className="mt-4 max-w-md text-mist-dim">
              A direção visual é quente e fofa: doodles, aquarela suave e detalhes de
              caderno — sem o clima frio de cinema.
            </p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/cute/cute-hearts-stickers.jpg"
              alt=""
              aria-hidden
              className="mt-8 max-h-40 w-auto rounded-sm object-cover opacity-90"
            />
          </div>
        </div>
      </section>

      {/* What's included */}
      <section className="border-b border-white/10">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 py-20 md:grid-cols-[1.1fr_0.9fr] md:py-28">
          <div>
            <h2 className="font-display text-3xl text-mist md:text-4xl">
              O que está incluso
            </h2>
            <p className="mt-4 max-w-lg text-mist-dim">
              Um presente digital completo, pensado para aniversário de namoro — e
              também para casamento, aniversário ou surpresa.
            </p>
          </div>
          <ul className="space-y-5 text-mist">
            <li className="border-b border-white/10 pb-4">
              <strong className="font-display text-xl">12 páginas</strong>
              <p className="mt-1 text-sm text-mist-dim">
                História montada só com o que vocês contarem — sem inventar casamento,
                filhos ou viagens.
              </p>
            </li>
            <li className="border-b border-white/10 pb-4">
              <strong className="font-display text-xl">Prévia gratuita</strong>
              <p className="mt-1 text-sm text-mist-dim">
                Capa + 1 página interna antes do pagamento.
              </p>
            </li>
            <li className="border-b border-white/10 pb-4">
              <strong className="font-display text-xl">{PRICE_LABEL}</strong>
              <p className="mt-1 text-sm text-mist-dim">
                Pagamento seguro via Stripe. Entrega digital com link de leitura e de
                presente.
              </p>
            </li>
            <li>
              <strong className="font-display text-xl">Um estilo completo</strong>
              <p className="mt-1 text-sm text-mist-dim">
                Você escolhe entre seis pacotes visuais — sem configuração extra de
                paleta.
              </p>
            </li>
          </ul>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-3xl px-6 py-20 md:py-28">
        <h2 className="font-display text-3xl text-mist md:text-4xl">Perguntas frequentes</h2>
        <div className="mt-10 space-y-6">
          {faqs.map((item) => (
            <details
              key={item.q}
              className="group border-b border-white/10 pb-4 open:pb-6"
            >
              <summary className="cursor-pointer list-none font-display text-xl text-mist marker:content-none">
                {item.q}
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-mist-dim">{item.a}</p>
            </details>
          ))}
        </div>
        <div className="mt-12 hidden md:block">
          <Link
            href="/criar"
            className="inline-flex rounded-md bg-champagne px-6 py-3 text-sm font-semibold text-ink"
          >
            Criar nossa história
          </Link>
        </div>
      </section>

      <footer className="border-t border-white/10 px-6 py-10 text-center text-xs text-mist-dim">
        Entre Nós — livro digital personalizado · marca provisória
      </footer>

      <StickyMobileCta />
    </main>
  );
}
