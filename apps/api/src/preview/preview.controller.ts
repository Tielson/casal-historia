import { Controller, Get, Param, Post, Query } from '@nestjs/common';
import { PreviewService } from './preview.service';

@Controller('preview')
export class PreviewController {
  constructor(private readonly preview: PreviewService) {}

  @Post(':token/start')
  start(@Param('token') token: string, @Query('regen') regen?: string) {
    return this.preview.start(token, regen === '1' || regen === 'true');
  }

  @Get(':token')
  get(@Param('token') token: string) {
    return this.preview.get(token);
  }

  @Post(':token/approve')
  approve(@Param('token') token: string) {
    return this.preview.approve(token);
  }
}
