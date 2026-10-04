import { useState } from 'react'
import { toast } from 'sonner'
import { Banknote, Check, Plus, Repeat, Clock } from 'lucide-react'
import { useList, update, logActivity, type Row } from '@/services/db'
import { useAuth } from '@/lib/auth'
import { useBiz } from '@/lib/business'
import { fmtDate, humanize, kes, kesShort, sum } from '@/lib/utils'
import { PAY_METHODS, methodLabel } from '@/lib/status'
import { Badge, Button, Card, ChevronFilter, Kpi, PageHeader } from '@/components/ui'
import { DataTable } from '@/components/data-table'
import { RecordForm } from '@/components/form'
import { Donut } from '@/components/charts'

export const EXPENSE_CATS = ['rent', 'internet', 'software', 'ai_api', 'marketing', 'transport', 'office', 'hardware', 'salaries', 'utilities', 'professional_fees', 'other']

export default function Expenses() {
  const { can, profile } = useAuth()
  const { scope, businesses } = useBiz()
  const e = useList('expenses', { filter: (b) => scope(b.is('deleted_at', null)), order: ['paid_at'], limit: 5000 })
  const [f, setF] = useState('all')
  const [edit, setEdit] = useState<Row | null | undefined>(undefined)
  const rows = e.data || []
  const m0 = new Date(); m0.setDate(1); m0.setHours(0, 0, 0, 0)
  const month = rows.filter((r) => new Date(r.paid_at) >= m0 && r.status !== 'rejected')
  const byCat = Object.entries(month.reduce((a: Row, r) => { a[r.category] = (a[r.category] || 0) + Number(r.amount_kes); return a }, {})).map(([k, v]) => ({ name: humanize(k), value: v as number })).sort((a, b) => b.value - a.value)
  const pending = rows.filter((r) => r.status === 'pending')
  return (
    <div>
      <PageHeader title="Expenses" sub="Every shilling out: rent, software, AI APIs, marketing, transport" actions={can('expenses', 'create') && <Button onClick={() => setEdit(null)}><Plus />Add expense</Button>} />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-5">
        <Kpi solid tone="danger" label="This month" value={sum(month, 'amount_kes')} format={kesShort} icon={<Banknote />} />
        <Kpi solid tone="warning" label="Awaiting approval" value={sum(pending, 'amount_kes')} format={kesShort} foot={`${pending.length} expenses`} icon={<Clock />} />
        <Kpi solid tone="info" label="Recurring / month" value={sum(rows.filter((r) => r.recurring && new Date(r.paid_at) >= m0), 'amount_kes')} format={kesShort} icon={<Repeat />} />
        <Kpi solid tone="brand" label="Biggest category" value={byCat[0]?.value || 0} format={kesShort} foot={byCat[0]?.name || '—'} />
      </div>
      <div className="grid xl:grid-cols-[1fr_360px] gap-4">
        <div className="min-w-0">
          <div className="mb-4"><ChevronFilter value={f} onChange={setF} items={[{ id: 'all', label: 'All', count: rows.length }, { id: 'pending', label: 'Pending', tone: 'warning', count: pending.length }, { id: 'paid', label: 'Paid', tone: 'success', count: rows.filter((r) => r.status === 'paid').length }, { id: 'rejected', label: 'Rejected', tone: 'danger', count: rows.filter((r) => r.status === 'rejected').length }]} /></div>
          <DataTable rows={rows.filter((r) => f === 'all' || r.status === f)} loading={e.isLoading} onRow={setEdit} searchKeys={['description', 'vendor', 'category']} exportName="expenses" initialSort={['paid_at', 'desc']}
            cols={[
              { key: 'paid_at', label: 'Date', sort: true, render: (r) => <span className="num">{fmtDate(r.paid_at, 'd MMM yyyy')}</span> },
              { key: 'description', label: 'Expense', sort: true, render: (r) => <div><div className="font-medium">{r.description}</div><div className="text-[12px] text-muted-foreground">{r.vendor}{r.recurring ? ' · recurring' : ''}</div></div> },
              { key: 'category', label: 'Category', hideBelow: 'md', render: (r) => <Badge>{humanize(r.category)}</Badge> },
              { key: 'method', label: 'Paid via', hideBelow: 'lg', render: (r) => methodLabel(r.method) },
              { key: 'status', label: 'Status', render: (r) => <Badge tone={r.status === 'paid' ? 'success' : r.status === 'pending' ? 'warning' : 'danger'} dot>{humanize(r.status)}</Badge> },
              { key: 'amount_kes', label: 'Amount', align: 'right', sort: true, render: (r) => <span className="font-medium">{kes(r.amount_kes)}</span> },
              { key: 'act', label: '', align: 'right', render: (r) => r.status === 'pending' && can('finance', 'edit') && <div className="flex justify-end gap-1">
                <Button size="sm" variant="soft" onClick={async (ev) => { ev.stopPropagation(); await update('expenses', r.id, { status: 'paid', approved_by: profile?.id }); await logActivity(`Approved expense: ${r.description} (${kes(r.amount_kes)})`, 'expense_approved', 'expense', r.id); toast.success('Approved') }}><Check />Approve</Button>
                <Button size="sm" variant="ghost" className="text-danger" onClick={async (ev) => { ev.stopPropagation(); await update('expenses', r.id, { status: 'rejected' }); toast.success('Rejected') }}>Reject</Button></div> },
            ]} />
        </div>
        <Card title="This month by category" className="h-max"><Donut data={byCat} height={190} /></Card>
      </div>
      <RecordForm open={edit !== undefined} onOpenChange={(v) => !v && setEdit(undefined)} table="expenses" initial={edit} title={edit ? 'Edit expense' : 'Add expense'}
        fields={[{ name: 'description', label: 'What for', required: true, span: 2 }, { name: 'amount_kes', label: 'Amount (KES)', type: 'number', required: true }, { name: 'category', label: 'Category', type: 'select', options: EXPENSE_CATS.map((c) => ({ value: c, label: humanize(c) })) },
          { name: 'vendor', label: 'Vendor / payee' }, { name: 'method', label: 'Paid via', type: 'select', options: PAY_METHODS }, { name: 'paid_at', label: 'Date', type: 'date' },
          { name: 'status', label: 'Status', type: 'select', options: ['pending', 'paid', 'rejected'].map((s) => ({ value: s, label: humanize(s) })) },
          { name: 'business_id', label: 'Business', type: 'select', options: businesses.map((b) => ({ value: b.id, label: b.name })) }, { name: 'recurring', label: 'Recurring monthly', type: 'switch' }, { name: 'receipt_path', label: 'Receipt link', span: 2 }]}
        defaults={{ category: 'office', method: 'mpesa', status: 'pending', paid_at: new Date().toISOString().slice(0, 10), business_id: businesses.find((b) => b.is_primary)?.id }}
        activity={(v, n) => `${n ? 'Logged' : 'Updated'} expense: ${v.description} (${kes(v.amount_kes)})`} />
    </div>
  )
}