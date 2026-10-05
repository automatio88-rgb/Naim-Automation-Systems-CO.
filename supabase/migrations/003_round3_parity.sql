-- 003 — Round 3 parity: approve/export permissions, users/activity/leave modules, stock ledger,
-- PO payments, payslip proration, plan validity, till payouts. Idempotent.

-- ---------- Permissions: 6 action levels (View, Add, Edit, Delete, Approve, Export) ----------
alter table public.role_permissions add column if not exists can_approve boolean not null default false;
alter table public.role_permissions add column if not exists can_export boolean not null default false;

create or replace function public.has_perm(p_module text, p_action text) returns boolean language sql stable security definer set search_path = public as $$
  select case
    when public.my_role() = 'owner' then true
    when public.my_role() is null then false
    else coalesce((select case p_action when 'view' then can_view when 'create' then can_create when 'edit' then can_edit
                                        when 'delete' then can_delete when 'approve' then can_approve when 'export' then can_export else false end
                   from role_permissions where role = public.my_role() and module = p_module), false)
  end
$$;

-- New pages get their own rows: Leave (was inside staff), Users, Activity Logs
insert into public.role_permissions (role, module, can_view, can_create, can_edit, can_delete)
select role, 'leave', can_view or role = 'staff', can_create or role = 'staff', can_edit, can_delete from public.role_permissions where module = 'staff'
on conflict (role, module) do nothing;
insert into public.role_permissions (role, module, can_view, can_create, can_edit, can_delete)
select r, m, r in ('admin','manager'), r = 'admin', r = 'admin', false
from (values ('admin'),('manager'),('staff'),('viewer')) a(r) cross join (values ('users'),('activity_logs')) b(m)
on conflict (role, module) do nothing;

-- Sensible approve/export defaults, only where nothing has been set yet
update public.role_permissions set can_approve = true, can_export = true where role = 'admin' and not can_approve and not can_export;
update public.role_permissions set can_approve = module in ('expenses','leave','purchases','appointments','tasks','documents'), can_export = can_view
  where role = 'manager' and not can_approve and not can_export;
update public.role_permissions set can_export = module in ('reports') where role = 'viewer' and not can_export;

-- Leave requests are now governed by the 'leave' module
alter table public.leave_requests enable row level security;
drop policy if exists leave_requests_select on public.leave_requests;
drop policy if exists leave_requests_insert on public.leave_requests;
drop policy if exists leave_requests_update on public.leave_requests;
drop policy if exists leave_requests_delete on public.leave_requests;
create policy leave_requests_select on public.leave_requests for select to authenticated using (public.has_perm('leave', 'view'));
create policy leave_requests_insert on public.leave_requests for insert to authenticated with check (public.has_perm('leave', 'create'));
create policy leave_requests_update on public.leave_requests for update to authenticated using (public.has_perm('leave', 'edit') or public.has_perm('leave', 'approve')) with check (public.has_perm('leave', 'edit') or public.has_perm('leave', 'approve'));
create policy leave_requests_delete on public.leave_requests for delete to authenticated using (public.has_perm('leave', 'delete'));
alter table public.leave_requests add column if not exists decided_at timestamptz;
alter table public.leave_requests add column if not exists decision_note text;

