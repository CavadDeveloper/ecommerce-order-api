import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  Delete,
  Get,
  Param,
  Res,
  NotFoundException,
  UseGuards,
} from '@nestjs/common';
import { FilesService } from './files.service';
import { FileEntity } from './files.entity';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import type { Response } from 'express';
import * as fs from 'fs';

import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/modules/auth/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';

@ApiTags('files')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}
  @Post('upload')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile()
    file: {
      originalname: string;
      mimetype: string;
      size: number;
      buffer: Buffer;
    },
  ): Promise<FileEntity> {
    return await this.filesService.uploadFile(file);
  }

  @Get()
  @Roles('admin')
  async findAll(): Promise<FileEntity[]> {
    return await this.filesService.findAll();
  }

  @Get(':id')
  @Roles('admin')
  async downloadFile(@Param('id') id: string, @Res() res: Response) {
    const fileEntity = await this.filesService.findOne(Number(id));

    if (!fs.existsSync(fileEntity.path)) {
      throw new NotFoundException('Fiziki fayl diskdə tapılmadı!');
    }

    return res.sendFile(fileEntity.path);
  }

  @Delete(':id')
  async deleteFile(@Param('id') id: string): Promise<{ message: string }> {
    await this.filesService.deleteFileId(Number(id));
    return { message: 'Fayl Uğurla Silindi!' };
  }
}
