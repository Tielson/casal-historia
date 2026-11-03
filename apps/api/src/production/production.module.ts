import { Module } from '@nestjs/common';
import { GenerationService } from '../generation/generation.service';
import { MailModule } from '../mail/mail.module';
import { ProductionController } from './production.controller';
import { ProductionService } from './production.service';
import { PdfService } from './pdf.service';
import { EmailService } from './email.service';

@Module({
  imports: [MailModule],
  controllers: [ProductionController],
  providers: [ProductionService, PdfService, EmailService, GenerationService],
  exports: [ProductionService],
})
export class ProductionModule {}
