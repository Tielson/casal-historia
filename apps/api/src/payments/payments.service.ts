import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import Stripe from 'stripe';
import { PRICE_CENTS } from '@entre-nos/shared';
import { config } from '../config';
import { PrismaService } from '../prisma/prisma.service';
import { QueueService } from '../queue/queue.service';
import { AnalyticsService } from '../analytics/analytics.service';
import { MetaService } from '../meta/meta.service';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private stripe: Stripe | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly queue: QueueService,
    private readonly analytics: AnalyticsService,
    private readonly meta: MetaService,
  ) {
    if (config.stripeSecretKey) {
      this.stripe = new Stripe(config.stripeSecretKey);
    }
  }

  private priceCents() {
    return config.priceCents || PRICE_CENTS;
  }

  async createCheckout(token: string, email?: string) {
    const draft = await this.prisma.draft.findUnique({
      where: { token },
      include: { order: true, preview: true },
    });
    if (!draft) throw new NotFoundException('Rascunho não encontrado');
    if (!draft.previewApproved || draft.preview?.stage !== 'ready') {
      throw new BadRequestException('Aprove a prévia antes do pagamento');
    }

    const amount = this.priceCents();
    const currency = config.currency;

    let order = draft.order;
    if (!order) {
      order = await this.prisma.order.create({
        data: {
          draftId: draft.id,
          status: 'pending_payment',
          amountCents: amount,
          currency,
          email: email ?? draft.email,
        },
      });
    } else if (order.status === 'paid' || order.status === 'delivered' || order.status === 'producing') {
      throw new BadRequestException('Pedido já pago');
    } else {
      order = await this.prisma.order.update({
        where: { id: order.id },
        data: {
          amountCents: amount,
          currency,
          email: email ?? draft.email ?? order.email,
          status: 'pending_payment',
        },
      });
    }

    if (email) {
      await this.prisma.draft.update({
        where: { id: draft.id },
        data: { email, step: 'checkout', status: 'checkout' },
      });
    } else {
      await this.prisma.draft.update({
        where: { id: draft.id },
        data: { step: 'checkout', status: 'checkout' },
      });
    }

    await this.analytics.track({
      name: 'checkout',
      draftId: draft.id,
      orderId: order.id,
    });
    await this.meta.sendEvent('InitiateCheckout', {
      value: amount / 100,
      currency: currency.toUpperCase(),
      orderId: order.id,
    });

    if (!this.stripe) {
      // Dev mock checkout — redirects to success simulator
      const mockUrl = `${config.webUrl}/sucesso?orderId=${order.id}&mock=1&session_id=mock_${order.id}`;
      await this.prisma.order.update({
        where: { id: order.id },
        data: { stripeSessionId: `mock_${order.id}` },
      });
      return {
        url: mockUrl,
        orderId: order.id,
        amountCents: amount,
        currency,
        mock: true,
      };
    }

    const session = await this.stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: email ?? draft.email ?? undefined,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency,
            unit_amount: amount,
            product_data: {
              name: 'Entre Nós — livro digital personalizado',
              description: '12 páginas digitais com prévia aprovada',
            },
          },
        },
      ],
      metadata: { orderId: order.id, draftId: draft.id },
      success_url: `${config.webUrl}/sucesso?orderId=${order.id}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${config.webUrl}/criar/revisao?canceled=1`,
    });

    await this.prisma.order.update({
      where: { id: order.id },
      data: { stripeSessionId: session.id },
    });

    return {
      url: session.url,
      orderId: order.id,
      amountCents: amount,
      currency,
      mock: false,
    };
  }

  /** Dev-only path when Stripe keys are absent */
  async mockPay(orderId: string) {
    if (this.stripe) {
      throw new BadRequestException('Use o webhook Stripe em produção');
    }
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Pedido não encontrado');
    return this.markPaid({
      orderId: order.id,
      stripeEventId: `mock_evt_${order.id}`,
      stripeSessionId: order.stripeSessionId ?? `mock_${order.id}`,
      stripePaymentId: `mock_pi_${order.id}`,
      amountCents: order.amountCents,
      currency: order.currency,
    });
  }

  async handleWebhook(rawBody: Buffer, signature: string | undefined) {
    if (!this.stripe || !config.stripeWebhookSecret) {
      throw new BadRequestException('Webhook Stripe não configurado');
    }
    let event: Stripe.Event;
    try {
      event = this.stripe.webhooks.constructEvent(
        rawBody,
        signature ?? '',
        config.stripeWebhookSecret,
      );
    } catch (err) {
      this.logger.warn(`Webhook signature failed: ${(err as Error).message}`);
      throw new BadRequestException('Assinatura inválida');
    }

    if (event.type !== 'checkout.session.completed') {
      return { received: true, ignored: event.type };
    }

    const session = event.data.object as Stripe.Checkout.Session;
    const orderId = session.metadata?.orderId;
    if (!orderId) throw new BadRequestException('orderId ausente no metadata');

    const amount = session.amount_total ?? 0;
    const currency = (session.currency ?? '').toLowerCase();
    if (amount !== this.priceCents() || currency !== config.currency) {
      throw new BadRequestException(
        `Valor/moeda inválidos: ${amount} ${currency}`,
      );
    }
    if (session.payment_status !== 'paid') {
      return { received: true, unpaid: true };
    }

    return this.markPaid({
      orderId,
      stripeEventId: event.id,
      stripeSessionId: session.id,
      stripePaymentId:
        typeof session.payment_intent === 'string'
          ? session.payment_intent
          : session.payment_intent?.id,
      amountCents: amount,
      currency,
      email: session.customer_details?.email ?? session.customer_email,
    });
  }

  private async markPaid(input: {
    orderId: string;
    stripeEventId: string;
    stripeSessionId?: string | null;
    stripePaymentId?: string | null;
    amountCents: number;
    currency: string;
    email?: string | null;
  }) {
    const existing = await this.prisma.payment.findUnique({
      where: { stripeEventId: input.stripeEventId },
    });
    if (existing) {
      return { ok: true, idempotent: true, orderId: existing.orderId };
    }

    const order = await this.prisma.order.findUnique({
      where: { id: input.orderId },
      include: { draft: true },
    });
    if (!order) throw new NotFoundException('Pedido não encontrado');

    if (input.amountCents !== order.amountCents || input.currency !== order.currency) {
      throw new BadRequestException('Inconsistência de valor no pedido');
    }

    await this.prisma.payment.create({
      data: {
        orderId: order.id,
        stripeEventId: input.stripeEventId,
        stripeSessionId: input.stripeSessionId ?? undefined,
        amountCents: input.amountCents,
        currency: input.currency,
        status: 'paid',
        rawType: 'checkout.session.completed',
      },
    });

    if (order.status === 'paid' || order.status === 'producing' || order.status === 'delivered') {
      return { ok: true, idempotent: true, orderId: order.id };
    }

    await this.prisma.order.update({
      where: { id: order.id },
      data: {
        status: 'paid',
        paidAt: new Date(),
        stripePaymentId: input.stripePaymentId ?? undefined,
        email: input.email ?? order.email,
        productionStage: 'queued',
      },
    });

    await this.prisma.draft.update({
      where: { id: order.draftId },
      data: {
        status: 'paid',
        step: 'production',
        email: input.email ?? order.draft.email,
      },
    });

    await this.analytics.track({
      name: 'payment',
      draftId: order.draftId,
      orderId: order.id,
    });
    await this.meta.sendEvent('Purchase', {
      value: input.amountCents / 100,
      currency: input.currency.toUpperCase(),
      orderId: order.id,
    });

    // Idempotent production trigger
    await this.queue.enqueue({ kind: 'production', orderId: order.id });

    return { ok: true, orderId: order.id };
  }
}
