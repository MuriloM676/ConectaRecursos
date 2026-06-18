import { Injectable, Logger, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '@modules/prisma/prisma.service';
import { CreateWorkflowDto } from './dto/create-workflow.dto';
import { WorkflowResponseDto } from './dto/workflow-response.dto';
import { CreateStepDto } from './dto/create-step.dto';
import { StepResponseDto } from './dto/step-response.dto';
import { ApprovalResponseDto } from './dto/approval-response.dto';

@Injectable()
export class WorkflowsService {
  private readonly logger = new Logger(WorkflowsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateWorkflowDto): Promise<WorkflowResponseDto> {
    const tenantId = this.prisma.getTenantId();
    if (!tenantId) throw new Error('Tenant context missing');

    const workflow = await this.prisma.approvalWorkflow.create({
      data: {
        tenantId,
        name: dto.name,
      },
    });

    this.logger.log(`Workflow created: ${workflow.id} (Tenant: ${tenantId})`);
    return WorkflowResponseDto.fromPrisma(workflow);
  }

  async findAll(): Promise<WorkflowResponseDto[]> {
    const tenantId = this.prisma.getTenantId();
    if (!tenantId) throw new Error('Tenant context missing');

    const workflows = await this.prisma.approvalWorkflow.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });

    return workflows.map((w) => WorkflowResponseDto.fromPrisma(w));
  }

  async addStep(workflowId: string, dto: CreateStepDto): Promise<StepResponseDto> {
    const workflow = await this.prisma.approvalWorkflow.findUnique({
      where: { id: workflowId },
    });

    if (!workflow) {
      throw new NotFoundException('Workflow not found');
    }

    const step = await this.prisma.approvalStep.create({
      data: {
        workflowId,
        stepOrder: dto.stepOrder,
        approverRole: dto.approverRole,
      },
    });

    this.logger.log(`Step added to workflow ${workflowId}: order ${dto.stepOrder}, role ${dto.approverRole}`);
    return StepResponseDto.fromPrisma(step);
  }

  async getSteps(workflowId: string): Promise<StepResponseDto[]> {
    const workflow = await this.prisma.approvalWorkflow.findUnique({
      where: { id: workflowId },
    });

    if (!workflow) {
      throw new NotFoundException('Workflow not found');
    }

    const steps = await this.prisma.approvalStep.findMany({
      where: { workflowId },
      orderBy: { stepOrder: 'asc' },
    });

    return steps.map((s) => StepResponseDto.fromPrisma(s));
  }

  async approveApproval(id: string, userId?: string): Promise<ApprovalResponseDto> {
    const approval = await this.prisma.approval.findUnique({ where: { id } });

    if (!approval) {
      throw new NotFoundException('Approval not found');
    }

    if (approval.status !== 'PENDING') {
      throw new ConflictException('Approval is not PENDING');
    }

    const updated = await this.prisma.approval.update({
      where: { id },
      data: {
        status: 'APPROVED',
        approvedBy: userId || null,
      },
    });

    this.logger.log(`Approval approved: ${id}`);
    return ApprovalResponseDto.fromPrisma(updated);
  }

  async rejectApproval(id: string, userId?: string): Promise<ApprovalResponseDto> {
    const approval = await this.prisma.approval.findUnique({ where: { id } });

    if (!approval) {
      throw new NotFoundException('Approval not found');
    }

    if (approval.status !== 'PENDING') {
      throw new ConflictException('Approval is not PENDING');
    }

    const updated = await this.prisma.approval.update({
      where: { id },
      data: {
        status: 'REJECTED',
        approvedBy: userId || null,
      },
    });

    this.logger.log(`Approval rejected: ${id}`);
    return ApprovalResponseDto.fromPrisma(updated);
  }
}
