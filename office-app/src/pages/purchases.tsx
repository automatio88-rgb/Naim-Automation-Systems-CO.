import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { AlertTriangle, PackageCheck, Plus, ShoppingCart, Trash2, Truck, Users, Wallet } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useList, insert, update, remove, run, logActivity, invalidate, type Row } from '@/services/db'
import { useAuth, currentActor } from '@/lib/auth'
import { useBiz } from '@/lib/business'
import { PAY_METHODS, methodLabel } from '@/lib/status'
import { cn, fmtDate, humanize, kes, kesShort, sum } from '@/lib/utils'
import { Badge, Button, ChevronFilter, Dialog, Field, Input, Kpi, PageHeader, Select, TabPanel, Tabs, Textarea } from '@/components/ui'
import { DataTable } from '@/components/data-table'
import { RecordForm } from '@/components/form'
import { Shell360, MiniTable } from '@/components/shared'

const PO_TONE: Record<string, any> = { draft: 'neutral', ordered: 'info', partial: 'warning', received: 'success', cancelled: 'neutral' }
const due = (r: Row) => Math.max(0, Number(r.total_kes) - Number(r.paid_kes))
const lineCount = (r: Row) => (r.items || []).length

export default function Purchases() {
  const { can } = useAuth()
  const { businesses } = useBiz()
  const [sp, setSp] = useSearchParams()
  const po = useList('purchase_orders', { select: '*, suppliers(name), businesses(name)', order: ['ordered_at'] })
  const sup = useList('suppliers', { filter: (b) => b.is('deleted_at', null), order: ['name', true] })
  const [tab, setTab] = useState('orders')
  const [f, setF] = useState('all')
  const [sf, setSf] = useState('all')
  const [fSup, setFSup] = useState('')
  const [fBiz, setFBiz] = useState('')
  const [fPay, setFPay] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [creating, setCreating] = useState<Row[] | null>(null)
  const [open, setOpen] = useState<Row | null>(null)
  const [editSup, setEditSup] = useState<Row | null | undefined>(undefined)
  const lowStock = useList('products', { select: 'id,name,cost_kes,supplier_id,stock_qty,reorder_level,reorder_qty', filter: (b) => b.is('deleted_at', null), limit: 2000 })
  const toReorder = (lowStock.data || []).filter((p) => Number(p.stock_qty) <= Number(p.reorder_level || 0))
  const reorder = () => setCreating(toReorder.map((p) => ({ product_id: p.id, name: p.name, supplier_id: p.supplier_id, qty: Number(p.reorder_qty || Math.max(1, Number(p.reorder_level || 1) * 3 - Number(p.stock_qty))), unit_cost_kes: Number(p.cost_kes) })))
  useEffect(() => { if (sp.get('reorder') && lowStock.data) { reorder(); sp.delete('reorder'); setSp(sp, { replace: true }) } }, [lowStock.data]) // eslint-disable-line react-hooks/exhaustive-deps
  const rows = po.data || []
  const S = sup.data || []
  const live = rows.filter((r) => r.status !== 'cancelled')
  const openPOs = rows.filter((r) => ['ordered', 'partial'].includes(r.status))
  const overdue = openPOs.filter((r) => r.expected_at && new Date(r.expected_at) < new Date())
  const m0 = new Date(); m0.setDate(1)
  const view = rows.filter((r) => (f === 'all' || r.status === f) && (!fSup || r.supplier_id === fSup) && (!fBiz || r.business_id === fBiz)
    && (!fPay || (fPay === 'paid' ? due(r) === 0 : fPay === 'part' ? Number(r.paid_kes) > 0 && due(r) > 0 : Number(r.paid_kes) === 0)) && (!from || r.ordered_at >= from) && (!to || r.ordered_at <= to))
  const supOpts = S.map((s) => ({ value: s.id, label: s.name }))
  const owed = (sid: string) => sum(live.filter((x) => x.supplier_id === sid), due)
  return (
    <div>
      <PageHeader title="Purchases" sub="Purchase orders and the suppliers we buy hardware and licences from"
        actions={tab === 'orders' ? <>
          {can('purchases', 'create') && <Button variant="outline" onClick={reorder} disabled={!toReorder.length}><ShoppingCart />Reorder{toReorder.length ? ` (${toReorder.length})` : ''}</Button>}
          {can('purchases', 'create') && <Button onClick={() => setCreating([])}><Plus />New purchase order</Button>}
        </> : can('purchases', 'create') && <Button onClick={() => setEditSup(null)}><Plus />Add supplier</Button>} />
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4 mb-5">
        <Kpi solid tone="brand" label="Purchase orders" value={rows.length} foot={`${openPOs.length} open`} icon={<Truck />} />
        <Kpi solid tone="info" label="On order" value={sum(openPOs, 'total_kes')} format={kesShort} />
        <Kpi solid tone="violet" label="Bought this month" value={sum(live.filter((r) => new Date(r.ordered_at) >= m0), 'total_kes')} format={kesShort} />
        <Kpi solid tone="warning" label="Payable" value={sum(live, due)} format={kesShort} foot={`${live.filter((r) => due(r) > 0).length} unpaid POs`} icon={<Wallet />} onClick={() => setFPay('unpaid')} />
        <Kpi solid tone="danger" label="Late deliveries" value={overdue.length} icon={<AlertTriangle />} />
        <Kpi solid tone="success" label="Suppliers" value={S.length} foot={`${S.filter((s) => s.status !== 'inactive').length} active`} icon={<Users />} onClick={() => setTab('suppliers')} />
      </div>
      <Tabs value={tab} onChange={setTab} items={[{ id: 'orders', label: 'Purchase orders', count: rows.length }, { id: 'suppliers', label: 'Suppliers', count: S.length }]}>
        <TabPanel id="orders">
          <div className="mb-4"><ChevronFilter value={f} onChange={setF} items={[{ id: 'all', label: 'All', count: rows.length }, ...Object.keys(PO_TONE).map((k) => ({ id: k, label: humanize(k), tone: PO_TONE[k], count: rows.filter((r) => r.status === k).length }))]} /></div>
          <DataTable rows={view} loading={po.isLoading} onRow={setOpen} onView={setOpen} searchKeys={['number', 'suppliers.name', 'supplier_ref', 'notes']} exportName="purchase-orders" initialSort={['ordered_at', 'desc']}
            filters={<>
              <Select size="sm" value={fSup} onChange={setFSup} allowClear="All suppliers" options={supOpts} />
              <Select size="sm" value={fBiz} onChange={setFBiz} allowClear="All businesses" options={businesses.map((b) => ({ value: b.id, label: b.name }))} />
              <Select size="sm" value={fPay} onChange={setFPay} allowClear="Any payment" options={[{ value: 'unpaid', label: 'Unpaid' }, { value: 'part', label: 'Part paid' }, { value: 'paid', label: 'Paid in full' }]} />
              <div className="grid grid-cols-2 gap-2"><Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="h-9" aria-label="From" /><Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="h-9" aria-label="To" /></div>
            </>} onClearFilters={() => { setFSup(''); setFBiz(''); setFPay(''); setFrom(''); setTo(''); setF('all') }}
            onDelete={can('purchases', 'delete') ? async (r) => { await remove('purchase_orders', r.id) } : undefined} canDelete={(r) => ['draft', 'cancelled'].includes(r.status)}
            cols={[
              { key: 'number', label: 'PO', sort: true, render: (r) => <div><div className="font-medium num">{r.number}</div>{r.supplier_ref && <div className="text-[12px] text-muted-foreground">Inv {r.supplier_ref}</div>}</div> },
              { key: 'suppliers.name', label: 'Supplier', sort: true },
              { key: 'businesses.name', label: 'Business', hideBelow: 'lg' },
              { key: 'ordered_at', label: 'Ordered', sort: true, hideBelow: 'sm', render: (r) => fmtDate(r.ordered_at) },
              { key: 'expected_at', label: 'Expected', hideBelow: 'md', render: (r) => <span className={cn(['ordered', 'partial'].includes(r.status) && r.expected_at && new Date(r.expected_at) < new Date() && 'text-danger font-medium')}>{fmtDate(r.expected_at)}</span> },
              { key: 'lines', label: 'Items', align: 'right', hideBelow: 'md', render: (r) => <span className="num">{lineCount(r)}</span>, csv: lineCount },
              { key: 'status', label: 'Status', render: (r) => <Badge tone={PO_TONE[r.status]} dot>{humanize(r.status)}</Badge> },
              { key: 'total_kes', label: 'Total', align: 'right', sort: true, render: (r) => <span className="font-medium">{kes(r.total_kes)}</span> },
              { key: 'paid_kes', label: 'Paid', align: 'right', hideBelow: 'md', render: (r) => kes(r.paid_kes) },
              { key: 'due', label: 'Due', align: 'right', sort: due, render: (r) => due(r) > 0 && r.status !== 'cancelled' ? <span className="text-danger font-medium">{kes(due(r))}</span> : <Badge tone="success">Paid</Badge>, csv: due },
            ]} />
        </TabPanel>
        <TabPanel id="suppliers">
          <div className="mb-4"><ChevronFilter value={sf} onChange={setSf} items={[{ id: 'all', label: 'All', count: S.length }, { id: 'active', label: 'Active', tone: 'success', count: S.filter((s) => s.status !== 'inactive').length }, { id: 'inactive', label: 'Inactive', count: S.filter((s) => s.status === 'inactive').length }]} /></div>
          <DataTable rows={S.filter((s) => sf === 'all' || (sf === 'active' ? s.status !== 'inactive' : s.status === 'inactive'))} loading={sup.isLoading} onRow={setEditSup} searchKeys={['name', 'contact_name', 'category', 'phone', 'email']} exportName="suppliers"
            onEdit={can('purchases', 'edit') ? setEditSup : undefined} onDelete={can('purchases', 'delete') ? async (r) => { await remove('suppliers', r.id, true) } : undefined} canDelete={(r) => !rows.some((x) => x.supplier_id === r.id && ['ordered', 'partial'].includes(x.status))}
            importTable="suppliers" importFields={['name', 'contact_name', 'phone', 'email', 'category', 'address', 'payment_terms_days']} importDefaults={{ status: 'active' }} onImported={() => invalidate(['suppliers'])}
            cols={[
              { key: 'name', label: 'Supplier', sort: true, render: (r) => <div><div className="font-medium">{r.name}</div><div className="text-[12px] text-muted-foreground">{r.contact_name}</div></div> },
              { key: 'category', label: 'Category' }, { key: 'phone', label: 'Mobile', hideBelow: 'md' }, { key: 'email', label: 'Email', hideBelow: 'lg' },
              { key: 'payment_terms_days', label: 'Terms', hideBelow: 'lg', render: (r) => `${r.payment_terms_days ?? 30} days` },
              { key: 'orders', label: 'Orders', align: 'right', render: (r) => rows.filter((x) => x.supplier_id === r.id).length },
              { key: 'spent', label: 'Bought', align: 'right', hideBelow: 'md', render: (r) => kes(sum(live.filter((x) => x.supplier_id === r.id), 'total_kes')), csv: (r) => sum(live.filter((x) => x.supplier_id === r.id), 'total_kes') },
              { key: 'balance', label: 'We owe', align: 'right', render: (r) => owed(r.id) > 0 ? <span className="text-danger font-medium">{kes(owed(r.id))}</span> : '—', csv: (r) => owed(r.id) },
              { key: 'status', label: 'Status', render: (r) => <Badge tone={r.status === 'inactive' ? 'neutral' : 'success'} dot>{r.status === 'inactive' ? 'Inactive' : 'Active'}</Badge> },
            ]} />
        </TabPanel>
      </Tabs>
      {creating && <NewPO suppliers={S} preset={creating} onClose={() => setCreating(null)} />}
      {open && <PO360 po={rows.find((r) => r.id === open.id) || open} onClose={() => setOpen(null)} />}
      <RecordForm open={editSup !== undefined} onOpenChange={(v) => !v && setEditSup(undefined)} table="suppliers" initial={editSup} title={editSup ? 'Edit supplier' : 'Add supplier'}
        fields={[{ name: 'name', label: 'Company', required: true, span: 2 }, { name: 'contact_name', label: 'Contact person' }, { name: 'category', label: 'Category' }, { name: 'phone', label: 'Mobile', type: 'tel' }, { name: 'email', label: 'Email', type: 'email' },
          { name: 'payment_terms_days', label: 'Payment terms (days)', type: 'number' }, { name: 'status', label: 'Status', type: 'select', options: [{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }] }, { name: 'address', label: 'Address', span: 2 }, { name: 'notes', label: 'Notes', type: 'textarea' }]}
        defaults={{ status: 'active', payment_terms_days: 30 }} activity={(v, n) => `${n ? 'Added' : 'Updated'} supplier ${v.name}`} />
    </div>
  )
}

