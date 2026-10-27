import { Controller, Get, Param, Post } from '@nestjs/common';
import { ProductionService } from './production.service';

@Controller()
export class ProductionController {
  constructor(private readonly production: ProductionService) {}

  @Get('orders/:orderId/status')
  status(@Param('orderId') orderId: string) {
    return this.production.status(orderId);
  }

  @Get('books/manage/:token')
  manage(@Param('token') token: string) {
    return this.production.getByManageToken(token);
  }

  @Get('books/gift/:token')
  gift(@Param('token') token: string) {
    return this.production.getByGiftToken(token);
  }

  @Post('books/manage/:token/revoke-gift')
  revoke(@Param('token') token: string) {
    return this.production.revokeGift(token);
  }
}
