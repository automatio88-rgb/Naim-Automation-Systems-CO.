import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { Plus, Trash2, ReceiptText } from 'lucide-react'
import { useList, insert, logActivity, type Row } from '@/services/db'
import { useBiz } from '@/lib/business'
import { fmtDate, humanize, kes, kesShort, sum } from '@/lib/utils'
import { INVOICE_STATUS } from '@/lib/status'
import { Button, ChevronFilter, Dialog, Field, Input, Kpi, PageHeader, Select, StatusBadge, Textarea } from '@/components/ui'
import { DataTable } from '@/components/data-table'
import { Invoice360, useClientOptions } from '@/components/shared'

const TYPES = ['one_off', 'deposit', 'balance', 'subscription', 'pos'].map((v) => ({ value: v, label: humanize(v) }))

export default function Invoices() {
  const [params, setParams] = useSearchParams()
  const { scope } = useBiz()
  const inv = useList('invoices', { select: '*, clients(business_name)', filter: (b) => scope(b.is('deleted_at', null)), order: ['issued_at'], limit: 5000 })
  const [open, setOpen] = useState<string | null>(params.get('invoice'))
  const [f, setF] = useState('all')
  const [creating, setCreating] = useState(false)
  useEffect(() => { const i = params.get('invoice'); if (i) setOpen(i) }, [params])
  const rows: Row[] = (inv.data || []).map((i): Row => ({ ...i, overdue: i.status !== 'paid' && i.status !== 'void' && i.status !== 'draft' && i.due_date && new Date(i.due_date) < new Date() }))
  const counts = useMemo(() => { const c: Row = {}; rows.forEach((r) => { c[r.status] = (c[r.status] || 0) + 1 }); return c }, [rows])
  const out = rows.filter((r) => !['paid', 'void', 'draft'].includes(r.status))
  const close = () => { setOpen(null); params.delete('invoice'); setParams(params, { replace: true }) }
  return (
    <div>
      <PageHeader title="Invoices" sub="Deposits, balances, care-plan billing and POS sales. Payments roll up automatically." actions={<Button onClick={() => setCreating(true)}><Plus />New invoice</Button>} />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-5">
        <Kpi solid tone="brand" label="Billed" value={sum(rows.filter((r) => r.status !== 'void'), 'total_kes')} format={kesShort} icon={<ReceiptText />} />
        <Kpi solid tone="success" label="Collected" value={sum(rows, 'paid_kes')} format={kesShort} />
        <Kpi solid tone="warning" label="Outstanding" value={sum(out, (r) => r.total_kes - r.paid_kes)} format={kesShort} foot={`${out.length} invoices`} />
        <Kpi solid tone="danger" label="Overdue" value={sum(rows.filter((r) => r.overdue), (r) => r.total_kes - r.paid_kes)} format={kesShort} foot={`${rows.filter((r) => r.overdue).length} invoices`} />
      </div>
      <div className="mb-4"><ChevronFilter value={f} onChange={setF} items={[{ id: 'all', label: 'All', count: rows.length }, ...Object.entries(INVOICE_STATUS).map(([id, s]) => ({ id, label: s.label, tone: s.tone, count: counts[id] || 0 }))]} /></div>
      <DataTable rows={rows.filter((r) => f === 'all' || r.status === f)} loading={inv.isLoading} onRow={(r) => setOpen(r.id)} selectedId={open} searchKeys={['number', 'clients.business_name', 'type']} exportName="invoices" initialSort={['issued_at', 'desc']}
        cols={[
          { key: 'number', label: 'Invoice', sort: true, render: (r) => <span className="font-medium num">{r.number}</span> },
          { key: 'clients.business_name', label: 'Client', sort: true, render: (r) => r.clients?.business_name || 'Walk-in' },
          { key: 'type', label: 'Type', hideBelow: 'md', render: (r) => humanize(r.type) },
          { key: 'issued_at', label: 'Issued', sort: true, hideBelow: 'sm', render: (r) => fmtDate(r.issued_at) },
          { key: 'due_date', label: 'Due', sort: true, hideBelow: 'lg', render: (r) => <span className={r.overdue ? 'text-danger font-medium' : ''}>{fmtDate(r.due_date)}</span> },
          { key: 'status', label: 'Status', sort: true, render: (r) => <StatusBadge map={INVOICE_STATUS} value={r.status} /> },
          { key: 'balance', label: 'Balance', align: 'right', hideBelow: 'md', sort: (r) => r.total_kes - r.paid_kes, render: (r) => kes(r.total_kes - r.paid_kes), csv: (r) => r.total_kes - r.paid_kes },
          { key: 'total_kes', label: 'Total', align: 'right', sort: true, render: (r) => <span className="font-medium">{kes(r.total_kes)}</span> },
        ]} />
      <Invoice360 id={open} onOpenChange={(v) => !v && close()} />
      {creating && <NewInvoice onClose={(id) => { setCreating(false); if (id) setOpen(id) }} />}
    </div>
  )
}

