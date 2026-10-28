# Turso / libSQL

Prisma uses the **SQLite** provider with `@prisma/adapter-libsql` + `@libsql/client` at runtime.

## Env

| Key | Purpose |
|-----|---------|
| `TURSO_DATABASE_URL` | Remote libSQL URL (`libsql://…`) — preferred at runtime |
| `TURSO_AUTH_TOKEN` | DB auth token |
| `DATABASE_URL` | Local file SQLite for `prisma migrate` / `db push` (`file:./prisma/dev.db`) |

Postgres (`postgresql://…`) is **deprecated** and no longer used.

## Create DB

```bash
turso auth login
# or: export TURSO_API_TOKEN=...
turso db create casal-historia
turso db show --url casal-historia
turso db tokens create casal-historia
```

Put URL + token in `.env` / `apps/api/.env` (never commit).

## Apply schema

Prisma Migrate cannot talk to remote Turso over HTTP. Generate SQL against the schema, then apply with the Turso CLI:

```bash
cd apps/api
DATABASE_URL="file:./dev.db" pnpm exec prisma migrate diff \
  --from-empty --to-schema-datamodel prisma/schema.prisma --script \
  > prisma/migrations/0001_init/migration.sql

turso db shell casal-historia < prisma/migrations/0001_init/migration.sql
```

Or push locally then copy:

```bash
DATABASE_URL="file:./dev.db" pnpm exec prisma db push
```

## Tables

`Draft`, `Photo`, `Preview`, `Order`, `Deliverable`, `Payment`, `GenerationJob`, `FunnelEvent`

Status/kind fields are strings (SQLite has no Prisma enums).
