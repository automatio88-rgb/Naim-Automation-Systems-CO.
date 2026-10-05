import { useState } from 'react'
import { toast } from 'sonner'
import { CalendarOff, Check, Clock, PlaneTakeoff, Plus, Stethoscope, X } from 'lucide-react'
import { useList, update, remove, logActivity, invalidate, type Row } from '@/services/db'
import { useAuth } from '@/lib/auth'
import { cn, fmtDate, humanize, isoDay, sum } from '@/lib/utils'
import { Avatar, Badge, Button, Card, ChevronFilter, Dialog, Field, Kpi, PageHeader, Select, Textarea } from '@/components/ui'
import { DataTable } from '@/components/data-table'
import { RecordForm } from '@/components/form'
import { useStaffOptions } from '@/components/shared'

const TYPES = ['annual', 'sick', 'compassionate', 'maternity', 'paternity', 'unpaid']
const TONE: Record<string, any> = { pending: 'warning', approved: 'success', rejected: 'danger' }
const TYPE_TONE: Record<string, any> = { annual: 'info', sick: 'danger', compassionate: 'violet', maternity: 'teal', paternity: 'teal', unpaid: 'neutral' }
const spanDays = (a?: string, b?: string) => (a && b ? Math.max(1, Math.round((+new Date(b) - +new Date(a)) / 864e5) + 1) : 0)

