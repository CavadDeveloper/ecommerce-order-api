import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Order } from './entities/order.entity';
import { InjectQueue } from '@nestjs/bullmq';
import { Cart } from '../cart/entities/cart.entity';
import { Product } from '../product/entities/product.entity';
import { OrderItem } from './entities/order-item.entity';
import { OrderStatus } from './enums/order-status.enum';
import { OrderCreatedEvent } from './events/order.events';
import { Address } from '../address/entities/address.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { Queue } from 'bullmq';
import { IdempotencyKeyEntity } from './entities/idempotency.entity';
export interface PayOrderResponse {
  message: string;
  orderId: number;
  result?: any;
}
@Injectable()
export class OrderService {
  private readonly idempotentyCache = new Map<string, any>();
  private readonly logger = new Logger(OrderService.name);
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(IdempotencyKeyEntity)
    private readonly idempotencyRepository: Repository<IdempotencyKeyEntity>,
    private readonly dataSource: DataSource,
    private readonly eventEmitter: EventEmitter2,
    @InjectQueue('payment-queue') private readonly paymentQueue: Queue,
    @InjectQueue('email-queue') private readonly emailQueue: Queue,
  ) {}

  async checkout(
    userId: number,
    createOrderDto: CreateOrderDto,
  ): Promise<Order> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const cart = await queryRunner.manager.findOne(Cart, {
        where: { user: { id: userId } },
        relations: { items: { product: true } },
      });

      if (!cart || cart.items.length === 0) {
        throw new BadRequestException('Səbətdə heç bir məhsul yoxdur.');
      }

      let totalAmount = 0;
      const orderItems: OrderItem[] = [];
      for (const item of cart.items) {
        const product = await queryRunner.manager.findOne(Product, {
          where: { id: item.product.id },
          lock: { mode: 'pessimistic_write' },
        });
        if (!product || product.stock < item.quantity) {
          throw new BadRequestException(
            `"${item.product.name}" üçün kifayət qədər stok yoxdur. Mövcud stok: ${product?.stock ?? 0}`,
          );
        }
        product.stock -= item.quantity;
        await queryRunner.manager.save(Product, product);
        const lineTotal = Number(product.price) * item.quantity;
        totalAmount += lineTotal;

        const orderItem = queryRunner.manager.create(OrderItem, {
          productName: product.name,
          price: Number(product.price),
          quantity: item.quantity,
          product: product,
        });

        orderItems.push(orderItem);
      }
      const address = queryRunner.manager.create(Address, {
        ...createOrderDto.address,
        user: { id: userId },
      });
      const savedAddress = await queryRunner.manager.save(Address, address);
      const order = queryRunner.manager.create(Order, {
        user: { id: userId },
        address: savedAddress,
        status: OrderStatus.PENDING,
        totalAmount: Number(totalAmount.toFixed(2)),
        items: orderItems,
      });

      const savedOrder = await queryRunner.manager.save(Order, order);
      await queryRunner.manager.delete('cart_items', { cart: { id: cart.id } });
      await queryRunner.commitTransaction();
      this.eventEmitter.emit(
        'order-created',
        new OrderCreatedEvent(savedOrder.id, userId, savedOrder.totalAmount),
      );
      return savedOrder;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }
  async sendOrderConfirmationEmailJob(orderId: number, userEmail: string) {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: {
        items: { product: true },
        address: true,
      },
    });

    if (!order) return;

    const orderDetails = {
      orderId: order.id,
      items: order.items.map((item) => ({
        productName: item.productName,
        quantity: item.quantity,
        price: item.price,
      })),
      total: order.totalAmount,
      address: order.address ? `${order.address.city},` : 'Qeyd olunmayıb',
    };

    await this.emailQueue.add(
      'send-confirmation',
      {
        email: userEmail,
        orderDetails,
      },
      {
        attempts: 5,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
        removeOnComplete: true,
      },
    );
  }

  async payOrder(
    userId: number,
    orderId: number,
    idempotencyKey?: string,
  ): Promise<PayOrderResponse> {
    if (idempotencyKey) {
      const existingKey = await this.idempotencyRepository.findOne({
        where: { key: idempotencyKey },
      });

      if (existingKey) {
        return {
          message:
            'Bu ödəniş əməliyyatı artıq icra edilib (Idempotency-Key təkrarlandı).',
          orderId,
          result: existingKey.response,
        };
      }
    }

    const order = await this.orderRepository.findOne({
      where: { id: orderId, user: { id: userId } },
      relations: { user: true },
    });

    if (!order) {
      throw new NotFoundException('Sifariş Tapılmadı!.');
    }

    if (order.status !== OrderStatus.PENDING) {
      throw new ConflictException(
        `Yalnız PENDING statusunda olan sifarişlər ödənilə bilər. Cari status: ${order.status}`,
      );
    }

    await this.paymentQueue.add(
      'process-payment',
      {
        orderId,
        userId,
      },
      {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      },
    );

    const responsePayload = {
      message: 'Ödəniş sorğusu növbəyə qəbul edildi, arxa fonda emal olunur.',
      orderId,
    };

    if (idempotencyKey) {
      await this.idempotencyRepository.save({
        key: idempotencyKey,
        response: responsePayload,
      });
    }

    return responsePayload;
  }

  async cancelOrder(userId: number, orderId: number): Promise<Order> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const order = await queryRunner.manager.findOne(Order, {
        where: { user: { id: userId }, id: orderId },
        relations: { items: { product: true } },
      });
      if (!order) {
        throw new NotFoundException('Sifariş Tapılmadı.');
      }
      if (order.status !== OrderStatus.PENDING) {
        throw new ConflictException(
          `Yalnız PENDING statusundakı sifarişlər ləğv edilə bilər. Cari status: ${order.status}`,
        );
      }
      order.status = OrderStatus.CANCELLED;
      const updateOrder = await queryRunner.manager.save(Order, order);
      await queryRunner.commitTransaction();
      return updateOrder;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      this.logger.error('CHECKOUT ERROR:', err);
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async getUserOrders(userId: number): Promise<Order[]> {
    return this.orderRepository.find({
      where: { user: { id: userId } },
      relations: {
        address: true,
      },
      order: { createdAt: 'DESC' },
    });
  }

  async getOrderById(userId: number, orderId: number): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId, user: { id: userId } },
      relations: {
        items: true,
        address: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Sifariş Tapılmadı.');
    }

    return order;
  }
}
