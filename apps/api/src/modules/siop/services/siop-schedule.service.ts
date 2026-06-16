import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '@modules/prisma/prisma.service';

@Injectable()
export class SiopScheduleService implements OnModuleInit {
  private readonly logger = new Logger(SiopScheduleService.name);

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue('siop-sync') private readonly siopQueue: Queue,
  ) {}

  async onModuleInit() {
    this.logger.log('SIOP Scheduler initialized');
  }

  // Every day at 2 AM
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async handleDailySync() {
    this.logger.log('Starting scheduled SIOP sync for all active tenants');

    const tenants = await this.prisma.tenant.findMany({
      where: { status: 'ACTIVE' },
      select: { id: true },
    });

    for (const tenant of tenants) {
      await this.siopQueue.add('sync', { tenantId: tenant.id }, {
        attempts: 3,
        backoff: { type: 'exponential', delay: 1000 },
        removeOnComplete: true,
      });
    }

    this.logger.log(`Added ${tenants.length} sync jobs to queue`);
  }
}
