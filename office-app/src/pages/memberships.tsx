import { useState } from 'react'
import { toast } from 'sonner'
import { BadgeCheck, Plus, Repeat, TrendingUp, Users } from 'lucide-react'
import { useList, insert, update, logActivity, type Row } from '@/services/db'
import { fmtDate, humanize, kes, kesShort, pct, sum } from '@/lib/utils'
import { Badge, Button, Card, ChevronFilter, Dialog, Field, Kpi, PageHeader, Progress, Select, TabPanel, Tabs } from '@/components/ui'
import { DataTable } from '@/components/data-table'
import { RecordForm } from '@/components/form'
import { useClientOptions } from '@/components/shared'

const SUB_TONE: Record<string, any> = { active: 'success', paused: 'warning', past_due: 'danger', cancelled: 'neutral', expired: 'neutral' }

export default function Memberships() {
  const plans = useList('membership_plans', { order: ['price_kes', true] })
  const subs = useList('subscriptions', { select: '*, clients(business_name), membership_plans(name,color)', order: ['started_at'] })
  const cp = useList('client_packages', { select: '*, clients(business_name), packages(name)', order: ['purchased_at'] })
  const mrr = useList('v_mrr')
  const [tab, setTab] = useState('plans')
  const [f, setF] = useState('active')
  const [edit, setEdit] = useState<Row | null | undefined>(undefined)
  const [sell, setSell] = useState<Row | null>(null)
  const S = subs.data || []
  const active = S.filter((s) => s.status === 'active')
  return (
    <div>
      <PageHeader title="Care Plans" sub="Monthly retainers after delivery. This is the recurring revenue engine."
        actions={<><Button variant="outline" onClick={() => setSell({})}><Repeat />Sell a plan</Button><Button onClick={() => setEdit(null)}><Plus />New plan</Button></>} />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-5">
        <Kpi solid tone="brand" label="MRR" value={Number(mrr.data?.[0]?.mrr_kes || 0)} format={kesShort} icon={<TrendingUp />} />
        <Kpi solid tone="info" label="ARR" value={Number(mrr.data?.[0]?.mrr_kes || 0) * 12} format={kesShort} />
        <Kpi solid tone="success" label="Active plans" value={active.length} icon={<Users />} />
        <Kpi solid tone="danger" label="Past due" value={S.filter((s) => s.status === 'past_due').length} />
      </div>
      <Tabs value={tab} onChange={setTab} items={[{ id: 'plans', label: 'Plans' }, { id: 'subs', label: 'Client plans', count: active.length }, { id: 'packages', label: 'Client packages', count: cp.data?.length }]}>
        <TabPanel id="plans">
          <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">{(plans.data || []).map((p) => {
            const n = active.filter((s) => s.plan_id === p.id)
            return (
              <Card key={p.id} data-reveal className="relative overflow-hidden">
                <span className="absolute inset-x-0 top-0 h-1.5" style={{ background: p.color || 'var(--p)' }} />
                <div className="flex items-center justify-between"><div className="font-semibold">{p.name}</div>{!p.active && <Badge>Hidden</Badge>}</div>
                <div className="font-display text-[30px] font-semibold num mt-2">{kes(p.price_kes)}<span className="text-[13px] font-sans font-normal text-muted-foreground"> / {p.billing_cycle === 'yearly' ? 'yr' : 'mo'}</span></div>
                <ul className="mt-3 space-y-1.5 text-[13px] min-h-[96px]">{(p.benefits || []).map((b: string) => <li key={b} className="flex gap-2"><BadgeCheck className="size-4 text-success shrink-0 mt-0.5" />{b}</li>)}</ul>
                <div className="text-[12.5px] text-muted-foreground mt-3">{n.length} clients · {kes(sum(n, 'amount_kes'))}/mo{p.included_hours ? ` · ${p.included_hours}h included` : ''}</div>
                <div className="flex gap-2 mt-4"><Button size="sm" onClick={() => setSell({ plan_id: p.id })}>Sell</Button><Button size="sm" variant="ghost" onClick={() => setEdit(p)}>Edit</Button></div>
              </Card>)
          })}</div>
        </TabPanel>
        <TabPanel id="subs">
          <div className="mb-4"><ChevronFilter value={f} onChange={setF} items={[{ id: 'all', label: 'All', count: S.length }, ...Object.keys(SUB_TONE).map((k) => ({ id: k, label: humanize(k), tone: SUB_TONE[k], count: S.filter((s) => s.status === k).length }))]} /></div>
          <DataTable rows={S.filter((s) => f === 'all' || s.status === f)} loading={subs.isLoading} searchKeys={['clients.business_name', 'membership_plans.name']} exportName="care-plans"
            cols={[
              { key: 'clients.business_name', label: 'Client', sort: true, render: (r) => <span className="font-medium">{r.clients?.business_name}</span> },
              { key: 'membership_plans.name', label: 'Plan', render: (r) => <span className="inline-flex items-center gap-2"><span className="size-2 rounded-full" style={{ background: r.membership_plans?.color }} />{r.membership_plans?.name}</span> },
              { key: 'started_at', label: 'Since', sort: true, hideBelow: 'md', render: (r) => fmtDate(r.started_at) },
              { key: 'next_due', label: 'Next due', sort: true, render: (r) => <span className={r.next_due && new Date(r.next_due) < new Date() && r.status === 'active' ? 'text-danger font-medium' : ''}>{fmtDate(r.next_due)}</span> },
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
          { name: 'billing_cycle', label: 'Billing', type: 'select', options: [{ value: 'monthly', label: 'Monthly' }, { value: 'yearly', label: 'Yearly' }] },
          { name: 'included_hours', label: 'Included hours / month', type: 'number' }, { name: 'discount_pct', label: 'Discount on extra work %', type: 'number' },
          { name: 'color', label: 'Colour', type: 'color' }, { name: 'active', label: 'Active', type: 'switch' }, { name: 'benefits', label: 'Benefits', type: 'tags', span: 2, hint: 'Comma separated' }]}
        defaults={{ billing_cycle: 'monthly', active: true, color: '#C8A24A' }} activity={(v, n) => `${n ? 'Created' : 'Updated'} care plan ${v.name}`} />
      {sell && <SellPlan init={sell} plans={plans.data || []} onClose={() => setSell(null)} />}
    </div>
  )
}

