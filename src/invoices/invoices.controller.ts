import {
  Controller,
  Get,
  Param,
  Res,
  Req,
  ForbiddenException,
  UseGuards,
} from '@nestjs/common';
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
    id: number;
    role: string;
  };
}

@ApiBearerAuth('access-token')
@ApiTags('Invoices')
@Controller('invoices')
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}
  // @Get()
  // async findAll(@Req() req: RequestWithUser) {
  //   const user = req.user as any;
  //   return this.invoicesService.findAll();
  // }
 
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
    console.log(req.user?.role, 'Salam');
    const orderUserId = await this.invoicesService.getUserIdByOrderId(orderId);
    const user = req.user;

    if (user && user.role !== 'admin' && orderUserId !== user.id) {
      throw new ForbiddenException('Bu fakturanı endirməyə icazəniz yoxdur.');
    }

    const invoiceData = await this.invoicesService.downloadInvoice(orderId);

    res.setHeader('Content-Type', 'text/plain');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=invoice-${orderId}.txt`,
    );
    res.send(invoiceData);
  }
}
