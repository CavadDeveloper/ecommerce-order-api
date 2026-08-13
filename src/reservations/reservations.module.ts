import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReservationsController } from './reservations.controller';
import { ReservationsService } from './reservations.service';
import { Reservation } from './reservations.entity';
import { ProductModule } from 'src/modules/product/product.module';

@Module({
  imports: [TypeOrmModule.forFeature([Reservation]), ProductModule],
  controllers: [ReservationsController],
  providers: [ReservationsService],
})
export class ReservationsModule {}
