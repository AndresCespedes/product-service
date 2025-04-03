import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { LoggerService } from '../logger/logger.service';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private logger = new LoggerService('ExceptionFilter');

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    // Para tratar tanto excepciones lanzadas con un string como con un objeto
    const errorMessage = 
      typeof exceptionResponse === 'string'
        ? exceptionResponse
        : (exceptionResponse as any).message || 'Ocurrió un error en la solicitud';

    this.logger.error(
      `${request.method} ${request.url} - Status: ${status} - Error: ${errorMessage}`,
      exception.stack,
    );

    // Formato JSON API para errores
    response.status(status).json({
      errors: [
        {
          status: String(status),
          title: HttpStatus[status] || 'Error',
          detail: errorMessage,
          source: {
            pointer: request.url,
          },
        },
      ],
    });
  }
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private logger = new LoggerService('GlobalExceptionFilter');

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    
    const status = 
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const errorMessage = 
      exception instanceof HttpException
        ? exception.message
        : 'Error interno del servidor';

    this.logger.error(
      `${request.method} ${request.url} - Status: ${status} - Error: ${errorMessage}`,
      exception.stack,
    );

    // Formato JSON API para errores
    response.status(status).json({
      errors: [
        {
          status: String(status),
          title: HttpStatus[status] || 'Error Interno del Servidor',
          detail: errorMessage,
          source: {
            pointer: request.url,
          },
        },
      ],
    });
  }
} 