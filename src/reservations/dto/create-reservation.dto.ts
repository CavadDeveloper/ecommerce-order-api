import { IsNotEmpty, IsNumber, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateReservationDto {
  @ApiProperty({ example: 1, description: 'İstifadəçi ID-si' })
  @IsNumber()
  @IsNotEmpty()
  userId!: number;

  @ApiProperty({ example: { productId: 1, quantity: 2 } })
  @IsObject()
  @IsNotEmpty()
  details: any;
}
