import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { addDays, format, isSameDay, startOfDay } from 'date-fns'
import { CalendarPlus, ChevronLeft, ChevronRight, Clock, ListOrdered, Plus, Zap } from 'lucide-react'
import { useList, insert, update, logActivity, type Row } from '@/services/db'
import { useAuth } from '@/lib/auth'
import { useBiz } from '@/lib/business'
import { cn, fmtDate, fmtDT, fmtTime, humanize, kes, sum, toLocalInput } from '@/lib/utils'
import { APPT_STATUS, opts } from '@/lib/status'
import { Badge, Button, Card, ChevronFilter, Dialog, Field, Input, Kpi, PageHeader, Select, StatusBadge, TabPanel, Tabs, Textarea, Checkbox, Empty } from '@/components/ui'
import { DataTable } from '@/components/data-table'
import { RecordForm } from '@/components/form'
import { Appointment360, useClientOptions, useStaffOptions } from '@/components/shared'

const TYPES = ['discovery_call', 'consultation', 'onboarding', 'review', 'support', 'walk_in', 'site_visit'].map((v) => ({ value: v, label: humanize(v) }))

export default function Appointments() {
  const [params, setParams] = useSearchParams()
  const { can } = useAuth()
  const { scope } = useBiz()
  const appts = useList('appointments', { select: '*, staff(full_name,color), clients(business_name,phone), leads(business_name)', filter: (b) => scope(b.is('deleted_at', null)), order: ['starts_at'], limit: 3000 })
  const [tab, setTab] = useState('list')
  const [open, setOpen] = useState<string | null>(null)
  const [booking, setBooking] = useState<Row | null | undefined>(params.get('new') ? null : undefined)
  const [walkIn, setWalkIn] = useState(false)
  const [status, setStatus] = useState('all')
  useEffect(() => { if (params.get('new')) { setBooking(null); params.delete('new'); setParams(params, { replace: true }) } }, [params]) // eslint-disable-line
  const rows = appts.data || []
  const today = rows.filter((a) => isSameDay(new Date(a.starts_at), new Date()))
  const who = (a: Row) => a.clients?.business_name || a.leads?.business_name || a.title
  const counts = useMemo(() => { const c: Row = {}; rows.forEach((r) => { c[r.status] = (c[r.status] || 0) + 1 }); return c }, [rows])
  return (
    <div>
      <PageHeader title="Appointments" sub="Discovery calls, consultations, client meetings and walk-ins"
        actions={can('appointments', 'create') && <><Button variant="outline" onClick={() => setWalkIn(true)}><Zap />Walk-in</Button><Button onClick={() => setBooking(null)}><CalendarPlus />New booking</Button></>} />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-5">
        <Kpi solid tone="brand" label="Today" value={today.length} icon={<CalendarPlus />} />
        <Kpi solid tone="info" label="Still to arrive" value={today.filter((a) => ['booked', 'confirmed'].includes(a.status)).length} icon={<Clock />} />
        <Kpi solid tone="violet" label="In session" value={today.filter((a) => ['checked_in', 'in_progress'].includes(a.status)).length} />
        <Kpi solid tone="danger" label="No-shows (30d)" value={rows.filter((a) => a.status === 'no_show' && Date.now() - +new Date(a.starts_at) < 30 * 864e5).length} />
      </div>
      <Tabs value={tab} onChange={setTab} items={[{ id: 'list', label: 'List' }, { id: 'calendar', label: 'Calendar' }, { id: 'queue', label: 'Queue', count: today.filter((a) => a.queue_no).length }, { id: 'waitlist', label: 'Waitlist' }]}>
        <TabPanel id="list">
          <div className="mb-4"><ChevronFilter value={status} onChange={setStatus} items={[{ id: 'all', label: 'All', count: rows.length }, ...Object.entries(APPT_STATUS).map(([id, s]) => ({ id, label: s.label, tone: s.tone, count: counts[id] || 0 }))]} /></div>
          <DataTable rows={rows.filter((r) => status === 'all' || r.status === status)} loading={appts.isLoading} onRow={(r) => setOpen(r.id)} searchKeys={['title', 'clients.business_name', 'leads.business_name', 'staff.full_name']} exportName="appointments" initialSort={['starts_at', 'desc']}
            cols={[
              { key: 'starts_at', label: 'When', sort: true, render: (a) => <div className="num"><div className="font-medium">{fmtDate(a.starts_at, 'EEE d MMM')}</div><div className="text-[12px] text-muted-foreground">{fmtTime(a.starts_at)}–{fmtTime(a.ends_at)}</div></div>, csv: (a) => a.starts_at },
              { key: 'who', label: 'Client / lead', sort: (a) => who(a), render: (a) => <div><div className="font-medium">{who(a)}</div><div className="text-[12px] text-muted-foreground">{humanize(a.type)}</div></div>, csv: who },
              { key: 'staff.full_name', label: 'With', hideBelow: 'md' },
              { key: 'source', label: 'Source', hideBelow: 'lg', render: (a) => humanize(a.source) },
              { key: 'status', label: 'Status', sort: true, render: (a) => <StatusBadge map={APPT_STATUS} value={a.status} /> },
              { key: 'value', label: 'Value', align: 'right', hideBelow: 'sm', render: (a) => kes(sum(a.services || [], 'price_kes')), csv: (a) => sum(a.services || [], 'price_kes') },
            ]} />
        </TabPanel>
        <TabPanel id="calendar"><DayCalendar rows={rows} onOpen={setOpen} onSlot={(d, staff) => setBooking({ starts_at: d.toISOString(), staff_id: staff })} /></TabPanel>
        <TabPanel id="queue"><Queue rows={today} onOpen={setOpen} /></TabPanel>
        <TabPanel id="waitlist"><Waitlist onBook={(w) => setBooking({ client_id: w.client_id, notes: w.notes, starts_at: w.preferred_at })} /></TabPanel>
      </Tabs>
      <Appointment360 id={open} onOpenChange={(v) => !v && setOpen(null)} onEdit={(a) => { setOpen(null); setBooking(a) }} />
      {booking !== undefined && <BookingDialog initial={booking} onClose={() => setBooking(undefined)} />}
      {walkIn && <BookingDialog walkIn initial={null} onClose={() => setWalkIn(false)} />}
    </div>
  )
}

