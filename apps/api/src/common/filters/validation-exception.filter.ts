import { ExceptionFilter, Catch, ArgumentsHost, BadRequestException } from '@nestjs/common';
import { Response } from 'express';

@Catch(BadRequestException)
export class ValidationExceptionFilter implements ExceptionFilter {
  catch(exception: BadRequestException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    let message = 'Validation error';
    let errors: string[] = [];

    if (typeof exceptionResponse === 'object') {
      const resp = exceptionResponse as Record<string, unknown>;
      if (Array.isArray(resp.message)) {
        errors = resp.message as string[];
      } else if (typeof resp.message === 'string') {
        message = resp.message;
      }
    }

    response.status(status).json({
      success: false,
      message,
      errors: errors.length > 0 ? errors : undefined,
      statusCode: status,
      timestamp: new Date().toISOString(),
    });
  }
}
