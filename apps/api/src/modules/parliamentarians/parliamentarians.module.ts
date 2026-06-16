import { Module } from '@nestjs/common';
import { ParliamentariansService } from './parliamentarians.service';
import { ParliamentariansController } from './parliamentarians.controller';

@Module({
  controllers: [ParliamentariansController],
  providers: [ParliamentariansService],
  exports: [ParliamentariansService],
})
export class ParliamentariansModule {}
