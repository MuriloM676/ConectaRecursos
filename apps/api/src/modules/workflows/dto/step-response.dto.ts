import { ApiProperty } from '@nestjs/swagger';
import { ApprovalStep } from '@prisma/client';

export class StepResponseDto {
  @ApiProperty({ description: 'Step ID' })
  id: string;

  @ApiProperty({ description: 'Workflow ID' })
  workflowId: string;

  @ApiProperty({ description: 'Step order number' })
  stepOrder: number;

  @ApiProperty({ description: 'Role that can approve this step' })
  approverRole: string;

  static fromPrisma(step: ApprovalStep): StepResponseDto {
    const dto = new StepResponseDto();
    dto.id = step.id;
    dto.workflowId = step.workflowId;
    dto.stepOrder = step.stepOrder;
    dto.approverRole = step.approverRole;
    return dto;
  }
}
