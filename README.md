# Entre Nós — MVP

Livro digital personalizado para casais (12 páginas, R$ 49,90). Monorepo com Next.js (web) + NestJS (api) + Prisma/Turso (libSQL) + BullMQ/Redis + storage S3-compatible.

## Stack

- `apps/web` — Next.js App Router, TypeScript, Tailwind, React Hook Form + Zod, React Query, Axios
- `apps/api` — NestJS, Prisma + Turso/libSQL (`@prisma/adapter-libsql`), BullMQ + Redis, Stripe Checkout + webhook, Cloudflare R2 / MinIO (S3-compatible, fallback local)
- `packages/shared` — constantes, schemas Zod, eventos
- `docker-compose.yml` — Redis, MinIO opcional (banco é Turso; storage preferido é R2)

## Setup rápido

```bash
# 1) Infra auxiliar (Redis; MinIO só se não usar R2)
docker compose up -d

# 2) Env
cp .env.example .env
cp .env.example apps/api/.env
# Preencha TURSO_DATABASE_URL + TURSO_AUTH_TOKEN (ver abaixo)
# Preencha S3_* para Cloudflare R2 (ver docs/r2.md) ou deixe MinIO local
# Ajuste ADMIN_TOKEN, Stripe, Meta etc. quando tiver

# 3) Dependências
pnpm install

# 4) Banco (Turso remoto ou SQLite local)
pnpm db:push
# ou: aplicar migration SQL no Turso — ver docs/turso.md

# 5) Rodar
pnpm dev:api   # http://localhost:4000
pnpm dev:web   # http://localhost:3000
```

API defaults to **4000** (override with `PORT`) so it never fights Next for 3000/3001. Redis offline → in-memory job runner is fine for local.

### Turso

```bash
# CLI: https://docs.turso.tech/cli/installation
turso auth login
turso db create casal-historia
turso db show --url casal-historia          # → TURSO_DATABASE_URL
turso db tokens create casal-historia       # → TURSO_AUTH_TOKEN

# Schema: migrate gera SQL local; aplicar no Turso:
pnpm --filter @entre-nos/api exec prisma migrate diff \
  --from-empty --to-schema-datamodel prisma/schema.prisma --script \
  > apps/api/prisma/migrations/0001_init/migration.sql
turso db shell casal-historia < apps/api/prisma/migrations/0001_init/migration.sql
```

Sem Turso: use `DATABASE_URL=file:./prisma/dev.db` e `pnpm db:push` (SQLite local). A API usa `TURSO_DATABASE_URL` quando definido; senão cai no arquivo local.

Redis offline → fila em memória. R2/MinIO offline → storage em disco (`.local-storage`).

## Mock vs real

| Área | Mock (default) | Real |
|------|----------------|------|
| Geração de imagens/texto | `MOCK_GENERATION=true` (placeholders SVG→JPEG + texto templated só com respostas do usuário) | `IMAGE_PROVIDER_API_KEY` / `OPENAI_API_KEY` (adapter stub até ligar provedor) |
| Stripe | Sem `STRIPE_SECRET_KEY` → checkout mock + `POST /payments/mock-pay/:orderId` | Checkout Session + webhook com assinatura |
| E-mail | Log no console | `RESEND_API_KEY` |
| Meta Pixel/CAPI | Stub em console + `POST /meta/capi` | `NEXT_PUBLIC_META_PIXEL_ID`, `META_PIXEL_ID`, `META_ACCESS_TOKEN`, `META_CAPI_ENABLED=true` |
| Storage | Pasta local se R2/MinIO cair | Cloudflare R2 (ou MinIO) via env `S3_*`; objetos privados + signed GET |

Preço **sempre** no servidor (`STRIPE_PRICE_CENTS=4990`). Webhook valida assinatura, valor, moeda e status; produção é idempotente.

## Jornada

Landing → Ocasião → Casal/fotos → Estilo → Lembranças → Prévia → Revisão → Stripe → Produção → Livro

- Admin: `/admin` com header/token `ADMIN_TOKEN`
- Analytics guide: `/analytics`
- Comprador: `/livro/:manageToken`
- Presente (noindex, revogável): `/presente/:giftToken`

## Docs do produto

No checkout deste VM também em `/cursor/stores/self/docs/` (architecture, env, funnel-events, paper-frames-brief, support-policies, turso-setup).

## GitHub

```bash
gh auth login
gh repo create entrenos-mvp --private --source=. --remote=origin --push
gh pr create --base main --head cursor/entre-nos-mvp-8678 --title "Entre Nós MVP" --body "MVP monorepo: landing, funnel, preview, Stripe, admin."
```
