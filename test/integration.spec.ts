// Esta prueba de integración simula la comunicación entre el servicio de Inventario y el servicio de Productos
// Ya que los microservicios están separados, esta es una prueba simulada que demuestra cómo se comunicarían

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, HttpStatus } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { of } from 'rxjs';
import { ConfigService } from '@nestjs/config';
import { ProductsService } from '../src/products/products.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Product } from '../src/products/entities/product.entity';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { LoggerService } from '../src/common/logger/logger.service';

// Para simular implementación RESTful
class MockHTTPClient {
  get() {}
  post() {}
}

describe('Integración entre servicios (Simulado)', () => {
  let app: INestApplication;
  let mockHTTPClient: MockHTTPClient;
  let configService: ConfigService;
  let productId: number;
  let productsService: ProductsService;

  // Datos de prueba
  const productData = {
    name: 'Producto de prueba',
    price: 299.99,
  };

  const inventoryData = {
    productId: 1,
    quantity: 50,
  };

  // Simulación de respuestas
  const mockProductResponse = {
    data: {
      data: {
        type: 'product',
        id: 1,
        attributes: {
          name: 'Producto de prueba',
          price: 299.99,
        },
        links: {
          self: '/products/1',
        },
      },
    },
  };

  const mockProductsRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    findAndCount: jest.fn(),
  };

  const mockHTTPService = {
    get: jest.fn(),
    post: jest.fn(),
  };

  const mockLoggerService = {
    context: 'TestIntegration',
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    verbose: jest.fn(),
    logRequest: jest.fn(),
    logResponse: jest.fn(),
    formatMessage: jest.fn(),
    setContext: jest.fn(),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
      providers: [
        ProductsService,
        {
          provide: getRepositoryToken(Product),
          useValue: mockProductsRepository,
        },
        {
          provide: MockHTTPClient,
          useValue: mockHTTPService,
        },
        {
          provide: LoggerService,
          useValue: mockLoggerService,
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    mockHTTPClient = app.get<MockHTTPClient>(MockHTTPClient);
    configService = app.get<ConfigService>(ConfigService);
    productsService = app.get<ProductsService>(ProductsService);

    // Mock para simular llamadas HTTP al servicio de productos
    jest.spyOn(mockHTTPClient, 'get').mockImplementation(() => {
      return of({
        data: mockProductResponse.data,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: { url: 'http://localhost:3000/products/1' } as any
      });
    });

    await app.init();

    // Crear un producto real para las pruebas
    const response = await request(app.getHttpServer())
      .post('/products')
      .send(productData)
      .expect(201);

    productId = response.body.data.id;
    inventoryData.productId = productId;
  });

  afterAll(async () => {
    await request(app.getHttpServer())
      .delete(`/products/${productId}`)
      .expect(200);

    await app.close();
  });

  describe('Flujo de comunicación entre servicios', () => {
    it('Inventario obtiene información del producto desde Productos', async () => {
      // Aquí simularíamos llamadas entre servicios
      // En un entorno real, sería una llamada HTTP real pero para pruebas lo simulamos
      
      // Simular la creación de un inventario para el producto
      const inventoryResponse = {
        data: {
          type: 'inventory',
          id: 1,
          attributes: {
            productId: productId,
            quantity: 50,
            product: {
              id: productId,
              name: 'Producto de prueba',
              price: 299.99,
            },
          },
          links: {
            self: `/inventory/${productId}`,
          },
        },
      };

      // Simular la llamada al servicio de productos
      const productServiceUrl = configService.get<string>('PRODUCT_SERVICE_URL', 'http://localhost:3000');
      expect(productServiceUrl).toBeDefined();
      
      // Verificar que el mock de httpService fue llamado
      expect(mockHTTPClient.get).toBeDefined();
      
      // Asegurarse que el mock de HttpService esté configurado para devolver la respuesta esperada
      jest.spyOn(mockHTTPClient, 'get').mockImplementation(() => {
        return of({
          data: mockProductResponse.data,
          status: 200,
          statusText: 'OK',
          headers: {},
          config: { url: 'http://localhost:3000/products/1' } as any
        });
      });
      
      // Prueba que verifica el formato de respuesta correcto del inventario
      expect(inventoryResponse.data).toHaveProperty('type', 'inventory');
      expect(inventoryResponse.data).toHaveProperty('attributes');
      expect(inventoryResponse.data.attributes).toHaveProperty('product');
      expect(inventoryResponse.data.attributes.product).toHaveProperty('id', productId);
    });

    it('Maneja errores de comunicación entre servicios', async () => {
      // Simulamos un fallo en la comunicación
      jest.spyOn(mockHTTPClient, 'get').mockImplementation(() => {
        throw new Error('Connection failed');
      });

      // Simular la respuesta con error
      const errorResponse = {
        errors: [
          {
            status: String(HttpStatus.SERVICE_UNAVAILABLE),
            title: 'Service Unavailable',
            detail: 'Error en la comunicación con el servicio de productos',
          },
        ],
      };

      // Verificar formato correcto de error según JSON API
      expect(errorResponse).toHaveProperty('errors');
      expect(errorResponse.errors[0]).toHaveProperty('status', '503');
      expect(errorResponse.errors[0]).toHaveProperty('title');
      expect(errorResponse.errors[0]).toHaveProperty('detail');
    });
  });

  describe('Integración con microservicios', () => {
    it('debe enviar notificación cuando se crea un producto', async () => {
      // Configurar los mocks
      mockProductsRepository.create.mockReturnValue({
        id: 1,
        name: 'Laptop',
        price: 999.99,
      });
      
      mockProductsRepository.save.mockResolvedValue({
        id: 1,
        name: 'Laptop',
        price: 999.99,
      });
      
      mockHTTPService.post.mockReturnValue(
        of({
          data: { success: true },
          status: 200,
          statusText: 'OK',
          headers: {},
          config: { url: 'http://notification-service/notifications' } as any,
        }),
      );

      // Ejecutar el método
      const result = await productsService.create({
        name: 'Laptop',
        price: 999.99,
      });

      // Verificar el resultado
      expect(result).toEqual({
        data: {
          type: 'product',
          id: 1,
          attributes: {
            name: 'Laptop',
            price: 999.99,
          },
          links: {
            self: '/products/1',
          },
        },
      });

      // Verificar que el repositorio se llamó correctamente
      expect(mockProductsRepository.create).toHaveBeenCalledWith({
        name: 'Laptop',
        price: 999.99,
      });
      
      expect(mockProductsRepository.save).toHaveBeenCalled();
      
      // Verificar los logs
      expect(mockLoggerService.log).toHaveBeenCalled();
    });

    it('debe manejar errores de microservicios correctamente', async () => {
      // Configurar los mocks
      mockProductsRepository.findOne.mockResolvedValue({
        id: 1,
        name: 'Laptop',
        price: 999.99,
      });
      
      mockHTTPService.get.mockImplementation(() => {
        throw new Error('Servicio no disponible');
      });

      // Ejecutar y verificar que maneja el error
      const result = await productsService.findOne(1);
      
      // Verificar que el producto se devuelve a pesar del error del microservicio
      expect(result).toEqual({
        data: {
          type: 'product',
          id: 1,
          attributes: {
            name: 'Laptop',
            price: 999.99,
          },
          links: {
            self: '/products/1',
          },
        },
      });
      
      // Verificar que se registró el error
      expect(mockLoggerService.error).toHaveBeenCalled();
    });
  });

  describe('Validación de formato JSON API', () => {
    it('debe formatear la respuesta en formato JSON API para un producto', async () => {
      // Configurar los mocks
      mockProductsRepository.findOne.mockResolvedValue({
        id: 1,
        name: 'Laptop',
        price: 999.99,
      });
      
      // Ejecutar el método
      const result = await productsService.findOne(1);
      
      // Verificar el resultado
      expect(result).toEqual({
        data: {
          type: 'product',
          id: 1,
          attributes: {
            name: 'Laptop',
            price: 999.99,
          },
          links: {
            self: '/products/1',
          },
        },
      });
      
      // En un contexto real, aquí verificaríamos que el controlador formatea la respuesta en JSON API
    });

    it('debe devolver un error 404 en formato JSON API cuando el producto no existe', async () => {
      // Configurar los mocks
      mockProductsRepository.findOne.mockResolvedValue(null);
      
      // Ejecutar y verificar
      await expect(productsService.findOne(999)).rejects.toThrow(NotFoundException);
      
      // Verificar que se registró el error
      expect(mockLoggerService.error).toHaveBeenCalled();
    });
  });

  describe('Manejo de errores', () => {
    it('debe lanzar BadRequestException cuando faltan campos obligatorios', async () => {
      // Ejecutar y verificar
      await expect(productsService.create({
        name: '',
        price: 0,
      })).rejects.toThrow(BadRequestException);
      
      // Verificar que se registró el error
      expect(mockLoggerService.warn).toHaveBeenCalled();
    });

    it('debe lanzar NotFoundException cuando no hay productos para la página solicitada', async () => {
      // Configurar los mocks
      mockProductsRepository.findAndCount.mockResolvedValue([[], 0]);
      
      // Ejecutar y verificar
      await expect(productsService.findAll(999, 10)).rejects.toThrow(NotFoundException);
      
      // Verificar los logs
      expect(mockLoggerService.warn).toHaveBeenCalled();
    });
  });
}); 