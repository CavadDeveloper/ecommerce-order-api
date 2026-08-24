import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { OnEvent } from '@nestjs/event-emitter';
import {
  OrderCreatedEvent,
  OrderDeliveredEvent,
  OrderPaidEvent,
  OrderShippedEvent,
} from 'src/modules/orders/events/order.events';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(EventsGateway.name);

  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    this.logger.log(`Klient qoşuldu: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Klient ayrıldı: ${client.id}`);
  }

  @OnEvent('order-created')
  handleOrderCreated(event: OrderCreatedEvent) {
    this.server.emit('orderCreated', event);
  }

  @OnEvent('order-paid')
  handleOrderPaid(event: OrderPaidEvent) {
    this.server.emit('orderPaid', event);
  }

  @OnEvent('order-shipped')
  handleOrderShipped(event: OrderShippedEvent) {
    this.server.emit('orderShipped', event);
  }

  @OnEvent('order-delivered')
  handleOrderDelivered(event: OrderDeliveredEvent) {
    this.server.emit('orderDelivered', event);
  }
}
