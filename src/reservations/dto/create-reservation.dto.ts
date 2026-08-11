import { IsNotEmpty, IsObject, IsString } from 'class-validator';
export class CreateReservationDto {
  @IsString()
  @IsNotEmpty()
  userId!: string;
  @IsObject()
  @IsNotEmpty()
  details!: any;
}
