import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Address } from './entities/address.entity';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';

@Injectable()
export class AddressService {
  constructor(
    @InjectRepository(Address)
    private readonly addressRepository: Repository<Address>,
  ) {}

  async create(userId: number, createAddressDto: CreateAddressDto) {
    const address = this.addressRepository.create({
      ...createAddressDto,
      user: { id: Number(userId) },
    });
    return this.addressRepository.save(address);
  }

  findAll() {
    return this.addressRepository.find({ relations: { user: true } });
  }

  async findOne(id: number, userId?: number, userRole?: string) {
    const address = await this.addressRepository.findOne({
      where: { id },
      relations: { user: true },
    });
    if (!address) {
      throw new NotFoundException(`ID-si ${id} olan unvan tapilmadi`);
    }

    if (userRole !== 'ADMIN' && address.user.id !== userId) {
      throw new ForbiddenException('Bu ünvana baxmaq icazəniz yoxdur.');
    }

    return address;
  }

  async update(
    id: number,
    updateAddressDto: UpdateAddressDto,
    userId: number,
    userRole: string,
  ) {
    await this.findOne(id, userId, userRole);
    await this.addressRepository.update(id, updateAddressDto);
    return this.findOne(id, userId, userRole);
  }

  async remove(id: number, userId: number, userRole: string) {
    const address = await this.findOne(id, userId, userRole);
    return this.addressRepository.remove(address);
  }
}
