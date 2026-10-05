import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { BadgeCheck, Boxes, History, Minus, Package, Pause, Plus, Search, ShoppingBag, Sparkles, Trash2, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useList, insert, run, logActivity, invalidate, type Row } from '@/services/db'
import { useBiz } from '@/lib/business'
import { cn, kes, sum } from '@/lib/utils'
import { PAY_METHODS, methodLabel } from '@/lib/status'
import { gsap, prefersReduced } from '@/lib/gsap'
import { Badge, Button, Card, Field, Input, Menu, PageHeader, Segmented, Select } from '@/components/ui'
import { Invoice360, useClientOptions, useStaffOptions } from '@/components/shared'

type Line = { key: string; kind: 'service' | 'product' | 'package' | 'plan'; ref_id: string; name: string; qty: number; unit_price_kes: number; commission_pct?: number; stock?: number }

export default function POS() {
  const { businesses } = useBiz()
  const services = useList('services', { select: 'id,name,price_kes,commission_pct,category_id,service_categories(name,color)', filter: (b) => b.eq('active', true).is('deleted_at', null), order: ['name', true] })
  const products = useList('products', { select: 'id,name,sku,barcode,price_kes,stock_qty,category', filter: (b) => b.eq('active', true).is('deleted_at', null), order: ['name', true] })
  const packages = useList('packages', { select: 'id,name,price_kes,description,validity_days,items', filter: (b) => b.eq('active', true), order: ['price_kes', true] })
  const plans = useList('membership_plans', { select: 'id,name,price_kes,billing_cycle,color', filter: (b) => b.eq('active', true), order: ['price_kes', true] })
  const till = useList('till_sessions', { filter: (b) => b.eq('status', 'open'), limit: 1 })
  const { options: clientOpts } = useClientOptions()
  const { options: staffOpts } = useStaffOptions()
  const [tab, setTab] = useState<'service' | 'product' | 'package' | 'plan'>('service')
  const [q, setQ] = useState('')
  const [cart, setCart] = useState<Line[]>([])
  const [client, setClient] = useState('')
  const [staff, setStaff] = useState('')
  const [discount, setDiscount] = useState('0')
  const [tip, setTip] = useState('0')
  const [taxPct, setTaxPct] = useState('0')
  const [splits, setSplits] = useState<{ method: string; amount: string; ref: string }[]>([])
  const [held, setHeld] = useState<Row[]>(() => { try { return JSON.parse(localStorage.getItem('naim-pos-held') || '[]') } catch { return [] } })
  const taxCfg = useList('app_settings', { filter: (b) => b.eq('key', 'tax') })
  useEffect(() => { const t = taxCfg.data?.[0]?.value; if (t?.vat_registered && Number(t.vat_pct)) setTaxPct(String(t.vat_pct)) }, [taxCfg.data])
  const saveHeld = (h: Row[]) => { setHeld(h); localStorage.setItem('naim-pos-held', JSON.stringify(h)) }
  const [method, setMethod] = useState('mpesa')
  const [ref, setRef] = useState('')
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState<string | null>(null)

  const catalogue = useMemo(() => {
    const s = q.toLowerCase()
    const pick = tab === 'service' ? services.data : tab === 'product' ? products.data : tab === 'package' ? packages.data : plans.data
    return (pick || []).filter((x) => !s || x.name.toLowerCase().includes(s) || String(x.sku || '').toLowerCase() === s || String(x.barcode || '') === q.trim())
  }, [tab, q, services.data, products.data, packages.data, plans.data])

  const add = (x: Row, e?: React.MouseEvent) => {
    if (tab === 'product' && Number(x.stock_qty) <= 0) return toast.error('Out of stock')
    setCart((c) => {
      const k = `${tab}:${x.id}`, ex = c.find((l) => l.key === k)
      if (ex) { if (tab === 'product' && ex.qty + 1 > Number(x.stock_qty)) { toast.error('Not enough stock'); return c } return c.map((l) => (l.key === k ? { ...l, qty: l.qty + 1 } : l)) }
      return [...c, { key: k, kind: tab, ref_id: x.id, name: x.name, qty: 1, unit_price_kes: Number(x.price_kes), commission_pct: Number(x.commission_pct || 0), stock: x.stock_qty }]
    })
    if (e && !prefersReduced()) gsap.fromTo(e.currentTarget, { scale: 0.96 }, { scale: 1, duration: 0.35, ease: 'back.out(3)' })
  }
  const setQty = (k: string, d: number) => setCart((c) => c.flatMap((l) => (l.key !== k ? [l] : l.qty + d <= 0 ? [] : [{ ...l, qty: l.stock !== undefined && l.qty + d > Number(l.stock) ? l.qty : l.qty + d }])))
  const subtotal = sum(cart, (l) => l.qty * l.unit_price_kes)
  const taxable = Math.max(0, subtotal - Number(discount || 0))
  const taxAmt = Math.round((taxable * Number(taxPct || 0)) / 100)
  const total = Math.max(0, taxable + taxAmt + Number(tip || 0))
  const splitSum = sum(splits, (x) => Number(x.amount || 0))
  const primary = Math.max(0, total - splitSum)

  async function checkout() {
    if (!cart.length) return toast.error('Cart is empty')
    if ((cart.some((l) => l.kind === 'plan' || l.kind === 'package')) && !client) return toast.error('Choose the client for packages and care plans')
    if (splitSum > total) return toast.error('Split payments are more than the total')
    if (primary > 0 && method === 'mpesa' && !ref.trim()) return toast.error('Enter the M-PESA confirmation code')
    if (splits.some((x) => x.method === 'mpesa' && Number(x.amount) > 0 && !x.ref.trim())) return toast.error('Each M-PESA split needs its confirmation code')
    setBusy(true)
    try {
      const line_items = cart.map(({ kind, ref_id, name, qty, unit_price_kes }) => ({ kind, ref_id, name, qty, unit_price_kes }))
      const inv = await insert('invoices', { client_id: client || null, staff_id: staff || null, type: 'pos', status: 'sent', line_items, discount_kes: Number(discount || 0), tax_kes: taxAmt, tax_rate: Number(taxPct || 0), tip_kes: Number(tip || 0), issued_at: new Date().toISOString(), due_date: new Date().toISOString().slice(0, 10), business_id: businesses.find((b) => b.is_primary)?.id || null })
      const tillId = till.data?.[0]?.id ?? null
      const pays = [...(primary > 0 || !splits.length ? [{ method, amount: primary, ref }] : []), ...splits.filter((x) => Number(x.amount) > 0).map((x) => ({ method: x.method, amount: Number(x.amount), ref: x.ref }))]
      await insert('payments', pays.map((x) => ({ invoice_id: inv.id, amount_kes: x.amount, method: x.method, reference: x.ref.trim() || null, paid_at: new Date().toISOString(), received_by: staff || null, till_session_id: x.method === 'cash' ? tillId : null })))
      for (const l of cart.filter((l) => l.kind === 'product')) {
        const p = await run<Row>(supabase.from('products').select('stock_qty').eq('id', l.ref_id).single())
        await run(supabase.from('products').update({ stock_qty: Number(p.stock_qty) - l.qty }).eq('id', l.ref_id))
      }
      if (staff) {
        const comm = sum(cart.filter((l) => l.kind === 'service'), (l) => (l.qty * l.unit_price_kes * (l.commission_pct || 0)) / 100)
        const rows: Row[] = []
        if (comm > 0) rows.push({ invoice_id: inv.id, staff_id: staff, kind: 'commission', amount_kes: Math.round(comm), status: 'pending' })
        if (Number(tip) > 0) rows.push({ invoice_id: inv.id, staff_id: staff, kind: 'tip', amount_kes: Number(tip), status: 'pending' })
        if (rows.length) await insert('commissions', rows)
      }
      for (const l of cart.filter((l) => l.kind === 'package')) {
        const pk = (packages.data || []).find((p) => p.id === l.ref_id)
        await insert('client_packages', { client_id: client, package_id: l.ref_id, sessions_total: sum(pk?.items || [], 'qty') || 1, sessions_used: 0, purchased_at: new Date().toISOString(), expires_at: new Date(Date.now() + (pk?.validity_days || 90) * 864e5).toISOString(), status: 'active' })
      }
      for (const l of cart.filter((l) => l.kind === 'plan')) {
        const pl = (plans.data || []).find((p) => p.id === l.ref_id), next = new Date(); next.setMonth(next.getMonth() + (pl?.billing_cycle === 'yearly' ? 12 : 1))
        await insert('subscriptions', { client_id: client, plan_id: l.ref_id, amount_kes: l.unit_price_kes, billing_cycle: pl?.billing_cycle || 'monthly', status: 'active', started_at: new Date().toISOString().slice(0, 10), next_due: next.toISOString().slice(0, 10) })
      }
      await logActivity(`POS sale ${inv.number || ''}: ${kes(total)} via ${methodLabel(method)}`, 'payment_received', 'invoice', inv.id, { amount_kes: total })
      invalidate(); toast.success(`Paid. ${inv.number || 'Invoice'} issued.`)
      setCart([]); setDiscount('0'); setTip('0'); setRef(''); setSplits([]); setDone(inv.id)
    } catch (e: any) { toast.error(e.message) } finally { setBusy(false) }
  }

  const TABS = [{ id: 'service' as const, label: <span className="inline-flex items-center gap-1.5"><Sparkles className="size-3.5" />Services</span> }, { id: 'product' as const, label: <span className="inline-flex items-center gap-1.5"><Boxes className="size-3.5" />Products</span> },
    { id: 'package' as const, label: <span className="inline-flex items-center gap-1.5"><Package className="size-3.5" />Packages</span> }, { id: 'plan' as const, label: <span className="inline-flex items-center gap-1.5"><BadgeCheck className="size-3.5" />Care plans</span> }]
  return (
    <div>
      <PageHeader title="POS & Billing" sub={till.data?.length ? 'Till is open. Cash sales post to the current till session.' : 'No till open. Open one in Cash Till to take cash.'} />
      <div className="grid xl:grid-cols-[1fr_400px] gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3 mb-4" data-reveal>
            <Segmented value={tab} onChange={setTab} items={TABS} />
            <div className="relative flex-1 min-w-[200px]"><Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" /><Input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && catalogue[0]) { add(catalogue[0]); setQ('') } }} placeholder="Search, or scan SKU / barcode and press Enter" className="pl-9" /></div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 2xl:grid-cols-4 gap-3">
            {catalogue.map((x) => {
              const out = tab === 'product' && Number(x.stock_qty) <= 0
              const color = x.service_categories?.color || x.color
              return (
                <button key={x.id} onClick={(e) => add(x, e)} disabled={out} className={cn('text-left rounded-card bg-card border border-border/70 shadow-e1 p-4 hover:shadow-e2 transition-shadow disabled:opacity-50 relative overflow-hidden')}>
                  {color && <span className="absolute left-0 inset-y-0 w-1" style={{ background: color }} />}
                  <div className="text-[13.5px] font-medium leading-snug line-clamp-2 min-h-[38px]">{x.name}</div>
                  <div className="flex items-end justify-between mt-3 gap-2"><span className="font-semibold num">{kes(x.price_kes)}</span>
                    {tab === 'product' && <span className={cn('text-[11.5px] num', out ? 'text-danger' : 'text-muted-foreground')}>{out ? 'Out' : `${Number(x.stock_qty)} left`}</span>}
                    {tab === 'plan' && <span className="text-[11.5px] text-muted-foreground">/{x.billing_cycle === 'yearly' ? 'yr' : 'mo'}</span>}</div>
                </button>)
            })}
          </div>
        </div>
        <Card className="xl:sticky xl:top-20 h-max" title={<span className="inline-flex items-center gap-2"><ShoppingBag className="size-4" />Current sale</span>} action={<div className="flex gap-1">
            {cart.length > 0 && <Button size="sm" variant="ghost" onClick={() => { saveHeld([...held, { id: String(Date.now()), at: new Date().toISOString(), cart, client, staff, discount, tip }]); setCart([]); setClient(''); setDiscount('0'); setTip('0'); toast.success('Sale held') }}><Pause />Hold</Button>}
            {held.length > 0 && <Menu trigger={<Button size="sm" variant="ghost"><History />Recall ({held.length})</Button>} items={held.map((h) => ({ label: `${new Date(h.at).toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' })} · ${h.cart.length} items · ${kes(sum(h.cart, (l: Row) => l.qty * l.unit_price_kes))}`, onSelect: () => { setCart(h.cart); setClient(h.client || ''); setStaff(h.staff || ''); setDiscount(h.discount || '0'); setTip(h.tip || '0'); saveHeld(held.filter((x) => x.id !== h.id)) } }))} />}
            {cart.length > 0 && <Button size="sm" variant="ghost" onClick={() => { setCart([]); setSplits([]) }}><X />Clear</Button>}</div>}>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Client"><Select size="sm" value={client} onChange={setClient} options={clientOpts} placeholder="Walk-in" allowClear="Walk-in" /></Field>
            <Field label="Served by"><Select size="sm" value={staff} onChange={setStaff} options={staffOpts} placeholder="Staff" allowClear="Nobody" /></Field>
          </div>
          <div className="mt-4 space-y-2 max-h-[300px] overflow-y-auto scroll-thin">
            {cart.map((l) => (
              <div key={l.key} className="flex items-center gap-2 rounded-[12px] bg-foreground/[.035] px-3 py-2">
                <div className="min-w-0 flex-1"><div className="text-[13px] font-medium truncate">{l.name}</div><div className="text-[11.5px] text-muted-foreground num">{kes(l.unit_price_kes)}</div></div>
                <Button size="icon-sm" variant="ghost" onClick={() => setQty(l.key, -1)} aria-label="Less">{l.qty === 1 ? <Trash2 /> : <Minus />}</Button>
                <span className="num w-5 text-center text-[13px]">{l.qty}</span>
                <Button size="icon-sm" variant="ghost" onClick={() => setQty(l.key, 1)} aria-label="More"><Plus /></Button>
                <span className="num text-[13px] font-medium w-[86px] text-right">{kes(l.qty * l.unit_price_kes)}</span>
              </div>))}
            {!cart.length && <div className="text-center text-[13px] text-muted-foreground py-8">Tap items to add them</div>}
          </div>
          <div className="mt-4 space-y-2 text-[13.5px]">
            <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span className="num">{kes(subtotal)}</span></div>
            <div className="flex justify-between items-center"><span className="text-muted-foreground">Discount</span><Input type="number" className="h-8 w-28 text-right" value={discount} onChange={(e) => setDiscount(e.target.value)} /></div>
            <div className="flex justify-between items-center"><span className="text-muted-foreground">Tax %{taxAmt > 0 && <span className="num ml-1.5 text-foreground">{kes(taxAmt)}</span>}</span><Input type="number" min={0} className="h-8 w-28 text-right" value={taxPct} onChange={(e) => setTaxPct(e.target.value)} /></div>
            <div className="flex justify-between items-center"><span className="text-muted-foreground">Tip <span className="text-[11px]">(to staff, not revenue)</span></span><Input type="number" className="h-8 w-28 text-right" value={tip} onChange={(e) => setTip(e.target.value)} /></div>
            <div className="flex justify-between pt-3 border-t border-border/70 text-[18px] font-semibold"><span>Total</span><span className="num">{kes(total)}</span></div>
          </div>
          <div className="grid grid-cols-4 gap-1.5 mt-4">{PAY_METHODS.map((m) => <button key={m.value} onClick={() => setMethod(m.value)} aria-pressed={method === m.value} className={cn('h-9 rounded-full text-[12.5px] font-medium transition-colors', method === m.value ? 'bg-foreground text-background' : 'bg-foreground/[.05] hover:bg-foreground/[.09]')}>{m.label}</button>)}</div>
          {method !== 'cash' && <Input className="mt-3" value={ref} onChange={(e) => setRef(e.target.value.toUpperCase())} placeholder={method === 'mpesa' ? 'M-PESA code, e.g. SJK3H7Q2LM' : 'Reference (optional)'} />}
          {method === 'cash' && !till.data?.length && <div className="mt-3"><Badge tone="warning" dot>No till open. Cash will not be linked to a till.</Badge></div>}
          <div className="mt-4 rounded-[12px] border border-border/70 p-3">
            <div className="flex items-center justify-between text-[12.5px]"><span className="font-medium">Split payment</span><Button size="sm" variant="ghost" onClick={() => setSplits([...splits, { method: 'cash', amount: '', ref: '' }])}><Plus />Add</Button></div>
            {splits.map((x, i) => (
              <div key={i} className="grid grid-cols-[1fr_90px_1fr_auto] gap-1.5 mt-2 items-center">
                <Select size="sm" value={x.method} onChange={(v) => setSplits(splits.map((y, j) => (j === i ? { ...y, method: v } : y)))} options={PAY_METHODS} />
                <Input type="number" className="h-8 text-right" placeholder="KES" value={x.amount} onChange={(e) => setSplits(splits.map((y, j) => (j === i ? { ...y, amount: e.target.value } : y)))} />
                <Input className="h-8" placeholder="Ref" value={x.ref} onChange={(e) => setSplits(splits.map((y, j) => (j === i ? { ...y, ref: e.target.value.toUpperCase() } : y)))} />
                <Button size="icon-sm" variant="ghost" aria-label="Remove split" onClick={() => setSplits(splits.filter((_, j) => j !== i))}><X /></Button>
              </div>))}
            <div className="flex justify-between text-[12.5px] mt-2 text-muted-foreground"><span>{methodLabel(method)} (above)</span><span className="num">{kes(primary)}</span></div>
            <div className={cn('flex justify-between text-[12.5px] font-medium', splitSum > total ? 'text-danger' : 'text-success')}><span>Settled</span><span className="num">{kes(Math.min(total, splitSum + primary))} of {kes(total)}</span></div>
          </div>
          <Button size="lg" className="w-full mt-4" loading={busy} disabled={!cart.length} onClick={checkout}>Charge {kes(total)}</Button>
        </Card>
      </div>
      <Invoice360 id={done} onOpenChange={(v) => !v && setDone(null)} />
    </div>
  )
}