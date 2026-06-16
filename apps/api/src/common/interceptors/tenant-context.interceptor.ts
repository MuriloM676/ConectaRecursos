import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { AsyncLocalStorage } from 'async_hooks';
import { PrismaService } from '@modules/prisma/prisma.service';

export interface TenantContext {
  tenantId: string;
  userId: string;
  role: string;
}

@Injectable()
export class TenantContextInterceptor implements NestInterceptor {
  static readonly storage = new AsyncLocalStorage<TenantContext>();

  static getContext(): TenantContext | undefined {
    return this.storage.getStore();
  }

  constructor(private readonly prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const tenantContext: TenantContext = {
      tenantId: request.user?.tenantId || request.tenantId || 'system',
      userId: request.user?.sub || 'system',
      role: request.user?.role || 'system',
    };

    // Set tenant context in PrismaService for automatic filtering
    this.prisma.setTenantId(
      tenantContext.tenantId !== 'system' ? tenantContext.tenantId : null,
    );

    return new Observable((subscriber) => {
      TenantContextInterceptor.storage.run(tenantContext, () => {
        next.handle().subscribe({
          next: (value) => subscriber.next(value),
          error: (err) => subscriber.error(err),
          complete: () => subscriber.complete(),
        });
      });
    }).pipe(
      tap({
        final: () => {
          // Clear tenant context after request completes
          this.prisma.clearTenantId();
        },
      }),
    );
  }
}
