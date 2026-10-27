import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  CreateBucketCommand,
  HeadBucketCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { mkdir, writeFile, readFile } from 'fs/promises';
import { dirname, join } from 'path';
import { existsSync } from 'fs';
import { config } from '../config';

/**
 * S3-compatible storage with local filesystem fallback when MinIO is unreachable.
 */
@Injectable()
export class StorageService implements OnModuleInit {
  private readonly logger = new Logger(StorageService.name);
  private client: S3Client;
  private localFallback = false;
  private readonly localRoot = join(process.cwd(), '.local-storage');

  constructor() {
    this.client = new S3Client({
      region: config.s3.region,
      endpoint: config.s3.endpoint,
      forcePathStyle: config.s3.forcePathStyle,
      credentials: {
        accessKeyId: config.s3.accessKey,
        secretAccessKey: config.s3.secretKey,
      },
    });
  }

  async onModuleInit() {
    try {
      await this.client.send(new HeadBucketCommand({ Bucket: config.s3.bucket }));
      this.logger.log(`S3 bucket ready: ${config.s3.bucket}`);
    } catch {
      try {
        await this.client.send(new CreateBucketCommand({ Bucket: config.s3.bucket }));
        this.logger.log(`Created S3 bucket: ${config.s3.bucket}`);
      } catch (err) {
        this.localFallback = true;
        await mkdir(this.localRoot, { recursive: true });
        this.logger.warn(
          `S3 unavailable (${(err as Error).message}). Using local fallback at ${this.localRoot}`,
        );
      }
    }
  }

  async putObject(key: string, body: Buffer, contentType: string): Promise<string> {
    if (this.localFallback) {
      const path = join(this.localRoot, key);
      await mkdir(dirname(path), { recursive: true });
      await writeFile(path, body);
      return key;
    }
    await this.client.send(
      new PutObjectCommand({
        Bucket: config.s3.bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
      }),
    );
    return key;
  }

  async getObject(key: string): Promise<Buffer> {
    if (this.localFallback || existsSync(join(this.localRoot, key))) {
      return readFile(join(this.localRoot, key));
    }
    const res = await this.client.send(
      new GetObjectCommand({ Bucket: config.s3.bucket, Key: key }),
    );
    const bytes = await res.Body?.transformToByteArray();
    return Buffer.from(bytes ?? []);
  }

  async getSignedGetUrl(key: string, expiresIn = 3600): Promise<string> {
    if (this.localFallback || !key) {
      return `${config.apiUrl}/uploads/local?key=${encodeURIComponent(key)}`;
    }
    if (config.s3.publicBaseUrl) {
      return `${config.s3.publicBaseUrl.replace(/\/$/, '')}/${key}`;
    }
    return getSignedUrl(
      this.client,
      new GetObjectCommand({ Bucket: config.s3.bucket, Key: key }),
      { expiresIn },
    );
  }

  isLocalFallback() {
    return this.localFallback;
  }
}
