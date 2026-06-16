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
import { TenantsService } from './tenants.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { TenantResponseDto } from './dto/tenant-response.dto';
import { Roles } from '@common/decorators/roles.decorator';
import { AllowSuperAdmin } from '@common/decorators/permissions.decorator';

@ApiTags('Tenants')
@ApiBearerAuth()
@Controller('tenants')
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Post()
  @Roles('SUPER_ADMIN')
  @AllowSuperAdmin()
  @ApiOperation({
    summary: 'Create a new tenant',
    description: 'Creates a new tenant (city/prefeitura). Only SUPER_ADMIN can create tenants.',
  })
  @ApiResponse({ status: 201, description: 'Tenant created', type: TenantResponseDto })
  @ApiResponse({ status: 409, description: 'CNPJ already exists' })
  async create(@Body() dto: CreateTenantDto): Promise<TenantResponseDto> {
    return this.tenantsService.create(dto);
  }

  @Get()
  @Roles('SUPER_ADMIN')
  @AllowSuperAdmin()
  @ApiOperation({
    summary: 'List all tenants',
    description: 'Returns all registered tenants. Only SUPER_ADMIN can list all tenants.',
  })
  @ApiResponse({ status: 200, description: 'List of tenants', type: [TenantResponseDto] })
  async findAll(): Promise<TenantResponseDto[]> {
    return this.tenantsService.findAll();
  }

  @Get(':id')
  @AllowSuperAdmin()
  @ApiOperation({
    summary: 'Get tenant by ID',
    description: 'Returns a specific tenant by its ID.',
  })
  @ApiResponse({ status: 200, description: 'Tenant details', type: TenantResponseDto })
  @ApiResponse({ status: 404, description: 'Tenant not found' })
  async findById(@Param('id') id: string): Promise<TenantResponseDto> {
    return this.tenantsService.findById(id);
  }

  @Put(':id')
  @Roles('SUPER_ADMIN')
  @AllowSuperAdmin()
  @ApiOperation({
    summary: 'Update a tenant',
    description: 'Updates tenant information. Only SUPER_ADMIN can update tenants.',
  })
  @ApiResponse({ status: 200, description: 'Tenant updated', type: TenantResponseDto })
  @ApiResponse({ status: 404, description: 'Tenant not found' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateTenantDto,
  ): Promise<TenantResponseDto> {
    return this.tenantsService.update(id, dto);
  }

  @Delete(':id')
  @Roles('SUPER_ADMIN')
  @AllowSuperAdmin()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Deactivate a tenant',
    description: 'Deactivates (soft-deletes) a tenant. Only SUPER_ADMIN can deactivate tenants.',
  })
  @ApiResponse({ status: 204, description: 'Tenant deactivated' })
  @ApiResponse({ status: 404, description: 'Tenant not found' })
  async remove(@Param('id') id: string): Promise<void> {
    return this.tenantsService.remove(id);
  }
}
