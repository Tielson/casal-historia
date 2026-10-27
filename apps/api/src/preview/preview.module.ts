import { Module } from '@nestjs/common';
import { GenerationService } from '../generation/generation.service';
import { PreviewController } from './preview.controller';
import { PreviewService } from './preview.service';

@Module({
  controllers: [PreviewController],
  providers: [PreviewService, GenerationService],
  exports: [PreviewService, GenerationService],
})
export class PreviewModule {}
