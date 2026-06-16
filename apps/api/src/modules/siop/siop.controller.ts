import { Controller, Post, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { SiopService } from './services/siop.service';
import { RequirePermissions } from '@common/decorators/permissions.decorator';
import { CurrentUser } from '@common/decorators/current-user.decorator';

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
  async sync(@CurrentUser() user: any) {
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
  async syncDirect(@CurrentUser() user: any) {
    return this.siopService.syncEmendas(user.tenantId);
  }

  @Get('jobs')
  @RequirePermissions('siop:read')
  @ApiOperation({ summary: 'List recent sync jobs' })
  async listJobs(@CurrentUser() user: any) {
    return this.prisma.syncJob.findMany({
      where: { provider: 'SIOP' },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });
  }

  @Get('jobs/:id')
  @RequirePermissions('siop:read')
  @ApiOperation({ summary: 'Get sync job details' })
  async getJob(@Param('id') id: string) {
    return this.prisma.syncJob.findUnique({
      where: { id },
    });
  }
}
