import { SetMetadata } from '@nestjs/common';
import { PERMISSIONS_KEY } from '@common/guards/permissions.guard';

export const RequirePermissions = (...permissions: string[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
