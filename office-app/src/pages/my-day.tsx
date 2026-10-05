import { useState } from 'react'
import { isSameDay } from 'date-fns'
import { useNavigate } from 'react-router-dom'
import { CalendarCheck, CheckCircle2, Circle, CircleDollarSign, Clock, Flame, Gauge, HandCoins, HeartHandshake, ListChecks, Send, Video } from 'lucide-react'
import { toast } from 'sonner'
import { useList, update, logActivity, type Row } from '@/services/db'
import { useAuth } from '@/lib/auth'
import { cn, fmtDate, fmtTime, humanize, kes, sum } from '@/lib/utils'
import { APPT_STATUS, TASK_PRIORITY } from '@/lib/status'
import { Avatar, Badge, Button, Card, Empty, Input, Kpi, PageHeader, Progress, Select, StatusBadge } from '@/components/ui'
import { Appointment360, useStaffOptions } from '@/components/shared'

export default function MyDay() {
  const { profile } = useAuth()
  const { staff, options } = useStaffOptions()
  const mine = staff.find((s: Row) => s.profile_id === profile?.id)
  const [who, setWho] = useState<string>('')
  const sid = who || mine?.id || ''
  const todayStr = new Date().toISOString().slice(0, 10)
  const [date, setDate] = useState(todayStr)
  const from = new Date(date + 'T00:00:00')
  const to = new Date(date + 'T23:59:59.999')
  const monthStart = new Date(from.getFullYear(), from.getMonth(), 1)
  const me = useList('staff', { select: 'id,full_name,title,color,leave_balance,commission_target_kes,commission_pct,hired_at,departments(name)', filter: (b) => b.eq('id', sid), enabled: !!sid, key: [sid, date] })
  const shift = useList('shifts', { select: 'start_time,end_time,role', filter: (b) => b.eq('staff_id', sid).eq('day', date), enabled: !!sid, key: [sid, date] })
  const att = useList('attendance', { select: 'status,check_in,check_out', filter: (b) => b.eq('staff_id', sid).eq('day', date), enabled: !!sid, key: [sid, date] })
  const comm = useList('commissions', { select: 'amount_kes,created_at', filter: (b) => b.eq('staff_id', sid).gte('created_at', monthStart.toISOString()), enabled: !!sid, key: [sid, monthStart.toISOString()], limit: 5000 })
  const tipsQ = useList('invoices', { select: 'tip_kes,issued_at', filter: (b) => b.eq('staff_id', sid).gte('issued_at', monthStart.toISOString()).is('deleted_at', null), enabled: !!sid, key: [sid, monthStart.toISOString()], limit: 5000 })
  const appts = useList('appointments', { select: '*, clients(business_name), leads(business_name)', filter: (b) => { let q = b.gte('starts_at', from.toISOString()).lte('starts_at', to.toISOString()).is('deleted_at', null); if (sid) q = q.eq('staff_id', sid); return q }, order: ['starts_at', true], key: [sid] })
  const tasks = useList('tasks', { filter: (b) => { let q = b.is('deleted_at', null).neq('status', 'done'); if (sid) q = q.eq('assignee_id', sid); return q }, order: ['due_at', true], key: [sid] })
  const [open, setOpen] = useState<string | null>(null)
  const nav = useNavigate()
  const drafts = useList('outreach_messages', { select: 'id', filter: (b) => b.eq('status', 'queued'), limit: 1000 })
  const hot = useList('replies', { select: 'id,body,received_at,lead_id,leads(business_name)', filter: (b) => b.eq('intent', 'interested').gte('received_at', new Date(Date.now() - 2 * 864e5).toISOString()), order: ['received_at'], limit: 5 })
  const owed = useList('v_receivables_ageing', { select: 'id,number,business_name,outstanding_kes,bucket', filter: (b) => b.neq('bucket', 'current'), order: ['outstanding_kes'], limit: 4 })
  const A = appts.data || [], T = tasks.data || []
  const now = Date.now()
  const next = A.find((a) => new Date(a.ends_at || a.starts_at).getTime() > now && !['completed', 'cancelled', 'no_show'].includes(a.status))
  const P = me.data?.[0], SH = shift.data?.[0], AT = att.data?.[0]
  const hm = (t: unknown) => { const x = String(t || '00:00'); return Number(x.slice(0, 2)) * 60 + Number(x.slice(3, 5)) }
  const shiftMin = SH ? hm(SH.end_time) - hm(SH.start_time) : 0
  const bookedMin = A.filter((a) => a.status !== 'cancelled').reduce((t, a) => t + Math.max(0, (+new Date(a.ends_at || a.starts_at) - +new Date(a.starts_at)) / 6e4), 0)
  const util = shiftMin ? Math.min(100, Math.round((bookedMin / shiftMin) * 100)) : 0
  const commMtd = sum(comm.data, 'amount_kes'), tipsMtd = sum(tipsQ.data, 'tip_kes'), target = Number(P?.commission_target_kes || 0)
  const dueToday = T.filter((t) => t.due_at && (isSameDay(new Date(t.due_at), new Date()) || new Date(t.due_at) < new Date()))
  return (
    <div>
      <PageHeader title="My Day"
        sub={fmtDate(from, 'EEEE, d MMMM')}
        actions={<div className="flex flex-wrap items-center gap-2"><Input type="date" className="w-[150px]" value={date} onChange={(e) => e.target.value && setDate(e.target.value)} />
          <span className="text-[12.5px] text-muted-foreground hidden sm:inline">Whose day?</span><Select className="w-[220px]" value={sid} onChange={setWho} options={options} placeholder="Everyone" allowClear="Everyone" /></div>} />
      {P && (
        <Card className="mb-5" pad>
          <div className="grid lg:grid-cols-[minmax(0,1.1fr)_minmax(0,2fr)] gap-5 items-center">
            <div className="flex items-center gap-4 min-w-0">
              <Avatar name={P.full_name} size={56} />
              <div className="min-w-0">
                <div className="font-semibold text-[17px] truncate">{P.full_name}</div>
                <div className="text-[13px] text-muted-foreground truncate">{P.title}{P.departments?.name ? ` · ${P.departments.name}` : ''}</div>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  <Badge tone={SH ? 'info' : 'neutral'}>{SH ? `Shift ${String(SH.start_time).slice(0, 5)}–${String(SH.end_time).slice(0, 5)}` : 'No shift'}</Badge>
                  <Badge tone={AT ? (AT.status === 'present' ? 'success' : AT.status === 'late' ? 'warning' : AT.status === 'absent' ? 'danger' : 'violet') : 'neutral'} dot>{AT ? `${humanize(AT.status)}${AT.check_in ? ` · in ${String(AT.check_in).slice(0, 5)}` : ''}` : 'Not checked in'}</Badge>
                  <Badge tone="violet">{Number(P.leave_balance ?? 0)} leave days left</Badge>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {([['Utilisation', `${util}%`, <Gauge />, `${Math.round(bookedMin / 60 * 10) / 10} of ${Math.round(shiftMin / 60 * 10) / 10} h booked`],
                ['Commission MTD', kes(commMtd), <HandCoins />, `${Number(P.commission_pct || 0)}% rate`],
                ['Tips MTD', kes(tipsMtd), <HeartHandshake />, 'Pass-through'],
                ['Target', target ? `${Math.round((commMtd / target) * 100)}%` : '—', <CircleDollarSign />, target ? `of ${kes(target)}` : 'No target set']] as const).map(([k, v, ic, f]) => (
                <div key={k} className="rounded-[14px] bg-foreground/[.035] px-3 py-2.5 min-w-0">
                  <div className="flex items-center gap-1.5 text-[11.5px] text-muted-foreground [&_svg]:size-3.5">{ic}{k}</div>
                  <div className="font-semibold num text-[16px] mt-0.5 truncate">{v}</div>
                  <div className="text-[11px] text-muted-foreground truncate">{f}</div>
                </div>))}
              {target > 0 && <div className="col-span-2 sm:col-span-4"><div className="flex justify-between text-[11.5px] text-muted-foreground mb-1"><span>Commission target this month</span><span className="num">{kes(commMtd)} / {kes(target)}</span></div><Progress value={Math.min(100, (commMtd / target) * 100)} /></div>}
            </div>
          </div>
        </Card>
      )}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-5">
        <Kpi tone="brand" label="Appointments" value={A.length} icon={<CalendarCheck />} />
        <Kpi tone="success" label="Completed" value={A.filter((a) => a.status === 'completed').length} icon={<CheckCircle2 />} />
        <Kpi tone="warning" label="Tasks due" value={dueToday.length} icon={<ListChecks />} />
        <Kpi tone="info" label="Booked value" value={sum(A, (a) => sum(a.services || [], 'price_kes'))} format={(n) => kes(n)} />
      </div>
      {next && (
        <div className="rounded-panel rail-surface grain relative text-rail-foreground p-6 mb-5 overflow-hidden" data-reveal>
          <div className="text-[13px] text-rail-muted">Up next · {fmtTime(next.starts_at)}</div>
          <div className="font-display text-[26px] font-semibold mt-1">{next.clients?.business_name || next.leads?.business_name || next.title}</div>
          <div className="text-rail-muted text-[14px] mt-1">{humanize(next.type)}{next.location ? ` · ${next.location}` : ''}</div>
          <div className="flex gap-2 mt-4">
            {next.meet_link && <Button onClick={() => window.open(next.meet_link, '_blank')}><Video />Join call</Button>}
            <Button variant="outline" className="bg-transparent text-rail-foreground border-white/20 hover:bg-white/10" onClick={() => setOpen(next.id)}>Open</Button>
          </div>
        </div>
      )}
      <div className="grid lg:grid-cols-2 gap-4">
        <Card title="Schedule" sub={`${A.length} today`}>
          {A.length ? <ol className="relative ml-3 border-l border-border pl-5 space-y-4">{A.map((a) => {
            const past = new Date(a.ends_at || a.starts_at).getTime() < now
            return (
              <li key={a.id} className="relative">
                <span className={cn('absolute -left-[27px] top-1.5 size-3 rounded-full border-2 border-card', past ? 'bg-foreground/30' : 'bg-primary')} />
                <button className="w-full text-left rounded-[14px] bg-foreground/[.035] hover:bg-foreground/[.06] px-3.5 py-3 transition-colors" onClick={() => setOpen(a.id)}>
                  <div className="flex items-center gap-2"><span className="num font-semibold text-[13px]">{fmtTime(a.starts_at)}</span><StatusBadge map={APPT_STATUS} value={a.status} /></div>
                  <div className="font-medium mt-1">{a.clients?.business_name || a.leads?.business_name || a.title}</div>
                  <div className="text-[12.5px] text-muted-foreground">{(a.services || []).map((s: Row) => s.name).join(', ') || humanize(a.type)}</div>
                </button>
              </li>)
          })}</ol> : <Empty title="A clear calendar" body="No appointments today." icon={<Clock />} />}
        </Card>
        <Card title="Tasks" sub={`${T.length} open`}>
          {T.length ? <ul className="divide-y divide-border/60">{T.slice(0, 15).map((t) => {
            const late = t.due_at && new Date(t.due_at) < new Date()
            return (
              <li key={t.id} className="flex items-start gap-3 py-2.5">
                <button aria-label="Complete" className="mt-0.5 text-muted-foreground hover:text-success" onClick={async () => { await update('tasks', t.id, { status: 'done', completed_at: new Date().toISOString() }); await logActivity(`Completed task: ${t.title}`, 'task_done', 'task', t.id); toast.success('Done') }}><Circle className="size-5" /></button>
                <div className="min-w-0 flex-1"><div className="text-[13.5px] font-medium">{t.title}</div><div className={cn('text-[12px]', late ? 'text-danger' : 'text-muted-foreground')}>{t.due_at ? `Due ${fmtDate(t.due_at, 'd MMM, HH:mm')}` : 'No due date'}{t.created_by_kind === 'hermes' ? ' · from Hermes' : ''}</div></div>
                <Badge tone={TASK_PRIORITY[t.priority]}>{humanize(t.priority)}</Badge>
              </li>)
          })}</ul> : <Empty title="No open tasks" />}
        </Card>
      </div>
      <Card className="mt-4" title="Needs you" sub="What Hermes and the books are waiting on">
        <div className="grid md:grid-cols-3 gap-3">
          <button onClick={() => nav('/leads')} className="text-left rounded-[14px] bg-foreground/[.035] hover:bg-foreground/[.06] p-4 transition-colors">
            <div className="flex items-center gap-2 text-[13px] text-muted-foreground"><Send className="size-4" />Outreach drafts</div>
            <div className="font-display text-[28px] font-semibold num mt-1">{drafts.data?.length || 0}</div>
            <div className="text-[12.5px] text-muted-foreground">{drafts.data?.length ? 'Waiting for your approval in Lead Engine' : 'Nothing waiting'}</div>
          </button>
          <div className="rounded-[14px] bg-foreground/[.035] p-4">
            <div className="flex items-center gap-2 text-[13px] text-muted-foreground"><Flame className="size-4" />Hot replies (48h)</div>
            {hot.data?.length ? <ul className="mt-2 space-y-1.5">{hot.data.map((r) => <li key={r.id} className="text-[13px]"><span className="font-medium">{r.leads?.business_name}</span><span className="text-muted-foreground line-clamp-1">{r.body}</span></li>)}</ul> : <div className="text-[12.5px] text-muted-foreground mt-2">No interested replies yet. Echo files them here as they land.</div>}
          </div>
          <button onClick={() => nav('/invoices')} className="text-left rounded-[14px] bg-foreground/[.035] hover:bg-foreground/[.06] p-4 transition-colors">
            <div className="flex items-center gap-2 text-[13px] text-muted-foreground"><CircleDollarSign className="size-4" />Money to chase</div>
            {owed.data?.length ? <ul className="mt-2 space-y-1.5">{owed.data.map((o) => <li key={o.id} className="flex justify-between gap-2 text-[13px]"><span className="truncate">{o.business_name}</span><span className="num font-medium text-danger">{kes(o.outstanding_kes)}</span></li>)}</ul> : <div className="text-[12.5px] text-muted-foreground mt-2">Nothing overdue.</div>}
          </button>
        </div>
      </Card>
      <Appointment360 id={open} onOpenChange={(v) => !v && setOpen(null)} />
    </div>
  )
}