export default function Leave() {
  const { can, profile } = useAuth()
  const L = useList('leave_requests', { select: '*, staff(full_name,leave_balance,color,title)', order: ['created_at'] })
  const staff = useList('staff', { select: 'id,full_name,title,leave_balance,color', filter: (b) => b.is('deleted_at', null).neq('status', 'inactive'), order: ['full_name', true] })
  const { options: staffOpts } = useStaffOptions()
  const [f, setF] = useState('all')
  const [fStaff, setFStaff] = useState('')
  const [fType, setFType] = useState('')
  const [edit, setEdit] = useState<Row | null | undefined>(undefined)
  const [decide, setDecide] = useState<{ l: Row; status: 'approved' | 'rejected' } | null>(null)
  const rows = L.data || []
  const today = isoDay()
  const y0 = `${new Date().getFullYear()}-01-01`
  const pending = rows.filter((r) => r.status === 'pending')
  const offToday = rows.filter((r) => r.status === 'approved' && r.from_date <= today && r.to_date >= today)
  const usedYtd = (sid: string, type?: string) => sum(rows.filter((r) => r.staff_id === sid && r.status === 'approved' && r.from_date >= y0 && (!type || r.type === type)), 'days')
  const view = rows.filter((r) => (f === 'all' || r.status === f) && (!fStaff || r.staff_id === fStaff) && (!fType || r.type === fType))
  const strip = Array.from({ length: 14 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() + i); const iso = isoDay(d); return { iso, d, who: rows.filter((r) => r.status !== 'rejected' && r.from_date <= iso && r.to_date >= iso) } })
  const canApprove = can('leave', 'approve')

  return (
    <div>
      <PageHeader title="Leave Requests" sub="Annual, sick and other leave: request, approve and see who is away"
        actions={can('leave', 'create') && <Button onClick={() => setEdit(null)}><Plus />Request leave</Button>} />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-5">
        <Kpi solid tone="warning" label="Awaiting approval" value={pending.length} foot={`${sum(pending, 'days')} days requested`} icon={<Clock />} onClick={() => setF('pending')} />
        <Kpi solid tone="violet" label="Away today" value={offToday.length} foot={offToday.map((r) => r.staff?.full_name?.split(' ')[0]).join(', ') || 'Everyone is in'} icon={<PlaneTakeoff />} />
        <Kpi solid tone="info" label="Annual days taken (YTD)" value={sum(rows.filter((r) => r.status === 'approved' && r.type === 'annual' && r.from_date >= y0), 'days')} icon={<CalendarOff />} />
        <Kpi solid tone="danger" label="Sick days (YTD)" value={sum(rows.filter((r) => r.status === 'approved' && r.type === 'sick' && r.from_date >= y0), 'days')} icon={<Stethoscope />} />
      </div>

      <Card className="mb-4" title="Next 14 days" sub="Approved and pending leave. Pending is outlined.">
        <div className="grid grid-cols-7 lg:grid-cols-14 gap-1.5">
          {strip.map((s) => (
            <div key={s.iso} className={cn('rounded-[12px] border border-border/60 p-2 min-h-[78px]', [0, 6].includes(s.d.getDay()) && 'bg-foreground/[.025]', s.iso === today && 'ring-2 ring-primary/50')}>
              <div className="text-[11px] text-muted-foreground">{fmtDate(s.d, 'EEE')}</div><div className="text-[13px] font-semibold num">{fmtDate(s.d, 'd MMM')}</div>
              <div className="flex flex-wrap gap-1 mt-1.5">{s.who.map((r) => <span key={r.id} title={`${r.staff?.full_name} · ${humanize(r.type)} · ${humanize(r.status)}`} className={cn('size-5 rounded-full grid place-items-center text-[9px] font-semibold text-white', r.status === 'pending' && 'ring-2 ring-warning ring-offset-1 ring-offset-card')} style={{ background: r.staff?.color || 'var(--p)' }}>{(r.staff?.full_name || '?').split(' ').map((x: string) => x[0]).slice(0, 2).join('')}</span>)}</div>
            </div>))}
        </div>
      </Card>

      <div className="grid xl:grid-cols-[1fr_320px] gap-4">
        <div className="min-w-0">
          <div className="mb-4"><ChevronFilter value={f} onChange={setF} items={[{ id: 'all', label: 'All', count: rows.length }, ...Object.keys(TONE).map((k) => ({ id: k, label: humanize(k), tone: TONE[k], count: rows.filter((r) => r.status === k).length }))]} /></div>
          <DataTable rows={view} loading={L.isLoading} searchKeys={['staff.full_name', 'reason', 'type']} exportName="leave-requests" initialSort={['from_date', 'desc']}
            importTable="leave_requests" importFields={['staff_id', 'type', 'from_date', 'to_date', 'days', 'reason']} importDefaults={{ status: 'pending' }} onImported={() => invalidate(['leave_requests'])}
            filters={<>
              <Select size="sm" value={fStaff} onChange={setFStaff} allowClear="All staff" options={staffOpts} />
              <Select size="sm" value={fType} onChange={setFType} allowClear="All leave types" options={TYPES.map((t) => ({ value: t, label: humanize(t) }))} />
            </>} onClearFilters={() => { setFStaff(''); setFType(''); setF('all') }}
            onEdit={can('leave', 'edit') ? (r) => setEdit(r) : undefined}
            onDelete={can('leave', 'delete') ? async (r) => { await remove('leave_requests', r.id) } : undefined}
            cols={[
              { key: 'staff.full_name', label: 'Staff', sort: true, render: (r) => <div className="flex items-center gap-2.5"><Avatar name={r.staff?.full_name} size={30} /><div><div className="font-medium">{r.staff?.full_name}</div><div className="text-[12px] text-muted-foreground">{r.staff?.title}</div></div></div> },
              { key: 'type', label: 'Type', render: (r) => <Badge tone={TYPE_TONE[r.type]}>{humanize(r.type)}</Badge> },
              { key: 'from_date', label: 'Dates', sort: true, render: (r) => <span className="num">{fmtDate(r.from_date, 'd MMM')} – {fmtDate(r.to_date, 'd MMM yyyy')}</span>, csv: (r) => `${r.from_date} to ${r.to_date}` },
              { key: 'days', label: 'Days', align: 'right', sort: true, render: (r) => <span className="num font-medium">{Number(r.days)}</span> },
              { key: 'balance', label: 'Balance', align: 'right', hideBelow: 'md', render: (r) => <span className="num">{Number(r.staff?.leave_balance ?? 0)}</span>, csv: (r) => r.staff?.leave_balance },
              { key: 'reason', label: 'Reason', hideBelow: 'lg', render: (r) => <span className="line-clamp-1 max-w-[220px]">{r.reason || '—'}</span> },
              { key: 'status', label: 'Status', render: (r) => <div><Badge tone={TONE[r.status]} dot>{humanize(r.status)}</Badge>{r.decided_at && <div className="text-[11px] text-muted-foreground mt-0.5">{fmtDate(r.decided_at, 'd MMM')}{r.decision_note ? ` · ${r.decision_note}` : ''}</div>}</div> },
              { key: 'act', label: '', align: 'right', render: (r) => r.status === 'pending' && canApprove && <div className="flex justify-end gap-1">
                <Button size="sm" variant="soft" onClick={(e) => { e.stopPropagation(); setDecide({ l: r, status: 'approved' }) }}><Check />Approve</Button>
                <Button size="sm" variant="ghost" className="text-danger" onClick={(e) => { e.stopPropagation(); setDecide({ l: r, status: 'rejected' }) }}><X />Reject</Button></div> },
            ]} />
        </div>
        <Card title="Leave balances" sub="Annual days left this year" className="h-max">
          <ul className="divide-y divide-border/60">{(staff.data || []).map((s) => (
            <li key={s.id} className="flex items-center gap-3 py-2.5">
              <Avatar name={s.full_name} size={30} />
              <div className="min-w-0 flex-1"><div className="text-[13.5px] font-medium truncate">{s.full_name}</div><div className="text-[12px] text-muted-foreground">{usedYtd(s.id, 'annual')} taken · {usedYtd(s.id, 'sick')} sick</div></div>
              <span className={cn('num font-semibold', Number(s.leave_balance) < 5 ? 'text-danger' : '')}>{Number(s.leave_balance)}</span>
            </li>))}</ul>
        </Card>
      </div>

      <RecordForm open={edit !== undefined} onOpenChange={(v) => !v && setEdit(undefined)} table="leave_requests" initial={edit} title={edit ? 'Edit leave request' : 'Request leave'}
        fields={[{ name: 'staff_id', label: 'Staff', type: 'select', options: staffOpts, required: true, span: 2 }, { name: 'type', label: 'Leave type', type: 'select', options: TYPES.map((v) => ({ value: v, label: humanize(v) })), required: true },
          { name: 'from_date', label: 'From', type: 'date', required: true }, { name: 'to_date', label: 'To', type: 'date', required: true }, { name: 'reason', label: 'Reason', type: 'textarea' }]}
        defaults={{ type: 'annual', status: 'pending', from_date: today, to_date: today }}
        transform={(v) => ({ ...v, days: spanDays(v.from_date, v.to_date) })}
        activity={(v, n) => `${n ? 'Requested' : 'Updated'} ${humanize(v.type).toLowerCase()} leave: ${v.days} day${v.days === 1 ? '' : 's'} from ${fmtDate(v.from_date, 'd MMM')}`}
        preview={(v) => {
          const s = (staff.data || []).find((x) => x.id === v.staff_id)
          const d = spanDays(v.from_date, v.to_date), bal = Number(s?.leave_balance ?? 0), after = v.type === 'annual' ? bal - d : bal
          const clash = rows.filter((r) => r.id !== v.id && r.status !== 'rejected' && r.staff_id !== v.staff_id && v.from_date && v.to_date && r.from_date <= v.to_date && r.to_date >= v.from_date)
          return (
            <div className="rounded-card bg-card border border-border/70 p-5 shadow-e1 space-y-3">
              <div className="flex items-center gap-3"><Avatar name={s?.full_name || '?'} size={38} /><div><div className="font-semibold">{s?.full_name || 'Choose a staff member'}</div><div className="text-[12.5px] text-muted-foreground">{s?.title || '—'}</div></div><Badge tone={TYPE_TONE[v.type]} className="ml-auto">{humanize(v.type)}</Badge></div>
              <div className="grid grid-cols-3 gap-2 text-center">
                {[['Days', d], ['Balance now', bal], ['After', after]].map(([k, x]) => <div key={k as string} className="rounded-[12px] bg-foreground/[.035] py-2"><div className="text-[11px] text-muted-foreground">{k}</div><div className={cn('text-[15px] font-semibold num', k === 'After' && Number(x) < 0 && 'text-danger')}>{x}</div></div>)}
              </div>
              <div className="text-[13px]">{fmtDate(v.from_date, 'EEE d MMM')} → {fmtDate(v.to_date, 'EEE d MMM yyyy')}</div>
              {after < 0 && <div className="text-[12.5px] text-danger">This is more annual leave than the balance allows.</div>}
              {clash.length > 0 && <div className="text-[12.5px] text-warning">Also away then: {clash.map((r) => r.staff?.full_name).join(', ')}</div>}
            </div>)
        }} />
      {decide && <Decide l={decide.l} status={decide.status} by={profile?.id} onClose={() => setDecide(null)} />}
    </div>
  )
}

