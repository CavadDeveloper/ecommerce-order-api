import { IsNotEmpty, IsString, IsOptional } from 'class-validator';
export class CreateAddressDto {
  @IsString()
  @IsNotEmpty({ message: 'Başlıq(ev iş ünvanı və s) Boş Ola Bilməz!' })
  title!: string;
  @IsString()
  @IsNotEmpty({ message: 'Address Line Boş Ola Bilməz!' })
  addressLine!: string;
  @IsString()
  @IsNotEmpty({ message: 'Şəhər boş ola bilməz!' })
  city!: string;
  @IsString()
  @IsOptional()
  country?: string;
}
