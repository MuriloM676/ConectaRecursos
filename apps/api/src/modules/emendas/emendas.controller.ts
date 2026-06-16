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
import { EmendasService } from './emendas.service';
import { CreateEmendaDto } from './dto/create-emenda.dto';
import { UpdateEmendaDto } from './dto/update-emenda.dto';
import { EmendaResponseDto } from './dto/emenda-response.dto';
import { EmendaHistoryResponseDto } from './dto/emenda-history-response.dto';
import { PaginationDto, PaginatedResult } from '@common/dto/pagination.dto';
import { RequirePermissions } from '@common/decorators/permissions.decorator';

@ApiTags('Emendas')
@ApiBearerAuth()
@Controller('emendas')
export class EmendasController {
  constructor(private readonly emendasService: EmendasService) {}

  @Post()
  @RequirePermissions('emenda:create')
  @ApiOperation({ summary: 'Create a new amendment' })
  @ApiResponse({ status: 201, type: EmendaResponseDto })
  async create(@Body() dto: CreateEmendaDto): Promise<EmendaResponseDto> {
    return this.emendasService.create(dto);
  }

  @Get()
  @RequirePermissions('emenda:read')
  @ApiOperation({ summary: 'List all amendments' })
  @ApiResponse({ status: 200, type: [EmendaResponseDto] })
  async findAll(
    @Query() pagination: PaginationDto,
    @Query('year') year?: number,
    @Query('status') status?: string,
    @Query('parliamentarianId') parliamentarianId?: string,
  ): Promise<PaginatedResult<EmendaResponseDto>> {
    return this.emendasService.findAll({ ...pagination, year, status, parliamentarianId });
  }

  @Get(':id')
  @RequirePermissions('emenda:read')
  @ApiOperation({ summary: 'Get amendment by ID' })
  @ApiResponse({ status: 200, type: EmendaResponseDto })
  @ApiResponse({ status: 404, description: 'Not found' })
  async findById(@Param('id') id: string): Promise<EmendaResponseDto> {
    return this.emendasService.findById(id);
  }

  @Patch(':id')
  @RequirePermissions('emenda:update')
  @ApiOperation({ summary: 'Update an amendment' })
  @ApiResponse({ status: 200, type: EmendaResponseDto })
  @ApiResponse({ status: 404, description: 'Not found' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateEmendaDto,
  ): Promise<EmendaResponseDto> {
    return this.emendasService.update(id, dto);
  }

  @Delete(':id')
  @RequirePermissions('emenda:delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an amendment' })
  @ApiResponse({ status: 204, description: 'Deleted' })
  @ApiResponse({ status: 404, description: 'Not found' })
  async remove(@Param('id') id: string): Promise<void> {
    return this.emendasService.remove(id);
  }

  @Get(':id/history')
  @RequirePermissions('emenda:history')
  @ApiOperation({ summary: 'Get amendment status history' })
  @ApiResponse({ status: 200, type: [EmendaHistoryResponseDto] })
  @ApiResponse({ status: 404, description: 'Not found' })
  async getHistory(@Param('id') id: string): Promise<EmendaHistoryResponseDto[]> {
    return this.emendasService.getHistory(id);
  }
}
