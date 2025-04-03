import { Injectable, Logger, LoggerService as NestLoggerService } from '@nestjs/common';

@Injectable()
export class LoggerService implements NestLoggerService {
  private context = 'App';
  private logger = new Logger(this.context);

  constructor(context?: string) {
    if (context) {
      this.context = context;
      this.logger = new Logger(context);
    }
  }

  setContext(context: string): void {
    this.context = context;
    this.logger = new Logger(context);
  }

  log(message: string, context?: string): void {
    this.logger.log(this.formatMessage(message), context || this.context);
  }

  error(message: string, trace?: string, context?: string): void {
    this.logger.error(
      this.formatMessage(message),
      trace,
      context || this.context,
    );
  }

  warn(message: string, context?: string): void {
    this.logger.warn(this.formatMessage(message), context || this.context);
  }

  debug(message: string, context?: string): void {
    this.logger.debug(this.formatMessage(message), context || this.context);
  }

  verbose(message: string, context?: string): void {
    this.logger.verbose(this.formatMessage(message), context || this.context);
  }

  private formatMessage(message: string): string {
    return `[${new Date().toISOString()}] ${message}`;
  }

  logRequest(req: any): void {
    this.log(
      `Request: ${req.method} ${req.url} - IP: ${req.ip} - User-Agent: ${
        req.headers['user-agent'] || 'Not provided'
      }`,
      'HttpRequest',
    );
  }

  logResponse(req: any, res: any, startTime: number): void {
    const now = Date.now();
    const responseTime = now - startTime;
    this.log(
      `Response: ${req.method} ${req.url} - Status: ${res.statusCode} - Duration: ${responseTime}ms`,
      'HttpResponse',
    );
  }
} 