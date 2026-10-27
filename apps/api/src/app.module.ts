import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { StorageModule } from './storage/storage.module';
import { QueueModule } from './queue/queue.module';
import { DraftsModule } from './drafts/drafts.module';
import { UploadsModule } from './uploads/uploads.module';
import { PreviewModule } from './preview/preview.module';
import { PaymentsModule } from './payments/payments.module';
import { ProductionModule } from './production/production.module';
import { AdminModule } from './admin/admin.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { MetaModule } from './meta/meta.module';
import { HealthController } from './health.controller';

@Module({
  imports: [
    PrismaModule,
    StorageModule,
    QueueModule,
    DraftsModule,
    UploadsModule,
    PreviewModule,
    PaymentsModule,
    ProductionModule,
    AdminModule,
    AnalyticsModule,
    MetaModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
