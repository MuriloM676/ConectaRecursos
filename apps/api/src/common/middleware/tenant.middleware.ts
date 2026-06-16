import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  use(req: Request, _res: Response, next: NextFunction) {
    // Priority: 1) JWT user → 2) X-Tenant-ID header → 3) subdomain
    const userTenantId = (req as any).user?.tenantId;
    const headerTenantId = req.headers['x-tenant-id'] as string | undefined;
    // Subdomain extraction (e.g.: prefeitura.captagov.com.br)
    const subdomain = req.subdomains.length > 0 ? req.subdomains[0] : undefined;

    const tenantId = userTenantId || headerTenantId || subdomain;

    if (tenantId) {
      (req as any).tenantId = tenantId;
    }

    next();
  }
}
