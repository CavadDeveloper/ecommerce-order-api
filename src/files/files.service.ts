import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { FileEntity } from './files.entity';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as crypto from 'crypto';

@Injectable()
export class FilesService {
  private readonly uploadDir = path.join(process.cwd(), 'uploads');

  constructor(
    @InjectRepository(FileEntity)
    private readonly fileRepository: Repository<FileEntity>,
    @InjectQueue('thumbnail-queue') private readonly thumbnailQueue: Queue,
  ) {
    this.ensureUploadDirExists();
  }

  private async ensureUploadDirExists() {
    try {
      await fs.mkdir(this.uploadDir, { recursive: true });
    } catch {
      console.log('Upload qovluğu yaradıla bilmədi');
    }
  }

  async uploadFile(file: {
    originalname: string;
    mimetype: string;
    size: number;
    buffer: Buffer;
  }): Promise<FileEntity> {
    if (!file) {
      throw new BadRequestException('Fayl Təqdim Olunmayıb!');
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new BadRequestException('Faylın ölçüsü 5 MB-ni keçə bilməz!');
    }

    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        'Faylın formatı yalnız jpg, png, jpeg formatında ola bilər',
      );
    }

    const fileExtension = path.extname(file.originalname);
    const uniqueFilename = `${crypto.randomUUID()}${fileExtension}`;
    const filePath = path.join(this.uploadDir, uniqueFilename);

    await fs.writeFile(filePath, file.buffer);

    await this.thumbnailQueue.add('generate-thumbnail', {
      filePath,
      filename: uniqueFilename,
    });

    const fileEntity = this.fileRepository.create({
      filename: uniqueFilename,
      mimetype: file.mimetype,
      originalname: file.originalname,
      size: file.size,
      path: filePath,
    });

    return await this.fileRepository.save(fileEntity);
  }

  async deleteFileId(id: number): Promise<void> {
    const fileEntity = await this.fileRepository.findOne({ where: { id } });
    if (!fileEntity) {
      throw new NotFoundException('Fayl Tapılmadı!');
    }

    try {
      await fs.unlink(fileEntity.path);
    } catch (err) {
      console.error('Fiziki fayl diskdən silinərkən xəta baş verdi', err);
    }

    await this.fileRepository.remove(fileEntity);
  }
}
