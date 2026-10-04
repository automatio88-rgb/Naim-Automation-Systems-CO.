import { useState } from 'react'
import { toast } from 'sonner'
import { PackageCheck, Plus, Trash2, Truck, Wallet } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useList, insert, update, run, logActivity, invalidate, type Row } from '@/services/db'
import { fmtDate, humanize, kes, kesShort, sum } from '@/lib/utils'
import { Badge, Button, ChevronFilter, Dialog, Field, Input, Kpi, PageHeader, Select, TabPanel, Tabs, Textarea } from '@/components/ui'
import { DataTable } from '@/components/data-table'
import { RecordForm } from '@/components/form'
import { Shell360 } from '@/components/shared'

const PO_TONE: Record<string, any> = { draft: 'neutral', ordered: 'info', partial: 'warning', received: 'success', cancelled: 'neutral' }

export default function Purchases() {
  const po = useList('purchase_orders', { select: '*, suppliers(name)', order: ['ordered_at'] })
  const sup = useList('suppliers', { filter: (b) => b.is('deleted_at', null), order: ['name', true] })
  const [tab, setTab] = useState('orders')
  const [f, setF] = useState('all')
  const [creating, setCreating] = useState(false)
  const [open, setOpen] = useState<Row | null>(null)
  const [editSup, setEditSup] = useState<Row | null | undefined>(undefined)
  const rows = po.data || []
  const openPOs = rows.filter((r) => ['ordered', 'partial'].includes(r.status))
  return (
    <div>
      <PageHeader title="Purchases" sub="Purchase orders and the suppliers we buy hardware and licences from"
        actions={tab === 'orders' ? <Button onClick={() => setCreating(true)}><Plus />New purchase order</Button> : <Button onClick={() => setEditSup(null)}><Plus />Add supplier</Button>} />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-5">
        <Kpi solid tone="brand" label="Open orders" value={openPOs.length} icon={<Truck />} />
        <Kpi solid tone="info" label="On order" value={sum(openPOs, 'total_kes')} format={kesShort} />
        <Kpi solid tone="warning" label="Owed to suppliers" value={sum(rows.filter((r) => r.status !== 'cancelled'), (r) => r.total_kes - r.paid_kes)} format={kesShort} icon={<Wallet />} />
        <Kpi solid tone="success" label="Suppliers" value={sup.data?.length || 0} />
      </div>
      <Tabs value={tab} onChange={setTab} items={[{ id: 'orders', label: 'Purchase orders', count: rows.length }, { id: 'suppliers', label: 'Suppliers', count: sup.data?.length }]}>
        <TabPanel id="orders">
          <div className="mb-4"><ChevronFilter value={f} onChange={setF} items={[{ id: 'all', label: 'All', count: rows.length }, ...Object.keys(PO_TONE).map((k) => ({ id: k, label: humanize(k), tone: PO_TONE[k], count: rows.filter((r) => r.status === k).length }))]} /></div>
          <DataTable rows={rows.filter((r) => f === 'all' || r.status === f)} loading={po.isLoading} onRow={setOpen} searchKeys={['number', 'suppliers.name']} exportName="purchase-orders" initialSort={['ordered_at', 'desc']}
            cols={[
              { key: 'number', label: 'PO', sort: true, render: (r) => <span className="font-medium num">{r.number}</span> }, { key: 'suppliers.name', label: 'Supplier', sort: true },
              { key: 'ordered_at', label: 'Ordered', sort: true, hideBelow: 'sm', render: (r) => fmtDate(r.ordered_at) }, { key: 'expected_at', label: 'Expected', hideBelow: 'md', render: (r) => fmtDate(r.expected_at) },
              { key: 'status', label: 'Status', render: (r) => <Badge tone={PO_TONE[r.status]} dot>{humanize(r.status)}</Badge> },
              { key: 'paid_kes', label: 'Paid', align: 'right', hideBelow: 'md', render: (r) => kes(r.paid_kes) }, { key: 'total_kes', label: 'Total', align: 'right', sort: true, render: (r) => <span className="font-medium">{kes(r.total_kes)}</span> },
            ]} />
        </TabPanel>
        <TabPanel id="suppliers">
          <DataTable rows={sup.data} loading={sup.isLoading} onRow={setEditSup} searchKeys={['name', 'contact_name', 'category', 'phone']} exportName="suppliers"
            cols={[
              { key: 'name', label: 'Supplier', sort: true, render: (r) => <div><div className="font-medium">{r.name}</div><div className="text-[12px] text-muted-foreground">{r.contact_name}</div></div> },
              { key: 'category', label: 'Category' }, { key: 'phone', label: 'Phone', hideBelow: 'md' }, { key: 'email', label: 'Email', hideBelow: 'lg' },
              { key: 'orders', label: 'Orders', align: 'right', render: (r) => rows.filter((x) => x.supplier_id === r.id).length },
              { key: 'balance', label: 'We owe', align: 'right', render: (r) => { const b = sum(rows.filter((x) => x.supplier_id === r.id && x.status !== 'cancelled'), (x) => x.total_kes - x.paid_kes); return b > 0 ? <span className="text-danger font-medium">{kes(b)}</span> : '—' } },
            ]} />
        </TabPanel>
      </Tabs>
      {creating && <NewPO suppliers={sup.data || []} onClose={() => setCreating(false)} />}
      {open && <PO360 po={open} onClose={() => setOpen(null)} />}
      <RecordForm open={editSup !== undefined} onOpenChange={(v) => !v && setEditSup(undefined)} table="suppliers" initial={editSup} title={editSup ? 'Edit supplier' : 'Add supplier'}
        fields={[{ name: 'name', label: 'Company', required: true, span: 2 }, { name: 'contact_name', label: 'Contact' }, { name: 'category', label: 'Category' }, { name: 'phone', label: 'Phone', type: 'tel' }, { name: 'email', label: 'Email', type: 'email' }, { name: 'notes', label: 'Notes', type: 'textarea' }]}
        activity={(v, n) => `${n ? 'Added' : 'Updated'} supplier ${v.name}`} />
    </div>
  )
}

