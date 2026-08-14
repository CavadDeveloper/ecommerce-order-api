import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
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
      relations: { user: true } as any,
    });
    if (!order) {
      throw new NotFoundException('Sifarişin fakturası tapılmadı!');
    }

    return `Sifarişin Qəbzi: ${orderId}`;
  }
  async validateAndGetInvoice(
    orderId: string,
    user: { userId: number; role: string },
  ): Promise<string> {
    const order = await this.orderRepository.findOne({
      where: { id: Number(orderId) as any },
      relations: { user: true } as any,
    });

    if (!order || !order.user) {
      throw new NotFoundException('Sifariş və ya istifadəçi tapılmadı!');
    }

    const orderUserId = Number(order.user.id);
    if (user && user.role !== 'ADMIN' && orderUserId !== Number(user.userId)) {
      throw new ForbiddenException('Bu fakturanı endirməyə icazəniz yoxdur.');
    }
    return await this.downloadInvoice(orderId);
  }
}
