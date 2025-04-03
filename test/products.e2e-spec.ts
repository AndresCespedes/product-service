import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Product } from '../src/products/entities/product.entity';
import { Repository } from 'typeorm';
import { HttpExceptionFilter, AllExceptionsFilter } from '../src/common/filters/http-exception.filter';
import { LoggerService } from '../src/common/logger/logger.service';

describe('ProductsController (e2e)', () => {
  let app: INestApplication;
  let productsRepository: Repository<Product>;
  let productId: number;

  // Silenciar los logs durante las pruebas para evitar ruido en la consola
  const mockLoggerService = {
    context: 'TestE2E',
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    verbose: jest.fn(),
    logRequest: jest.fn(),
    logResponse: jest.fn(),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
    .overrideProvider(LoggerService)
    .useValue(mockLoggerService)
    .compile();

    app = moduleFixture.createNestApplication();
    
    // Configurar la aplicación igual que en main.ts
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );
    
    app.useGlobalFilters(
      new HttpExceptionFilter(),
      new AllExceptionsFilter(),
    );

    productsRepository = app.get<Repository<Product>>(getRepositoryToken(Product));
    
    await app.init();
    
    // Limpiar la base de datos antes de las pruebas
    await productsRepository.query('DELETE FROM product');
  });

  afterAll(async () => {
    // Limpiar la base de datos después de las pruebas
    await productsRepository.query('DELETE FROM product');
    await app.close();
  });

  describe('/products (POST)', () => {
    it('debe crear un nuevo producto y devolver formato JSON API', async () => {
      const createProductDto = {
        name: 'Laptop de prueba',
        price: 999.99,
      };

      const response = await request(app.getHttpServer())
        .post('/products')
        .send(createProductDto)
        .expect(201);

      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('type', 'product');
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('attributes');
      expect(response.body.data.attributes).toHaveProperty('name', 'Laptop de prueba');
      expect(response.body.data.attributes).toHaveProperty('price', 999.99);
      expect(response.body.data).toHaveProperty('links');
      expect(response.body.data.links).toHaveProperty('self');

      // Guardar el ID para usarlo en otras pruebas
      productId = response.body.data.id;
    });

    it('debe rechazar datos inválidos con el formato JSON API para errores', async () => {
      const invalidProductDto = {
        name: '',
        price: -100,
      };

      const response = await request(app.getHttpServer())
        .post('/products')
        .send(invalidProductDto)
        .expect(400);

      expect(response.body).toHaveProperty('errors');
      expect(Array.isArray(response.body.errors)).toBe(true);
      expect(response.body.errors[0]).toHaveProperty('status', '400');
    });
  });

  describe('/products (GET)', () => {
    it('debe obtener todos los productos con paginación en formato JSON API', async () => {
      const response = await request(app.getHttpServer())
        .get('/products')
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body).toHaveProperty('meta');
      expect(response.body.meta).toHaveProperty('pagination');
      expect(response.body).toHaveProperty('links');
    });
  });

  describe('/products/:id (GET)', () => {
    it('debe obtener un producto por ID en formato JSON API', async () => {
      const response = await request(app.getHttpServer())
        .get(`/products/${productId}`)
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('type', 'product');
      expect(response.body.data).toHaveProperty('id', productId);
      expect(response.body.data).toHaveProperty('attributes');
      expect(response.body.data.attributes).toHaveProperty('name', 'Laptop de prueba');
      expect(response.body.data.attributes).toHaveProperty('price', 999.99);
    });

    it('debe devolver 404 para un producto que no existe', async () => {
      const response = await request(app.getHttpServer())
        .get('/products/999')
        .expect(404);

      expect(response.body).toHaveProperty('errors');
      expect(response.body.errors[0]).toHaveProperty('status', '404');
    });
  });

  describe('/products/:id (PATCH)', () => {
    it('debe actualizar un producto y devolver formato JSON API', async () => {
      const updateProductDto = {
        name: 'Laptop actualizada',
      };

      const response = await request(app.getHttpServer())
        .patch(`/products/${productId}`)
        .send(updateProductDto)
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('type', 'product');
      expect(response.body.data).toHaveProperty('id', productId);
      expect(response.body.data).toHaveProperty('attributes');
      expect(response.body.data.attributes).toHaveProperty('name', 'Laptop actualizada');
      expect(response.body.data.attributes).toHaveProperty('price', 999.99);
    });
  });

  describe('/products/:id (DELETE)', () => {
    it('debe eliminar un producto y devolver formato JSON API', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/products/${productId}`)
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('type', 'product');
      expect(response.body.data).toHaveProperty('id', productId);
      
      // Verificar que el producto ya no existe
      await request(app.getHttpServer())
        .get(`/products/${productId}`)
        .expect(404);
    });
  });
}); 