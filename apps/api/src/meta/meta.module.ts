import { Global, Module } from '@nestjs/common';
import { MetaController } from './meta.controller';
import { MetaService } from './meta.service';

@Global()
@Module({
  controllers: [MetaController],
  providers: [MetaService],
  exports: [MetaService],
})
export class MetaModule {}
