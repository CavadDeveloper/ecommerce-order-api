import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  Delete,
  Param,
} from '@nestjs/common';
import { FilesService } from './files.service';
import { FileEntity } from './files.entity';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';

@ApiTags('files')
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

  @Delete(':id')
  async deleteFile(@Param('id') id: string): Promise<{ message: string }> {
    await this.filesService.deleteFileId(Number(id));
    return { message: 'Fayl Uğurla Silindi!' };
  }
}