export function BookingDialog({ initial, onClose, walkIn }: { initial: Row | null; onClose: () => void; walkIn?: boolean }) {
  const { options: clientOpts, clients } = useClientOptions()
  const { options: staffOpts } = useStaffOptions()
  const { businesses } = useBiz()
  const services = useList('services', { filter: (b) => b.eq('active', true).is('deleted_at', null), order: ['name', true] })
  const appts = useList('appointments', { select: 'queue_no,starts_at', filter: (b) => b.gte('starts_at', startOfDay(new Date()).toISOString()), limit: 500 })
  const now = new Date(); now.setMinutes(Math.ceil(now.getMinutes() / 15) * 15, 0, 0)
  const [v, setV] = useState<Row>(() => ({ type: walkIn ? 'walk_in' : 'consultation', status: walkIn ? 'checked_in' : 'booked', source: walkIn ? 'walk_in' : 'manual', ...initial,
    starts_at: toLocalInput(initial?.starts_at || (walkIn ? now : addDays(now, 1))), services: initial?.services || [] }))
  const [busy, setBusy] = useState(false)
  const set = (k: string, x: unknown) => setV((s) => ({ ...s, [k]: x }))
  const sel: Row[] = v.services || []
  const dur = sum(sel, 'duration_min') || 45
  const toggle = (s: Row) => set('services', sel.some((x) => x.id === s.id) ? sel.filter((x) => x.id !== s.id) : [...sel, { id: s.id, name: s.name, price_kes: Number(s.price_kes), duration_min: s.duration_min || 45 }])
  const client = clients.find((c) => c.id === v.client_id)
  async function save() {
    if (!v.client_id && !v.lead_id && !v.title) return toast.error('Choose a client or enter a title')
    setBusy(true)
    try {
      const start = new Date(v.starts_at), end = new Date(start.getTime() + dur * 6e4)
      const todays = (appts.data || []).filter((a) => isSameDay(new Date(a.starts_at), start)).map((a) => a.queue_no || 0)
      const row: Row = { client_id: v.client_id || null, lead_id: v.lead_id || null, staff_id: v.staff_id || null, title: v.title || `${humanize(v.type)}: ${client?.business_name || 'Client'}`, type: v.type,
        services: sel, starts_at: start.toISOString(), ends_at: end.toISOString(), meet_link: v.meet_link || null, location: v.location || null, status: v.status, source: v.source, notes: v.notes || null,
        business_id: v.business_id || businesses.find((b) => b.is_primary)?.id || null }
      if (!initial?.id) row.queue_no = Math.max(0, ...todays) + 1
      const r = initial?.id ? await update('appointments', initial.id, row) : await insert('appointments', row)
      await logActivity(`${initial?.id ? 'Rescheduled' : walkIn ? 'Walk-in checked in' : 'Booked'} ${row.title} for ${fmtDT(start)}`, walkIn ? 'walk_in' : 'appointment_booked', 'appointment', r?.id)
      toast.success(initial?.id ? 'Appointment updated' : walkIn ? `Walk-in added to queue #${row.queue_no}` : 'Booked'); onClose()
    } catch (e: any) { toast.error(e.message) } finally { setBusy(false) }
  }
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()} size="xl" title={initial?.id ? 'Edit appointment' : walkIn ? 'Walk-in' : 'New booking'}
      footer={<><Button variant="outline" onClick={onClose}>Cancel</Button><Button loading={busy} onClick={save}>{initial?.id ? 'Save' : walkIn ? 'Check in now' : 'Book'}</Button></>}>
      <div className="grid lg:grid-cols-[1fr_340px] gap-6">
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Client" className="sm:col-span-2"><Select value={v.client_id} onChange={(x) => set('client_id', x)} options={clientOpts} placeholder="Select client" /></Field>
          <Field label="Type"><Select value={v.type} onChange={(x) => set('type', x)} options={TYPES} /></Field>
          <Field label="With"><Select value={v.staff_id} onChange={(x) => set('staff_id', x)} options={staffOpts} placeholder="Assign staff" /></Field>
          <Field label="Date and time"><Input type="datetime-local" value={v.starts_at} onChange={(e) => set('starts_at', e.target.value)} /></Field>
          <Field label="Status"><Select value={v.status} onChange={(x) => set('status', x)} options={opts(APPT_STATUS)} /></Field>
          <Field label="Google Meet link"><Input value={v.meet_link || ''} onChange={(e) => set('meet_link', e.target.value)} placeholder="https://meet.google.com/..." /></Field>
          <Field label="Location"><Input value={v.location || ''} onChange={(e) => set('location', e.target.value)} placeholder="Office, client site, online" /></Field>
          <Field label="Services" className="sm:col-span-2">
            <div className="grid sm:grid-cols-2 gap-2 max-h-[220px] overflow-y-auto scroll-thin rounded-control border border-input p-2">
              {(services.data || []).map((s) => (
                <button key={s.id} type="button" onClick={() => toggle(s)} className={cn('flex items-center gap-2.5 rounded-[9px] px-2.5 py-2 text-left text-[13px] transition-colors', sel.some((x) => x.id === s.id) ? 'bg-primary/15' : 'hover:bg-foreground/[.04]')}>
                  <Checkbox checked={sel.some((x) => x.id === s.id)} onChange={() => toggle(s)} /><span className="flex-1 min-w-0 truncate">{s.name}</span><span className="num text-muted-foreground text-[12px]">{kes(s.price_kes)}</span>
                </button>))}
            </div>
          </Field>
          <Field label="Notes" className="sm:col-span-2"><Textarea value={v.notes || ''} onChange={(e) => set('notes', e.target.value)} /></Field>
        </div>
        <div className="hidden lg:block">
          <div className="rounded-panel bg-foreground/[.035] p-4 sticky top-0">
            <div className="text-[12px] font-medium text-muted-foreground mb-3">Live preview</div>
            <div className="rounded-card bg-card border border-border/70 p-4 shadow-e1">
              <div className="flex items-center gap-2"><StatusBadge map={APPT_STATUS} value={v.status} /><Badge>{humanize(v.type)}</Badge></div>
              <div className="font-semibold text-[16px] mt-3">{client?.business_name || 'Choose a client'}</div>
              <div className="text-[13px] text-muted-foreground mt-1">{v.starts_at ? `${fmtDate(v.starts_at, 'EEE d MMM')} · ${fmtTime(v.starts_at)}–${fmtTime(new Date(new Date(v.starts_at).getTime() + dur * 6e4))}` : '—'}</div>
              <div className="mt-4 space-y-1.5 text-[13px]">{sel.map((s) => <div key={s.id} className="flex justify-between gap-2"><span className="truncate">{s.name}</span><span className="num">{kes(s.price_kes)}</span></div>)}
                {!sel.length && <div className="text-muted-foreground">No services selected</div>}</div>
              <div className="flex justify-between border-t border-border/70 mt-3 pt-3 font-semibold"><span>Total</span><span className="num">{kes(sum(sel, 'price_kes'))}</span></div>
              <div className="text-[12px] text-muted-foreground mt-1">{dur} minutes</div>
            </div>
          </div>
        </div>
      </div>
    </Dialog>
  )
}

