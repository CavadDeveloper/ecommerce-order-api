import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from 'src/modules/orders/entities/order.entity';

@Injectable()
export class InvoicesService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
  ) {}

  async downloadInvoice(orderId: string): Promise<string> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId as any },
    });

    if (!order) {
      throw new NotFoundException('Sifarişin fakturası tapılmadı!');
    }

    return `Sifarişin Qəbzi: ${orderId}`;
  }
}
