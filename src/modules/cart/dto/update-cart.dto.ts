import { IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
export class UpdateCartDto {
  @ApiProperty({
    example: 3,
    description: 'Səbətdəki Məhsulun Sayı',
    minimum: 1,
  })
  @IsNumber()
  @Min(1)
  quantity!: number;
}
