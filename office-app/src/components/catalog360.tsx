// Part 9 extra 360s: Product 360 (Inventory) and Package 360 (Services → Packages).
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Boxes, PackageOpen, Pencil, SlidersHorizontal, UserPlus } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { insert, logActivity, run, type Row } from '@/services/db'
import { useAuth } from '@/lib/auth'
import { fmtDate, humanize, kes, sum } from '@/lib/utils'
import { Badge, Button, Dialog, Field, Input, Progress, Select, Stat, TabPanel, type Tone } from './ui'
import { ActivityList, MiniTable, Shell360, useClientOptions } from './shared'

const stockTone = (p: Row): Tone => (Number(p.stock_qty) <= 0 ? 'danger' : Number(p.stock_qty) <= Number(p.reorder_level || 0) ? 'warning' : 'success')
const stockLabel = (p: Row) => (Number(p.stock_qty) <= 0 ? 'Out of stock' : Number(p.stock_qty) <= Number(p.reorder_level || 0) ? 'Low stock' : 'In stock')

const lineQty = (inv: Row, match: (li: Row) => boolean) => sum((inv.line_items || []).filter(match), (li: Row) => Number(li.qty || 0))
const lineAmt = (inv: Row, match: (li: Row) => boolean) => sum((inv.line_items || []).filter(match), (li: Row) => Number(li.qty || 0) * Number(li.unit_price_kes || 0))

