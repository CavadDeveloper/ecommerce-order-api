import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { OrderService } from './orders.service';
import { OrdersController } from './orders.controller';
import { OrderCronService } from './order-cron.service';
import { PaymentProcessor } from './processors/payment.processor';
import { MailModule } from 'src/mail/mail.module';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { OrderListener } from './listeners/order.listeners';
import { Product } from '../product/entities/product.entity';
import { Cart } from '../cart/entities/cart.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Cart, Order, OrderItem, Product]),
    BullModule.registerQueue({
      name: 'payment-queue',
    }),
    MailModule,
  ],
  controllers: [OrdersController],
  providers: [OrderService, OrderListener, OrderCronService, PaymentProcessor],
  exports: [OrderService],
})
export class OrdersModule {}
