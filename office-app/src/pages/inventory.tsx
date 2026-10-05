import { useState } from 'react'
import { toast } from 'sonner'
import { AlertTriangle, ArrowDownLeft, ArrowUpRight, Boxes, History, Minus, Package, Plus, ShoppingCart, Wallet } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useList, insert, update, remove, logActivity, invalidate, type Row } from '@/services/db'
import { useAuth, currentActor } from '@/lib/auth'
import { cn, fmtDT, humanize, kes, kesShort, sum } from '@/lib/utils'
import { Badge, Button, ChevronFilter, Dialog, Field, Input, Kpi, PageHeader, Progress, Select, TabPanel, Tabs, Textarea } from '@/components/ui'
import { DataTable } from '@/components/data-table'
import { RecordForm } from '@/components/form'
import { Product360 } from '@/components/catalog360'

const stockTone = (p: Row) => (Number(p.stock_qty) <= 0 ? 'danger' : Number(p.stock_qty) <= Number(p.reorder_level || 0) ? 'warning' : 'success') as any
const stockLabel = (p: Row) => (Number(p.stock_qty) <= 0 ? 'Out of stock' : Number(p.stock_qty) <= Number(p.reorder_level || 0) ? 'Low stock' : 'In stock')
const USAGE = [{ value: 'retail', label: 'Retail (sold to clients)' }, { value: 'internal', label: 'Internal use (consumed on jobs)' }, { value: 'both', label: 'Both' }]
const MOVE_KINDS = ['opening', 'purchase', 'sale', 'usage', 'adjustment', 'return', 'damage']
const MOVE_TONE: Record<string, any> = { opening: 'neutral', purchase: 'success', sale: 'info', usage: 'violet', adjustment: 'warning', return: 'teal', damage: 'danger' }

