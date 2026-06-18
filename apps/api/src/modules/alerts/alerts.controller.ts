import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AlertsService } from './alerts.service';
import { AlertResponseDto } from './dto/alert-response.dto';
import { CreateAlertDto } from './dto/create-alert.dto';
import { PaginationDto, PaginatedResult } from '@common/dto/pagination.dto';
import { RequirePermissions } from '@common/decorators/permissions.decorator';
import { GetCurrentUser } from '@common/decorators/current-user.decorator';

@ApiTags('Alerts')
@ApiBearerAuth()
@Controller('alerts')
export class AlertsController {
  constructor(private readonly service: AlertsService) {}

  @Post()
  @RequirePermissions('alert:manage')
  @ApiOperation({ summary: 'Create an alert', description: 'Creates a new alert for specific recipients.' })
  @ApiResponse({ status: 201, type: AlertResponseDto })
  async create(@Body() dto: CreateAlertDto): Promise<AlertResponseDto> {
    return this.service.create(dto);
  }

  @Get()
  @RequirePermissions('alert:read')
  @ApiOperation({ summary: 'List alerts', description: 'Returns a paginated list of alerts.' })
  @ApiResponse({ status: 200 })
  async findAll(
    @Query() pagination: PaginationDto,
    @Query('type') type?: string,
  ): Promise<PaginatedResult<AlertResponseDto>> {
    return this.service.findAll({ ...pagination, type });
  }

  @Get('unread')
  @RequirePermissions('alert:read')
  @ApiOperation({ summary: 'List unread alerts', description: 'Returns all unread alerts.' })
  @ApiResponse({ status: 200 })
  async findUnread(): Promise<AlertResponseDto[]> {
    return this.service.findUnread();
  }

  @Patch(':id/read')
  @RequirePermissions('alert:manage')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark alert as read', description: 'Marks a specific alert as read.' })
  @ApiResponse({ status: 200, type: AlertResponseDto })
  @ApiResponse({ status: 404, description: 'Alert not found' })
  async markAsRead(@Param('id') id: string): Promise<AlertResponseDto> {
    return this.service.markAsRead(id);
  }

  @Post('read-all')
  @RequirePermissions('alert:manage')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark all alerts as read', description: 'Marks all alerts as read for the current tenant.' })
  @ApiResponse({ status: 200 })
  async markAllAsRead(): Promise<{ count: number }> {
    return this.service.markAllAsRead();
  }

  @Post('test')
  @RequirePermissions('alert:manage')
  @ApiOperation({ summary: 'Create test alert', description: 'Creates a test alert for development purposes.' })
  @ApiResponse({ status: 201, type: AlertResponseDto })
  async createTestAlert(@GetCurrentUser('sub') userId: string): Promise<AlertResponseDto> {
    return this.service.createTestAlert(userId);
  }
}
