import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { Order } from './entities/order.entity';
import { OrderStatus } from './enums/order-status.enum';

@Injectable()
export class OrderCronService {
  private readonly logger = new Logger(OrderCronService.name);
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
  ) {}

  @Cron(CronExpression.EVERY_5_SECONDS)
  async handleUnpaidOrders() {
    const fiveMinutesAgo = new Date(Date.now() - 20 * 1000);

    const expiredOrders = await this.orderRepository.find({
      where: {
        status: OrderStatus.PENDING,
        createdAt: LessThan(fiveMinutesAgo),
      },
    });

    for (const order of expiredOrders) {
      order.status = OrderStatus.CANCELLED;
      await this.orderRepository.save(order);
      this.logger.warn(`Sifariş #${order.id} avtomatik ləğv edildi`);
    }
  }
}
