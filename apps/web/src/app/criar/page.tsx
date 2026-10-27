'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ensureDraft } from '@/lib/api';
import { trackFunnel } from '@/lib/meta';

export default function CriarIndex() {
  const router = useRouter();
  useEffect(() => {
    void (async () => {
      const draft = await ensureDraft();
      trackFunnel('create_started', { draftId: draft.id });
      router.replace('/criar/ocasiao');
    })();
  }, [router]);
  return (
    <main className="flex min-h-[100svh] items-center justify-center bg-ink text-mist">
      <p className="font-display text-2xl text-champagne">Preparando seu rascunho…</p>
    </main>
  );
}
