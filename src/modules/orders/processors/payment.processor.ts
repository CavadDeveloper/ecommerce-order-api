import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Logger } from '@nestjs/common';
import { Order } from '../entities/order.entity';
import { OrderStatus } from '../enums/order-status.enum';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { MailService } from 'src/mail/mail.service';
import { OrderPaidEvent } from '../events/order.events';

export interface PaymentResult {
  success: boolean;
  orderId: number;
}
@Processor('payment-queue')
export class PaymentProcessor extends WorkerHost {
  private readonly logger = new Logger(PaymentProcessor.name);
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    private readonly eventEmitter: EventEmitter2,
    private readonly mailService: MailService,
  ) {
    super();
  }
  async process(
    job: Job<{ orderId: number; userId: number }>,
  ): Promise<PaymentResult> {
    const { orderId, userId } = job.data;
    this.logger.log(`Sifariş #${orderId} üçün ödəniş simulyasiyası başladı...`);

    await new Promise((resolve) => setTimeout(resolve, 3000));

    const success = Math.random() < 0.8;
    if (!success) {
      this.logger.warn(`Sifariş #${orderId} üçün ödəniş uğursuz oldu.`);
      throw new Error('Ödəniş Bank Tərəfindən Rədd Edildi!');
    }

    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: { user: true, address: true },
    });

    this.logger.log('TAPILAN ORDER VƏ ÜNVAN:', order);

    if (order && order.status === OrderStatus.PENDING) {
      order.status = OrderStatus.PAID;
      await this.orderRepository.save(order);
      this.logger.log(`Sifariş #${orderId} uğurla ödənildi.`);
    }

    if (order?.user && order.user.email) {
      const fullAddress = order.address
        ? `${order.address.addressLine}, ${order.address.city}`
        : 'Göstərilməyib';

      await this.mailService.sendOrderConfirmation(order.user.email, {
        orderId: orderId,
        items: [
          {
            productName: 'Səbətdəki Ümumi Məhsullar',
            quantity: 1,
            price: order.totalAmount || 0,
          },
        ],
        total: order.totalAmount || 0,
        address: fullAddress,
      });
    }

    if (order) {
      try {
        this.eventEmitter.emit(
          'order-paid',
          new OrderPaidEvent(order.id, userId),
        );
      } catch (emailError) {
        this.logger.log(
          `E-poçt göndərilərkən xəta baş verdi, lakin ödənişə təsir etmir:`,
          emailError,
        );
      }
    }
    return { success: true, orderId };
  }
}
