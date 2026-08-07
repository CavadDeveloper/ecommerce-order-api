import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { FilesService } from './files.service';
import { FilesController } from './files.controller';
import { FileEntity } from './files.entity';
import { ThumbnailProcessor } from './thumbnail.processor';

@Module({
  imports: [
    TypeOrmModule.forFeature([FileEntity]),
    BullModule.registerQueue({
      name: 'thumbnail-queue',
    }),
  ],
  controllers: [FilesController],
  providers: [FilesService, ThumbnailProcessor],
  exports: [FilesService],
})
export class FilesModule {}
