import type { Metadata } from 'next';
import { Cormorant_Garamond, Figtree } from 'next/font/google';
import { Providers } from '@/components/Providers';
import './globals.css';

const display = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-display',
});

const body = Figtree({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-body',
});

export const metadata: Metadata = {
  title: 'Entre Nós — livro digital personalizado para casais',
  description:
    'Um livro digital de 12 páginas com a história de vocês. Prévia gratuita antes de pagar. R$ 49,90.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className={`${display.variable} ${body.variable} antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
