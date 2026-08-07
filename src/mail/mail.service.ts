import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

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

  async sendOrderConfirmation(email: string, orderDetails: any) {
    const { orderId, items, total, address } = orderDetails;

    try {
      await this.transporter.sendMail({
        from: '"Shop Admin" <noreply@shop.com>',
        to: email,
        subject: `Sifariş Təsdiqi - #${orderId}`,
        html: `
          <h1>Sifarişiniz qəbul olundu!</h1>
          <p>Sifariş nömrəsi: <strong>${orderId}</strong></p>
          <p>Məhsullar: ${items}</p>
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
