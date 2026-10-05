import { useState } from 'react'
import { toast } from 'sonner'
import { ArrowUpRight, FileDown, Lock, LockOpen, Scale, Wallet } from 'lucide-react'
import { useBiz } from '@/lib/business'
import { useAuth, currentActor } from '@/lib/auth'
import { fmtDate } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import { run } from '@/services/db'
import { tablePdf } from '@/components/shared'
import { useList, insert, update, logActivity, type Row } from '@/services/db'
import { cn, fmtDT, kes, sum } from '@/lib/utils'
import { Badge, Button, Card, Dialog, Field, Input, Kpi, PageHeader, Select, Textarea } from '@/components/ui'
import { DataTable } from '@/components/data-table'
import { useStaffOptions } from '@/components/shared'

const DENOMS = [1000, 500, 200, 100, 50, 20, 10, 5, 1]

async function tillReport(s: Row, kind: 'X' | 'Z', expectedNow?: number) {
  const pays = await run<Row[]>(supabase.from('payments').select('amount_kes,paid_at,reference,invoices(number)').eq('till_session_id', s.id).order('paid_at'))
  const taken = sum(pays, 'amount_kes'), expected = expectedNow ?? Number(s.expected_kes ?? Number(s.opening_float_kes) + taken - Number(s.paid_out_kes || 0))
  const body: (string | number)[][] = pays.map((p) => [fmtDT(p.paid_at), p.invoices?.number || '—', p.reference || '—', kes(p.amount_kes)])
  body.push(['', '', 'Opening float', kes(s.opening_float_kes)], ['', '', `Cash sales (${pays.length})`, kes(taken)], ['', '', 'Expected in drawer', kes(expected)])
  if (Number(s.paid_out_kes)) body.splice(body.length - 1, 0, ['', '', 'Paid out', `- ${kes(s.paid_out_kes)}`])
  if (kind === 'Z') body.push(['', '', 'Counted', kes(s.counted_kes)], ['', '', 'Variance', kes(s.variance_kes)])
  await tablePdf(`${kind} report · cash till`, ['Time', 'Invoice', 'Reference', 'Amount'], body, `Opened ${fmtDT(s.opened_at)}${s.closed_at ? ` · closed ${fmtDT(s.closed_at)}` : ' · still open'}${s.staff?.full_name ? ` · ${s.staff.full_name}` : ''}`)
}

