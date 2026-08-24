import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { FilePurpose } from 'src/files/file-purpose.enum';
import { FilesService } from 'src/files/files.service';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly filesService: FilesService,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const user = this.userRepository.create({
      ...createUserDto,
      role: createUserDto.role as any,
    });
    return this.userRepository.save(user);
  }

  async findAll(): Promise<User[]> {
    return this.userRepository.find({ relations: { avatar: true } });
  }

  async findOne(id: number): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: { avatar: true },
    });
    if (!user) {
      throw new NotFoundException(`ID-si ${id} olan istifadəçi tapılmadı`);
    }
    return user;
  }

  async update(id: number, updateUserDto: UpdateUserDto): Promise<User> {
    await this.findOne(id);

    await this.userRepository.update(id, {
      ...updateUserDto,
      role: updateUserDto.role ? (updateUserDto.role as any) : undefined,
    });

    return this.findOne(id);
  }

  async remove(id: number): Promise<User> {
    const user = await this.findOne(id);
    return this.userRepository.remove(user);
  }

  async uploadAvatar(
    userId: number,
    file: {
      originalname: string;
      mimetype: string;
      size: number;
      buffer: Buffer;
    },
  ): Promise<{ message: string; file: any }> {
    const uploadFile = await this.filesService.uploadFile(
      file,
      FilePurpose.AVATAR,
      userId,
    );
    await this.userRepository.update(userId, {
      avatarId: uploadFile.id,
    } as any);

    return {
      message: 'Avatar Uğurla Yeniləndi!',
      file: uploadFile,
    };
  }
}
