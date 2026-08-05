import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { Order } from './entities/order.entity';
import { OrderStatus } from './enums/order-status.enum';
import { Product } from '../product/entities/product.entity';

@Injectable()
export class OrderCronService {
  private readonly logger = new Logger(OrderCronService.name);
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  @Cron(CronExpression.EVERY_5_SECONDS)
  async handleUnpaidOrders() {
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);

    const expiredOrders = await this.orderRepository.find({
      where: {
        status: OrderStatus.PENDING,
        createdAt: LessThan(tenMinutesAgo),
      },
      relations: {
        items: {
          product: true,
        },
      },
    });

    for (const order of expiredOrders) {
      order.status = OrderStatus.CANCELLED;
      await this.orderRepository.save(order);

      if (order.items) {
        for (const item of order.items) {
          if (item.product) {
            item.product.stock += item.quantity;
            await this.productRepository.save(item.product);
          }
        }
      }
      this.logger.warn(
        `Sifariş #${order.id} avtomatik ləğv edildi və stok bərpa olundu`,
      );
    }
  }
}
