/**
 * Entre Nós mark: two ribbons that cross like a knot ("nó") and close into a heart —
 * one ribbon per person. The champagne ribbon passes over the blush one, which is split
 * at the crossing, so the mark sits on any background. Source: Paper file "Nós-Dois", page Logo.
 */
export function LogoMark({ className = '', title }: { className?: string; title?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      className={className}
    >
      <path
        d="M42.5 59C40.75 57.53 38.81 56.07 36.78 54.6M27.46 48.09C17.44 41 8 33.33 8 23.5c0-9 6-14.5 13-14.5 6 0 10 4 11 9.5"
        stroke="var(--blush)"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <path
        d="M21.5 59C34 48.5 56 38.5 56 23.5 56 14.5 50 9 43 9c-6 0-10 4-11 9.5"
        stroke="var(--champagne)"
        strokeWidth="5"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Mark + wordmark. Size it with a text-* class: the mark scales with the font size. */
export function Logo({ className = '' }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-[0.3em] font-display leading-none ${className}`}>
      <LogoMark className="h-[1.15em] w-[1.15em] shrink-0" />
      <span className="translate-y-[0.04em] text-champagne">Entre Nós</span>
    </span>
  );
}
