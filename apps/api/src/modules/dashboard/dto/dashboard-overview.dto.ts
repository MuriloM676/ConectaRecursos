import { ApiProperty } from '@nestjs/swagger';

export class DashboardOverviewDto {
  @ApiProperty({ description: 'Total captured amount from all emendas' })
  capturedAmount: number;

  @ApiProperty({ description: 'Total received amount from financial schedules' })
  receivedAmount: number;

  @ApiProperty({ description: 'Total executed amount based on physical progress' })
  executedAmount: number;

  @ApiProperty({ description: 'Total number of emendas' })
  totalEmendas: number;

  @ApiProperty({ description: 'Total number of active convenios' })
  activeConvenios: number;

  @ApiProperty({ description: 'Total number of open impediments' })
  openImpediments: number;

  @ApiProperty({ description: 'Execution percentage (executed/captured)' })
  executionPercentage: number;

  @ApiProperty({ description: 'Received percentage (received/captured)' })
  receivedPercentage: number;
}
