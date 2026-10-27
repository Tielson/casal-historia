# Entre Nós — style prompt packs (Phase 1)

Each style is a **complete package**: line/form language + palette + lighting + finish. Do not mix packs.  
**Fixture (reuse):** Ana (woman, warm medium skin, dark wavy shoulder-length hair, expressive smile) & Pedro (man, light-olive skin, short brown hair, calm soft eyes, light stubble). Met at a São Paulo coffee shop; signature memory = rain walk after first concert.

**Global rules (append to every positive prompt):**
- Couple book illustration, single cohesive scene, no collage
- Text, letters, logos, watermarks, UI **absent** from the image (app lays out copy separately)
- Keep likeness consistent with reference photos when provided
- Brazilian urban context when place matters; avoid tourist clichés unless asked
- Same wardrobe continuity across the book unless the scene requires change (e.g. concert → rain coats)

**Global negative prompt (append always):**
```
text, letters, typography, watermark, logo, signature, frame border, split screen, collage,
extra fingers, deformed hands, extra limbs, duplicate faces, uncanny eyes,
wedding dress, bridal veil, engagement ring close-up, pregnancy, baby, children,
passport, airplane cabin, luxury yacht, invented landmarks,
nsfw, erotic, violence, horror, gore
```

**Character consistency block (inject after style pack):**
```
Character lock: Ana — [age cue from photos], dark wavy hair to shoulders, warm smile, [outfit from ref].
Pedro — short brown hair, calm expression, light stubble, [outfit from ref].
Same two people in every page of this book; do not age-swap or swap genders.
Use attached face reference images for identity; stylize only as the chosen art style requires.
```

---

## 1. Animação 3D

**Package:** expressive soft forms · rounded volumes · warm golden light · subtle subsurface feel · clean stylized 3D (Pixar-adjacent, not hyper-real)

**Positive pack:**
```
Stylized 3D animation still, soft rounded forms, appealing character design,
gentle subsurface scattering on skin, velvet-soft materials,
warm golden key light with soft amber rim, shallow cinematic depth of field,
cozy emotional storytelling, polished render, slight filmic bloom,
no photoreal pores, no uncanny valley
```

**Negative add-ons:**
```
photoreal skin pores, grimy texture, harsh neon, flat 2D cel, claymation crumbs, low-poly game asset
```

**Lighting:** golden hour key 35–45°, soft fill, amber rim.  
**Finish:** polished PBR, gentle bloom, clean edges.

---

## 2. Aquarela romântica

**Package:** delicate watercolor · visible paper tooth · rose / beige / pastel · soft blooms · romantic restraint

**Positive pack:**
```
Romantic watercolor illustration on textured cold-press paper,
delicate translucent washes, soft pigment blooms, gentle wet-on-wet edges,
palette of dusty rose, warm beige, soft blush, muted sage accents,
pencil underdrawing barely visible, airy negative space,
intimate and tender mood, fine art storybook watercolor
```

**Negative add-ons:**
```
digital hard outlines, neon colors, oily thick impasto, photoreal photo, comic ink, heavy black shadows
```

**Lighting:** diffuse daylight through wash; avoid hard specular.  
**Finish:** paper grain, soft blooms, limited dry-brush accents.

---

## 3. Desenho de romance

**Package:** clean 2D editorial illustration · soft base tones · selective vibrant accents · clear shapes

**Positive pack:**
```
Clean contemporary 2D romance illustration, confident simple shapes,
soft muted base tones with selective vibrant accents (coral, teal, or warm yellow),
smooth vector-like fills with subtle texture, elegant composition,
modern Brazilian editorial picture-book feel, clear silhouettes,
friendly and polished, balanced negative space
```

**Negative add-ons:**
```
messy sketch lines, grunge, photoreal, 3D render, watercolor bleeds, manga screentones overload
```

**Lighting:** soft ambient + one clean accent light.  
**Finish:** flat-to-soft shading, crisp edges, restrained grain.

---

## 4. Realista cinematográfico

**Package:** photo-near · natural skin & fabric · warm practical light · shallow DOF · film still

**Positive pack:**
```
Cinematic photoreal still, natural skin texture, believable fabric,
warm practical lighting, soft bokeh, 50mm look, gentle filmic contrast,
natural color grade with warm highlights and controlled shadows,
intimate couple storytelling, documentary-romance mood,
high detail but not HDR-glazed
```

**Negative add-ons:**
```
cartoon, anime, watercolor paper, comic halftone, oversaturated HDR, beauty-filter plastic skin,
dramatic storm lightning, horror shadows
```

