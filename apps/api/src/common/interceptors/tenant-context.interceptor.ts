import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { AsyncLocalStorage } from 'async_hooks';

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

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const tenantContext: TenantContext = {
      tenantId: request.user?.tenantId || 'system',
      userId: request.user?.sub || 'system',
      role: request.user?.role || 'system',
    };

    return new Observable((subscriber) => {
      TenantContextInterceptor.storage.run(tenantContext, () => {
        next.handle().subscribe({
          next: (value) => subscriber.next(value),
          error: (err) => subscriber.error(err),
          complete: () => subscriber.complete(),
        });
      });
    });
  }
}
