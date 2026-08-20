import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  Delete,
  Get,
  Param,
  Res,
  UseGuards,
  Body,
} from '@nestjs/common';
import { FilesService } from './files.service';
import { FileEntity } from './files.entity';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import type { Response } from 'express';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/modules/auth/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { FilePurpose } from './file-purpose.enum';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';

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
        purpose: {
          type: 'string',
          enum: Object.values(FilePurpose),
          example: 'AVATAR',
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
    @Body('purpose') purpose: FilePurpose,
    @CurrentUser() user: any,
  ): Promise<FileEntity> {
    const userId = user.userId || user.id;
    return await this.filesService.uploadFile(file, purpose, userId);
  }

  @Get()
  @Roles('admin')
  async findAll(): Promise<FileEntity[]> {
    return await this.filesService.findAll();
  }

  @Get(':id')
  async downloadFile(
    @Param('id') id: string,
    @Res() res: Response,
    @CurrentUser() user: any,
  ) {
    const userId = user.userId || user.id;
    const isAdmin = user.role === 'ADMIN';

    const filePath = await this.filesService.getFilePathForDownload(
      Number(id),
      userId,
      isAdmin,
    );
    return res.sendFile(filePath);
  }

  @Delete(':id')
  async deleteFile(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ): Promise<{ message: string }> {
    const userId = user.userId || user.id;
    const isAdmin = user.role === 'ADMIN';

    await this.filesService.deleteFileId(Number(id), userId, isAdmin);
    return { message: 'Fayl Uğurla Silindi!' };
  }
}
