import { Module } from '@nestjs/common';
import { EmendasService } from './emendas.service';
import { EmendasController } from './emendas.controller';

@Module({
  controllers: [EmendasController],
  providers: [EmendasService],
  exports: [EmendasService],
})
export class EmendasModule {}
