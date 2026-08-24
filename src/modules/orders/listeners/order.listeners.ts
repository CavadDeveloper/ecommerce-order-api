import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
  OrderCreatedEvent,
  OrderPaidEvent,
  OrderShippedEvent,
  OrderDeliveredEvent,
} from '../events/order.events';
import { Logger } from '@nestjs/common';
@Injectable()
export class OrderListener {
  private readonly logger = new Logger(OrderListener.name);
  constructor() {
    this.logger.log('Debug:Order Listener Ugurla Yuklenir');
  }
  @OnEvent('order-created')
  handleOrderCreated(event: OrderCreatedEvent) {
    this.logger.log(
      `Sifariş Yaradıldı OrderId:${event.orderId} UserId:${event.userId} Məbləğ:${event.totalAmount}`,
    );
  }
  @OnEvent('order-paid')
  handleOrderPaid(event: OrderPaidEvent) {
    this.logger.log(
      `Sifariş Ödənildi! OrderId:${event.orderId} UserId:${event.userId}`,
    );
  }
  @OnEvent('order-shipped')
  handleOrderShipped(event: OrderShippedEvent) {
    this.logger.log(
      `Sifariş Yola Düşdü! OrderId:${event.orderId} UserId:${event.userId}`,
    );
  }
  @OnEvent('order-delivered')
  handleOrderDelivered(event: OrderDeliveredEvent) {
    this.logger.log(
      `Sifariş Çatdırıldı! OrderId:${event.orderId} UserId:${event.userId}`,
    );
  }
}
