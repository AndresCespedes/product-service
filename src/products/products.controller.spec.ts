import { Test, TestingModule } from '@nestjs/testing';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { Product } from './entities/product.entity';

describe('ProductsController', () => {
  let controller: ProductsController;
  let service: ProductsService;

  const mockProduct: Product = { id: 1, name: 'Laptop', price: 1200.99 };
  
  const mockProductsService = {
    findAll: jest.fn().mockResolvedValue([mockProduct]),
    findOne: jest.fn().mockResolvedValue(mockProduct),
    create: jest.fn().mockImplementation((dto: CreateProductDto) =>
      Promise.resolve({ id: 1, ...dto }),
    ),
    update: jest.fn().mockImplementation((id: number, dto: Partial<CreateProductDto>) =>
      Promise.resolve({ id, ...dto }),
    ),
    remove: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
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

  it('debe obtener todos los productos', async () => {
    const result = await controller.findAll();
    expect(result).toEqual([mockProduct]);
    expect(service.findAll).toHaveBeenCalledTimes(1);
  });

  it('debe obtener un producto por ID', async () => {
    const result = await controller.findOne(1);
    expect(result).toEqual(mockProduct);
    expect(service.findOne).toHaveBeenCalledWith(1);
  });

  it('debe crear un producto', async () => {
    const dto: CreateProductDto = { name: 'Phone', price: 699.99 };
    const result = await controller.create(dto);
    expect(result).toEqual({ id: 1, ...dto });
    expect(service.create).toHaveBeenCalledWith(dto);
  });

  it('debe actualizar un producto', async () => {
    const dto: Partial<CreateProductDto> = { name: 'Laptop Pro' };
    const result = await controller.update(1, dto);
    expect(result).toEqual({ id: 1, ...dto });
    expect(service.update).toHaveBeenCalledWith(1, dto);
  });

  it('debe eliminar un producto', async () => {
    const result = await controller.remove(1);
    expect(result).toBeUndefined();
    expect(service.remove).toHaveBeenCalledWith(1);
  });
});
