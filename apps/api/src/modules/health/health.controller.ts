import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { HealthService } from './health.service';
import { Public } from '@common/decorators/public.decorator';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly service: HealthService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Health check', description: 'Returns the health status of the platform services.' })
  @ApiResponse({ status: 200, description: 'Health check result' })
  async check(): Promise<Record<string, string>> {
    return this.service.check();
  }
}
