import { Module } from '@nestjs/common';
import { UploadsController } from './uploads.controller';
import { UploadsService } from './uploads.service';
import { DraftsModule } from '../drafts/drafts.module';

@Module({
  imports: [DraftsModule],
  controllers: [UploadsController],
  providers: [UploadsService],
})
export class UploadsModule {}
