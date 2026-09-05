# MASTERPROMPT — NAIM COMMAND
## The Next-Generation Office App of Naim Automation Systems Co.

> **You are an elite full-stack AI engineering agent.** Your mission is to design and build
> **NAIM COMMAND** — the complete, unified, production-ready Office App that runs the entire
> business of **Naim Automation Systems Co.** in ONE place: CRM + Lead Generation Engine +
> Sales Pipeline + Finance + Documents + Reports + a fully autonomous **Hermes Agent**
> automation layer. Not two sites. Not a dashboard plus a CRM. **One unified, smart,
> powerful system** — the founder's real digital office where he sees EVERYTHING that runs
> in his company.

---

# PART 0 — MANDATORY WORKING PROTOCOL (read before anything else)

1. **STUDY FIRST, BUILD SECOND.** Before writing a single line of product code you MUST
   study all three references in Part 1 and produce a short written understanding of each.
2. **Save this entire prompt as `masterprompt.md`** at the root of the new project. It is
   your single source of truth. When in doubt, re-read it.
3. **Create `status.md`** at the project root immediately, and UPDATE IT CONTINUOUSLY as
   you work. It is the founder's window into your progress. Required format:

   ```markdown
   # NAIM COMMAND — Build Status
   Last updated: <ISO datetime>

   ## Current Phase: <phase name>

   ## ✅ Completed
   - [x] <item> — <one-line note>

   ## 🔄 In Progress
   - [ ] <item> — <what exactly is being done now>

   ## ⏳ Up Next
   - [ ] <item>

   ## ⚠️ Blockers / Decisions Needed
   - <anything requiring the founder's input>

   ## 🧪 Test Results
   - <route/feature>: PASS/FAIL
   ```

   Update `status.md` at minimum: when a phase starts, when a module is completed, when a
   test passes/fails, and when you are blocked. Never let it go stale.
4. **Never fake data silently.** Seed data must be clearly marked as demo. Every metric on
   every dashboard must be computed from the real database.
5. **Commit early, commit often** with meaningful messages. Keep the app deployable at the
   end of every phase.

---

# PART 1 — MANDATORY STUDY PHASE (do this before building)

## Reference A — The Company Repo (WHO the founder is, WHAT the business is)
**Repo:** `https://github.com/automatio88-rgb/Naim-Automation-Systems-CO..git`

