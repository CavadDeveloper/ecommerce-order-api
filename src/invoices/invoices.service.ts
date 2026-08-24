import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from 'src/modules/orders/entities/order.entity';
import { FilesService } from 'src/files/files.service';
import { FilePurpose } from 'src/files/file-purpose.enum';
import * as fs from 'fs/promises';

export interface InvoiceResult {
  filename: string;
  content: string;
}

@Injectable()
export class InvoicesService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    private readonly filesService: FilesService,
  ) {}

  async downloadInvoice(orderId: number): Promise<InvoiceResult> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: { user: true },
    });

    if (!order) {
      throw new NotFoundException('Sifarişin fakturası tapılmadı!');
    }

    const invoiceContent = `========================================
           RƏSMİ FAKTURA / INVOICE
========================================
Sifariş ID: ${order.id}
Tarix: ${new Date().toISOString()}
Müştəri ID: ${order.user ? order.user.id : 'N/A'}
Müştəri Email: ${order.user ? order.user.email : 'N/A'}
Status: ÖDƏNİLİB / SUCCESS
========================================
Təşəkkür edirik!`;

    const buffer = Buffer.from(invoiceContent, 'utf-8');
    const filename = `invoice-order-${order.id}-${Date.now()}.txt`;

    const fileObject = {
      originalname: filename,
      mimetype: 'text/plain',
      size: buffer.length,
      buffer: buffer,
    };

    const userId = order.user ? Number(order.user.id) : 1;

    const savedFile = await this.filesService.uploadFile(
      fileObject,
      FilePurpose.INVOICE,
      userId,
    );
    const fileContent = await fs.readFile(savedFile.path, 'utf-8');

    return {
      filename: savedFile.originalname,
      content: fileContent,
    };
  }

  async validateAndGetInvoice(
    orderId: string | number,
    user: { userId: number; role: string },
  ): Promise<InvoiceResult> {
    const numericOrderId = Number(orderId);

    const order = await this.orderRepository.findOne({
      where: { id: numericOrderId },
      relations: { user: true },
    });

    if (!order || !order.user) {
      throw new NotFoundException('Sifariş və ya istifadəçi tapılmadı!');
    }

    const orderUserId = Number(order.user.id);
    if (user && user.role !== 'ADMIN' && orderUserId !== Number(user.userId)) {
      throw new ForbiddenException('Bu fakturanı endirməyə icazəniz yoxdur.');
    }

    return await this.downloadInvoice(numericOrderId);
  }
}
