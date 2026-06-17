import { Module } from '@nestjs/common';
import { ConveniosService } from './convenios.service';
import { ConveniosController, FinancialScheduleController } from './convenios.controller';

@Module({
  controllers: [ConveniosController, FinancialScheduleController],
  providers: [ConveniosService],
  exports: [ConveniosService],
})
export class ConveniosModule {}
