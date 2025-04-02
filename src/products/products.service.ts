import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { CreateProductDto } from './dto/create-product.dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
  ) {}

  async create(productDto: CreateProductDto): Promise<Product> {
    if (!productDto.name || productDto.price === undefined) {
      throw new BadRequestException('Name and price are required');
    }

    const newProduct = this.productRepository.create(productDto);
    return this.productRepository.save(newProduct);
  }

  async findAll(page = 1, limit = 10): Promise<Product[]> {
    const products = await this.productRepository.find({
      skip: (page - 1) * limit,
      take: limit,
    });

    if (products.length === 0) {
      throw new NotFoundException('No products found');
    }
    return products;
  }

  async findOne(id: number): Promise<Product> {
    const product = await this.productRepository.findOne({ where: { id } });
    if (!product) {
      throw new NotFoundException(`Product with id ${id} not found`);
    }
    return product;
  }

  async update(
    id: number,
    productDto: Partial<CreateProductDto>,
  ): Promise<Product> {
    const product = await this.findOne(id);
    Object.assign(product, productDto);
    return this.productRepository.save(product);
  }

  async remove(id: number): Promise<void> {
    const result = await this.productRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Product with id ${id} not found`);
    }
  }
}
