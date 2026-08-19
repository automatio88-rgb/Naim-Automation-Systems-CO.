# Handoff: Client Onboarding Guide — Naim Automation Systems Co.

## Overview

An 8-page editorial onboarding guide delivered to new clients of **Naim Automation Systems Co.** (Mombasa, Kenya). Clients open the guide as a link on their smartphone and read through it before signing the Service Agreement. It sets expectations for how the engagement works: welcome, working hours, build & approval process, what the client needs to provide, payment structure, and the full step-by-step process.

The tone throughout is calm, humble, honest, professional and premium. Short sentences. No emojis, no hype, no exclamation marks. The visual system is warm-editorial — deep espresso dark pages alternating with warm cream pages, elegant Playfair Display serif headlines, thin Jost sans body copy, gold (#C8A24A) accents, giant italic serif page numerals (01–06), thin rules, generous whitespace, and warm natural-light editorial photography.

## About the Design Files

The files in this bundle are **design references created in HTML** — a prototype showing the intended look, page rhythm, typography, and layout. They are **not production code to copy directly**.

The task is to **recreate this design in the target codebase's existing environment** (React + Tailwind, Next.js, Astro, SwiftUI, Flutter, plain static HTML — whatever the client site uses) using its established patterns, component library and typography setup. The final deliverable is a mobile-legible web page served at `naim-automation.pages.dev/docs` (or wherever the final host lives), because clients read it on their phones through a link.

If no codebase exists yet, the recommended path is a small static site (Astro or plain HTML + CSS is ideal for this content) — no JavaScript framework is required.

## Fidelity

**High-fidelity (hifi).** All colors, typography, spacing, page numerals, and photography intent are final. Reproduce pixel-perfectly using the codebase's existing patterns.

The mocks were designed at a 1920×1080 canvas so they render crisply as a shareable "deck" on desktop, **but the final destination is a mobile web page**. The developer should port the same visual system into a mobile-first responsive layout — sections stack vertically on mobile, large serif headings scale down, generous whitespace is preserved, page numerals still appear as large italic serif numbers in the corner of each section.

## Screens / Views

The document has **8 pages** in a fixed reading order. Every page has:

- A top ribbon (title + section label) — small uppercase Jost, letter-spaced ~0.28em, muted color, 13px
- A large italic serif Playfair headline (see per-page sizes)
- Body content
- A bottom ribbon (guide name + page number)
- On pages 3–8: a giant italic serif page numeral (01–06) placed as a large decorative element in the bottom-right (or bottom-left on page 8)

Pages alternate between two background themes:

- **Dark pages** — background `#211812` (espresso), text `#efe6d6` (cream), muted `#a89680`, headline highlight `#f2e7cf`
- **Cream pages** — background `#efe6d6` (cream), text `#1b120c` (ink), muted `#7a6a52`, headline color `#1b120c`

Gold accent `#C8A24A` is used on both themes for: numerals, italic serif accents in headings, section markers, links, thin dividers between sections.

---

### Page 1 — Cover (dark, full-bleed photo)

- **Purpose**: Set the tone. Client sees this first.
- **Layout**: Full-bleed warm editorial photograph of a quiet minimalist desk with a smartphone in warm natural light. Dark linear gradient overlay from top and bottom (55% opacity top, 70% bottom) to keep text legible. Centered content column.
- **Content (centered, stacked)**:
  1. Circular "NA" mark — 76×76px circle, 1.4px gold border, gold "NA" letters in Playfair 24px, centered
  2. Eyebrow: `A GUIDE FOR NEW CLIENTS` — Jost 14px, tracked 0.34em, uppercase, gold `#C8A24A`
  3. Headline: **Your onboarding *guide*** — Playfair Display 150px, weight 500, line-height 0.98, `_guide_` in italic weight 400 color `#f7e9c6`. Break: "Your onboarding" on line 1, italic "guide" on line 2.
  4. Subline: `WELCOME TO NAIM AUTOMATION SYSTEMS CO.` — Jost 20px, uppercase, tracked 0.32em, warm cream `#d9c9a4`
- **Side ribbons** (top and bottom, edge-padded 88px / 56px):
  - Top left: gold dot + `NAIM AUTOMATION SYSTEMS CO.`
  - Top right: `MOMBASA · KENYA`
  - Bottom left: `CLIENT ONBOARDING`
  - Bottom right: `MMXXVI`

---

### Page 2 — Contents (cream, 2-column)

- **Purpose**: Table of contents.
- **Layout**: Grid — left column (~52%) content, right column (~48%) tall editorial photo of a warm cream interior with a wooden chair (image is inset from the right edge by ~90px so it looks framed by cream margin on top/bottom/right).
- **Left column**:
  - Eyebrow `IN THIS GUIDE` — gold `#b89040`, Jost 14px, tracked 0.34em
  - Headline: *Contents* — Playfair 150px italic weight 400, ink `#1b120c`
  - Numbered TOC list — 6 rows, each row a 3-column grid `[78px | 1fr | auto]`, 22px vertical padding, separated by 1px thin rules `rgba(43,31,24,0.22)`:
    - `01 · Welcome · — PAGE 03`
    - `02 · Guidelines · — PAGE 04`
    - `03 · Build & approval process · — PAGE 05`
    - `04 · What we need from you · — PAGE 06`
    - `05 · Contract & invoice · — PAGE 07`
    - `06 · The process · — PAGE 08`
  - Numerals in gold Playfair italic 24px; row title in Jost 22px weight 400 ink; page reference in Jost 14px muted, tracked 0.4em

---

### Page 3 — Welcome / Section 01 (dark, 2-column)

- **Purpose**: Personal welcome from the founder.
- **Layout**: Grid — left column (~57%) text, right column (~43%) portrait.
- **Left column**:
  - Eyebrow `SECTION 01` — gold
  - Headline: *Welcome.* — Playfair 140px italic weight 400, color `#f2e7cf`
  - Body — max-width 640px, Jost 19px weight 300, line-height 1.72, color `#d9c9a4`, three paragraphs (see Content Copy section below)
  - Signature block: 56px gold horizontal line + `M.A. SALMIN` on line 1 (Jost 13px weight 500, tracked 0.2em, cream) + `FOUNDER & SYSTEMS ARCHITECT` on line 2 (tracked 0.24em, warmer cream)
- **Right column**: Portrait photograph of the founder in warm natural light (cream/beige shirt, neutral background). Photo is inset from the right edge by 130px, from the top by 150px, from the bottom by 190px. Below the photo: caption `M.A. SALMIN` + `FOUNDER & SYSTEMS ARCHITECT`.
- **Decorative numeral**: `01` positioned bottom-right (130px right, 120px bottom), Playfair italic weight 400, 220px, gold `#C8A24A`.

---

### Page 4 — Guidelines / Section 02 (cream, 2-column body)

- **Purpose**: Working hours and communication channels.
- **Layout**: Full-width padding 170px top / 130px sides / 140px bottom. Eyebrow + big headline at top, then a two-column grid below (`gap: 120px`, `max-width: 1350px`).
- **Headline**: *Guidelines.* — Playfair 140px italic weight 400, ink
- **Left column — "Working hours & contact"**:
  - Kicker: `WORKING HOURS & CONTACT` — gold soft `#b89040`, Jost 12px, tracked 0.34em
  - Subhead: *When we are here.* — Playfair italic 26px weight 500
  - Definition list (4 rows), each row a flex justify-between with a small uppercase key on the left (Jost 13px tracked 0.2em muted) and value on the right (Jost 19px ink), 14px vertical padding, separated by thin rules:
    - Days · Monday — Friday
    - Hours · 09:00 — 18:00 EAT
    - Response · Within one business day
    - Emergencies · Prioritised
- **Right column — "How to reach us"**:
  - Kicker: `HOW TO REACH US`
  - Subhead: *Two clean channels.*
  - Three body paragraphs, Jost 19px weight 300 (see Content Copy below)
- **Decorative numeral**: `02` bottom-right, 220px, gold-soft `#b89040`.

---

### Page 5 — Build & Approval / Section 03 (dark)

- **Purpose**: Explain how the build progresses and how approvals work.
- **Layout**: Full-width padding. Eyebrow + headline, then an italic serif lede paragraph, then a two-column body block.
- **Headline**: `Build & approval *process.*` — Playfair 120px, weight 500 for "Build & approval", italic weight 400 for "process.", color `#f2e7cf`, max-width 1350px
- **Lede**: Playfair italic 32px weight 400, line-height 1.4, color `#e6d5ae`, max-width 1100px — "Every second counts. Once your deposit is received and your materials are in, the build begins."
- **Body**: Two columns (`gap: 100px`, `max-width: 1400px`), Jost 19px weight 300, line-height 1.75, color `#d9c9a4`. Two paragraphs (left + right — see Content Copy).
- **Decorative numeral**: `03` bottom-right, 220px, gold.

---

### Page 6 — What We Need / Section 04 (cream)

- **Purpose**: The client's checklist of what to hand over so the build can start.
- **Layout**: Full-width padding. Eyebrow + headline, italic serif lede, then a 2-column checklist grid (`gap: 14px 90px`, `max-width: 1500px`).
- **Headline**: `What we need *from you.*` — Playfair 120px
- **Lede**: *A few simple items keep your project on schedule.* — Playfair italic 22px, ink-soft `#3a2a1e`
- **Checklist** — 6 items, each item a 2-column grid `[60px | 1fr]`, 22px vertical padding, separated by thin rules `rgba(43,31,24,0.22)`. Left cell is a roman numeral (`i.` through `vi.`) in Playfair italic 22px gold-soft. Right cell has:
  - Title (`h4`) — Playfair 22px weight 500 ink
  - Body — Jost 16px weight 300 line-height 1.6 ink-soft
- **Items**:
  1. **One contact person** — Someone on your side authorised to give approvals — it keeps decisions clean and quick.
  2. **Access credentials** — Logins for the accounts your system will connect to, shared securely — never by plain text.
  3. **A short walkthrough** — Fifteen minutes on how things are done today, so we build around your real workflow.
  4. **Sample data** — A handful of example records — anonymised is perfectly fine.
  5. **Branding assets** — Your logo and preferred wording, so every document your system generates feels like you.
  6. **The deposit** — Your timeline starts the day it is received.
- **Decorative numeral**: `04` bottom-right, 220px, gold-soft.

---

### Page 7 — Contract & Invoice / Section 05 (dark)

- **Purpose**: Payment structure and the link to review/sign documents.
- **Layout**: Eyebrow + headline, body paragraph, then a two-column "terms" grid, then a second body paragraph, then a call-to-action bar with the sign-your-docs link.
- **Headline**: `Contract & *invoice.*` — Playfair 120px
- **Body 1**: Jost 19px weight 300, color `#d9c9a4`, max-width 1100px — "Please be aware that no work is carried out until the Service Agreement has been signed and the deposit has been received. Our payment structure is simple, and there are no surprises along the way."
- **Terms grid**: 2 columns (`gap: 60px`, `max-width: 1100px`). Each cell has a top border in `rgba(232,215,180,0.22)`, 22px top padding:
  - `k`: Playfair italic 22px weight 500, gold — "50% deposit" · "50% balance"
  - `v`: Jost 17px weight 300, color `#d9c9a4`, line-height 1.6 — "To begin — timeline starts the day it is received." · "Only after you watch your finished system perform live in a demonstration."
- **Body 2**: "The monthly care plan — hosting, upkeep, monitoring and support — begins the month after final delivery."
- **Link CTA**: Absolutely positioned bar at bottom (left 130px / right 130px / bottom 180px). Padding 36px 44px. Border `1px solid rgba(232,215,180,0.22)`. Very faint cream tint background `rgba(232,215,180,0.03)`. Flex justify-between:
  - Left: `REVIEW & SIGN FROM YOUR PHONE` — Jost 14px tracked 0.24em uppercase muted
  - Right: `naim-automation.pages.dev/docs` — Playfair italic 30px weight 500, gold `#C8A24A`
- **Decorative numeral**: `05` bottom-right, 220px, gold.

---

### Page 8 — The Process + Thank You / Section 06 (cream, 2-column)

- **Purpose**: The full step-by-step engagement summary plus the final closing note.
- **Layout**: Grid `1.1fr / 0.9fr`, gap 100px. Padding 150px top / 130px sides / 130px bottom.
- **Left column — The Process**:
  - Eyebrow `SECTION 06`
  - Headline: `The *Process.*` — Playfair 100px
  - Steps list — same layout pattern as the checklist on page 6 but with digit numerals (`01`–`05`):
    - 01 **Book appointment** — A short consultation so we truly understand your needs before proposing anything.
    - 02 **Quotation & agreement** — An itemised quote and Service Agreement — review and sign from your phone.
    - 03 **We build your system** — Roughly 7–21 business days, with progress updates so you are never in the dark.
    - 04 **Live demo & training** — You see it work before the balance. A short training session for your team follows.
    - 05 **Handover & care** — Owner's manual delivered, then the optional monthly care plan takes over.
- **Right column** — vertical stack:
  1. **Message box** — solid espresso `#211812`, padding 56px 52px, color cream
     - Eyebrow: `A FINAL NOTE` — gold
     - Headline: *We can't wait to get started.* — Playfair italic 52px weight 400, color `#f2e7cf`, line-height 1.05
     - Body: "If you have any questions regarding your onboarding, please don't hesitate to contact us on WhatsApp." — Jost 16px weight 300 line-height 1.65 `#d9c9a4`
  2. **Thank-you photo strip** — warm editorial flat-lay of cream paper letter tiles spelling THANK YOU on espresso linen, minimum height 280px, `object-fit: cover`. Overlay caption in bottom-left: *Thank you.* — Playfair italic 24px, cream, soft text shadow.
- **Decorative numeral**: `06` positioned bottom-**left** (130px left, 120px bottom), 220px, gold-soft.

---

## Interactions & Behavior

This is a **read-only editorial document**, not an app. Interaction is minimal:

- **Vertical scroll** on mobile (each page flows into the next as continuous scroll sections). On desktop the current HTML mock uses a slide-deck stage; for the production port, treat each page as a full-viewport-height section (or auto-height responsive section) and let the user scroll.
- **The URL on page 7** (`naim-automation.pages.dev/docs`) should be a real anchor link to the sign-documents flow — hover state: increase gold saturation slightly, add underline.
- **WhatsApp mention on page 8** — optionally wrap "contact us on WhatsApp" in a `wa.me/...` link (final number supplied at deployment).
- **No animations required.** If anything, a gentle fade-up on section entry as the user scrolls (200–300ms, ease-out, translateY(12px) → 0) is welcome but strictly optional and must remain subtle.
- **No hover complexity** — no cards that transform, no reveal effects. This is print-editorial in the browser.

## State Management

None. This is a static content page. No state, no forms, no fetching.

## Design Tokens

### Colors

```
--espresso        #211812   /* dark page background */
--espresso-2      #2b1f18   /* secondary espresso */
--cream           #efe6d6   /* cream page background, dark-page body text */
--cream-2         #e6dcc8
--paper           #f4ecdc
--ink             #1b120c   /* cream-page body text */
--ink-soft        #3a2a1e   /* cream-page secondary text */
--gold            #C8A24A   /* primary gold accent (dark pages) */
--gold-soft       #b89040   /* gold on cream pages */
--muted-dark      #a89680   /* dark-page ribbon/meta text */
--muted-light     #7a6a52   /* cream-page ribbon/meta text */
--rule-dark       rgba(232,215,180,0.22)   /* rules on dark pages */
--rule-light      rgba(43,31,24,0.22)      /* rules on cream pages */
--headline-cream  #f2e7cf   /* headline color on dark pages */
--headline-warm   #f7e9c6   /* italic accent color on dark headlines */
--body-warm       #d9c9a4   /* body text color on dark pages */
```

### Typography

- **Headline serif**: `Playfair Display`, weights 400, 500, 600; italic 400 used heavily for gold accent words and section subheads
- **Body sans**: `Jost`, weights 300 and 400 (light body copy is signature)
- **Load from Google Fonts**:
  ```html
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;1,400&family=Jost:wght@300;400;500&display=swap" rel="stylesheet">
  ```

### Typographic scale (desktop / 1920px canvas)

| Role | Font | Size | Weight | Line-height | Letter-spacing |
|---|---|---|---|---|---|
| Cover H1 | Playfair | 150px | 500 | 0.98 | -0.015em |
| Section H1 (large) | Playfair | 140px | 500 | 0.92 | -0.015em |
| Section H1 (medium) | Playfair | 120px | 500 | 0.94 | -0.015em |
| Process H1 | Playfair | 100px | 500 | 0.95 | -0.015em |
| Final-note H2 | Playfair italic | 52px | 400 | 1.05 | -0.01em |
| Italic lede | Playfair italic | 32px | 400 | 1.4 | — |
| Subhead | Playfair italic | 26px | 500 | — | — |
| Body large | Jost | 22px | 300 | 1.6 | — |
| Body | Jost | 19px | 300 | 1.72–1.75 | — |
| Body small | Jost | 16–17px | 300 | 1.6–1.65 | — |
| Eyebrow | Jost | 14px | 400 | — | 0.34em, uppercase |
| Ribbon meta | Jost | 12–13px | 400 | — | 0.24–0.30em, uppercase |
| Big numeral (01–06) | Playfair italic | 220px | 400 | 0.85 | -0.03em |

### Responsive scaling (mobile ~375px)

Halve the desktop headline sizes as a starting point, then tune. Suggested mobile scale:

| Role | Mobile size |
|---|---|
| Cover H1 | 56px |
| Section H1 (large) | 48px |
| Section H1 (medium) | 42px |
| Final-note H2 | 32px |
| Italic lede | 22px |
| Body | 16–17px |
| Eyebrow / ribbon | 11–12px |
| Big numeral | 120px |

Preserve generous whitespace on mobile (min side padding 24px, min section vertical padding 80px). Two-column grids collapse to single-column stacks. Page numerals stay in the corner but slightly smaller.

### Spacing scale

The design uses a loose editorial spacing scale rather than a strict 4px/8px grid. Rough tokens:

```
xs   6px
sm   14px
md   22px
lg   36px
xl   56px
2xl  90px
3xl  130px  (side page padding on desktop)
4xl  170px  (top-of-page vertical padding on desktop)
```

### Rules & borders

- Thin rules between rows: **1px solid** in `--rule-dark` or `--rule-light` depending on page background.
- The CTA bar on page 7 uses a **1px solid** rule and no border-radius.
- The founder photo frame and the interior photo frame on the contents page are unrounded (sharp rectangular crops). **Border-radius: 0 everywhere.** No rounded corners in this design.

### Shadows

None. The only shadow is a very soft text-shadow on the "Thank you." caption on the page-8 photo strip: `0 2px 12px rgba(0,0,0,.5)`.

### Vignette (dark pages)

Each dark page has a subtle radial vignette overlay:
```css
background: radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 40%, rgba(0,0,0,.35) 100%);
pointer-events: none;
```

### Paper grain (all pages)

A very soft two-layer noise-dot pattern is composited over every slide at low opacity to give the paper texture:
```css
background-image:
  radial-gradient(rgba(255,255,255,0.015) 1px, transparent 1px),
  radial-gradient(rgba(0,0,0,0.02) 1px, transparent 1px);
background-size: 3px 3px, 5px 5px;
background-position: 0 0, 1px 2px;
mix-blend-mode: overlay;
opacity: .6;
```
This is optional on production and can be dropped on mobile to save bytes.

---

## Content Copy (verbatim — use exactly)

**Page 1 — Cover**
- Eyebrow: `A guide for new clients`
- Headline: `Your onboarding guide` (with "guide" italic on its own line)
- Sub: `Welcome to Naim Automation Systems Co.`

**Page 2 — Contents**
- `01 Welcome`
- `02 Guidelines`
- `03 Build & approval process`
- `04 What we need from you`
- `05 Contract & invoice`
- `06 The process`

**Page 3 — Welcome**
> Thank you for choosing Naim Automation Systems Co. as your automation partner. We are thrilled to formally welcome you.
>
> We help businesses stop wasting time on admin. We build systems that answer every enquiry in minutes, keep records neat and searchable, and put your whole business in your pocket — so your team focuses on the work that matters, not paperwork.
>
> This guide explains what to expect at every step of working with us. Keep it close — it answers most questions before they arise.
>
> — **M.A. Salmin**, Founder & Systems Architect

**Page 4 — Guidelines**
Left column:
- Days — Monday — Friday
- Hours — 09:00 — 18:00 EAT
- Response — Within one business day
- Emergencies — Prioritised

Right column:
> All communication runs through your dedicated Email and WhatsApp channel.
>
> Kindly consolidate feedback through your appointed contact person — it keeps your project on schedule.
>
> Questions answered within one business day; one weekly summary during the build so you always know where we are.

**Page 5 — Build & Approval Process**
- Lede: *Every second counts. Once your deposit is received and your materials are in, the build begins.*
- Left body: We engineer your system and send progress updates so you are never in the dark. Nothing goes live without your approval — you review, we refine, and only what you approve is deployed.
- Right body: If you'd like to make changes at any stage, simply tell your contact person. Changes are always possible; they are simply quoted in writing first, so there are never surprises on the invoice.

**Page 6 — What We Need From You**
- Lede: *A few simple items keep your project on schedule.*
- (Six items — see Screens > Page 6 above)

**Page 7 — Contract & Invoice**
> Please be aware that no work is carried out until the Service Agreement has been signed and the deposit has been received. Our payment structure is simple, and there are no surprises along the way.
>
> **50% deposit** — To begin — timeline starts the day it is received.
> **50% balance** — Only after you watch your finished system perform live in a demonstration.
>
> The monthly care plan — hosting, upkeep, monitoring and support — begins the month after final delivery.
>
> Review & sign from your phone → `naim-automation.pages.dev/docs`

**Page 8 — The Process + Thank You**
- (Five steps — see Screens > Page 8 above)
- Final note: *We can't wait to get started.*
- Below: "If you have any questions regarding your onboarding, please don't hesitate to contact us on WhatsApp."

---

## Assets

All photography is warm-editorial, natural light, cream-and-espresso palette. **These are AI-generated reference photos** — before production, either commission real photography of Mombasa desks / interiors / the founder, or license editorial photography in the same mood. The following image files are included in this bundle (all JPG, roughly 1200–1400px on the long edge):

| File | Aspect | Use | Notes |
|---|---|---|---|
| `assets/cover.jpg` | 16:9 landscape | Page 1 full-bleed cover | Minimalist desk + smartphone in warm morning light. Overlay 55–70% dark gradient for text legibility. |
| `assets/agenda.jpg` | 3:4 portrait | Page 2 right column | Warm cream interior corner with wooden chair. |
| `assets/founder.jpg` | 3:4 portrait | Page 3 right column | **Replace with a real portrait of M.A. Salmin before shipping.** |
| `assets/guidelines.jpg` | 3:4 portrait | (unused in current layout; reserved) | Hands holding a smartphone, warm tones. |
| `assets/process.jpg` | 4:3 landscape | (unused in current layout; reserved) | Open notebook + fountain pen. |
| `assets/thankyou.jpg` | 16:9 landscape | Page 8 right column bottom strip | Flat-lay of cream paper letter tiles spelling THANK YOU on espresso linen. |

**Icons**: The design uses thin-stroke minimal line icons only (checkmarks, shields, documents, phones) — the current mock does not include any icon assets because the layout does not require them. If icons are added during production, use a premium thin-line set (Phosphor Duotone Light, Lucide with `stroke-width={1.25}`, or a bespoke SVG set) — never emoji, never filled or cartoonish icons.

**Logo mark**: A circular "NA" monogram — 1.4px gold `#C8A24A` circular outline, "NA" letters in Playfair 500 gold. Available at 56px (in-page use) and 76px (cover use). Currently rendered as HTML/CSS (see `.na-mark` class in the reference HTML). A dedicated SVG export can be produced on request.

---

## Files

| File | Description |
|---|---|
| `Onboarding Guide.html` | The primary design reference. Self-contained 8-page HTML deck using Google Fonts + local images from `assets/`. Open in a browser to see the intended visual output. Uses a slide-deck stage component (`deck_stage.js`) for arrow-key navigation and PDF export at 1920×1080; **the production port does not need this stage** — port each `<section class="slide …">` into a mobile-first responsive section. |
| `assets/*.jpg` | Photography references — see the Assets table above. |

## Production Notes

- **Mobile is the primary target.** The client opens this link on their phone. Design/verify mobile first (375–430px). Desktop should look great too but is secondary.
- **Do not add anything that isn't in this spec.** No CTAs, no signup forms, no marketing banners, no testimonials, no pricing. The brand voice explicitly rejects hype and filler. Every page earns its place.
- **Do not use emojis anywhere.** Ever.
- **Do not add exclamation marks** to any body copy — the brand voice does not use them.
- **Keep the gold accent restrained** — it appears only on numerals, italic accent words in headlines, section markers, and links. Do not tint buttons or backgrounds gold.
- **Preserve the italic-serif accent word pattern** in headlines: the last one or two words of most headlines are italic Playfair, and act as a rhythmic device throughout the document (`your onboarding *guide*`, `*Contents*`, `*Welcome.*`, `*Guidelines.*`, `Build & approval *process.*`, `What we need *from you.*`, `Contract & *invoice.*`, `The *Process.*`). This is signature.
- **The Kenya Data Protection Act (2019) commitment** is a brand pillar but is not printed inside this onboarding document. It belongs in the Service Agreement and the site footer, not here. Do not add it to any page.
- **Final URL** on page 7 (`naim-automation.pages.dev/docs`) is a placeholder — the developer should parameterise this so it can be swapped at deployment.

That's the full brief. A developer picking this up should be able to implement the design in the target codebase without reference to the original chat.
