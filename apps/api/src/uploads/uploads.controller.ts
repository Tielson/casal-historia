import {
  Controller,
  Get,
  Post,
  Query,
  Res,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { memoryStorage } from 'multer';
import { UploadsService } from './uploads.service';

@Controller('uploads')
export class UploadsController {
  constructor(private readonly uploads: UploadsService) {}

  @Post('photo')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 8 * 1024 * 1024 },
    }),
  )
  async photo(
    @Query('token') token: string,
    @Query('slot') slot: string,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (!token) throw new BadRequestException('token obrigatório');
    if (!slot) throw new BadRequestException('slot obrigatório');
    if (!file?.buffer?.length) throw new BadRequestException('arquivo obrigatório');
    return this.uploads.uploadPhoto({
      token,
      slot,
      buffer: file.buffer,
      mimeType: file.mimetype || 'image/jpeg',
    });
  }

  @Get('local')
  async local(@Query('key') key: string, @Res() res: Response) {
    const body = await this.uploads.readLocal(key);
    const lower = (key || '').toLowerCase();
    const type = lower.endsWith('.png')
      ? 'image/png'
      : lower.endsWith('.webp')
        ? 'image/webp'
        : lower.endsWith('.pdf')
          ? 'application/pdf'
          : 'image/jpeg';
    res.setHeader('Content-Type', type);
    res.setHeader('Cache-Control', 'private, max-age=60');
    res.send(body);
  }
}
