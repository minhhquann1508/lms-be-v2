import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { ValidationErrorCode } from '@common/constants/error-codes';

interface ErrorResponse {
  statusCode: number;
  code?: string;
  message: string;
  details?: unknown;
  error?: string;
  timestamp: string;
  path: string;
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<{ url: string }>();

    const isDev = process.env.NODE_ENV !== 'production';

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Unknown error occurred';
    let code: string | undefined;
    let details: unknown;
    let error: string | undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        // Behavior cũ: response là string code
        message = exceptionResponse;
        code = exceptionResponse;
      } else if (
        typeof exceptionResponse === 'object' &&
        exceptionResponse !== null
      ) {
        const obj = exceptionResponse as Record<string, unknown>;
        // Pass-through nếu có code/details
        message = (obj.message as string) ?? exception.message;
        code = (obj.code as string) ?? code;
        details = obj.details;
        error = obj.error as string | undefined;
      } else {
        message = exception.message;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    // Map ThrottlerException → TOO_MANY_REQUESTS
    if (
      typeof exception === 'object' &&
      exception !== null &&
      (exception as { constructor?: { name?: string } }).constructor?.name ===
        'ThrottlerException'
    ) {
      code = ValidationErrorCode.TOO_MANY_REQUESTS;
      message = ValidationErrorCode.TOO_MANY_REQUESTS;
      status = HttpStatus.TOO_MANY_REQUESTS;
    }

    const errorResponse: ErrorResponse = {
      statusCode: status,
      code,
      message: isDev
        ? message
        : status >= 500
          ? 'Internal server error'
          : message,
      details,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    // In development, include detailed error info
    if (isDev) {
      if (error) {
        errorResponse.error = error;
      }
      console.error('Exception:', exception);
    }

    response.status(status).json(errorResponse);
  }
}
