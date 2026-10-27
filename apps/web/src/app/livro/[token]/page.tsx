'use client';

import { useParams } from 'next/navigation';
import { useMutation, useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export default function ManageBookPage() {
  const params = useParams<{ token: string }>();
  const query = useQuery({
    queryKey: ['book-manage', params.token],
    queryFn: async () => {
      const { data } = await api.get(`/books/manage/${params.token}`);
      return data as {
        names: string;
        status: string;
        coverUrl?: string;
        pageUrl?: string;
        pdfUrl?: string;
        giftRevoked: boolean;
      };
    },
  });

  const revoke = useMutation({
    mutationFn: async () => {
      await api.post(`/books/manage/${params.token}/revoke-gift`);
    },
    onSuccess: () => query.refetch(),
  });

  const book = query.data;

  return (
    <main className="mx-auto max-w-3xl px-6 py-12 text-mist">
      <p className="font-display text-3xl text-champagne">Entre Nós</p>
      <h1 className="mt-3 font-display text-3xl">{book?.names ?? 'Seu livro'}</h1>
      <p className="mt-2 text-sm text-mist-dim">Link do comprador · status: {book?.status}</p>
      {book?.coverUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={book.coverUrl} alt="" className="mt-8 w-full max-w-md rounded-sm" />
      ) : null}
      <div className="mt-6 flex flex-wrap gap-3">
        {book?.pdfUrl ? (
          <a
            href={book.pdfUrl}
            target="_blank"
            rel="noreferrer"
            className="rounded-md bg-champagne px-4 py-2 text-sm font-semibold text-ink"
          >
            Baixar PDF
          </a>
        ) : null}
        <button
          type="button"
          onClick={() => revoke.mutate()}
          disabled={book?.giftRevoked}
          className="rounded-md border border-white/20 px-4 py-2 text-sm disabled:opacity-50"
        >
          {book?.giftRevoked ? 'Presente revogado' : 'Revogar link de presente'}
        </button>
      </div>
    </main>
  );
}
