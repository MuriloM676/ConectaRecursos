import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { DashboardOverviewDto } from './dto/dashboard-overview.dto';
import { EmendaByStatusDto } from './dto/emenda-by-status.dto';
import { ParliamentarianSummaryDto } from './dto/parliamentarian-summary.dto';
import { AreaSummaryDto } from './dto/area-summary.dto';
import { FinancialSummaryDto } from './dto/financial-summary.dto';
import { RequirePermissions } from '@common/decorators/permissions.decorator';

@ApiTags('Dashboard')
@ApiBearerAuth()
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly service: DashboardService) {}

  @Get('overview')
  @RequirePermissions('dashboard:read')
  @ApiOperation({ summary: 'Get executive overview', description: 'Returns aggregated KPI data for the dashboard.' })
  @ApiResponse({ status: 200, type: DashboardOverviewDto })
  async getOverview(): Promise<DashboardOverviewDto> {
    return this.service.getOverview();
  }

  @Get('emendas')
  @RequirePermissions('dashboard:read')
  @ApiOperation({ summary: 'Emendas by status', description: 'Returns emendas grouped by status.' })
  @ApiResponse({ status: 200, type: [EmendaByStatusDto] })
  async getEmendasByStatus(): Promise<EmendaByStatusDto[]> {
    return this.service.getEmendasByStatus();
  }

  @Get('parliamentarians')
  @RequirePermissions('dashboard:read')
  @ApiOperation({ summary: 'Top parliamentarians', description: 'Returns top parliamentarians by emenda amount.' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Max results (default 10)' })
  @ApiResponse({ status: 200, type: [ParliamentarianSummaryDto] })
  async getParliamentarians(@Query('limit') limit?: number): Promise<ParliamentarianSummaryDto[]> {
    return this.service.getParliamentarians(limit ? Number(limit) : 10);
  }

  @Get('areas')
  @RequirePermissions('dashboard:read')
  @ApiOperation({ summary: 'Emendas by area', description: 'Returns emendas grouped by type/area.' })
  @ApiResponse({ status: 200, type: [AreaSummaryDto] })
  async getAreas(): Promise<AreaSummaryDto[]> {
    return this.service.getAreas();
  }

  @Get('financial')
  @RequirePermissions('dashboard:read')
  @ApiOperation({ summary: 'Financial summary', description: 'Returns financial summary with monthly breakdown.' })
  @ApiResponse({ status: 200, type: FinancialSummaryDto })
  async getFinancial(): Promise<FinancialSummaryDto> {
    return this.service.getFinancial();
  }
}
