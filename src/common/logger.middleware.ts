import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { LoggerService } from './logger/logger.service';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  private logger = new LoggerService('HttpMiddleware');

  use(req: Request, res: Response, next: NextFunction) {
    const startTime = Date.now();
    
    this.logger.logRequest(req);

    // Guardar el tiempo de inicio para calcular la duración
    req['startTime'] = startTime;

    // Capturar cuando se complete la respuesta
    res.on('finish', () => {
      this.logger.logResponse(req, res, startTime);
    });

    next();
  }
}