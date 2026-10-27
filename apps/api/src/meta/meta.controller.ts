import { Body, Controller, Post } from '@nestjs/common';
import type { MetaEventName } from '@entre-nos/shared';
import { MetaService } from './meta.service';

@Controller('meta')
export class MetaController {
  constructor(private readonly meta: MetaService) {}

  @Post('capi')
  capi(
    @Body()
    body: {
      eventName: MetaEventName;
      value?: number;
      currency?: string;
      orderId?: string;
      eventId?: string;
      email?: string;
    },
  ) {
    return this.meta.sendEvent(body.eventName, body);
  }
}
