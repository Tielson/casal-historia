import { Injectable, Logger } from '@nestjs/common';
import { funnelEventSchema, type FunnelEventPayload } from '@entre-nos/shared';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async track(payload: FunnelEventPayload) {
    const data = funnelEventSchema.parse(payload);
    const row = await this.prisma.funnelEvent.create({
      data: {
        name: data.name,
        draftId: data.draftId,
        orderId: data.orderId,
        clientId: data.clientId,
        path: data.path,
        meta: (data.meta as object | undefined) ?? undefined,
      },
    });
    this.logger.log(`funnel:${data.name} draft=${data.draftId ?? '-'} order=${data.orderId ?? '-'}`);
    return row;
  }

  async summary() {
    const rows = await this.prisma.funnelEvent.groupBy({
      by: ['name'],
      _count: { _all: true },
      orderBy: { name: 'asc' },
    });
    return rows.map((r) => ({ name: r.name, count: r._count._all }));
  }
}
