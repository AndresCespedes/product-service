import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { DataSource } from 'typeorm';
import { ApiKeyMiddleware } from './common/auth/api-key.middleware';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(new ApiKeyMiddleware().use);

  const dataSource = app.get(DataSource);
  if (!dataSource.isInitialized) {
    await dataSource.initialize();
  }

  const config = new DocumentBuilder()
    .setTitle('Product API')
    .setDescription('API para la gestión de productos')
    .setVersion('1.0')
    .addApiKey({ type: 'apiKey', name: 'x-api-key', in: 'header' }, 'x-api-key')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(3000);
}
bootstrap();
