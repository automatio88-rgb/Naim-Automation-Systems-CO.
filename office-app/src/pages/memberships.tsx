import { useState } from 'react'
import { toast } from 'sonner'
import { BadgeCheck, CalendarClock, Plus, Repeat, TrendingUp, Users } from 'lucide-react'
import { useList, insert, update, logActivity, type Row } from '@/services/db'
import { useBiz } from '@/lib/business'
import { fmtDate, humanize, kes, kesShort, pct, sum } from '@/lib/utils'
import { PAY_METHODS, methodLabel } from '@/lib/status'
import { Badge, Button, Card, ChevronFilter, Dialog, Field, Input, Kpi, PageHeader, Progress, Segmented, Select, TabPanel, Tabs } from '@/components/ui'
import { DataTable } from '@/components/data-table'
import { RecordForm } from '@/components/form'
import { useClientOptions, useStaffOptions } from '@/components/shared'

const SUB_TONE: Record<string, any> = { active: 'success', paused: 'warning', past_due: 'danger', cancelled: 'neutral', expired: 'neutral' }
const BENEFIT_TYPES = ['discount', 'included_hours', 'free_services', 'priority_support', 'mixed']
const CYCLE_MONTHS: Record<string, number> = { monthly: 1, quarterly: 3, yearly: 12 }
const cycleShort = (c: string) => (c === 'yearly' ? 'yr' : c === 'quarterly' ? 'qtr' : 'mo')
const iso = (d: Date) => d.toISOString().slice(0, 10)
const addMonths = (d: Date, n: number) => { const x = new Date(d); x.setMonth(x.getMonth() + n); return x }
const addDays = (d: Date | string, n: number) => new Date(new Date(d).getTime() + n * 864e5)
/** A plan with validity_days expires that many days after the start; blank validity means it runs until cancelled. */
const expiryOf = (s: Row) => (s.membership_plans?.validity_days && s.started_at ? iso(addDays(s.started_at, Number(s.membership_plans.validity_days))) : null)

