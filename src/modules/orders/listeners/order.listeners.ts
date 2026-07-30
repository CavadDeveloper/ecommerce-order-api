import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { OrderCreatedEvent, OrderPaidEvent } from '../events/order.events';
@Injectable()
export class OrderListener {
  constructor() {
    console.log('Debug:Order Listener Ugurla Yuklenir');
  }
  @OnEvent('order-created')
  handleOrderCreated(event: OrderCreatedEvent) {
    console.log(
      `Sifariş Yaradıldı OrderId:${event.orderId} UserId:${event.userId} Məbləğ:${event.totalAmount}`,
    );
  }
  @OnEvent('order-paid')
  handleOrderPaid(event: OrderPaidEvent) {
    console.log(
      `Sifariş Ödənildi! OrderId:${event.orderId} UserId:${event.userId}`,
    );
  }
}
