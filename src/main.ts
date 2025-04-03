import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { DataSource } from 'typeorm';
import { HttpExceptionFilter, AllExceptionsFilter } from './common/filters/http-exception.filter';
import { LoggerService } from './common/logger/logger.service';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const logger = new LoggerService('Bootstrap');
  
  try {
    const app = await NestFactory.create(AppModule);
    
    // Configuración de validación global
    app.useGlobalPipes(new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }));
    
    // Configuración de filtros de excepciones globales
    app.useGlobalFilters(
      new HttpExceptionFilter(),
      new AllExceptionsFilter(),
    );

    // Habilitar CORS
    app.enableCors({
      origin: '*',
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
      allowedHeaders: 'Content-Type, Accept, x-api-key',
      exposedHeaders: 'x-api-key',
      credentials: true,
      preflightContinue: false,
    });
    
    // Inicializar la conexión a la base de datos
    const dataSource = app.get(DataSource);
    if (!dataSource.isInitialized) {
      await dataSource.initialize();
      logger.log('Conexión a base de datos inicializada correctamente');
    }

    // Configuración de Swagger
    const config = new DocumentBuilder()
      .setTitle('Product API')
      .setDescription('API para la gestión de productos')
      .setVersion('1.0')
      .addApiKey({ type: 'apiKey', name: 'x-api-key', in: 'header' }, 'x-api-key')
      .addTag('Products', 'Endpoints para gestión de productos')
      .addServer('http://localhost:3000', 'Servidor local de desarrollo')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);

    const port = process.env.PORT || 3000;
    await app.listen(port);
    logger.log(`Aplicación inicializada correctamente en puerto ${port}`);
    logger.log(`Documentación Swagger disponible en: http://localhost:${port}/api/docs`);
  } catch (error) {
    logger.error(`Error al inicializar la aplicación: ${error.message}`, error.stack);
    process.exit(1);
  }
}
bootstrap();