/* ---------------- PRODUCT 360: Overview · Sales · Purchase orders · Stock history ---------------- */
export function Product360({ id, onOpenChange, onEdit, onAdjust }: { id: string | null; onOpenChange: (v: boolean) => void; onEdit?: (p: Row) => void; onAdjust?: (p: Row) => void }) {
  const { can } = useAuth()
  const [tab, setTab] = useState('overview')
  const q = useQuery({
    queryKey: ['products', '360', id], enabled: !!id,
    queryFn: async () => {
      const p = await run<Row>(supabase.from('products').select('*, suppliers(name,phone,email)').eq('id', id).single())
      const [byRef, byName, pos, acts] = await Promise.all([
        run<Row[]>(supabase.from('invoices').select('id,number,issued_at,status,clients(business_name),line_items').filter('line_items', 'cs', JSON.stringify([{ ref_id: id }])).is('deleted_at', null)),
        run<Row[]>(supabase.from('invoices').select('id,number,issued_at,status,clients(business_name),line_items').filter('line_items', 'cs', JSON.stringify([{ kind: 'product', name: p.name }])).is('deleted_at', null)),
        run<Row[]>(supabase.from('purchase_orders').select('id,number,status,ordered_at,received_at,items,suppliers(name)').filter('items', 'cs', JSON.stringify([{ product_id: id }])).order('ordered_at', { ascending: false })),
        run<Row[]>(supabase.from('activities').select('*').eq('entity_id', id).order('created_at', { ascending: false }).limit(60)),
      ])
      const sales = [...new Map([...byRef, ...byName].map((i) => [i.id, i])).values()].sort((a, b) => +new Date(b.issued_at) - +new Date(a.issued_at))
      return { p, sales, pos, acts }
    },
  })
  const d = q.data, p = d?.p
  const isMe = (li: Row) => li.ref_id === id || (li.kind === 'product' && li.name === p?.name)
  const soldQty = sum(d?.sales, (i) => lineQty(i, isMe)), revenue = sum(d?.sales?.filter((i) => i.status !== 'void'), (i) => lineAmt(i, isMe))
  const margin = p ? Number(p.price_kes) - Number(p.cost_kes) : 0
  const poQty = (po: Row) => sum((po.items || []).filter((it: Row) => it.product_id === id), (it: Row) => Number(it.qty))
  const onOrder = sum(d?.pos?.filter((po) => ['ordered', 'partial'].includes(po.status)), (po) => poQty(po) - sum((po.items || []).filter((it: Row) => it.product_id === id), (it: Row) => Number(it.received_qty || 0)))
  return (
    <Shell360 open={!!id} onOpenChange={onOpenChange} icon={<Boxes />} title={p?.name || 'Loading'} tab={tab} setTab={setTab}
      badge={p && <Badge tone={stockTone(p)} dot>{stockLabel(p)}</Badge>}
      rows={p ? [['SKU', <span className="font-mono">{p.sku || '—'}</span>], ['Category', p.category], ['Supplier', p.suppliers?.name], ['In stock', `${Number(p.stock_qty)} ${p.unit || ''}`], ['Reorder at', Number(p.reorder_level)],
        ['On order', onOrder], ['Cost', kes(p.cost_kes)], ['Price', kes(p.price_kes)], ['Margin', p.price_kes > 0 ? `${Math.round((margin / Number(p.price_kes)) * 100)}%` : '—'], ['Status', p.active ? 'Active' : 'Hidden']] : []}
      actions={p && <>
        {can('inventory', 'edit') && onAdjust && <Button size="sm" onClick={() => onAdjust(p)}><SlidersHorizontal />Adjust stock</Button>}
        {can('inventory', 'edit') && onEdit && <Button size="sm" variant="outline" onClick={() => onEdit(p)}><Pencil />Edit product</Button>}
      </>}
      tabs={[{ id: 'overview', label: 'Overview' }, { id: 'sales', label: 'Sales', count: d?.sales.length }, { id: 'pos', label: 'Purchase orders', count: d?.pos.length }, { id: 'history', label: 'Stock history', count: d?.acts.length }]}>
      <TabPanel id="overview">
        {p && <div className="grid gap-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Stat label="Units sold" value={soldQty} /><Stat label="Revenue" value={kes(revenue)} /><Stat label="Stock value (cost)" value={kes(Number(p.stock_qty) * Number(p.cost_kes))} /><Stat label="Retail value" value={kes(Number(p.stock_qty) * Number(p.price_kes))} />
          </div>
          <div className="rounded-card bg-foreground/[.035] p-4">
            <div className="flex justify-between text-[13px] mb-2"><span className="text-muted-foreground">Stock against reorder level</span><span className="num font-medium">{Number(p.stock_qty)} / {Number(p.reorder_level) * 3} target</span></div>
            <Progress value={Math.min(100, (Number(p.stock_qty) / Math.max(1, Number(p.reorder_level || 1) * 3)) * 100)} tone={stockTone(p)} />
            <p className="text-[12.5px] text-muted-foreground mt-3">{stockTone(p) === 'success' ? 'Stock is healthy.' : onOrder > 0 ? `${onOrder} on order from ${p.suppliers?.name || 'the supplier'}.` : `Reorder now${p.suppliers?.name ? ` from ${p.suppliers.name}` : ''}. Nothing is on order.`}</p>
          </div>
        </div>}
      </TabPanel>
      <TabPanel id="sales">
        <MiniTable empty="No sales of this product yet" head={['Invoice', 'Client', 'Date', 'Qty', 'Amount']}
          rows={(d?.sales || []).map((i) => [<span className="font-mono">{i.number}</span>, i.clients?.business_name || 'Walk-in', fmtDate(i.issued_at), lineQty(i, isMe), kes(lineAmt(i, isMe))])} />
      </TabPanel>
      <TabPanel id="pos">
        <MiniTable empty="No purchase orders for this product" head={['PO', 'Supplier', 'Ordered', 'Status', 'Qty']}
          rows={(d?.pos || []).map((po) => [<span className="font-mono">{po.number}</span>, po.suppliers?.name, fmtDate(po.ordered_at), <Badge tone={po.status === 'received' ? 'success' : po.status === 'cancelled' ? 'neutral' : 'info'} dot>{humanize(po.status)}</Badge>, poQty(po)])} />
      </TabPanel>
      <TabPanel id="history"><ActivityList items={d?.acts} loading={q.isLoading} max={60} empty="No stock movements recorded yet" /></TabPanel>
    </Shell360>
  )
}

