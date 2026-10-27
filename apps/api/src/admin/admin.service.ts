import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { QueueService } from '../queue/queue.service';
import { ProductionService } from '../production/production.service';
import { AnalyticsService } from '../analytics/analytics.service';

const MAX_REPROCESS = 5;

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly queue: QueueService,
    private readonly production: ProductionService,
    private readonly analytics: AnalyticsService,
  ) {}

  async list(q?: string) {
    const where: Prisma.OrderWhereInput = q
      ? {
          OR: [
            { id: { contains: q } },
            { email: { contains: q, mode: 'insensitive' } },
            { draft: { nameA: { contains: q, mode: 'insensitive' } } },
            { draft: { nameB: { contains: q, mode: 'insensitive' } } },
            { stripeSessionId: { contains: q } },
          ],
        }
      : {};

    const orders = await this.prisma.order.findMany({
      where,
      include: {
        draft: true,
        payments: { orderBy: { createdAt: 'desc' }, take: 3 },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return orders.map((o) => ({
      id: o.id,
      status: o.status,
      productionStage: o.productionStage,
      productionError: o.productionError,
      email: o.email ?? o.draft.email,
      names: `${o.draft.nameA ?? ''} & ${o.draft.nameB ?? ''}`,
      amountCents: o.amountCents,
      reprocessCount: o.reprocessCount,
      notes: o.notes,
      paidAt: o.paidAt,
      deliveredAt: o.deliveredAt,
      createdAt: o.createdAt,
    }));
  }

  async get(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        draft: { include: { preview: true } },
        payments: true,
        jobs: { orderBy: { createdAt: 'desc' }, take: 20 },
      },
    });
    if (!order) throw new NotFoundException('Pedido não encontrado');
    return order;
  }

  async reprocess(id: string) {
    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) throw new NotFoundException('Pedido não encontrado');
    if (order.reprocessCount >= MAX_REPROCESS) {
      throw new BadRequestException(`Limite de ${MAX_REPROCESS} reprocessamentos`);
    }
    await this.prisma.order.update({
      where: { id },
      data: {
        reprocessCount: { increment: 1 },
        productionError: null,
        productionStage: 'queued',
        status: order.status === 'delivered' ? 'producing' : order.status,
      },
    });
    await this.queue.enqueue({ kind: 'production', orderId: id, force: true });
    return { ok: true, reprocessCount: order.reprocessCount + 1 };
  }

  async resendAccess(id: string) {
    return this.production.sendAccessEmail(id);
  }

  async updateNotes(id: string, notes: string) {
    return this.prisma.order.update({
      where: { id },
      data: { notes },
    });
  }

  funnel() {
    return this.analytics.summary();
  }
}
