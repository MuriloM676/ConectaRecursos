import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { WorkflowsService } from './workflows.service';
import { CreateWorkflowDto } from './dto/create-workflow.dto';
import { WorkflowResponseDto } from './dto/workflow-response.dto';
import { CreateStepDto } from './dto/create-step.dto';
import { StepResponseDto } from './dto/step-response.dto';
import { ApprovalResponseDto } from './dto/approval-response.dto';
import { RequirePermissions } from '@common/decorators/permissions.decorator';
import { GetCurrentUser } from '@common/decorators/current-user.decorator';

@ApiTags('Workflows')
@ApiBearerAuth()
@Controller('workflows')
export class WorkflowsController {
  constructor(private readonly service: WorkflowsService) {}

  @Post()
  @RequirePermissions('integration:create')
  @ApiOperation({ summary: 'Create a workflow', description: 'Creates a new approval workflow.' })
  @ApiResponse({ status: 201, type: WorkflowResponseDto })
  async create(@Body() dto: CreateWorkflowDto): Promise<WorkflowResponseDto> {
    return this.service.create(dto);
  }

  @Get()
  @RequirePermissions('integration:read')
  @ApiOperation({ summary: 'List workflows', description: 'Returns all approval workflows for the tenant.' })
  @ApiResponse({ status: 200, type: [WorkflowResponseDto] })
  async findAll(): Promise<WorkflowResponseDto[]> {
    return this.service.findAll();
  }

  @Post(':id/steps')
  @RequirePermissions('integration:update')
  @ApiOperation({ summary: 'Add workflow step', description: 'Adds an approval step to a workflow.' })
  @ApiResponse({ status: 201, type: StepResponseDto })
  @ApiResponse({ status: 404, description: 'Workflow not found' })
  async addStep(
    @Param('id') workflowId: string,
    @Body() dto: CreateStepDto,
  ): Promise<StepResponseDto> {
    return this.service.addStep(workflowId, dto);
  }

  @Get(':id/steps')
  @RequirePermissions('integration:read')
  @ApiOperation({ summary: 'List workflow steps', description: 'Returns all steps for a workflow.' })
  @ApiResponse({ status: 200, type: [StepResponseDto] })
  async getSteps(@Param('id') workflowId: string): Promise<StepResponseDto[]> {
    return this.service.getSteps(workflowId);
  }
}

@Controller('approvals')
@ApiTags('Approvals')
@ApiBearerAuth()
export class ApprovalsController {
  constructor(private readonly service: WorkflowsService) {}

  @Post(':id/approve')
  @RequirePermissions('accountability:approve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Approve', description: 'Approves a pending approval record.' })
  @ApiResponse({ status: 200, type: ApprovalResponseDto })
  @ApiResponse({ status: 404, description: 'Approval not found' })
  @ApiResponse({ status: 409, description: 'Approval is not PENDING' })
  async approve(
    @Param('id') id: string,
    @GetCurrentUser('sub') userId: string,
  ): Promise<ApprovalResponseDto> {
    return this.service.approveApproval(id, userId);
  }

  @Post(':id/reject')
  @RequirePermissions('accountability:reject')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reject', description: 'Rejects a pending approval record.' })
  @ApiResponse({ status: 200, type: ApprovalResponseDto })
  @ApiResponse({ status: 404, description: 'Approval not found' })
  @ApiResponse({ status: 409, description: 'Approval is not PENDING' })
  async reject(
    @Param('id') id: string,
    @GetCurrentUser('sub') userId: string,
  ): Promise<ApprovalResponseDto> {
    return this.service.rejectApproval(id, userId);
  }
}
