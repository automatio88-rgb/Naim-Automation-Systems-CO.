import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Check, Info, Moon, Monitor, Sun, Trash2 } from 'lucide-react'
import { DataTable } from '@/components/data-table'
import { useList as useL, remove } from '@/services/db'
import { supabase } from '@/lib/supabase'
import { useList, run, rpc, invalidate, type Row } from '@/services/db'
import { useAuth } from '@/lib/auth'
import { useTheme, PALETTES } from '@/lib/theme'
import { cn, humanize } from '@/lib/utils'
import { Badge, Button, Card, Confirm, Field, Input, PageHeader, Switch, TabPanel, Tabs } from '@/components/ui'
import { RecordForm } from '@/components/form'

const GROUPS: { key: string; title: string; fields: { k: string; label: string; type?: string }[] }[] = [
  { key: 'company', title: 'Company', fields: [{ k: 'name', label: 'Company name' }, { k: 'founder', label: 'Founder' }, { k: 'city', label: 'City' }, { k: 'phone', label: 'Phone' }, { k: 'email', label: 'Email' }, { k: 'kra_pin', label: 'KRA PIN' }] },
  { key: 'banking', title: 'Banking & M-PESA', fields: [{ k: 'mpesa_paybill', label: 'M-PESA Paybill' }, { k: 'account', label: 'Paybill account' }, { k: 'bank', label: 'Bank' }, { k: 'bank_branch', label: 'Branch' }, { k: 'bank_account', label: 'Account number' }] },
  { key: 'invoice', title: 'Invoices', fields: [{ k: 'prefix', label: 'Number prefix' }, { k: 'terms_days', label: 'Payment terms (days)', type: 'number' }, { k: 'footer', label: 'Footer line' }] },
  { key: 'operations', title: 'Operations & booking rules', fields: [{ k: 'currency', label: 'Currency symbol' }, { k: 'timezone', label: 'Timezone' }, { k: 'open_time', label: 'Opens at (HH:MM)' }, { k: 'close_time', label: 'Closes at (HH:MM)' },
    { k: 'working_days_month', label: 'Working days / month (payroll)', type: 'number' }, { k: 'slot_min', label: 'Booking slot (min)', type: 'number' }, { k: 'min_notice_hours', label: 'Min booking notice (hours)', type: 'number' },
    { k: 'no_show_fee', label: 'Default no-show fee (KES)', type: 'number' }, { k: 'deposit_pct', label: 'Default deposit %', type: 'number' }, { k: 'allow_double_booking', label: 'Allow staff double-booking', type: 'bool' }] },
  { key: 'loyalty', title: 'Loyalty & retention', fields: [{ k: 'spend_per_point', label: 'KES spent per point', type: 'number' }, { k: 'point_value', label: 'Value of 1 point (KES)', type: 'number' },
    { k: 'expiry_alert_days', label: 'Plan / package expiry alert (days)', type: 'number' }, { k: 'lapsed_days', label: 'Lapsed client after (days)', type: 'number' }, { k: 'rebook_weeks', label: 'Suggest rebooking every (weeks)', type: 'number' }] },
  { key: 'tax', title: 'Tax', fields: [{ k: 'vat_registered', label: 'VAT registered', type: 'bool' }, { k: 'vat_pct', label: 'VAT %', type: 'number' }, { k: 'withholding_pct', label: 'Withholding %', type: 'number' }] },
]