export default function Till() {
  const { can } = useAuth()
  const { businesses } = useBiz()
  const sessions = useList('till_sessions', { select: '*, staff:opened_by(full_name), businesses(name)', order: ['opened_at'], limit: 200 })
  const [hf, setHf] = useState('')
  const [hBiz, setHBiz] = useState('')
  const [payout, setPayout] = useState(false)
  const open = (sessions.data || []).find((s) => s.status === 'open')
  const cash = useList('payments', { select: 'amount_kes,paid_at,reference,invoices(number)', filter: (b) => b.eq('till_session_id', open?.id || '00000000-0000-0000-0000-000000000000'), key: [open?.id], limit: 1000 })
  const [opening, setOpening] = useState(false)
  const [closing, setClosing] = useState(false)
  const cashIn = sum(cash.data, 'amount_kes')
  const paidOut = Number(open?.paid_out_kes || 0)
  const expected = Number(open?.opening_float_kes || 0) + cashIn - paidOut
  const closed = (sessions.data || []).filter((s) => s.status === 'closed')
  const d30 = Date.now() - 30 * 864e5
  const c30 = closed.filter((s) => +new Date(s.closed_at) >= d30)
  const hist = (sessions.data || []).filter((s) => (!hBiz || s.business_id === hBiz) && (!hf || (hf === 'short' ? Number(s.variance_kes) < 0 : hf === 'over' ? Number(s.variance_kes) > 0 : hf === 'balanced' ? s.status === 'closed' && Number(s.variance_kes) === 0 : s.status === hf)))
  return (
    <div>
      <PageHeader title="Cash Till" sub="Open with a float, take cash sales, count and close with a variance check"
        actions={open ? <>{can('cash_till', 'edit') && <Button variant="outline" onClick={() => setPayout(true)}><ArrowUpRight />Paid out</Button>}<Button variant="danger" onClick={() => setClosing(true)}><Lock />Count & close till</Button></> : <Button onClick={() => setOpening(true)}><LockOpen />Open till</Button>} />
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4 mb-5">
        <Kpi solid tone={open ? 'success' : 'neutral'} label="Till" value={open ? 1 : 0} format={() => (open ? 'Open' : 'Closed')} icon={open ? <LockOpen /> : <Lock />} foot={open ? `Since ${fmtDT(open.opened_at)}` : 'Open one to take cash'} />
        <Kpi solid tone="brand" label="Opening float" value={Number(open?.opening_float_kes || 0)} format={kes} />
        <Kpi solid tone="info" label="Cash sales" value={cashIn} format={kes} foot={`${cash.data?.length || 0} payments`} />
        <Kpi solid tone="warning" label="Paid out" value={paidOut} format={kes} foot={`${(open?.payouts || []).length} payouts`} icon={<ArrowUpRight />} />
        <Kpi solid tone="violet" label="Expected in drawer" value={expected} format={kes} icon={<Wallet />} />
        <Kpi solid tone={sum(c30, 'variance_kes') < 0 ? 'danger' : 'success'} label="Net variance (30 days)" value={sum(c30, 'variance_kes')} format={kes} foot={`${c30.length} closes · ${c30.filter((s) => Number(s.variance_kes) !== 0).length} off`} icon={<Scale />} />
      </div>
      {open && <Card className="mb-4" title="Cash taken this session" action={<Button size="sm" variant="ghost" onClick={() => tillReport(open, 'X', expected)}><FileDown />X report</Button>}>
        <DataTable rows={cash.data} loading={cash.isLoading} cols={[{ key: 'paid_at', label: 'Time', render: (r) => fmtDT(r.paid_at) }, { key: 'invoices.number', label: 'Invoice' }, { key: 'reference', label: 'Reference', hideBelow: 'md' }, { key: 'amount_kes', label: 'Amount', align: 'right', render: (r) => kes(r.amount_kes) }]} />
      </Card>}
      {open && (open.payouts || []).length > 0 && <Card className="mb-4" title="Paid out of the drawer" sub="Also logged as expenses">
        <ul className="divide-y divide-border/60 text-[13px]">{(open.payouts || []).map((p: Row, i: number) => <li key={i} className="flex justify-between gap-3 py-2"><span>{p.reason}<span className="text-muted-foreground"> · {p.by} · {fmtDT(p.at)}</span></span><span className="num font-medium text-danger">-{kes(p.amount_kes)}</span></li>)}</ul>
      </Card>}
      <Card title="Till history" pad={false}><div className="p-4">
        <DataTable rows={hist} loading={sessions.isLoading} exportName="till-sessions" initialSort={['opened_at', 'desc']} searchKeys={['staff.full_name', 'notes', 'businesses.name']}
          filters={<>
            <Select size="sm" value={hf} onChange={setHf} allowClear="All sessions" options={[{ value: 'open', label: 'Open' }, { value: 'closed', label: 'Closed' }, { value: 'balanced', label: 'Balanced' }, { value: 'short', label: 'Short' }, { value: 'over', label: 'Over' }]} />
            <Select size="sm" value={hBiz} onChange={setHBiz} allowClear="All businesses" options={businesses.map((b) => ({ value: b.id, label: b.name }))} />
          </>} onClearFilters={() => { setHf(''); setHBiz('') }}
          cols={[{ key: 'opened_at', label: 'Opened', sort: true, render: (r) => fmtDT(r.opened_at) }, { key: 'staff.full_name', label: 'By', hideBelow: 'md' }, { key: 'businesses.name', label: 'Business', hideBelow: 'lg' },
            { key: 'paid_out_kes', label: 'Paid out', align: 'right', hideBelow: 'lg', render: (r) => Number(r.paid_out_kes) ? kes(r.paid_out_kes) : '—' }, { key: 'closed_at', label: 'Closed', hideBelow: 'sm', render: (r) => fmtDT(r.closed_at) },
            { key: 'opening_float_kes', label: 'Float', align: 'right', hideBelow: 'md', render: (r) => kes(r.opening_float_kes) }, { key: 'expected_kes', label: 'Expected', align: 'right', render: (r) => kes(r.expected_kes) }, { key: 'counted_kes', label: 'Counted', align: 'right', render: (r) => kes(r.counted_kes) },
            { key: 'variance_kes', label: 'Variance', align: 'right', render: (r) => r.status === 'open' ? <Badge tone="success" dot>Open</Badge> : <span className={cn('font-medium num', Number(r.variance_kes) < 0 ? 'text-danger' : Number(r.variance_kes) > 0 ? 'text-warning' : 'text-success')}>{kes(r.variance_kes)}</span> },
            { key: 'z', label: '', align: 'right', render: (r) => r.status === 'closed' && <Button size="sm" variant="ghost" onClick={() => tillReport(r, 'Z')}><FileDown />Z report</Button> }]} />
      </div></Card>
      {opening && <OpenTill onClose={() => setOpening(false)} />}
      {closing && open && <CloseTill session={open} expected={expected} onClose={() => setClosing(false)} />}
      {payout && open && <PayOut session={open} available={expected} onClose={() => setPayout(false)} />}
    </div>
  )
}