export default function Memberships() {
  const plans = useList('membership_plans', { order: ['price_kes', true] })
  const subs = useList('subscriptions', { select: '*, clients(business_name), membership_plans(name,color,validity_days)', order: ['started_at'] })
  const cp = useList('client_packages', { select: '*, clients(business_name), packages(name)', order: ['purchased_at'] })
  const mrr = useList('v_mrr')
  const { staff } = useStaffOptions()
  const [tab, setTab] = useState('plans')
  const [f, setF] = useState('active')
  const [pf, setPf] = useState('active')
  const [pv, setPv] = useState<'table' | 'cards'>('table')
  const [edit, setEdit] = useState<Row | null | undefined>(undefined)
  const [sell, setSell] = useState<Row | null>(null)
  const S = subs.data || [], PL = plans.data || []
  const active = S.filter((s) => s.status === 'active')
  const onPlan = (id: string) => active.filter((s) => s.plan_id === id)
  const planRows = PL.filter((p) => pf === 'all' || (pf === 'active' ? p.active : !p.active))
  const soon = iso(addDays(new Date(), 30))
  const expiring = active.filter((s) => { const e = expiryOf(s); return e && e <= soon })
  const staffName = (id: string) => staff.find((x) => x.id === id)?.full_name
  return (
    <div>
      <PageHeader title="Care Plans" sub="Monthly retainers after delivery. This is the recurring revenue engine."
        actions={<><Button variant="outline" onClick={() => setSell({})}><Repeat />Sell a plan</Button><Button onClick={() => setEdit(null)}><Plus />New plan</Button></>} />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-5">
        <Kpi solid tone="brand" label="MRR" value={Number(mrr.data?.[0]?.mrr_kes || 0)} format={kesShort} icon={<TrendingUp />} foot={`ARR ${kesShort(Number(mrr.data?.[0]?.mrr_kes || 0) * 12)}`} />
        <Kpi solid tone="success" label="Active client plans" value={active.length} icon={<Users />} foot={`${PL.filter((p) => p.active).length} plans on sale`} />
        <Kpi solid tone="warning" label="Expiring in 30 days" value={expiring.length} icon={<CalendarClock />} onClick={() => { setTab('subs'); setF('active') }} />
        <Kpi solid tone="danger" label="Past due" value={S.filter((s) => s.status === 'past_due').length} onClick={() => { setTab('subs'); setF('past_due') }} />
      </div>
      <Tabs value={tab} onChange={setTab} items={[{ id: 'plans', label: 'Plans', count: PL.length }, { id: 'subs', label: 'Client plans', count: active.length }, { id: 'packages', label: 'Client packages', count: cp.data?.length }]}>
        <TabPanel id="plans">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <ChevronFilter value={pf} onChange={setPf} items={[{ id: 'active', label: 'On sale', tone: 'success', count: PL.filter((p) => p.active).length }, { id: 'hidden', label: 'Hidden', tone: 'neutral', count: PL.filter((p) => !p.active).length }, { id: 'all', label: 'All', count: PL.length }]} />
            <Segmented size="sm" value={pv} onChange={setPv} items={[{ id: 'table', label: 'Table' }, { id: 'cards', label: 'Cards' }]} />
          </div>
          {pv === 'table' ? (
            <DataTable rows={planRows} loading={plans.isLoading} onRow={setEdit} onEdit={setEdit} searchKeys={['name', 'benefit_type', 'description']} exportName="care-plan-catalogue"
              importTable="membership_plans" importFields={['name', 'price_kes', 'billing_cycle', 'validity_days', 'benefit_type', 'discount_pct', 'included_hours', 'description']} importDefaults={{ active: true, billing_cycle: 'monthly' }}
              cols={[
                { key: 'name', label: 'Plan', sort: true, render: (r) => <div><span className="inline-flex items-center gap-2 font-medium"><span className="size-2.5 rounded-full" style={{ background: r.color || 'var(--p)' }} />{r.name}</span>{r.description && <div className="text-[12px] text-muted-foreground truncate max-w-[260px]">{r.description}</div>}</div> },
                { key: 'price_kes', label: 'Price', align: 'right', sort: true, render: (r) => <span className="num">{kes(r.price_kes)}<span className="text-muted-foreground"> / {cycleShort(r.billing_cycle)}</span></span> },
                { key: 'validity_days', label: 'Validity', sort: true, hideBelow: 'md', render: (r) => (r.validity_days ? `${r.validity_days} days` : 'Until cancelled') },
                { key: 'benefit_type', label: 'Benefit', hideBelow: 'md', render: (r) => (r.benefit_type ? <Badge tone="info">{humanize(r.benefit_type)}</Badge> : '—') },
                { key: 'discount_pct', label: 'Discount', align: 'right', sort: true, hideBelow: 'sm', render: (r) => (Number(r.discount_pct) ? `${r.discount_pct}%` : '—') },
                { key: 'included_hours', label: 'Hours', align: 'right', hideBelow: 'lg', render: (r) => r.included_hours || '—' },
                { key: 'clients', label: 'Clients', align: 'right', render: (r) => onPlan(r.id).length, csv: (r: Row) => onPlan(r.id).length },
                { key: 'status', label: 'Status', render: (r) => <Badge tone={r.active ? 'success' : 'neutral'} dot>{r.active ? 'On sale' : 'Hidden'}</Badge> },
                { key: 'act', label: '', align: 'right', render: (r) => r.active && <Button size="sm" variant="soft" onClick={(e: any) => { e.stopPropagation(); setSell({ plan_id: r.id }) }}>Sell</Button> },
              ]} />
          ) : (
            <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">{planRows.map((p) => {
              const n = onPlan(p.id)
              return (
                <Card key={p.id} data-reveal className="relative overflow-hidden">
                  <span className="absolute inset-x-0 top-0 h-1.5" style={{ background: p.color || 'var(--p)' }} />
                  <div className="flex items-center justify-between"><div className="font-semibold">{p.name}</div>{!p.active && <Badge>Hidden</Badge>}</div>
                  <div className="font-display text-[30px] font-semibold num mt-2">{kes(p.price_kes)}<span className="text-[13px] font-sans font-normal text-muted-foreground"> / {cycleShort(p.billing_cycle)}</span></div>
                  <div className="text-[12px] text-muted-foreground mt-1">{p.validity_days ? `Valid ${p.validity_days} days` : 'Until cancelled'}{p.benefit_type ? ` · ${humanize(p.benefit_type)}` : ''}{Number(p.discount_pct) ? ` · ${p.discount_pct}% off extras` : ''}</div>
                  <ul className="mt-3 space-y-1.5 text-[13px] min-h-[96px]">{(p.benefits || []).map((b: string) => <li key={b} className="flex gap-2"><BadgeCheck className="size-4 text-success shrink-0 mt-0.5" />{b}</li>)}</ul>
                  <div className="text-[12.5px] text-muted-foreground mt-3">{n.length} clients · {kes(sum(n, 'amount_kes'))}/mo{p.included_hours ? ` · ${p.included_hours}h included` : ''}</div>
                  <div className="flex gap-2 mt-4"><Button size="sm" onClick={() => setSell({ plan_id: p.id })}>Sell</Button><Button size="sm" variant="ghost" onClick={() => setEdit(p)}>Edit</Button></div>
                </Card>)
            })}</div>
          )}
        </TabPanel>
        <TabPanel id="subs">
          <div className="mb-4"><ChevronFilter value={f} onChange={setF} items={[{ id: 'all', label: 'All', count: S.length }, ...Object.keys(SUB_TONE).map((k) => ({ id: k, label: humanize(k), tone: SUB_TONE[k], count: S.filter((s) => s.status === k).length }))]} /></div>
          <DataTable rows={S.filter((s) => f === 'all' || s.status === f)} loading={subs.isLoading} searchKeys={['clients.business_name', 'membership_plans.name']} exportName="care-plans"
            cols={[
              { key: 'clients.business_name', label: 'Client', sort: true, render: (r) => <span className="font-medium">{r.clients?.business_name}</span> },
              { key: 'membership_plans.name', label: 'Plan', render: (r) => <span className="inline-flex items-center gap-2"><span className="size-2 rounded-full" style={{ background: r.membership_plans?.color }} />{r.membership_plans?.name}</span> },
              { key: 'started_at', label: 'Since', sort: true, hideBelow: 'md', render: (r) => fmtDate(r.started_at) },
              { key: 'next_due', label: 'Next due', sort: true, render: (r) => <span className={r.next_due && new Date(r.next_due) < new Date() && r.status === 'active' ? 'text-danger font-medium' : ''}>{fmtDate(r.next_due)}</span> },
              { key: 'expiry', label: 'Expires', hideBelow: 'sm', render: (r) => { const e = expiryOf(r); return e ? <span className={r.status === 'active' && e <= soon ? 'text-warning font-medium' : ''}>{fmtDate(e)}</span> : <span className="text-muted-foreground">Ongoing</span> }, csv: (r: Row) => expiryOf(r) || '' },
              { key: 'method', label: 'Method', hideBelow: 'lg', render: (r) => (r.method ? methodLabel(r.method) : '—') },
              { key: 'sold_by', label: 'Sold by', hideBelow: 'lg', render: (r) => staffName(r.sold_by) || '—' },
              { key: 'status', label: 'Status', render: (r) => <Badge tone={SUB_TONE[r.status]} dot>{humanize(r.status)}</Badge> },
              { key: 'amount_kes', label: 'Amount', align: 'right', sort: true, render: (r) => kes(r.amount_kes) },
              { key: 'act', label: '', align: 'right', render: (r) => <SubActions s={r} /> },
            ]} />
        </TabPanel>
        <TabPanel id="packages">
          <DataTable rows={cp.data} loading={cp.isLoading} searchKeys={['clients.business_name', 'packages.name']}
            cols={[
              { key: 'clients.business_name', label: 'Client', render: (r) => <span className="font-medium">{r.clients?.business_name}</span> }, { key: 'packages.name', label: 'Package' },
              { key: 'used', label: 'Used', render: (r) => <div className="flex items-center gap-2 w-[150px]"><Progress value={pct(r.sessions_used, r.sessions_total)} className="flex-1" /><span className="num text-[12px]">{r.sessions_used}/{r.sessions_total}</span></div> },
              { key: 'expires_at', label: 'Expires', render: (r) => fmtDate(r.expires_at) }, { key: 'status', label: 'Status', render: (r) => <Badge tone={r.status === 'active' ? 'success' : 'neutral'} dot>{humanize(r.status)}</Badge> },
              { key: 'act', label: '', align: 'right', render: (r) => r.status === 'active' && r.sessions_used < r.sessions_total && <Button size="sm" variant="soft" onClick={async () => { const used = r.sessions_used + 1; await update('client_packages', r.id, { sessions_used: used, status: used >= r.sessions_total ? 'used_up' : 'active' }); toast.success('Session redeemed') }}>Redeem</Button> },
            ]} />
        </TabPanel>
      </Tabs>
      <RecordForm open={edit !== undefined} onOpenChange={(v) => !v && setEdit(undefined)} table="membership_plans" initial={edit} title={edit ? 'Edit plan' : 'New plan'}
        fields={[{ name: 'name', label: 'Name', required: true, span: 2 }, { name: 'price_kes', label: 'Price (KES)', type: 'number', required: true },
          { name: 'billing_cycle', label: 'Billing', type: 'select', options: [{ value: 'monthly', label: 'Monthly' }, { value: 'quarterly', label: 'Quarterly' }, { value: 'yearly', label: 'Yearly' }] },
          { name: 'validity_days', label: 'Validity (days)', type: 'number', hint: 'Blank runs until cancelled' }, { name: 'benefit_type', label: 'Benefit type', type: 'select', options: BENEFIT_TYPES.map((b) => ({ value: b, label: humanize(b) })) },
          { name: 'included_hours', label: 'Included hours / month', type: 'number' }, { name: 'discount_pct', label: 'Discount on extra work %', type: 'number' },
          { name: 'color', label: 'Colour', type: 'color' }, { name: 'active', label: 'On sale', type: 'switch' },
          { name: 'description', label: 'Description', type: 'textarea', span: 2 }, { name: 'benefits', label: 'Benefits', type: 'tags', span: 2, hint: 'Comma separated' }]}
        preview={(v) => Number(v.price_kes) > 0 && <div className="text-[13px]">{v.name || 'This plan'}: {kes(v.price_kes)} per {cycleShort(v.billing_cycle || 'monthly')}{v.validity_days ? `, valid ${v.validity_days} days` : ', until cancelled'}{Number(v.discount_pct) ? `, ${v.discount_pct}% off extra work` : ''}.</div>}
        defaults={{ billing_cycle: 'monthly', active: true, color: '#C8A24A' }} activity={(v, n) => `${n ? 'Created' : 'Updated'} care plan ${v.name}`} />
      {sell && <SellPlan init={sell} plans={PL} onClose={() => setSell(null)} />}
    </div>
  )
}

