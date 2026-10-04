# NAIM — build status

## Current Phase
Phases 0–5 are built. The live preview runs on demo data. The next step is going live on Supabase and Netlify, which needs the founder's accounts.

## ✅ Completed
- **Phase 0**
  - Cloudflare removed everywhere and replaced with Netlify + Supabase.
  - Repo split into `site/`, `portal/` and `office-app/`.
  - References saved in `office-app/references/` (77 screenshots catalogued, 6 design skills, Naim-CRM).
  - Masterprompt addendum written (Part 9).
- **Supabase**
  - `schema.sql`: 45 tables, RLS with a role/module permission matrix, triggers (invoice numbers and totals, payment rollup, portal → documents, activity log), views (funnel, MRR, AR ageing), RPCs (`convert_lead`, `create_deal_invoices` for the 50/50 split, `purge_demo_data`).
  - `seed.sql`: full demo company, every row flagged `is_demo`.
- **Landing and portal**
  - Static builds, with Netlify Functions writing to Supabase.
  - Tested against a mock Supabase. All pass.
- **NAIM COMMAND**
  - 24 modules: Command Center, My Day, Lead Engine (3 required screens), Deals, Clients 360, Appointments 360, Projects, Tasks, Documents, POS, Invoices with PDF, Services, Care Plans, Inventory, Purchases, Finance, Expenses, Till, Payroll, HR, Reports, Hermes Fleet, Roles, Settings.
  - Six palettes plus dark/light mode, GSAP motion, side-business switcher.
- **Hermes**
  - 5-bot fleet runner, FastMCP server (17 tools), Telegram cockpit, SOUL.md, config.yaml.

## 🔄 In Progress
- Nothing blocking.

## ⏳ Up Next (needs the founder)
1. Create a Supabase project, then run `schema.sql`. Running `seed.sql` is optional.
2. Create three Netlify sites from this repo (see README) and set the environment keys.
3. Run the Hermes fleet on a small server with provider keys: OpenRouter, Resend, WhatsApp, IMAP, Telegram.
4. Make the repo private.

## ⚠️ Blockers
- No Supabase or Netlify credentials yet, so there is no production deploy. The hosted preview runs a Supabase-compatible local backend instead.
- Realtime is not available in the preview, so the app polls every 15s. Realtime is on automatically with real Supabase.

## 🧪 Test Results
- Typecheck: clean. `vite build`: OK.
- Headless Chrome walk of all 24 routes as owner: every page renders, with 0 console errors and 0 failed API calls.
- RLS: anon is denied. Staff cannot read payslips. Owner has full access.
- Fleet dry run: sourcing 4, enrichment 28, queued 31, follow-ups 12, overdue 3 (KES 231,250), summary OK, send 3 (dry run).
- An app button → `automation_commands` → runner executes within 30s.