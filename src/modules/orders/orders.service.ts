import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Order } from './entities/order.entity';
import { Cart } from '../cart/entities/cart.entity';
import { Product } from '../product/entities/product.entity';
import { OrderItem } from './entities/order-item.entity';
import { OrderStatus } from './enums/order-status.enum';
import {
  OrderCreatedEvent,
  OrderDeliveredEvent,
  OrderPaidEvent,
  OrderShippedEvent,
} from './events/order.events';
import { Address } from '../address/entities/address.entity';
import { CreateOrderDto } from './dto/create-order.dto';
@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    private readonly dataSource: DataSource,
    private readonly eventEmitter: EventEmitter2,
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
  private scheduleStatusUpdates(orderId: number) {
    const delay = 5 * 1000;

    setTimeout(() => {
      (async () => {
        const order = await this.orderRepository.findOne({
          where: { id: orderId },
          relations: { user: true },
        });
        if (order && order.status === OrderStatus.PAID) {
          order.status = OrderStatus.SHIPPED;
          await this.orderRepository.save(order);
          this.eventEmitter.emit(
            'order-shipped',
            new OrderShippedEvent(order.id, order.user.id),
          );
          setTimeout(() => {
            (async () => {
              const shippedOrder = await this.orderRepository.findOne({
                where: { id: orderId },
                relations: { user: true },
              });
              if (shippedOrder && shippedOrder.status === OrderStatus.SHIPPED) {
                shippedOrder.status = OrderStatus.DELIVERED;
                await this.orderRepository.save(shippedOrder);
                this.eventEmitter.emit(
                  'order-delivered',
                  new OrderDeliveredEvent(order.id, order.user.id),
                );
              }
            })();
          }, delay);
        }
      })();
    }, delay);
  }
  async payOrder(userId: number, orderId: number): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId, user: { id: userId } },
    });
    if (!order) {
      throw new NotFoundException('Sifariş Tapılmadı!.');
    }
    if (order.status !== OrderStatus.PENDING) {
      throw new ConflictException(
        `Yalnız PENDING statusunda olan sifarişlər ödənilə bilər. Cari status: ${order.status}`,
      );
    }
    order.status = OrderStatus.PAID;
    const savedOrder = await this.orderRepository.save(order);
    this.scheduleStatusUpdates(savedOrder.id);
    this.eventEmitter.emit('order-paid', new OrderPaidEvent(order.id, userId));
    return this.orderRepository.save(order);
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
      console.log('CHECKOUT ERROR:', err);
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
