'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export default function GiftBookPage() {
  const params = useParams<{ token: string }>();

  useEffect(() => {
    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex, nofollow';
    document.head.appendChild(meta);
    return () => {
      document.head.removeChild(meta);
    };
  }, []);

  const query = useQuery({
    queryKey: ['book-gift', params.token],
    queryFn: async () => {
      const { data } = await api.get(`/books/gift/${params.token}`);
      return data as {
        names: string;
        coverUrl?: string;
        pageUrl?: string;
        pdfUrl?: string;
        coverText?: string;
        pageText?: string;
      };
    },
  });

  const book = query.data;

  return (
    <main className="mx-auto max-w-3xl px-6 py-12 text-mist">
      <p className="text-xs uppercase tracking-[0.2em] text-foam">Presente · somente leitura</p>
      <h1 className="mt-3 font-display text-4xl text-champagne">{book?.names ?? '…'}</h1>
      {book?.coverUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={book.coverUrl} alt="" className="mt-8 w-full max-w-lg rounded-sm" />
      ) : null}
      {book?.pageText ? (
        <p className="mt-6 whitespace-pre-wrap text-mist-dim">{book.pageText}</p>
      ) : null}
      {book?.pdfUrl ? (
        <a
          href={book.pdfUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-8 inline-flex rounded-md bg-champagne px-4 py-2 text-sm font-semibold text-ink"
        >
          Abrir nosso livro
        </a>
      ) : null}
    </main>
  );
}
