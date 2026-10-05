import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { addDays, format, startOfWeek } from 'date-fns'
import { CalendarOff, Clock, Plus, UserPlus, Users } from 'lucide-react'
import { useList, insert, update, logActivity, run, type Row } from '@/services/db'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { cn, fmtDate, humanize, kes, fmtTime } from '@/lib/utils'
import { Avatar, Badge, Button, Card, Input, Kpi, PageHeader, Segmented, Select, TabPanel, Tabs } from '@/components/ui'
import { DataTable } from '@/components/data-table'
import { RecordForm } from '@/components/form'

const ATT: Record<string, any> = { present: 'success', late: 'warning', absent: 'danger', half_day: 'info', leave: 'violet', off: 'neutral' }
const EMP = ['full_time', 'part_time', 'contract', 'intern'].map((v) => ({ value: v, label: humanize(v) }))

export default function HR() {
  const { can, profile } = useAuth()
  const staff = useList('staff', { select: '*, departments(name,color)', filter: (b) => b.is('deleted_at', null), order: ['full_name', true] })
  const depts = useList('departments', { order: ['name', true] })
  const [tab, setTab] = useState('staff')
  const [edit, setEdit] = useState<Row | null | undefined>(undefined)
  const [editDept, setEditDept] = useState<Row | null | undefined>(undefined)
  const S = staff.data || []
  const deptOpts = (depts.data || []).map((d) => ({ value: d.id, label: d.name }))
  const staffOpts = S.map((s) => ({ value: s.id, label: s.full_name }))
  const leave = useList('leave_requests', { select: '*, staff(full_name)', order: ['created_at'] })
  const today = new Date().toISOString().slice(0, 10)
  const att = useList('attendance', { select: '*, staff(full_name)', filter: (b) => b.gte('day', addDays(new Date(), -30).toISOString().slice(0, 10)), order: ['day'], limit: 3000 })
  const todayAtt = (att.data || []).filter((a) => a.day === today)
  return (
    <div>
      <PageHeader title="Staff & HR" sub="The team, departments, shifts, attendance and leave"
        actions={can('staff', 'create') && (tab === 'departments' ? <Button onClick={() => setEditDept(null)}><Plus />Add department</Button> : tab === 'staff' ? <Button onClick={() => setEdit(null)}><UserPlus />Add staff</Button> : null)} />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-5">
        <Kpi solid tone="brand" label="Team" value={S.filter((s) => s.status === 'active').length} icon={<Users />} />
        <Kpi solid tone="success" label="In today" value={todayAtt.filter((a) => ['present', 'late', 'half_day'].includes(a.status)).length} icon={<Clock />} />
        <Kpi solid tone="warning" label="Late today" value={todayAtt.filter((a) => a.status === 'late').length} />
        <Kpi solid tone="violet" label="Leave pending" value={(leave.data || []).filter((l) => l.status === 'pending').length} icon={<CalendarOff />} />
      </div>
      <Tabs value={tab} onChange={setTab} items={[{ id: 'staff', label: 'Staff', count: S.length }, { id: 'departments', label: 'Departments' }, { id: 'shifts', label: 'Shifts' }, { id: 'attendance', label: 'Attendance' }, { id: 'leave', label: 'Leave' }]}>
        <TabPanel id="staff">
          <DataTable rows={S} loading={staff.isLoading} onRow={setEdit} searchKeys={['full_name', 'title', 'email', 'phone']} exportName="staff"
            cols={[{ key: 'full_name', label: 'Name', sort: true, render: (r) => <div className="flex items-center gap-3"><Avatar name={r.full_name} size={34} /><div><div className="font-medium">{r.full_name}</div><div className="text-[12px] text-muted-foreground">{r.title}</div></div></div> },
              { key: 'departments.name', label: 'Department', render: (r) => r.departments ? <span className="inline-flex items-center gap-2"><span className="size-2 rounded-full" style={{ background: r.departments.color }} />{r.departments.name}</span> : '—' },
              { key: 'employment_type', label: 'Type', hideBelow: 'md', render: (r) => humanize(r.employment_type) }, { key: 'phone', label: 'Phone', hideBelow: 'lg' },
              { key: 'hired_at', label: 'Joined', hideBelow: 'md', render: (r) => fmtDate(r.hired_at) },
              ...(can('payroll') ? [{ key: 'base_salary_kes', label: 'Base', align: 'right' as const, render: (r: Row) => kes(r.base_salary_kes) }] : []),
              { key: 'status', label: 'Status', render: (r) => <Badge tone={r.status === 'active' ? 'success' : 'neutral'} dot>{humanize(r.status)}</Badge> }]} />
        </TabPanel>
        <TabPanel id="departments">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">{(depts.data || []).map((d) => {
            const members = S.filter((s) => s.department_id === d.id), head = S.find((s) => s.id === d.head_staff_id)
            return (
              <Card key={d.id} title={<span className="inline-flex items-center gap-2"><span className="size-2.5 rounded-full" style={{ background: d.color }} />{d.name}</span>} sub={d.description} action={<Button size="sm" variant="ghost" onClick={() => setEditDept(d)}>Edit</Button>}>
                <div className="text-[12.5px] text-muted-foreground mb-3">Head: {head?.full_name || '—'} · {members.length} people</div>
                <div className="flex -space-x-2">{members.map((m) => <Avatar key={m.id} name={m.full_name} size={30} className="ring-2 ring-card" />)}</div>
              </Card>)
          })}</div>
        </TabPanel>
        <TabPanel id="shifts"><Shifts staff={S} /></TabPanel>
        <TabPanel id="attendance"><Attendance staff={S} rows={att.data || []} /></TabPanel>
        <TabPanel id="leave">
          <LeaveTab rows={leave.data || []} staffOpts={staffOpts} onDecide={async (l, status) => { await update('leave_requests', l.id, { status, decided_by: profile?.id }); await logActivity(`${humanize(status)} leave for ${l.staff?.full_name}`, 'leave_' + status, 'leave_request', l.id); toast.success(humanize(status)) }} />
        </TabPanel>
      </Tabs>
      <RecordForm open={edit !== undefined} onOpenChange={(v) => !v && setEdit(undefined)} table="staff" initial={edit} title={edit ? 'Edit staff member' : 'Add staff member'}
        fields={[{ name: 'full_name', label: 'Full name', required: true }, { name: 'title', label: 'Job title' }, { name: 'phone', label: 'Phone', type: 'tel' }, { name: 'email', label: 'Email', type: 'email' },
          { name: 'department_id', label: 'Department', type: 'select', options: deptOpts }, { name: 'employment_type', label: 'Employment', type: 'select', options: EMP },
          { name: 'base_salary_kes', label: 'Base salary (KES)', type: 'number' }, { name: 'commission_pct', label: 'Commission %', type: 'number' }, { name: 'hired_at', label: 'Joined', type: 'date' },
          { name: 'status', label: 'Status', type: 'select', options: ['active', 'on_leave', 'inactive'].map((s) => ({ value: s, label: humanize(s) })) }, { name: 'color', label: 'Calendar colour', type: 'color' }, { name: 'skills', label: 'Skills', type: 'tags' }]}
        defaults={{ employment_type: 'full_time', status: 'active', color: '#C8A24A', commission_pct: 0 }} activity={(v, n) => `${n ? 'Added' : 'Updated'} staff member ${v.full_name}`} />
      <RecordForm open={editDept !== undefined} onOpenChange={(v) => !v && setEditDept(undefined)} table="departments" initial={editDept} title={editDept ? 'Edit department' : 'Add department'}
        fields={[{ name: 'name', label: 'Name', required: true }, { name: 'head_staff_id', label: 'Head', type: 'select', options: staffOpts }, { name: 'color', label: 'Colour', type: 'color' }, { name: 'description', label: 'Description', type: 'textarea' }]} defaults={{ color: '#C8A24A' }} />
    </div>
  )
}

