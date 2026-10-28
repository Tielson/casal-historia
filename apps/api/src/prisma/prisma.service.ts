import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaLibSQL } from '@prisma/adapter-libsql';
import { config } from '../config';

function createAdapter() {
  const url = config.tursoDatabaseUrl || config.databaseUrl || 'file:./prisma/dev.db';
  const authToken = config.tursoAuthToken || undefined;
  return new PrismaLibSQL({
    url,
    ...(authToken ? { authToken } : {}),
  });
}

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    super({ adapter: createAdapter() });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
