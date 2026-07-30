import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrderService } from './orders.service';
import { OrdersController } from './orders.controller';
import { OrderCronService } from './order-cron.service';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { OrderListener } from './listeners/order.listeners';
import { Product } from '../product/entities/product.entity';
import { Cart } from '../cart/entities/cart.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Cart, Order, OrderItem, Product])],
  controllers: [OrdersController],
  providers: [OrderService, OrderListener, OrderCronService],
  exports: [OrderService],
})
export class OrdersModule {}