export default function Inventory() {
  const { can } = useAuth()
  const nav = useNavigate()
  const p = useList('products', { select: '*, suppliers(name)', filter: (b) => b.is('deleted_at', null), order: ['name', true] })
  const sup = useList('suppliers', { select: 'id,name', filter: (b) => b.is('deleted_at', null), order: ['name', true] })
  const moves = useList('stock_movements', { select: '*, products(name,sku,unit)', order: ['created_at'], limit: 2000 })
  const [tab, setTab] = useState('products')
  const [f, setF] = useState('all')
  const [fCat, setFCat] = useState('')
  const [fSup, setFSup] = useState('')
  const [fUse, setFUse] = useState('')
  const [fBrand, setFBrand] = useState('')
  const [mKind, setMKind] = useState('')
  const [mProd, setMProd] = useState('')
  const [edit, setEdit] = useState<Row | null | undefined>(undefined)
  const [adj, setAdj] = useState<Row | null>(null)
  const [open, setOpen] = useState<string | null>(null)
  const rows = p.data || []
  const low = rows.filter((r) => stockTone(r) === 'warning'), out = rows.filter((r) => stockTone(r) === 'danger')
  const cats = Array.from(new Set(rows.map((r) => r.category).filter(Boolean))) as string[]
  const brands = Array.from(new Set(rows.map((r) => r.brand).filter(Boolean))) as string[]
  const view = rows.filter((r) => (f === 'all' || (f === 'low' ? stockTone(r) === 'warning' : f === 'out' ? stockTone(r) === 'danger' : f === 'ok' ? stockTone(r) === 'success' : true))
    && (!fCat || r.category === fCat) && (!fSup || r.supplier_id === fSup) && (!fUse || r.usage_type === fUse) && (!fBrand || r.brand === fBrand))
  const M = (moves.data || []).filter((m) => (!mKind || m.kind === mKind) && (!mProd || m.product_id === mProd))
  const d30 = Date.now() - 30 * 864e5
  const m30 = (moves.data || []).filter((m) => +new Date(m.created_at) >= d30)
  const supOpts = (sup.data || []).map((s) => ({ value: s.id, label: s.name }))
  return (
    <div>
      <PageHeader title="Inventory" sub="Hardware and consumables we resell or install: tablets, printers, signature pads, licences"
        actions={<>
          {(low.length + out.length) > 0 && can('purchases', 'create') && <Button variant="outline" onClick={() => nav('/purchases?reorder=1')}><ShoppingCart />Reorder {low.length + out.length}</Button>}
          {can('inventory', 'create') && <Button onClick={() => setEdit(null)}><Plus />Add product</Button>}
        </>} />
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4 mb-5">
        <Kpi solid tone="brand" label="Products" value={rows.length} foot={`${sum(rows, 'stock_qty')} units on hand`} icon={<Boxes />} />
        <Kpi solid tone="info" label="Stock value (cost)" value={sum(rows, (r) => r.stock_qty * r.cost_kes)} format={kesShort} icon={<Wallet />} />
        <Kpi solid tone="success" label="Retail value" value={sum(rows.filter((r) => r.usage_type !== 'internal'), (r) => r.stock_qty * r.price_kes)} format={kesShort} icon={<Package />} />
        <Kpi solid tone="warning" label="Low stock" value={low.length} icon={<AlertTriangle />} onClick={() => { setTab('products'); setF('low') }} />
        <Kpi solid tone="danger" label="Out of stock" value={out.length} onClick={() => { setTab('products'); setF('out') }} />
        <Kpi solid tone="violet" label="Movements (30 days)" value={m30.length} foot={`${sum(m30.filter((m) => Number(m.qty) > 0), 'qty')} in · ${Math.abs(sum(m30.filter((m) => Number(m.qty) < 0), 'qty'))} out`} icon={<History />} onClick={() => setTab('ledger')} />
      </div>
      <Tabs value={tab} onChange={setTab} items={[{ id: 'products', label: 'Products', count: rows.length }, { id: 'ledger', label: 'Stock ledger', count: moves.data?.length }]}>
        <TabPanel id="products">
          <div className="mb-4"><ChevronFilter value={f} onChange={setF} items={[{ id: 'all', label: 'All', count: rows.length }, { id: 'ok', label: 'In stock', tone: 'success', count: rows.length - low.length - out.length }, { id: 'low', label: 'Low', tone: 'warning', count: low.length }, { id: 'out', label: 'Out', tone: 'danger', count: out.length }]} /></div>
          <DataTable rows={view} loading={p.isLoading} onRow={(r) => setOpen(r.id)} searchKeys={['name', 'sku', 'barcode', 'brand', 'category', 'suppliers.name', 'shelf']} exportName="inventory" initialSort={['stock_qty', 'asc']}
            filters={<>
              <Select size="sm" value={fCat} onChange={setFCat} allowClear="All categories" options={cats.map((c) => ({ value: c, label: c }))} />
              <Select size="sm" value={fBrand} onChange={setFBrand} allowClear="All brands" options={brands.map((c) => ({ value: c, label: c }))} />
              <Select size="sm" value={fSup} onChange={setFSup} allowClear="All suppliers" options={supOpts} />
              <Select size="sm" value={fUse} onChange={setFUse} allowClear="Any usage" options={USAGE} />
            </>} onClearFilters={() => { setFCat(''); setFSup(''); setFUse(''); setFBrand(''); setF('all') }}
            onView={(r) => setOpen(r.id)} onEdit={can('inventory', 'edit') ? setEdit : undefined} onDelete={can('inventory', 'delete') ? async (r) => { await remove('products', r.id, true) } : undefined}
            importTable="products" importFields={['sku', 'name', 'barcode', 'category', 'brand', 'unit', 'pack_size', 'usage_type', 'cost_kes', 'price_kes', 'stock_qty', 'reorder_level', 'reorder_qty', 'shelf']} importDefaults={{ active: true }} onImported={() => invalidate(['products'])}
            bulkActions={can('inventory', 'edit') ? (sel, clear) => <Button size="sm" variant="outline" onClick={async () => { for (const r of sel) await update('products', r.id, { active: !r.active }); toast.success(`${sel.length} products updated`); clear() }}>Toggle active</Button> : undefined}
            cols={[
              { key: 'name', label: 'Product', sort: true, render: (r) => <div><div className="font-medium">{r.name}</div><div className="text-[12px] text-muted-foreground font-mono">{r.sku}{r.barcode ? ` · ${r.barcode}` : ''}</div></div> },
              { key: 'category', label: 'Category', hideBelow: 'md', render: (r) => <div><div>{r.category || '—'}</div>{r.brand && <div className="text-[12px] text-muted-foreground">{r.brand}</div>}</div> },
              { key: 'usage_type', label: 'Usage', hideBelow: 'lg', render: (r) => <Badge tone={r.usage_type === 'retail' ? 'info' : r.usage_type === 'internal' ? 'violet' : 'neutral'}>{r.usage_type === 'internal' ? 'Internal' : humanize(r.usage_type || 'both')}</Badge> },
              { key: 'suppliers.name', label: 'Supplier', hideBelow: 'lg' },
              { key: 'stock_qty', label: 'Stock', sort: true, render: (r) => (
                <div className="flex items-center gap-2 min-w-[150px]"><Progress value={Math.min(100, (Number(r.stock_qty) / Math.max(1, Number(r.reorder_level || 1) * 3)) * 100)} tone={stockTone(r)} className="w-16" />
                  <span className="num font-medium">{Number(r.stock_qty)}</span><span className="text-muted-foreground text-[12px]">{r.unit}{Number(r.pack_size) > 1 ? ` ×${r.pack_size}` : ''}</span></div>) },
              { key: 'reorder_level', label: 'Min', align: 'right', hideBelow: 'md', render: (r) => <span className="num">{Number(r.reorder_level || 0)}</span> },
              { key: 'status', label: 'Status', hideBelow: 'sm', render: (r) => <Badge tone={stockTone(r)} dot>{stockLabel(r)}</Badge>, csv: stockLabel },
              { key: 'shelf', label: 'Shelf', hideBelow: 'lg', render: (r) => r.shelf || '—' },
              { key: 'cost_kes', label: 'Cost', align: 'right', hideBelow: 'md', render: (r) => kes(r.cost_kes) },
              { key: 'price_kes', label: 'Price', align: 'right', sort: true, render: (r) => r.usage_type === 'internal' ? <span className="text-muted-foreground">—</span> : kes(r.price_kes) },
              { key: 'act', label: '', align: 'right', render: (r) => can('inventory', 'edit') && <Button size="sm" variant="soft" onClick={(e) => { e.stopPropagation(); setAdj(r) }}>Adjust</Button> },
            ]} />
        </TabPanel>
        <TabPanel id="ledger">
          <DataTable rows={M} loading={moves.isLoading} searchKeys={['products.name', 'products.sku', 'reason', 'recorded_by']} exportName="stock-ledger" initialSort={['created_at', 'desc']} pageSize={25}
            filters={<>
              <Select size="sm" value={mProd} onChange={setMProd} allowClear="All products" options={rows.map((r) => ({ value: r.id, label: r.name }))} />
              <Select size="sm" value={mKind} onChange={setMKind} allowClear="All movement types" options={MOVE_KINDS.map((k) => ({ value: k, label: humanize(k) }))} />
            </>} onClearFilters={() => { setMProd(''); setMKind('') }}
            cols={[
              { key: 'created_at', label: 'When', sort: true, render: (r) => <span className="num whitespace-nowrap">{fmtDT(r.created_at)}</span> },
              { key: 'products.name', label: 'Product', sort: true, render: (r) => <div><div className="font-medium">{r.products?.name}</div><div className="text-[12px] text-muted-foreground font-mono">{r.products?.sku}</div></div> },
              { key: 'kind', label: 'Type', render: (r) => <Badge tone={MOVE_TONE[r.kind]}>{humanize(r.kind)}</Badge> },
              { key: 'qty', label: 'Qty', align: 'right', sort: true, render: (r) => <span className={cn('num font-semibold inline-flex items-center gap-1', Number(r.qty) < 0 ? 'text-danger' : 'text-success')}>{Number(r.qty) < 0 ? <ArrowUpRight className="size-3.5" /> : <ArrowDownLeft className="size-3.5" />}{Number(r.qty) > 0 ? '+' : ''}{Number(r.qty)}</span> },
              { key: 'balance_after', label: 'Balance', align: 'right', render: (r) => <span className="num">{r.balance_after == null ? '—' : Number(r.balance_after)}</span> },
              { key: 'value', label: 'Value', align: 'right', hideBelow: 'md', render: (r) => r.unit_cost_kes ? kes(Math.abs(Number(r.qty)) * Number(r.unit_cost_kes)) : '—', csv: (r) => Math.abs(Number(r.qty)) * Number(r.unit_cost_kes || 0) },
              { key: 'reason', label: 'Reason', hideBelow: 'md', render: (r) => <span className="line-clamp-1 max-w-[240px]">{r.reason || '—'}</span> },
              { key: 'recorded_by', label: 'By', hideBelow: 'lg' },
            ]} />
        </TabPanel>
      </Tabs>
      <RecordForm open={edit !== undefined} onOpenChange={(v) => !v && setEdit(undefined)} table="products" initial={edit ? Object.fromEntries(Object.entries(edit).filter(([k]) => k !== 'suppliers')) : edit} title={edit ? 'Edit product' : 'Add product'} size="xl"
        fields={[{ name: 'sku', label: 'SKU', required: true, placeholder: 'PRD-001' }, { name: 'name', label: 'Product name', required: true },
          { name: 'barcode', label: 'Barcode', hint: 'Scan or type it; POS quick code finds it' }, { name: 'category', label: 'Category' },
          { name: 'brand', label: 'Brand' }, { name: 'supplier_id', label: 'Preferred supplier', type: 'select', options: supOpts },
          { name: 'unit', label: 'Unit', placeholder: 'pcs, licence, box' }, { name: 'pack_size', label: 'Units per pack', type: 'number' },
          { name: 'usage_type', label: 'Usage', type: 'select', options: USAGE }, { name: 'commission_pct', label: 'Commission %', type: 'number', hint: 'Blank uses the staff default' },
          { name: 'cost_kes', label: 'Cost price (KES)', type: 'number', required: true }, { name: 'price_kes', label: 'Selling price (KES)', type: 'number', hint: 'Leave 0 for internal-use items' },
          { name: 'stock_qty', label: edit ? 'Stock on hand' : 'Opening stock', type: 'number' }, { name: 'reorder_level', label: 'Min stock (reorder at)', type: 'number' },
          { name: 'reorder_qty', label: 'Reorder quantity', type: 'number' }, { name: 'shelf', label: 'Shelf / location' },
          { name: 'track_expiry', label: 'Track expiry', type: 'switch' }, { name: 'active', label: 'Active', type: 'switch' }]}
        defaults={{ unit: 'pcs', pack_size: 1, usage_type: 'both', stock_qty: 0, reorder_level: 2, active: true, track_expiry: false }}
        activity={(v, n) => `${n ? 'Added' : 'Updated'} product ${v.name}`}
        onSaved={async (r) => { if (!edit && r?.id && Number(r.stock_qty) > 0) { await insert('stock_movements', { product_id: r.id, kind: 'opening', qty: Number(r.stock_qty), balance_after: Number(r.stock_qty), unit_cost_kes: Number(r.cost_kes), reason: 'Opening stock', recorded_by: currentActor }); invalidate(['stock_movements']) } }}
        preview={(v) => {
          const margin = Number(v.price_kes || 0) - Number(v.cost_kes || 0)
          const s = (sup.data || []).find((x) => x.id === v.supplier_id)
          return (
            <div className="rounded-card bg-card border border-border/70 p-5 shadow-e1">
              <div className="flex items-center justify-between"><span className="text-[12px] text-muted-foreground font-mono">{v.sku || 'SKU'}{v.barcode ? ` · ${v.barcode}` : ''}</span><Badge tone={stockTone(v)} dot>{stockLabel(v)}</Badge></div>
              <div className="font-semibold text-[17px] mt-3">{v.name || 'New product'}</div>
              <div className="text-[13px] text-muted-foreground">{[v.category, v.brand].filter(Boolean).join(' · ') || 'Category · brand'}</div>
              <div className="grid grid-cols-3 gap-2 mt-4 text-center">
                {[['Cost', kes(v.cost_kes)], ['Price', v.usage_type === 'internal' ? '—' : kes(v.price_kes)], ['Margin', v.usage_type === 'internal' || !Number(v.price_kes) ? '—' : `${Math.round((margin / Number(v.price_kes)) * 100)}%`]].map(([k, x]) => <div key={k} className="rounded-[12px] bg-foreground/[.035] py-2"><div className="text-[11px] text-muted-foreground">{k}</div><div className="text-[13px] font-semibold num">{x}</div></div>)}
              </div>
              <dl className="text-[12.5px] mt-3 space-y-1">
                {[['Stock', `${Number(v.stock_qty || 0)} ${v.unit || ''}${Number(v.pack_size) > 1 ? ` (×${v.pack_size} per pack)` : ''}`], ['Reorder', `at ${Number(v.reorder_level || 0)}${v.reorder_qty ? `, order ${v.reorder_qty}` : ''}`], ['Supplier', s?.name || '—'], ['Shelf', v.shelf || '—'], ['Usage', USAGE.find((u) => u.value === v.usage_type)?.label || '—'], ['Commission', v.commission_pct == null || v.commission_pct === '' ? 'Staff default' : `${v.commission_pct}%`]].map(([k, x]) => <div key={k} className="flex justify-between gap-3"><dt className="text-muted-foreground">{k}</dt><dd className="text-right">{x}</dd></div>)}
              </dl>
              {v.track_expiry && <div className="text-[12px] text-warning mt-2">Expiry tracked for this product</div>}
            </div>)
        }} />
      <Product360 id={open} onOpenChange={(v) => !v && setOpen(null)} onEdit={(r) => { setOpen(null); setEdit(r) }} onAdjust={(r) => setAdj(r)} />
      {adj && <AdjustStock p={adj} onClose={() => setAdj(null)} />}
    </div>
  )
}

