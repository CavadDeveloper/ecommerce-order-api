import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { Order } from './entities/order.entity';
import { OrderStatus } from './enums/order-status.enum';
import { OrderService } from './orders.service';
@Injectable()
export class OrderCronService {
  private readonly logger = new Logger(OrderCronService.name);
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    private readonly orderService: OrderService,
  ) {}
  @Cron(CronExpression.EVERY_5_MINUTES)
  async handleUnpaidOrders() {
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    const expiredOrders = await this.orderRepository.find({
      where: {
        status: OrderStatus.PENDING,
        createdAt: LessThan(thirtyMinutesAgo),
      },
      relations: { user: true },
    });
    for (const order of expiredOrders) {
      await this.orderService.cancelOrder(order.user.id, order.id);
      this.logger.warn(`Sifariş #${order.id} avtomatik ləğv edildi`);
    }
  }
}
