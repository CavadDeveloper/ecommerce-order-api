import { IsEmail, IsString } from 'class-validator';
export class LoginDto {
  @IsEmail({}, { message: 'Düzgün Email Daxil Edin' })
  email!: string;
  @IsString()
  password!: string;
}
