import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
export class CreateProductDto {
  @IsString({ message: 'Məhsul adı mətn(string) formatında olmalıdır' })
  @IsNotEmpty({ message: 'Məhsul adı boş qala bilməz' })
  name!: string;
  @IsString({ message: 'Açıqlama(descripiton) mətn formatında olmalıdır' })
  @IsOptional()
  description?: string;
  @Type(() => Number)
  @IsNumber({}, { message: 'Qiymət rəqəm olmalıdır.' })
  @Min(0, { message: 'Qiymət 0 dan aşağı ola bilməz!' })
  price!: number;
  @Type(() => Number)
  @IsNumber({}, { message: 'Stok rəqəm olmalıdır.' })
  @Min(0, { message: 'Stok mənfi ola bilməz!' })
  @IsOptional()
  stock?: number;
  @Type(() => Number)
  @IsNumber({}, { message: 'Kateqoriya ID-si rəqəm olmalıdır!' })
  @IsNotEmpty({ message: 'Kateqoriya Id-si mütləq qeyd olunmalıdır!' })
  categoryId!: number;
}
