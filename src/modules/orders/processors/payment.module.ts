import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { MailModule } from 'src/mail/mail.module';
import { PaymentProcessor } from './payment.processor';
import { Order } from '../entities/order.entity';
@Module({
  imports: [
    TypeOrmModule.forFeature([Order]),
    BullModule.registerQueue({ name: 'payment-queue' }),
    MailModule,
  ],
  providers: [PaymentProcessor],
})
export class PaymentModule {}
