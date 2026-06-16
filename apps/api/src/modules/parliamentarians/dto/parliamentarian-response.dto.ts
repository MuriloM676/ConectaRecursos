import { ApiProperty } from '@nestjs/swagger';
import { Parliamentarian } from '@prisma/client';

export class ParliamentarianResponseDto {
  @ApiProperty({ description: 'Parliamentarian ID' })
  id: string;

  @ApiProperty({ description: 'Name' })
  name: string;

  @ApiProperty({ description: 'Party' })
  party: string;

  @ApiProperty({ description: 'State' })
  state: string;

  @ApiProperty({ description: 'Created at' })
  createdAt: Date;

  static fromPrisma(p: Parliamentarian): ParliamentarianResponseDto {
    return {
      id: p.id,
      name: p.name,
      party: p.party,
      state: p.state,
      createdAt: p.createdAt,
    };
  }
}
