import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { json, raw, urlencoded } from 'express';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { config } from './config';

function isLocalDevOrigin(origin: string) {
  if (process.env.NODE_ENV === 'production') return false;
  try {
    const { hostname } = new URL(origin);
    return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1' || hostname === '[::1]';
  } catch {
    return false;
  }
}

/** Configured origins, plus any localhost port while not in production. */
function resolveCorsOrigin(raw: string) {
  const allowed = new Set(
    raw
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean),
  );

  return (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    if (!origin || allowed.has(origin) || isLocalDevOrigin(origin)) {
      callback(null, true);
      return;
    }
    callback(null, false);
  };
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bodyParser: false });

  app.use(cookieParser());
  app.use('/payments/webhook', raw({ type: 'application/json' }));
  app.use(json({ limit: '2mb' }));
  app.use(urlencoded({ extended: true }));

  app.enableCors({
    origin: resolveCorsOrigin(config.corsOrigin),
    credentials: true,
  });

  await app.listen(config.port);
  // eslint-disable-next-line no-console
  console.log(`Entre Nós API on http://localhost:${config.port}`);
}

bootstrap();
