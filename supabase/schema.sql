-- =====================================================================
-- NAIM COMMAND — Supabase schema (Postgres)
-- One-shot, idempotent: tables, indexes, triggers, functions, views,
-- RLS policies (driven by the Roles & Permissions matrix), realtime,
-- storage buckets. Run in Supabase SQL editor, then run seed.sql.
-- Serves all 3 Netlify deploys: site (leads), portal (portal_submissions),
-- office-app (everything).
-- =====================================================================
create extension if not exists pgcrypto;

-- ---------- helpers ----------
create or replace function public.touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

-- ---------- businesses (main company + side businesses) ----------
create table if not exists public.businesses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  kind text not null default 'company',          -- company | side_business
  tagline text,
  accent text default '#C8A24A',
  currency text not null default 'KES',
  is_primary boolean not null default false,
  is_demo boolean not null default false,
  created_at timestamptz not null default now()
);

-- ---------- people & access ----------
create table if not exists public.departments (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  color text default '#C8A24A',
  head_staff_id uuid,
  is_demo boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  phone text,
  role text not null default 'staff' check (role in ('owner','admin','manager','staff','viewer')),
  avatar_url text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.role_permissions (
  role text not null check (role in ('owner','admin','manager','staff','viewer')),
  module text not null,
  can_view boolean not null default false,
  can_create boolean not null default false,
  can_edit boolean not null default false,
  can_delete boolean not null default false,
  primary key (role, module)
);

create table if not exists public.staff (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete set null,
  full_name text not null,
  title text,
  phone text,
  email text,
  department_id uuid references public.departments(id) on delete set null,
  employment_type text not null default 'full_time',  -- full_time | part_time | contract | intern
  base_salary_kes numeric(12,2) not null default 0,
  commission_pct numeric(5,2) not null default 0,
  hired_at date default current_date,
  status text not null default 'active',               -- active | on_leave | inactive
  color text default '#C8A24A',
  skills text[] default '{}',
  is_demo boolean not null default false,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- lead engine ----------
create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references public.businesses(id) on delete set null,
  business_name text not null,
  contact_name text,
  phone text,
  email text,
  website text,
  location text,
  licence_no text,
  company_size text,
  main_challenge text,
  contacts jsonb not null default '[]',
  source text not null default 'manual',      -- landing_page | scraper | referral | manual | walk_in | import
  score int not null default 0 check (score between 0 and 100),
  quality text not null default 'low' check (quality in ('high','medium','low')),
  status text not null default 'new' check (status in
    ('new','enriched','queued','sent','replied','booked','converted','dead')),
  dossier text,
  personalization jsonb not null default '{}',
  tags text[] not null default '{}',
  owner_id uuid references public.profiles(id) on delete set null,
  scraped_at timestamptz,
  enriched_at timestamptz,
  last_contacted_at timestamptz,
  converted_client_id uuid,
  is_demo boolean not null default false,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_leads_status on public.leads(status) where deleted_at is null;
create index if not exists idx_leads_created on public.leads(created_at desc);
create index if not exists idx_leads_score on public.leads(score desc);

create table if not exists public.campaigns (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  channel text not null default 'email',       -- email | whatsapp | sms | linkedin
  status text not null default 'draft',        -- draft | active | paused | done
  steps jsonb not null default '[]',
  daily_limit int not null default 50,
  is_demo boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.outreach_messages (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  campaign_id uuid references public.campaigns(id) on delete set null,
  channel text not null default 'email',
  step int not null default 1,
  subject text,
  body text,
  status text not null default 'queued' check (status in ('queued','approved','sent','delivered','replied','failed')),
  sent_at timestamptz,
  is_demo boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists idx_outreach_lead on public.outreach_messages(lead_id);

create table if not exists public.replies (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  channel text not null default 'email',
  body text,
  intent text default 'unknown',               -- interested | question | not_now | unsubscribe | unknown
  sentiment text default 'neutral',
  received_at timestamptz not null default now(),
  is_demo boolean not null default false
);

-- ---------- CRM ----------
create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references public.businesses(id) on delete set null,
  lead_id uuid references public.leads(id) on delete set null,
  business_name text not null,
  contact_name text,
  phone text,
  email text,
  location text,
  licence_no text,
  company_size text,
  tier text not null default 'standard',       -- standard | gold | platinum
  health int not null default 70 check (health between 0 and 100),
  tags text[] not null default '{}',
  notes text,
  birthday date,
  source text,
  owner_id uuid references public.profiles(id) on delete set null,
  is_demo boolean not null default false,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_clients_name on public.clients(lower(business_name));
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'leads_converted_client_fk') then
    alter table public.leads add constraint leads_converted_client_fk
      foreign key (converted_client_id) references public.clients(id) on delete set null;
  end if;
end $$;

create table if not exists public.deals (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references public.businesses(id) on delete set null,
  client_id uuid references public.clients(id) on delete cascade,
  lead_id uuid references public.leads(id) on delete set null,
  title text not null,
  value_kes numeric(12,2) not null default 0,
  stage text not null default 'discovery' check (stage in ('discovery','consultation','proposal','contract','deposit_paid','won','lost')),
  probability int not null default 20,
  expected_close date,
  won_at timestamptz,
  lost_at timestamptz,
  lost_reason text,
  owner_id uuid references public.profiles(id) on delete set null,
  is_demo boolean not null default false,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- catalogue: services, packages, plans, products ----------
create table if not exists public.service_categories (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references public.businesses(id) on delete set null,
  name text not null,
  color text default '#C8A24A',
  sort int not null default 0,
  is_demo boolean not null default false
);

create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references public.businesses(id) on delete set null,
  category_id uuid references public.service_categories(id) on delete set null,
  name text not null,
  description text,
  price_kes numeric(12,2) not null default 0,
  duration_min int not null default 60,
  delivery_days int,
  is_recurring boolean not null default false,
  commission_pct numeric(5,2) not null default 0,
  active boolean not null default true,
  is_demo boolean not null default false,
  deleted_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.packages (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references public.businesses(id) on delete set null,
  name text not null,
  description text,
  items jsonb not null default '[]',           -- [{service_id, name, qty}]
  price_kes numeric(12,2) not null default 0,
  validity_days int not null default 90,
  active boolean not null default true,
  is_demo boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.membership_plans (   -- care plans / retainers
  id uuid primary key default gen_random_uuid(),
  business_id uuid references public.businesses(id) on delete set null,
  name text not null,
  price_kes numeric(12,2) not null default 0,
  billing_cycle text not null default 'monthly' check (billing_cycle in ('monthly','quarterly','yearly')),
  benefits jsonb not null default '[]',
  discount_pct numeric(5,2) not null default 0,
  included_hours int not null default 0,
  color text default '#C8A24A',
  active boolean not null default true,
  is_demo boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  plan_id uuid references public.membership_plans(id) on delete set null,
  amount_kes numeric(12,2) not null default 0,
  billing_cycle text not null default 'monthly',
  status text not null default 'active' check (status in ('active','paused','past_due','cancelled','expired')),
  started_at date not null default current_date,
  next_due date,
  cancelled_at timestamptz,
  is_demo boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.client_packages (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  package_id uuid references public.packages(id) on delete set null,
  sessions_total int not null default 1,
  sessions_used int not null default 0,
  purchased_at date not null default current_date,
  expires_at date,
  status text not null default 'active',
  is_demo boolean not null default false
);

create table if not exists public.suppliers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  contact_name text,
  phone text,
  email text,
  category text,
  balance_kes numeric(12,2) not null default 0,
  notes text,
  is_demo boolean not null default false,
  deleted_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references public.businesses(id) on delete set null,
  supplier_id uuid references public.suppliers(id) on delete set null,
  name text not null,
  sku text,
  category text,
  unit text default 'unit',
  cost_kes numeric(12,2) not null default 0,
  price_kes numeric(12,2) not null default 0,
  stock_qty numeric(12,2) not null default 0,
  reorder_level numeric(12,2) not null default 0,
  active boolean not null default true,
  is_demo boolean not null default false,
  deleted_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.purchase_orders (
  id uuid primary key default gen_random_uuid(),
  number text unique,
  supplier_id uuid references public.suppliers(id) on delete set null,
  status text not null default 'draft' check (status in ('draft','ordered','partial','received','cancelled')),
  items jsonb not null default '[]',           -- [{product_id, name, qty, unit_cost_kes, received_qty}]
  total_kes numeric(12,2) not null default 0,
  paid_kes numeric(12,2) not null default 0,
  ordered_at date,
  expected_at date,
  received_at date,
  notes text,
  is_demo boolean not null default false,
  created_at timestamptz not null default now()
);

-- ---------- delivery ----------
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references public.businesses(id) on delete set null,
  client_id uuid references public.clients(id) on delete cascade,
  deal_id uuid references public.deals(id) on delete set null,
  name text not null,
  status text not null default 'materials_pending' check (status in ('materials_pending','in_build','review','live_demo','delivered','in_care_plan','on_hold','cancelled')),
  priority text not null default 'medium',
  started_at date,
  due_at date,
  delivered_at date,
  materials_checklist jsonb not null default '[]',
  progress int not null default 0 check (progress between 0 and 100),
  budget_kes numeric(12,2) not null default 0,
  lead_staff_id uuid references public.staff(id) on delete set null,
  is_demo boolean not null default false,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- money ----------
create sequence if not exists public.invoice_seq;
create sequence if not exists public.po_seq;

create table if not exists public.till_sessions (
  id uuid primary key default gen_random_uuid(),
  opened_by uuid references public.staff(id) on delete set null,
  opened_at timestamptz not null default now(),
  opening_float_kes numeric(12,2) not null default 0,
  closed_at timestamptz,
  counted_kes numeric(12,2),
  expected_kes numeric(12,2),
  variance_kes numeric(12,2),
  status text not null default 'open' check (status in ('open','closed')),
  notes text,
  is_demo boolean not null default false
);

create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references public.businesses(id) on delete set null,
  number text unique,
  client_id uuid references public.clients(id) on delete set null,
  deal_id uuid references public.deals(id) on delete set null,
  project_id uuid references public.projects(id) on delete set null,
  subscription_id uuid references public.subscriptions(id) on delete set null,
  staff_id uuid references public.staff(id) on delete set null,
  type text not null default 'one_off' check (type in ('deposit','balance','subscription','one_off','pos')),
  line_items jsonb not null default '[]',      -- [{kind: service|product|package|plan, ref_id, name, qty, unit_price_kes}]
  subtotal_kes numeric(12,2) not null default 0,
  discount_kes numeric(12,2) not null default 0,
  tax_kes numeric(12,2) not null default 0,
  tip_kes numeric(12,2) not null default 0,
  total_kes numeric(12,2) not null default 0,
  paid_kes numeric(12,2) not null default 0,
  status text not null default 'draft' check (status in ('draft','sent','partial','paid','overdue','void')),
  issued_at date not null default current_date,
  due_date date,
  pdf_path text,
  notes text,
  is_demo boolean not null default false,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_invoices_client on public.invoices(client_id);
create index if not exists idx_invoices_status on public.invoices(status);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  amount_kes numeric(12,2) not null check (amount_kes > 0),
  method text not null default 'mpesa' check (method in ('mpesa','bank','cash','card')),
  reference text,
  paid_at timestamptz not null default now(),
  received_by uuid references public.staff(id) on delete set null,
  till_session_id uuid references public.till_sessions(id) on delete set null,
  is_demo boolean not null default false
);

create table if not exists public.commissions (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid references public.invoices(id) on delete cascade,
  staff_id uuid references public.staff(id) on delete cascade,
  kind text not null default 'commission' check (kind in ('commission','tip')),
  amount_kes numeric(12,2) not null default 0,
  status text not null default 'pending',      -- pending | paid
  is_demo boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references public.businesses(id) on delete set null,
  category text not null default 'operations',
  description text not null,
  vendor text,
  amount_kes numeric(12,2) not null check (amount_kes >= 0),
  method text not null default 'mpesa',
  paid_at date not null default current_date,
  status text not null default 'paid',         -- paid | pending | approved | rejected
  recurring boolean not null default false,
  receipt_path text,
  approved_by uuid references public.profiles(id) on delete set null,
  is_demo boolean not null default false,
  deleted_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.day_closes (
  id uuid primary key default gen_random_uuid(),
  business_date date not null unique,
  totals jsonb not null default '{}',
  closed_by uuid references public.profiles(id) on delete set null,
  closed_at timestamptz not null default now(),
  notes text,
  is_demo boolean not null default false
);

-- ---------- HR & payroll ----------
create table if not exists public.shifts (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid not null references public.staff(id) on delete cascade,
  day date not null,
  start_time time not null default '08:00',
  end_time time not null default '17:00',
  role text,
  is_demo boolean not null default false
);

create table if not exists public.attendance (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid not null references public.staff(id) on delete cascade,
  day date not null,
  status text not null default 'present' check (status in ('present','absent','late','half_day','leave','off')),
  check_in time,
  check_out time,
  notes text,
  is_demo boolean not null default false,
  unique (staff_id, day)
);

create table if not exists public.leave_requests (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid not null references public.staff(id) on delete cascade,
  type text not null default 'annual',         -- annual | sick | unpaid | compassionate | maternity
  from_date date not null,
  to_date date not null,
  days numeric(5,1) not null default 1,
  reason text,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  decided_by uuid references public.profiles(id) on delete set null,
  is_demo boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.salary_advances (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid not null references public.staff(id) on delete cascade,
  amount_kes numeric(12,2) not null check (amount_kes > 0),
  reason text,
  requested_at date not null default current_date,
  status text not null default 'pending' check (status in ('pending','approved','rejected','repaid')),
  repaid_kes numeric(12,2) not null default 0,
  approved_by uuid references public.profiles(id) on delete set null,
  is_demo boolean not null default false
);

create table if not exists public.payroll_runs (
  id uuid primary key default gen_random_uuid(),
  period_start date not null,
  period_end date not null,
  status text not null default 'draft' check (status in ('draft','approved','paid')),
  totals jsonb not null default '{}',
  is_demo boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.payslips (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.payroll_runs(id) on delete cascade,
  staff_id uuid not null references public.staff(id) on delete cascade,
  base_kes numeric(12,2) not null default 0,
  commission_kes numeric(12,2) not null default 0,
  tips_kes numeric(12,2) not null default 0,
  allowances_kes numeric(12,2) not null default 0,
  deductions_kes numeric(12,2) not null default 0,
  advances_kes numeric(12,2) not null default 0,
  net_kes numeric(12,2) not null default 0,
  status text not null default 'draft',
  is_demo boolean not null default false
);

-- ---------- schedule & work ----------
create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references public.businesses(id) on delete set null,
  client_id uuid references public.clients(id) on delete cascade,
  lead_id uuid references public.leads(id) on delete set null,
  staff_id uuid references public.staff(id) on delete set null,
  title text not null,
  type text not null default 'meeting',        -- discovery_call | onboarding | review | delivery | meeting | walk_in
  services jsonb not null default '[]',        -- [{service_id, name, price_kes, duration_min}]
  starts_at timestamptz not null,
  ends_at timestamptz,
  meet_link text,
  location text,
  status text not null default 'booked' check (status in ('booked','confirmed','checked_in','in_progress','completed','no_show','cancelled')),
  queue_no int,
  source text default 'manual',                -- manual | online | walk_in | hermes
  notes text,
  is_demo boolean not null default false,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_appt_starts on public.appointments(starts_at);

create table if not exists public.waitlist (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references public.clients(id) on delete cascade,
  client_name text,
  phone text,
  service_id uuid references public.services(id) on delete set null,
  preferred_at timestamptz,
  status text not null default 'waiting',      -- waiting | offered | booked | removed
  notes text,
  is_demo boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  priority text not null default 'medium' check (priority in ('low','medium','high','urgent')),
  status text not null default 'todo' check (status in ('todo','in_progress','done')),
  due_at timestamptz,
  entity_type text,
  entity_id uuid,
  assignee_id uuid references public.staff(id) on delete set null,
  created_by_kind text not null default 'human' check (created_by_kind in ('human','hermes')),
  created_by text,
  completed_at timestamptz,
  is_demo boolean not null default false,
  deleted_at timestamptz,
  created_at timestamptz not null default now()
);

-- ---------- documents & portal ----------
create table if not exists public.portal_submissions (
  id uuid primary key default gen_random_uuid(),
  doc_type text not null check (doc_type in ('quotation','agreement','founding-partner','onboarding')),
  client_name text,
  agency_name text,
  email text,
  phone text,
  fields jsonb not null default '{}',
  signature_data text,
  agreed boolean not null default false,
  ip text,
  user_agent text,
  created_at timestamptz not null default now()
);

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references public.clients(id) on delete set null,
  type text not null default 'other',          -- onboarding | quotation | agreement | invoice | proposal | other
  name text not null,
  storage_path text,
  fields jsonb not null default '{}',
  signature_data text,
  signature_path text,
  signed_at timestamptz,
  source text not null default 'internal' check (source in ('portal','internal','hermes')),
  status text not null default 'draft',        -- draft | sent | signed | archived
  portal_submission_id uuid references public.portal_submissions(id) on delete set null,
  is_demo boolean not null default false,
  deleted_at timestamptz,
  created_at timestamptz not null default now()
);

-- ---------- activity, automation (Hermes), notifications ----------
create table if not exists public.activities (
  id bigint generated always as identity primary key,
  actor_kind text not null default 'human' check (actor_kind in ('human','bot','system','client')),
  actor_name text not null default 'system',
  verb text not null,
  entity_type text,
  entity_id uuid,
  summary text not null,
  metadata jsonb not null default '{}',
  is_demo boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists idx_activities_created on public.activities(created_at desc);
create index if not exists idx_activities_entity on public.activities(entity_type, entity_id);

create table if not exists public.hermes_bots (
  name text primary key,                       -- scout | sage | herald | echo | ledger
  display_name text not null,
  role text not null,
  routine text,
  schedule text,
  enabled boolean not null default true,
  status text not null default 'idle',         -- idle | running | error | paused
  last_heartbeat timestamptz,
  config jsonb not null default '{}'
);

create table if not exists public.automation_settings (
  key text primary key,
  value jsonb not null,
  description text,
  updated_at timestamptz not null default now(),
  updated_by text
);

create table if not exists public.automation_commands (
  id uuid primary key default gen_random_uuid(),
  command text not null,                       -- trigger_scrape | trigger_enrichment | send_outreach | morning_briefing | ...
  target_bot text references public.hermes_bots(name) on delete set null,
  payload jsonb not null default '{}',
  status text not null default 'pending' check (status in ('pending','acked','running','done','failed','cancelled')),
  requested_by text,
  result jsonb,
  created_at timestamptz not null default now(),
  acked_at timestamptz,
  done_at timestamptz
);
create index if not exists idx_cmd_pending on public.automation_commands(status, created_at);

create table if not exists public.automation_runs (
  id uuid primary key default gen_random_uuid(),
  bot_name text references public.hermes_bots(name) on delete set null,
  routine text not null,
  command_id uuid references public.automation_commands(id) on delete set null,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  status text not null default 'running' check (status in ('running','success','failed','skipped')),
  summary text,
  stats jsonb not null default '{}',
  is_demo boolean not null default false
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,   -- null = everyone
  type text not null default 'info',
  title text not null,
  body text,
  read boolean not null default false,
  entity_type text,
  entity_id uuid,
  is_demo boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.app_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

-- ---------- updated_at triggers ----------
do $$ declare t text; begin
  foreach t in array array['staff','leads','clients','deals','projects','invoices','appointments'] loop
    execute format('drop trigger if exists trg_touch_%1$s on public.%1$I', t);
    execute format('create trigger trg_touch_%1$s before update on public.%1$I for each row execute function public.touch_updated_at()', t);
  end loop;
end $$;

-- ---------- numbering ----------
create or replace function public.assign_invoice_number() returns trigger language plpgsql as $$
begin
  if new.number is null then
    new.number := 'NAS-' || to_char(coalesce(new.issued_at, current_date), 'YYYY') || '-' || lpad(nextval('public.invoice_seq')::text, 4, '0');
  end if;
  return new;
end $$;
drop trigger if exists trg_invoice_number on public.invoices;
create trigger trg_invoice_number before insert on public.invoices for each row execute function public.assign_invoice_number();

create or replace function public.assign_po_number() returns trigger language plpgsql as $$
begin
  if new.number is null then new.number := 'PO-' || lpad(nextval('public.po_seq')::text, 4, '0'); end if;
  return new;
end $$;
drop trigger if exists trg_po_number on public.purchase_orders;
create trigger trg_po_number before insert on public.purchase_orders for each row execute function public.assign_po_number();

-- ---------- invoice totals & payment rollup (to the shilling) ----------
create or replace function public.compute_invoice_totals() returns trigger language plpgsql as $$
declare s numeric(12,2);
begin
  select coalesce(sum(round((coalesce((li->>'qty')::numeric,1) * coalesce((li->>'unit_price_kes')::numeric,0)), 2)), 0)
    into s from jsonb_array_elements(coalesce(new.line_items, '[]'::jsonb)) li;
  if jsonb_array_length(coalesce(new.line_items,'[]'::jsonb)) > 0 then
    new.subtotal_kes := s;
    new.total_kes := greatest(s - coalesce(new.discount_kes,0) + coalesce(new.tax_kes,0) + coalesce(new.tip_kes,0), 0);
  end if;
  return new;
end $$;
drop trigger if exists trg_invoice_totals on public.invoices;
create trigger trg_invoice_totals before insert or update of line_items, discount_kes, tax_kes, tip_kes on public.invoices
  for each row execute function public.compute_invoice_totals();

create or replace function public.rollup_invoice_payments() returns trigger language plpgsql security definer set search_path = public as $$
declare inv uuid := coalesce(new.invoice_id, old.invoice_id); paid numeric(12,2); tot numeric(12,2);
begin
  select coalesce(sum(amount_kes),0) into paid from payments where invoice_id = inv;
  select total_kes into tot from invoices where id = inv;
  update invoices set paid_kes = paid,
    status = case when status = 'void' then 'void'
                  when paid >= tot and tot > 0 then 'paid'
                  when paid > 0 then 'partial'
                  when status in ('paid','partial') then 'sent'
                  else status end
  where id = inv;
  if tg_op = 'INSERT' then
    insert into activities(actor_kind, actor_name, verb, entity_type, entity_id, summary, metadata, is_demo)
    select 'system', 'Ledger', 'payment_received', 'invoice', inv,
           'Payment of KES ' || to_char(new.amount_kes, 'FM999,999,990.00') || ' received via ' || upper(new.method) || ' on ' || i.number,
           jsonb_build_object('amount_kes', new.amount_kes, 'method', new.method, 'reference', new.reference), new.is_demo
    from invoices i where i.id = inv;
  end if;
  return null;
end $$;
drop trigger if exists trg_payment_rollup on public.payments;
create trigger trg_payment_rollup after insert or update or delete on public.payments
  for each row execute function public.rollup_invoice_payments();

-- ---------- activity logging triggers ----------
create or replace function public.log_entity_activity() returns trigger language plpgsql security definer set search_path = public as $$
declare label text; v text; summ text;
  actor text := coalesce(nullif(nullif(current_setting('request.jwt.claims', true), '')::jsonb->>'email', ''), 'system');
begin
  if tg_table_name = 'leads' then
    label := new.business_name;
    if tg_op = 'INSERT' then v := 'lead_created'; summ := 'New lead: ' || label || ' (' || new.source || ')';
    elsif new.status is distinct from old.status then v := 'lead_status'; summ := label || ' moved to ' || replace(new.status,'_',' ');
    else return new; end if;
  elsif tg_table_name = 'clients' then
    if tg_op <> 'INSERT' then return new; end if;
    v := 'client_created'; summ := 'New client: ' || new.business_name;
  elsif tg_table_name = 'deals' then
    if tg_op = 'INSERT' then v := 'deal_created'; summ := 'Deal opened: ' || new.title || ' (KES ' || to_char(new.value_kes,'FM999,999,990') || ')';
    elsif new.stage is distinct from old.stage then v := 'deal_stage'; summ := new.title || ' moved to ' || new.stage;
    else return new; end if;
  elsif tg_table_name = 'appointments' then
    if tg_op = 'INSERT' then v := 'appointment_booked'; summ := 'Booked: ' || new.title || ' on ' || to_char(new.starts_at at time zone 'Africa/Nairobi', 'Dy DD Mon HH24:MI');
    elsif new.status is distinct from old.status then v := 'appointment_status'; summ := new.title || ' is now ' || replace(new.status,'_',' ');
    else return new; end if;
  elsif tg_table_name = 'projects' then
    if tg_op = 'INSERT' then v := 'project_created'; summ := 'Project started: ' || new.name;
    elsif new.status is distinct from old.status then v := 'project_status'; summ := new.name || ' is now ' || replace(new.status,'_',' ');
    else return new; end if;
  elsif tg_table_name = 'invoices' then
    if tg_op = 'INSERT' then v := 'invoice_created'; summ := 'Invoice ' || new.number || ' issued (KES ' || to_char(new.total_kes,'FM999,999,990.00') || ')';
    elsif new.status is distinct from old.status and new.status = 'paid' then v := 'invoice_paid'; summ := 'Invoice ' || new.number || ' fully paid';
    else return new; end if;
  else
    return new;
  end if;
  insert into activities(actor_kind, actor_name, verb, entity_type, entity_id, summary, is_demo)
  values (case when actor = 'system' then 'system' else 'human' end, actor, v, rtrim(tg_table_name, 's'), new.id, summ, coalesce(new.is_demo, false));
  return new;
end $$;
do $$ declare t text; begin
  foreach t in array array['leads','clients','deals','appointments','projects','invoices'] loop
    execute format('drop trigger if exists trg_log_%1$s on public.%1$I', t);
    execute format('create trigger trg_log_%1$s after insert or update on public.%1$I for each row execute function public.log_entity_activity()', t);
  end loop;
end $$;

-- portal signature → documents + activity feed + notification (instant in the office app)
create or replace function public.file_portal_submission() returns trigger language plpgsql security definer set search_path = public as $$
declare cid uuid; doc_name text;
begin
  select id into cid from clients
   where deleted_at is null and (lower(business_name) = lower(new.agency_name) or (new.email is not null and lower(email) = lower(new.email)))
   order by created_at desc limit 1;
  doc_name := case new.doc_type when 'onboarding' then 'Onboarding Guide' when 'quotation' then 'Quotation & Service Agreement Contract'
                when 'agreement' then 'Service Agreement' else 'Founding Partner Agreement' end;
  insert into documents(client_id, type, name, fields, signature_data, signed_at, source, status, portal_submission_id)
  values (cid, new.doc_type, doc_name || ' — ' || coalesce(new.agency_name, new.client_name), new.fields, new.signature_data, new.created_at, 'portal', 'signed', new.id);
  insert into activities(actor_kind, actor_name, verb, entity_type, entity_id, summary, metadata)
  values ('client', coalesce(new.client_name, 'Client'), 'document_signed', 'client', cid,
          coalesce(new.client_name,'Client') || ' of ' || coalesce(new.agency_name,'') || ' signed the ' || doc_name,
          jsonb_build_object('doc_type', new.doc_type, 'submission_id', new.id));
  insert into notifications(type, title, body, entity_type, entity_id)
  values ('document', 'Document signed', coalesce(new.agency_name,'A client') || ' signed the ' || doc_name, 'client', cid);
  return new;
end $$;
drop trigger if exists trg_portal_file on public.portal_submissions;
create trigger trg_portal_file after insert on public.portal_submissions for each row execute function public.file_portal_submission();

-- landing-page lead → notification
create or replace function public.notify_new_web_lead() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.source = 'landing_page' then
    insert into notifications(type, title, body, entity_type, entity_id)
    values ('lead', 'New audit request', new.business_name || ' — ' || coalesce(new.contact_name,'') || ' ' || coalesce(new.phone,''), 'lead', new.id);
  end if;
  return new;
end $$;
drop trigger if exists trg_web_lead on public.leads;
create trigger trg_web_lead after insert on public.leads for each row execute function public.notify_new_web_lead();

-- ---------- business functions (RPC) ----------
-- Lead → Client conversion, carrying the full history over.
create or replace function public.convert_lead(p_lead uuid) returns uuid language plpgsql security definer set search_path = public as $$
declare l leads; cid uuid;
begin
  select * into l from leads where id = p_lead;
  if not found then raise exception 'lead % not found', p_lead; end if;
  if l.converted_client_id is not null then return l.converted_client_id; end if;
  insert into clients(business_id, lead_id, business_name, contact_name, phone, email, location, licence_no, company_size, tags, notes, source, owner_id, is_demo)
  values (l.business_id, l.id, l.business_name, l.contact_name, l.phone, l.email, l.location, l.licence_no, l.company_size, l.tags, l.dossier, l.source, l.owner_id, l.is_demo)
  returning id into cid;
  update leads set status = 'converted', converted_client_id = cid where id = p_lead;
  update appointments set client_id = cid where lead_id = p_lead and client_id is null;
  update deals set client_id = cid where lead_id = p_lead and client_id is null;
  update tasks set entity_type = 'client', entity_id = cid where entity_type = 'lead' and entity_id = p_lead;
  return cid;
end $$;

-- Deal won → 50/50 deposit + balance invoices that add up exactly to the deal value.
create or replace function public.create_deal_invoices(p_deal uuid) returns setof public.invoices language plpgsql security definer set search_path = public as $$
declare d deals; dep numeric(12,2); bal numeric(12,2);
begin
  select * into d from deals where id = p_deal;
  if not found then raise exception 'deal % not found', p_deal; end if;
  dep := round(d.value_kes / 2, 0);
  bal := d.value_kes - dep;
  return query
  insert into invoices(business_id, client_id, deal_id, type, line_items, status, due_date, is_demo)
  values
    (d.business_id, d.client_id, d.id, 'deposit', jsonb_build_array(jsonb_build_object('kind','service','name', d.title || ' — 50% deposit','qty',1,'unit_price_kes',dep)), 'sent', current_date + 3, d.is_demo),
    (d.business_id, d.client_id, d.id, 'balance', jsonb_build_array(jsonb_build_object('kind','service','name', d.title || ' — 50% balance on delivery','qty',1,'unit_price_kes',bal)), 'draft', current_date + 30, d.is_demo)
  returning *;
end $$;

-- ---------- reporting views ----------
create or replace view public.v_lead_funnel with (security_invoker = true) as
select s.status, s.ord, coalesce(c.n, 0) as count
from (values ('new',1),('enriched',2),('queued',3),('sent',4),('replied',5),('booked',6),('converted',7)) s(status, ord)
left join (select status, count(1) n from public.leads where deleted_at is null group by status) c on c.status = s.status
order by s.ord;

create or replace view public.v_mrr with (security_invoker = true) as
select coalesce(sum(case billing_cycle when 'monthly' then amount_kes when 'quarterly' then round(amount_kes/3,2) else round(amount_kes/12,2) end),0)::numeric(12,2) as mrr_kes,
       count(1) filter (where status = 'active') as active_subscriptions
from public.subscriptions where status = 'active';

create or replace view public.v_receivables_ageing with (security_invoker = true) as
select i.id, i.number, i.client_id, c.business_name, i.total_kes, i.paid_kes, (i.total_kes - i.paid_kes) as outstanding_kes, i.due_date,
       case when i.due_date >= current_date then 'current'
            when current_date - i.due_date <= 30 then '1-30'
            when current_date - i.due_date <= 60 then '31-60'
            when current_date - i.due_date <= 90 then '61-90' else '90+' end as bucket
from public.invoices i left join public.clients c on c.id = i.client_id
where i.status in ('sent','partial','overdue') and i.deleted_at is null and i.total_kes > i.paid_kes;

-- ---------- access control: RLS driven by role_permissions ----------
create or replace function public.my_role() returns text language sql stable security definer set search_path = public as $$
  select role from profiles where id = auth.uid() and active
$$;
create or replace function public.is_member() returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and active)
$$;
create or replace function public.has_perm(p_module text, p_action text) returns boolean language sql stable security definer set search_path = public as $$
  select case
    when public.my_role() = 'owner' then true
    when public.my_role() is null then false
    else coalesce((select case p_action when 'view' then can_view when 'create' then can_create when 'edit' then can_edit when 'delete' then can_delete else false end
                   from role_permissions where role = public.my_role() and module = p_module), false)
  end
$$;

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into profiles(id, full_name, email, role)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email,'@',1)), new.email,
          case when (select count(1) from profiles) = 0 then 'owner' else 'staff' end)   -- first sign-up becomes the owner
  on conflict (id) do nothing;
  return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

do $$
declare
  m text[]; t text; modname text;
  map text[] := array[
    'departments:staff','staff:staff','shifts:staff','attendance:staff','leave_requests:staff',
    'leads:leads','campaigns:leads','outreach_messages:leads','replies:leads',
    'clients:clients','client_packages:clients','deals:deals','projects:projects',
    'service_categories:services','services:services','packages:services',
    'membership_plans:memberships','subscriptions:memberships',
    'suppliers:purchases','purchase_orders:purchases','products:inventory',
    'invoices:pos','payments:pos','commissions:payroll','till_sessions:cash_till',
    'expenses:expenses','day_closes:finance',
    'salary_advances:payroll','payroll_runs:payroll','payslips:payroll',
    'appointments:appointments','waitlist:appointments','tasks:tasks',
    'documents:documents','portal_submissions:documents',
    'hermes_bots:hermes','automation_settings:hermes','automation_commands:hermes','automation_runs:hermes',
    'app_settings:settings','businesses:settings'];
  pair text;
begin
  foreach pair in array map loop
    t := split_part(pair, ':', 1); modname := split_part(pair, ':', 2);
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists %I on public.%I', t || '_select', t);
    execute format('drop policy if exists %I on public.%I', t || '_insert', t);
    execute format('drop policy if exists %I on public.%I', t || '_update', t);
    execute format('drop policy if exists %I on public.%I', t || '_delete', t);
    if t = 'businesses' then
      execute format('create policy %I on public.%I for select to authenticated using (public.is_member())', t || '_select', t);
    else
      execute format('create policy %I on public.%I for select to authenticated using (public.has_perm(%L, ''view''))', t || '_select', t, modname);
    end if;
    execute format('create policy %I on public.%I for insert to authenticated with check (public.has_perm(%L, ''create''))', t || '_insert', t, modname);
    execute format('create policy %I on public.%I for update to authenticated using (public.has_perm(%L, ''edit'')) with check (public.has_perm(%L, ''edit''))', t || '_update', t, modname, modname);
    execute format('create policy %I on public.%I for delete to authenticated using (public.has_perm(%L, ''delete''))', t || '_delete', t, modname);
  end loop;
end $$;

-- profiles: everyone in the office sees the team; you edit yourself; owner/admin manage everyone
alter table public.profiles enable row level security;
drop policy if exists profiles_select on public.profiles;
drop policy if exists profiles_update on public.profiles;
create policy profiles_select on public.profiles for select to authenticated using (public.is_member() or id = auth.uid());
create policy profiles_update on public.profiles for update to authenticated
  using (id = auth.uid() or public.my_role() in ('owner','admin'))
  with check (public.my_role() in ('owner','admin') or (id = auth.uid() and role = public.my_role()));

alter table public.role_permissions enable row level security;
drop policy if exists rp_select on public.role_permissions;
drop policy if exists rp_write on public.role_permissions;
create policy rp_select on public.role_permissions for select to authenticated using (public.is_member());
create policy rp_write on public.role_permissions for all to authenticated using (public.my_role() = 'owner') with check (public.my_role() = 'owner');

alter table public.activities enable row level security;
drop policy if exists act_select on public.activities;
drop policy if exists act_insert on public.activities;
create policy act_select on public.activities for select to authenticated using (public.is_member());
create policy act_insert on public.activities for insert to authenticated with check (public.is_member());

alter table public.notifications enable row level security;
drop policy if exists notif_select on public.notifications;
drop policy if exists notif_update on public.notifications;
create policy notif_select on public.notifications for select to authenticated using (public.is_member() and (user_id is null or user_id = auth.uid()));
create policy notif_update on public.notifications for update to authenticated using (user_id is null or user_id = auth.uid());

-- The public web forms never talk to the DB directly: Netlify Functions insert with the service role.
-- (anon has no policies → no access.)

-- ---------- realtime ----------
do $$ declare t text; begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    foreach t in array array['leads','activities','notifications','appointments','automation_commands','automation_runs','hermes_bots','invoices','payments','tasks','documents','deals'] loop
      if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = t) then
        execute format('alter publication supabase_realtime add table public.%I', t);
      end if;
    end loop;
  end if;
end $$;

-- ---------- storage buckets ----------
do $$ begin
  if exists (select 1 from pg_namespace where nspname = 'storage') then
    insert into storage.buckets (id, name, public) values ('documents','documents',false), ('signatures','signatures',false), ('receipts','receipts',false)
    on conflict (id) do nothing;
  end if;
end $$;