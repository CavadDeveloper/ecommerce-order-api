import { Controller, Get, Param, Res, Req, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { RolesGuard } from 'src/modules/auth/guards/roles.guard';
import { InvoicesService } from './invoices.service';
import type { Response, Request } from 'express';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';

interface RequestWithUser extends Request {
  user?: {
    userId: number;
    role: string;
  };
}

@ApiBearerAuth()
@ApiTags('Invoices')
@Controller('invoices')
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('order/:orderId')
  @ApiOperation({ summary: 'Sifariş üçün yaradılmış fakturanı endirmək' })
  @ApiResponse({ status: 200, description: 'Faktura uğurla endirildi.' })
  @ApiResponse({
    status: 403,
    description: 'Bu fakturanı endirməyə icazəniz yoxdur.',
  })
  async download(
    @Param('orderId') orderId: string,
    @Req() req: RequestWithUser,
    @Res() res: Response,
  ) {
    const user = req.user;
    const invoiceData = await this.invoicesService.validateAndGetInvoice(
      orderId,
      user as { userId: number; role: string },
    );

    res.setHeader('Content-Type', 'text/plain');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=invoice-${invoiceData.filename}`,
    );
    res.send(invoiceData.content);
  }
}
