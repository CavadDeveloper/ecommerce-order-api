import {
  Controller,
  Get,
  Param,
  Delete,
  Body,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ReservationsService } from './reservations.service';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { ApiBearerAuth } from '@nestjs/swagger';
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('reservations')
export class ReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}

  @Post()
  create(
    @CurrentUser() user: any,
    @Body() createReservationDto: CreateReservationDto,
  ) {
    console.log('TOKENDEN GELEN USER', user);
    return this.reservationsService.create(user.userId, createReservationDto);
  }

  @Post(':id/pay')
  async pay(@Param('id') id: number, @CurrentUser() user: any) {
    return this.reservationsService.payReservation(Number(id), user.userId);
  }
  @Get('my-reservations')
  findActiveByUser(@CurrentUser() user: any) {
    return this.reservationsService.findActiveByUser(Number(user.userId));
  }

  @Delete(':id/cancel')
  cancel(@Param('id') id: number, @CurrentUser() user: any) {
    return this.reservationsService.cancel(Number(id), user.userId);
  }
}
