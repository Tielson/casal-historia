'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import { initMetaPixel } from '@/lib/meta';

export function Providers({ children }: { children: ReactNode }) {
  const [client] = useState(() => new QueryClient());
  if (typeof window !== 'undefined') initMetaPixel();
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
