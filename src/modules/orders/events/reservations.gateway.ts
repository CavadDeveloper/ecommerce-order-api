import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import * as jwt from 'jsonwebtoken';
@WebSocketGateway({ cors: { origin: '*' } })
export class ReservationGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(ReservationGateway.name);

  @WebSocketServer()
  server: Server;
  handleConnection(client: Socket) {
    try {
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.split(' ')[1];
      if (!token) {
        client.disconnect();
        return;
      }
      const payload: any = jwt.verify(
        token,
        process.env.JWT_SECRET || 'secretKey',
      );
      const userId = payload.userId;
      const userRoom = `user_${userId}`;
      client.join(userRoom);
      this.logger.log(`İstifadəçi qoşuldu və otağa əlavə olundu:${userRoom}`);
    } catch (err) {
      client.disconnect();
    }
  }
  handleDisconnect(client: Socket) {
    this.logger.log(`İstifadəçi ayrıldı: ${client.id}`);
  }
}
