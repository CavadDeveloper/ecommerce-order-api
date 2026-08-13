import { IsNumber } from 'class-validator';

export class PayReservationDto {
  @IsNumber()
  userId!: number;
}