function NewPO({ suppliers, onClose }: { suppliers: Row[]; onClose: () => void }) {
  const products = useList('products', { select: 'id,name,cost_kes,supplier_id', filter: (b) => b.is('deleted_at', null), order: ['name', true] })
  const [supplier, setSupplier] = useState('')
  const [expected, setExpected] = useState(new Date(Date.now() + 7 * 864e5).toISOString().slice(0, 10))
  const [items, setItems] = useState<Row[]>([{ product_id: '', name: '', qty: 1, unit_cost_kes: 0 }])
  const [notes, setNotes] = useState('')
  const [busy, setBusy] = useState(false)
  const setItem = (i: number, p: Row) => setItems((l) => l.map((x, j) => (j === i ? { ...x, ...p } : x)))
  const prodOpts = (products.data || []).filter((p) => !supplier || !p.supplier_id || p.supplier_id === supplier).map((p) => ({ value: p.id, label: p.name }))
  const total = sum(items, (i) => Number(i.qty || 0) * Number(i.unit_cost_kes || 0))
  return (
    <Dialog open onOpenChange={(v) => !v && onClose()} size="lg" title="New purchase order"
      footer={<><Button variant="outline" onClick={onClose}>Cancel</Button><Button loading={busy} disabled={!supplier} onClick={async () => {
        const li = items.filter((i) => i.name && Number(i.qty) > 0).map((i) => ({ ...i, qty: Number(i.qty), unit_cost_kes: Number(i.unit_cost_kes), received_qty: 0 }))
        if (!li.length) return toast.error('Add at least one item')
        setBusy(true)
        try { const r = await insert('purchase_orders', { supplier_id: supplier, status: 'ordered', items: li, total_kes: total, paid_kes: 0, ordered_at: new Date().toISOString(), expected_at: expected, notes: notes || null }); await logActivity(`Raised purchase order ${r.number || ''} for ${kes(total)}`, 'po_created', 'purchase_order', r.id); toast.success('Purchase order raised'); onClose() }
        catch (e: any) { toast.error(e.message) } finally { setBusy(false) }
      }}>Raise PO · {kes(total)}</Button></>}>
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Supplier"><Select value={supplier} onChange={setSupplier} options={suppliers.map((s) => ({ value: s.id, label: s.name }))} placeholder="Select supplier" /></Field>
        <Field label="Expected delivery"><Input type="date" value={expected} onChange={(e) => setExpected(e.target.value)} /></Field>
      </div>
      <div className="mt-5 text-[13px] font-medium mb-2">Items</div>
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
      <Field label="Notes" className="mt-4"><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} /></Field>
    </Dialog>
  )
}

