import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Queue, Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import { config } from '../config';

export type JobKind = 'preview' | 'production' | 'pdf' | 'email';

export interface GenerationJobData {
  kind: JobKind;
  draftId?: string;
  orderId?: string;
  force?: boolean;
}

type Handler = (data: GenerationJobData, job: Job<GenerationJobData>) => Promise<void>;

@Injectable()
export class QueueService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(QueueService.name);
  private connection: IORedis | null = null;
  private queue: Queue<GenerationJobData> | null = null;
  private worker: Worker<GenerationJobData> | null = null;
  private handlers = new Map<JobKind, Handler>();
  private memoryJobs: GenerationJobData[] = [];
  private memoryMode = false;
  private draining = false;

  async onModuleInit() {
    try {
      this.connection = new IORedis(config.redisUrl, {
        maxRetriesPerRequest: null,
        lazyConnect: true,
      });
      await this.connection.connect();
      this.queue = new Queue('generation', { connection: this.connection });
      this.worker = new Worker(
        'generation',
        async (job) => {
          const handler = this.handlers.get(job.data.kind);
          if (!handler) throw new Error(`No handler for ${job.data.kind}`);
          await handler(job.data, job);
        },
        { connection: this.connection, concurrency: 2 },
      );
      this.worker.on('failed', (job, err) => {
        this.logger.error(`Job ${job?.id} failed: ${err.message}`);
      });
      this.logger.log('BullMQ connected to Redis');
    } catch (err) {
      this.memoryMode = true;
      this.logger.warn(
        `Redis unavailable (${(err as Error).message}). Using in-memory job runner.`,
      );
    }
  }

  async onModuleDestroy() {
    await this.worker?.close();
    await this.queue?.close();
    await this.connection?.quit();
  }

  register(kind: JobKind, handler: Handler) {
    this.handlers.set(kind, handler);
  }

  async enqueue(data: GenerationJobData) {
    if (this.memoryMode || !this.queue) {
      this.memoryJobs.push(data);
      void this.drainMemory();
      return { id: `mem-${Date.now()}`, mode: 'memory' as const };
    }
    const job = await this.queue.add(data.kind, data, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 },
      removeOnComplete: 100,
      removeOnFail: 200,
    });
    return { id: String(job.id), mode: 'redis' as const };
  }

  private async drainMemory() {
    if (this.draining) return;
    this.draining = true;
    while (this.memoryJobs.length) {
      const data = this.memoryJobs.shift()!;
      const handler = this.handlers.get(data.kind);
      if (!handler) continue;
      try {
        await handler(data, { data } as Job<GenerationJobData>);
      } catch (err) {
        this.logger.error(`Memory job ${data.kind} failed: ${(err as Error).message}`);
      }
    }
    this.draining = false;
  }
}
