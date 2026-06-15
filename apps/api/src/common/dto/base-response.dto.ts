import { ApiProperty } from '@nestjs/swagger';

export class BaseResponseDto<T = unknown> {
  @ApiProperty({ description: 'Operation success status' })
  success: boolean;

  @ApiProperty({ description: 'Response data' })
  data: T;

  @ApiProperty({ description: 'Response timestamp' })
  timestamp: string;

  @ApiProperty({ description: 'Error message', required: false })
  message?: string;

  @ApiProperty({ description: 'Validation errors', required: false })
  errors?: string[];
}
