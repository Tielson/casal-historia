# Entre Nós — MVP

Livro digital personalizado para casais (12 páginas, R$ 49,90). Monorepo com Next.js (web) + NestJS (api) + Prisma/PostgreSQL + BullMQ/Redis + storage S3-compatible.

## Stack

- `apps/web` — Next.js App Router, TypeScript, Tailwind, React Hook Form + Zod, React Query, Axios
- `apps/api` — NestJS, Prisma, PostgreSQL, BullMQ + Redis, Stripe Checkout + webhook, MinIO/S3 (com fallback local)
- `packages/shared` — constantes, schemas Zod, eventos
- `docker-compose.yml` — Postgres, Redis, MinIO

## Setup rápido

```bash
# 1) Infra (recomendado)
docker compose up -d

# 2) Env
cp .env.example .env
cp .env.example apps/api/.env
# Ajuste ADMIN_TOKEN, Stripe, Meta etc. quando tiver

# 3) Dependências
pnpm install

# 4) Banco
pnpm db:push

# 5) Rodar
pnpm dev:api   # http://localhost:3001
pnpm dev:web   # http://localhost:3000
```

Sem Docker: Postgres em `DATABASE_URL` e Redis em `REDIS_URL`. Se Redis/MinIO estiverem offline, a API usa fila em memória e storage em disco (`.local-storage`).

## Mock vs real

| Área | Mock (default) | Real |
|------|----------------|------|
| Geração de imagens/texto | `MOCK_GENERATION=true` (placeholders SVG→JPEG + texto templated só com respostas do usuário) | `IMAGE_PROVIDER_API_KEY` / `OPENAI_API_KEY` (adapter stub até ligar provedor) |
| Stripe | Sem `STRIPE_SECRET_KEY` → checkout mock + `POST /payments/mock-pay/:orderId` | Checkout Session + webhook com assinatura |
| E-mail | Log no console | `RESEND_API_KEY` |
| Meta Pixel/CAPI | Stub em console + `POST /meta/capi` | `NEXT_PUBLIC_META_PIXEL_ID`, `META_PIXEL_ID`, `META_ACCESS_TOKEN`, `META_CAPI_ENABLED=true` |
| Storage | Pasta local se MinIO cair | MinIO/S3 via env `S3_*` |

Preço **sempre** no servidor (`STRIPE_PRICE_CENTS=4990`). Webhook valida assinatura, valor, moeda e status; produção é idempotente.

## Jornada

Landing → Ocasião → Casal/fotos → Estilo → Lembranças → Prévia → Revisão → Stripe → Produção → Livro

- Admin: `/admin` com header/token `ADMIN_TOKEN`
- Analytics guide: `/analytics`
- Comprador: `/livro/:manageToken`
- Presente (noindex, revogável): `/presente/:giftToken`

## Docs do produto

No checkout deste VM também em `/cursor/stores/self/docs/` (architecture, env, funnel-events, paper-frames-brief, support-policies).
