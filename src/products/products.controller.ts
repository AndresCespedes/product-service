import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { ApiOperation, ApiResponse, ApiTags, ApiQuery } from '@nestjs/swagger';
import { Product } from './entities/product.entity';
import { ProductResponseDto, ProductsCollectionResponseDto } from './dto/product-response.dto';

@ApiTags('Products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear un nuevo producto' })
  @ApiResponse({
    status: 201,
    description: 'Producto creado correctamente',
    type: ProductResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Error en los datos de entrada' })
  create(@Body() createProductDto: CreateProductDto): Promise<ProductResponseDto> {
    return this.productsService.create(createProductDto);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Obtener todos los productos con paginación' })
  @ApiQuery({
    name: 'page',
    required: false,
    example: 1,
    description: 'Número de página',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    example: 10,
    description: 'Cantidad de productos por página',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de productos',
    type: ProductsCollectionResponseDto,
  })
  findAll(
    @Query('page') page?: number, 
    @Query('limit') limit?: number
  ): Promise<ProductsCollectionResponseDto> {
    return this.productsService.findAll(page, limit);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Obtener un producto por ID' })
  @ApiResponse({
    status: 200,
    description: 'Producto encontrado',
    type: ProductResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Producto no encontrado' })
  findOne(@Param('id') id: number): Promise<ProductResponseDto> {
    return this.productsService.findOne(+id);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Actualizar un producto' })
  @ApiResponse({
    status: 200,
    description: 'Producto actualizado correctamente',
    type: ProductResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Producto no encontrado' })
  update(
    @Param('id') id: number,
    @Body() updateData: Partial<CreateProductDto>,
  ): Promise<ProductResponseDto> {
    return this.productsService.update(+id, updateData);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Eliminar un producto' })
  @ApiResponse({ 
    status: 200, 
    description: 'Producto eliminado correctamente',
    type: ProductResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Producto no encontrado' })
  remove(@Param('id') id: number): Promise<ProductResponseDto> {
    return this.productsService.remove(+id);
  }
}
