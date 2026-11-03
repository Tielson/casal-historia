# Entre Nós — Architecture

## Overview

Digital personalized couple book MVP. Visitor creates an anonymous draft, uploads photos, picks one of six styles (plus an optional old-film finish), answers three memory questions, reviews a free preview (cover + pages 2–4 in sequence), pays R$ 49,90 via Stripe, then receives a 12-page PDF with manage + gift links.

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
- **GenerationJob** — preview | production | pdf | receipt | email
- **FunnelEvent** — internal analytics

## Flow

1. Landing fires Meta `ViewContent` + funnel `visit`
2. `/criar` creates draft → occasion → couple/photos → style → memories
3. Preview job (BullMQ or in-memory): writing → illustrating → layout → ready
4. Approval freezes preview assets for the order
5. Checkout session created server-side; cancel returns to `/criar/revisao?canceled=1`
6. Webhook (or mock-pay) validates amount/currency/status → payment receipt email, then idempotent production
7. Remaining pages generated, PDF assembled (pdfkit), delivery email via Zoho SMTP (log stub if SMTP is empty)
8. Buyer manage link vs gift read-only opaque link (`noindex`)

## The book

A book is 12 illustrated scenes, one illustration per page. Generation runs in this order:

1. **Story** (`STORY_SYSTEM`, `generation/manuscript-author.ts`). The text model writes the whole tale first, plus `cast` (each person's stable look) and `phases` (each life phase with age and look, e.g. adolescência / hoje). `assessStory` checks length, links to the answers, and repeated reflections about time.
2. **Storyboard** (`STORYBOARD_SYSTEM`). The tale is split into 12 pages. Each page has:
   - a `layout`: `scene` (35–70 words), `dialogue` (narration plus up to 3 short lines) or `impact` (one short sentence);
   - a `beat`: what happens, what changed, why the next page follows, and what only the image shows;
   - a `visual` script: phase, staging (`together` / `apart` / `solo_a` / `solo_b` / `detail`), wardrobe, place, time, action, expression, shot, `textZone`, and `linkToNext`.

   Interior pages have no titles. `assessManuscript` rejects:
   - neighboring pages with the same event or nearly the same picture;
   - three text zones in a row;
   - romance in a teenage phase;
   - a conversation at a distance drawn with the couple together.
3. **Character sheet** (`cast.jpg`). Both people are drawn once in the chosen style from the photos. Every page receives the sheet plus the photos as references.
4. **Pages** (`p01`…`p12`). Prompts come from `generation/style-packs.ts`: style pack, optional film finish, the age for that phase, framing by shot, staging, and a calm area at `textZone`. Images are drawn at 2:3 and trimmed to 3:4.
5. **Layout** (`production/pdf-layout.ts`, `pdf.service.ts`):
   - 21 × 28 cm pages, the illustration full bleed;
   - the text is set in Lora inside the reserved zone, over a soft veil that fades into the scene;
   - the veil turns dark, with light text, when the zone is dark.

The preview renders the character sheet plus pages 1–4. Production renders 5–12 from the same sheet. `scripts/style-samples.ts` generates the style-card examples in `apps/web/public/styles`.

## Security / product rules

- Price only on API (`STRIPE_PRICE_CENTS`)
- Credentials only on API
- Text follows the chosen story mode: `real` develops only the given facts; `inspired` may add gesture, dialogue, and atmosphere and must say the story is inspired by the couple; `adventure` is disclosed fiction starring the couple. None of the modes invent marriage, children, or trips that were not in the answers, and adventure does not turn those into the plot either.
- Regen limit enforced server-side (`MAX_PREVIEW_REGENS`)
- Webhooks idempotent; production trigger safe to retry
- Admin gated by `ADMIN_TOKEN` (`x-admin-token`)

## Fallbacks

- Redis down → in-memory job runner
- R2/MinIO down → `.local-storage` + `/uploads/local?key=` (photos + PDFs otherwise via private R2 + signed GET)
- No Stripe keys → mock checkout URL + `POST /payments/mock-pay/:orderId`
- `MOCK_GENERATION=true` → local manuscript plus silhouette scenes, labeled in the preview. A failed real generation never becomes this placeholder, and a PDF is not delivered until the book passes validation.
