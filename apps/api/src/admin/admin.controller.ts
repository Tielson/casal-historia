import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AdminGuard } from './admin.guard';
import { AdminService } from './admin.service';

@Controller('admin')
@UseGuards(AdminGuard)
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @Get('orders')
  list(@Query('q') q?: string) {
    return this.admin.list(q);
  }

  @Get('orders/:id')
  get(@Param('id') id: string) {
    return this.admin.get(id);
  }

  @Post('orders/:id/reprocess')
  reprocess(@Param('id') id: string) {
    return this.admin.reprocess(id);
  }

  @Post('orders/:id/resend-access')
  resend(@Param('id') id: string) {
    return this.admin.resendAccess(id);
  }

  @Patch('orders/:id/notes')
  notes(@Param('id') id: string, @Body() body: { notes: string }) {
    return this.admin.updateNotes(id, body.notes ?? '');
  }

  @Get('funnel')
  funnel() {
    return this.admin.funnel();
  }
}
