import { useState } from 'react'
import { toast } from 'sonner'
import { AlertTriangle, Boxes, Minus, Package, Plus, Wallet } from 'lucide-react'
import { useList, update, logActivity, type Row } from '@/services/db'
import { useAuth } from '@/lib/auth'
import { cn, kes, kesShort, sum } from '@/lib/utils'
import { Badge, Button, ChevronFilter, Dialog, Field, Input, Kpi, PageHeader, Progress, Select, Textarea } from '@/components/ui'
import { DataTable } from '@/components/data-table'
import { RecordForm } from '@/components/form'

const stockTone = (p: Row) => (Number(p.stock_qty) <= 0 ? 'danger' : Number(p.stock_qty) <= Number(p.reorder_level || 0) ? 'warning' : 'success') as any
const stockLabel = (p: Row) => (Number(p.stock_qty) <= 0 ? 'Out of stock' : Number(p.stock_qty) <= Number(p.reorder_level || 0) ? 'Low stock' : 'In stock')

export default function Inventory() {
  const { can } = useAuth()
  const p = useList('products', { select: '*, suppliers(name)', filter: (b) => b.is('deleted_at', null), order: ['name', true] })
  const sup = useList('suppliers', { select: 'id,name', filter: (b) => b.is('deleted_at', null), order: ['name', true] })
  const [f, setF] = useState('all')
  const [edit, setEdit] = useState<Row | null | undefined>(undefined)
  const [adj, setAdj] = useState<Row | null>(null)
  const rows = p.data || []
  const low = rows.filter((r) => stockTone(r) !== 'success')
  const cats = Array.from(new Set(rows.map((r) => r.category).filter(Boolean))) as string[]
  const view = rows.filter((r) => f === 'all' || (f === 'low' ? stockTone(r) !== 'success' : r.category === f))
  return (
    <div>
      <PageHeader title="Inventory" sub="Hardware and consumables we resell or install: tablets, printers, signature pads, licences"
        actions={can('inventory', 'create') && <Button onClick={() => setEdit(null)}><Plus />Add product</Button>} />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-5">
        <Kpi solid tone="brand" label="Products" value={rows.length} icon={<Boxes />} />
        <Kpi solid tone="info" label="Stock value (cost)" value={sum(rows, (r) => r.stock_qty * r.cost_kes)} format={kesShort} icon={<Wallet />} />
        <Kpi solid tone="success" label="Retail value" value={sum(rows, (r) => r.stock_qty * r.price_kes)} format={kesShort} icon={<Package />} />
        <Kpi solid tone="danger" label="Low or out" value={low.length} icon={<AlertTriangle />} onClick={() => setF('low')} />
      </div>
      <div className="mb-4"><ChevronFilter value={f} onChange={setF} items={[{ id: 'all', label: 'All', count: rows.length }, { id: 'low', label: 'Needs reorder', count: low.length, tone: 'danger' }, ...cats.map((c) => ({ id: c, label: c, count: rows.filter((r) => r.category === c).length, tone: 'info' as const }))]} /></div>
      <DataTable rows={view} loading={p.isLoading} onRow={setEdit} searchKeys={['name', 'sku', 'category', 'suppliers.name']} exportName="inventory" initialSort={['stock_qty', 'asc']}
        cols={[
          { key: 'name', label: 'Product', sort: true, render: (r) => <div><div className="font-medium">{r.name}</div><div className="text-[12px] text-muted-foreground font-mono">{r.sku}</div></div> },
          { key: 'category', label: 'Category', hideBelow: 'md' },
          { key: 'suppliers.name', label: 'Supplier', hideBelow: 'lg' },
          { key: 'stock_qty', label: 'Stock', sort: true, render: (r) => (
            <div className="flex items-center gap-2 min-w-[150px]"><Progress value={Math.min(100, (Number(r.stock_qty) / Math.max(1, Number(r.reorder_level || 1) * 3)) * 100)} tone={stockTone(r)} className="w-16" />
              <span className="num font-medium">{Number(r.stock_qty)}</span><span className="text-muted-foreground text-[12px]">{r.unit}</span></div>) },
          { key: 'status', label: 'Status', hideBelow: 'sm', render: (r) => <Badge tone={stockTone(r)} dot>{stockLabel(r)}</Badge>, csv: stockLabel },
          { key: 'cost_kes', label: 'Cost', align: 'right', hideBelow: 'md', render: (r) => kes(r.cost_kes) },
          { key: 'price_kes', label: 'Price', align: 'right', sort: true, render: (r) => kes(r.price_kes) },
          { key: 'act', label: '', align: 'right', render: (r) => can('inventory', 'edit') && <Button size="sm" variant="soft" onClick={(e) => { e.stopPropagation(); setAdj(r) }}>Adjust</Button> },
        ]} />
      <RecordForm open={edit !== undefined} onOpenChange={(v) => !v && setEdit(undefined)} table="products" initial={edit} title={edit ? 'Edit product' : 'Add product'}
        fields={[{ name: 'name', label: 'Product name', required: true, span: 2 }, { name: 'sku', label: 'SKU' }, { name: 'category', label: 'Category' },
          { name: 'supplier_id', label: 'Supplier', type: 'select', options: (sup.data || []).map((s) => ({ value: s.id, label: s.name })) }, { name: 'unit', label: 'Unit', placeholder: 'pcs, licence, box' },
          { name: 'cost_kes', label: 'Cost (KES)', type: 'number', required: true }, { name: 'price_kes', label: 'Selling price (KES)', type: 'number', required: true },
          { name: 'stock_qty', label: 'Opening stock', type: 'number' }, { name: 'reorder_level', label: 'Reorder level', type: 'number' }, { name: 'active', label: 'Active', type: 'switch' }]}
        defaults={{ unit: 'pcs', stock_qty: 0, reorder_level: 2, active: true }} activity={(v, n) => `${n ? 'Added' : 'Updated'} product ${v.name}`}
        preview={(v) => {
          const margin = Number(v.price_kes || 0) - Number(v.cost_kes || 0)
          return (
            <div className="rounded-card bg-card border border-border/70 p-5 shadow-e1">
              <div className="flex items-center justify-between"><span className="text-[12px] text-muted-foreground font-mono">{v.sku || 'SKU'}</span><Badge tone={stockTone(v)} dot>{stockLabel(v)}</Badge></div>
              <div className="font-semibold text-[17px] mt-3">{v.name || 'New product'}</div>
              <div className="text-[13px] text-muted-foreground">{v.category || 'Category'}</div>
              <div className="grid grid-cols-3 gap-2 mt-4 text-center">
                {[['Cost', kes(v.cost_kes)], ['Price', kes(v.price_kes)], ['Margin', `${v.price_kes ? Math.round((margin / Number(v.price_kes)) * 100) : 0}%`]].map(([k, x]) => <div key={k} className="rounded-[12px] bg-foreground/[.035] py-2"><div className="text-[11px] text-muted-foreground">{k}</div><div className="text-[13px] font-semibold num">{x}</div></div>)}
              </div>
              <div className="text-[12.5px] text-muted-foreground mt-3 num">{Number(v.stock_qty || 0)} {v.unit} in stock · reorder at {Number(v.reorder_level || 0)}</div>
            </div>)
        }} />
      {adj && <AdjustStock p={adj} onClose={() => setAdj(null)} />}
    </div>
  )
}