function DayCalendar({ rows, onOpen, onSlot }: { rows: Row[]; onOpen: (id: string) => void; onSlot: (d: Date, staff?: string) => void }) {
  const [day, setDay] = useState(startOfDay(new Date()))
  const { staff } = useStaffOptions()
  const H0 = 8, H1 = 19, PX = 64
  const list = rows.filter((a) => isSameDay(new Date(a.starts_at), day) && a.status !== 'cancelled')
  const cols = [...staff, { id: null, full_name: 'Unassigned', color: '#999' }].filter((s) => s.id || list.some((a) => !a.staff_id))
  return (
    <Card pad={false}>
      <div className="flex items-center gap-2 p-4 border-b border-border/70">
        <Button variant="outline" size="icon-sm" onClick={() => setDay(addDays(day, -1))} aria-label="Previous day"><ChevronLeft /></Button>
        <Button variant="outline" size="sm" onClick={() => setDay(startOfDay(new Date()))}>Today</Button>
        <Button variant="outline" size="icon-sm" onClick={() => setDay(addDays(day, 1))} aria-label="Next day"><ChevronRight /></Button>
        <div className="font-semibold ml-2">{format(day, 'EEEE, d MMMM')}</div><span className="text-muted-foreground text-[13px] ml-auto">{list.length} appointments</span>
      </div>
      <div className="overflow-auto scroll-thin max-h-[70vh]">
        <div className="grid min-w-max" style={{ gridTemplateColumns: `56px repeat(${cols.length}, minmax(180px, 1fr))` }}>
          <div className="sticky top-0 z-10 bg-card" />
          {cols.map((s) => <div key={s.id ?? 'u'} className="sticky top-0 z-10 bg-card border-b border-l border-border/70 px-3 py-2.5 text-[13px] font-medium flex items-center gap-2"><span className="size-2 rounded-full" style={{ background: s.color || 'var(--p)' }} />{s.full_name}</div>)}
          <div className="relative" style={{ height: (H1 - H0) * PX }}>
            {Array.from({ length: H1 - H0 }).map((_, i) => <div key={i} className="absolute right-2 text-[11px] text-muted-foreground num" style={{ top: i * PX - 7 }}>{String(H0 + i).padStart(2, '0')}:00</div>)}
          </div>
          {cols.map((s) => (
            <div key={s.id ?? 'u'} className="relative border-l border-border/70" style={{ height: (H1 - H0) * PX }}>
              {Array.from({ length: H1 - H0 }).map((_, i) => (
                <button key={i} aria-label="Book this slot" onClick={() => { const d = new Date(day); d.setHours(H0 + i, 0); onSlot(d, s.id || undefined) }}
                  className="absolute inset-x-0 border-t border-border/50 hover:bg-primary/[.06] transition-colors" style={{ top: i * PX, height: PX }} />))}
              {list.filter((a) => (a.staff_id || null) === s.id).map((a) => {
                const st = new Date(a.starts_at), en = new Date(a.ends_at || st.getTime() + 45 * 6e4)
                const top = ((st.getHours() + st.getMinutes() / 60) - H0) * PX, h = Math.max(28, ((en.getTime() - st.getTime()) / 36e5) * PX - 3)
                const tone = APPT_STATUS[a.status]?.tone || 'neutral'
                return (
                  <button key={a.id} onClick={() => onOpen(a.id)} className={cn('tone-' + tone, 'chip absolute left-1.5 right-1.5 rounded-[10px] px-2.5 py-1.5 text-left overflow-hidden hover:brightness-95 transition')} style={{ top, height: h }}>
                    <div className="text-[12.5px] font-semibold truncate">{a.clients?.business_name || a.leads?.business_name || a.title}</div>
                    <div className="text-[11px] opacity-80 num">{fmtTime(st)}–{fmtTime(en)} · {humanize(a.type)}</div>
                  </button>)
              })}
            </div>))}
        </div>
      </div>
    </Card>
  )
}

