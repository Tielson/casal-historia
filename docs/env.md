# Entre Nós — Environment keys

Copy from repo `.env.example`.

## Core

| Key | Where | Purpose |
|-----|-------|---------|
| `DATABASE_URL` | API | PostgreSQL connection |
| `REDIS_URL` | API | BullMQ (optional; falls back to in-memory if Redis refused) |
| `PORT` | API | Default `4000` (web stays on `3000`) |
| `CORS_ORIGIN` / `WEB_URL` / `API_URL` | API | Origins and absolute links (`API_URL` → `http://localhost:4000`) |
| `NEXT_PUBLIC_API_URL` | Web | Browser → API (`http://localhost:4000`) |
| `ADMIN_TOKEN` | API | Admin panel + `/admin/*` |
| `DRAFT_COOKIE_NAME` | API | Default `en_draft` |

## Stripe (server only)

| Key | Purpose |
|-----|---------|
| `STRIPE_SECRET_KEY` | Checkout sessions |
| `STRIPE_WEBHOOK_SECRET` | Signature verification |
| `STRIPE_PRICE_CENTS` | Authoritative price (`4990`) |
| `STRIPE_CURRENCY` | `brl` |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Optional client display only |

## Storage (Cloudflare R2 preferred; MinIO ok locally)

| Key | Purpose |
|-----|---------|
| `S3_ENDPOINT` | R2: `https://<ACCOUNT_ID>.r2.cloudflarestorage.com` — or MinIO `http://localhost:9000` |
| `S3_REGION` | `auto` for R2; `us-east-1` for MinIO |
| `S3_ACCESS_KEY` / `S3_SECRET_KEY` | R2 API token access key / secret (never commit) |
| `S3_BUCKET` | Bucket name (prod: `nos-dois`) |
| `S3_FORCE_PATH_STYLE` | `true` recommended for R2 and MinIO |
| `S3_PUBLIC_BASE_URL` | Leave empty for private objects + signed GETs; set only with a public CDN |
| `CLOUDFLARE_ACCOUNT_ID` / `CLOUDFLARE_API_TOKEN` | Optional bucket admin; local `.env` only |

## Generation / email

| Key | Purpose |
|-----|---------|
| `MOCK_GENERATION` | `true` → local story and silhouette scenes for development. `false` writes with ChatGPT when `OPENAI_API_KEY` is set, otherwise Claude; images use the OpenAI key. Failure stays pending |
| `MAX_PREVIEW_REGENS` | Default `3` |
| `OPENAI_API_KEY` | ChatGPT writes the manuscript and OpenAI illustrates with the couple's photos |
| `OPENAI_TEXT_MODEL` | Default `gpt-5.4` |
| `ANTHROPIC_API_KEY` | Claude, used only when `OPENAI_API_KEY` is empty |
| `ANTHROPIC_MODEL` | Default `claude-haiku-4-5` |
| `IMAGE_PROVIDER_API_KEY` | Fallback image key if `OPENAI_API_KEY` is empty |
| `IMAGE_MODEL` | Default `gpt-image-2.5-flare` |
| `RESEND_API_KEY` | Real email; else log stub |
| `EMAIL_FROM` | From header |

## Meta Pixel + CAPI

| Key | Where | Purpose |
|-----|-------|---------|
| `NEXT_PUBLIC_META_PIXEL_ID` | Web | Loads fbevents.js; stub if empty |
| `META_PIXEL_ID` | API | CAPI pixel id |
| `META_ACCESS_TOKEN` | API | CAPI token |
| `META_TEST_EVENT_CODE` | API | Events Manager test code |
| `META_CAPI_ENABLED` | API | `true` to POST Graph API |

### Fired events

- `ViewContent` — landing mount
- `InitiateCheckout` — review → pay
- `Purchase` — success page (deduped with `event_id`)