function AdjustStock({ p, onClose }: { p: Row; onClose: () => void }) {
  const [dir, setDir] = useState('in')
  const [qty, setQty] = useState('1')
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const n = Number(qty || 0), next = Number(p.stock_qty) + (dir === 'in' ? n : -n)
  return (
    <Dialog open onOpenChange={(v) => !v && onClose()} size="sm" title={`Adjust stock: ${p.name}`} description={`Currently ${Number(p.stock_qty)} ${p.unit}`}
      footer={<><Button variant="outline" onClick={onClose}>Cancel</Button><Button loading={busy} disabled={!(n > 0) || next < 0} onClick={async () => {
        setBusy(true)
        try { await update('products', p.id, { stock_qty: next }); await logActivity(`Stock ${dir === 'in' ? '+' : '-'}${n} ${p.name}${reason ? ` (${reason})` : ''}`, 'stock_adjusted', 'product', p.id, { qty: n, dir }); toast.success(`Stock is now ${next}`); onClose() }
        catch (e: any) { toast.error(e.message) } finally { setBusy(false) }
      }}>Save</Button></>}>
      <div className="grid gap-4">
        <Field label="Direction"><Select value={dir} onChange={setDir} options={[{ value: 'in', label: 'Stock in (received, returned)' }, { value: 'out', label: 'Stock out (used, damaged, lost)' }]} /></Field>
        <Field label="Quantity">
          <div className="flex items-center gap-2"><Button size="icon" variant="outline" onClick={() => setQty(String(Math.max(1, n - 1)))} aria-label="Less"><Minus /></Button><Input type="number" className="text-center" value={qty} onChange={(e) => setQty(e.target.value)} /><Button size="icon" variant="outline" onClick={() => setQty(String(n + 1))} aria-label="More"><Plus /></Button></div>
        </Field>
        <Field label="Reason"><Textarea value={reason} onChange={(e) => setReason(e.target.value)} className="min-h-[70px]" /></Field>
        <div className={cn('text-[13px]', next < 0 ? 'text-danger' : 'text-muted-foreground')}>New stock level: <span className="num font-semibold">{next}</span></div>
      </div>
    </Dialog>
  )
}