function AdjustStock({ p, onClose }: { p: Row; onClose: () => void }) {
  const [kind, setKind] = useState('purchase')
  const [qty, setQty] = useState('1')
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const inward = ['purchase', 'return', 'adjustment_in'].includes(kind)
  const n = Number(qty || 0), next = Number(p.stock_qty) + (inward ? n : -n)
  return (
    <Dialog open onOpenChange={(v) => !v && onClose()} size="sm" title={`Adjust stock: ${p.name}`} description={`Currently ${Number(p.stock_qty)} ${p.unit}`}
      footer={<><Button variant="outline" onClick={onClose}>Cancel</Button><Button loading={busy} disabled={!(n > 0) || next < 0} onClick={async () => {
        setBusy(true)
        try {
          const k = kind.replace(/_(in|out)$/, '')
          await update('products', p.id, { stock_qty: next })
          await insert('stock_movements', { product_id: p.id, kind: k, qty: inward ? n : -n, balance_after: next, unit_cost_kes: Number(p.cost_kes), reason: reason || null, recorded_by: currentActor })
          await logActivity(`Stock ${inward ? '+' : '-'}${n} ${p.name} (${humanize(k)}${reason ? `: ${reason}` : ''})`, 'stock_adjusted', 'product', p.id, { qty: n, kind: k })
          invalidate(['products', 'stock_movements']); toast.success(`Stock is now ${next}`); onClose()
        } catch (e: any) { toast.error(e.message) } finally { setBusy(false) }
      }}>Save</Button></>}>
      <div className="grid gap-4">
        <Field label="Movement"><Select value={kind} onChange={setKind} options={[{ value: 'purchase', label: 'Received from supplier (+)' }, { value: 'return', label: 'Returned by client (+)' }, { value: 'adjustment_in', label: 'Count correction (+)' }, { value: 'usage', label: 'Used on a job (−)' }, { value: 'damage', label: 'Damaged or lost (−)' }, { value: 'adjustment_out', label: 'Count correction (−)' }]} /></Field>
        <Field label="Quantity">
          <div className="flex items-center gap-2"><Button size="icon" variant="outline" onClick={() => setQty(String(Math.max(1, n - 1)))} aria-label="Less"><Minus /></Button><Input type="number" className="text-center" value={qty} onChange={(e) => setQty(e.target.value)} /><Button size="icon" variant="outline" onClick={() => setQty(String(n + 1))} aria-label="More"><Plus /></Button></div>
        </Field>
        <Field label="Reason"><Textarea value={reason} onChange={(e) => setReason(e.target.value)} className="min-h-[70px]" /></Field>
        <div className={cn('text-[13px]', next < 0 ? 'text-danger' : 'text-muted-foreground')}>New stock level: <span className="num font-semibold">{next}</span> · logged in the stock ledger</div>
      </div>
    </Dialog>
  )
}