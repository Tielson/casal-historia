import { Body, Controller, Get, Post } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import type { FunnelEventPayload } from '@entre-nos/shared';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analytics: AnalyticsService) {}

  @Post('events')
  track(@Body() body: FunnelEventPayload) {
    return this.analytics.track(body);
  }

  @Get('funnel')
  summary() {
    return this.analytics.summary();
  }
}