function Queue({ rows, onOpen }: { rows: Row[]; onOpen: (id: string) => void }) {
  const q = [...rows].filter((a) => !['cancelled'].includes(a.status)).sort((a, b) => (a.queue_no || 999) - (b.queue_no || 999))
  const lanes: [string, string[]][] = [['Waiting', ['booked', 'confirmed']], ['Checked in', ['checked_in']], ['In session', ['in_progress']], ['Done', ['completed', 'no_show']]]
  const next: Record<string, string> = { booked: 'checked_in', confirmed: 'checked_in', checked_in: 'in_progress', in_progress: 'completed' }
  if (!q.length) return <Empty title="Nobody in the queue today" icon={<ListOrdered />} />
  return (
    <div className="grid md:grid-cols-4 gap-3">
      {lanes.map(([label, sts]) => (
        <div key={label} className="rounded-panel bg-foreground/[.035] p-2.5">
          <div className="px-2 py-1.5 text-[13px] font-medium">{label} <span className="text-muted-foreground num">{q.filter((a) => sts.includes(a.status)).length}</span></div>
          <div className="space-y-2">{q.filter((a) => sts.includes(a.status)).map((a) => (
            <div key={a.id} className="rounded-card bg-card border border-border/70 p-3 shadow-e1" data-reveal>
              <button className="w-full text-left" onClick={() => onOpen(a.id)}>
                <div className="flex items-center gap-2"><span className="size-7 rounded-full bg-foreground text-background grid place-items-center text-[12px] font-semibold num">{a.queue_no || '–'}</span><span className="font-medium text-[13.5px] truncate">{a.clients?.business_name || a.leads?.business_name || a.title}</span></div>
                <div className="text-[12px] text-muted-foreground mt-1.5">{fmtTime(a.starts_at)} · {a.staff?.full_name || 'Unassigned'}</div>
              </button>
              {next[a.status] && <Button size="sm" variant="soft" className="mt-2 w-full" onClick={async () => { await update('appointments', a.id, { status: next[a.status] }); await logActivity(`${a.title}: ${humanize(next[a.status]).toLowerCase()}`, 'appointment_' + next[a.status], 'appointment', a.id) }}>{humanize(next[a.status])}</Button>}
            </div>))}</div>
        </div>))}
    </div>
  )
}

