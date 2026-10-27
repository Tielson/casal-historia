'use client';

import Link from 'next/link';

export function StickyMobileCta({
  href = '/criar',
  label = 'Criar nossa história',
}: {
  href?: string;
  label?: string;
}) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-[#10181c]/95 px-4 py-3 backdrop-blur md:hidden pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
      <Link
        href={href}
        className="flex w-full items-center justify-center rounded-md bg-champagne px-4 py-3 text-center text-sm font-semibold text-ink"
      >
        {label}
      </Link>
    </div>
  );
}
