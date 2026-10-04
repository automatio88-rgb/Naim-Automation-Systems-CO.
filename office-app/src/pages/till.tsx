import { useState } from 'react'
import { toast } from 'sonner'
import { Lock, LockOpen, Wallet } from 'lucide-react'
import { useList, insert, update, logActivity, type Row } from '@/services/db'
import { cn, fmtDT, kes, sum } from '@/lib/utils'
import { Badge, Button, Card, Dialog, Field, Input, Kpi, PageHeader, Select, Textarea } from '@/components/ui'
import { DataTable } from '@/components/data-table'
import { useStaffOptions } from '@/components/shared'

const DENOMS = [1000, 500, 200, 100, 50, 20, 10, 5, 1]

export default function Till() {
  const sessions = useList('till_sessions', { select: '*, staff:opened_by(full_name)', order: ['opened_at'], limit: 200 })
  const open = (sessions.data || []).find((s) => s.status === 'open')
  const cash = useList('payments', { select: 'amount_kes,paid_at,reference,invoices(number)', filter: (b) => b.eq('till_session_id', open?.id || '00000000-0000-0000-0000-000000000000'), key: [open?.id], limit: 1000 })
  const [opening, setOpening] = useState(false)
  const [closing, setClosing] = useState(false)
  const cashIn = sum(cash.data, 'amount_kes')
  const expected = Number(open?.opening_float_kes || 0) + cashIn
  return (
    <div>
      <PageHeader title="Cash Till" sub="Open with a float, take cash sales, count and close with a variance check"
        actions={open ? <Button variant="danger" onClick={() => setClosing(true)}><Lock />Count & close till</Button> : <Button onClick={() => setOpening(true)}><LockOpen />Open till</Button>} />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-5">
        <Kpi solid tone={open ? 'success' : 'neutral'} label="Till" value={open ? 1 : 0} format={() => (open ? 'Open' : 'Closed')} icon={open ? <LockOpen /> : <Lock />} foot={open ? `Since ${fmtDT(open.opened_at)}` : 'Open one to take cash'} />
        <Kpi solid tone="brand" label="Opening float" value={Number(open?.opening_float_kes || 0)} format={kes} />
        <Kpi solid tone="info" label="Cash sales" value={cashIn} format={kes} foot={`${cash.data?.length || 0} payments`} />
        <Kpi solid tone="violet" label="Expected in drawer" value={expected} format={kes} icon={<Wallet />} />
      </div>
      {open && <Card className="mb-4" title="Cash taken this session">
        <DataTable rows={cash.data} loading={cash.isLoading} cols={[{ key: 'paid_at', label: 'Time', render: (r) => fmtDT(r.paid_at) }, { key: 'invoices.number', label: 'Invoice' }, { key: 'amount_kes', label: 'Amount', align: 'right', render: (r) => kes(r.amount_kes) }]} />
      </Card>}
      <Card title="Till history" pad={false}><div className="p-4">
        <DataTable rows={sessions.data} loading={sessions.isLoading} exportName="till-sessions" initialSort={['opened_at', 'desc']}
          cols={[{ key: 'opened_at', label: 'Opened', sort: true, render: (r) => fmtDT(r.opened_at) }, { key: 'staff.full_name', label: 'By', hideBelow: 'md' }, { key: 'closed_at', label: 'Closed', hideBelow: 'sm', render: (r) => fmtDT(r.closed_at) },
            { key: 'opening_float_kes', label: 'Float', align: 'right', hideBelow: 'md', render: (r) => kes(r.opening_float_kes) }, { key: 'expected_kes', label: 'Expected', align: 'right', render: (r) => kes(r.expected_kes) }, { key: 'counted_kes', label: 'Counted', align: 'right', render: (r) => kes(r.counted_kes) },
            { key: 'variance_kes', label: 'Variance', align: 'right', render: (r) => r.status === 'open' ? <Badge tone="success" dot>Open</Badge> : <span className={cn('font-medium num', Number(r.variance_kes) < 0 ? 'text-danger' : Number(r.variance_kes) > 0 ? 'text-warning' : 'text-success')}>{kes(r.variance_kes)}</span> }]} />
      </div></Card>
      {opening && <OpenTill onClose={() => setOpening(false)} />}
      {closing && open && <CloseTill session={open} expected={expected} onClose={() => setClosing(false)} />}
    </div>
  )
}

function OpenTill({ onClose }: { onClose: () => void }) {
  const { options } = useStaffOptions()
  const [float, setFloat] = useState('5000'); const [by, setBy] = useState(''); const [busy, setBusy] = useState(false)
  return (
    <Dialog open onOpenChange={(v) => !v && onClose()} size="sm" title="Open the till"
      footer={<><Button variant="outline" onClick={onClose}>Cancel</Button><Button loading={busy} onClick={async () => { setBusy(true); try { const s = await insert('till_sessions', { opened_by: by || null, opened_at: new Date().toISOString(), opening_float_kes: Number(float || 0), status: 'open' }); await logActivity(`Opened the till with a ${kes(float)} float`, 'till_opened', 'till_session', s.id); toast.success('Till open'); onClose() } catch (e: any) { toast.error(e.message) } finally { setBusy(false) } }}>Open till</Button></>}>
      <div className="grid gap-4"><Field label="Opening float (KES)"><Input type="number" value={float} onChange={(e) => setFloat(e.target.value)} /></Field><Field label="Opened by"><Select value={by} onChange={setBy} options={options} placeholder="Staff" /></Field></div>
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