function Shifts({ staff }: { staff: Row[] }) {
  const [week, setWeek] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }))
  const days = Array.from({ length: 7 }, (_, i) => addDays(week, i))
  const sh = useList('shifts', { filter: (b) => b.gte('day', days[0].toISOString().slice(0, 10)).lte('day', format(days[6], 'yyyy-MM-dd')), key: [week.toISOString()], limit: 1000 })
  const [add, setAdd] = useState<Row | null>(null)
  const [editShift, setEditShift] = useState<Row | null>(null)
  const [copying, setCopying] = useState(false)
  const copyLast = async () => {
    setCopying(true)
    try {
      const prev = await run<Row[]>(supabase.from('shifts').select('staff_id,day,start_time,end_time,role').gte('day', format(addDays(days[0], -7), 'yyyy-MM-dd')).lte('day', format(addDays(days[6], -7), 'yyyy-MM-dd')))
      const have = new Set((sh.data || []).map((y) => y.staff_id + y.day))
      const recs = prev.map((y): Row => ({ ...y, day: format(addDays(new Date(y.day + 'T00:00:00'), 7), 'yyyy-MM-dd') })).filter((y) => !have.has(y.staff_id + y.day))
      if (!recs.length) toast.info('Nothing to copy'); else { await insert('shifts', recs); toast.success(`Copied ${recs.length} shifts from last week`) }
    } catch (e: any) { toast.error(e.message) } finally { setCopying(false) }
  }
  return (
    <Card pad={false}>
      <div className="flex items-center gap-2 p-4 border-b border-border/70">
        <Button size="sm" variant="outline" onClick={() => setWeek(addDays(week, -7))}>Previous</Button><Button size="sm" variant="outline" onClick={() => setWeek(startOfWeek(new Date(), { weekStartsOn: 1 }))}>This week</Button><Button size="sm" variant="outline" onClick={() => setWeek(addDays(week, 7))}>Next</Button>
        <span className="ml-2 font-medium">{format(days[0], 'd MMM')} – {format(days[6], 'd MMM yyyy')}</span>
        <span className="flex-1" /><Button size="sm" variant="soft" loading={copying} onClick={copyLast}>Copy last week</Button>
        <Button size="sm" onClick={() => setAdd({ day: format(days[0], 'yyyy-MM-dd'), start_time: '08:30', end_time: '17:30' })}>Add shift</Button>
      </div>
      <div className="overflow-x-auto scroll-thin">
        <table className="w-full text-[13px] min-w-[860px]">
          <thead><tr className="text-muted-foreground"><th className="text-left font-medium px-4 h-10 w-[200px]">Staff</th>{days.map((d) => <th key={d.toISOString()} className="font-medium px-2 text-left">{format(d, 'EEE d')}</th>)}</tr></thead>
          <tbody>{staff.filter((s) => s.status === 'active').map((s) => (
            <tr key={s.id} className="border-t border-border/60"><td className="px-4 py-2 font-medium">{s.full_name}</td>
              {days.map((d) => {
                const k = format(d, 'yyyy-MM-dd'), x = (sh.data || []).find((y) => y.staff_id === s.id && y.day === k)
                return <td key={k} className="px-1.5 py-1.5">{x ? <button onClick={() => setEditShift(x)} title="Edit shift" className="tone-brand chip block w-full text-left rounded-[9px] px-2 py-1.5 text-[12px] num hover:brightness-95">{String(x.start_time).slice(0, 5)}–{String(x.end_time).slice(0, 5)}{x.role && <span className="block text-[10.5px] opacity-75 truncate">{x.role}</span>}</button>
                  : <button onClick={() => setAdd({ staff_id: s.id, day: k, start_time: '08:30', end_time: '17:30', role: s.title })} className="w-full h-8 rounded-[9px] border border-dashed border-border text-muted-foreground hover:bg-foreground/[.04] text-[12px]">Add</button>}</td>
              })}</tr>))}</tbody>
        </table>
      </div>
      <RecordForm open={!!add} onOpenChange={(v) => !v && setAdd(null)} table="shifts" title="Add shift" initial={null} defaults={add || {}}
        fields={[{ name: 'staff_id', label: 'Staff', type: 'select', required: true, options: staff.map((x) => ({ value: x.id, label: x.full_name })) }, { name: 'day', label: 'Day', type: 'date', required: true }, { name: 'role', label: 'Role' }, { name: 'start_time', label: 'Start', type: 'time', required: true }, { name: 'end_time', label: 'End', type: 'time', required: true }]} />
      <RecordForm open={!!editShift} onOpenChange={(v) => !v && setEditShift(null)} table="shifts" title="Edit shift" initial={editShift}
        fields={[{ name: 'staff_id', label: 'Staff', type: 'select', required: true, options: staff.map((x) => ({ value: x.id, label: x.full_name })) }, { name: 'day', label: 'Day', type: 'date', required: true }, { name: 'role', label: 'Role' }, { name: 'start_time', label: 'Start', type: 'time', required: true }, { name: 'end_time', label: 'End', type: 'time', required: true }]} />
    </Card>
  )
}

