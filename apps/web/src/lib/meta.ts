'use client';

import { api } from './api';

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    __enFbqStub?: boolean;
  }
}

/** Client Pixel stub — queues events; loads real fbevents.js when pixel id exists. */
export function initMetaPixel() {
  if (typeof window === 'undefined') return;
  const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID;
  if (!pixelId) {
    if (!window.__enFbqStub) {
      window.fbq = (...args: unknown[]) => {
        // eslint-disable-next-line no-console
        console.info('[Meta Pixel stub]', ...args);
      };
      window.__enFbqStub = true;
    }
    return;
  }
  if (window.fbq) return;
  const n = function (...args: unknown[]) {
    // @ts-expect-error fbq queue
    n.callMethod ? n.callMethod(...args) : n.queue.push(args);
  } as ((...args: unknown[]) => void) & {
    queue: unknown[];
    loaded: boolean;
    version: string;
    callMethod?: (...args: unknown[]) => void;
  };
  n.queue = [];
  n.loaded = true;
  n.version = '2.0';
  window.fbq = n;
  const s = document.createElement('script');
  s.async = true;
  s.src = 'https://connect.facebook.net/en_US/fbevents.js';
  document.head.appendChild(s);
  window.fbq('init', pixelId);
  window.fbq('track', 'PageView');
}

export function trackMeta(
  event: 'ViewContent' | 'InitiateCheckout' | 'Purchase',
  params?: Record<string, unknown>,
  eventId?: string,
) {
  initMetaPixel();
  window.fbq?.('track', event, params ?? {}, eventId ? { eventID: eventId } : undefined);
  // Mirror to CAPI stub on API
  void api.post('/meta/capi', {
    eventName: event,
    value: params?.value,
    currency: params?.currency,
    orderId: params?.order_id ?? params?.content_ids?.[0],
    eventId,
  }).catch(() => undefined);
}

export function trackFunnel(
  name:
    | 'visit'
    | 'create_started'
    | 'photos_uploaded'
    | 'style_chosen'
    | 'memories_done'
    | 'preview_ready'
    | 'checkout'
    | 'payment'
    | 'delivery',
  extra?: { draftId?: string; orderId?: string; meta?: Record<string, unknown> },
) {
  void api
    .post('/analytics/events', {
      name,
      path: typeof window !== 'undefined' ? window.location.pathname : undefined,
      ...extra,
    })
    .catch(() => undefined);
}
