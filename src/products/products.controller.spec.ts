import { Test, TestingModule } from '@nestjs/testing';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { HttpStatus } from '@nestjs/common';
import { ProductResponseDto, ProductsCollectionResponseDto } from './dto/product-response.dto';

describe('ProductsController', () => {
  let controller: ProductsController;
  let service: ProductsService;

  // Mock respuesta de producto JSON API
  const mockProductResponse: ProductResponseDto = {
    data: {
      type: 'product',
      id: 1,
      attributes: {
        name: 'Laptop',
        price: 1200.99,
      },
      links: {
        self: '/products/1',
      },
    },
  };

  // Mock respuesta de colección de productos JSON API
  const mockProductsResponse: ProductsCollectionResponseDto = {
    data: [
      {
        type: 'product',
        id: 1,
        attributes: {
          name: 'Laptop',
          price: 1200.99,
        },
        links: {
          self: '/products/1',
        },
      },
    ],
    meta: {
      pagination: {
        page: 1,
        limit: 10,
        total: 1,
      },
    },
    links: {
      self: '/products?page=1&limit=10',
      first: '/products?page=1&limit=10',
      last: '/products?page=1&limit=10',
      prev: null,
      next: null,
    },
  };
  
  // Mock del servicio de productos con formato JSON API
  const mockProductsService = {
    findAll: jest.fn().mockResolvedValue(mockProductsResponse),
    findOne: jest.fn().mockResolvedValue(mockProductResponse),
    create: jest.fn().mockImplementation((dto: CreateProductDto) =>
      Promise.resolve({
        data: {
          type: 'product',
          id: 1,
          attributes: {
            name: dto.name,
            price: dto.price,
          },
          links: {
            self: '/products/1',
          },
        },
      }),
    ),
    update: jest.fn().mockImplementation((id: number, dto: Partial<CreateProductDto>) =>
      Promise.resolve({
        data: {
          type: 'product',
          id,
          attributes: {
            name: dto.name || 'Laptop',
            price: dto.price || 1200.99,
          },
          links: {
            self: `/products/${id}`,
          },
        },
      }),
    ),
    remove: jest.fn().mockImplementation((id) =>
      Promise.resolve({
        data: {
          type: 'product',
          id,
          attributes: {
            name: 'Laptop',
            price: 1200.99,
          },
        },
      }),
    ),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductsController],
      providers: [{ provide: ProductsService, useValue: mockProductsService }],
    }).compile();

    controller = module.get<ProductsController>(ProductsController);
    service = module.get<ProductsService>(ProductsService);
  });

  it('debe estar definido', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('debe obtener todos los productos en formato JSON API', async () => {
      const result = await controller.findAll();
      
      expect(result).toEqual(mockProductsResponse);
      expect(service.findAll).toHaveBeenCalledWith(undefined, undefined);
    });
    
    it('debe manejar parámetros de paginación', async () => {
      await controller.findAll(2, 20);
      
      expect(service.findAll).toHaveBeenCalledWith(2, 20);
    });
  });

  describe('findOne', () => {
    it('debe obtener un producto por ID en formato JSON API', async () => {
      const result = await controller.findOne(1);
      
      expect(result).toEqual(mockProductResponse);
      expect(service.findOne).toHaveBeenCalledWith(1);
    });
  });

  describe('create', () => {
    it('debe crear un producto y devolver formato JSON API', async () => {
      const dto: CreateProductDto = { name: 'Phone', price: 699.99 };
      const expectedResponse = {
        data: {
          type: 'product',
          id: 1,
          attributes: {
            name: 'Phone',
            price: 699.99,
          },
          links: {
            self: '/products/1',
          },
        },
      };
      
      const result = await controller.create(dto);
      
      expect(result).toEqual(expectedResponse);
      expect(service.create).toHaveBeenCalledWith(dto);
    });
  });

  describe('update', () => {
    it('debe actualizar un producto y devolver formato JSON API', async () => {
      const dto = { name: 'Laptop Pro' };
      const expectedResponse = {
        data: {
          type: 'product',
          id: 1,
          attributes: {
            name: 'Laptop Pro',
            price: 1200.99,
          },
          links: {
            self: '/products/1',
          },
        },
      };
      
      const result = await controller.update(1, dto);
      
      expect(result).toEqual(expectedResponse);
      expect(service.update).toHaveBeenCalledWith(1, dto);
    });
  });

  describe('remove', () => {
    it('debe eliminar un producto y devolver formato JSON API', async () => {
      const expectedResponse = {
        data: {
          type: 'product',
          id: 1,
          attributes: {
            name: 'Laptop',
            price: 1200.99,
          },
        },
      };
      
      const result = await controller.remove(1);
      
      expect(result).toEqual(expectedResponse);
      expect(service.remove).toHaveBeenCalledWith(1);
    });
  });
});
