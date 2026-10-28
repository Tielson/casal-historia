# Entre Nós — Architecture

## Overview

Digital personalized couple book MVP. Visitor creates an anonymous draft, uploads photos, picks one of six styles, answers three memory questions, reviews a free preview (cover + 1 inner page), pays R$ 49,90 via Stripe, then receives a 12-page PDF with manage + gift links.

## Monorepo

```
apps/web     Next.js App Router (PT-BR UI)
apps/api     NestJS + Prisma + BullMQ
packages/shared   Zod schemas, constants, funnel/Meta event names
docker-compose.yml  postgres + redis + minio
```

## Entities

- **Draft** — anonymous token (cookie + `localStorage` + `x-draft-token`); steps, couple fields, style, memories, regen count, approval flag
- **Preview** — generation stage + cover/page asset keys + templated text
- **Order** — server price (`amountCents=4990`, `brl`), Stripe ids, production stage, PDF key, `manageToken`, `giftToken` (revocable)
- **Payment** — webhook idempotency via unique `stripeEventId`
- **GenerationJob** — preview | production | pdf | email
- **FunnelEvent** — internal analytics

## Flow

1. Landing fires Meta `ViewContent` + funnel `visit`
2. `/criar` creates draft → occasion → couple/photos → style → memories
3. Preview job (BullMQ or in-memory): writing → illustrating → layout → ready
4. Approval freezes preview assets for the order
5. Checkout session created server-side; cancel returns to `/criar/revisao?canceled=1`
6. Webhook (or mock-pay) validates amount/currency/status → idempotent production
7. Remaining pages generated, PDF assembled (pdfkit), email stub/Resend
8. Buyer manage link vs gift read-only opaque link (`noindex`)

## Security / product rules

- Price only on API (`STRIPE_PRICE_CENTS`)
- Credentials only on API
- Text never invents marriage/children/trips not present in answers
- Regen limit enforced server-side (`MAX_PREVIEW_REGENS`)
- Webhooks idempotent; production trigger safe to retry
- Admin gated by `ADMIN_TOKEN` (`x-admin-token`)

## Fallbacks

- Redis down → in-memory job runner
- R2/MinIO down → `.local-storage` + `/uploads/local?key=` (photos + PDFs otherwise via private R2 + signed GET)
- No Stripe keys → mock checkout URL + `POST /payments/mock-pay/:orderId`
- `MOCK_GENERATION=true` → placeholder images + templated copy
