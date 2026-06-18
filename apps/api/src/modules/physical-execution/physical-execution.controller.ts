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
import { PhysicalExecutionService } from './physical-execution.service';
import { CreateStageDto } from './dto/create-stage.dto';
import { UpdateStageDto } from './dto/update-stage.dto';
import { StageResponseDto } from './dto/stage-response.dto';
import { CreateProgressDto } from './dto/create-progress.dto';
import { ProgressResponseDto } from './dto/progress-response.dto';
import { ConvenioProgressResponseDto } from './dto/convenio-progress-response.dto';
import { RequirePermissions } from '@common/decorators/permissions.decorator';
import { GetTenantId } from '@common/decorators/tenant.decorator';

@ApiTags('Physical Execution')
@ApiBearerAuth()
@Controller()
export class PhysicalExecutionController {
  constructor(private readonly service: PhysicalExecutionService) {}

  @Get('convenios/:id/progress')
  @RequirePermissions('physical_execution:read')
  @ApiOperation({
    summary: 'Get convenio progress',
    description: 'Returns overall progress, stages, and recent progress records for a convenio.',
  })
  @ApiResponse({ status: 200, type: ConvenioProgressResponseDto })
  @ApiResponse({ status: 404, description: 'Convenio not found' })
  async getConvenioProgress(@Param('id') convenioId: string): Promise<ConvenioProgressResponseDto> {
    return this.service.getConvenioProgress(convenioId);
  }

  @Post('convenios/:id/progress')
  @RequirePermissions('physical_execution:create')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Record progress',
    description: 'Records physical execution progress for a stage within a convenio.',
  })
  @ApiResponse({ status: 201, type: ProgressResponseDto })
  @ApiResponse({ status: 404, description: 'Stage not found' })
  async recordProgress(
    @Param('id') _convenioId: string,
    @Body() dto: CreateProgressDto,
    @GetTenantId() _tenantId: string,
  ): Promise<ProgressResponseDto> {
    return this.service.recordProgress(dto);
  }

  @Get('convenios/:id/stages')
  @RequirePermissions('physical_execution:read')
  @ApiOperation({
    summary: 'List stages',
    description: 'Returns all stages for a convenio.',
  })
  @ApiResponse({ status: 200, type: [StageResponseDto] })
  async getStages(@Param('id') convenioId: string): Promise<StageResponseDto[]> {
    return this.service.getStages(convenioId);
  }

  @Post('convenios/:id/stages')
  @RequirePermissions('physical_execution:create')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create stage',
    description: 'Creates a new execution stage for a convenio.',
  })
  @ApiResponse({ status: 201, type: StageResponseDto })
  async createStage(@Param('id') convenioId: string, @Body() dto: CreateStageDto): Promise<StageResponseDto> {
    return this.service.createStage(convenioId, dto);
  }

  @Get('stages/:id/progress')
  @RequirePermissions('physical_execution:read')
  @ApiOperation({
    summary: 'Get stage progress history',
    description: 'Returns the progress history for a specific stage.',
  })
  @ApiResponse({ status: 200, type: [ProgressResponseDto] })
  async getStageProgress(@Param('id') stageId: string): Promise<ProgressResponseDto[]> {
    return this.service.getProgressHistory(stageId);
  }

  @Patch('stages/:id')
  @RequirePermissions('physical_execution:update')
  @ApiOperation({
    summary: 'Update stage',
    description: 'Updates a stage name and/or planned percentage.',
  })
  @ApiResponse({ status: 200, type: StageResponseDto })
  async updateStage(@Param('id') stageId: string, @Body() dto: UpdateStageDto): Promise<StageResponseDto> {
    return this.service.updateStage(stageId, dto);
  }

  @Delete('stages/:id')
  @RequirePermissions('physical_execution:update')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete stage',
    description: 'Deletes a stage and its progress history.',
  })
  @ApiResponse({ status: 204, description: 'Stage deleted' })
  async deleteStage(@Param('id') stageId: string): Promise<void> {
    return this.service.deleteStage(stageId);
  }
}
