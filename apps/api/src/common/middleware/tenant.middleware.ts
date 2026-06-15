import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  use(req: Request, _res: Response, next: NextFunction) {
    // Extrai tenantId do JWT (setado pelo AuthGuard)
    const tenantId = (req as any).user?.tenantId;

    if (tenantId) {
      (req as any).tenantId = tenantId;
    }

    next();
  }
}
