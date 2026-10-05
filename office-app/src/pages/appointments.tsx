import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { addDays, format, isSameDay, startOfDay } from 'date-fns'
import { CalendarPlus, ChevronLeft, ChevronRight, Clock, ListOrdered, Plus, Zap, DoorOpen, AlertTriangle, MessageCircle, Trash2, Info } from 'lucide-react'
import { useList, insert, update, remove, logActivity, type Row } from '@/services/db'
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
  const { scope, businesses } = useBiz()
  const { options: staffOpts } = useStaffOptions()
  const [fFrom, setFFrom] = useState(''), [fTo, setFTo] = useState(''), [fStaff, setFStaff] = useState(''), [fBiz, setFBiz] = useState('')
  const appts = useList('appointments', { select: '*, staff(full_name,color), clients(business_name,phone), leads(business_name), office_spaces(name)', filter: (b) => scope(b.is('deleted_at', null)), order: ['starts_at'], limit: 3000 })
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
          <DataTable rows={rows.filter((r) => (status === 'all' || r.status === status) && (!fFrom || r.starts_at >= fFrom) && (!fTo || r.starts_at.slice(0, 10) <= fTo) && (!fStaff || r.staff_id === fStaff) && (!fBiz || r.business_id === fBiz))}
            title="Appointments" filters={<>
              <Field label="From"><Input type="date" className="h-9" value={fFrom} onChange={(e) => setFFrom(e.target.value)} /></Field>
              <Field label="To"><Input type="date" className="h-9" value={fTo} onChange={(e) => setFTo(e.target.value)} /></Field>
              <Field label="Staff"><Select size="sm" value={fStaff} onChange={setFStaff} allowClear="All staff" options={staffOpts} /></Field>
              <Field label="Business"><Select size="sm" value={fBiz} onChange={setFBiz} allowClear="All businesses" options={businesses.map((b) => ({ value: b.id, label: b.name }))} /></Field>
            </>} onClearFilters={() => { setFFrom(''); setFTo(''); setFStaff(''); setFBiz(''); setStatus('all') }}
            toolbar={<Button size="sm" variant="outline" onClick={() => { const d = new Date().toISOString().slice(0, 10); setFFrom(d); setFTo(d) }}>Today</Button>}
            onView={(r) => setOpen(r.id)} onEdit={can('appointments', 'edit') ? (r) => setBooking(r) : undefined}
            onDelete={can('appointments', 'delete') ? async (r) => { await remove('appointments', r.id, true) } : undefined}
            importTable={can('appointments', 'create') ? 'appointments' : undefined} importFields={['title', 'type', 'starts_at', 'ends_at', 'status', 'source', 'location', 'notes']} importDefaults={{ status: 'booked', source: 'import' }} loading={appts.isLoading} onRow={(r) => setOpen(r.id)} searchKeys={['title', 'clients.business_name', 'leads.business_name', 'staff.full_name']} exportName="appointments" initialSort={['starts_at', 'desc']}
            cols={[
              { key: 'starts_at', label: 'When', sort: true, render: (a) => <div className="num"><div className="font-medium">{fmtDate(a.starts_at, 'EEE d MMM')}</div><div className="text-[12px] text-muted-foreground">{fmtTime(a.starts_at)}–{fmtTime(a.ends_at)}</div></div>, csv: (a) => a.starts_at },
              { key: 'who', label: 'Client / lead', sort: (a) => who(a), render: (a) => <div><div className="font-medium">{who(a)}</div><div className="text-[12px] text-muted-foreground">{humanize(a.type)}</div></div>, csv: who },
              { key: 'services', label: 'Services', hideBelow: 'lg', render: (a) => <span className="text-[12.5px]">{(a.services || []).map((x: Row) => x.name).join(', ') || '—'}</span>, csv: (a) => (a.services || []).map((x: Row) => x.name).join('; ') },
              { key: 'staff.full_name', label: 'With', hideBelow: 'md' },
              { key: 'office_spaces.name', label: 'Space', hideBelow: 'lg' },
              { key: 'dur', label: 'Mins', align: 'right', hideBelow: 'lg', render: (a) => Math.round((+new Date(a.ends_at) - +new Date(a.starts_at)) / 6e4), csv: (a) => Math.round((+new Date(a.ends_at) - +new Date(a.starts_at)) / 6e4) },
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
  const appts = useList('appointments', { select: 'id,queue_no,starts_at,ends_at,staff_id,space_id,status', filter: (b) => b.gte('starts_at', startOfDay(new Date()).toISOString()).is('deleted_at', null), limit: 3000 })
  const spaces = useList('office_spaces', { filter: (b) => b.eq('status', 'active'), order: ['sort', true] })
  const now = new Date(); now.setMinutes(Math.ceil(now.getMinutes() / 15) * 15, 0, 0)
  const [v, setV] = useState<Row>(() => ({ type: walkIn ? 'walk_in' : 'consultation', status: walkIn ? 'checked_in' : 'booked', source: walkIn ? 'walk_in' : 'phone', deposit_kes: 0, business_id: businesses.find((b) => b.is_primary)?.id, ...initial,
    starts_at: toLocalInput(initial?.starts_at || (walkIn ? now : addDays(now, 1))), services: initial?.services || [] }))
  const [busy, setBusy] = useState(false)
  const set = (k: string, x: unknown) => setV((s) => ({ ...s, [k]: x }))
  const sel: Row[] = v.services || []
  const dur = sum(sel, 'duration_min') || 45
  const toggle = (s: Row) => set('services', sel.some((x) => x.id === s.id) ? sel.filter((x) => x.id !== s.id) : [...sel, { id: s.id, name: s.name, price_kes: Number(s.price_kes), duration_min: s.duration_min || 45 }])
  const client = clients.find((c) => c.id === v.client_id)
  const startD = v.starts_at ? new Date(v.starts_at) : null
  const endD = startD ? new Date(startD.getTime() + dur * 6e4) : null
  const others = (appts.data || []).filter((a) => a.id !== initial?.id && !['cancelled', 'no_show'].includes(a.status))
  const overlap = (a: Row, s: Date, e: Date) => +new Date(a.starts_at) < +e && +new Date(a.ends_at || a.starts_at) > +s
  const staffClash = startD && endD && v.staff_id ? others.find((a) => a.staff_id === v.staff_id && overlap(a, startD, endD)) : undefined
  const spaceClash = startD && endD && v.space_id ? others.find((a) => a.space_id === v.space_id && overlap(a, startD, endD)) : undefined
  const slotDay = startD ? startOfDay(startD) : startOfDay(new Date())
  const slots = Array.from({ length: 22 }).map((_, i) => { const s = new Date(slotDay); s.setHours(8, i * 30, 0, 0); const e = new Date(s.getTime() + dur * 6e4)
    const busyS = v.staff_id && others.some((a) => a.staff_id === v.staff_id && overlap(a, s, e)), busyR = v.space_id && others.some((a) => a.space_id === v.space_id && overlap(a, s, e))
    return { s, state: s.getTime() < Date.now() - 6e4 ? 'past' : busyS ? 'booked' : busyR ? 'held' : e.getHours() + e.getMinutes() / 60 > 19 ? 'closed' : 'open' } })
  const SLOT: Record<string, string> = { open: 'bg-success/12 text-success hover:bg-success/25', booked: 'bg-danger/12 text-danger line-through cursor-not-allowed', held: 'bg-warning/15 text-warning cursor-not-allowed', closed: 'bg-foreground/[.05] text-muted-foreground cursor-not-allowed', past: 'bg-foreground/[.03] text-muted-foreground/60 cursor-not-allowed' }
  const space = (spaces.data || []).find((x) => x.id === v.space_id), biz = businesses.find((b) => b.id === v.business_id)
  async function save() {
    if (!v.client_id && !v.lead_id && !v.title) return toast.error('Choose a client or enter a title')
    if (staffClash && !walkIn) return toast.error(`That staff member is already booked ${fmtTime(staffClash.starts_at)}–${fmtTime(staffClash.ends_at)}`)
    if (spaceClash) return toast.error(`${space?.name || 'That space'} is taken at that time`)
    setBusy(true)
    try {
      const start = new Date(v.starts_at), end = new Date(start.getTime() + dur * 6e4)
      const todays = (appts.data || []).filter((a) => isSameDay(new Date(a.starts_at), start)).map((a) => a.queue_no || 0)
      const row: Row = { client_id: v.client_id || null, lead_id: v.lead_id || null, staff_id: v.staff_id || null, title: v.title || `${humanize(v.type)}: ${client?.business_name || 'Client'}`, type: v.type,
        services: sel, starts_at: start.toISOString(), ends_at: end.toISOString(), meet_link: v.meet_link || null, location: v.location || null, status: v.status, source: v.source, notes: v.notes || null, space_id: v.space_id || null, deposit_kes: Number(v.deposit_kes) || 0, checked_in_at: walkIn ? new Date().toISOString() : initial?.checked_in_at ?? null,
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
          <Field label="Business"><Select value={v.business_id} onChange={(x) => set('business_id', x)} options={businesses.map((b) => ({ value: b.id, label: b.name }))} /></Field>
          <Field label="Office space"><Select value={v.space_id} onChange={(x) => set('space_id', x)} allowClear="No room needed" options={(spaces.data || []).map((x) => ({ value: x.id, label: `${x.name} · ${humanize(x.kind)} (${x.capacity})` }))} /></Field>
          <Field label="Source"><Select value={v.source} onChange={(x) => set('source', x)} options={['phone', 'whatsapp', 'walk_in', 'website', 'referral', 'hermes', 'manual'].map((x) => ({ value: x, label: humanize(x) }))} /></Field>
          <Field label="Advance / deposit (KES)"><Input type="number" min={0} value={v.deposit_kes ?? 0} onChange={(e) => set('deposit_kes', e.target.value)} /></Field>
          <div className="sm:col-span-2 rounded-[14px] border border-border/70 p-3">
            <div className="flex items-center gap-2 text-[12.5px] font-medium mb-2"><Clock className="size-4 text-muted-foreground" />Availability {format(slotDay, 'EEE d MMM')}{!v.staff_id && <span className="text-muted-foreground font-normal">· pick staff to see their bookings</span>}</div>
            <div className="flex flex-wrap gap-1.5">{slots.map(({ s, state }) => (
              <button key={+s} type="button" disabled={state !== 'open'} onClick={() => set('starts_at', toLocalInput(s))}
                className={cn('num text-[12px] rounded-[8px] px-2 py-1 transition-colors', SLOT[state], startD && +s === +startD && 'ring-2 ring-primary')}>{fmtTime(s)}</button>))}</div>
            <div className="flex flex-wrap gap-3 mt-2 text-[11.5px] text-muted-foreground">{[['open', 'Available'], ['booked', 'Staff booked'], ['held', 'Room held'], ['closed', 'Closed']].map(([k, l]) => <span key={k} className="inline-flex items-center gap-1.5"><span className={cn('size-2.5 rounded-sm', SLOT[k].split(' ')[0])} />{l}</span>)}</div>
          </div>
          {(staffClash || spaceClash) && <div className="sm:col-span-2 flex items-start gap-2 rounded-[12px] bg-danger/10 text-danger px-3 py-2 text-[13px]"><AlertTriangle className="size-4 mt-0.5 shrink-0" />
            <div>{staffClash && <div>Staff already booked {fmtTime(staffClash.starts_at)}–{fmtTime(staffClash.ends_at)}.</div>}{spaceClash && <div>{space?.name} is taken {fmtTime(spaceClash.starts_at)}–{fmtTime(spaceClash.ends_at)}.</div>}</div></div>}
          <Field label="Services" className="sm:col-span-2">
            <div className="grid sm:grid-cols-2 gap-2 max-h-[220px] overflow-y-auto scroll-thin rounded-control border border-input p-2">
              {(services.data || []).map((s) => (
                <button key={s.id} type="button" onClick={() => toggle(s)} className={cn('flex items-center gap-2.5 rounded-[9px] px-2.5 py-2 text-left text-[13px] transition-colors', sel.some((x) => x.id === s.id) ? 'bg-primary/15' : 'hover:bg-foreground/[.04]')}>
                  <Checkbox checked={sel.some((x) => x.id === s.id)} onChange={() => toggle(s)} /><span className="flex-1 min-w-0 truncate">{s.name}</span><span className="num text-muted-foreground text-[12px]">{kes(s.price_kes)}</span>
                </button>))}
            </div>
          </Field>
          <Field label="Notes" className="sm:col-span-2"><Textarea value={v.notes || ''} onChange={(e) => set('notes', e.target.value)} /></Field>
          <div className="sm:col-span-2 grid grid-cols-3 gap-2 rounded-[14px] bg-foreground/[.035] p-3 text-[13px]">
            <div><div className="text-muted-foreground text-[11.5px]">Duration</div><div className="font-semibold num">{dur} min</div></div>
            <div><div className="text-muted-foreground text-[11.5px]">Ends</div><div className="font-semibold num">{endD ? fmtTime(endD) : '—'}</div></div>
            <div><div className="text-muted-foreground text-[11.5px]">Price</div><div className="font-semibold num">{kes(sum(sel, 'price_kes'))}</div></div>
          </div>
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
              <dl className="mt-3 pt-3 border-t border-border/70 space-y-1.5 text-[12.5px]">{[['Business', biz?.name], ['Space', space?.name], ['Source', humanize(v.source)], ['Deposit', Number(v.deposit_kes) ? kes(v.deposit_kes) : null], ['Balance on day', kes(Math.max(0, sum(sel, 'price_kes') - (Number(v.deposit_kes) || 0)))]].map(([k, x]) => <div key={k as string} className="flex justify-between gap-2"><dt className="text-muted-foreground">{k}</dt><dd className="font-medium">{x || '—'}</dd></div>)}</dl>
              {walkIn && <div className="mt-3 text-[12px] rounded-[10px] bg-info/10 text-info px-2.5 py-2 flex gap-1.5"><Info className="size-3.5 mt-0.5 shrink-0" />Walk-ins are checked in immediately and join the queue.</div>}
            </div>
          </div>
        </div>
      </div>
    </Dialog>
  )
}

function DayCalendar({ rows, onOpen, onSlot }: { rows: Row[]; onOpen: (id: string) => void; onSlot: (d: Date, staff?: string) => void }) {
  const [day, setDay] = useState(startOfDay(new Date()))
  const [mode, setMode] = useState<'day' | 'week'>('day')
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
        <div className="font-semibold ml-2">{mode === 'day' ? format(day, 'EEEE, d MMMM') : `Week of ${format(day, 'd MMM')}`}</div>
        <div className="ml-auto flex items-center gap-2"><span className="text-muted-foreground text-[13px] hidden sm:inline">{mode === 'day' ? list.length : rows.filter((a) => +new Date(a.starts_at) >= +day && +new Date(a.starts_at) < +addDays(day, 7) && a.status !== 'cancelled').length} appointments</span>
          <div className="inline-flex rounded-[10px] bg-foreground/[.05] p-0.5">{(['day', 'week'] as const).map((m) => <button key={m} onClick={() => setMode(m)} className={cn('px-3 h-8 rounded-[8px] text-[12.5px] font-medium capitalize', mode === m ? 'bg-card shadow-e1' : 'text-muted-foreground')}>{m}</button>)}</div></div>
      </div>
      {mode === 'week' ? <WeekGrid rows={rows} start={day} onOpen={onOpen} onSlot={onSlot} /> : <>
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
              {isSameDay(day, new Date()) && (() => { const t = ((new Date().getHours() + new Date().getMinutes() / 60) - H0) * PX; return t > 0 && t < (H1 - H0) * PX ? <div className="absolute inset-x-0 z-[5] h-0.5 bg-danger pointer-events-none" style={{ top: t }} /> : null })()}
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
      </>}
    </Card>
  )
}

function WeekGrid({ rows, start, onOpen, onSlot }: { rows: Row[]; start: Date; onOpen: (id: string) => void; onSlot: (d: Date) => void }) {
  const days = Array.from({ length: 7 }).map((_, i) => addDays(start, i))
  const H0 = 8, H1 = 19, PX = 52
  const nowTop = ((new Date().getHours() + new Date().getMinutes() / 60) - H0) * PX
  return (
    <div className="overflow-auto scroll-thin max-h-[70vh]">
      <div className="grid min-w-[860px]" style={{ gridTemplateColumns: `56px repeat(7, minmax(110px, 1fr))` }}>
        <div className="sticky top-0 z-10 bg-card" />
        {days.map((d) => <div key={+d} className={cn('sticky top-0 z-10 bg-card border-b border-l border-border/70 px-3 py-2.5 text-[13px] font-medium', isSameDay(d, new Date()) && 'text-brand-strong')}>{format(d, 'EEE d')}</div>)}
        <div className="relative" style={{ height: (H1 - H0) * PX }}>{Array.from({ length: H1 - H0 }).map((_, i) => <div key={i} className="absolute right-2 text-[11px] text-muted-foreground num" style={{ top: i * PX - 7 }}>{String(H0 + i).padStart(2, '0')}:00</div>)}</div>
        {days.map((d) => (
          <div key={+d} className="relative border-l border-border/70" style={{ height: (H1 - H0) * PX }}>
            {Array.from({ length: (H1 - H0) * 2 }).map((_, i) => <button key={i} aria-label="Book this slot" onClick={() => { const x = new Date(d); x.setHours(H0, i * 30, 0, 0); onSlot(x) }} className={cn('absolute inset-x-0 hover:bg-primary/[.06]', i % 2 ? 'border-t border-dashed border-border/30' : 'border-t border-border/50')} style={{ top: i * PX / 2, height: PX / 2 }} />)}
            {isSameDay(d, new Date()) && nowTop > 0 && nowTop < (H1 - H0) * PX && <div className="absolute inset-x-0 z-[5] h-0.5 bg-danger pointer-events-none" style={{ top: nowTop }}><span className="absolute -left-1 -top-1 size-2.5 rounded-full bg-danger" /></div>}
            {rows.filter((a) => isSameDay(new Date(a.starts_at), d) && a.status !== 'cancelled').map((a) => {
              const st = new Date(a.starts_at), en = new Date(a.ends_at || st.getTime() + 45 * 6e4)
              const top = ((st.getHours() + st.getMinutes() / 60) - H0) * PX, h = Math.max(22, ((+en - +st) / 36e5) * PX - 2)
              return <button key={a.id} onClick={() => onOpen(a.id)} className={cn('tone-' + (APPT_STATUS[a.status]?.tone || 'neutral'), 'chip absolute left-1 right-1 rounded-[8px] px-1.5 py-1 text-left overflow-hidden text-[11.5px]')} style={{ top, height: h }}>
                <div className="font-semibold truncate">{a.clients?.business_name || a.leads?.business_name || a.title}</div><div className="opacity-80 num">{fmtTime(st)}</div></button>
            })}
          </div>))}
      </div>
    </div>
  )
}

function Queue({ rows, onOpen }: { rows: Row[]; onOpen: (id: string) => void }) {
  const q = [...rows].filter((a) => !['cancelled'].includes(a.status)).sort((a, b) => (a.queue_no || 999) - (b.queue_no || 999))
  const lanes: [string, string[]][] = [['Waiting', ['booked', 'confirmed']], ['Checked in', ['checked_in']], ['In session', ['in_progress']], ['Done', ['completed', 'no_show']]]
  const next: Record<string, string> = { booked: 'checked_in', confirmed: 'checked_in', checked_in: 'in_progress', in_progress: 'completed' }
  const spaces = useList('office_spaces', { filter: (b) => b.eq('status', 'active'), order: ['sort', true] })
  const nowMs = Date.now()
  const occ = (sp: Row) => rows.find((a) => a.space_id === sp.id && (['checked_in', 'in_progress'].includes(a.status) || (+new Date(a.starts_at) <= nowMs && +new Date(a.ends_at) > nowMs && !['cancelled', 'no_show', 'completed'].includes(a.status))))
  const waiting = q.filter((a) => ['booked', 'confirmed', 'checked_in'].includes(a.status))
  const callNext = async () => {
    const n = q.find((a) => a.status === 'checked_in') || waiting[0]
    if (!n) return toast.info('Nobody waiting')
    await update('appointments', n.id, { status: 'in_progress', started_at: new Date().toISOString() })
    await logActivity(`Called #${n.queue_no || '–'} ${n.title} in`, 'appointment_in_progress', 'appointment', n.id); toast.success(`Now serving #${n.queue_no || '–'}`)
  }
  const occupancy = (
    <Card className="mb-4" title={<span className="inline-flex items-center gap-2"><DoorOpen className="size-4" />Office spaces</span>} sub={`${(spaces.data || []).filter(occ).length} of ${(spaces.data || []).length} in use`}
      action={<Button size="sm" onClick={callNext}><ListOrdered />Call next</Button>}>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">{(spaces.data || []).map((sp) => { const a = occ(sp); return (
        <div key={sp.id} className={cn('rounded-[14px] border p-3', a ? 'border-danger/30 bg-danger/[.06]' : 'border-success/30 bg-success/[.06]')}>
          <div className="flex items-center justify-between gap-2"><span className="font-medium text-[13px] truncate">{sp.name}</span><Badge tone={a ? 'danger' : 'success'} dot>{a ? 'Busy' : 'Free'}</Badge></div>
          <div className="text-[12px] text-muted-foreground mt-1 truncate">{a ? `${a.clients?.business_name || a.title} · until ${fmtTime(a.ends_at)}` : `${humanize(sp.kind)} · seats ${sp.capacity}`}</div>
        </div>) })}{!(spaces.data || []).length && <div className="text-[13px] text-muted-foreground">Add office spaces in Settings.</div>}</div>
    </Card>)
  if (!q.length) return <div>{occupancy}<Empty title="Nobody in the queue today" icon={<ListOrdered />} /></div>
  return (
    <div>{occupancy}
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
    </div></div>
  )
}

