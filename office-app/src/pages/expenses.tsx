import { useState } from 'react'
import { toast } from 'sonner'
import { Banknote, Check, Plus, Repeat, Clock } from 'lucide-react'
import { useList, update, remove, invalidate, logActivity, type Row } from '@/services/db'
import { useAuth, currentActor } from '@/lib/auth'
import { useBiz } from '@/lib/business'
import { fmtDate, humanize, kes, kesShort, sum } from '@/lib/utils'
import { PAY_METHODS, methodLabel } from '@/lib/status'
import { Badge, Button, Card, ChevronFilter, Input, Kpi, PageHeader, Select } from '@/components/ui'
import { DataTable } from '@/components/data-table'
import { RecordForm } from '@/components/form'
import { Bars, Donut } from '@/components/charts'

export const EXPENSE_CATS = ['rent', 'internet', 'software', 'ai_api', 'marketing', 'transport', 'office', 'hardware', 'salaries', 'utilities', 'professional_fees', 'other']

export default function Expenses() {
  const { can, profile } = useAuth()
  const { scope, businesses } = useBiz()
  const e = useList('expenses', { filter: (b) => scope(b.is('deleted_at', null)), order: ['paid_at'], limit: 5000 })
  const [f, setF] = useState('all')
  const [edit, setEdit] = useState<Row | null | undefined>(undefined)
  const [fCat, setFCat] = useState('')
  const [fBiz, setFBiz] = useState('')
  const [fMethod, setFMethod] = useState('')
  const [fSource, setFSource] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const rows = e.data || []
  const bizName = (id: string) => businesses.find((b) => b.id === id)?.name || '—'
  const view = rows.filter((r) => (f === 'all' || r.status === f) && (!fCat || r.category === fCat) && (!fBiz || r.business_id === fBiz) && (!fMethod || r.method === fMethod)
    && (!fSource || r.source === fSource) && (!from || String(r.paid_at).slice(0, 10) >= from) && (!to || String(r.paid_at).slice(0, 10) <= to))
  const canApprove = can('expenses', 'approve')
  const decide = async (r: Row, status: 'paid' | 'rejected') => {
    try { await update('expenses', r.id, { status, approved_by: profile?.id }); await logActivity(`${status === 'paid' ? 'Approved' : 'Rejected'} expense: ${r.description} (${kes(r.amount_kes)})`, status === 'paid' ? 'expense_approved' : 'expense_rejected', 'expense', r.id); toast.success(status === 'paid' ? 'Approved' : 'Rejected') }
    catch (err: any) { toast.error(err.message) }
  }
  const m0 = new Date(); m0.setDate(1); m0.setHours(0, 0, 0, 0)
  const month = rows.filter((r) => new Date(r.paid_at) >= m0 && r.status !== 'rejected')
  const byCat = Object.entries(month.reduce((a: Row, r) => { a[r.category] = (a[r.category] || 0) + Number(r.amount_kes); return a }, {})).map(([k, v]) => ({ name: humanize(k), value: v as number })).sort((a, b) => b.value - a.value)
  const pending = rows.filter((r) => r.status === 'pending')
  const trend = Array.from({ length: 6 }, (_, i) => { const a = new Date(m0); a.setMonth(a.getMonth() - (5 - i)); const b = new Date(a); b.setMonth(b.getMonth() + 1); return { label: a.toLocaleDateString('en-KE', { month: 'short' }), value: sum(rows.filter((r) => r.status !== 'rejected' && new Date(r.paid_at) >= a && new Date(r.paid_at) < b), 'amount_kes') } })
  const prevM = trend[4]?.value || 0, curM = trend[5]?.value || 0
  const recurring = Object.values(rows.filter((r) => r.recurring && r.status !== 'rejected').reduce((a: Row, r) => { const k = (r.vendor || r.description).toLowerCase(); if (!a[k] || new Date(r.paid_at) > new Date(a[k].paid_at)) a[k] = r; return a }, {})) as Row[]
  return (
    <div>
      <PageHeader title="Expenses" sub="Every shilling out: rent, software, AI APIs, marketing, transport" actions={can('expenses', 'create') && <Button onClick={() => setEdit(null)}><Plus />Add expense</Button>} />
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4 mb-5">
        <Kpi solid tone="danger" label="This month" value={sum(month, 'amount_kes')} format={kesShort} icon={<Banknote />} />
        <Kpi solid tone="warning" label="Awaiting approval" value={sum(pending, 'amount_kes')} format={kesShort} foot={`${pending.length} expenses`} icon={<Clock />} />
        <Kpi solid tone="info" label="Recurring / month" value={sum(rows.filter((r) => r.recurring && new Date(r.paid_at) >= m0), 'amount_kes')} format={kesShort} icon={<Repeat />} />
        <Kpi solid tone="brand" label="Biggest category" value={byCat[0]?.value || 0} format={kesShort} foot={byCat[0]?.name || '—'} />
        <Kpi solid tone="violet" label="Last month" value={prevM} format={kesShort} foot={prevM ? `${curM > prevM ? 'Up' : 'Down'} ${Math.abs(Math.round(((curM - prevM) / prevM) * 100))}% so far` : '—'} />
        <Kpi solid tone="teal" label="Filtered total" value={sum(view.filter((r) => r.status !== 'rejected'), 'amount_kes')} format={kesShort} foot={`${view.length} expenses`} />
      </div>
      <div className="grid xl:grid-cols-[1fr_360px] gap-4">
        <div className="min-w-0">
          <div className="mb-4"><ChevronFilter value={f} onChange={setF} items={[{ id: 'all', label: 'All', count: rows.length }, { id: 'pending', label: 'Pending', tone: 'warning', count: pending.length }, { id: 'paid', label: 'Paid', tone: 'success', count: rows.filter((r) => r.status === 'paid').length }, { id: 'rejected', label: 'Rejected', tone: 'danger', count: rows.filter((r) => r.status === 'rejected').length }]} /></div>
          <DataTable rows={view} loading={e.isLoading} onRow={setEdit} searchKeys={['description', 'vendor', 'category', 'notes', 'recorded_by']} exportName="expenses" initialSort={['paid_at', 'desc']}
            filters={<>
              <Select size="sm" value={fCat} onChange={setFCat} allowClear="All categories" options={EXPENSE_CATS.map((c) => ({ value: c, label: humanize(c) }))} />
              <Select size="sm" value={fBiz} onChange={setFBiz} allowClear="All businesses" options={businesses.map((b) => ({ value: b.id, label: b.name }))} />
              <Select size="sm" value={fMethod} onChange={setFMethod} allowClear="Any method" options={PAY_METHODS} />
              <Select size="sm" value={fSource} onChange={setFSource} allowClear="Any source" options={[{ value: 'manual', label: 'Manual' }, { value: 'till', label: 'Till paid-out' }, { value: 'purchase', label: 'Purchase order' }, { value: 'hermes', label: 'Hermes' }, { value: 'import', label: 'Import' }]} />
              <div className="grid grid-cols-2 gap-2"><Input type="date" value={from} onChange={(ev) => setFrom(ev.target.value)} className="h-9" aria-label="From" /><Input type="date" value={to} onChange={(ev) => setTo(ev.target.value)} className="h-9" aria-label="To" /></div>
            </>} onClearFilters={() => { setFCat(''); setFBiz(''); setFMethod(''); setFSource(''); setFrom(''); setTo(''); setF('all') }}
            onEdit={can('expenses', 'edit') ? setEdit : undefined} onDelete={can('expenses', 'delete') ? async (r) => { await remove('expenses', r.id, true) } : undefined}
            importTable="expenses" importFields={['paid_at', 'description', 'amount_kes', 'category', 'vendor', 'method', 'notes']} importDefaults={{ status: 'pending', source: 'import', recorded_by: currentActor }} onImported={() => invalidate(['expenses'])}
            bulkActions={canApprove ? (sel, clear) => <Button size="sm" variant="soft" onClick={async () => { const p = sel.filter((r) => r.status === 'pending'); for (const r of p) await update('expenses', r.id, { status: 'paid', approved_by: profile?.id }); await logActivity(`Approved ${p.length} expenses (${kes(sum(p, 'amount_kes'))})`, 'expense_approved'); toast.success(`${p.length} approved`); clear() }}><Check />Approve selected</Button> : undefined}
            cols={[
              { key: 'paid_at', label: 'Date', sort: true, render: (r) => <span className="num">{fmtDate(r.paid_at, 'd MMM yyyy')}</span> },
              { key: 'description', label: 'Expense', sort: true, render: (r) => <div><div className="font-medium">{r.description}</div><div className="text-[12px] text-muted-foreground">{r.vendor}{r.recurring ? ' · recurring' : ''}</div></div> },
              { key: 'category', label: 'Category', hideBelow: 'md', render: (r) => <Badge>{humanize(r.category)}</Badge> },
              { key: 'business_id', label: 'Business', hideBelow: 'lg', render: (r) => bizName(r.business_id), csv: (r) => bizName(r.business_id) },
              { key: 'source', label: 'Source', hideBelow: 'lg', render: (r) => <div><div>{humanize(r.source || 'manual')}</div>{r.recorded_by && <div className="text-[12px] text-muted-foreground">by {r.recorded_by}</div>}</div>, csv: (r) => `${r.source || 'manual'}${r.recorded_by ? ` / ${r.recorded_by}` : ''}` },
              { key: 'method', label: 'Paid via', hideBelow: 'lg', render: (r) => methodLabel(r.method) },
              { key: 'status', label: 'Status', render: (r) => <Badge tone={r.status === 'paid' ? 'success' : r.status === 'pending' ? 'warning' : 'danger'} dot>{humanize(r.status)}</Badge> },
              { key: 'amount_kes', label: 'Amount', align: 'right', sort: true, render: (r) => <span className="font-medium">{kes(r.amount_kes)}</span> },
              { key: 'act', label: '', align: 'right', render: (r) => r.status === 'pending' && canApprove && <div className="flex justify-end gap-1">
                <Button size="sm" variant="soft" onClick={(ev) => { ev.stopPropagation(); decide(r, 'paid') }}><Check />Approve</Button>
                <Button size="sm" variant="ghost" className="text-danger" onClick={(ev) => { ev.stopPropagation(); decide(r, 'rejected') }}>Reject</Button></div> },
            ]} />
        </div>
        <div className="grid gap-4 h-max">
          <Card title="This month by category"><Donut data={byCat} height={190} /></Card>
          <Card title="Last 6 months" sub={prevM ? `${curM > prevM ? 'Up' : 'Down'} ${Math.abs(Math.round(((curM - prevM) / prevM) * 100))}% on last month so far` : 'Spend per month'}><Bars data={trend} x="label" height={170} series={[{ key: 'value', name: 'Spent', color: 'var(--danger)' }]} /></Card>
          <Card title="Recurring commitments" sub={`${kes(sum(recurring, 'amount_kes'))} a month`}>
            {recurring.length ? <ul className="divide-y divide-border/60 text-[13px]">{recurring.slice(0, 8).map((r) => <li key={r.id} className="flex justify-between gap-3 py-2"><span className="truncate">{r.vendor || r.description}<span className="text-muted-foreground"> · {humanize(r.category)}</span></span><span className="num font-medium">{kes(r.amount_kes)}</span></li>)}</ul> : <p className="text-[13px] text-muted-foreground">Mark rent, internet and software as recurring to see them here.</p>}
          </Card>
        </div>
      </div>
      <RecordForm open={edit !== undefined} onOpenChange={(v) => !v && setEdit(undefined)} table="expenses" initial={edit} title={edit ? 'Edit expense' : 'Add expense'}
        fields={[{ name: 'description', label: 'What for', required: true, span: 2 }, { name: 'amount_kes', label: 'Amount (KES)', type: 'number', required: true }, { name: 'category', label: 'Category', type: 'select', options: EXPENSE_CATS.map((c) => ({ value: c, label: humanize(c) })) },
          { name: 'vendor', label: 'Vendor / payee' }, { name: 'method', label: 'Paid via', type: 'select', options: PAY_METHODS }, { name: 'paid_at', label: 'Date', type: 'date' },
          { name: 'status', label: 'Status', type: 'select', options: ['pending', 'paid', 'rejected'].map((s) => ({ value: s, label: humanize(s) })) },
          { name: 'business_id', label: 'Business', type: 'select', options: businesses.map((b) => ({ value: b.id, label: b.name })) }, { name: 'recurring', label: 'Recurring monthly', type: 'switch' }, { name: 'receipt_path', label: 'Receipt link', span: 2 }, { name: 'notes', label: 'Notes', type: 'textarea', span: 2 }]}
        defaults={{ category: 'office', method: 'mpesa', status: canApprove ? 'paid' : 'pending', source: 'manual', recorded_by: currentActor, paid_at: new Date().toISOString().slice(0, 10), business_id: businesses.find((b) => b.is_primary)?.id }}
        preview={(v) => (
          <div className="rounded-card bg-card border border-border/70 p-5 shadow-e1">
            <div className="flex items-center justify-between"><Badge>{humanize(v.category || 'other')}</Badge><Badge tone={v.status === 'paid' ? 'success' : v.status === 'pending' ? 'warning' : 'danger'} dot>{humanize(v.status || 'pending')}</Badge></div>
            <div className="font-semibold text-[17px] mt-3">{v.description || 'New expense'}</div>
            <div className="text-[13px] text-muted-foreground">{v.vendor || 'Vendor'} · {methodLabel(v.method)} · {fmtDate(v.paid_at)}</div>
            <div className="font-display text-[30px] font-semibold num mt-4 text-danger">{kes(v.amount_kes)}</div>
            <div className="text-[12.5px] text-muted-foreground mt-2">{bizName(v.business_id)}{v.recurring ? ' · recurring monthly' : ''} · recorded by {v.recorded_by || currentActor}</div>
            {!canApprove && <div className="text-[12px] text-warning mt-2">Goes to a manager for approval</div>}
          </div>)}
        activity={(v, n) => `${n ? 'Logged' : 'Updated'} expense: ${v.description} (${kes(v.amount_kes)})`} />
    </div>
  )
}