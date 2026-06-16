import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ConveniosService } from './convenios.service';
import { CreateConvenioDto } from './dto/create-convenio.dto';
import { UpdateConvenioDto } from './dto/update-convenio.dto';
import { ConvenioResponseDto } from './dto/convenio-response.dto';
import { CreateFinancialScheduleDto } from './dto/financial-schedule.dto';
import { PaginationDto, PaginatedResult } from '@common/dto/pagination.dto';
import { RequirePermissions } from '@common/decorators/permissions.decorator';

@ApiTags('Convênios')
@ApiBearerAuth()
@Controller('convenios')
export class ConveniosController {
  constructor(private readonly conveniosService: ConveniosService) {}

  @Post()
  @RequirePermissions('convenio:create')
  @ApiOperation({ summary: 'Create a new convenio', description: 'Creates a new convenio linked to an emenda.' })
  @ApiResponse({ status: 201, type: ConvenioResponseDto })
  async create(@Body() dto: CreateConvenioDto): Promise<ConvenioResponseDto> {
    return this.conveniosService.create(dto);
  }

  @Get()
  @RequirePermissions('convenio:read')
  @ApiOperation({ summary: 'List convenios', description: 'Returns a paginated list of convenios.' })
  @ApiResponse({ status: 200, description: 'Paginated convenios list', type: [ConvenioResponseDto] })
  async findAll(
    @Query() pagination: PaginationDto,
    @Query('status') status?: string,
    @Query('emendaId') emendaId?: string,
  ): Promise<PaginatedResult<ConvenioResponseDto>> {
    return this.conveniosService.findAll({ ...pagination, status, emendaId });
  }

  @Get(':id')
  @RequirePermissions('convenio:read')
  @ApiOperation({ summary: 'Get convenio by ID', description: 'Returns convenio details.' })
  @ApiResponse({ status: 200, type: ConvenioResponseDto })
  @ApiResponse({ status: 404, description: 'Convenio not found' })
  async findById(@Param('id') id: string): Promise<ConvenioResponseDto> {
    return this.conveniosService.findById(id);
  }

  @Patch(':id')
  @RequirePermissions('convenio:update')
  @ApiOperation({ summary: 'Update a convenio', description: 'Updates convenio details and/or status.' })
  @ApiResponse({ status: 200, type: ConvenioResponseDto })
  @ApiResponse({ status: 404, description: 'Convenio not found' })
  async update(@Param('id') id: string, @Body() dto: UpdateConvenioDto): Promise<ConvenioResponseDto> {
    return this.conveniosService.update(id, dto);
  }

  @Delete(':id')
  @RequirePermissions('convenio:delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a convenio', description: 'Soft deletes a convenio.' })
  @ApiResponse({ status: 204, description: 'Deleted' })
  @ApiResponse({ status: 404, description: 'Convenio not found' })
  async remove(@Param('id') id: string): Promise<void> {
    return this.conveniosService.remove(id);
  }

  @Post(':id/schedule')
  @RequirePermissions('financial_schedule:create')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Add financial schedule item',
    description: 'Adds a new financial schedule item to a convenio.',
  })
  async addFinancialSchedule(@Param('id') convenioId: string, @Body() dto: CreateFinancialScheduleDto): Promise<any> {
    return this.conveniosService.addFinancialSchedule(convenioId, dto);
  }
}
