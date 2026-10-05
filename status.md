# NAIM — build status

## Current Phase
All six masterprompt phases (P0–P5) are built and tested on the live preview, which runs on demo data. These changes are **not committed yet**; automatio88 will commit and push them. The only phase work still open needs the founder's accounts: deploying to production on Supabase and Netlify.

## ✅ Completed
- **P0, setup**
  - Cloudflare removed. The repo is split into `site/`, `portal/` and `office-app/`.
  - Supabase `schema.sql`: 45 tables, RLS on every table through `has_perm()`, triggers, views and RPCs.
  - `seed.sql`: demo data, every row flagged `is_demo`.
  - Auth and roles.
- **P1, Command Center**
  - Layout, Cmd+K, notifications.
  - Realtime Command Center (`postgres_changes`, with a polling fallback).
  - Lead Engine: funnel with conversion %, leads table, drawer, filters, export, and an Actions panel with the kill switch and score threshold.
- **P2, sales**
  - Customer 360 (Visits / Invoices / Memberships / Packages and more).
  - Deals kanban, lead conversion.
  - Appointments: list, calendar, queue, waitlist, and Appointment 360 (Services / Notes / Timeline).
  - Tasks: smart filters, quick add, linked records.
- **P3, delivery and money**
  - Projects.
  - Invoices with Invoice 360 and PDF; payments.
  - Subscriptions and MRR.
  - Documents: portal sync, awaiting-signature flow, submissions.
  - Reports: Overview, Sales, Team, Funnel and Receivables tabs, with PDF and CSV export.
  - Expenses: 6-month trend and recurring commitments.
  - Cash Till: X and Z reports.
  - Payroll, HR.
- **P4, Hermes**
  - MCP server with **68 tools** covering the full Part 5.4 surface. Every input is validated and every change is logged.
  - 5 per-bot SOULs in `hermes-fleet/souls/`, plus `SETUP.md` and `BRIEFING.md` (07:00 morning briefing, also available as `/briefing` on Telegram).
  - Routines with dry run and a kill switch.
  - 4 inbound webhooks: WhatsApp, M-Pesa, booking, email.
  - Control room on the Hermes Fleet page.
- **P5, polish**
  - Error boundaries around the app and each route.
  - All 24 routes are lazy-loaded.
  - Mobile pass at 390px, with no horizontal overflow.
  - Per-role RLS test.
  - README architecture diagram.
  - This checklist.
- **Part 9 extras**
  - Netlify + Supabase only.
  - Product 360: Overview / Sales / Purchase orders / Stock history.
  - Package 360: Contents / Clients / Sales / Timeline, plus "Sell to a client".
  - PO 360.
  - Roles: "Who can do what" matrix and an audit log.
  - My Day: "Needs you" panel.
  - Side-business switcher, 6 palettes, dark and light mode.

## ✔ Part 8 acceptance checklist
| # | Criterion | State |
|---|---|---|
| 1 | One app, one login, every module | ✅ 24 modules, single sign-in |
| 2 | Realtime funnel and activity feed | 🟡 Coded with Supabase `postgres_changes`. The preview backend has no realtime, so it polls every 15s. Prove it with two windows once the app is on real Supabase. |
| 3 | Lead Engine: all 3 screenshot screens | ✅ |
| 4 | Full business flow end to end | ✅ `mcp-server/scripts/e2e-flow.py` PASS 13/13 |
| 5 | Hermes: 5 SOULs, routines, full MCP, Trigger Enrichment writes back, kill switch stops outreach, briefing spec | ✅ The kill switch was verified to skip sending |
| 6 | Finance correct to the shilling | ✅ 50/50 split on KES 150,001 = 75,001 + 75,000. The payment rolls the invoice up to paid. MRR goes up by exactly 8,000. |
| 7 | RBAC and RLS on all tables, secrets server-side | ✅ `supabase/tests/rls_test.py` PASS 765/765 across 5 roles and 41 tables |
| 8 | Premium UI, gold accent, mobile, no emojis | ✅ |
| 9 | masterprompt.md, status.md, README setup docs | ✅ |
| 10 | Seeded demo renders every screen | ✅ |

## 🔄 In Progress
- A screenshot-by-screenshot visual comparison against all 77 reference screens. The module coverage and salon (9.5) scope are in place; pixel matching has not been done screen by screen.

## ⏳ Up Next (needs the founder)
1. Create a Supabase project and run `schema.sql`. Running `seed.sql` is optional.
2. Create three Netlify sites from this repo (see README) and set the environment keys.
3. Run the Hermes fleet with the provider keys from `hermes-fleet/SETUP.md`.
4. Security:
   - Make the repo private.
   - Rotate the old admin key.
   - Remove the CV PDF.

## ⚠️ Blockers
- No Supabase or Netlify credentials yet, so there is no production deploy. The hosted preview runs a Supabase-compatible local backend instead.

## 🧪 Test Results
| Test | Command | Result |
|---|---|---|
| Typecheck + build | `cd office-app && npx tsc --noEmit && npm run build` | clean |
| UI smoke, desktop | headless Chrome over all 24 routes, Product 360 and Package 360 | 26/26, 0 console errors |
| UI smoke, mobile 390px | all 24 routes | 24/24, no overflow |
| MCP tools | `mcp-server/scripts/test-tools.py` | PASS 50 / FAIL 0, 68 tools registered |
| Business flow | `mcp-server/scripts/e2e-flow.py` | PASS 13 / FAIL 0 |
| Webhooks | `office-app/netlify/test-webhooks.mts` | PASS 20 / FAIL 0 |
| RLS per role | `supabase/tests/rls_test.py` | PASS 765 / FAIL 0 |
| Kill switch | herald send while paused | skipped, nothing sent |

All test scripts clean up their own `ZZ` rows.