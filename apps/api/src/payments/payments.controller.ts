import {
  Body,
  Controller,
  Headers,
  Param,
  Post,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { PaymentsService } from './payments.service';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  @Post('checkout')
  checkout(@Body() body: { token: string; email?: string }) {
    return this.payments.createCheckout(body.token, body.email);
  }

  @Post('webhook')
  webhook(
    @Req() req: Request,
    @Headers('stripe-signature') signature: string | undefined,
  ) {
    const raw = req.body as Buffer;
    return this.payments.handleWebhook(raw, signature);
  }

  @Post('mock-pay/:orderId')
  mockPay(@Param('orderId') orderId: string) {
    return this.payments.mockPay(orderId);
  }
}
