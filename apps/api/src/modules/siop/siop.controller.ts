import { Controller, Post, Get, Param, HttpCode, HttpStatus, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { SiopService } from './services/siop.service';
import { PrismaService } from '@modules/prisma/prisma.service';
import { RequirePermissions } from '@common/decorators/permissions.decorator';
import { CurrentUser, GetCurrentUser } from '@common/decorators/current-user.decorator';

@ApiTags('SIOP')
@ApiBearerAuth()
@Controller('siop')
export class SiopController {
  constructor(
    private readonly siopService: SiopService,
    private readonly prisma: PrismaService,
    @InjectQueue('siop-sync') private readonly siopQueue: Queue,
  ) {}

  @Post('sync')
  @RequirePermissions('siop:sync')
  @ApiOperation({ summary: 'Trigger manual SIOP synchronization for the current tenant via background job' })
  async sync(@GetCurrentUser() user: any) {
    const job = await this.siopQueue.add('sync', { tenantId: user.tenantId }, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 1000,
      },
      removeOnComplete: true,
    });
    
    return { jobId: job.id, message: 'Sync job added to queue' };
  }

  @Post('sync/direct')
  @RequirePermissions('siop:sync')
  @ApiOperation({ summary: 'Trigger direct SIOP synchronization (Synchronous)' })
  async syncDirect(@GetCurrentUser() user: any) {
    return this.siopService.syncEmendas(user.tenantId);
  }

  @Get('jobs')
  @RequirePermissions('siop:read')
  @ApiOperation({ summary: 'List recent sync jobs' })
  async listJobs(@GetCurrentUser() user: any) {
    return this.prisma.syncJob.findMany({
      where: { provider: 'SIOP' },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });
  }

  @Get('jobs/:id')
  @RequirePermissions('siop:read')
  @ApiOperation({ summary: 'Get sync job details' })
  @ApiResponse({ status: 200, description: 'Sync job details' })
  @ApiResponse({ status: 404, description: 'Job not found' })
  async getJob(@Param('id') id: string) {
    const job = await this.prisma.syncJob.findUnique({
      where: { id },
    });

    if (!job) {
      throw new NotFoundException('Sync job not found');
    }

    return job;
  }

  @Post('reprocess/:jobId')
  @RequirePermissions('siop:reprocess')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({
    summary: 'Reprocess a failed sync job',
    description: 'Re-queues a failed SIOP sync job for reprocessing.',
  })
  @ApiResponse({ status: 202, description: 'Job re-queued for reprocessing' })
  @ApiResponse({ status: 404, description: 'Job not found' })
  async reprocess(@Param('jobId') jobId: string) {
    const job = await this.prisma.syncJob.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      throw new NotFoundException('Sync job not found');
    }

    // Reset the job status to PENDING
    await this.prisma.syncJob.update({
      where: { id: jobId },
      data: {
        status: 'PENDING',
        errorMessage: null,
        finishedAt: null,
        startedAt: null,
        recordsProcessed: 0,
      },
    });

    // Get the tenant ID from the original job context
    // For reprocess, we use the current user's tenant or the original job's context
    // Re-add to queue for processing
    const newJob = await this.siopQueue.add('sync', { tenantId: jobId }, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 1000 },
      removeOnComplete: false,
    });

    return {
      originalJobId: jobId,
      newJobId: newJob.id,
      message: 'Job re-queued for reprocessing',
    };
  }

  @Get('sync-status')
  @RequirePermissions('siop:read')
  @ApiOperation({
    summary: 'Get current SIOP sync status',
    description: 'Returns the status of the most recent sync jobs.',
  })
  @ApiResponse({ status: 200, description: 'Sync status information' })
  async getSyncStatus() {
    const lastSync = await this.prisma.syncJob.findFirst({
      where: { provider: 'SIOP' },
      orderBy: { createdAt: 'desc' },
    });

    const recentJobs = await this.prisma.syncJob.findMany({
      where: { provider: 'SIOP' },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        status: true,
        recordsProcessed: true,
        errorMessage: true,
        startedAt: true,
        finishedAt: true,
        createdAt: true,
      },
    });

    const stats = await this.prisma.syncJob.groupBy({
      by: ['status'],
      where: { provider: 'SIOP' },
      _count: { status: true },
    });

    const statusCounts = stats.reduce(
      (acc, s) => {
        acc[s.status] = s._count.status;
        return acc;
      },
      {} as Record<string, number>,
    );

    return {
      lastSync: lastSync
        ? {
            id: lastSync.id,
            status: lastSync.status,
            recordsProcessed: lastSync.recordsProcessed,
            errorMessage: lastSync.errorMessage,
            startedAt: lastSync.startedAt,
            finishedAt: lastSync.finishedAt,
          }
        : null,
      recentJobs,
      totals: {
        total: statusCounts.TOTAL || 0,
        completed: statusCounts.COMPLETED || 0,
        failed: statusCounts.FAILED || 0,
        running: statusCounts.RUNNING || 0,
        pending: statusCounts.PENDING || 0,
        partialSuccess: statusCounts.PARTIAL_SUCCESS || 0,
      },
    };
  }
}
