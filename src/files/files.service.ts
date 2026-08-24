import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { FileEntity } from './files.entity';
import { FilePurpose } from './file-purpose.enum';
import * as fs from 'fs/promises';
import * as fsSync from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

@Injectable()
export class FilesService {
  private readonly uploadDir = path.join(process.cwd(), 'uploads');
  private readonly logger = new Logger(FilesService.name);

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
      this.logger.error('Upload qovluğu yaradıla bilmədi');
    }
  }

  async uploadFile(
    file: {
      originalname: string;
      mimetype: string;
      size: number;
      buffer: Buffer;
    },
    purpose: FilePurpose,
    userId: number,
  ): Promise<FileEntity> {
    if (!file) {
      throw new BadRequestException('Fayl Təqdim Olunmayıb!');
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new BadRequestException('Faylın ölçüsü 5 MB-ni keçə bilməz!');
    }

    const allowedMimeTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'application/pdf',
      'text/plain',
    ];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException('Faylın formatı dəstəklənmir');
    }

    const fileExtension = path.extname(file.originalname);
    const uniqueFilename = `${crypto.randomUUID()}${fileExtension}`;
    const filePath = path.join(this.uploadDir, uniqueFilename);

    await fs.writeFile(filePath, file.buffer);

    if (purpose !== FilePurpose.INVOICE) {
      await this.thumbnailQueue.add('generate-thumbnail', {
        filePath,
        filename: uniqueFilename,
      });
    }

    const fileEntity = this.fileRepository.create({
      filename: uniqueFilename,
      mimetype: file.mimetype,
      originalname: file.originalname,
      size: file.size,
      path: filePath,
      purpose: purpose || FilePurpose.PRODUCT_IMAGE,
      userId,
    });

    return await this.fileRepository.save(fileEntity);
  }

  async deleteFileId(
    id: number,
    userId: number,
    isAdmin: boolean,
  ): Promise<void> {
    const fileEntity = await this.fileRepository.findOne({ where: { id } });
    if (!fileEntity) {
      throw new NotFoundException('Fayl Tapılmadı!');
    }
    if (fileEntity.userId !== userId && !isAdmin) {
      throw new ForbiddenException('Bu faylı silməyə icazəniz yoxdur!');
    }
    try {
      await fs.unlink(fileEntity.path);
    } catch (err) {
      console.error('Fiziki fayl diskdən silinərkən xəta baş verdi', err);
    }

    await this.fileRepository.remove(fileEntity);
  }

  async findAll(): Promise<FileEntity[]> {
    return await this.fileRepository.find();
  }

  async findOne(id: number): Promise<FileEntity> {
    const file = await this.fileRepository.findOne({ where: { id } });
    if (!file) {
      throw new NotFoundException('Fayl Tapılmadı!');
    }
    return file;
  }

  async getFilePathForDownload(
    id: number,
    userId: number,
    isAdmin: boolean,
  ): Promise<string> {
    const fileEntity = await this.findOne(id);

    if (
      fileEntity.purpose !== FilePurpose.PRODUCT_IMAGE &&
      fileEntity.userId !== userId &&
      !isAdmin
    ) {
      throw new ForbiddenException('Bu fayla baxmaq icazəniz yoxdur!');
    }

    if (!fsSync.existsSync(fileEntity.path)) {
      throw new NotFoundException('Fiziki Fayl Diskdə Tapılmadı');
    }
    return fileEntity.path;
  }
}
