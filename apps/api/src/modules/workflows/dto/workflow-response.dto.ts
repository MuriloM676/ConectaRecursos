import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ApprovalWorkflow } from '@prisma/client';

export class WorkflowResponseDto {
  @ApiProperty({ description: 'Workflow ID' })
  id: string;

  @ApiProperty({ description: 'Tenant ID' })
  tenantId: string;

  @ApiProperty({ description: 'Workflow name' })
  name: string;

  @ApiProperty({ description: 'Created at' })
  createdAt: Date;

  static fromPrisma(workflow: ApprovalWorkflow): WorkflowResponseDto {
    const dto = new WorkflowResponseDto();
    dto.id = workflow.id;
    dto.tenantId = workflow.tenantId;
    dto.name = workflow.name;
    dto.createdAt = workflow.createdAt;
    return dto;
  }
}