function SubActions({ s }: { s: Row }) {
  const set = async (status: string) => { await update('subscriptions', s.id, { status, cancelled_at: status === 'cancelled' ? new Date().toISOString() : null }); await logActivity(`${s.clients?.business_name}: care plan ${humanize(status).toLowerCase()}`, 'subscription_' + status, 'subscription', s.id); toast.success('Updated') }
  if (s.status === 'cancelled') return null
  return (
    <div className="flex justify-end gap-1">
      {s.status === 'active' && <Button size="sm" variant="ghost" onClick={async () => {
        const r = await insert('invoices', { client_id: s.client_id, subscription_id: s.id, type: 'subscription', status: 'sent', issued_at: new Date().toISOString(), due_date: s.next_due, ...(s.business_id ? { business_id: s.business_id } : {}), line_items: [{ kind: 'plan', ref_id: s.plan_id, name: `${s.membership_plans?.name} (${fmtDate(s.next_due, 'MMM yyyy')})`, qty: 1, unit_price_kes: Number(s.amount_kes) }] })
        await update('subscriptions', s.id, { next_due: iso(addMonths(new Date(s.next_due || new Date()), CYCLE_MONTHS[s.billing_cycle] || 1)) })
        await logActivity(`Billed care plan for ${s.clients?.business_name}`, 'invoice_created', 'invoice', r.id); toast.success('Invoice raised and next due date moved')
      }}>Bill now</Button>}
      {s.status === 'active' ? <Button size="sm" variant="ghost" onClick={() => set('paused')}>Pause</Button> : <Button size="sm" variant="ghost" onClick={() => set('active')}>Resume</Button>}
      <Button size="sm" variant="ghost" className="text-danger" onClick={() => set('cancelled')}>Cancel</Button>
    </div>
  )
}

