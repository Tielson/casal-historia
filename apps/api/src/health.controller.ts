import { Controller, Get } from '@nestjs/common';
import { config } from './config';
import { PRICE_CENTS, PRICE_LABEL } from '@entre-nos/shared';

@Controller()
export class HealthController {
  @Get('health')
  health() {
    return {
      ok: true,
      service: 'entre-nos-api',
      mockGeneration: config.mockGeneration,
      priceCents: config.priceCents || PRICE_CENTS,
      priceLabel: PRICE_LABEL,
    };
  }
}
