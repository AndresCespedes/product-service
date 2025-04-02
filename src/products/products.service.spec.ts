import { Test, TestingModule } from '@nestjs/testing';
import { ProductsService } from './products.service';
import { Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';

const mockProduct = { id: 1, name: 'Laptop', price: 1200.99 };
const mockProductRepository = {
  create: jest.fn().mockImplementation((dto) => dto),
  save: jest.fn().mockResolvedValue(mockProduct),
  find: jest.fn().mockResolvedValue([mockProduct]),
  findOne: jest.fn().mockResolvedValue(mockProduct),
  delete: jest.fn().mockResolvedValue({ affected: 1 }),
};

describe('ProductsService', () => {
  let service: ProductsService;
  let repository: Repository<Product>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        {
          provide: getRepositoryToken(Product),
          useValue: mockProductRepository,
        },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
    repository = module.get<Repository<Product>>(getRepositoryToken(Product));
  });

  it('debe estar definido', () => {
    expect(service).toBeDefined();
  });

  it('debe crear un producto', async () => {
    const result = await service.create(mockProduct);
    expect(result).toEqual(mockProduct);
    expect(repository.create).toHaveBeenCalledWith(mockProduct);
    expect(repository.save).toHaveBeenCalledWith(mockProduct);
  });

  it('debe retornar todos los productos', async () => {
    const result = await service.findAll();
    expect(result).toEqual([mockProduct]);
    expect(repository.find).toHaveBeenCalled();
  });

  it('debe retornar un producto por ID', async () => {
    const result = await service.findOne(1);
    expect(result).toEqual(mockProduct);
    expect(repository.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
  });

  it('debe lanzar error si el producto no existe', async () => {
    jest.spyOn(repository, 'findOne').mockResolvedValue(null);
    await expect(service.findOne(99)).rejects.toThrow(
      new NotFoundException('Product with id 99 not found'),
    );
  });

  it('debe actualizar un producto', async () => {
    const updatedProduct = { ...mockProduct, name: 'Laptop Pro' };

    // Asegurar que findOne devuelve un producto
    jest.spyOn(repository, 'findOne').mockResolvedValue(mockProduct);
    jest.spyOn(repository, 'save').mockResolvedValue(updatedProduct);

    const result = await service.update(1, { name: 'Laptop Pro' });

    expect(result).toEqual(updatedProduct);
    expect(repository.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
    expect(repository.save).toHaveBeenCalledWith({
      ...mockProduct,
      name: 'Laptop Pro',
    });
  });

  it('debe eliminar un producto', async () => {
    const result = await service.remove(1);
    expect(result).toBeUndefined();
    expect(repository.delete).toHaveBeenCalledWith(1);
  });

  it('debe lanzar un error si el producto no existe', async () => {
    jest.spyOn(service, 'findOne').mockImplementation(async () => {
      throw new NotFoundException('Product with id 99 not found');
    });

    await expect(service.findOne(99)).rejects.toThrow(
      'Product with id 99 not found',
    );
  });

  it('debe lanzar un error si no puede eliminar el producto', async () => {
    jest
      .spyOn(service, 'remove')
      .mockRejectedValue(new Error('Error al eliminar producto'));

    await expect(service.remove(99)).rejects.toThrow(
      'Error al eliminar producto',
    );
  });
});
