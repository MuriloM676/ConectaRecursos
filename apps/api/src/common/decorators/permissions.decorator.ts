import { SetMetadata } from '@nestjs/common';
import { PERMISSIONS_KEY } from '@common/guards/permissions.guard';
import { ALLOW_SUPER_ADMIN_KEY } from '@common/guards/tenant.guard';

export const RequirePermissions = (...permissions: string[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);

export const AllowSuperAdmin = () => SetMetadata(ALLOW_SUPER_ADMIN_KEY, true);