function PO360({ po, onClose }: { po: Row; onClose: () => void }) {
  const [tab, setTab] = useState('items')
  const [busy, setBusy] = useState(false)
  const items: Row[] = po.items || []
  const receiveAll = async () => {
    setBusy(true)
    try {
      for (const it of items) {
        const left = Number(it.qty) - Number(it.received_qty || 0)
        if (left > 0 && it.product_id) {
          const p = await run<Row>(supabase.from('products').select('stock_qty').eq('id', it.product_id).single())
          await run(supabase.from('products').update({ stock_qty: Number(p.stock_qty) + left }).eq('id', it.product_id))
        }
      }
      await update('purchase_orders', po.id, { status: 'received', received_at: new Date().toISOString(), items: items.map((i) => ({ ...i, received_qty: i.qty })) })
      await logActivity(`Received ${po.number} into stock`, 'po_received', 'purchase_order', po.id); invalidate(['products']); toast.success('Received. Stock updated.'); onClose()
    } catch (e: any) { toast.error(e.message) } finally { setBusy(false) }
  }
  const pay = async () => { await update('purchase_orders', po.id, { paid_kes: po.total_kes }); await logActivity(`Paid ${po.suppliers?.name} ${kes(po.total_kes - po.paid_kes)} for ${po.number}`, 'po_paid', 'purchase_order', po.id); toast.success('Marked as paid'); onClose() }
  return (
    <Shell360 open onOpenChange={(v) => !v && onClose()} icon={<Truck />} title={po.number} tab={tab} setTab={setTab} badge={<Badge tone={PO_TONE[po.status]} dot>{humanize(po.status)}</Badge>}
      rows={[['Supplier', po.suppliers?.name], ['Ordered', fmtDate(po.ordered_at)], ['Expected', fmtDate(po.expected_at)], ['Received', fmtDate(po.received_at)], ['Total', kes(po.total_kes)], ['Paid', kes(po.paid_kes)], ['Balance', kes(po.total_kes - po.paid_kes)]]}
      actions={<>
        {['ordered', 'partial'].includes(po.status) && <Button size="sm" loading={busy} onClick={receiveAll}><PackageCheck />Receive all into stock</Button>}
        {Number(po.paid_kes) < Number(po.total_kes) && po.status !== 'cancelled' && <Button size="sm" variant="outline" onClick={pay}><Wallet />Mark paid</Button>}
        {po.status === 'ordered' && <Button size="sm" variant="ghost" className="text-danger" onClick={async () => { await update('purchase_orders', po.id, { status: 'cancelled' }); toast.success('Cancelled'); onClose() }}>Cancel PO</Button>}
      </>}
      tabs={[{ id: 'items', label: 'Items', count: items.length }, { id: 'notes', label: 'Notes' }]}>
      <TabPanel id="items">
        <div className="overflow-x-auto rounded-[14px] border border-border/70">
          <table className="w-full text-[13px]"><thead><tr className="bg-foreground/[.025] text-muted-foreground"><th className="text-left font-medium px-3 h-9">Item</th><th className="text-right font-medium px-3">Ordered</th><th className="text-right font-medium px-3">Received</th><th className="text-right font-medium px-3">Unit</th><th className="text-right font-medium px-3">Amount</th></tr></thead>
            <tbody>{items.map((it, i) => <tr key={i} className="border-t border-border/60"><td className="px-3 py-2.5">{it.name}</td><td className="px-3 text-right num">{it.qty}</td><td className="px-3 text-right num">{it.received_qty || 0}</td><td className="px-3 text-right num">{kes(it.unit_cost_kes)}</td><td className="px-3 text-right num">{kes(it.qty * it.unit_cost_kes)}</td></tr>)}</tbody>
          </table>
        </div>
      </TabPanel>
      <TabPanel id="notes"><div className="rounded-card bg-foreground/[.035] p-4 text-[14px] min-h-[80px]">{po.notes || <span className="text-muted-foreground">No notes</span>}</div></TabPanel>
    </Shell360>
  )
}