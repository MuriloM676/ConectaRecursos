import { Module } from '@nestjs/common';
import { ImpedimentsService } from './impediments.service';
import { ImpedimentsController } from './impediments.controller';

@Module({
  controllers: [ImpedimentsController],
  providers: [ImpedimentsService],
  exports: [ImpedimentsService],
})
export class ImpedimentsModule {}