function NewPO({ suppliers, preset, onClose }: { suppliers: Row[]; preset: Row[]; onClose: () => void }) {
  const { businesses } = useBiz()
  const products = useList('products', { select: 'id,name,cost_kes,supplier_id', filter: (b) => b.is('deleted_at', null), order: ['name', true] })
  const firstSup = preset.find((p) => p.supplier_id)?.supplier_id || ''
  const [supplier, setSupplier] = useState(firstSup)
  const [biz, setBiz] = useState(businesses.find((b) => b.is_primary)?.id || '')
  const [expected, setExpected] = useState(new Date(Date.now() + 7 * 864e5).toISOString().slice(0, 10))
  const [items, setItems] = useState<Row[]>(preset.length ? preset.filter((p) => !firstSup || !p.supplier_id || p.supplier_id === firstSup) : [{ product_id: '', name: '', qty: 1, unit_cost_kes: 0 }])
  const [taxPct, setTaxPct] = useState('0')
  const [status, setStatus] = useState('ordered')
  const [notes, setNotes] = useState('')
  const [busy, setBusy] = useState(false)
  const setItem = (i: number, p: Row) => setItems((l) => l.map((x, j) => (j === i ? { ...x, ...p } : x)))
  const prodOpts = (products.data || []).filter((p) => !supplier || !p.supplier_id || p.supplier_id === supplier).map((p) => ({ value: p.id, label: p.name }))
  const subtotal = sum(items, (i) => Number(i.qty || 0) * Number(i.unit_cost_kes || 0))
  const tax = Math.round(subtotal * Number(taxPct || 0)) / 100, total = subtotal + tax
  return (
    <Dialog open onOpenChange={(v) => !v && onClose()} size="lg" title={preset.length ? 'Reorder low stock' : 'New purchase order'} description={preset.length ? 'Pre-filled from products at or below their minimum stock' : undefined}
      footer={<><Button variant="outline" onClick={onClose}>Cancel</Button><Button loading={busy} disabled={!supplier} onClick={async () => {
        const li = items.filter((i) => i.name && Number(i.qty) > 0).map(({ supplier_id: _s, ...i }) => ({ ...i, qty: Number(i.qty), unit_cost_kes: Number(i.unit_cost_kes), received_qty: 0 }))
        if (!li.length) return toast.error('Add at least one item')
        setBusy(true)
        try { const r = await insert('purchase_orders', { supplier_id: supplier, business_id: biz || null, status, items: li, tax_kes: tax, total_kes: total, paid_kes: 0, ordered_at: new Date().toISOString().slice(0, 10), expected_at: expected, notes: notes || null }); await logActivity(`Raised purchase order ${r.number || ''} for ${kes(total)}`, 'po_created', 'purchase_order', r.id); toast.success(status === 'draft' ? 'Saved as draft' : 'Purchase order raised'); onClose() }
        catch (e: any) { toast.error(e.message) } finally { setBusy(false) }
      }}>{status === 'draft' ? 'Save draft' : 'Raise PO'} · {kes(total)}</Button></>}>
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Supplier"><Select value={supplier} onChange={setSupplier} options={suppliers.filter((s) => s.status !== 'inactive').map((s) => ({ value: s.id, label: s.name }))} placeholder="Select supplier" /></Field>
        <Field label="Business"><Select value={biz} onChange={setBiz} options={businesses.map((b) => ({ value: b.id, label: b.name }))} /></Field>
        <Field label="Expected delivery"><Input type="date" value={expected} onChange={(e) => setExpected(e.target.value)} /></Field>
        <Field label="Status"><Select value={status} onChange={setStatus} options={[{ value: 'ordered', label: 'Ordered (sent to supplier)' }, { value: 'draft', label: 'Draft' }]} /></Field>
      </div>
      <div className="mt-5 text-[13px] font-medium mb-2 grid grid-cols-[1fr_70px_120px_36px] gap-2 text-muted-foreground"><span>Item</span><span>Qty</span><span>Unit cost</span><span /></div>
      <div className="space-y-2">
        {items.map((it, i) => (
          <div key={i} className="grid grid-cols-[1fr_70px_120px_36px] gap-2 items-center">
            <Select value={it.product_id} onChange={(id) => { const p = (products.data || []).find((x) => x.id === id); setItem(i, { product_id: id, name: p?.name, unit_cost_kes: Number(p?.cost_kes || 0) }) }} options={prodOpts} placeholder="Product" />
            <Input type="number" value={it.qty} onChange={(e) => setItem(i, { qty: e.target.value })} aria-label="Quantity" />
            <Input type="number" value={it.unit_cost_kes} onChange={(e) => setItem(i, { unit_cost_kes: e.target.value })} aria-label="Unit cost" />
            <Button size="icon-sm" variant="ghost" onClick={() => setItems((x) => x.filter((_, j) => j !== i))} aria-label="Remove"><Trash2 /></Button>
          </div>))}
        <Button size="sm" variant="ghost" onClick={() => setItems((l) => [...l, { product_id: '', name: '', qty: 1, unit_cost_kes: 0 }])}><Plus />Add item</Button>
      </div>
      <div className="grid sm:grid-cols-[1fr_240px] gap-4 mt-4 items-start">
        <Field label="Notes"><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} /></Field>
        <div className="rounded-[14px] bg-foreground/[.035] p-3 text-[13px] space-y-1.5">
          <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span className="num">{kes(subtotal)}</span></div>
          <div className="flex justify-between items-center gap-2"><span className="text-muted-foreground">Tax %</span><Input type="number" value={taxPct} onChange={(e) => setTaxPct(e.target.value)} className="h-8 w-20 text-right" aria-label="Tax percent" /></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Tax</span><span className="num">{kes(tax)}</span></div>
          <div className="flex justify-between font-semibold border-t border-border/70 pt-1.5"><span>Total</span><span className="num">{kes(total)}</span></div>
        </div>
      </div>
    </Dialog>
  )
}

