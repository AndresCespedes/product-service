import { Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { LoggerService } from '../common/logger/logger.service';

@Module({
  imports: [TypeOrmModule.forFeature([Product])],
  controllers: [ProductsController],
  providers: [
    ProductsService,
    {
      provide: LoggerService,
      useFactory: () => new LoggerService('ProductsService'),
    },
  ],
  exports: [TypeOrmModule],
})
export class ProductsModule {}