-- ---------- Stock ledger ----------
create table if not exists public.stock_movements (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  kind text not null default 'adjustment',  -- opening, purchase, sale, usage, adjustment, return, damage
  qty numeric(12,3) not null,               -- signed: + in, − out
  balance_after numeric(12,3),
  unit_cost_kes numeric(12,2),
  ref_type text, ref_id uuid, reason text, recorded_by text,
  is_demo boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists stock_movements_product_idx on public.stock_movements(product_id, created_at desc);

-- ---------- Purchases ----------
alter table public.purchase_orders add column if not exists business_id uuid references public.businesses(id) on delete set null;
alter table public.purchase_orders add column if not exists supplier_ref text;
alter table public.purchase_orders add column if not exists tax_kes numeric(12,2) not null default 0;
alter table public.purchase_orders add column if not exists payments jsonb not null default '[]'::jsonb;
alter table public.suppliers add column if not exists address text;
alter table public.suppliers add column if not exists payment_terms_days integer not null default 30;

-- ---------- Expenses ----------
alter table public.expenses add column if not exists notes text;

-- ---------- Payroll ----------
alter table public.payslips add column if not exists days_worked numeric(5,1);
alter table public.payslips add column if not exists period_days numeric(5,1);
alter table public.payslips add column if not exists incentives_kes numeric(12,2) not null default 0;
alter table public.payslips add column if not exists paid_at timestamptz;
alter table public.payslips add column if not exists method text;
alter table public.salary_advances add column if not exists recovery_per_month_kes numeric(12,2);

-- ---------- Memberships ----------
alter table public.membership_plans add column if not exists validity_days integer not null default 30;
alter table public.membership_plans add column if not exists benefit_type text not null default 'discount';
alter table public.membership_plans add column if not exists description text;
alter table public.subscriptions add column if not exists method text;
alter table public.subscriptions add column if not exists business_id uuid references public.businesses(id) on delete set null;
alter table public.subscriptions add column if not exists sold_by text;

-- ---------- Till ----------
alter table public.till_sessions add column if not exists payouts jsonb not null default '[]'::jsonb;
alter table public.day_closes add column if not exists counted_cash_kes numeric(12,2);
alter table public.day_closes add column if not exists variance_kes numeric(12,2);

-- ---------- RLS for the new table ----------
alter table public.stock_movements enable row level security;
drop policy if exists stock_movements_select on public.stock_movements;
drop policy if exists stock_movements_insert on public.stock_movements;
drop policy if exists stock_movements_update on public.stock_movements;
drop policy if exists stock_movements_delete on public.stock_movements;
create policy stock_movements_select on public.stock_movements for select to authenticated using (public.has_perm('inventory', 'view'));
create policy stock_movements_insert on public.stock_movements for insert to authenticated with check (public.has_perm('inventory', 'edit') or public.has_perm('purchases', 'edit') or public.has_perm('pos', 'create'));
create policy stock_movements_update on public.stock_movements for update to authenticated using (public.has_perm('inventory', 'edit')) with check (public.has_perm('inventory', 'edit'));
create policy stock_movements_delete on public.stock_movements for delete to authenticated using (public.has_perm('inventory', 'delete'));
grant all on public.stock_movements to authenticated, service_role;

-- ---------- Demo backfill ----------
update public.purchase_orders set business_id = (select id from public.businesses where is_primary limit 1) where is_demo and business_id is null;
update public.purchase_orders set payments = jsonb_build_array(jsonb_build_object('amount_kes', paid_kes, 'paid_at', coalesce(received_at, ordered_at), 'method', 'bank'))
  where is_demo and paid_kes > 0 and payments = '[]'::jsonb;
update public.membership_plans set validity_days = case when billing_cycle = 'yearly' then 365 else 30 end where is_demo;
update public.subscriptions set method = 'mpesa' where is_demo and method is null;
update public.payslips set days_worked = 26, period_days = 26 where is_demo and days_worked is null;
insert into public.stock_movements (product_id, kind, qty, balance_after, unit_cost_kes, reason, recorded_by, is_demo, created_at)
select p.id, 'opening', p.stock_qty, p.stock_qty, p.cost_kes, 'Opening balance', 'System', true, p.created_at
from public.products p where p.is_demo and not exists (select 1 from public.stock_movements m where m.product_id = p.id);
insert into public.leave_requests (staff_id, type, from_date, to_date, days, reason, status, is_demo)
select s.id, t.type, current_date + t.off, current_date + t.off + t.len - 1, t.len, t.reason, t.status, true
from (select id, row_number() over (order by full_name) rn from public.staff where is_demo and deleted_at is null) s
join (values (1, 'annual', 9, 3, 'Family visit in Mombasa', 'pending'), (2, 'sick', -6, 2, 'Flu', 'approved'), (3, 'compassionate', 14, 1, 'Funeral', 'pending')) t(rn, type, off, len, reason, status) on t.rn = s.rn
where (select count(1) from public.leave_requests) < 6;
-- Owners and admins manage the permission grid (owner rows don't exist: owner is always full access)
drop policy if exists rp_write on public.role_permissions;
create policy rp_write on public.role_permissions for all to authenticated using (public.my_role() in ('owner','admin')) with check (public.my_role() in ('owner','admin'));