function PO360({ po, onClose }: { po: Row; onClose: () => void }) {
  const { can } = useAuth()
  const [tab, setTab] = useState('items')
  const [busy, setBusy] = useState(false)
  const [pay, setPay] = useState(false)
  const [ref, setRef] = useState(po.supplier_ref || '')
  const items: Row[] = po.items || []
  const payments: Row[] = po.payments || []
  const moves = useList('stock_movements', { select: '*, products(name)', filter: (b) => b.eq('ref_id', po.id), key: [po.id] })
  const receiveAll = async () => {
    setBusy(true)
    try {
      for (const it of items) {
        const left = Number(it.qty) - Number(it.received_qty || 0)
        if (left > 0 && it.product_id) {
          const p = await run<Row>(supabase.from('products').select('stock_qty').eq('id', it.product_id).single())
          const next = Number(p.stock_qty) + left
          await run(supabase.from('products').update({ stock_qty: next, cost_kes: Number(it.unit_cost_kes) }).eq('id', it.product_id))
          await insert('stock_movements', { product_id: it.product_id, kind: 'purchase', qty: left, balance_after: next, unit_cost_kes: Number(it.unit_cost_kes), ref_type: 'purchase_order', ref_id: po.id, reason: `Received on ${po.number}`, recorded_by: currentActor })
        }
      }
      await update('purchase_orders', po.id, { status: 'received', received_at: new Date().toISOString().slice(0, 10), supplier_ref: ref || null, items: items.map((i) => ({ ...i, received_qty: i.qty })) })
      await logActivity(`Received ${po.number} into stock`, 'po_received', 'purchase_order', po.id); invalidate(['products', 'stock_movements', 'purchase_orders']); toast.success('Received. Stock and ledger updated.'); onClose()
    } catch (e: any) { toast.error(e.message) } finally { setBusy(false) }
  }
  const subtotal = sum(items, (i) => Number(i.qty) * Number(i.unit_cost_kes))
  return (
    <Shell360 open onOpenChange={(v) => !v && onClose()} icon={<Truck />} title={po.number} tab={tab} setTab={setTab} badge={<Badge tone={PO_TONE[po.status]} dot>{humanize(po.status)}</Badge>}
      kpis={[['Total', kes(po.total_kes), undefined, 'brand'], ['Paid', kes(po.paid_kes), undefined, 'success'], ['Payable', kes(due(po)), undefined, due(po) > 0 ? 'danger' : 'success'], ['Items', items.length, undefined, 'info']]}
      rows={[['Supplier', po.suppliers?.name], ['Business', po.businesses?.name], ['Supplier invoice', po.supplier_ref || '—'], ['Ordered', fmtDate(po.ordered_at)], ['Expected', fmtDate(po.expected_at)], ['Received', fmtDate(po.received_at)], ['Subtotal', kes(subtotal)], ['Tax', kes(po.tax_kes)], ['Total', kes(po.total_kes)], ['Balance', kes(due(po))]]}
      actions={<>
        {po.status === 'draft' && can('purchases', 'approve') && <Button size="sm" onClick={async () => { await update('purchase_orders', po.id, { status: 'ordered' }); await logActivity(`Approved and sent ${po.number}`, 'po_created', 'purchase_order', po.id); toast.success('Sent to supplier'); onClose() }}>Approve & send</Button>}
        {['ordered', 'partial'].includes(po.status) && can('purchases', 'edit') && <Button size="sm" loading={busy} onClick={receiveAll}><PackageCheck />Receive all into stock</Button>}
        {due(po) > 0 && po.status !== 'cancelled' && can('purchases', 'edit') && <Button size="sm" variant="outline" onClick={() => setPay(true)}><Wallet />Record payment</Button>}
        {['ordered', 'draft'].includes(po.status) && can('purchases', 'edit') && <Button size="sm" variant="ghost" className="text-danger" onClick={async () => { await update('purchase_orders', po.id, { status: 'cancelled' }); await logActivity(`Cancelled ${po.number}`, 'po_cancelled', 'purchase_order', po.id); toast.success('Cancelled'); onClose() }}>Cancel PO</Button>}
      </>}
      tabs={[{ id: 'items', label: 'Items', count: items.length }, { id: 'payments', label: 'Payments', count: payments.length }, { id: 'stock', label: 'Stock posted', count: moves.data?.length }, { id: 'notes', label: 'Notes' }]}>
      <TabPanel id="items">
        <MiniTable head={['Item', 'Ordered', 'Received', 'Unit', 'Amount']} empty="No items" rows={items.map((it) => [it.name, it.qty, it.received_qty || 0, kes(it.unit_cost_kes), kes(it.qty * it.unit_cost_kes)])} />
        {['ordered', 'partial'].includes(po.status) && <Field label="Supplier invoice number" className="mt-3 max-w-[300px]"><Input value={ref} onChange={(e) => setRef(e.target.value)} placeholder="Recorded when you receive" /></Field>}
      </TabPanel>
      <TabPanel id="payments"><MiniTable head={['Date', 'Method', 'Reference', 'Amount']} empty="No payments yet" rows={payments.map((p) => [fmtDate(p.paid_at), methodLabel(p.method), p.reference || '—', kes(p.amount_kes)])} /></TabPanel>
      <TabPanel id="stock"><MiniTable head={['When', 'Product', 'Qty', 'Balance after']} empty="Nothing received yet" rows={(moves.data || []).map((m) => [fmtDate(m.created_at, 'd MMM, HH:mm'), m.products?.name, `+${Number(m.qty)}`, Number(m.balance_after)])} /></TabPanel>
      <TabPanel id="notes"><div className="rounded-card bg-foreground/[.035] p-4 text-[14px] min-h-[80px]">{po.notes || <span className="text-muted-foreground">No notes</span>}</div></TabPanel>
      {pay && <POPayment po={po} onClose={() => setPay(false)} onDone={onClose} />}
    </Shell360>
  )
}

