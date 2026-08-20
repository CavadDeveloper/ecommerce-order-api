import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReservationsController } from './reservations.controller';
import { ReservationsService } from './reservations.service';
import { Reservation } from './reservations.entity';
import { ProductModule } from 'src/modules/product/product.module';
import { OrdersModule } from 'src/modules/orders/orders.module';
import { ReservationGateway } from 'src/modules/orders/events/reservations.gateway';

@Module({
  imports: [
    TypeOrmModule.forFeature([Reservation]),
    ProductModule,
    forwardRef(() => OrdersModule),
  ],
  controllers: [ReservationsController],
  providers: [ReservationsService, ReservationGateway],
})
export class ReservationsModule {}
