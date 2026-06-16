import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { RolesService } from './roles.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { RoleResponseDto } from './dto/role-response.dto';
import { Roles } from '@common/decorators/roles.decorator';
import { RequirePermissions } from '@common/decorators/permissions.decorator';

@ApiTags('Roles')
@ApiBearerAuth()
@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Post()
  @Roles('SUPER_ADMIN', 'ADMIN_MUNICIPAL')
  @RequirePermissions('role:create')
  @ApiOperation({
    summary: 'Create a new role',
    description: 'Creates a new role with optional permission assignments.',
  })
  @ApiResponse({ status: 201, description: 'Role created', type: RoleResponseDto })
  @ApiResponse({ status: 409, description: 'Role name already exists' })
  async create(@Body() dto: CreateRoleDto): Promise<RoleResponseDto> {
    return this.rolesService.create(dto);
  }

  @Get()
  @Roles('SUPER_ADMIN', 'ADMIN_MUNICIPAL')
  @RequirePermissions('role:read')
  @ApiOperation({
    summary: 'List all roles',
    description: 'Returns all roles with their associated permissions.',
  })
  @ApiResponse({ status: 200, description: 'List of roles', type: [RoleResponseDto] })
  async findAll(): Promise<RoleResponseDto[]> {
    return this.rolesService.findAll();
  }

  @Get(':id')
  @Roles('SUPER_ADMIN', 'ADMIN_MUNICIPAL')
  @RequirePermissions('role:read')
  @ApiOperation({ summary: 'Get role by ID' })
  @ApiResponse({ status: 200, description: 'Role details', type: RoleResponseDto })
  @ApiResponse({ status: 404, description: 'Role not found' })
  async findById(@Param('id') id: string): Promise<RoleResponseDto> {
    return this.rolesService.findById(id);
  }

  @Put(':id')
  @Roles('SUPER_ADMIN', 'ADMIN_MUNICIPAL')
  @RequirePermissions('role:update')
  @ApiOperation({
    summary: 'Update a role',
    description: 'Updates role name, description, and/or permissions.',
  })
  @ApiResponse({ status: 200, description: 'Role updated', type: RoleResponseDto })
  @ApiResponse({ status: 404, description: 'Role not found' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateRoleDto,
  ): Promise<RoleResponseDto> {
    return this.rolesService.update(id, dto);
  }

  @Delete(':id')
  @Roles('SUPER_ADMIN', 'ADMIN_MUNICIPAL')
  @RequirePermissions('role:delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete a role',
    description: 'Permanently deletes a role. Fails if users are assigned to it.',
  })
  @ApiResponse({ status: 204, description: 'Role deleted' })
  @ApiResponse({ status: 404, description: 'Role not found' })
  @ApiResponse({ status: 409, description: 'Role has users assigned' })
  async remove(@Param('id') id: string): Promise<void> {
    return this.rolesService.remove(id);
  }

  @Get(':id/permissions')
  @Roles('SUPER_ADMIN', 'ADMIN_MUNICIPAL')
  @RequirePermissions('role:read')
  @ApiOperation({ summary: 'Get permissions by role' })
  @ApiResponse({ status: 200, description: 'List of permission codes' })
  async getPermissions(@Param('id') id: string) {
    return this.rolesService.getPermissionsByRole(id);
  }
}
