import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import sharp from 'sharp';
import * as path from 'path';
import * as fs from 'fs/promises';

@Processor('thumbnail-queue')
export class ThumbnailProcessor extends WorkerHost {
  private readonly logger = new Logger(ThumbnailProcessor.name);
  private readonly thumbnailDir = path.join(
    process.cwd(),
    'uploads',
    'thumbnails',
  );

  async process(
    job: Job<{ filePath: string; filename: string }>,
  ): Promise<any> {
    const { filePath, filename } = job.data;
    this.logger.log(`Thumbnail yaradılması başladı: ${filename}`);

    try {
      await fs.mkdir(this.thumbnailDir, { recursive: true });
      const thumbnailPath = path.join(this.thumbnailDir, `thumb_${filename}`);

      await sharp(filePath)
        .resize(200, 200, { fit: 'inside' })
        .toFile(thumbnailPath);

      this.logger.log(`Thumbnail uğurla yaradıldı: ${filename}`);
      return { success: true, thumbnailPath };
    } catch (error) {
      this.logger.error(
        `Thumbnail yaradılarkən xəta baş verdi: ${filename}`,
        error,
      );
      throw error;
    }
  }
}
