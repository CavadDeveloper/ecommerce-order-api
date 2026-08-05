import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { OrderService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';

@Controller('orders')
export class OrdersController {
  constructor(private readonly orderService: OrderService) {}

  @Post('checkout/:userId')
  async checkout(
    @Param('userId', ParseIntPipe) userId: number,
    @Body() createOrderDto: CreateOrderDto,
  ) {
    return this.orderService.checkout(userId, createOrderDto);
  }
  @Post(':id/pay/:userId')
  @HttpCode(HttpStatus.OK)
  async payOrder(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('id', ParseIntPipe) orderId: number,
  ) {
    return this.orderService.payOrder(userId, orderId);
  }
  @Post(':id/cancel/:userId')
  @HttpCode(HttpStatus.OK)
  async cancelOrder(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('id', ParseIntPipe) orderId: number,
  ) {
    return this.orderService.cancelOrder(userId, orderId);
  }
  @Get('user/:userId')
  async getUserOrders(@Param('userId', ParseIntPipe) userId: number) {
    return this.orderService.getUserOrders(userId);
  }
  @Get(':id/user/:userId')
  async getOrderById(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('id', ParseIntPipe) orderId: number,
  ) {
    return this.orderService.getOrderById(userId, orderId);
  }
}
