import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { ProductionModule } from '../production/production.module';

@Module({
  imports: [ProductionModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