function OpenTill({ onClose }: { onClose: () => void }) {
  const { options } = useStaffOptions()
  const { businesses } = useBiz()
  const last = useList('till_sessions', { select: 'closed_at,counted_kes,variance_kes', filter: (b) => b.eq('status', 'closed'), order: ['closed_at'], limit: 1 })
  const [float, setFloat] = useState('5000'); const [by, setBy] = useState(''); const [busy, setBusy] = useState(false)
  const [biz, setBiz] = useState(businesses.find((b) => b.is_primary)?.id || '')
  const lc = last.data?.[0]
  return (
    <Dialog open onOpenChange={(v) => !v && onClose()} size="sm" title="Open the till"
      footer={<><Button variant="outline" onClick={onClose}>Cancel</Button><Button loading={busy} onClick={async () => { setBusy(true); try { const s = await insert('till_sessions', { opened_by: by || null, business_id: biz || null, opened_at: new Date().toISOString(), opening_float_kes: Number(float || 0), status: 'open' }); await logActivity(`Opened the till with a ${kes(float)} float`, 'till_opened', 'till_session', s.id); toast.success('Till open'); onClose() } catch (e: any) { toast.error(e.message) } finally { setBusy(false) } }}>Open till</Button></>}>
      <div className="grid gap-4"><Field label="Opening float (KES)"><Input type="number" value={float} onChange={(e) => setFloat(e.target.value)} /></Field><Field label="Opened by"><Select value={by} onChange={setBy} options={options} placeholder="Staff" /></Field><Field label="Business"><Select value={biz} onChange={setBiz} options={businesses.map((b) => ({ value: b.id, label: b.name }))} /></Field>
        {lc && <div className="rounded-[12px] bg-foreground/[.035] p-3 text-[12.5px]">Last close {fmtDate(lc.closed_at, 'd MMM, HH:mm')}: counted <b className="num">{kes(lc.counted_kes)}</b>, variance <b className={cn('num', Number(lc.variance_kes) < 0 ? 'text-danger' : '')}>{kes(lc.variance_kes)}</b></div>}</div>
    </Dialog>
  )
}

