import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, LessThan } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Reservation } from './reservations.entity';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { Product } from 'src/modules/product/entities/product.entity';

@Injectable()
export class ReservationsService {
  constructor(
    @InjectRepository(Reservation)
    private readonly reservationRepository: Repository<Reservation>,

    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    private readonly dataSource: DataSource,
  ) {}

  async create(
    createReservationDto: CreateReservationDto,
  ): Promise<Reservation> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const dto = createReservationDto as Record<string, any>;
      const userId: number = Number(dto.userId);
      const productId: number = Number(dto.productId ?? dto.details?.productId);
      const quantity: number = Number(
        dto.quantity ?? dto.details?.quantity ?? 1,
      );

      const existingActive = await queryRunner.manager.findOne(Reservation, {
        where: { userId, status: 'Pending' },
      });
      if (existingActive) {
        throw new NotFoundException('Sənin Artıq Aktiv Rezervasiyan Var!');
      }

      const product = await queryRunner.manager.findOne(Product, {
        where: { id: productId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!product) {
        throw new NotFoundException('Məhsul Tapılmadı!');
      }
      if (product.stock < quantity) {
        throw new NotFoundException('Anbarda o qədər stok yoxdur!');
      }

      product.stock -= quantity;
      await queryRunner.manager.save(product);

      const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

      const reservation = queryRunner.manager.create(Reservation, {
        userId,
        productId,
        quantity,
        status: 'Pending',
        expiresAt,
      } as Partial<Reservation>);

      const savedReservation = await queryRunner.manager.save(reservation);
      await queryRunner.commitTransaction();
      return savedReservation;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async findActiveByUser(userId: number): Promise<Reservation> {
    const reservation = await this.reservationRepository.findOne({
      where: { userId: Number(userId), status: 'Pending' },
    });
    if (!reservation) {
      throw new NotFoundException('Active rezervasiyası yoxdur bu userin!');
    }
    return reservation;
  }

  async cancel(id: number): Promise<Reservation> {
    const reservation = await this.reservationRepository.findOne({
      where: { id: Number(id) },
    });

    if (!reservation) {
      throw new NotFoundException('Reservasiya tapılmadı!');
    }

    reservation.status = 'CANCELLED';
    const updated = await this.reservationRepository.save(reservation);

    const resAny = reservation as Record<string, any>;
    const product = await this.productRepository.findOne({
      where: { id: resAny.productId },
    });
    if (product) {
      product.stock += resAny.quantity ?? 1;
      await this.productRepository.save(product);
    }
    return updated;
  }

  async payReservation(id: number, userId: number): Promise<Reservation> {
    const reservation = await this.reservationRepository.findOne({
      where: { id: Number(id), userId: Number(userId) },
    });
    if (!reservation) {
      throw new NotFoundException('Rezervasiya Tapılmadı');
    }
    if (reservation.status !== 'Pending') {
      throw new NotFoundException('Bu Rezervasiya Artiq Aktiv Deyil!');
    }

    const resExpiresAt = (reservation as Record<string, any>).expiresAt;
    if (resExpiresAt && new Date() > new Date(resExpiresAt)) {
      reservation.status = 'EXPIRED';
      await this.reservationRepository.save(reservation);
      throw new BadRequestException('Rezervasiyanın Vaxtı Bitib!');
    }

    reservation.status = 'PAID';
    return await this.reservationRepository.save(reservation);
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async handleExpiredReservations() {
    const now = new Date();
    const expiredReservations = await this.reservationRepository.find({
      where: {
        status: 'Pending',
        expiresAt: LessThan(now) as any,
      },
    });
    for (const reservation of expiredReservations) {
      reservation.status = 'EXPIRED';
      await this.reservationRepository.save(reservation);

      const resAny = reservation as Record<string, any>;
      const product = await this.productRepository.findOne({
        where: { id: resAny.productId },
      });
      if (product) {
        product.stock += resAny.quantity ?? 1;
        await this.productRepository.save(product);
      }
    }
  }
}
