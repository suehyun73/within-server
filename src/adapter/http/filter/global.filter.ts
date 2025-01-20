import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class GlobalFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();

    const message =
      exception instanceof HttpException
        ? (exception.getResponse() as { message: string })
            .message
        : exception instanceof Error
          ? exception.message
          : 'Internal server error';

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    res.status(status).json({
      message,
      timestamp: new Date().toISOString(),
    });
  }
}
