import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { json, raw, urlencoded } from 'express';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { config } from './config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bodyParser: false });

  app.use(cookieParser());
  app.use('/payments/webhook', raw({ type: 'application/json' }));
  app.use(json({ limit: '2mb' }));
  app.use(urlencoded({ extended: true }));

  app.enableCors({
    origin: config.corsOrigin,
    credentials: true,
  });

  await app.listen(config.port);
  // eslint-disable-next-line no-console
  console.log(`Entre Nós API on http://localhost:${config.port}`);
}

bootstrap();
