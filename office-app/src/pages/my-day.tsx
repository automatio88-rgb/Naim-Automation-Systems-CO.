import { useState } from 'react'
import { isSameDay } from 'date-fns'
import { CalendarCheck, CheckCircle2, Circle, Clock, ListChecks, Video } from 'lucide-react'
import { toast } from 'sonner'
import { useList, update, logActivity, type Row } from '@/services/db'
import { useAuth } from '@/lib/auth'
import { cn, fmtDate, fmtTime, humanize, kes, sum } from '@/lib/utils'
import { APPT_STATUS, TASK_PRIORITY } from '@/lib/status'
import { Badge, Button, Card, Empty, Kpi, PageHeader, Select, StatusBadge } from '@/components/ui'
import { Appointment360, useStaffOptions } from '@/components/shared'

export default function MyDay() {
  const { profile } = useAuth()
  const { staff, options } = useStaffOptions()
  const mine = staff.find((s: Row) => s.profile_id === profile?.id)
  const [who, setWho] = useState<string>('')
  const sid = who || mine?.id || ''
  const from = new Date(); from.setHours(0, 0, 0, 0)
  const to = new Date(); to.setHours(23, 59, 59, 999)
  const appts = useList('appointments', { select: '*, clients(business_name), leads(business_name)', filter: (b) => { let q = b.gte('starts_at', from.toISOString()).lte('starts_at', to.toISOString()).is('deleted_at', null); if (sid) q = q.eq('staff_id', sid); return q }, order: ['starts_at', true], key: [sid] })
  const tasks = useList('tasks', { filter: (b) => { let q = b.is('deleted_at', null).neq('status', 'done'); if (sid) q = q.eq('assignee_id', sid); return q }, order: ['due_at', true], key: [sid] })
  const [open, setOpen] = useState<string | null>(null)
  const A = appts.data || [], T = tasks.data || []
  const now = Date.now()
  const next = A.find((a) => new Date(a.ends_at || a.starts_at).getTime() > now && !['completed', 'cancelled', 'no_show'].includes(a.status))
  const dueToday = T.filter((t) => t.due_at && (isSameDay(new Date(t.due_at), new Date()) || new Date(t.due_at) < new Date()))
  return (
    <div>
      <PageHeader title="My Day" sub={fmtDate(new Date(), 'EEEE, d MMMM')}
        actions={<Select className="w-[220px]" value={sid} onChange={setWho} options={options} placeholder="Everyone" allowClear="Everyone" />} />
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
      <Appointment360 id={open} onOpenChange={(v) => !v && setOpen(null)} />
    </div>
  )
}