import {
  Injectable,
  NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class ApiKeyMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Excluir Swagger y archivos relacionados
    if (
      req.path.startsWith('/api/docs') ||
      req.path.startsWith('/swagger-ui') ||
      req.path.startsWith('/products') ||
      req.path === '/'
    ) {
      return next();
    }

    const apiKey = req.headers['x-api-key'] || req.headers['X-API-KEY'];
    const validApiKey = process.env.API_KEY;

    if (!apiKey || apiKey !== validApiKey) {
      throw new UnauthorizedException('API Key inválida');
    }

    next();
  }
}
