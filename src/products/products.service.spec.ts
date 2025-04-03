import { Test, TestingModule } from '@nestjs/testing';
import { ProductsService } from './products.service';
import { Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { LoggerService } from '../common/logger/logger.service';
import { ProductResponseDto, ProductsCollectionResponseDto } from './dto/product-response.dto';
import { CreateProductDto } from './dto/create-product.dto';

// Mock de producto simple
const mockProduct: Product = { id: 1, name: 'Laptop', price: 1200.99 };

// Mock de respuesta JSON API para un producto
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

// Mock de respuesta JSON API para una colección de productos
const mockProductsCollectionResponse: ProductsCollectionResponseDto = {
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

// Mock del repositorio con métodos más detallados
const mockProductRepository = {
  create: jest.fn().mockImplementation((dto) => ({ ...dto })),
  save: jest.fn().mockImplementation((product) => Promise.resolve({ id: 1, ...product })),
  findAndCount: jest.fn().mockResolvedValue([[mockProduct], 1]),
  find: jest.fn().mockResolvedValue([mockProduct]),
  findOne: jest.fn().mockImplementation(({ where }) => {
    if (where.id === 99) return null;
    return Promise.resolve(mockProduct);
  }),
  delete: jest.fn().mockImplementation((id) => {
    if (id === 99) return Promise.resolve({ affected: 0 });
    return Promise.resolve({ affected: 1 });
  }),
};

// Mock del servicio de logs
const mockLoggerService = {
  context: 'ProductsService',
  setContext: jest.fn(function(context) { this.context = context; }),
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
  verbose: jest.fn(),
  logRequest: jest.fn(),
  logResponse: jest.fn(),
  formatMessage: jest.fn(message => message)
};

describe('ProductsService', () => {
  let service: ProductsService;
  let repository: Repository<Product>;
  let logger: LoggerService;

  beforeEach(async () => {
    jest.clearAllMocks();
    
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        {
          provide: getRepositoryToken(Product),
          useValue: mockProductRepository,
        },
        {
          provide: LoggerService,
          useValue: mockLoggerService,
        },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
    repository = module.get<Repository<Product>>(getRepositoryToken(Product));
    logger = module.get<LoggerService>(LoggerService);
  });

  it('debe estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('debe crear un producto y devolver formato JSON API', async () => {
      const createProductDto: CreateProductDto = {
        name: 'Laptop',
        price: 1200.99,
      };

      const result = await service.create(createProductDto);
      
      expect(result).toEqual(mockProductResponse);
      expect(repository.create).toHaveBeenCalledWith(createProductDto);
      expect(repository.save).toHaveBeenCalled();
      expect(logger.log).toHaveBeenCalledTimes(2);
    });

    it('debe lanzar BadRequestException si faltan datos', async () => {
      const incompleteDto = { name: 'Laptop' };
      
      await expect(service.create(incompleteDto as CreateProductDto)).rejects.toThrow(
        BadRequestException,
      );
      expect(logger.warn).toHaveBeenCalled();
    });

    it('debe manejar errores internos', async () => {
      jest.spyOn(repository, 'save').mockRejectedValueOnce(new Error('DB Error'));
      
      await expect(service.create({ name: 'Laptop', price: 1200.99 })).rejects.toThrow(
        InternalServerErrorException,
      );
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('debe retornar todos los productos en formato JSON API', async () => {
      const result = await service.findAll();
      
      expect(result).toEqual(mockProductsCollectionResponse);
      expect(repository.findAndCount).toHaveBeenCalledWith({
        skip: 0,
        take: 10,
      });
      expect(logger.log).toHaveBeenCalled();
    });

    it('debe manejar paginación correctamente', async () => {
      await service.findAll(2, 20);
      
      expect(repository.findAndCount).toHaveBeenCalledWith({
        skip: 20,
        take: 20,
      });
    });

    it('debe lanzar NotFoundException si no hay productos en la página solicitada', async () => {
      jest.spyOn(repository, 'findAndCount').mockResolvedValueOnce([[], 0]);
      
      await expect(service.findAll(2)).rejects.toThrow(NotFoundException);
      expect(logger.warn).toHaveBeenCalled();
    });

    it('debe manejar errores internos en findAll', async () => {
      jest.spyOn(repository, 'findAndCount').mockRejectedValueOnce(new Error('DB Error'));
      
      await expect(service.findAll()).rejects.toThrow(
        InternalServerErrorException,
      );
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('debe retornar un producto por ID en formato JSON API', async () => {
      const result = await service.findOne(1);
      
      expect(result).toEqual(mockProductResponse);
      expect(repository.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(logger.log).toHaveBeenCalled();
    });

    it('debe lanzar NotFoundException si el producto no existe', async () => {
      await expect(service.findOne(99)).rejects.toThrow(NotFoundException);
      expect(logger.warn).toHaveBeenCalled();
    });

    it('debe manejar errores internos en findOne', async () => {
      jest.spyOn(repository, 'findOne').mockRejectedValueOnce(new Error('DB Error'));
      
      await expect(service.findOne(1)).rejects.toThrow(
        InternalServerErrorException,
      );
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('debe actualizar un producto y devolver formato JSON API', async () => {
      const updateData = { name: 'Laptop Pro' };
      const updatedProduct = { ...mockProduct, ...updateData };
      
      jest.spyOn(repository, 'save').mockResolvedValueOnce(updatedProduct);
      
      const result = await service.update(1, updateData);
      
      expect(result).toEqual({
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
      });
      expect(repository.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(repository.save).toHaveBeenCalled();
      expect(logger.log).toHaveBeenCalledTimes(2);
    });

    it('debe lanzar NotFoundException si el producto no existe', async () => {
      await expect(service.update(99, { name: 'New Name' })).rejects.toThrow(
        NotFoundException,
      );
      expect(logger.warn).toHaveBeenCalled();
    });

    it('debe manejar errores internos en update', async () => {
      jest.spyOn(repository, 'save').mockRejectedValueOnce(new Error('DB Error'));
      
      await expect(service.update(1, { name: 'New Name' })).rejects.toThrow(
        InternalServerErrorException,
      );
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('debe eliminar un producto y devolver formato JSON API', async () => {
      const result = await service.remove(1);
      
      expect(result).toEqual({
        data: {
          type: 'product',
          id: 1,
          attributes: {
            name: 'Laptop',
            price: 1200.99,
          },
        },
      });
      expect(repository.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(repository.delete).toHaveBeenCalledWith(1);
      expect(logger.log).toHaveBeenCalledTimes(2);
    });

    it('debe lanzar NotFoundException si el producto no existe al intentar eliminar', async () => {
      await expect(service.remove(99)).rejects.toThrow(
        NotFoundException,
      );
      expect(logger.warn).toHaveBeenCalled();
    });

    it('debe manejar errores internos durante la eliminación', async () => {
      jest.spyOn(repository, 'delete').mockRejectedValueOnce(new Error('DB Error'));
      
      await expect(service.remove(1)).rejects.toThrow(
        InternalServerErrorException,
      );
      expect(logger.error).toHaveBeenCalled();
    });
  });

  // Pruebas adicionales para manejos de errores
  describe('manejo de errores adicionales', () => {
    it('debe manejar errores de validación en create con campos inválidos', async () => {
      await expect(service.create({
        name: 'Test',
        price: -100,
      })).rejects.toThrow(BadRequestException);
      
      expect(logger.warn).toHaveBeenCalled();
    });
    
    it('debe manejar errores cuando se intenta actualizar con campos inválidos', async () => {
      const updateData = { price: -200 };
      
      await expect(service.update(1, updateData)).rejects.toThrow(BadRequestException);
      
      expect(logger.warn).toHaveBeenCalled();
    });
  });

  // Pruebas adicionales para mejorar cobertura
  describe('Cobertura adicional', () => {
    it('debe formatear correctamente URLs en las paginaciones', async () => {
      jest.spyOn(repository, 'findAndCount').mockResolvedValueOnce([
        Array(20).fill(mockProduct), 
        50
      ]);
      
      const result = await service.findAll(2, 10);
      
      expect(result.links.prev).toBe('/products?page=1&limit=10');
      expect(result.links.next).toBe('/products?page=3&limit=10');
      expect(result.links.first).toBe('/products?page=1&limit=10');
      expect(result.links.last).toBe('/products?page=5&limit=10');
      expect(result.meta.pagination.total).toBe(50);
    });
    
    it('debe manejar correctamente la primera página sin prev link', async () => {
      jest.spyOn(repository, 'findAndCount').mockResolvedValueOnce([
        Array(10).fill(mockProduct), 
        30
      ]);
      
      const result = await service.findAll(1, 10);
      
      expect(result.links.prev).toBeNull();
      expect(result.links.next).toBe('/products?page=2&limit=10');
    });
    
    it('debe manejar correctamente la última página sin next link', async () => {
      jest.spyOn(repository, 'findAndCount').mockResolvedValueOnce([
        Array(5).fill(mockProduct), 
        25
      ]);
      
      const result = await service.findAll(3, 10);
      
      expect(result.links.next).toBeNull();
      expect(result.links.prev).toBe('/products?page=2&limit=10');
    });
    
    it('debe manejar correctamente valores negativos o cero en paginación', async () => {
      // Page negativa debe convertirse a 1
      await service.findAll(-1, 10);
      expect(repository.findAndCount).toHaveBeenCalledWith({
        skip: 0,
        take: 10,
      });
      
      // Limit negativo debe convertirse a 10
      await service.findAll(1, -5);
      expect(repository.findAndCount).toHaveBeenCalledWith({
        skip: 0,
        take: 10,
      });
    });
  });
});
