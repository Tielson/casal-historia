import { config as loadEnv } from 'dotenv';
import { resolve } from 'path';
import { PRICE_CENTS, MAX_PREVIEW_REGENS } from '@entre-nos/shared';

loadEnv({ path: resolve(__dirname, '../../../.env') });
loadEnv({ path: resolve(__dirname, '../.env') });

function sanitizeSecret(value?: string) {
  const v = (value ?? '').trim();
  if (!v) return '';
  if (/xxx|change-me|your_|placeholder/i.test(v)) return '';
  return v;
}

export const config = {
  port: Number(process.env.PORT ?? 3001),
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:3000',
  webUrl: process.env.WEB_URL ?? 'http://localhost:3000',
  apiUrl: process.env.API_URL ?? 'http://localhost:3001',
  databaseUrl: process.env.DATABASE_URL ?? '',
  redisUrl: process.env.REDIS_URL ?? 'redis://localhost:6379',
  adminToken: process.env.ADMIN_TOKEN ?? 'change-me-admin-token',
  draftCookieName: process.env.DRAFT_COOKIE_NAME ?? 'en_draft',
  stripeSecretKey: sanitizeSecret(process.env.STRIPE_SECRET_KEY),
  stripeWebhookSecret: sanitizeSecret(process.env.STRIPE_WEBHOOK_SECRET),
  priceCents: Number(process.env.STRIPE_PRICE_CENTS ?? PRICE_CENTS),
  currency: (process.env.STRIPE_CURRENCY ?? 'brl').toLowerCase(),
  s3: {
    endpoint: process.env.S3_ENDPOINT ?? 'http://localhost:9000',
    region: process.env.S3_REGION ?? 'us-east-1',
    accessKey: process.env.S3_ACCESS_KEY ?? 'minioadmin',
    secretKey: process.env.S3_SECRET_KEY ?? 'minioadmin',
    bucket: process.env.S3_BUCKET ?? 'entre-nos',
    forcePathStyle: (process.env.S3_FORCE_PATH_STYLE ?? 'true') === 'true',
    publicBaseUrl: process.env.S3_PUBLIC_BASE_URL ?? '',
  },
  mockGeneration: (process.env.MOCK_GENERATION ?? 'true') === 'true',
  maxPreviewRegens: Number(process.env.MAX_PREVIEW_REGENS ?? MAX_PREVIEW_REGENS),
  openaiApiKey: sanitizeSecret(process.env.OPENAI_API_KEY),
  imageProviderApiKey: sanitizeSecret(process.env.IMAGE_PROVIDER_API_KEY),
  resendApiKey: sanitizeSecret(process.env.RESEND_API_KEY),
  emailFrom: process.env.EMAIL_FROM ?? 'Entre Nós <noreply@entrenos.app>',
  meta: {
    pixelId: sanitizeSecret(process.env.META_PIXEL_ID),
    accessToken: sanitizeSecret(process.env.META_ACCESS_TOKEN),
    testEventCode: process.env.META_TEST_EVENT_CODE ?? '',
    capiEnabled: (process.env.META_CAPI_ENABLED ?? 'false') === 'true',
  },
};
