import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ScheduleModule } from '@nestjs/schedule';
import { SiopService } from './services/siop.service';
import { SiopClientService } from './services/siop-client.service';
import { SiopScheduleService } from './services/siop-schedule.service';
import { SiopController } from './siop.controller';
import { SiopProcessor } from './siop.processor';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'siop-sync',
    }),
    ScheduleModule.forRoot(),
  ],
  controllers: [SiopController],
  providers: [SiopService, SiopClientService, SiopProcessor, SiopScheduleService],
  exports: [SiopService],
})
export class SiopModule {}
