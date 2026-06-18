import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Approval } from '@prisma/client';

export class ApprovalResponseDto {
  @ApiProperty({ description: 'Approval ID' })
  id: string;

  @ApiProperty({ description: 'Workflow ID' })
  workflowId: string;

  @ApiProperty({ description: 'Entity type being approved' })
  entityType: string;

  @ApiProperty({ description: 'Entity ID being approved' })
  entityId: string;

  @ApiProperty({ description: 'Approval status', enum: ['PENDING', 'APPROVED', 'REJECTED'] })
  status: string;

  @ApiPropertyOptional({ description: 'User who performed approval' })
  approvedBy: string | null;

  @ApiProperty({ description: 'Created at' })
  createdAt: Date;

  @ApiProperty({ description: 'Updated at' })
  updatedAt: Date;

  static fromPrisma(approval: Approval): ApprovalResponseDto {
    const dto = new ApprovalResponseDto();
    dto.id = approval.id;
    dto.workflowId = approval.workflowId;
    dto.entityType = approval.entityType;
    dto.entityId = approval.entityId;
    dto.status = approval.status;
    dto.approvedBy = approval.approvedBy;
    dto.createdAt = approval.createdAt;
    dto.updatedAt = approval.updatedAt;
    return dto;
  }
}
