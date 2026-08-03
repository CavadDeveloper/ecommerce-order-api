import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
export class CreateUserDto {
  @IsEmail({}, { message: 'Düzgün mail ünvanını qeyd edin!' })
  @IsNotEmpty({ message: 'Mail ünvanı boş ola bilməz!' })
  email!: string;
  @IsString()
  @IsNotEmpty({ message: 'Şifrə Boş ola bilməz!' })
  @MinLength(6, { message: 'Şifrə 6 simvoldan az olmamalıdı!' })
  password!: string;
  @IsOptional()
  @IsString()
  role?: string;
}
