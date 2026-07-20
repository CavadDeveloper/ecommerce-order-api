import { IsString, IsNotEmpty, IsOptional, IsNumber } from 'class-validator';
export class CreateCategoryDto {
  @IsString({
    message: 'Kateqoriya adı mütləq mətn(string) formatında olmalıdır.',
  })
  @IsNotEmpty({ message: 'Kateqoriya adını boş qoymaq olmaz!' })
  name!: string;
  @IsString({ message: 'Açıqlama mətn(string)formatında yazılmalıdır.' })
  @IsOptional()
  description?: string;
  @IsNumber({}, { message: 'Parent kateqoriya ID-si rəqəm(number) olmalıdır' })
  @IsOptional()
  parentId?: number;
}