function CloseTill({ session, expected, onClose }: { session: Row; expected: number; onClose: () => void }) {
  const [count, setCount] = useState<Record<number, string>>({}); const [notes, setNotes] = useState(''); const [busy, setBusy] = useState(false)
  const counted = DENOMS.reduce((s, d) => s + d * Number(count[d] || 0), 0), variance = counted - expected
  return (
    <Dialog open onOpenChange={(v) => !v && onClose()} size="md" title="Count and close" description={`Expected in drawer: ${kes(expected)}`}
      footer={<><Button variant="outline" onClick={onClose}>Cancel</Button><Button variant="danger" loading={busy} onClick={async () => {
        setBusy(true)
        try { await update('till_sessions', session.id, { status: 'closed', closed_at: new Date().toISOString(), counted_kes: counted, expected_kes: expected, variance_kes: variance, notes: notes || null }); await logActivity(`Closed the till. Counted ${kes(counted)}, variance ${kes(variance)}`, 'till_closed', 'till_session', session.id, { variance }); toast.success(variance === 0 ? 'Balanced to the shilling' : `Closed with variance ${kes(variance)}`); onClose() }
        catch (e: any) { toast.error(e.message) } finally { setBusy(false) }
      }}>Close till</Button></>}>
      <div className="grid grid-cols-3 gap-3">{DENOMS.map((d) => <Field key={d} label={`KES ${d.toLocaleString('en-KE')}`}><Input type="number" min={0} value={count[d] || ''} onChange={(e) => setCount((c) => ({ ...c, [d]: e.target.value }))} placeholder="0" /></Field>)}</div>
      <div className="grid grid-cols-3 gap-3 mt-4">
        {[['Expected', expected, ''], ['Counted', counted, ''], ['Variance', variance, variance < 0 ? 'text-danger' : variance > 0 ? 'text-warning' : 'text-success']].map(([k, v, c]) => <div key={k as string} className="rounded-[14px] bg-foreground/[.035] px-3 py-2.5"><div className="text-[12px] text-muted-foreground">{k}</div><div className={cn('font-semibold num', c as string)}>{kes(v)}</div></div>)}
      </div>
      <Field label="Notes" className="mt-4"><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Explain any variance" /></Field>
    </Dialog>
  )
}
function PayOut({ session, available, onClose }: { session: Row; available: number; onClose: () => void }) {
  const [amt, setAmt] = useState(''); const [reason, setReason] = useState(''); const [cat, setCat] = useState('transport'); const [busy, setBusy] = useState(false)
  const n = Number(amt || 0)
  return (
    <Dialog open onOpenChange={(v) => !v && onClose()} size="sm" title="Paid out of the till" description={`Cash in drawer now: ${kes(available)}`}
      footer={<><Button variant="outline" onClick={onClose}>Cancel</Button><Button loading={busy} disabled={!(n > 0) || n > available || !reason.trim()} onClick={async () => {
        setBusy(true)
        try {
          const payouts = [...(session.payouts || []), { amount_kes: n, reason, category: cat, by: currentActor, at: new Date().toISOString() }]
          await update('till_sessions', session.id, { payouts, paid_out_kes: Number(session.paid_out_kes || 0) + n })
          await insert('expenses', { description: reason, amount_kes: n, category: cat, method: 'cash', status: 'paid', source: 'till', recorded_by: currentActor, business_id: session.business_id || null, paid_at: new Date().toISOString().slice(0, 10) })
          await logActivity(`Paid out ${kes(n)} from the till: ${reason}`, 'till_paid_out', 'till_session', session.id)
          toast.success('Paid out and logged as an expense'); onClose()
        } catch (e: any) { toast.error(e.message) } finally { setBusy(false) }
      }}>Pay out {kes(n)}</Button></>}>
      <div className="grid gap-4">
        <Field label="Amount (KES)"><Input type="number" value={amt} onChange={(e) => setAmt(e.target.value)} /></Field>
        <Field label="What for"><Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Boda to client site, printer paper" /></Field>
        <Field label="Expense category"><Select value={cat} onChange={setCat} options={['transport', 'office', 'utilities', 'marketing', 'other'].map((c) => ({ value: c, label: c[0].toUpperCase() + c.slice(1) }))} /></Field>
      </div>
    </Dialog>
  )
}
