import { Module } from '@nestjs/common';
import { PhysicalExecutionService } from './physical-execution.service';
import { PhysicalExecutionController } from './physical-execution.controller';

@Module({
  controllers: [PhysicalExecutionController],
  providers: [PhysicalExecutionService],
  exports: [PhysicalExecutionService],
})
export class PhysicalExecutionModule {}