function NewInvoice({ onClose }: { onClose: (id?: string) => void }) {
  const { options: clientOpts } = useClientOptions()
  const { businesses } = useBiz()
  const services = useList('services', { select: 'id,name,price_kes', filter: (b) => b.eq('active', true).is('deleted_at', null), order: ['name', true] })
  const [client, setClient] = useState('')
  const [type, setType] = useState('one_off')
  const due = new Date(Date.now() + 7 * 864e5).toISOString().slice(0, 10)
  const [dueDate, setDueDate] = useState(due)
  const [lines, setLines] = useState<Row[]>([{ kind: 'service', name: '', qty: 1, unit_price_kes: 0 }])
  const [discount, setDiscount] = useState('0')
  const [tax, setTax] = useState('0')
  const [notes, setNotes] = useState('')
  const [busy, setBusy] = useState(false)
  const setLine = (i: number, p: Row) => setLines((l) => l.map((x, j) => (j === i ? { ...x, ...p } : x)))
  const subtotal = sum(lines, (l) => Number(l.qty || 0) * Number(l.unit_price_kes || 0))
  const total = Math.max(0, subtotal - Number(discount || 0) + Number(tax || 0))
  async function save(status: string) {
    const li = lines.filter((l) => l.name && Number(l.qty) > 0).map((l) => ({ ...l, qty: Number(l.qty), unit_price_kes: Number(l.unit_price_kes) }))
    if (!li.length) return toast.error('Add at least one line item')
    setBusy(true)
    try {
      const r = await insert('invoices', { client_id: client || null, type, status, line_items: li, discount_kes: Number(discount || 0), tax_kes: Number(tax || 0), tip_kes: 0, issued_at: new Date().toISOString(), due_date: dueDate, notes: notes || null, business_id: businesses.find((b) => b.is_primary)?.id || null })
      await logActivity(`Created invoice ${r.number || ''} for ${kes(total)}`, 'invoice_created', 'invoice', r.id)
      toast.success('Invoice created'); onClose(r.id)
    } catch (e: any) { toast.error(e.message) } finally { setBusy(false) }
  }
  return (
    <Dialog open onOpenChange={(v) => !v && onClose()} size="lg" title="New invoice" description="Numbering and totals are calculated by the database."
      footer={<><Button variant="outline" onClick={() => onClose()}>Cancel</Button><Button variant="outline" loading={busy} onClick={() => save('draft')}>Save draft</Button><Button loading={busy} onClick={() => save('sent')}>Create & mark sent</Button></>}>
      <div className="grid sm:grid-cols-3 gap-4">
        <Field label="Client"><Select value={client} onChange={setClient} options={clientOpts} placeholder="Select client" /></Field>
        <Field label="Type"><Select value={type} onChange={setType} options={TYPES} /></Field>
        <Field label="Due date"><Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} /></Field>
      </div>
      <div className="mt-5 text-[13px] font-medium mb-2">Line items</div>
      <div className="space-y-2">
        {lines.map((l, i) => (
          <div key={i} className="grid grid-cols-[1fr_70px_120px_36px] gap-2 items-center">
            <div className="relative">
              <Input list="svc-list" value={l.name} placeholder="Item or service" onChange={(e) => { const s = (services.data || []).find((x) => x.name === e.target.value); setLine(i, s ? { name: s.name, ref_id: s.id, unit_price_kes: Number(s.price_kes) } : { name: e.target.value }) }} />
            </div>
            <Input type="number" value={l.qty} onChange={(e) => setLine(i, { qty: e.target.value })} aria-label="Quantity" />
            <Input type="number" value={l.unit_price_kes} onChange={(e) => setLine(i, { unit_price_kes: e.target.value })} aria-label="Unit price" />
            <Button size="icon-sm" variant="ghost" onClick={() => setLines((x) => x.filter((_, j) => j !== i))} aria-label="Remove"><Trash2 /></Button>
          </div>))}
        <datalist id="svc-list">{(services.data || []).map((s) => <option key={s.id} value={s.name} />)}</datalist>
        <Button size="sm" variant="ghost" onClick={() => setLines((l) => [...l, { kind: 'service', name: '', qty: 1, unit_price_kes: 0 }])}><Plus />Add line</Button>
      </div>
      <div className="grid sm:grid-cols-2 gap-4 mt-5">
        <Field label="Notes"><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} /></Field>
        <div className="rounded-card bg-foreground/[.035] p-4 space-y-2 text-[13.5px] h-max">
          <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span className="num">{kes(subtotal)}</span></div>
          <div className="flex justify-between items-center gap-3"><span className="text-muted-foreground">Discount</span><Input type="number" className="h-8 w-28 text-right" value={discount} onChange={(e) => setDiscount(e.target.value)} /></div>
          <div className="flex justify-between items-center gap-3"><span className="text-muted-foreground">Tax</span><Input type="number" className="h-8 w-28 text-right" value={tax} onChange={(e) => setTax(e.target.value)} /></div>
          <div className="flex justify-between pt-2 border-t border-border/70 font-semibold text-[16px]"><span>Total</span><span className="num">{kes(total)}</span></div>
        </div>
      </div>
    </Dialog>
  )
}