function Decide({ l, status, by, onClose }: { l: Row; status: 'approved' | 'rejected'; by?: string; onClose: () => void }) {
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const bal = Number(l.staff?.leave_balance ?? 0)
  return (
    <Dialog open onOpenChange={(v) => !v && onClose()} size="sm" title={`${status === 'approved' ? 'Approve' : 'Reject'} leave`} description={`${l.staff?.full_name} · ${humanize(l.type)} · ${Number(l.days)} days, ${fmtDate(l.from_date, 'd MMM')} – ${fmtDate(l.to_date, 'd MMM')}`}
      footer={<><Button variant="outline" onClick={onClose}>Cancel</Button><Button variant={status === 'approved' ? 'success' : 'danger'} loading={busy} onClick={async () => {
        setBusy(true)
        try {
          await update('leave_requests', l.id, { status, decided_by: by || null, decided_at: new Date().toISOString(), decision_note: note || null })
          if (status === 'approved' && l.type === 'annual') await update('staff', l.staff_id, { leave_balance: bal - Number(l.days) })
          await logActivity(`${status === 'approved' ? 'Approved' : 'Rejected'} ${Number(l.days)} days ${humanize(l.type).toLowerCase()} leave for ${l.staff?.full_name}`, 'leave_' + status, 'leave_request', l.id)
          invalidate(['leave_requests', 'staff']); toast.success(status === 'approved' ? 'Approved' : 'Rejected'); onClose()
        } catch (e: any) { toast.error(e.message) } finally { setBusy(false) }
      }}>{status === 'approved' ? 'Approve' : 'Reject'}</Button></>}>
      {status === 'approved' && l.type === 'annual' && <p className="text-[13px] mb-3">Balance goes from <b className="num">{bal}</b> to <b className={cn('num', bal - Number(l.days) < 0 && 'text-danger')}>{bal - Number(l.days)}</b> days.</p>}
      <Field label="Note to the staff member"><Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder={status === 'approved' ? 'Optional' : 'Say why, and suggest other dates'} /></Field>
    </Dialog>
  )
}