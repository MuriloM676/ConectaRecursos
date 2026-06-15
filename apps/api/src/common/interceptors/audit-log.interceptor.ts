import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { TenantContextInterceptor } from './tenant-context.interceptor';

@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  private readonly logger = new Logger('AuditLog');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const startTime = Date.now();
    const ctx = TenantContextInterceptor.getContext();

    return next.handle().pipe(
      tap(() => {
        const response = context.switchToHttp().getResponse();
        const duration = Date.now() - startTime;

        this.logger.log(
          JSON.stringify({
            method: request.method,
            url: request.url,
            statusCode: response.statusCode,
            duration: `${duration}ms`,
            tenantId: ctx?.tenantId,
            userId: ctx?.userId,
            userAgent: request.headers['user-agent'],
            ip: request.ip,
          }),
        );
      }),
    );
  }
}
