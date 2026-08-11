import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Reservation } from './reservations.entity';
import { CreateReservationDto } from './dto/create-reservation.dto';

@Injectable()
export class ReservationsService {
  constructor(
    @InjectRepository(Reservation)
    private readonly reservationRepository: Repository<Reservation>,
  ) {}

  async create(
    createReservationDto: CreateReservationDto,
  ): Promise<Reservation> {
    const reservation = this.reservationRepository.create({
      ...createReservationDto,
      status: 'Pending',
    });
    return await this.reservationRepository.save(reservation);
  }

  async findActiveByUser(userId: number): Promise<Reservation> {
    const reservation = await this.reservationRepository.findOne({
      where: { userId, status: 'Pending' },
    });
    if (!reservation) {
      throw new NotFoundException('Active rezervasiyası yoxdur bu userin!');
    }
    return reservation;
  }

  async cancel(id: number): Promise<Reservation> {
    const reservation = await this.reservationRepository.findOne({
      where: { id },
    });

    if (!reservation) {
      throw new NotFoundException('Reservasiya tapılmadı!');
    }

    reservation.status = 'CANCELLED';
    return await this.reservationRepository.save(reservation);
  }
}
