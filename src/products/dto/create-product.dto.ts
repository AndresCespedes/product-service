import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, IsString, Min } from "class-validator";

export class CreateProductDto {
    @IsString()
    @IsNotEmpty()
    @ApiProperty({ example: 'Laptop', description: 'Nombre del producto' })
    name: string;

    @IsNumber()
    @IsNotEmpty()
    @Min(0)
    @ApiProperty({ example: 1200.99, description: 'Precio del producto' })
    price: number;
}
