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

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    console.log(`Klient qoşuldu: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Klient ayrıldı: ${client.id}`);
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