/* ---------------- PACKAGE 360: Contents · Clients · Sales · Timeline ---------------- */
export function Package360({ id, onOpenChange, onEdit }: { id: string | null; onOpenChange: (v: boolean) => void; onEdit?: (p: Row) => void }) {
  const { can } = useAuth()
  const [tab, setTab] = useState('contents')
  const [assign, setAssign] = useState(false)
  const q = useQuery({
    queryKey: ['packages', '360', id], enabled: !!id,
    queryFn: async () => {
      const p = await run<Row>(supabase.from('packages').select('*').eq('id', id).single())
      const svcIds = (p.items || []).map((i: Row) => i.service_id).filter(Boolean)
      const [svcs, holders, sales, acts] = await Promise.all([
        svcIds.length ? run<Row[]>(supabase.from('services').select('id,name,price_kes,delivery_days,duration_min').in('id', svcIds)) : Promise.resolve([] as Row[]),
        run<Row[]>(supabase.from('client_packages').select('*, clients(business_name,contact_name)').eq('package_id', id).order('purchased_at', { ascending: false })),
        run<Row[]>(supabase.from('invoices').select('id,number,issued_at,status,total_kes,clients(business_name),line_items').filter('line_items', 'cs', JSON.stringify([{ ref_id: id }])).is('deleted_at', null)),
        run<Row[]>(supabase.from('activities').select('*').eq('entity_id', id).order('created_at', { ascending: false }).limit(60)),
      ])
      return { p, svcs, holders, sales, acts }
    },
  })
  const d = q.data, p = d?.p
  const items: Row[] = p?.items || []
  const svc = (sid: string) => d?.svcs.find((s) => s.id === sid)
  const value = sum(items, (it) => Number(svc(it.service_id)?.price_kes || 0) * Number(it.qty || 1))
  const saving = value - Number(p?.price_kes || 0)
  const active = (d?.holders || []).filter((h) => h.status === 'active')
  const isMe = (li: Row) => li.ref_id === id
  return (
    <>
      <Shell360 open={!!id} onOpenChange={onOpenChange} icon={<PackageOpen />} title={p?.name || 'Loading'} tab={tab} setTab={setTab}
        badge={p && <Badge tone={p.active ? 'success' : 'neutral'} dot>{p.active ? 'On sale' : 'Hidden'}</Badge>}
        rows={p ? [['Price', kes(p.price_kes)], ['Value if bought separately', kes(value)], ['Client saves', saving > 0 ? `${kes(saving)} (${Math.round((saving / Math.max(1, value)) * 100)}%)` : '—'],
          ['Validity', `${p.validity_days} days`], ['Services inside', items.length], ['Active holders', active.length], ['Sold', d?.holders.length ?? 0], ['Created', fmtDate(p.created_at)]] : []}
        actions={p && <>
          {can('services', 'edit') && <Button size="sm" onClick={() => setAssign(true)}><UserPlus />Sell to a client</Button>}
          {can('services', 'edit') && onEdit && <Button size="sm" variant="outline" onClick={() => onEdit(p)}><Pencil />Edit package</Button>}
        </>}
        tabs={[{ id: 'contents', label: 'Contents', count: items.length }, { id: 'clients', label: 'Clients', count: d?.holders.length }, { id: 'sales', label: 'Sales', count: d?.sales.length }, { id: 'timeline', label: 'Timeline' }]}>
        <TabPanel id="contents">
          {p?.description && <p className="text-[13.5px] text-muted-foreground mb-4">{p.description}</p>}
          <MiniTable empty="This package has no services yet. Edit it to add some." head={['Service', 'Delivery', 'Qty', 'Value']}
            rows={items.map((it) => { const s = svc(it.service_id); return [it.name, s?.delivery_days ? `${s.delivery_days} days` : s?.duration_min ? `${s.duration_min} min` : '—', it.qty || 1, kes(Number(s?.price_kes || 0) * Number(it.qty || 1))] })} />
        </TabPanel>
        <TabPanel id="clients">
          <MiniTable empty="No client holds this package yet" head={['Client', 'Bought', 'Expires', 'Status', 'Sessions used']}
            rows={(d?.holders || []).map((h) => [h.clients?.business_name, fmtDate(h.purchased_at), fmtDate(h.expires_at), <Badge tone={h.status === 'active' ? 'success' : 'neutral'} dot>{humanize(h.status)}</Badge>,
              <span className="inline-flex items-center gap-2 justify-end"><Progress value={(h.sessions_used / Math.max(1, h.sessions_total)) * 100} className="w-14" />{h.sessions_used}/{h.sessions_total}</span>])} />
        </TabPanel>
        <TabPanel id="sales">
          <MiniTable empty="No invoices for this package yet" head={['Invoice', 'Client', 'Date', 'Amount']}
            rows={(d?.sales || []).map((i) => [<span className="font-mono">{i.number}</span>, i.clients?.business_name, fmtDate(i.issued_at), kes(lineAmt(i, isMe))])} />
        </TabPanel>
        <TabPanel id="timeline"><ActivityList items={d?.acts} loading={q.isLoading} max={60} empty="No package activity yet" /></TabPanel>
      </Shell360>
      {assign && p && <AssignPackage pkg={p} sessions={Math.max(1, sum(items, (i) => Number(i.qty || 1)))} onClose={() => { setAssign(false); q.refetch() }} />}
    </>
  )
}

