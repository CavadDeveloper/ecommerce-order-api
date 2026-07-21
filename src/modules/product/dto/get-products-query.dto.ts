import {
  IsOptional,
  IsString,
  IsNumber,
  Min,
  IsIn,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
export class GetProductsQueryDto {
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @IsOptional()
  page?: number = 1;
  @Type(() => Number)
  @IsNumber()
  @Min(10)
  @IsOptional()
  limit?: number = 10;
  @IsString()
  @IsOptional()
  search?: string;
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  categoryId?: number;
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  minPrice?: number;
  @Type(() => Number)
  @IsNumber()
  @Max(0)
  @IsOptional()
  maxPrice?: number;
  @IsString()
  @IsOptional()
  @IsIn(['price', 'createdAt', 'name'])
  sortBy?: string;
  @IsString()
  @IsOptional()
  @IsIn(['ASC', 'DESC', 'asc', 'desc'])
  sortOrder?: 'ASC' | 'DESC' | 'asc' | 'desc' = 'DESC';
}
