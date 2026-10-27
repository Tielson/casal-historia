'use client';

import { useEffect } from 'react';
import { trackFunnel, trackMeta } from '@/lib/meta';

export function LandingViewContent() {
  useEffect(() => {
    trackFunnel('visit');
    trackMeta('ViewContent', {
      content_name: 'Entre Nós Landing',
      content_category: 'digital_book',
      value: 49.9,
      currency: 'BRL',
    });
  }, []);
  return null;
}
