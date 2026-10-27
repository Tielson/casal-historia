# Entre Nós — Phase 1 quality bake-off

**Product:** digital personalized couple book · **Price:** R$ 49,90 · **Fixture:** Ana & Pedro  
**Date:** 2026-10-27 · **Status:** defaults chosen from public pricing + capability review (paid APIs not called in this run)

---

## 1. Recommendation (chosen stack)

| Role | Default | Why |
|------|---------|-----|
| **Image (production)** | OpenAI **gpt-image-2.5-flare**, quality **medium**, portrait **1024×1536** | Strong style adherence across 6 packs, photo-reference / edit path for likeness, official API, predictable per-image economics |
| **Image (economy / load)** | Black Forest Labs **FLUX.2 [pro]** via fal.ai or BFL (~US$ 0.03 / MP) | Cheaper for illustrated styles when likeness is already locked; good for retries and A/B |
| **Image (likeness repair)** | OpenAI image edit with customer photo refs **or** FLUX.1 Kontext [pro] | Targeted face/outfit repair without regenerating the whole page |
| **Text (book copy)** | Anthropic **Claude Haiku 5.5** | Warm PT-BR, low cost, API data not used for training by default |
| **Text (polish / hard cases)** | Claude **Sonnet 5.5** | Better for delicate anti-invention rewrites and dedication tone |

**Not chosen as default:** Midjourney (no first-party API suitable for automated funnel; privacy/community risk), DALL·E 3 (removed from OpenAI API May 2026), Ideogram (strong text-in-image — we keep text *out* of images).

---

## 2. Assumptions (explicit)

| Assumption | Value used |
|------------|------------|
| FX USD → BRL | **R$ 5,50 / US$ 1** (planning rate; re-quote monthly) |
| Preview | **2** images (cover + 1 inner) + full 12-page text draft |
| Full book art | **7** images average (range 6–8); preview assets **reused** → **+5** new images at production |
| Image size | Portrait page ~1024×1536 (~1.5 MP) |
| OpenAI Flare medium estimate | **US$ 0.06** / portrait image (token-priced; band ~0.04–0.09) |
| Flux.2 Pro estimate | **US$ 0.045** / portrait (~0.03 first MP + extra) |
| Text tokens / book | ~2.5k in + 2.5k out (Haiku 5.5) |
| Stripe Brazil (card) | **3.99% + R$ 0,39** |
| Taxes on digital sale | **~9%** effective on revenue (Simples / ISS+PIS/COFINS proxy — validate with accountant) |
| Ads CAC | Scenario table only (not fixed) |
| Retries | Preview: up to **2** free regenerations server-capped; production: **1** likeness repair budgeted |

> **Blocker:** no OpenAI / Anthropic / fal API keys in this environment — costs are estimates; run a live bake-off of 6 styles × 1 scene before locking vendor SLAs.

---

## 3. Provider comparison

### 3.1 Image APIs

| Provider / model | Est. US$ / image* | Est. R$ / image | Style control | Photo → likeness | Privacy / retention | Fit for Entre Nós |
|------------------|-------------------|-----------------|---------------|------------------|---------------------|-------------------|
| **OpenAI gpt-image-2.5-flare** (med) | 0.06 | **0,33** | Excellent | Strong (refs + edit) | API training opt-out / Enterprise ZDR; delete after job | **Default** |
| OpenAI gpt-image-2.5-sunburst (high) | 0.12–0.21 | 0,66–1,16 | Excellent | Strong | Same | Premium / rescue only |
| OpenAI gpt-image-1-mini (med)† | 0.015 | 0,08 | Good | OK | Same | Too weak for “realista”; retiring path |
| **FLUX.2 [pro]** (BFL/fal) | 0.03–0.05 | **0,17–0,28** | Very good | Good with Kontext | Short-lived gen; confirm DPA | **Economy alt** |
| FLUX.1 Kontext [pro] | ~0.04 | 0,22 | Good | Excellent edit | Same | Likeness repair |
| Ideogram 3 Quality | ~0.09–0.10 / MP | ~0,50 | Good | Weak | API terms | Skip (we don’t burn text into art) |
| Midjourney (3rd-party) | ~0.02–0.04 | 0,11–0,22 | Excellent aesthetic | Weak automation | Poor for PII photos | **Reject** |

