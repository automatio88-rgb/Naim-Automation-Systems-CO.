# Naim Automation Systems Co. — Monorepo

Three products, one repo, one Supabase backend, deployed as **3 Netlify sites**.

| Folder | What it is | Netlify base dir | Key routes |
|---|---|---|---|
| `site/` | Public landing page with the Free Operations Audit form | `site` | `/`, `POST /api/leads` |
| `portal/` | Digital Document Portal. Clients read and sign online | `portal` | `/docs`, `/docs/onboarding`, `/docs/quotation`, `POST /api/docs/submit` |
| `office-app/` | **NAIM COMMAND**, the office app that runs the whole company | `office-app` | SPA |
| `supabase/` | `schema.sql` (tables, RLS, triggers, realtime, storage) + `seed.sql` (demo data) | — | — |
| `mcp-server/`, `hermes-fleet/` | Hermes Agent automation layer (no n8n) | — | runs on a VPS |

## How the pieces connect
```
Landing form ──► Netlify Function /api/leads ──► Supabase leads ─────────┐
Portal signature ─► Netlify Function /api/docs/submit ─► portal_submissions ─► trigger ─► documents + activities + notifications
                                                                         ▼
                                   NAIM COMMAND (office-app) ◄── realtime ── Supabase ◄── Hermes fleet (MCP server)
```

## Setup
1. **Supabase:** create a project, open the SQL editor, run `supabase/schema.sql`, then (optionally) `supabase/seed.sql`. The first user to sign up becomes the **owner**.
2. **Netlify:** create 3 sites from this repo, one with each base directory: `site`, `portal`, and `office-app`. Each folder has its own `netlify.toml`.
3. **Environment variables:**
   - `site` and `portal`: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (server-side only). The portal also takes an optional `SITE_URL`.
   - `office-app`: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (public anon key; RLS protects the data).
4. **Hermes:** see `mcp-server/README.md` and `hermes-fleet/SETUP.md`.

## Local development
```bash
cd site && npm install && npm run build            # → site/dist
cd portal && npm install && npm run build          # → portal/dist
cd site && npx tsx ../scripts/test-functions.mjs site      # function tests (mock Supabase)
cd portal && npx tsx ../scripts/test-functions.mjs portal
```

## Security notes
- No admin keys in code. The old `?key=` admin endpoints are gone. Leads and signed documents are read inside NAIM COMMAND behind Supabase Auth + RLS.
- Service-role keys only live in Netlify Function env vars.

## Build docs
- `masterprompt.md`: the master build prompt and single source of truth (Part 9 is the founder addendum).
- `status.md`: live build status.
- `office-app/references/`: screenshot catalogue, distilled skills, Naim-CRM architecture.