function Attendance({ staff, rows }: { staff: Row[]; rows: Row[] }) {
  const today = new Date().toISOString().slice(0, 10)
  const days = useMemo(() => Array.from({ length: 14 }, (_, i) => format(addDays(new Date(), -13 + i), 'yyyy-MM-dd')), [])
  const [mode, setMode] = useState('day')
  const [day, setDay] = useState(today)
  const [draft, setDraft] = useState<Record<string, Row>>({})
  const [busy, setBusy] = useState(false)
  const active = staff.filter((s) => s.status === 'active')
  useEffect(() => {
    const d: Record<string, Row> = {}
    active.forEach((s) => { const r = rows.find((x) => x.staff_id === s.id && x.day === day); d[s.id] = { id: r?.id, status: r?.status || '', check_in: r?.check_in ? String(r.check_in).slice(0, 5) : '', check_out: r?.check_out ? String(r.check_out).slice(0, 5) : '', notes: r?.notes || '' } })
    setDraft(d)
  }, [day, rows.length, staff.length]) // eslint-disable-line
  const set = (id: string, k: string, v: unknown) => setDraft((s) => ({ ...s, [id]: { ...s[id], [k]: v } }))
  const PILLS: [string, string][] = [['present', 'P'], ['late', 'L'], ['half_day', 'H'], ['absent', 'A'], ['leave', 'Lv']].filter(([k]) => k in ATT) as [string, string][]
  const counts = PILLS.map(([k]) => [k, Object.values(draft).filter((d) => d.status === k).length] as const)
  const save = async () => {
    setBusy(true)
    try {
      let n = 0
      for (const s of active) {
        const d = draft[s.id]; if (!d?.status) continue
        const payload = { status: d.status, check_in: d.check_in || null, check_out: d.check_out || null, notes: d.notes || null }
        if (d.id) await update('attendance', d.id, payload); else await insert('attendance', { staff_id: s.id, day, ...payload })
        n++
      }
      toast.success(`Saved attendance for ${n} staff on ${fmtDate(day)}`)
    } catch (e: any) { toast.error(e.message) } finally { setBusy(false) }
  }
  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <Segmented value={mode} onChange={setMode} items={[{ id: 'day', label: 'Mark day' }, { id: 'matrix', label: '14-day matrix' }]} />
      </div>
      {mode === 'day' ? (
      <Card title="Mark attendance" sub={fmtDate(day, 'EEEE d MMMM')}
        action={<div className="flex flex-wrap items-center gap-2">
          <Input type="date" className="h-9 w-[150px]" value={day} max={today} min={days[0]} onChange={(e) => e.target.value && setDay(e.target.value)} />
          <Button size="sm" variant="outline" onClick={() => setDraft((s) => Object.fromEntries(Object.entries(s).map(([k, v]) => [k, { ...v, status: 'present', check_in: v.check_in || '08:30' }])))}>All present</Button>
          <Button size="sm" loading={busy} onClick={save}>Save</Button></div>}>
        <div className="flex flex-wrap gap-2 mb-3">{counts.map(([k, n]) => <Badge key={k} tone={(ATT as Row)[k]} dot>{humanize(k)} {n}</Badge>)}<Badge>Unmarked {active.length - counts.reduce((a, [, n]) => a + n, 0)}</Badge></div>
        <div className="overflow-x-auto scroll-thin rounded-[14px] border border-border/70">
          <table className="w-full text-[13px] min-w-[720px]">
            <thead><tr className="bg-foreground/[.025] text-muted-foreground">{['Staff', 'Status', 'Check in', 'Check out', 'Note'].map((h) => <th key={h} className="text-left font-medium px-3 h-10">{h}</th>)}</tr></thead>
            <tbody>{active.map((s) => { const d = draft[s.id] || {}; return (
              <tr key={s.id} className="border-t border-border/60">
                <td className="px-3 py-2"><div className="flex items-center gap-2.5"><Avatar name={s.full_name} size={30} /><div className="min-w-0"><div className="font-medium truncate">{s.full_name}</div><div className="text-[11.5px] text-muted-foreground truncate">{s.title}</div></div></div></td>
                <td className="px-3 py-2"><div className="inline-flex gap-1">{PILLS.map(([k, l]) => (
                  <button key={k} title={humanize(k)} onClick={() => set(s.id, 'status', k)} className={cn('tone-' + (ATT as Row)[k], 'h-8 min-w-8 px-2 rounded-[8px] text-[12px] font-semibold border transition-colors', d.status === k ? 'fill-tone text-white border-transparent' : 'border-border text-muted-foreground hover:bg-foreground/[.05]')}>{l}</button>))}</div></td>
                <td className="px-3 py-2"><Input type="time" className="h-9 w-[110px]" value={d.check_in || ''} onChange={(e) => set(s.id, 'check_in', e.target.value)} /></td>
                <td className="px-3 py-2"><Input type="time" className="h-9 w-[110px]" value={d.check_out || ''} onChange={(e) => set(s.id, 'check_out', e.target.value)} /></td>
                <td className="px-3 py-2"><Input className="h-9 min-w-[140px]" value={d.notes || ''} onChange={(e) => set(s.id, 'notes', e.target.value)} placeholder="Optional" /></td>
              </tr>) })}</tbody>
          </table>
        </div>
        <div className="text-[12px] text-muted-foreground mt-2">P present · L late · H half day · A absent · Lv on leave. Changes save only when you press Save.</div>
      </Card>) : (
      <Card title="Last 14 days" pad={false}>
        <div className="overflow-x-auto scroll-thin p-4">
          <table className="text-[12px] min-w-[760px] w-full">
            <thead><tr className="text-muted-foreground"><th className="text-left font-medium pb-2 w-[180px]">Staff</th>{days.map((d) => <th key={d} className="font-medium pb-2">{format(new Date(d), 'd')}</th>)}</tr></thead>
            <tbody>{staff.map((s) => <tr key={s.id}><td className="py-1 font-medium text-[13px]">{s.full_name}</td>{days.map((d) => { const a = rows.find((r) => r.staff_id === s.id && r.day === d); return <td key={d} className="p-0.5 text-center"><span title={a ? humanize(a.status) : 'No record'} className={cn(a && 'tone-' + (ATT[a.status] || 'neutral'), a ? 'fill-tone' : 'bg-foreground/[.06]', 'block mx-auto size-5 rounded-[6px]')} /></td> })}</tr>)}</tbody>
          </table>
          <div className="flex flex-wrap gap-3 mt-3">{Object.entries(ATT).map(([k, t]) => <span key={k} className={cn('tone-' + t, 'inline-flex items-center gap-1.5 text-[12px] text-muted-foreground')}><span className="fill-tone size-3 rounded-[4px]" />{humanize(k)}</span>)}</div>
        </div>
      </Card>
      )}
    </div>
  )
}

