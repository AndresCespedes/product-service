import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { ProductResponseDto, ProductsCollectionResponseDto } from './dto/product-response.dto';
import { LoggerService } from '../common/logger/logger.service';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    private readonly logger: LoggerService
  ) {
    // Establecer el contexto al inicializar
    this.logger.setContext('ProductsService');
  }

  async create(productDto: CreateProductDto): Promise<ProductResponseDto> {
    try {
      if (!productDto.name || productDto.price === undefined) {
        this.logger.warn(`Intento de creación de producto con datos incompletos: ${JSON.stringify(productDto)}`);
        throw new BadRequestException('Name and price are required');
      }

      if (productDto.price < 0) {
        this.logger.warn(`Intento de creación de producto con precio negativo: ${JSON.stringify(productDto)}`);
        throw new BadRequestException('Price must be positive');
      }

      this.logger.log(`Creando nuevo producto: ${JSON.stringify(productDto)}`);
      const newProduct = this.productRepository.create(productDto);
      const savedProduct = await this.productRepository.save(newProduct);
      this.logger.log(`Producto creado con ID: ${savedProduct.id}`);
      
      return {
        data: {
          type: 'product',
          id: savedProduct.id,
          attributes: {
            name: savedProduct.name,
            price: savedProduct.price,
          },
          links: {
            self: `/products/${savedProduct.id}`,
          },
        },
      };
    } catch (error) {
      this.logger.error(`Error al crear producto: ${error.message}`, error.stack);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Error interno al crear el producto');
    }
  }

  async findAll(page = 1, limit = 10): Promise<ProductsCollectionResponseDto> {
    try {
      // Validar y corregir valores negativos o cero
      const validPage = page <= 0 ? 1 : page;
      const validLimit = limit <= 0 ? 10 : limit;
      
      this.logger.log(`Buscando productos - Página: ${validPage}, Límite: ${validLimit}`);
      const [products, total] = await this.productRepository.findAndCount({
        skip: (validPage - 1) * validLimit,
        take: validLimit,
      });

      if (products.length === 0 && validPage > 1) {
        this.logger.warn(`No se encontraron productos en la página ${validPage}`);
        throw new NotFoundException('No products found for this page');
      }
      
      const lastPage = Math.ceil(total / validLimit) || 1;
      this.logger.log(`Se encontraron ${products.length} productos (total: ${total})`);
      
      return {
        data: products.map(product => ({
          type: 'product',
          id: product.id,
          attributes: {
            name: product.name,
            price: product.price,
          },
          links: {
            self: `/products/${product.id}`,
          }
        })),
        meta: {
          pagination: {
            page: validPage,
            limit: validLimit,
            total,
          },
        },
        links: {
          self: `/products?page=${validPage}&limit=${validLimit}`,
          first: `/products?page=1&limit=${validLimit}`,
          last: `/products?page=${lastPage}&limit=${validLimit}`,
          prev: validPage > 1 ? `/products?page=${validPage - 1}&limit=${validLimit}` : null,
          next: validPage < lastPage ? `/products?page=${validPage + 1}&limit=${validLimit}` : null,
        },
      };
    } catch (error) {
      this.logger.error(`Error al buscar productos: ${error.message}`, error.stack);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Error interno al buscar productos');
    }
  }

  async findOne(id: number): Promise<ProductResponseDto> {
    try {
      this.logger.log(`Buscando producto con ID: ${id}`);
      const product = await this.productRepository.findOne({ where: { id } });
      
      if (!product) {
        this.logger.warn(`Producto con ID ${id} no encontrado`);
        throw new NotFoundException(`Product with id ${id} not found`);
      }
      
      this.logger.log(`Producto encontrado: ${JSON.stringify(product)}`);
      
      return {
        data: {
          type: 'product',
          id: product.id,
          attributes: {
            name: product.name,
            price: product.price,
          },
          links: {
            self: `/products/${product.id}`,
          },
        },
      };
    } catch (error) {
      this.logger.error(`Error al buscar producto por ID: ${error.message}`, error.stack);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(`Error interno al buscar el producto con ID ${id}`);
    }
  }

  async update(
    id: number,
    productDto: Partial<CreateProductDto>,
  ): Promise<ProductResponseDto> {
    try {
      this.logger.log(`Actualizando producto con ID: ${id} - Datos: ${JSON.stringify(productDto)}`);
      
      const product = await this.productRepository.findOne({ where: { id } });
      if (!product) {
        this.logger.warn(`Intento de actualizar producto inexistente con ID: ${id}`);
        throw new NotFoundException(`Product with id ${id} not found`);
      }
      
      if (productDto.price !== undefined && productDto.price < 0) {
        this.logger.warn(`Intento de actualizar producto con precio negativo: ${JSON.stringify(productDto)}`);
        throw new BadRequestException('Price must be positive');
      }
      
      const updatedProductData = { ...product, ...productDto };
      const updatedProduct = await this.productRepository.save(updatedProductData);
      
      this.logger.log(`Producto actualizado: ${JSON.stringify(updatedProduct)}`);
      
      return {
        data: {
          type: 'product',
          id: updatedProduct.id,
          attributes: {
            name: updatedProduct.name,
            price: updatedProduct.price,
          },
          links: {
            self: `/products/${updatedProduct.id}`,
          },
        },
      };
    } catch (error) {
      this.logger.error(`Error al actualizar producto: ${error.message}`, error.stack);
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException(`Error interno al actualizar el producto con ID ${id}`);
    }
  }

  async remove(id: number): Promise<ProductResponseDto> {
    try {
      this.logger.log(`Eliminando producto con ID: ${id}`);
      
      const product = await this.productRepository.findOne({ where: { id } });
      if (!product) {
        this.logger.warn(`Intento de eliminar producto inexistente con ID: ${id}`);
        throw new NotFoundException(`Product with id ${id} not found`);
      }
      
      await this.productRepository.delete(id);
      
      this.logger.log(`Producto con ID: ${id} eliminado correctamente`);
      
      return {
        data: {
          type: 'product',
          id: product.id,
          attributes: {
            name: product.name,
            price: product.price,
          },
        },
      };
    } catch (error) {
      this.logger.error(`Error al eliminar producto: ${error.message}`, error.stack);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(`Error interno al eliminar el producto con ID ${id}`);
    }
  }
}
