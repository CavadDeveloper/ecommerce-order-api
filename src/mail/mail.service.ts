import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

export interface OrderMailItem {
  productName: string;
  quantity: number;
  price: number;
}
export interface MailOrderDetails {
  orderId: number;
  items: OrderMailItem[];
  total: number;
  address: string;
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private readonly configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('MAIL_HOST', 'localhost'),
      port: this.configService.get<number>('MAIL_PORT', 1025),
      ignoreTLS: true,
    });
  }

  async sendOrderConfirmation(
    email: string,
    orderDetails: MailOrderDetails,
  ): Promise<void> {
    const { orderId, items, total, address } = orderDetails;
    const itemsHtml = items
      .map(
        (item) =>
          `<li>${item.productName} - ${item.quantity} ədəd x ${item.price} AZN</li>`,
      )
      .join('');

    const senderEmail = this.configService.get<string>(
      'MAIL_FROM',
      '"Shop Admin" <noreply@shop.com>',
    );

    try {
      await this.transporter.sendMail({
        from: senderEmail,
        to: email,
        subject: `Sifariş Təsdiqi - #${orderId}`,
        html: `
          <h1>Sifarişiniz qəbul olundu!</h1>
          <p>Sifariş nömrəsi: <strong>${orderId}</strong></p>
          <p><strong>Məhsullar:</strong></p>
          <ul>
            ${itemsHtml}
          </ul>
          <p>Ümumi məbləğ: <strong>${total} AZN</strong></p>
          <p>Çatdırılma ünvanı: ${address}</p>
        `,
      });
      this.logger.log(`E-poçt uğurla göndərildi: ${email}`);
    } catch (error) {
      this.logger.error('E-poçt göndərilərkən xəta baş verdi:', error);
    }
  }
}