function Waitlist({ onBook }: { onBook: (w: Row) => void }) {
  const w = useList('waitlist', { select: '*, clients(business_name), services(name)', order: ['created_at'] })
  const { options: clientOpts } = useClientOptions()
  const svc = useList('services', { select: 'id,name', filter: (b) => b.eq('active', true) })
  const [add, setAdd] = useState(false)
  return (
    <div>
      <div className="flex justify-end mb-3"><Button onClick={() => setAdd(true)}><Plus />Add to waitlist</Button></div>
      <DataTable rows={w.data} loading={w.isLoading} empty={<Empty title="Waitlist is empty" />}
        cols={[
          { key: 'name', label: 'Client', render: (r) => <div><div className="font-medium">{r.clients?.business_name || r.client_name}</div><div className="text-[12px] text-muted-foreground">{r.phone}</div></div> },
          { key: 'services.name', label: 'Wants' }, { key: 'preferred_at', label: 'Preferred', render: (r) => fmtDT(r.preferred_at) },
          { key: 'status', label: 'Status', render: (r) => <Badge tone={r.status === 'waiting' ? 'warning' : 'success'} dot>{humanize(r.status)}</Badge> },
          { key: 'act', label: '', align: 'right', render: (r) => r.status === 'waiting' && <Button size="sm" variant="soft" onClick={async () => { await update('waitlist', r.id, { status: 'booked' }); onBook(r) }}>Book</Button> },
        ]} />
      <RecordForm open={add} onOpenChange={setAdd} table="waitlist" title="Add to waitlist"
        fields={[{ name: 'client_id', label: 'Client', type: 'select', options: clientOpts }, { name: 'client_name', label: 'Or name (new contact)' }, { name: 'phone', label: 'Phone', type: 'tel' },
          { name: 'service_id', label: 'Service', type: 'select', options: (svc.data || []).map((s) => ({ value: s.id, label: s.name })) }, { name: 'preferred_at', label: 'Preferred time', type: 'datetime' }, { name: 'notes', label: 'Notes', type: 'textarea' }]}
        defaults={{ status: 'waiting' }} />
    </div>
  )
}