function SubActions({ s }: { s: Row }) {
  const set = async (status: string) => { await update('subscriptions', s.id, { status, cancelled_at: status === 'cancelled' ? new Date().toISOString() : null }); await logActivity(`${s.clients?.business_name}: care plan ${humanize(status).toLowerCase()}`, 'subscription_' + status, 'subscription', s.id); toast.success('Updated') }
  if (s.status === 'cancelled') return null
  return (
    <div className="flex justify-end gap-1">
      {s.status === 'active' && <Button size="sm" variant="ghost" onClick={async () => {
        const r = await insert('invoices', { client_id: s.client_id, subscription_id: s.id, type: 'subscription', status: 'sent', issued_at: new Date().toISOString(), due_date: s.next_due, line_items: [{ kind: 'plan', ref_id: s.plan_id, name: `${s.membership_plans?.name} (${fmtDate(s.next_due, 'MMM yyyy')})`, qty: 1, unit_price_kes: Number(s.amount_kes) }] })
        const n = new Date(s.next_due || new Date()); n.setMonth(n.getMonth() + (s.billing_cycle === 'yearly' ? 12 : 1))
        await update('subscriptions', s.id, { next_due: n.toISOString().slice(0, 10) })
        await logActivity(`Billed care plan for ${s.clients?.business_name}`, 'invoice_created', 'invoice', r.id); toast.success('Invoice raised and next due date moved')
      }}>Bill now</Button>}
      {s.status === 'active' ? <Button size="sm" variant="ghost" onClick={() => set('paused')}>Pause</Button> : <Button size="sm" variant="ghost" onClick={() => set('active')}>Resume</Button>}
      <Button size="sm" variant="ghost" className="text-danger" onClick={() => set('cancelled')}>Cancel</Button>
    </div>
  )
}

function SellPlan({ init, plans, onClose }: { init: Row; plans: Row[]; onClose: () => void }) {
  const { options } = useClientOptions()
  const [client, setClient] = useState('')
  const [plan, setPlan] = useState(init.plan_id || '')
  const [busy, setBusy] = useState(false)
  const p = plans.find((x) => x.id === plan)
  return (
    <Dialog open onOpenChange={(v) => !v && onClose()} size="sm" title="Sell a care plan"
      footer={<><Button variant="outline" onClick={onClose}>Cancel</Button><Button loading={busy} disabled={!client || !p} onClick={async () => {
        setBusy(true)
        try {
          const next = new Date(); next.setMonth(next.getMonth() + (p!.billing_cycle === 'yearly' ? 12 : 1))
          const s = await insert('subscriptions', { client_id: client, plan_id: p!.id, amount_kes: p!.price_kes, billing_cycle: p!.billing_cycle, status: 'active', started_at: new Date().toISOString().slice(0, 10), next_due: next.toISOString().slice(0, 10) })
          await insert('invoices', { client_id: client, subscription_id: s.id, type: 'subscription', status: 'sent', issued_at: new Date().toISOString(), due_date: new Date(Date.now() + 7 * 864e5).toISOString().slice(0, 10), line_items: [{ kind: 'plan', ref_id: p!.id, name: `${p!.name} (first period)`, qty: 1, unit_price_kes: Number(p!.price_kes) }] })
          await logActivity(`Sold ${p!.name} (${kes(p!.price_kes)}/mo)`, 'subscription_started', 'subscription', s.id); toast.success('Plan started and first invoice raised'); onClose()
        } catch (e: any) { toast.error(e.message) } finally { setBusy(false) }
      }}>Start plan</Button></>}>
      <div className="grid gap-4">
        <Field label="Client"><Select value={client} onChange={setClient} options={options} placeholder="Select client" /></Field>
        <Field label="Plan"><Select value={plan} onChange={setPlan} options={plans.filter((x) => x.active).map((x) => ({ value: x.id, label: `${x.name} · ${kes(x.price_kes)}` }))} /></Field>
        {p && <div className="rounded-card bg-foreground/[.035] p-4 text-[13px]"><div className="font-semibold">{p.name}</div><ul className="mt-2 space-y-1">{(p.benefits || []).map((b: string) => <li key={b}>{b}</li>)}</ul><div className="mt-2 text-muted-foreground">First invoice is raised now, then every {p.billing_cycle === 'yearly' ? 'year' : 'month'}.</div></div>}
      </div>
    </Dialog>
  )
}