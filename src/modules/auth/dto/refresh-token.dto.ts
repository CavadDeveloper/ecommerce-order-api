import { IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RefreshTokenDto {
  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  userId!: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  refreshToken!: string;
}
