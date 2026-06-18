import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ScheduleModule } from '@nestjs/schedule';
import { SiopService } from './services/siop.service';
import { SiopClientService } from './services/siop-client.service';
import { SiopScheduleService } from './services/siop-schedule.service';
import { SiopController } from './siop.controller';
import { SiopProcessor } from './siop.processor';
import { PrismaModule } from '@modules/prisma/prisma.module';

@Module({
  imports: [
    BullModule.registerQueue(
      {
        name: 'siop-sync',
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 1000,
          },
          removeOnComplete: false,
          removeOnFail: false,
        },
      },
      {
        name: 'siop-sync-dlq',
        defaultJobOptions: {
          attempts: 1,
          removeOnComplete: true,
        },
      },
    ),
    ScheduleModule.forRoot(),
    PrismaModule,
  ],
  controllers: [SiopController],
  providers: [SiopService, SiopClientService, SiopProcessor, SiopScheduleService],
  exports: [SiopService],
})
export class SiopModule {}
