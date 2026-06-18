import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job, Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';
import { SiopService } from './services/siop.service';

@Processor('siop-sync')
export class SiopProcessor extends WorkerHost {
  private readonly logger = new Logger(SiopProcessor.name);

  constructor(
    private readonly siopService: SiopService,
    @InjectQueue('siop-sync-dlq') private readonly dlq: Queue,
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    this.logger.log(`[${job.id}] Processing SIOP sync for tenant ${job.data.tenantId} (attempt ${job.attemptsMade + 1})`);
    
    try {
      const result = await this.siopService.syncEmendas(job.data.tenantId);
      this.logger.log(`[${job.id}] Sync completed: ${result.processed} processed, ${result.errors} errors`);
      return result;
    } catch (error) {
      this.logger.error(`[${job.id}] Sync attempt ${job.attemptsMade + 1} failed: ${error.message}`);
      
      // Move to DLQ after all retries exhausted
      if (job.attemptsMade >= (job.opts.attempts || 3) - 1) {
        this.logger.warn(`[${job.id}] All retries exhausted, moving to DLQ`);
        await this.dlq.add('sync-failed', {
          originalJobId: job.id,
          tenantId: job.data.tenantId,
          errorMessage: error.message,
          failedAt: new Date().toISOString(),
        });
      }
      
      throw error;
    }
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job) {
    this.logger.log(`[${job.id}] Job completed successfully`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error) {
    this.logger.error(`[${job.id}] Job failed after ${job.attemptsMade} attempt(s): ${error.message}`);
  }
}