\*Portrait book page. †Legacy band for comparison only.

### 3.2 Text APIs

| Provider / model | In / out per 1M tok | Est. R$ / book copy | PT-BR quality | Privacy | Fit |
|------------------|---------------------|---------------------|---------------|---------|-----|
| **Claude Haiku 5.5** | US$ 0.10 / 0.50 | **~R$ 0,01** | High for cost | No API training by default | **Default** |
| Claude Sonnet 5.5 | US$ 2 / 10 | ~R$ 0,17 | Excellent | Same | Polish / edge cases |
| GPT-4o-mini | US$ 0.15 / 0.60 | ~R$ 0,01 | Good | Opt-out / ZDR | Fallback |
| GPT-5.4-nano | US$ 0.20 / 1.25 | ~R$ 0,02 | Good | Same | Fallback |

Text cost is negligible vs images; optimize for **anti-invention discipline** and tone, not pennies.

### 3.3 Quality / privacy scorecard (qualitative)

| Criterion | OpenAI Flare | Flux.2 Pro | Claude text | Notes |
|-----------|--------------|------------|-------------|-------|
| Soft 3D / cinematic | ★★★★★ | ★★★★☆ | — | Flare slightly better “finish” control |
| Aquarela / vintage paper | ★★★★☆ | ★★★★★ | — | Flux often nicer pigment/grain |
| Comics / clean 2D | ★★★★★ | ★★★★☆ | — | Both fine with prompt packs |
| Character consistency | ★★★★☆ | ★★★★☆ w/ Kontext | — | Always pass 1–2 cropped face refs |
| LGPD / photo handling | ★★★★☆ w/ ZDR | ★★★☆☆ | ★★★★★ | Prefer own S3 + short TTL + ZDR |
| Ops / retries | ★★★★★ | ★★★★☆ | ★★★★★ | Official APIs + idempotent job IDs |

---

## 4. Cost model (BRL)

FX: **1 USD = R$ 5,50**.

### 4.1 Unit costs (chosen defaults)

| Unit | USD | BRL |
|------|-----|-----|
| 1× Flare medium portrait | 0.06 | **0,33** |
| 1× Flux.2 Pro portrait (alt) | 0.045 | **0,25** |
| Full book text (Haiku 5.5) | ~0.0015 | **0,01** |
| 1× likeness repair (edit) | 0.06 | **0,33** |

### 4.2 Preview vs full book (OpenAI default)

| Bundle | Images | Text | Gen cost (R$) | Notes |
|--------|--------|------|---------------|-------|
| **Preview** (cover + 1 page) | 2 | yes | **0,67** | Free to user; sunk CAC |
| Preview + **2 retries** (worst) | 2 + 2 | — | **1,34** | Cap retries server-side |
| **Full book** production delta | +5 | already paid | **1,65** | Reuses 2 preview images |
| **Full book** total gen (7 imgs + text) | 7 | yes | **2,32** | If counted from zero |
| Full + **1** production repair | +1 | — | **2,65** | Budgeted |

**Economy path (Flux for all 7):** preview R$ 0,50 · full R$ 1,76 · with 1 repair R$ 2,01.

### 4.3 Spreadsheet-style P&L vs R$ 49,90

| Line | Formula / note | R$ |
|------|----------------|----|
| Gross price | List | **49,90** |
| Stripe fee | 3.99% × 49,90 + 0,39 | **−2,38** |
| Net after payment | | **47,52** |
| Tax proxy 9% on gross | 0.09 × 49,90 | **−4,49** |
| Net after tax proxy | | **43,03** |
| Gen cost (full, OpenAI, no retry) | 7 × 0,33 + 0,01 | **−2,32** |
| Gen cost (w/ 1 repair) | | **−2,65** |
| **Contribution before ads** | after Stripe + tax + gen | **~40,4 – 40,7** |
| Ads CAC break-even (0 retries) | contribution ≈ ads | **≤ ~40** |
| Ads CAC break-even (incl. failed previews*) | see §4.4 | **lower** |

