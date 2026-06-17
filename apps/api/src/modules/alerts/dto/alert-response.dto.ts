import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Alert } from '@prisma/client';

export class AlertResponseDto {
  @ApiProperty({ description: 'Alert ID' })
  id: string;

  @ApiProperty({ description: 'Alert type' })
  type: string;

  @ApiProperty({ description: 'Alert title' })
  title: string;

  @ApiPropertyOptional({ description: 'Alert description' })
  description: string | null;

  @ApiProperty({ description: 'Whether the alert has been read' })
  read: boolean;

  @ApiProperty({ description: 'Created at' })
  createdAt: Date;

  static fromPrisma(alert: Alert): AlertResponseDto {
    const dto = new AlertResponseDto();
    dto.id = alert.id;
    dto.type = alert.type;
    dto.title = alert.title;
    dto.description = alert.description;
    dto.read = alert.read;
    dto.createdAt = alert.createdAt;
    return dto;
  }
}
