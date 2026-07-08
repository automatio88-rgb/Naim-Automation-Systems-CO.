# Naim Automation Systems Co. — Landing Page

## Project Overview
- **Name**: Naim Automation Systems Co.
- **Goal**: Clean professional cream/gold landing page marketing automation systems to the 1,296 licensed NEA/KAPEA recruitment agencies in Kenya and beyond
- **Positioning**: "We build the systems that run recruitment agencies. More placements. Less paperwork."

## URLs
- **Sandbox Preview**: https://3000-i53k8zb6i5h7e18f226do-2e1b9533.sandbox.novita.ai
- **Production**: not yet deployed (Cloudflare Pages ready)

## Currently Completed Features
1. **Full landing page** — cream/white + luxury gold brand matching the company document suite:
   - Hero with stats bar (5 systems · 5-min response · 1,296-agency market)
   - Trust bar (NEA / KAPEA / Ministry of Labour / Musaned)
   - "Where agencies lose placements" 4-problem diagnosis section
   - The 5 Systems with alternating image/text rows
   - Flagship **"The Agency Brain™"** dark-gold panel
   - Naim Investments Ltd case-study section (metrics + testimonial slot)
   - 5-step professional process
   - 3-tier pricing with **KES/USD currency toggle**
   - Free Operations Audit lead form
   - Full footer + branded favicon
2. **Lead capture (our own speed-to-lead)** — form posts to `/api/leads`, stored in Cloudflare D1, with validation
3. **Scroll-reveal animations**, sticky header, fully mobile responsive
4. **Branded placeholder images** in every slot — replace with real images anytime, no code change needed

## Functional Entry URIs
| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Landing page |
| POST | `/api/leads` | Lead capture. JSON: `agency_name`*, `contact_name`*, `phone`*, `email`, `nea_reg_no`, `agency_size`, `main_challenge` |
| GET | `/api/leads?key=naim-admin-2026` | Admin: list latest 200 leads (**change this key before production**) |

## Image Slots — replace files in `public/static/images/` (keep the same filenames)
| File | Used in | Ratio |
|------|---------|-------|
| `hero.jpg` | Hero section | 5:4 |
| `system-speed-to-lead.jpg` | System 01 | 4:3 |
| `system-documents.jpg` | System 02 | 4:3 |
| `system-followup.jpg` | System 03 | 4:3 |
| `system-reactivation.jpg` | System 04 | 4:3 |
| `system-reporting.jpg` | System 05 | 4:3 |
| `flagship.jpg` | The Agency Brain panel | 4:3 |

After replacing images: `npm run build && pm2 restart webapp` (or just redeploy).

## Local Development
```bash
npm install
npx wrangler d1 migrations apply webapp-production --local
npm run build
pm2 start ecosystem.config.cjs   # serves on port 3000
```

## Data Architecture
- **Data Model**: `leads` table (agency, contact, phone, email, NEA reg no., size, challenge, status, timestamp)
- **Storage**: Cloudflare D1 (local SQLite in dev via `--local`)
- **Migration**: `migrations/0001_create_leads.sql`

## Features Not Yet Implemented
- Calendly embed (needs Calendly link)
- WhatsApp Business link in footer (needs number)
- Real testimonial from Naim Investments director (slot ready)
- Instant Telegram/WhatsApp notification on new lead (Hermes-side)
- Trilingual EN/SW/AR toggle
- Production Cloudflare Pages deployment + custom domain

## Recommended Next Steps
1. Replace the 7 placeholder images with final visuals
2. Add Calendly link, WhatsApp number, real email address
3. Change the admin key in `src/index.tsx`
4. Deploy to Cloudflare Pages production, create real D1 database
5. Companion professional document suite (quotation, contract, onboarding packet…)

## Deployment
- **Platform**: Cloudflare Pages (ready) — currently sandbox preview via PM2 + wrangler
- **Tech Stack**: Hono + TypeScript + Vite + Cloudflare D1 + vanilla JS/CSS (Playfair Display + Jost)
- **Status**: ✅ Active (sandbox)
- **Last Updated**: 2026-07-08
