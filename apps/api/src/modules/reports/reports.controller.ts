import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Res,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { ReportsService } from './reports.service';
import { ReportResponseDto } from './dto/report-response.dto';
import { GenerateReportDto } from './dto/generate-report.dto';
import { PaginationDto, PaginatedResult } from '@common/dto/pagination.dto';
import { RequirePermissions } from '@common/decorators/permissions.decorator';
import { GetCurrentUser } from '@common/decorators/current-user.decorator';

@ApiTags('Reports')
@ApiBearerAuth()
@Controller('reports')
export class ReportsController {
  constructor(private readonly service: ReportsService) {}

  @Post('generate')
  @RequirePermissions('report:generate')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Generate a report', description: 'Generates a report in the specified format.' })
  @ApiResponse({ status: 201, type: ReportResponseDto })
  async generate(
    @Query() dto: GenerateReportDto,
    @GetCurrentUser('sub') userId: string,
  ): Promise<ReportResponseDto> {
    return this.service.generate(dto, userId);
  }

  @Get()
  @RequirePermissions('report:read')
  @ApiOperation({ summary: 'List reports', description: 'Returns a paginated list of generated reports.' })
  @ApiResponse({ status: 200 })
  async findAll(
    @Query() pagination: PaginationDto,
    @Query('type') type?: string,
  ): Promise<PaginatedResult<ReportResponseDto>> {
    return this.service.findAll({ ...pagination, type });
  }

  @Get(':id/download')
  @RequirePermissions('report:read')
  @ApiOperation({ summary: 'Download report', description: 'Downloads a generated report file.' })
  @ApiResponse({ status: 200, description: 'File stream' })
  @ApiResponse({ status: 404, description: 'Report not found' })
  async download(@Param('id') id: string, @Res() res: Response): Promise<void> {
    const { buffer, fileName, mimeType } = await this.service.download(id);
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}"`);
    res.send(buffer);
  }
}
