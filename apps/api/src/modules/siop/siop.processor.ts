import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { SiopService } from './services/siop.service';

@Processor('siop-sync')
export class SiopProcessor extends WorkerHost {
  private readonly logger = new Logger(SiopProcessor.name);

  constructor(private readonly siopService: SiopService) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    this.logger.log(`Processing SIOP sync job ${job.id} for tenant ${job.data.tenantId}`);
    
    const result = await this.siopService.syncEmendas(job.data.tenantId);
    
    return result;
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job) {
    this.logger.log(`Job ${job.id} completed successfully`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error) {
    this.logger.error(`Job ${job.id} failed: ${error.message}`);
  }
}
