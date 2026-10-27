# Funnel events & margin

## Internal events (server + client)

Stored in `FunnelEvent` and exposed at `GET /analytics/funnel` and admin.

| Event | When |
|-------|------|
| `visit` | Landing |
| `create_started` | Draft created (`POST /drafts`) |
| `photos_uploaded` | Draft has both photo keys |
| `style_chosen` | Style saved |
| `memories_done` | Three answers saved |
| `preview_ready` | Preview job finished |
| `checkout` | Checkout session created |
| `payment` | Paid (webhook or mock) |
| `delivery` | PDF ready |

## Meta

| Event | Where |
|-------|-------|
| `ViewContent` | Landing |
| `InitiateCheckout` | Review CTA |
| `Purchase` | `/sucesso` |

Client Pixel stub + server CAPI stub share the same event names; pass `eventID` for dedup when possible.

## Reading bottlenecks

1. Pull Meta Events Manager for ad → landing → checkout → purchase.
2. Compare internal counts in order above.
3. Largest relative drop = optimization target (creative, photo UX, style clarity, preview quality, price trust).

## Cost / margin formula

```
margem_unitaria ≈ 49,90
  − taxa_pagamento
  − custo_geração_livro   # inclui rateio de prévias não convertidas
  − custo_ads_atribuído
  − impostos
  − custo_atendimento

margem_% = margem_unitaria / 49,90
```

Track also: cost/preview, cost/book, regen rate, production failures, refunds.
