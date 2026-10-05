import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { HeartPulse, Mail, MapPin, Phone, Plus, Repeat, Users, Wallet } from 'lucide-react'
import { useList, remove, logActivity, type Row } from '@/services/db'
import { useAuth } from '@/lib/auth'
import { useBiz } from '@/lib/business'
import { fmtDate, humanize, kes, kesShort, sum } from '@/lib/utils'
import { Avatar, Badge, Button, Card, ChevronFilter, Kpi, PageHeader, Progress, Select } from '@/components/ui'
import { DataTable } from '@/components/data-table'
import { RecordForm } from '@/components/form'
import { Client360, tablePdf, useStaffOptions } from '@/components/shared'

const TIERS = [{ value: 'standard', label: 'Standard' }, { value: 'growth', label: 'Growth' }, { value: 'premium', label: 'Premium' }, { value: 'founding', label: 'Founding partner' }]
const healthTone = (h: number) => (h >= 75 ? 'success' : h >= 50 ? 'warning' : 'danger') as any

export default function Clients() {
  const [params, setParams] = useSearchParams()
  const { can } = useAuth()
  const { scope, businesses } = useBiz()
  const clients = useList('clients', { filter: (b) => scope(b.is('deleted_at', null)), order: ['created_at'] })
  const inv = useList('invoices', { select: 'client_id,total_kes,paid_kes,status', filter: (b) => b.is('deleted_at', null), limit: 5000 })
  const subs = useList('subscriptions', { select: 'client_id,amount_kes,status', limit: 5000 })
  const [open, setOpen] = useState<string | null>(params.get('client'))
  const [edit, setEdit] = useState<Row | null | undefined>(undefined)
  const [tier, setTier] = useState('all')
  const { options: staffOpts } = useStaffOptions()
  const [fStatus, setFStatus] = useState('')
  const [fStaff, setFStaff] = useState('')
  const [fBiz, setFBiz] = useState('')
  useEffect(() => { const c = params.get('client'); if (c) setOpen(c) }, [params])
  const rows: Row[] = (clients.data || []).map((c): Row => {
    const I = (inv.data || []).filter((i) => i.client_id === c.id && i.status !== 'void')
    return { ...c, ltv: sum(I, 'paid_kes'), due: sum(I, (i) => i.total_kes - i.paid_kes), plan: (subs.data || []).find((s) => s.client_id === c.id && s.status === 'active') }
  })
  const view = rows.filter((r) => (tier === 'all' || r.tier === tier) && (!fStatus || (r.status || 'active') === fStatus) && (!fStaff || r.preferred_staff_id === fStaff) && (!fBiz || r.business_id === fBiz))
  const close = () => { setOpen(null); params.delete('client'); setParams(params, { replace: true }) }
  return (
    <div>
      <PageHeader title="Clients" sub="Every agency we serve, with the full history from first scrape to last payment"
        actions={<>
          <Button variant="outline" onClick={() => tablePdf('Clients', ['Client', 'Contact', 'Phone', 'Tier', 'Health', 'Lifetime paid'], view.map((r) => [r.business_name, r.contact_name || '', r.phone || '', humanize(r.tier), r.health, kes(r.ltv)]))}>PDF</Button>
          {can('clients', 'create') && <Button onClick={() => setEdit(null)}><Plus />Add client</Button>}
        </>} />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-5">
        <Kpi solid tone="brand" label="Clients" value={rows.length} icon={<Users />} />
        <Kpi solid tone="info" label="On a care plan" value={rows.filter((r) => r.plan).length} icon={<Repeat />} />
        <Kpi solid tone="success" label="Lifetime collected" value={sum(rows, 'ltv')} format={kesShort} icon={<Wallet />} />
        <Kpi solid tone="danger" label="At churn risk" value={rows.filter((r) => r.health < 50).length} icon={<HeartPulse />} />
      </div>
      <Card pad={false}><div className="p-4">
        <div className="mb-4"><ChevronFilter value={tier} onChange={setTier} items={[{ id: 'all', label: 'All', count: rows.length }, ...TIERS.map((t, i) => ({ id: t.value, label: t.label, count: rows.filter((r) => r.tier === t.value).length, tone: (['neutral', 'info', 'violet', 'brand'] as const)[i] }))]} /></div>
        <DataTable rows={view} loading={clients.isLoading} onRow={(r) => setOpen(r.id)} selectedId={open} searchKeys={['business_name', 'contact_name', 'phone', 'email', 'location']} exportName="clients" title="Clients" initialSort={['ltv', 'desc']}
          filters={<>
            <Select size="sm" value={fStatus} onChange={setFStatus} allowClear="All statuses" options={[{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }]} />
            <Select size="sm" value={fStaff} onChange={setFStaff} allowClear="Any account manager" options={staffOpts} />
            <Select size="sm" value={fBiz} onChange={setFBiz} allowClear="All businesses" options={businesses.map((b) => ({ value: b.id, label: b.name }))} />
          </>} onClearFilters={() => { setFStatus(''); setFStaff(''); setFBiz(''); setTier('all') }}
          onView={(r) => setOpen(r.id)} onEdit={can('clients', 'edit') ? (r) => setEdit(r) : undefined}
          onDelete={can('clients', 'delete') ? async (r) => { await remove('clients', r.id, true) } : undefined}
          importTable={can('clients', 'create') ? 'clients' : undefined} importFields={['business_name', 'contact_name', 'phone', 'email', 'location', 'licence_no', 'company_size', 'tier', 'birthday']} importDefaults={{ tier: 'standard', health: 80, source: 'import' }}
          cols={[
            { key: 'business_name', label: 'Client', sort: true, render: (r) => <div className="flex items-center gap-3 min-w-[220px]"><Avatar name={r.business_name} size={34} /><div className="min-w-0"><div className="font-medium truncate">{r.business_name}</div><div className="text-[12px] text-muted-foreground truncate">{r.contact_name}{r.location ? ` · ${r.location}` : ''}</div></div></div> },
            { key: 'phone', label: 'Mobile', hideBelow: 'md', render: (r) => <span className="num">{r.phone || '—'}</span> },
            { key: 'email', label: 'Email', hideBelow: 'lg', render: (r) => <span className="text-[12.5px]">{r.email || '—'}</span> },
            { key: 'tier', label: 'Tier', sort: true, render: (r) => <Badge tone="brand">{humanize(r.tier)}</Badge> },
            { key: 'status', label: 'Status', sort: true, hideBelow: 'md', render: (r) => <Badge tone={(r.status || 'active') === 'active' ? 'success' : 'neutral'} dot>{humanize(r.status || 'active')}</Badge> },
            { key: 'loyalty_points', label: 'Points', sort: true, align: 'right', hideBelow: 'lg', render: (r) => (r.loyalty_points || 0).toLocaleString('en-KE') },
            { key: 'health', label: 'Health', sort: true, hideBelow: 'sm', render: (r) => <div className="flex items-center gap-2 w-[110px]"><Progress value={r.health} tone={healthTone(r.health)} className="flex-1" /><span className="num text-[12px] w-6">{r.health}</span></div> },
            { key: 'plan', label: 'Care plan', hideBelow: 'lg', render: (r) => r.plan ? <Badge tone="success" dot>{kes(r.plan.amount_kes)}/mo</Badge> : <span className="text-muted-foreground">—</span>, csv: (r) => r.plan?.amount_kes || '' },
            { key: 'due', label: 'Outstanding', align: 'right', sort: true, hideBelow: 'md', render: (r) => r.due > 0 ? <span className="text-danger font-medium">{kes(r.due)}</span> : '—' },
            { key: 'ltv', label: 'Lifetime', align: 'right', sort: true, render: (r) => kes(r.ltv) },
          ]} />
      </div></Card>
      <Client360 id={open} onOpenChange={(v) => !v && close()} onEdit={can('clients', 'edit') ? (c) => { close(); setEdit(c) } : undefined}
        onDelete={can('clients', 'delete') ? async (c) => { await remove('clients', c.id, true); await logActivity(`Archived client ${c.business_name}`, 'client_deleted', 'client', c.id); close() } : undefined} />
      <RecordForm open={edit !== undefined} onOpenChange={(v) => !v && setEdit(undefined)} table="clients" initial={edit} title={edit ? 'Edit client' : 'Add client'}
        description="Clients converted from leads arrive automatically with their full history."
        fields={[
          { name: 'business_name', label: 'Agency / business', required: true, span: 2 }, { name: 'contact_name', label: 'Contact person', required: true },
          { name: 'phone', label: 'Mobile', type: 'tel', required: true }, { name: 'email', label: 'Email', type: 'email' }, { name: 'location', label: 'Location' },
          { name: 'licence_no', label: 'NEA licence no.' }, { name: 'company_size', label: 'Team size' },
          { name: 'tier', label: 'Tier', type: 'select', options: TIERS }, { name: 'business_id', label: 'Business', type: 'select', options: businesses.map((b) => ({ value: b.id, label: b.name })) },
          { name: 'status', label: 'Status', type: 'select', options: [{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }] },
          { name: 'preferred_staff_id', label: 'Account manager', type: 'select', options: staffOpts },
          { name: 'source', label: 'How did they find us?', type: 'select', options: ['referral', 'scraped', 'website', 'whatsapp', 'event', 'social', 'manual'].map((x) => ({ value: x, label: humanize(x) })) },
          { name: 'referred_by', label: 'Referred by', type: 'select', options: rows.map((r) => ({ value: r.id, label: r.business_name })) },
          { name: 'birthday', label: "Director's birthday", type: 'date' }, { name: 'anniversary', label: 'Client anniversary', type: 'date' },
          { name: 'marketing_consent', label: 'Agrees to marketing messages', type: 'switch' }, { name: 'tags', label: 'Tags', type: 'tags' }, { name: 'notes', label: 'Notes', type: 'textarea' },
        ]}
        defaults={{ tier: 'standard', health: 80, source: 'manual', status: 'active', marketing_consent: false, business_id: businesses.find((b) => b.is_primary)?.id }}
        activity={(v, n) => `${n ? 'Added' : 'Updated'} client ${v.business_name}`}
        preview={(v) => (
          <div className="rounded-card bg-card border border-border/70 p-5 shadow-e1">
            <div className="flex flex-col items-center text-center">
              <Avatar name={v.business_name || '?'} size={60} />
              <div className="mt-3 font-semibold text-[16px]">{v.business_name || 'New client'}</div>
              <div className="mt-1.5"><Badge tone="brand">{humanize(v.tier || 'standard')}</Badge></div>
            </div>
            <ul className="mt-5 space-y-2.5 text-[13px]">
              {[[<Users />, v.contact_name], [<Phone />, v.phone], [<Mail />, v.email], [<MapPin />, v.location]].map(([ic, val], i) => (
                <li key={i} className="flex items-center gap-2.5 [&_svg]:size-4 [&_svg]:text-muted-foreground">{ic}<span className={val ? '' : 'text-muted-foreground'}>{(val as string) || '—'}</span></li>))}
            </ul>
            <div className="mt-5 text-[12px] text-muted-foreground">Joins {fmtDate(new Date())}</div>
          </div>
        )} />
    </div>
  )
}