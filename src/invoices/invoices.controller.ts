import { Controller, Get, Param, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { InvoicesService } from './invoices.service';
import type { Response } from 'express';

@ApiTags('Invoices')
@Controller('invoices')
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Get('order/:orderId')
  @ApiOperation({ summary: 'Sifariş üçün yaradılmış fakturanı endirmək' })
  @ApiResponse({ status: 200, description: 'Faktura uğurla endirildi.' })
  async download(@Param('orderId') orderId: string, @Res() res: Response) {
    const invoiceData = await this.invoicesService.downloadInvoice(orderId);

    res.setHeader('Content-Type', 'text/plain');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=invoice-${orderId}.txt`,
    );
    res.send(invoiceData);
  }
}
