import { IsNotEmpty, IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateReservationDto {
  @ApiProperty({ example: 1, description: 'İstifadəçi ID-si' })
  @IsNumber()
  @IsNotEmpty()
  userId!: number;

  @ApiProperty({ example: 1, description: 'Məhsul ID-si' })
  @IsNumber()
  @IsNotEmpty()
  productId!: number;

  @ApiProperty({ example: 1, description: 'Məhsul miqdarı' })
  @IsNumber()
  @Min(1)
  @IsNotEmpty()
  quantity!: number;
}