export default function Settings() {
  const { can } = useAuth()
  const t = useTheme()
  const settings = useList('app_settings')
  const biz = useList('businesses', { order: ['created_at', true] })
  const [tab, setTab] = useState('appearance')
  const [vals, setVals] = useState<Row>({})
  const [busy, setBusy] = useState<string | null>(null)
  const [editBiz, setEditBiz] = useState<Row | null | undefined>(undefined)
  const [purge, setPurge] = useState(false)
  const spaces = useL('office_spaces', { order: ['sort', true] })
  const [editSpace, setEditSpace] = useState<Row | null | undefined>(undefined)
  useEffect(() => { if (settings.data) setVals(Object.fromEntries(settings.data.map((s) => [s.key, s.value]))) }, [settings.data])
  const edit = can('settings', 'edit')
  const save = async (key: string) => {
    setBusy(key)
    try { await run(supabase.from('app_settings').upsert({ key, value: vals[key], updated_at: new Date().toISOString() })); invalidate(['app_settings']); toast.success('Saved') } catch (e: any) { toast.error(e.message) } finally { setBusy(null) }
  }
  return (
    <div>
      <PageHeader title="Settings" sub="Appearance, company details, businesses and data" />
      <Tabs value={tab} onChange={setTab} items={[{ id: 'appearance', label: 'Appearance' }, { id: 'company', label: 'Company & billing' }, { id: 'businesses', label: 'Businesses' }, { id: 'spaces', label: 'Office spaces' }, { id: 'data', label: 'Data' }]}>
        <TabPanel id="appearance">
          <div className="grid lg:grid-cols-2 gap-4">
            <Card title="Mode">
              <div className="grid grid-cols-3 gap-3">{([['light', 'Light', Sun], ['dark', 'Dark', Moon], ['system', 'System', Monitor]] as const).map(([id, label, Icon]) => (
                <button key={id} onClick={() => t.set({ mode: id })} aria-pressed={t.mode === id} className={cn('rounded-card border p-4 flex flex-col items-center gap-2 transition-colors', t.mode === id ? 'border-primary bg-primary/10' : 'border-border hover:bg-foreground/[.03]')}><Icon className="size-5" /><span className="text-[13px] font-medium">{label}</span></button>))}</div>
              <div className="flex items-center justify-between mt-5"><div><div className="font-medium text-[13.5px]">Reduce motion</div><div className="text-[12.5px] text-muted-foreground">Turns off GSAP animations and scroll effects</div></div><Switch checked={t.reduceMotion} onChange={(v) => t.set({ reduceMotion: v })} /></div>
            </Card>
            <Card title="Colour palette" sub="Applies to the whole app, in light and dark">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">{PALETTES.map((p) => (
                <button key={p.id} onClick={() => t.set({ palette: p.id })} aria-pressed={t.palette === p.id} className={cn('rounded-card border p-3 text-left transition-colors', t.palette === p.id ? 'border-primary bg-primary/10' : 'border-border hover:bg-foreground/[.03]')}>
                  <div className="flex gap-1.5"><span className="size-7 rounded-full" style={{ background: p.rail }} /><span className="size-7 rounded-full" style={{ background: p.swatch }} /></div>
                  <div className="flex items-center justify-between mt-2.5"><span className="text-[13px] font-medium">{p.name}</span>{t.palette === p.id && <Check className="size-4 text-primary" />}</div>
                </button>))}</div>
            </Card>
          </div>
        </TabPanel>
        <TabPanel id="company">
          <div className="mb-4 flex items-start gap-2 rounded-[12px] bg-info/10 text-info px-3 py-2.5 text-[13px]"><Info className="size-4 mt-0.5 shrink-0" />These settings drive the whole business: invoices and receipts, booking availability, no-show fees, loyalty points, payroll proration and Hermes reminders.</div>
          <div className="grid lg:grid-cols-2 gap-4">{GROUPS.map((g) => (
            <Card key={g.key} title={g.title} action={edit && <Button size="sm" loading={busy === g.key} onClick={() => save(g.key)}>Save</Button>}>
              <div className="grid sm:grid-cols-2 gap-4">{g.fields.map((f) => {
                const v = vals[g.key]?.[f.k], set = (x: unknown) => setVals((s) => ({ ...s, [g.key]: { ...(s[g.key] || {}), [f.k]: x } }))
                return <Field key={f.k} label={f.label}>{f.type === 'bool' ? <Switch checked={!!v} onChange={set} disabled={!edit} /> : <Input disabled={!edit} type={f.type === 'number' ? 'number' : 'text'} value={v ?? ''} onChange={(e) => set(f.type === 'number' ? Number(e.target.value) : e.target.value)} />}</Field>
              })}</div>
            </Card>))}</div>
        </TabPanel>
        <TabPanel id="businesses">
          <div className="flex justify-end mb-3">{edit && <Button onClick={() => setEditBiz(null)}>Add business</Button>}</div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">{(biz.data || []).map((b) => (
            <Card key={b.id} title={<span className="inline-flex items-center gap-2"><span className="size-3 rounded-full" style={{ background: b.accent || 'var(--p)' }} />{b.name}</span>} sub={b.tagline} action={edit && <Button size="sm" variant="ghost" onClick={() => setEditBiz(b)}>Edit</Button>}>
              <div className="flex flex-wrap gap-2">{b.is_primary && <Badge tone="brand">Primary</Badge>}<Badge>{humanize(b.kind)}</Badge><Badge>{b.currency}</Badge>{b.is_demo && <Badge tone="warning">Demo</Badge>}</div>
              <p className="text-[12.5px] text-muted-foreground mt-3">Switch businesses from the top bar. Side businesses share the team and Hermes but keep their own clients, invoices and reports.</p>
            </Card>))}</div>
        </TabPanel>
        <TabPanel id="spaces">
          <Card title="Office spaces" sub="Boardrooms, call booths and desks. Bookings reserve them and the Queue shows live occupancy." action={edit && <Button size="sm" onClick={() => setEditSpace(null)}>Add space</Button>}>
            <DataTable rows={spaces.data} loading={spaces.isLoading} exportName="office-spaces" title="Office spaces" onEdit={edit ? (r) => setEditSpace(r) : undefined} onDelete={edit ? async (r) => { await remove('office_spaces', r.id) } : undefined}
              cols={[{ key: 'name', label: 'Space', sort: true, render: (r) => <span className="font-medium">{r.name}</span> }, { key: 'kind', label: 'Kind', render: (r) => humanize(r.kind) },
                { key: 'capacity', label: 'Seats', align: 'right', sort: true }, { key: 'sort', label: 'Order', align: 'right', hideBelow: 'md' },
                { key: 'status', label: 'Status', render: (r) => <Badge tone={r.status === 'active' ? 'success' : 'neutral'} dot>{humanize(r.status)}</Badge> }]} />
          </Card>
        </TabPanel>
        <TabPanel id="data">
          <Card title="Demo data" sub="Every demo row is marked is_demo = true. Real records are never touched.">
            <p className="text-[13.5px] mb-4">Remove all sample leads, clients, invoices, staff and runs once you start entering real data. Configuration (bots, permissions, company settings) stays.</p>
            <Button variant="danger" disabled={!edit} onClick={() => setPurge(true)}><Trash2 />Remove all demo data</Button>
          </Card>
        </TabPanel>
      </Tabs>
      <RecordForm open={editSpace !== undefined} onOpenChange={(v) => !v && setEditSpace(undefined)} table="office_spaces" initial={editSpace} title={editSpace ? 'Edit office space' : 'Add office space'}
        fields={[{ name: 'name', label: 'Name', required: true, span: 2 }, { name: 'kind', label: 'Kind', type: 'select', options: ['meeting_room', 'call_booth', 'desk', 'studio', 'other'].map((k) => ({ value: k, label: humanize(k) })) },
          { name: 'capacity', label: 'Seats', type: 'number', min: 1 }, { name: 'sort', label: 'Display order', type: 'number' }, { name: 'status', label: 'Status', type: 'select', options: [{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }] }]}
        defaults={{ kind: 'meeting_room', capacity: 1, sort: 0, status: 'active' }} activity={(v, n) => `${n ? 'Added' : 'Updated'} office space ${v.name}`} />
      <RecordForm open={editBiz !== undefined} onOpenChange={(v) => !v && setEditBiz(undefined)} table="businesses" initial={editBiz} title={editBiz ? 'Edit business' : 'Add business'}
        fields={[{ name: 'name', label: 'Name', required: true }, { name: 'slug', label: 'Short code', required: true }, { name: 'kind', label: 'Kind', type: 'select', options: ['agency', 'studio', 'retail', 'services', 'other'].map((k) => ({ value: k, label: humanize(k) })) },
          { name: 'currency', label: 'Currency' }, { name: 'accent', label: 'Accent', type: 'color' }, { name: 'tagline', label: 'Tagline', span: 2 }]} defaults={{ kind: 'services', currency: 'KES', accent: '#C8A24A' }} />
      <Confirm open={purge} onOpenChange={setPurge} danger title="Remove all demo data?" confirm="Remove demo data" body="This cannot be undone. Only rows marked as demo are deleted."
        onConfirm={async () => { try { await rpc('purge_demo_data'); invalidate(); toast.success('Demo data removed') } catch (e: any) { toast.error(e.message) } finally { setPurge(false) } }} />
    </div>
  )
}