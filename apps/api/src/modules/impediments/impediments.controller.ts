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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ImpedimentsService } from './impediments.service';
import { CreateImpedimentDto } from './dto/create-impediment.dto';
import { UpdateImpedimentDto } from './dto/update-impediment.dto';
import { ImpedimentResponseDto } from './dto/impediment-response.dto';
import { ImpedimentHistoryResponseDto } from './dto/impediment-history-response.dto';
import { PaginationDto, PaginatedResult } from '@common/dto/pagination.dto';
import { RequirePermissions } from '@common/decorators/permissions.decorator';

@ApiTags('Impediments')
@ApiBearerAuth()
@Controller('impediments')
export class ImpedimentsController {
  constructor(private readonly impedimentsService: ImpedimentsService) {}

  @Post()
  @RequirePermissions('impediment:create')
  @ApiOperation({
    summary: 'Create a new impediment',
    description: 'Creates a new impediment linked to an existing emenda.',
  })
  @ApiResponse({ status: 201, description: 'Impediment created', type: ImpedimentResponseDto })
  @ApiResponse({ status: 404, description: 'Emenda not found' })
  async create(@Body() dto: CreateImpedimentDto): Promise<ImpedimentResponseDto> {
    return this.impedimentsService.create(dto);
  }

  @Get()
  @RequirePermissions('impediment:read')
  @ApiOperation({
    summary: 'List all impediments',
    description: 'Returns a paginated list of impediments with optional filters.',
  })
  @ApiResponse({ status: 200, description: 'List of impediments', type: [ImpedimentResponseDto] })
  async findAll(
    @Query() pagination: PaginationDto,
    @Query('status') status?: string,
    @Query('emendaId') emendaId?: string,
  ): Promise<PaginatedResult<ImpedimentResponseDto>> {
    return this.impedimentsService.findAll({ ...pagination, status, emendaId });
  }

  @Get(':id')
  @RequirePermissions('impediment:read')
  @ApiOperation({ summary: 'Get impediment by ID' })
  @ApiResponse({ status: 200, description: 'Impediment details', type: ImpedimentResponseDto })
  @ApiResponse({ status: 404, description: 'Impediment not found' })
  async findById(@Param('id') id: string): Promise<ImpedimentResponseDto> {
    return this.impedimentsService.findById(id);
  }

  @Patch(':id')
  @RequirePermissions('impediment:update')
  @ApiOperation({
    summary: 'Update an impediment',
    description: 'Updates impediment details and/or status. Status changes are recorded in history.',
  })
  @ApiResponse({ status: 200, description: 'Impediment updated', type: ImpedimentResponseDto })
  @ApiResponse({ status: 404, description: 'Impediment not found' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateImpedimentDto,
  ): Promise<ImpedimentResponseDto> {
    return this.impedimentsService.update(id, dto);
  }

  @Delete(':id')
  @RequirePermissions('impediment:delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete an impediment',
    description: 'Permanently deletes a manual impediment. SIOP-synced impediments cannot be deleted.',
  })
  @ApiResponse({ status: 204, description: 'Impediment deleted' })
  @ApiResponse({ status: 404, description: 'Impediment not found' })
  @ApiResponse({ status: 409, description: 'Cannot delete SIOP-synced impediment' })
  async remove(@Param('id') id: string): Promise<void> {
    return this.impedimentsService.remove(id);
  }

  @Get(':id/history')
  @RequirePermissions('impediment:read')
  @ApiOperation({
    summary: 'Get impediment status history',
    description: 'Returns the status change history for an impediment.',
  })
  @ApiResponse({ status: 200, description: 'Status history', type: [ImpedimentHistoryResponseDto] })
  @ApiResponse({ status: 404, description: 'Impediment not found' })
  async getHistory(@Param('id') id: string): Promise<ImpedimentHistoryResponseDto[]> {
    return this.impedimentsService.getHistory(id);
  }
}
