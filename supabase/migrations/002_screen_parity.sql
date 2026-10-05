-- 002 — Screen-parity columns & tables (from the 77-screenshot audit). Idempotent.

-- Clients (Customer 360 profile rows, preferences, loyalty)
alter table public.clients add column if not exists status text not null default 'active';
alter table public.clients add column if not exists anniversary date;
alter table public.clients add column if not exists preferred_staff_id uuid references public.staff(id) on delete set null;
alter table public.clients add column if not exists referred_by uuid references public.clients(id) on delete set null;
alter table public.clients add column if not exists marketing_consent boolean not null default false;
alter table public.clients add column if not exists loyalty_points integer not null default 0;
alter table public.clients add column if not exists preferences jsonb not null default '{}'::jsonb;

-- Office spaces (salon chairs/rooms -> boardrooms, desks, call booths)
create table if not exists public.office_spaces (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references public.businesses(id) on delete cascade,
  name text not null,
  kind text not null default 'meeting_room',
  capacity integer not null default 1,
  status text not null default 'active',
  sort integer not null default 0,
  is_demo boolean not null default false,
  created_at timestamptz not null default now()
);

-- Appointments (booking form + 360)
alter table public.appointments add column if not exists space_id uuid references public.office_spaces(id) on delete set null;
alter table public.appointments add column if not exists deposit_kes numeric(12,2) not null default 0;
alter table public.appointments add column if not exists no_show_fee_kes numeric(12,2) not null default 0;
alter table public.appointments add column if not exists invoice_id uuid references public.invoices(id) on delete set null;
alter table public.appointments add column if not exists consult_notes text;
alter table public.appointments add column if not exists outcome_notes text;
alter table public.appointments add column if not exists checked_in_at timestamptz;
alter table public.appointments add column if not exists started_at timestamptz;
alter table public.appointments add column if not exists completed_at timestamptz;

-- Invoices / commissions (Invoice 360: refunds, linked appointment, per-line commission)
alter table public.invoices add column if not exists appointment_id uuid references public.appointments(id) on delete set null;
alter table public.invoices add column if not exists refunded_kes numeric(12,2) not null default 0;
alter table public.invoices add column if not exists tax_rate numeric(5,2) not null default 0;
alter table public.invoices add column if not exists tips jsonb not null default '[]'::jsonb;
alter table public.commissions add column if not exists line_label text;
alter table public.commissions add column if not exists base_kes numeric(12,2);
alter table public.commissions add column if not exists rate_pct numeric(5,2);
alter table public.commissions add column if not exists basis text not null default 'net_of_cost';

-- Services (Add Service: cost, buffer, online, discount guardrail) + recipes
alter table public.services add column if not exists cost_kes numeric(12,2) not null default 0;
alter table public.services add column if not exists buffer_min integer not null default 0;
alter table public.services add column if not exists bookable_online boolean not null default true;
alter table public.services add column if not exists max_discount_pct numeric(5,2) not null default 100;
alter table public.services add column if not exists needs_space text;
alter table public.service_categories add column if not exists active boolean not null default true;
create table if not exists public.service_recipes (
  id uuid primary key default gen_random_uuid(),
  service_id uuid not null references public.services(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  qty numeric(12,3) not null default 1,
  is_demo boolean not null default false,
  created_at timestamptz not null default now()
);

-- Products (Add Product fields)
alter table public.products add column if not exists barcode text;
alter table public.products add column if not exists brand text;
alter table public.products add column if not exists pack_size integer not null default 1;
alter table public.products add column if not exists usage_type text not null default 'both';
alter table public.products add column if not exists commission_pct numeric(5,2);
alter table public.products add column if not exists reorder_qty integer;
alter table public.products add column if not exists shelf text;
alter table public.products add column if not exists track_expiry boolean not null default false;

-- Misc list columns
alter table public.departments add column if not exists active boolean not null default true;
alter table public.suppliers add column if not exists status text not null default 'active';
alter table public.waitlist add column if not exists preferred_staff_id uuid references public.staff(id) on delete set null;
alter table public.waitlist add column if not exists window_end timestamptz;
alter table public.expenses add column if not exists source text not null default 'manual';
alter table public.expenses add column if not exists recorded_by text;
alter table public.till_sessions add column if not exists business_id uuid references public.businesses(id) on delete set null;
alter table public.till_sessions add column if not exists paid_out_kes numeric(12,2) not null default 0;
alter table public.staff add column if not exists leave_balance numeric(5,1) not null default 21;
alter table public.staff add column if not exists commission_target_kes numeric(12,2) not null default 0;

-- RLS for the new tables (same has_perm model as the rest)
do $$
declare pair text; t text; m text;
begin
  foreach pair in array array['office_spaces:appointments','service_recipes:services'] loop
    t := split_part(pair, ':', 1); m := split_part(pair, ':', 2);
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists %I on public.%I', t || '_select', t);
    execute format('drop policy if exists %I on public.%I', t || '_insert', t);
    execute format('drop policy if exists %I on public.%I', t || '_update', t);
    execute format('drop policy if exists %I on public.%I', t || '_delete', t);
    execute format('create policy %I on public.%I for select to authenticated using (public.has_perm(%L, ''view''))', t || '_select', t, m);
    execute format('create policy %I on public.%I for insert to authenticated with check (public.has_perm(%L, ''create''))', t || '_insert', t, m);
    execute format('create policy %I on public.%I for update to authenticated using (public.has_perm(%L, ''edit'')) with check (public.has_perm(%L, ''edit''))', t || '_update', t, m, m);
    execute format('create policy %I on public.%I for delete to authenticated using (public.has_perm(%L, ''delete''))', t || '_delete', t, m);
  end loop;
end $$;
grant all on public.office_spaces, public.service_recipes to authenticated, service_role;

-- Demo office spaces + recipes (only when the demo seed is present)
insert into public.office_spaces (business_id, name, kind, capacity, sort, is_demo)
select b.id, s.name, s.kind, s.cap, s.sort, true
from public.businesses b
cross join (values ('Boardroom', 'meeting_room', 8, 1), ('Strategy Room', 'meeting_room', 4, 2), ('Call Booth 1', 'call_booth', 1, 3), ('Call Booth 2', 'call_booth', 1, 4), ('Hot Desk A', 'desk', 1, 5)) as s(name, kind, cap, sort)
where b.is_primary and exists (select 1 from public.clients where is_demo)
  and not exists (select 1 from public.office_spaces);

update public.services set cost_kes = round(price_kes * 0.32), buffer_min = 15 where is_demo and cost_kes = 0;
update public.clients set loyalty_points = floor(random() * 900)::int, marketing_consent = random() > .3,
  preferences = jsonb_build_object('channel', (array['whatsapp','email','phone'])[1 + floor(random()*3)::int], 'meeting', (array['online','office','client_site'])[1 + floor(random()*3)::int], 'language', 'English', 'best_time', (array['morning','afternoon','evening'])[1 + floor(random()*3)::int])
where is_demo and preferences = '{}'::jsonb;
update public.appointments a set space_id = (select id from public.office_spaces order by random() limit 1)
where a.is_demo and a.space_id is null and a.type in ('consultation', 'onboarding', 'review', 'walk_in');