import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
} from '@nestjs/common';
import { AddressService } from './address.service';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('Address')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('address')
export class AddressController {
  constructor(private readonly addressService: AddressService) {}

  @Post()
  create(@Req() req: any, @Body() createAddressDto: CreateAddressDto) {
    const userId = req.user.userId;
    return this.addressService.create(userId, createAddressDto);
  }
  @Roles('ADMIN')
  @Get()
  findAll() {
    return this.addressService.findAll();
  }
  @Roles('ADMIN')
  @Get(':id')
  findOne(@Req() req: any, @Param('id') id: string) {
    const userId = req.user.userId;
    const userRole = req.user.roles;
    return this.addressService.findOne(+id, userId, userRole);
  }

  @Patch(':id')
  update(
    @Req() req: any,
    @Param('id') id: string,
    @Body() updateAddressDto: UpdateAddressDto,
  ) {
    const userId = req.user.userId;
    const userRole = req.user.roles;
    return this.addressService.update(+id, updateAddressDto, userId, userRole);
  }

  @Delete(':id')
  remove(@Req() req: any, @Param('id') id: string) {
    const userId = req.user.userId;
    const userRole = req.user.roles;
    return this.addressService.remove(+id, userId, userRole);
  }
}
