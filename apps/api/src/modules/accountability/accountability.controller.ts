import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AccountabilityService } from './accountability.service';
import { CreateReportDto } from './dto/create-report.dto';
import { UpdateReportDto } from './dto/update-report.dto';
import { ReportResponseDto } from './dto/report-response.dto';
import { CreateItemDto } from './dto/create-item.dto';
import { ItemResponseDto } from './dto/item-response.dto';
import { PaginationDto, PaginatedResult } from '@common/dto/pagination.dto';
import { RequirePermissions } from '@common/decorators/permissions.decorator';

@ApiTags('Prestação de Contas')
@ApiBearerAuth()
@Controller('accountability-reports')
export class AccountabilityController {
  constructor(private readonly service: AccountabilityService) {}

  @Post()
  @RequirePermissions('accountability:create')
  @ApiOperation({ summary: 'Create accountability report', description: 'Creates a new accountability report linked to a convenio.' })
  @ApiResponse({ status: 201, type: ReportResponseDto })
  @ApiResponse({ status: 404, description: 'Convenio not found' })
  async create(@Body() dto: CreateReportDto): Promise<ReportResponseDto> {
    return this.service.create(dto);
  }

  @Get()
  @RequirePermissions('accountability:read')
  @ApiOperation({ summary: 'List reports', description: 'Returns a paginated list of accountability reports.' })
  @ApiResponse({ status: 200, description: 'Paginated reports list' })
  async findAll(
    @Query() pagination: PaginationDto,
    @Query('status') status?: string,
    @Query('convenioId') convenioId?: string,
  ): Promise<PaginatedResult<ReportResponseDto>> {
    return this.service.findAll({ ...pagination, status, convenioId });
  }

  @Get(':id')
  @RequirePermissions('accountability:read')
  @ApiOperation({ summary: 'Get report by ID', description: 'Returns report details with items.' })
  @ApiResponse({ status: 200, type: ReportResponseDto })
  @ApiResponse({ status: 404, description: 'Report not found' })
  async findById(@Param('id') id: string): Promise<ReportResponseDto> {
    return this.service.findById(id);
  }

  @Patch(':id')
  @RequirePermissions('accountability:update')
  @ApiOperation({ summary: 'Update report', description: 'Updates report notes while in DRAFT status.' })
  @ApiResponse({ status: 200, type: ReportResponseDto })
  @ApiResponse({ status: 404, description: 'Report not found' })
  @ApiResponse({ status: 409, description: 'Only DRAFT reports can be updated' })
  async update(@Param('id') id: string, @Body() dto: UpdateReportDto): Promise<ReportResponseDto> {
    return this.service.update(id, dto);
  }

  @Post(':id/submit')
  @RequirePermissions('accountability:update')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Submit report', description: 'Submits a report for approval.' })
  @ApiResponse({ status: 200, type: ReportResponseDto })
  @ApiResponse({ status: 409, description: 'Only DRAFT reports can be submitted' })
  async submit(@Param('id') id: string): Promise<ReportResponseDto> {
    return this.service.submit(id);
  }

  @Post(':id/approve')
  @RequirePermissions('accountability:approve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Approve report', description: 'Approves a submitted report.' })
  @ApiResponse({ status: 200, type: ReportResponseDto })
  @ApiResponse({ status: 409, description: 'Only SUBMITTED reports can be approved' })
  async approve(@Param('id') id: string): Promise<ReportResponseDto> {
    return this.service.approve(id);
  }

  @Post(':id/reject')
  @RequirePermissions('accountability:reject')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reject report', description: 'Rejects a submitted report, returning it to DRAFT.' })
  @ApiResponse({ status: 200, type: ReportResponseDto })
  @ApiResponse({ status: 409, description: 'Only SUBMITTED reports can be rejected' })
  async reject(@Param('id') id: string): Promise<ReportResponseDto> {
    return this.service.reject(id);
  }

  @Get(':id/items')
  @RequirePermissions('accountability:read')
  @ApiOperation({ summary: 'List report items', description: 'Returns all items for a report.' })
  @ApiResponse({ status: 200, type: [ItemResponseDto] })
  async getItems(@Param('id') id: string): Promise<ItemResponseDto[]> {
    return this.service.getItems(id);
  }

  @Post(':id/items')
  @RequirePermissions('accountability:create')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add item to report', description: 'Adds a new item to a DRAFT report.' })
  @ApiResponse({ status: 201, type: ItemResponseDto })
  @ApiResponse({ status: 409, description: 'Only DRAFT reports can receive items' })
  async addItem(@Param('id') id: string, @Body() dto: CreateItemDto): Promise<ItemResponseDto> {
    return this.service.addItem(id, dto);
  }
}