\*Failed / non-converting previews burn image cost with no Stripe revenue.

### 4.4 Preview conversion & ads

Assume preview gen **R$ 0,67** (OpenAI) and conversion rate **c** from preview → paid.

| Metric | Formula | Example c = 20% | Example c = 35% |
|--------|---------|-----------------|-----------------|
| Gen cost allocated per sale | 0,67 / c + 1,65 (delta) | 3,35 + 1,65 = **5,00** | 1,91 + 1,65 = **3,56** |
| Room for ads + ops | 43,03 − gen_alloc | **~38** | **~39** |
| Safe CAC target (buffer for retries/support) | ~70% of room | **~26** | **~27** |

**Rule of thumb:** keep **blended gen ≤ R$ 6 / paid book** (previews + retries included) and **Meta CAC ≤ R$ 25** for healthy margin at R$ 49,90.

### 4.5 Retry cost table

| Event | Extra images | Extra R$ (OpenAI) |
|-------|--------------|-------------------|
| 1 preview regen | +1 | 0,33 |
| 2 preview regens (cap) | +2 | 0,66 |
| 1 production likeness repair | +1 | 0,33 |
| Full style redo (rare, support) | +7 | 2,31 |

---

## 5. Photo retention & privacy (LGPD)

1. Upload → encrypt at rest in **our** S3-compatible bucket; short-lived signed URLs only.
2. Send **cropped face/refs** to image API — not the full album — when possible.
3. Prefer OpenAI **Zero Data Retention** (or equivalent contractual no-train) for photo-bearing calls; Anthropic API default is already no-train.
4. Delete provider-side artifacts per DPA; purge customer originals after delivery window (e.g. 30–90 days) unless user keeps an account later.
5. Never use Discord/Midjourney-style pipelines for customer photos.
6. Consent checkbox in funnel: purpose = generate personalized illustrations only.

---

## 6. Book art plan (fixed 12 pages → 7 illustrations)

Text is laid out by the app **separate** from images (no captions burned into art).

| # | Page(s) | Illustration brief (Ana & Pedro fixture) |
|---|---------|------------------------------------------|
| 1 | 1 Cover | Couple close, warm atmosphere, space for title overlay in app |
| 2 | 3–4 How they met | Coffee shop meet-cute, São Paulo café interior |
| 3 | 5–6 Chosen memory | Rain walk after first concert (umbrella, wet street lights) |
| 4 | 7–8 What makes them special | Quiet moment: his calm presence + her laugh (park bench or home sofa) |
| 5 | 9–10 Meaning of being together | Soft silhouette / shared glance, city dusk |
| 6 | 11 Next chapters | Looking forward together (path / horizon — no invented wedding/kids) |
| 7 | 12 Closing | Gentle farewell frame with room for names overlay |

Pages **2** (dedication) and text-heavy spreads rely on typography only or a very light decorative motif if needed — prefer **no extra gen** to protect margin.

---

## 7. Anti-invention (generation + copy)

Never invent marriage, engagement, children, trips, houses, pets, or major events absent from the draft. Prefer discreet transitions (“o tempo foi tecendo o cotidiano”) when details are thin. Same rules bind image prompts (no rings, cribs, passports, pregnancy cues unless provided).

---

## 8. Next verification step

With API keys: generate the **same rain-walk scene** in all 6 styles (OpenAI Flare med + Flux.2 Pro), score likeness/style, then lock per-style provider overrides if aquarela/vintage clearly prefer Flux.

**Media in this run:** illustrative comparison sheets under `/cursor/stores/self/media/quality/` (tool-generated stand-ins + HTML storyboard). Treat as composition/style direction until live API bake-off.