Go through this whole repo first to understand the company. It contains the company's
landing page and the 2-document Client Portal (Onboarding Guide + Quotation & Service
Agreement Contract signed on the client's phone during Google Meet consultations).
Extract and internalize:
- The business model (see Part 2 below — verify against the repo's README and documents)
- The brand system: gold `#C8A24A`, espresso `#211812`, cream `#efe6d6`, Playfair Display +
  Jost typography, premium editorial aesthetic, NO emojis in UI
- The document/signature flow (D1 `doc_submissions` with base64 signature PNGs) — NAIM
  COMMAND must surface these signed documents in the Documents module
- The sales motion: live Google Meet consultation → onboarding guide signed → contract
  signed → 50% deposit → build → live demo → 50% balance → monthly care plan

## Reference B — The Naim-CRM Repo (HOW a full CRM for this niche looks)
**Repo:** `https://github.com/trevor93/Naim-CRM.git`

This is a complete recruitment-agency CRM the founder built for a client (Naim Investments,
Mombasa). It is your FEATURE-DEPTH reference — study it thoroughly:
- **Stack:** React 19 + Vite + TailwindCSS + Supabase (Postgres + Auth + Storage + RLS),
  react-router-dom v7, recharts, lucide-react, react-hot-toast, jspdf, xlsx
- **Pages:** Dashboard, Candidates (11-stage pipeline), Jobs, Appointments, Tasks,
  Documents, Reports, CV Builder, WhatsApp view, Receptionist view, Recycle Bin, Settings
- **Patterns to reuse:** service-layer architecture (`src/services/*.js`), Supabase schema
  with RLS + auto-profile trigger, soft-delete recycle bin, global search, XLSX/PDF export
- **CRITICAL — the Hermes integration pattern** (`hermes-config/` + `mcp-server/server.py`):
  a Python FastMCP server exposing ~18 CRM tools (list/add/update candidates, jobs,
  appointments, tasks, dashboard stats) to Hermes Agent, controlled via Telegram in natural
  language, with a SOUL.md personality file. You will build the same pattern for NAIM
  COMMAND — but far more powerful (see Part 5).

Do NOT copy the recruitment domain. The founder is NOT an agency — he SELLS automation
systems TO agencies. Translate the patterns: Candidates→Leads/Clients, Jobs→Projects,
recruitment stages→sales & delivery stages.

## Reference C — The Lead Engine Screenshot Templates (HOW the lead side must look/work)
The founder will attach screenshot templates of a "B2B LEADS ENGINE V1" app. **Study every
pixel of them.** If they are attached to your session, analyze them before building. Their
content, verified:

1. **Dashboard screen:** dark command-center UI; left sidebar (logo "B2B LEADS / ENGINE V1",
   nav: Dashboard, Leads, Actions; "PIPELINE LIVE" green status dot bottom-left);
   **Pipeline Funnel** strip with big numbers and stage-to-stage conversion percentages:
   `4 SCRAPED → 25% → 1 ENRICHED → 300% → 3 OUTREACH → 67% → 2 REPLIED → 100% → 2 BOOKED`,
   each stage underlined in its own color (grey/blue/cyan/green/purple);
   **Live Activity Feed** (rows: icon + event type in colored caps + business name + relative
   time — "CALL BOOKED · Redbird · 4 days ago", "OUTREACH SENT · JOEY DTLA · about 1 month
   ago"); **Upcoming Calls** panel with "0 booked" pill and empty state.
2. **Leads screen:** header "LEADS · 4 of 4 leads" + Refresh button; toolbar: search box,
   "All Quality" dropdown, "All Status" dropdown, MIN SCORE input; table columns:
   BUSINESS (name + URL subtext), SCORE (colored badge: 73/71/68 amber, 0 red), QUALITY
   (HIGH green badge / LOW red badge), STATUS (• Booked purple, • Sent blue, • Not Sent
   grey), SCRAPED (date).
3. **Actions screen:** "ACTIONS · WEBHOOK CONTROL PANEL" — a grid of control cards:
   **RUN ENRICHMENT NOW** ("Triggers System 2 to enrich all unprocessed leads with AI
   research and scoring" + blue `Trigger Enrichment` button); **SEND TODAY'S OUTREACH**
   ("Approves and sends outreach emails to all HIGH leads not yet contacted" + blue
   `Approve & Send` button); **PAUSE ALL OUTREACH** ("Immediately pauses System 3 from
   sending any further outreach emails" + red `Pause Outreach` button); **MINIMUM SCORE
   THRESHOLD** (numeric input + `Save Threshold` button + "/ 100"); **PREVIEW OUTREACH
   QUEUE** ("HIGH quality leads queued for outreach with their personalization lines" +
   collapsible "0 leads in queue").

Replicate this ENTIRE lead-engine experience inside NAIM COMMAND (as its Lead Generation
module) — upgraded, branded, and wired to Hermes instead of n8n webhooks.

---

# PART 2 — THE COMPANY (business context you must encode everywhere)

- **Company:** Naim Automation Systems Co. — Nairobi, Kenya
- **Founder & Systems Architect:** M.A. Salmin (currently solo; the app must support adding
  a coworker/partner later — role-based access from day one)
- **Business:** sells custom AI automation systems to Kenya's **1,296 NEA/KAPEA-licensed
  recruitment agencies** (and beyond). Positioning: "Turn agency admin from Chaos into
  Clean systems on your phone."
- **Sales motion:** outbound lead generation → discovery/consultation call booked (Google
  Meet) → live consultation where the client signs the Onboarding Guide + the Quotation &
  Service Agreement Contract on their phone → 50% deposit (M-PESA / bank) → build
  (7–21 business days) → live demo → 50% balance → handover → **monthly service package**
  (recurring revenue)
- **Currency:** KES primary (USD secondary). Timezone: EAT (Africa/Nairobi).
- **Communication channels:** WhatsApp + Email primarily; Telegram for commanding Hermes.
- **NO EMOJIS in the product UI.** Icons are SVG (lucide). Professional, premium, calm.

---

# PART 3 — THE PRODUCT: NAIM COMMAND (one unified Office App)

A single full-stack app, ONE login, ONE sidebar, where every module shares one database and
every number updates in real time. The founder opens it in the morning and sees his entire
company: leads coming in, outreach going out, replies, calls booked, deals moving, projects
being delivered, invoices paid, revenue growing — all live, all in one place.

## 3.1 Modules (sidebar order)

### 1. COMMAND CENTER (home dashboard)
The founder's morning screen. At a glance:
- **Today strip:** new leads today, outreach sent today, replies today, calls booked today,
  KES collected today, tasks due today
- **Company KPIs:** pipeline value (KES), MRR from monthly service packages, active
  clients, active projects, win rate, avg deal size
- **Pipeline Funnel** (lead side): Scraped → Enriched → Qualified → Outreach → Replied →
  Call Booked → Won, with conversion % between every stage (exactly the screenshot pattern)
- **Live Activity Feed:** every event in the company streams here in real time (lead
  scraped, lead enriched, outreach sent, reply received, call booked, document signed,
  invoice paid, project delivered, Hermes routine completed) — icon, colored event type,
  entity, relative timestamp
- **Upcoming Calls** panel (next 7 days, joinable Meet links) + **Revenue this month** mini
  chart + **Hermes fleet status** (which bots ran, last run, next run, failures)

### 2. LEAD ENGINE (the full lead-generation system — screenshot experience, upgraded)
- **Leads table:** business name + website + location, score (0–100, colored badge),
  quality (HIGH/MEDIUM/LOW), status (New → Enriched → Queued → Sent → Replied → Booked →
  Converted → Dead), source, scraped date; search, quality/status filters, min-score
  filter, column sort, pagination, CSV/XLSX export; row click → **Lead detail drawer**:
  full enrichment dossier (AI research summary, personalization lines, contact channels,
  agency size, licence info), full event timeline, outreach history with message previews,
  manual actions (edit, re-enrich, queue, disqualify, convert to client)
- **Pipeline funnel** with live conversion rates (same visual language as Command Center)
- **Campaigns:** outreach campaigns with sequence steps (email/WhatsApp), per-campaign
  stats (sent, opened, replied, booked), start/pause
- **Actions — Control Panel** (the webhook panel, now commanding Hermes):
  Run Enrichment Now · Approve & Send Today's Outreach · Pause All Outreach (kill switch,
  instant) · Minimum Score Threshold (persisted setting) · Preview Outreach Queue (leads +
  their personalization lines, expandable) · Trigger Scrape/Sourcing Run
- **Replies Inbox:** every reply captured, classified by AI (interested / question /
  not-now / negative), one-click "Book call" and "Convert to client"

### 3. CLIENTS (CRM core)
- Client records (converted leads or manually added): agency name, contacts, licence
  number, size, channels, notes, health status (active / at-risk / churned)
- **Client 360 view:** deals, projects, signed documents, invoices & payments, appointments,
  tasks, full activity timeline — everything about one client on one screen
- Lead → Client conversion carries the ENTIRE history (enrichment dossier, outreach,
  replies, calls) — nothing is lost

### 4. DEALS (sales pipeline)
- Kanban + table view. Stages: Discovery Booked → Consultation Held → Proposal/Quotation
  Sent → Contract Signed → Deposit Paid → Won (handover to Projects) / Lost (with reason)
- Deal value (KES), expected close date, weighted pipeline value, drag-and-drop stage moves
  (every move logged to the activity feed)

### 5. PROJECTS (delivery)
- One project per won deal: status (Materials Pending → In Build → Review → Live Demo →
  Delivered → In Care Plan), 7–21 day timeline with progress, client materials checklist
  (contact person, credentials, walkthrough, sample data, branding, deposit), milestones,
  linked tasks

### 6. FINANCE
- **Invoices:** create from deal (auto 50/50 split), statuses (draft/sent/partial/paid/
  overdue), KES + M-PESA/bank reference fields, PDF generation with company branding
- **Payments:** record against invoices (M-PESA till/paybill, bank transfer), auto-update
  invoice status
- **Subscriptions:** monthly service packages per client (amount, start date, status,
  next-due), MRR rollup, overdue alerts
- **Revenue analytics:** monthly revenue chart, deposits vs balances vs recurring,
  outstanding receivables, cash collected per period

### 7. DOCUMENTS
- All signed client documents (pull/sync the `doc_submissions` from the client portal:
  onboarding acknowledgements + signed contracts, with signature PNGs and field data)
- Company documents library (quotes, invoices, handover manuals), per-client filing,
  PDF preview & download

### 8. CALENDAR & APPOINTMENTS
- All discovery calls, consultations, demos, training sessions; day/week/month views;
  Meet link field; statuses (scheduled/completed/no-show/cancelled); no-show follow-up
  task auto-created

### 9. TASKS
- Company-wide task board (todo/doing/done), priorities, due dates, linked entity (lead/
  client/deal/project), assignee (founder or future team member), "My day" view;
  Hermes can create and complete tasks

### 10. REPORTS
- Lead generation report (per source/campaign/period), sales report (win rate, velocity,
  avg deal), delivery report (on-time %), finance report (revenue, MRR, receivables),
  activity report (what Hermes did: runs, successes, failures) — all filterable by date
  range, all exportable (XLSX/PDF)

### 11. HERMES FLEET (automation control room)
- The roster of the 5 Hermes Bots (see Part 5): live status, last run, next scheduled run,
  recent run log per bot (success/failure + summary), pause/resume per bot, global kill
  switch; routine schedule editor (writes to the automation_settings the bots read)
- Command log: every command sent from the app to Hermes and every webhook received back

### 12. TEAM & SETTINGS
- Users & roles (Owner, Teammate — RBAC on every module), profile, company settings
  (branding, banking details for invoices, thresholds), notification preferences,
  API keys/webhook secrets management, audit log

## 3.2 Global features (non-negotiable)
- **Real-time everywhere:** Supabase Realtime subscriptions — when Hermes books a call at
  2am, the founder's open dashboard updates without refresh
- **Global search (Cmd+K):** searches leads, clients, deals, projects, invoices, documents,
  tasks in one palette
- **Activity event system:** ONE `activities` table feeds the live feed, entity timelines,
  and reports. Every mutation (human or Hermes) writes an activity
- **Notifications:** in-app notification center + optional Telegram push via Hermes for
  high-value events (reply received, call booked, payment received, bot failure)
- **Mobile responsive:** the founder runs his company from his phone; every module must be
  fully usable on mobile
- **Dark command-center theme by default** (per the screenshots) with the NaiM brand:
  near-black `#0b0e13`-family surfaces, panel borders, monospace-accent labels, and the
  company gold `#C8A24A` as the primary accent; status colors: blue (info/sent), cyan
  (outreach), green (success/replied/HIGH), purple (booked), amber (scores/warnings), red
  (danger/LOW/paused). Optional light theme using the cream/espresso brand palette.
  Premium micro-animations (count-ups, pulse on live dot, smooth drawer transitions).
  NO emojis anywhere in the UI.

---

# PART 4 — ARCHITECTURE & TECH STACK

Follow the proven Naim-CRM stack (Reference B), upgraded to production grade:

- **Frontend:** React 19 + Vite + TypeScript + TailwindCSS. Libraries: react-router-dom v7,
  recharts (funnel/charts), lucide-react (icons), react-hot-toast, date-fns, jspdf +
  jspdf-autotable (PDF), xlsx (exports). State: TanStack Query (server state) + light
  context for UI state.
- **Backend/DB:** **Supabase** — Postgres, Auth (email + magic link), Row Level Security,
  Storage (documents/signatures), **Realtime** (live feed + dashboards), Edge Functions
  (webhook receivers for Hermes callbacks, M-PESA confirmation hooks, reply-capture
  inbound webhooks).
- **Service layer:** `src/services/*.ts` — one service per entity (leadService,
  clientService, dealService, projectService, invoiceService, activityService,
  automationService…), exactly the Naim-CRM pattern. NO direct Supabase calls from
  components.
- **MCP server (for Hermes):** Python FastMCP server (`mcp-server/server.py`) exposing the
  FULL tool surface of NAIM COMMAND to Hermes Agent (see Part 5.4). Same pattern as
  Naim-CRM's `mcp-server/`, massively extended.
- **Deploy:** frontend to Cloudflare Pages or Netlify; Supabase cloud; MCP server + Hermes
  Agent on the founder's VPS (or Daytona/Modal serverless). Provide `.env.example`,
  `ecosystem.config.cjs` (PM2) and full setup docs.
- **Security:** RLS on every table; roles enforced in policies; webhook endpoints verified
  by shared secret; service keys never in frontend; audit log for destructive actions;
  soft-delete + recycle bin (Naim-CRM pattern).

# PART 5 — THE HERMES AGENT AUTOMATION LAYER (no n8n — Hermes runs everything)

**Hermes Agent** (open-source autonomous agent by Nous Research — hermes-agent.nousresearch.com)
replaces n8n entirely. Do deep research on its docs before building (start at
`/docs/llms.txt`). The capabilities you will exploit:

- **Bot Mode** (the new power upgrade): named Bots, each with its own role, model, memory,
  skills, SOUL.md and **Routines** (cron with memory/continuity). Bots message each other
  (`message_agent`), coordinate in group chats, escalate to the founder with `@user`.
- **Scheduled automations:** built-in cron with delivery to any platform (Telegram).
- **MCP integration:** Bots call NAIM COMMAND's MCP tools to read/write the database.
- **Messaging Gateway:** the founder commands the whole fleet from **Telegram** in natural
  language; WhatsApp/Email channels available for outreach delivery.
- **Skills + memory:** bots create and improve their own procedural skills over time.

## 5.1 The 5 Bots (the automation fleet powering everything)

Create `hermes-fleet/` in the repo with per-bot `SOUL.md`, routine schedules, and a
`SETUP.md` (mirroring Naim-CRM's `hermes-config/` but for 5 bots):

1. **SCOUT — Lead Sourcing Bot.** Routine (daily, early morning EAT): source NEW real
   agencies from the NEA/KAPEA licensed-agency universe and other legitimate directories;
   dedupe against DB; insert as `status=new` with source attribution. REAL leads only —
   verified business name + at least one working contact channel; never fabricate.
2. **SAGE — Enrichment & Scoring Bot.** Routine (after Scout, and on-demand via "Run
   Enrichment Now"): for each unenriched lead — web research the agency (site, socials,
   size, services, licence status), write the research dossier + 2–3 personalization lines,
   score 0–100 against the ICP (licensed, active, Gulf-placement volume, digital presence,
   admin-pain signals), set quality HIGH/MEDIUM/LOW. Writes everything back via MCP.
3. **HERALD — Outreach Bot.** Routine (daily, business hours EAT): sends personalized
   outreach (email; WhatsApp where available) to HIGH-quality leads ≥ score threshold that
   are queued/approved; respects daily send limits, spacing, and follow-up sequences
   (max 3 touches); OBEYS the Pause kill-switch and the approval mode setting (auto-send
   vs founder-approves-daily-batch). Logs every send as an activity.
4. **ECHO — Reply & Booking Bot.** Monitors the inbox/webhooks for replies; classifies
   intent (interested/question/not-now/negative); updates lead status; drafts suggested
   responses; books discovery calls into the calendar (or sends the booking link);
   creates the deal on booking; notifies the founder on Telegram INSTANTLY for every
   reply and booking.
5. **LEDGER — Operations & Reporting Bot.** Routines: morning briefing to Telegram
   (yesterday's numbers, today's calls, due tasks, overdue invoices); invoice/payment
   watch (flag overdue, remind clients where authorized); subscription renewals; end-of-day
   summary; weekly deep report. Also the founder's natural-language query interface:
   "How many leads did we book this week?" answered from live data via MCP.

Fleet rules: every bot writes an `automation_runs` record (start/end/success/summary) and
activities for everything it does; every bot checks `automation_settings` (pause flags,
thresholds, limits) BEFORE acting; failures escalate to Telegram.

## 5.2 App ⇄ Hermes control loop
- **App → Hermes:** the Actions/Fleet panels write command rows to an `automation_commands`
  table (e.g. `run_enrichment`, `send_outreach`, `pause_all`). Bots poll/receive these on
  their routines and honor them. (Optionally also a direct webhook to the Hermes host.)
- **Hermes → App:** bots write via MCP tools; Supabase Realtime pushes every change to the
  open UI instantly. Result: click "Trigger Enrichment" in the app → SAGE runs → dashboard
  numbers move live.

## 5.3 The founder's Telegram cockpit
Document (in `hermes-fleet/SETUP.md`) the full Telegram experience: DM any bot, group chat
with the fleet, commands like "pause outreach", "how's the pipeline?", "book Redbird for
Tuesday 2pm", morning briefings arriving automatically.

## 5.4 MCP tool surface (minimum)
Leads: list/get/add/update/score/queue/disqualify/convert · Clients: CRUD + client360 ·
Deals: CRUD + move_stage · Projects: CRUD + update_progress · Invoices/Payments/
Subscriptions: CRUD + record_payment · Appointments: CRUD + book_call · Tasks: CRUD ·
Documents: list/get · Activities: log/list · Stats: dashboard_stats, funnel_stats,
finance_stats, report(period) · Automation: get_settings, set_setting, log_run,
get_commands, ack_command. Every tool validates inputs and returns clean JSON.

# PART 6 — DATABASE SCHEMA (Supabase Postgres — build ALL of it, with RLS)

`users_profiles` (role: owner/teammate; auto-create trigger) · `leads` (business, website,
location, contacts jsonb, source, score, quality, status, dossier text, personalization
jsonb, scraped_at, enriched_at, converted_client_id, soft-delete) · `campaigns` +
`outreach_messages` (lead_id, campaign_id, channel, step, subject, body, status
queued/sent/delivered/replied/failed, sent_at) · `replies` (lead_id, channel, body,
intent, received_at) · `clients` (from leads or manual; health, licence_no, notes) ·
`deals` (client_id, title, value_kes, stage, expected_close, won/lost_at, lost_reason) ·
`projects` (deal_id, status, started_at, due_at, delivered_at, materials_checklist jsonb,
progress) · `invoices` (client_id, deal_id, number, line_items jsonb, total_kes, type
deposit/balance/subscription, status, due_date, pdf_path) · `payments` (invoice_id,
amount_kes, method mpesa/bank, reference, paid_at) · `subscriptions` (client_id,
amount_kes, status, next_due) · `appointments` (linked entity, type, starts_at, meet_link,
status) · `tasks` (title, priority, due, status, linked entity, assignee, created_by
human/hermes) · `documents` (client_id, type, name, storage_path, fields jsonb,
signature_path, signed_at, source portal/internal) · `activities` (actor human/bot-name,
verb, entity_type, entity_id, summary, metadata jsonb, created_at — INDEXED, feeds
everything) · `automation_settings` (key/value: min_score_threshold, outreach_paused,
daily_send_limit, approval_mode…) · `automation_commands` (command, payload, status
pending/acked/done, requested_by) · `automation_runs` (bot_name, routine, started/finished,
status, summary, stats jsonb) · `notifications` (user_id, type, title, body, read,
entity link).

Ship: `supabase-schema.sql` (complete, runnable in one shot: tables, indexes, triggers,
RLS policies, storage buckets) + `seed.sql` (clearly-marked demo data so every screen
renders rich on first run).

# PART 7 — BUILD PHASES (update status.md at every step)

- **Phase 0 — Study & Setup:** study all 3 references; write understanding into status.md;
  scaffold project; save masterprompt.md + status.md; schema + seed; auth + RBAC shell.
- **Phase 1 — Core Office:** layout (sidebar/topbar/Cmd+K/notifications), Command Center
  with live funnel + activity feed + KPIs (realtime), Leads module complete (table,
  drawer, filters, export), Actions control panel wired to automation_commands/settings.
- **Phase 2 — CRM & Sales:** Clients + Client 360, Deals kanban, lead→client conversion
  with full history carry-over, Calendar & Appointments, Tasks.
- **Phase 3 — Delivery & Money:** Projects, Invoices (PDF) + Payments + Subscriptions +
  MRR, Documents module (incl. portal signed-docs sync), Reports.
- **Phase 4 — Hermes Fleet:** MCP server (full tool surface), hermes-fleet/ (5 bot SOULs,
  routines, config.yaml, SETUP.md), Hermes Fleet control-room module, Edge Function
  webhooks, end-to-end loop test (app command → bot run → realtime UI update).
- **Phase 5 — Polish & Production:** mobile pass on every module, empty/loading/error
  states, performance, security review (RLS test per role), deploy, README with full
  setup + architecture diagram, final status.md marking acceptance criteria.

# PART 8 — ACCEPTANCE CRITERIA (the definition of DONE)

1. ONE app, ONE login — every module in Part 3 present and functional; no separate sites.
2. Command Center funnel + activity feed update in real time when data changes (prove with
   two browser windows).
3. Lead Engine reproduces and upgrades ALL THREE screenshot screens (funnel with
   conversion %, leads table with score/quality/status badges, actions control panel
   including kill-switch and threshold).
4. Full business flow works end-to-end manually: lead → enriched → outreach → reply →
   call booked → deal → contract/doc on file → deposit invoice paid → project → delivered
   → subscription active → all visible in reports.
5. Hermes fleet: all 5 bots configured with SOULs + routines; MCP server exposes the full
   tool surface; "Trigger Enrichment" in the app is honored by a bot run that writes back
   visibly; kill-switch verifiably stops outreach; morning briefing spec documented.
6. Finance correct to the shilling: invoice 50/50 split, payment recording, MRR rollup.
7. RBAC enforced (owner vs teammate), RLS on all tables, secrets server-side only.
8. Premium dark command-center UI, NaiM gold accent, fully mobile-responsive, no emojis.
9. `masterprompt.md` and a continuously-updated `status.md` exist at the repo root; README
   documents setup for app + Supabase + MCP + Hermes fleet.
10. Seeded demo renders every screen richly; all demo data clearly marked.

---

**Now begin. Create `status.md`, study the references (Part 1), write your understanding,
and build NAIM COMMAND phase by phase — the founder is watching status.md.**
