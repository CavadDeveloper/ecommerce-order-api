import { Injectable, Logger } from '@nestjs/common';
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

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: 'localhost',
      port: 1025,
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

    try {
      await this.transporter.sendMail({
        from: '"Shop Admin" <noreply@shop.com>',
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
