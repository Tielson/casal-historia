import type { Metadata } from 'next';
import localFont from 'next/font/local';
import { Providers } from '@/components/Providers';
import './globals.css';

const display = localFont({
  src: [
    { path: '../fonts/cormorant-garamond-latin-400-normal.woff2', weight: '400', style: 'normal' },
    { path: '../fonts/cormorant-garamond-latin-500-normal.woff2', weight: '500', style: 'normal' },
    { path: '../fonts/cormorant-garamond-latin-600-normal.woff2', weight: '600', style: 'normal' },
    { path: '../fonts/cormorant-garamond-latin-700-normal.woff2', weight: '700', style: 'normal' },
  ],
  variable: '--font-display',
  display: 'swap',
});

const body = localFont({
  src: [
    { path: '../fonts/figtree-latin-400-normal.woff2', weight: '400', style: 'normal' },
    { path: '../fonts/figtree-latin-500-normal.woff2', weight: '500', style: 'normal' },
    { path: '../fonts/figtree-latin-600-normal.woff2', weight: '600', style: 'normal' },
    { path: '../fonts/figtree-latin-700-normal.woff2', weight: '700', style: 'normal' },
  ],
  variable: '--font-body',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Entre Nós — livro digital personalizado para casais',
  description:
    'Um livro digital de 12 páginas com a história de vocês. Prévia gratuita antes de pagar. R$ 49,90.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body
        className={`${display.variable} ${body.variable} antialiased`}
        suppressHydrationWarning
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
