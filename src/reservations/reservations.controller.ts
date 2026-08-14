import { Controller, Get, Param, Delete, Body, Post } from '@nestjs/common';
import { ReservationsService } from './reservations.service';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { PayReservationDto } from './dto/pay-reservation.dto';

@Controller('reservations')
export class ReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}

  @Post()
  create(@Body() createReservationDto: CreateReservationDto) {
    return this.reservationsService.create(createReservationDto);
  }

  @Post(':id/pay')
  async pay(
    @Param('id') id: number,
    @Body() payReservationDto: PayReservationDto,
  ) {
    return this.reservationsService.payReservation(
      id,
      payReservationDto.userId,
    );
  }

  @Get('user/:userId')
  findActiveByUser(@Param('userId') userId: number) {
    return this.reservationsService.findActiveByUser(userId);
  }

  @Delete(':id/cancel')
  cancel(@Param('id') id: number) {
    return this.reservationsService.cancel(id);
  }
}