**Lighting:** warm key (lamps / sunset), soft fill, realistic catchlights.  
**Finish:** mild film grain, naturalistic color, no heavy stylization.

---

## 5. Quadrinhos

**Package:** bold ink · graphic panel-aware composition · vivid contrast · dynamic but readable

**Positive pack:**
```
Bold comic-book illustration, clean ink outlines, vivid color fills,
strong contrast, graphic shapes, slight screentone or flat shading,
dynamic but intimate couple moment, modern graphic novel romance,
single full-bleed scene (not a multi-panel page), clear silhouettes,
expressive faces without exaggeration into caricature
```

**Negative add-ons:**
```
photoreal, soft watercolor only, muddy greys, horror comic gore, superhero costumes,
crowded multi-panel grid inside the image
```

**Lighting:** graphic spotting; hard readable shadows OK.  
**Finish:** ink + flat color, optional light screentone, high clarity.

> App may add panel frames in layout; **do not** generate multi-panel grids inside the art unless explicitly requested.

---

## 6. Livro vintage

**Package:** nostalgic print · cream / terracotta / olive / sepia · soft wear · classic keepsake

**Positive pack:**
```
Vintage keepsake book illustration, nostalgic print feel,
cream paper ground, terracotta, olive green, and sepia tones,
soft aged edges, gentle vignette, classic mid-century romantic plate,
subtle print texture and slight ink irregularity,
warm memory mood, timeless and tender
```

**Negative add-ons:**
```
neon cyberpunk, ultra-sharp digital gloss, modern UI gradients, photoreal HDR, manga eyes
```

**Lighting:** soft sepia-warm lamp light.  
**Finish:** paper cream, mild aging, restrained grain — not distressed ruin.

---

## Scene prompt templates (Ana & Pedro)

Replace `{STYLE_PACK}` and `{CHARACTER_LOCK}`. Keep anti-invention.

### Cover
```
{STYLE_PACK}
{CHARACTER_LOCK}
Cover-worthy portrait of Ana and Pedro together, warm intimate atmosphere,
gentle eye contact, cozy composition with negative space on the upper third for later title overlay by the app,
no text in the image
```

### How they met — coffee shop
```
{STYLE_PACK}
{CHARACTER_LOCK}
São Paulo neighborhood coffee shop interior, first meeting moment,
cups on a small wooden table, shy smile exchange, afternoon light through window,
everyday Brazilian café, no wedding cues
```

### Chosen memory — rain walk after concert
```
{STYLE_PACK}
{CHARACTER_LOCK}
Night rain walk after a concert, shared umbrella, wet asphalt reflections,
streetlights glow, joyful close conversation, casual concert-night clothes,
city side street, romantic but grounded, no rings or wedding imagery
```

### What makes them special
```
{STYLE_PACK}
{CHARACTER_LOCK}
Quiet everyday tenderness: Pedro’s calm presence beside Ana mid-laugh,
sofa or park bench, soft interior/outdoor light, focus on emotional contrast of calm and laugh,
no children, no proposal props
```

### Meaning of being together
```
{STYLE_PACK}
{CHARACTER_LOCK}
Two figures sharing a dusk city overlook or window light, peaceful closeness,
sense of partnership and home in each other, abstract enough to avoid inventing life events
```

### Next chapters
```
{STYLE_PACK}
{CHARACTER_LOCK}
Ana and Pedro walking forward along a tree-lined path or quiet street,
hopeful future mood, open-ended journey, do NOT show wedding, pregnancy, babies, or travel airports
```

### Closing
```
{STYLE_PACK}
{CHARACTER_LOCK}
Gentle farewell frame, couple in soft light, serene closing mood,
ample clean negative space for name typography overlay by the app, no text rendered
```

---

## Provider notes per style (from bake-off)

| Style | Preferred engine | Notes |
|-------|------------------|-------|
| Animação 3D | OpenAI Flare med | Best soft-volume control |
| Aquarela romântica | Flux.2 Pro **or** Flare | Compare paper tooth; Flux often wins pigment |
| Desenho de romance | OpenAI Flare med | Clean shapes, accent color |
| Realista cinematográfico | OpenAI Flare med / high | Likeness + photo refs |
| Quadrinhos | OpenAI Flare med | Bold lines stable |
| Livro vintage | Flux.2 Pro **or** Flare | Sepia cream finish |

Ship **one default engine per style** after the live API bake-off; until then use OpenAI Flare medium for all six for operational simplicity.
