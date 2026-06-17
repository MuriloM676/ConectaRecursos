import { ApiProperty } from '@nestjs/swagger';
import { AccountabilityItem } from '@prisma/client';

export class ItemResponseDto {
  @ApiProperty({ description: 'Item ID' })
  id: string;

  @ApiProperty({ description: 'Report ID' })
  reportId: string;

  @ApiProperty({ description: 'Item description' })
  description: string;

  @ApiProperty({ description: 'Item amount' })
  amount: number;

  static fromPrisma(item: AccountabilityItem): ItemResponseDto {
    const dto = new ItemResponseDto();
    dto.id = item.id;
    dto.reportId = item.reportId;
    dto.description = item.description;
    dto.amount = Number(item.amount);
    return dto;
  }
}
