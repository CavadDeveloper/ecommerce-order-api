import { Controller, Get, Param, Delete, Body, Post } from '@nestjs/common';
import { ReservationsService } from './reservations.service';
import { CreateReservationDto } from './dto/create-reservation.dto';

@Controller('reservations')
export class ReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}
  @Post()
  create(@Body() createReservationDto: CreateReservationDto) {
    return this.reservationsService.create(createReservationDto);
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
