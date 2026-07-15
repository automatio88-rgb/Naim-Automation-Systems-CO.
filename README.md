# Naim Automation Systems Co. — Landing Page + Digital Document Suite

## Project Overview
- **Name**: Naim Automation Systems Co.
- **Founder**: M.A. Salmin (Founder & Systems Architect, Mombasa, Kenya)
- **Goal**: Premium cream/gold platform selling AI automation systems to the 1,296 licensed NEA/KAPEA recruitment agencies in Kenya — landing page rebuilt on Alex Hormozi's direct-response principles, plus a fully interactive digital document suite clients can read, fill and **sign on their phone screen**.
- **Positioning**: "Never lose another candidate to a slow reply."

## URLs
- **Sandbox Preview**: https://3000-i53k8zb6i5h7e18f226do-2e1b9533.sandbox.novita.ai
- **Document Portal**: https://3000-i53k8zb6i5h7e18f226do-2e1b9533.sandbox.novita.ai/docs
- **GitHub**: https://github.com/automatio88-rgb/Naim-Automation-Systems-CO.
- **Production**: not yet deployed (Cloudflare Pages ready)

## Functional Entry URIs
| Path | Method | Purpose |
|------|--------|---------|
| `/` | GET | Hormozi-principle landing page (one action: free audit) |
| `/docs` | GET | Client Document Portal (hub of 4 signable documents) |
| `/docs/quotation` | GET | Interactive Quotation — itemised % fee table, fill-ins, signature |
| `/docs/agreement` | GET | Interactive Service Agreement — 13 clauses, signature |
| `/docs/founding-partner` | GET | Founding Partner Offer — 7 programme terms, signature |
| `/docs/onboarding` | GET | Welcome & Onboarding Packet — acknowledge + signature |
| `/api/leads` | POST | Landing page audit-request form → D1 `leads` |
| `/api/leads?key=ADMIN_KEY` | GET | Admin: list leads |
| `/api/docs/submit` | POST | Signed-document submission (name, agency, fields JSON, base64 signature) → D1 `doc_submissions` |
| `/api/docs/submissions?key=ADMIN_KEY` | GET | Admin: list submissions (without signature blobs) |
| `/api/docs/submissions/:id?key=ADMIN_KEY` | GET | Admin: full submission incl. signature PNG data-URL |

Admin key: `naim-admin-2026` (change before production).

## Currently Completed Features
1. **Hormozi-rebuilt landing page** (`src/landing.tsx`):
   - Above-the-fold: headline → proof stack → ONE CTA (`#audit`)
   - Value Equation structure: dream outcome, perceived likelihood (case metrics), time delay (7–21 days), effort (we build it for you)
   - Pain section with KES/USD cost-of-inaction math, 5 systems, flagship Agency Brain™ panel
   - Risk reversal (50/50 + live demo before balance), ethical scarcity (Founding Partner ×3), FAQ, single audit form
   - Currency toggle KES/USD (localStorage), scroll reveals, sticky topbar
2. **Interactive Digital Document Suite** (slide-deck styling, gold/cream, full-screen cover slides):
   - Signature pad: HTML5 canvas, touch + mouse, devicePixelRatio-sharp, clear/redo
   - Fill-in-the-blank golden fields collected into `fields_json`
   - Agree checkbox + validation + instant submit → success seal panel
   - All submissions stored in Cloudflare D1 with IP + user-agent audit trail
3. **8-PDF print document suite** (`documents/pdf/`) — WeasyPrint A4, all verified page-exact
4. **APIs** — leads capture + document submissions with admin endpoints

## Data Architecture
- **Storage**: Cloudflare D1 (SQLite)
- **Tables**:
  - `leads` (0001): agency_name, contact_name, phone, email, agency_size, main_challenge, created_at
  - `doc_submissions` (0002): doc_type, client_name, agency_name, email, phone, fields_json, signature_data (base64 PNG), agreed, ip, user_agent, created_at
- **Data Flow**: browser → axios POST → Hono API → D1; admin reads via keyed GET endpoints

## User Guide
1. **Prospect** visits `/`, reads, submits the free-audit form.
2. **Client** receives a link e.g. `/docs/quotation`, taps it on their phone → browser opens a full-screen premium document → fills the golden blanks → draws signature with finger → ticks agree → **Submit** → you receive everything instantly in D1 (view via `/api/docs/submissions?key=...`).

## Tech Stack
Hono + TypeScript + Vite → Cloudflare Pages · Cloudflare D1 · TailwindCSS-free hand-crafted CSS (Playfair Display + Jost) · PM2 + Wrangler local dev

## Development
```bash
npm run build
pm2 start ecosystem.config.cjs        # wrangler pages dev dist --d1 ... --local (port 3000)
npm run db:migrate:local              # apply migrations
```

## Deployment
- **Platform**: Cloudflare Pages (ready; not yet deployed to production)
- **Status**: ✅ Sandbox active
- **Next Steps**: user approval of preview → production deploy → Lead Generation System Machine
- **Last Updated**: 2026-07-15
