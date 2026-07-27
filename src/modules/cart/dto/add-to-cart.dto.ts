import { IsNotEmpty, Min, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
export class AddToCartDto {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Səbətə Əlavə Ediləcək Məhsulun İD-si',
  })
  @IsNumber()
  @IsNotEmpty()
  productId!: string;
  @ApiProperty({
    example: 1,
    description: 'Məhsulun sayı',
    minimum: 1,
  })
  @IsNumber()
  @Min(1)
  quantity!: number;
}
