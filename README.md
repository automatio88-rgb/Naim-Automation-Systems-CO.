# Naim Automation Systems Co. — Landing Page + Digital Document Suite

## Project Overview
- **Name**: Naim Automation Systems Co.
- **Founder**: M.A. Salmin (Founder & Systems Architect, Nairobi, Kenya)
- **Goal**: Premium platform selling AI automation systems to the 1,296 licensed NEA/KAPEA recruitment agencies in Kenya — a calm Paperless-style landing page, plus a **two-document Client Portal** where clients read, fill and **sign on their phone screen**, live during a Google Meet consultation.
- **Positioning**: "Turn agency admin from Chaos into Clean systems on your phone."
- **Brand**: NaiM Agency logo (transparent gold mark) placed across the landing page, portal, documents and favicons.

## URLs
- **Sandbox Preview**: https://3000-i53k8zb6i5h7e18f226do-2e1b9533.sandbox.novita.ai
- **Document Portal**: https://3000-i53k8zb6i5h7e18f226do-2e1b9533.sandbox.novita.ai/docs
- **GitHub**: https://github.com/automatio88-rgb/Naim-Automation-Systems-CO.
- **Production**: not yet deployed (Cloudflare Pages ready)

## Functional Entry URIs
| Path | Method | Purpose |
|------|--------|---------|
| `/` | GET | Paperless-style landing page (one action: Book Appointment; no `/docs` link shown to visitors) |
| `/docs` | GET | Client Document Portal — **single fixed screen, zero scrolling**; 2 documents, START HERE flow, progress-based unlock |
| `/docs/onboarding` | GET | Step 1 · Welcome & Onboarding Guide — **full-screen slide deck (10 pages, zero scrolling)**, side arrows, read-confirm gates, founder photo, acknowledge + signature |
| `/docs/quotation` | GET | Step 2 · **Quotation & Service Agreement Contract** — **full-screen slide deck (11 pages, zero scrolling)**: quotation (Part I) + 13 contract clauses (Part II), fill-ins, present-date button, signature. **Locked until Step 1 is signed** |
| `/docs/agreement` | GET | 302 → `/docs/quotation` (merged into the contract) |
| `/docs/founding-partner` | GET | 302 → `/docs` (retired from portal) |
| `/api/leads` | POST | Landing page audit-request form → D1 `leads` |
| `/api/leads?key=ADMIN_KEY` | GET | Admin: list leads |
| `/api/docs/submit` | POST | Signed-document submission (name, agency, fields JSON, base64 signature) → D1 `doc_submissions` |
| `/api/docs/submissions?key=ADMIN_KEY` | GET | Admin: list submissions (without signature blobs) |
| `/api/docs/submissions/:id?key=ADMIN_KEY` | GET | Admin: full submission incl. signature PNG data-URL |

Admin key: `naim-admin-2026` (change before production).

## Currently Completed Features
1. **Landing page on the Paperless model** (`src/landing.tsx`) — white, calm, Jost 300, gold #C8A24A pills, SVG icons only, no prices, no emojis; Before/After photos; single action: Book Appointment. Real **NaiM logo** in topbar + footer; `/docs` link removed from public view.
2. **Zero-scrolling experience across the entire portal** — `html,body{overflow:hidden}` everywhere in `/docs/*`; navigation is side-arrow buttons only (fixed circular gold arrows, bottom corners on mobile, keyboard ← → on desktop); every page auto-fits the viewport via a `transform:scale()` fit engine, on both phones and desktops.
3. **Client Document Portal** (`src/docs/hub.tsx`) — **one fixed screen**, espresso/cream/gold:
   - Exactly **2 documents**, side-by-side cards on desktop, stacked on mobile — concise wording, no extra sections
   - **START HERE** badge (glowing) on the Onboarding Guide (Step 1 of 2)
   - **Honesty gate**: Step 2 card is locked (and navigation blocked) until Step 1 is signed & submitted (localStorage `naim_done_onboarding`); done-badges appear as each is completed
4. **Onboarding Guide — full-screen slide deck** (`src/docs/onboarding.tsx`):
   - 10 fit-to-screen pages, fixed progress rail ("01 / 10" counter + gold bar), side arrows
   - Read-confirm gate before each forward reveal: "Yes — reveal the next page" / "Not yet — I'll read it again"
   - Agent-designed espresso/cream editorial aesthetic preserved: Playfair italic headlines, giant page numerals, thin rules, cover/agenda/thank-you photographs, **founder photo (M.A. Salmin) in the portrait frame**
   - Ends with acknowledge + signature → success panel links straight to the Contract
5. **Quotation & Service Agreement Contract — full-screen slide deck** (`src/docs/quotation.tsx`) — one document, one signature, 11 fit-to-screen pages:
   - **Locked screen** if the Onboarding Guide hasn't been signed (elegant espresso gate pointing back to Step 1)
   - Part I · Quotation: project details, itemised % fee table (KES fill-ins), total, monthly package, banking & M-PESA — content verbatim from the agent design
   - Part II · Service Agreement: all 13 plain-language clauses (Kenya DPA 2019, refund policy, IP, liability, Kenyan law), 2 per page for easy phone reading
   - Date-of-signing field with **"Use today's date"** button, signature pad, agree + submit → PDF-copy promise in the success panel
   - NaiM logo watermark, paper #f5efe2 palette and gold rail preserved
6. **Signature engine** (`public/static/docs.js`) — canvas pad (touch + mouse, DPR-sharp, **scale-compensated for the fit-to-screen transform**), field collection, POST `/api/docs/submit`, and **completion recording** (`naim_done_<doc_type>`) that powers the portal's progress unlock
7. **8-PDF print document suite** (`documents/pdf/`) — WeasyPrint A4
8. **APIs** — leads capture + document submissions with admin endpoints; agent design originals archived in `agent-docs/`

## Data Architecture
- **Storage**: Cloudflare D1 (SQLite)
- **Tables**:
  - `leads` (0001): agency_name, contact_name, phone, email, agency_size, main_challenge, created_at
  - `doc_submissions` (0002): doc_type, client_name, agency_name, email, phone, fields_json, signature_data (base64 PNG), agreed, ip, user_agent, created_at
- **Data Flow**: browser → axios POST → Hono API → D1; admin reads via keyed GET endpoints

## User Guide
1. **Prospect** visits `/`, reads, books an appointment. (The portal is not linked from the landing page — it is shared privately.)
2. **During the Google Meet consultation**, the client receives `/docs` on their phone:
   - **Step 1 — Onboarding Guide**: no scrolling — the client just taps the gold side arrow to reveal each page; each page asks "read and understood?" before the next appears; ends with acknowledge + signature + submit.
   - **Step 2 — Quotation & Service Agreement Contract**: unlocks automatically after Step 1; same arrow-reveal flow — the client fills the KES amounts, taps "Use today's date", signs, submits.
3. **You** receive both signed documents instantly in D1 (`/api/docs/submissions?key=...`), acknowledge them, and share the client's PDF copy.

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
- **Last Updated**: 2026-09-02
