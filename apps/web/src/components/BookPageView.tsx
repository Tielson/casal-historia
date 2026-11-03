import type { PageView } from '@entre-nos/shared';

/** Paper-colored wash under the text, fading into the illustration like the PDF. */
const VEIL: Record<PageView['textZone'], string> = {
  top: 'linear-gradient(to bottom, rgba(251,244,239,0.9) 0%, rgba(251,244,239,0.78) 30%, rgba(251,244,239,0) 46%)',
  bottom: 'linear-gradient(to top, rgba(251,244,239,0.9) 0%, rgba(251,244,239,0.78) 30%, rgba(251,244,239,0) 46%)',
  left: 'radial-gradient(ellipse 38% 46% at 22% 50%, rgba(251,244,239,0.86) 0%, rgba(251,244,239,0.8) 48%, rgba(251,244,239,0.4) 74%, rgba(251,244,239,0) 100%)',
  right: 'radial-gradient(ellipse 38% 46% at 78% 50%, rgba(251,244,239,0.86) 0%, rgba(251,244,239,0.8) 48%, rgba(251,244,239,0.4) 74%, rgba(251,244,239,0) 100%)',
};

const BLOCK: Record<PageView['textZone'], string> = {
  top: 'inset-x-[7.4%] top-[5.5%] text-center',
  bottom: 'inset-x-[7.4%] bottom-[5.5%] text-center',
  left: 'left-[7.4%] w-[36.6%] top-1/2 -translate-y-1/2 text-left',
  right: 'right-[7.4%] w-[36.6%] top-1/2 -translate-y-1/2 text-left',
};

/** Same scale as the 595 pt page: 15 pt body is 2.52% of the width. */
const SIZE = {
  body: 'clamp(11px, 2.6cqw, 18px)',
  impact: 'clamp(15px, 4.1cqw, 28px)',
  title: 'clamp(22px, 6.4cqw, 44px)',
};

export function BookPageView({
  page,
  title,
  comic = false,
  className = '',
}: {
  page: PageView;
  /** Shown on the cover only. */
  title?: string | null;
  /** Comic style puts each spoken line in a caption box. */
  comic?: boolean;
  className?: string;
}) {
  const cover = page.index === 1;
  return (
    <figure
      className={`relative aspect-[3/4] overflow-hidden rounded-sm bg-white/5 shadow-lg ${className}`}
      style={{ containerType: 'inline-size' }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={page.url}
        alt={`Ilustração da página ${page.index}`}
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0" style={{ background: VEIL[page.textZone] }} aria-hidden />
      <figcaption className={`absolute font-display text-[#2b1d22] ${BLOCK[page.textZone]}`}>
        {cover && title ? (
          <p className="mb-[3cqw] font-semibold leading-tight" style={{ fontSize: SIZE.title }}>
            {title}
          </p>
        ) : null}
        <p
          className={`whitespace-pre-wrap ${page.layout === 'impact' || cover ? 'italic' : ''}`}
          style={{
            fontSize: page.layout === 'impact' && !cover ? SIZE.impact : SIZE.body,
            lineHeight: 1.4,
          }}
        >
          {page.text}
        </p>
        {page.dialogue?.length ? (
          <div className="mt-[2cqw] space-y-[1.2cqw]">
            {page.dialogue.map((line) => (
              <p
                key={line}
                className={`italic ${comic ? 'border border-[#2b1d22] bg-[#fbf4ef]/95 px-[1.6cqw] py-[0.8cqw]' : ''}`}
                style={{ fontSize: SIZE.body, lineHeight: 1.35 }}
              >
                {line}
              </p>
            ))}
          </div>
        ) : null}
      </figcaption>
    </figure>
  );
}