function SellPlan({ init, plans, onClose }: { init: Row; plans: Row[]; onClose: () => void }) {
  const { options } = useClientOptions()
  const { options: staffOpts } = useStaffOptions()
  const { businesses, biz: currentBiz } = useBiz()
  const [client, setClient] = useState('')
  const [plan, setPlan] = useState(init.plan_id || '')
  const [start, setStart] = useState(iso(new Date()))
  const [method, setMethod] = useState('mpesa')
  const [bizId, setBizId] = useState(currentBiz || businesses.find((b) => b.is_primary)?.id || '')
  const [soldBy, setSoldBy] = useState('')
  const [busy, setBusy] = useState(false)
  const p = plans.find((x) => x.id === plan)
  const months = p ? CYCLE_MONTHS[p.billing_cycle] || 1 : 1
  const next = iso(addMonths(new Date(start), months))
  const expires = p?.validity_days ? iso(addDays(start, Number(p.validity_days))) : null
  return (
    <Dialog open onOpenChange={(v) => !v && onClose()} size="md" title="Sell a care plan" description="Starts the plan and raises the first invoice."
      footer={<><Button variant="outline" onClick={onClose}>Cancel</Button><Button loading={busy} disabled={!client || !p} onClick={async () => {
        setBusy(true)
        try {
          const s = await insert('subscriptions', { client_id: client, plan_id: p!.id, amount_kes: p!.price_kes, billing_cycle: p!.billing_cycle, status: 'active', started_at: start, next_due: next, method, business_id: bizId || null, sold_by: soldBy || null })
          await insert('invoices', { client_id: client, subscription_id: s.id, type: 'subscription', status: 'sent', issued_at: new Date().toISOString(), due_date: iso(addDays(start, 7)), ...(bizId ? { business_id: bizId } : {}), line_items: [{ kind: 'plan', ref_id: p!.id, name: `${p!.name} (first period)`, qty: 1, unit_price_kes: Number(p!.price_kes) }] })
          await logActivity(`Sold ${p!.name} (${kes(p!.price_kes)}/${cycleShort(p!.billing_cycle)})`, 'subscription_started', 'subscription', s.id, { method, sold_by: soldBy || null }); toast.success('Plan started and first invoice raised'); onClose()
        } catch (e: any) { toast.error(e.message) } finally { setBusy(false) }
      }}>Start plan{p ? ` · ${kes(p.price_kes)}` : ''}</Button></>}>
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Client" className="sm:col-span-2"><Select value={client} onChange={setClient} options={options} placeholder="Select client" /></Field>
        <Field label="Plan" className="sm:col-span-2"><Select value={plan} onChange={setPlan} options={plans.filter((x) => x.active).map((x) => ({ value: x.id, label: `${x.name} · ${kes(x.price_kes)} / ${cycleShort(x.billing_cycle)}` }))} /></Field>
        <Field label="Start date"><Input type="date" value={start} onChange={(e) => setStart(e.target.value)} /></Field>
        <Field label="Payment method"><Select value={method} onChange={setMethod} options={PAY_METHODS} /></Field>
        <Field label="Business"><Select value={bizId} onChange={setBizId} allowClear="Main company" options={businesses.map((b) => ({ value: b.id, label: b.name }))} placeholder="Main company" /></Field>
        <Field label="Sold by"><Select value={soldBy} onChange={setSoldBy} allowClear="Nobody" options={staffOpts} placeholder="Select staff" /></Field>
      </div>
      {p && <div className="rounded-card bg-foreground/[.035] p-4 text-[13px] mt-4">
        <div className="flex items-center justify-between"><div className="font-semibold">{p.name}</div><div className="font-semibold num">{kes(p.price_kes)} / {cycleShort(p.billing_cycle)}</div></div>
        <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1">
          <dt className="text-muted-foreground">Starts</dt><dd className="text-right">{fmtDate(start)}</dd>
          <dt className="text-muted-foreground">Next billing</dt><dd className="text-right">{fmtDate(next)}</dd>
          <dt className="text-muted-foreground">Expires</dt><dd className="text-right">{expires ? fmtDate(expires) : 'Until cancelled'}</dd>
          <dt className="text-muted-foreground">Paid by</dt><dd className="text-right">{methodLabel(method)}</dd>
          {Number(p.discount_pct) > 0 && <><dt className="text-muted-foreground">Extra work</dt><dd className="text-right">{p.discount_pct}% off</dd></>}
        </dl>
        {(p.benefits || []).length > 0 && <ul className="mt-2 space-y-1 border-t border-border/60 pt-2">{(p.benefits || []).map((b: string) => <li key={b} className="flex gap-2"><BadgeCheck className="size-4 text-success shrink-0 mt-0.5" />{b}</li>)}</ul>}
      </div>}
    </Dialog>
  )
}