function POPayment({ po, onClose, onDone }: { po: Row; onClose: () => void; onDone: () => void }) {
  const [amt, setAmt] = useState(String(due(po)))
  const [method, setMethod] = useState('bank')
  const [ref, setRef] = useState('')
  const [busy, setBusy] = useState(false)
  const n = Number(amt || 0)
  return (
    <Dialog open onOpenChange={(v) => !v && onClose()} size="sm" title={`Pay ${po.suppliers?.name || 'supplier'}`} description={`${po.number} · balance ${kes(due(po))}`}
      footer={<><Button variant="outline" onClick={onClose}>Cancel</Button><Button loading={busy} disabled={!(n > 0) || n > due(po)} onClick={async () => {
        setBusy(true)
        try {
          const payments = [...(po.payments || []), { amount_kes: n, method, reference: ref || null, paid_at: new Date().toISOString().slice(0, 10), by: currentActor }]
          await update('purchase_orders', po.id, { paid_kes: Number(po.paid_kes) + n, payments })
          await logActivity(`Paid ${po.suppliers?.name} ${kes(n)} for ${po.number}`, 'po_paid', 'purchase_order', po.id, { method })
          invalidate(['purchase_orders']); toast.success(n === due(po) ? 'Paid in full' : 'Part payment recorded'); onClose(); onDone()
        } catch (e: any) { toast.error(e.message) } finally { setBusy(false) }
      }}>Record {kes(n)}</Button></>}>
      <div className="grid gap-4">
        <Field label="Amount (KES)"><Input type="number" value={amt} onChange={(e) => setAmt(e.target.value)} /></Field>
        <Field label="Method"><Select value={method} onChange={setMethod} options={PAY_METHODS} /></Field>
        <Field label="Reference"><Input value={ref} onChange={(e) => setRef(e.target.value)} placeholder="M-PESA code or bank ref" /></Field>
      </div>
    </Dialog>
  )
}