function AssignPackage({ pkg, sessions, onClose }: { pkg: Row; sessions: number; onClose: () => void }) {
  const { options } = useClientOptions()
  const [client, setClient] = useState('')
  const [count, setCount] = useState(String(sessions))
  const [busy, setBusy] = useState(false)
  const expires = new Date(Date.now() + Number(pkg.validity_days || 90) * 864e5).toISOString().slice(0, 10)
  return (
    <Dialog open onOpenChange={(v) => !v && onClose()} size="sm" title={`Sell ${pkg.name}`} description={`${kes(pkg.price_kes)} · valid until ${fmtDate(expires)}`}
      footer={<><Button variant="outline" onClick={onClose}>Cancel</Button><Button loading={busy} disabled={!client || !(Number(count) > 0)} onClick={async () => {
        setBusy(true)
        try {
          const name = options.find((o) => o.value === client)?.label
          await insert('client_packages', { client_id: client, package_id: pkg.id, sessions_total: Number(count), sessions_used: 0, expires_at: expires, status: 'active' })
          await insert('invoices', { client_id: client, type: 'one_off', status: 'sent', line_items: [{ kind: 'package', ref_id: pkg.id, name: pkg.name, qty: 1, unit_price_kes: Number(pkg.price_kes) }], due_date: new Date(Date.now() + 7 * 864e5).toISOString().slice(0, 10) })
          await logActivity(`Sold package ${pkg.name} to ${name}`, 'package_sold', 'package', pkg.id, { client_id: client })
          await logActivity(`Bought package ${pkg.name}`, 'package_sold', 'client', client, { package_id: pkg.id })
          toast.success('Package assigned and invoice raised'); onClose()
        } catch (e: any) { toast.error(e.message) } finally { setBusy(false) }
      }}>Sell and invoice</Button></>}>
      <div className="grid gap-4">
        <Field label="Client"><Select value={client} onChange={setClient} options={options} placeholder="Choose a client" /></Field>
        <Field label="Sessions included" hint="Each use is ticked off from the client's 360 view"><Input type="number" value={count} onChange={(e) => setCount(e.target.value)} /></Field>
      </div>
    </Dialog>
  )
}