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
import { ReservationGateway } from 'src/modules/orders/events/reservations.gateway';
import { OrderStatus } from 'src/modules/orders/enums/order-status.enum';
import { Order } from 'src/modules/orders/entities/order.entity';

export class PayReservationResponse {
  message: string;
  reservation: Reservation;
  order: Order;
}

@Injectable()
export class ReservationsService {
  constructor(
    @InjectRepository(Reservation)
    private readonly reservationRepository: Repository<Reservation>,

    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    private readonly dataSource: DataSource,
    private readonly reservationGateway: ReservationGateway,
  ) {}

  async create(
    userId: number,
    createReservationDto: CreateReservationDto,
  ): Promise<Reservation> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const { productId, quantity } = createReservationDto;

      const existingActive = await queryRunner.manager.findOne(Reservation, {
        where: { userId, status: OrderStatus.PENDING },
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

      const expiresAt = new Date(Date.now() + 20 * 1000);

      const reservation = queryRunner.manager.create(Reservation, {
        userId,
        productId,
        quantity,
        status: OrderStatus.PENDING,
        expiresAt,
      });

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
      where: { userId, status: OrderStatus.PENDING },
    });
    if (!reservation) {
      throw new NotFoundException('Aktiv rezervasiyan yoxdur!');
    }
    return reservation;
  }

  async cancel(userId: number, id: number): Promise<Reservation> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const reservation = await queryRunner.manager.findOne(Reservation, {
        where: { id, userId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!reservation) {
        throw new NotFoundException('Rezervasiya tapılmadı!');
      }

      if (reservation.status !== OrderStatus.PENDING) {
        throw new BadRequestException(
          'Bu Rezervasiya artıq ləğv edilib və ya bitib!',
        );
      }

      reservation.status = 'CANCELLED' as any;
      const updated = await queryRunner.manager.save(Reservation, reservation);

      const product = await queryRunner.manager.findOne(Product, {
        where: { id: reservation.productId },
        lock: { mode: 'pessimistic_write' },
      });

      if (product) {
        product.stock += reservation.quantity;
        await queryRunner.manager.save(Product, product);
      }

      await queryRunner.commitTransaction();
      return updated;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async payReservation(
    id: number,
    userId: number,
  ): Promise<PayReservationResponse> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const reservation = await queryRunner.manager.findOne(Reservation, {
        where: { id, userId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!reservation) {
        throw new NotFoundException('Rezervasiya Tapılmadı!');
      }
      if (reservation.status === OrderStatus.PAID) {
        throw new BadRequestException(
          'Bu rezervasiya artıq ödənilib və sifarişi yaradılıb!',
        );
      }
      if (reservation.status !== OrderStatus.PENDING) {
        throw new BadRequestException('Bu Rezervasiya Artıq Aktiv Deyil!');
      }
      if (
        reservation.expiresAt &&
        new Date() > new Date(reservation.expiresAt)
      ) {
        reservation.status = 'EXPIRED' as any;
        await queryRunner.manager.save(Reservation, reservation);
        throw new BadRequestException('Rezervasiyanın Vaxtı Bitib!');
      }

      reservation.status = OrderStatus.PAID;
      await queryRunner.manager.save(Reservation, reservation);

      const product = await queryRunner.manager.findOne(Product, {
        where: { id: reservation.productId },
      });

      const totalAmount = product
        ? Number(product.price) * reservation.quantity
        : 0;

      const order = queryRunner.manager.create(Order, {
        user: { id: userId } as any,
        status: OrderStatus.PAID,
        totalAmount: totalAmount,
        items: [
          {
            product: { id: reservation.productId },
            productName: product?.name || 'Məhsul',
            price: product ? Number(product.price) : 0,
            quantity: reservation.quantity,
          },
        ] as any,
      });

      const savedOrder = await queryRunner.manager.save(Order, order);
      await queryRunner.commitTransaction();

      const userRoom = `user_${userId}`;
      this.reservationGateway.server.to(userRoom).emit('reservationPaid', {
        message: 'Rezervasiyanız Uğurla Ödənildi və Sifariş Yaradıldı!',
        reservation,
        order: savedOrder,
      });

      return {
        message: 'Rezervasiya Uğurla ödənildi və sifariş yaradıldı!',
        reservation,
        order: savedOrder,
      };
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async handleExpiredReservations() {
    const now = new Date();
    const expiredReservations = await this.reservationRepository.find({
      where: {
        status: 'PENDING' as any,
        expiresAt: LessThan(now),
      },
    });

    for (const reservation of expiredReservations) {
      const queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      try {
        const freshReservation = await queryRunner.manager.findOne(
          Reservation,
          {
            where: { id: reservation.id },
            lock: { mode: 'pessimistic_write' },
          },
        );

        if (
          !freshReservation ||
          freshReservation.status !== OrderStatus.PENDING
        ) {
          await queryRunner.rollbackTransaction();
          continue;
        }

        freshReservation.status = OrderStatus.EXPIRED;
        await queryRunner.manager.save(Reservation, freshReservation);

        const product = await queryRunner.manager.findOne(Product, {
          where: { id: freshReservation.productId },
          lock: { mode: 'pessimistic_write' },
        });

        if (product) {
          product.stock += freshReservation.quantity;
          await queryRunner.manager.save(Product, product);
        }

        await queryRunner.commitTransaction();
      } catch (err) {
        await queryRunner.rollbackTransaction();
      } finally {
        await queryRunner.release();
      }
    }
  }

  async cancelWithoutCheck(id: number): Promise<Reservation> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const reservation = await queryRunner.manager.findOne(Reservation, {
        where: { id },
        lock: { mode: 'pessimistic_write' },
      });
      if (!reservation) {
        throw new NotFoundException('Rezervasiya Tapılmadı!');
      }
      if (reservation.status !== OrderStatus.PENDING) {
        throw new BadRequestException(
          'Bu Rezervasiya artıq ləğv edilib və ya bitib!',
        );
      }
      reservation.status = OrderStatus.CANCELLED;
      const updated = await queryRunner.manager.save(Reservation, reservation);
      const product = await queryRunner.manager.findOne(Product, {
        where: { id: reservation.productId },
        lock: { mode: 'pessimistic_write' },
      });
      if (product) {
        product.stock += reservation.quantity;
        await queryRunner.manager.save(Product, product);
      }
      await queryRunner.commitTransaction();
      return updated;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }
}