function Waitlist({ onBook }: { onBook: (w: Row) => void }) {
  const w = useList('waitlist', { select: '*, clients(business_name,phone), services(name), staff:preferred_staff_id(full_name)', order: ['created_at'] })
  const { options: staffOpts } = useStaffOptions()
  const { options: clientOpts } = useClientOptions()
  const svc = useList('services', { select: 'id,name', filter: (b) => b.eq('active', true) })
  const [add, setAdd] = useState(false)
  return (
    <div>
      <div className="flex justify-end mb-3"><Button onClick={() => setAdd(true)}><Plus />Add to waitlist</Button></div>
      <div className="mb-3 flex items-start gap-2 rounded-[12px] bg-info/10 text-info px-3 py-2 text-[13px]"><Info className="size-4 mt-0.5 shrink-0" />Waiting for a slot. When an appointment is cancelled, Hermes checks this list hourly and messages the first match.</div>
      <DataTable rows={w.data} loading={w.isLoading} empty={<Empty title="Waitlist is empty" />} exportName="waitlist" title="Waitlist"
        onDelete={async (r) => { await remove('waitlist', r.id) }}
        cols={[
          { key: 'name', label: 'Client', render: (r) => <div><div className="font-medium">{r.clients?.business_name || r.client_name}</div><div className="text-[12px] text-muted-foreground">{r.phone}</div></div> },
          { key: 'services.name', label: 'Wants' }, { key: 'staff.full_name', label: 'With', hideBelow: 'md' }, { key: 'preferred_at', label: 'Window', render: (r) => r.preferred_at ? `${fmtDT(r.preferred_at)}${r.window_end ? `–${fmtTime(r.window_end)}` : ''}` : 'Any time' },
          { key: 'status', label: 'Status', render: (r) => <Badge tone={r.status === 'waiting' ? 'warning' : 'success'} dot>{humanize(r.status)}</Badge> },
          { key: 'act', label: '', align: 'right', render: (r) => r.status === 'waiting' && <div className="flex justify-end gap-1.5">
            <Button size="sm" variant="outline" onClick={async () => { const ph = String(r.phone || r.clients?.phone || '').replace(/\D/g, ''); if (ph) window.open(`https://wa.me/${ph}?text=${encodeURIComponent(`Hi ${r.clients?.business_name || r.client_name || ''}, a slot has opened up for ${r.services?.name || 'your appointment'}. Reply to confirm.`)}`, '_blank'); await update('waitlist', r.id, { status: 'notified' }); toast.success('Marked as notified') }}><MessageCircle />Notify</Button>
            <Button size="sm" variant="soft" onClick={async () => { await update('waitlist', r.id, { status: 'booked' }); onBook(r) }}>Book</Button></div> },
        ]} />
      <RecordForm open={add} onOpenChange={setAdd} table="waitlist" title="Add to waitlist"
        fields={[{ name: 'client_id', label: 'Client', type: 'select', options: clientOpts }, { name: 'client_name', label: 'Or name (new contact)' }, { name: 'phone', label: 'Phone', type: 'tel' },
          { name: 'service_id', label: 'Service', type: 'select', options: (svc.data || []).map((s) => ({ value: s.id, label: s.name })) }, { name: 'preferred_staff_id', label: 'Preferred staff', type: 'select', options: staffOpts }, { name: 'preferred_at', label: 'Window start', type: 'datetime' }, { name: 'window_end', label: 'Window end', type: 'datetime' }, { name: 'notes', label: 'Notes', type: 'textarea' }]}
        defaults={{ status: 'waiting' }} />
    </div>
  )
}