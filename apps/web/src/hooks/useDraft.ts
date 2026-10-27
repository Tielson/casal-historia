'use client';

import { useQuery } from '@tanstack/react-query';
import { ensureDraft } from '@/lib/api';

export function useDraft() {
  return useQuery({ queryKey: ['draft'], queryFn: ensureDraft });
}
