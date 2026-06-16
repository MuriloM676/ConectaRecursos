import {
  Controller,
  Get,
  Post,
  Param,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { PermissionsService } from './permissions.service';
import { PermissionResponseDto } from './dto/permission-response.dto';
import { Roles } from '@common/decorators/roles.decorator';
import { RequirePermissions } from '@common/decorators/permissions.decorator';

@ApiTags('Roles')
@ApiBearerAuth()
@Controller('permissions')
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Get()
  @Roles('SUPER_ADMIN', 'ADMIN_MUNICIPAL')
  @RequirePermissions('role:read')
  @ApiOperation({
    summary: 'List all permissions',
    description: 'Returns all available permissions in the system.',
  })
  @ApiResponse({
    status: 200,
    description: 'List of permissions',
    type: [PermissionResponseDto],
  })
  async findAll(): Promise<PermissionResponseDto[]> {
    return this.permissionsService.findAll();
  }

  @Get(':id')
  @Roles('SUPER_ADMIN', 'ADMIN_MUNICIPAL')
  @RequirePermissions('role:read')
  @ApiOperation({ summary: 'Get permission by ID' })
  @ApiResponse({
    status: 200,
    description: 'Permission details',
    type: PermissionResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Permission not found' })
  async findById(@Param('id') id: string): Promise<PermissionResponseDto> {
    return this.permissionsService.findById(id);
  }

  @Get(':id/roles')
  @Roles('SUPER_ADMIN', 'ADMIN_MUNICIPAL')
  @RequirePermissions('role:read')
  @ApiOperation({
    summary: 'Get roles by permission',
    description: 'Returns all roles that have a specific permission.',
  })
  async getRoles(@Param('id') id: string) {
    return this.permissionsService.getRolesByPermission(id);
  }
}
