import {
  IsEmail,
  IsString,
  MinLength,
  IsEnum,
  IsOptional,
} from 'class-validator';
import { UserRole } from '../../user/entities/user.entity';
export class RegisterDto {
  @IsEmail({}, { message: 'Düzgün Email Daxil Edin' })
  email!: string;
  @IsString()
  @MinLength(6, { message: 'Şifrə ən azı 6 simvoldan ibarət olmalıdır!' })
  password!: string;
  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;
}