function LeaveTab({ rows, staffOpts, onDecide }: { rows: Row[]; staffOpts: any[]; onDecide: (l: Row, s: string) => void }) {
  const [add, setAdd] = useState(false)
  return (
    <div>
      <div className="flex justify-end mb-3"><Button onClick={() => setAdd(true)}><Plus />Request leave</Button></div>
      <DataTable rows={rows} exportName="leave"
        cols={[{ key: 'staff.full_name', label: 'Staff', sort: true }, { key: 'type', label: 'Type', render: (r) => humanize(r.type) }, { key: 'from_date', label: 'Dates', render: (r) => `${fmtDate(r.from_date, 'd MMM')} – ${fmtDate(r.to_date, 'd MMM')}` },
          { key: 'days', label: 'Days', align: 'right', render: (r) => Number(r.days) }, { key: 'reason', label: 'Reason', hideBelow: 'lg' },
          { key: 'status', label: 'Status', render: (r) => <Badge tone={r.status === 'approved' ? 'success' : r.status === 'pending' ? 'warning' : 'danger'} dot>{humanize(r.status)}</Badge> },
          { key: 'act', label: '', align: 'right', render: (r) => r.status === 'pending' && <div className="flex justify-end gap-1"><Button size="sm" variant="soft" onClick={() => onDecide(r, 'approved')}>Approve</Button><Button size="sm" variant="ghost" className="text-danger" onClick={() => onDecide(r, 'rejected')}>Reject</Button></div> }]} />
      <RecordForm open={add} onOpenChange={setAdd} table="leave_requests" title="Request leave"
        fields={[{ name: 'staff_id', label: 'Staff', type: 'select', options: staffOpts, required: true }, { name: 'type', label: 'Type', type: 'select', options: ['annual', 'sick', 'compassionate', 'maternity', 'paternity', 'unpaid'].map((v) => ({ value: v, label: humanize(v) })) },
          { name: 'from_date', label: 'From', type: 'date', required: true }, { name: 'to_date', label: 'To', type: 'date', required: true }, { name: 'reason', label: 'Reason', type: 'textarea' }]}
        defaults={{ type: 'annual', status: 'pending' }} transform={(v) => ({ ...v, days: Math.max(1, Math.round((+new Date(v.to_date) - +new Date(v.from_date)) / 864e5) + 1) })} />
      <div className="hidden">{fmtTime(new Date())}</div>
    </div>
  )
}