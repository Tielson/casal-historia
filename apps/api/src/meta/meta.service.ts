import { Injectable, Logger } from '@nestjs/common';
import type { MetaEventName } from '@entre-nos/shared';
import { config } from '../config';

/**
 * Meta Conversions API stub.
 * When META_CAPI_ENABLED=true and tokens exist, posts to Graph API.
 * Otherwise logs the payload for local verification.
 */
@Injectable()
export class MetaService {
  private readonly logger = new Logger(MetaService.name);

  async sendEvent(
    eventName: MetaEventName,
    data: {
      value?: number;
      currency?: string;
      orderId?: string;
      eventId?: string;
      clientIp?: string;
      userAgent?: string;
      email?: string;
    } = {},
  ) {
    const eventId = data.eventId ?? `${eventName}_${data.orderId ?? Date.now()}`;
    const payload = {
      data: [
        {
          event_name: eventName,
          event_time: Math.floor(Date.now() / 1000),
          event_id: eventId,
          action_source: 'website',
          event_source_url: config.webUrl,
          user_data: {
            client_ip_address: data.clientIp,
            client_user_agent: data.userAgent,
            em: data.email ? [data.email] : undefined,
          },
          custom_data: {
            currency: data.currency,
            value: data.value,
            content_name: 'Entre Nós — livro digital',
            content_ids: data.orderId ? [data.orderId] : undefined,
          },
        },
      ],
      test_event_code: config.meta.testEventCode || undefined,
    };

    if (!config.meta.capiEnabled || !config.meta.pixelId || !config.meta.accessToken) {
      this.logger.log(`[CAPI stub] ${eventName} ${JSON.stringify(payload)}`);
      return { ok: true, stub: true, eventId };
    }

    const url = `https://graph.facebook.com/v19.0/${config.meta.pixelId}/events?access_token=${config.meta.accessToken}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      this.logger.warn(`CAPI error: ${res.status} ${JSON.stringify(json)}`);
    }
    return { ok: res.ok, stub: false, eventId, response: json };
  }
}
