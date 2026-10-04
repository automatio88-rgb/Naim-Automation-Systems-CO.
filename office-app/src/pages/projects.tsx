import { useState } from 'react'
import { toast } from 'sonner'
import { CheckSquare, FolderKanban, Plus, Square } from 'lucide-react'
import { useList, update, logActivity, type Row } from '@/services/db'
import { useAuth } from '@/lib/auth'
import { useBiz } from '@/lib/business'
import { cn, fmtDate, kes, kesShort, sum, humanize } from '@/lib/utils'
import { PROJECT_STATUS, opts } from '@/lib/status'
import { Badge, Button, Card, ChevronFilter, Kpi, PageHeader, Progress, Sheet, StatusBadge, Select, Field } from '@/components/ui'
import { RecordForm } from '@/components/form'
import { useClientOptions, useStaffOptions } from '@/components/shared'

const PRIORITY = [{ value: 'low', label: 'Low' }, { value: 'medium', label: 'Medium' }, { value: 'high', label: 'High' }, { value: 'urgent', label: 'Urgent' }]

export default function Projects() {
  const { can } = useAuth()
  const { scope } = useBiz()
  const p = useList('projects', { select: '*, clients(business_name), staff:lead_staff_id(full_name)', filter: (b) => scope(b.is('deleted_at', null)), order: ['created_at'] })
  const { options: clientOpts } = useClientOptions()
  const { options: staffOpts } = useStaffOptions()
  const [f, setF] = useState('active')
  const [edit, setEdit] = useState<Row | null | undefined>(undefined)
  const [open, setOpen] = useState<Row | null>(null)
  const rows = p.data || []
  const active = rows.filter((r) => !['delivered', 'in_care_plan', 'cancelled'].includes(r.status))
  const view = f === 'all' ? rows : f === 'active' ? active : rows.filter((r) => r.status === f)
  const late = active.filter((r) => r.due_at && new Date(r.due_at) < new Date())
  return (
    <div>
      <PageHeader title="Projects" sub="From materials collected to live demo to delivered and in care" actions={can('projects', 'create') && <Button onClick={() => setEdit(null)}><Plus />New project</Button>} />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-5">
        <Kpi solid tone="brand" label="Active projects" value={active.length} icon={<FolderKanban />} />
        <Kpi solid tone="warning" label="Waiting on materials" value={rows.filter((r) => r.status === 'materials_pending').length} />
        <Kpi solid tone="danger" label="Past due" value={late.length} />
        <Kpi solid tone="success" label="Active budget" value={sum(active, 'budget_kes')} format={kesShort} />
      </div>
      <div className="mb-4"><ChevronFilter value={f} onChange={setF} items={[{ id: 'active', label: 'Active', count: active.length }, ...Object.entries(PROJECT_STATUS).map(([id, s]) => ({ id, label: s.label, tone: s.tone, count: rows.filter((r) => r.status === id).length })), { id: 'all', label: 'All', count: rows.length }]} /></div>
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {view.map((r) => {
          const ck: Row[] = r.materials_checklist || []
          const isLate = r.due_at && new Date(r.due_at) < new Date() && !['delivered', 'in_care_plan'].includes(r.status)
          return (
            <button key={r.id} data-reveal onClick={() => setOpen(r)} className="text-left rounded-card bg-card border border-border/70 shadow-e1 p-5 hover:shadow-e2 hover:-translate-y-0.5 transition-[box-shadow,transform] duration-300">
              <div className="flex items-start justify-between gap-3"><div className="min-w-0"><div className="font-semibold leading-snug">{r.name}</div><div className="text-[12.5px] text-muted-foreground truncate mt-0.5">{r.clients?.business_name}</div></div><StatusBadge map={PROJECT_STATUS} value={r.status} /></div>
              <div className="flex items-center gap-3 mt-4"><Progress value={r.progress} className="flex-1" tone={r.progress >= 100 ? 'success' : 'brand'} /><span className="num text-[13px] font-medium">{r.progress}%</span></div>
              <div className="grid grid-cols-3 gap-2 mt-4 text-[12.5px]">
                <div><div className="text-muted-foreground">Due</div><div className={cn('num', isLate && 'text-danger font-medium')}>{fmtDate(r.due_at, 'd MMM')}</div></div>
                <div><div className="text-muted-foreground">Lead</div><div className="truncate">{r.staff?.full_name || '—'}</div></div>
                <div><div className="text-muted-foreground">Budget</div><div className="num">{kesShort(r.budget_kes)}</div></div>
              </div>
              {ck.length > 0 && <div className="text-[12px] text-muted-foreground mt-3">Materials {ck.filter((c) => c.done).length}/{ck.length} received</div>}
            </button>)
        })}
      </div>
      <ProjectSheet p={open} onClose={() => setOpen(null)} onEdit={(x) => { setOpen(null); setEdit(x) }} staffOpts={staffOpts} />
      <RecordForm open={edit !== undefined} onOpenChange={(v) => !v && setEdit(undefined)} table="projects" initial={edit} title={edit ? 'Edit project' : 'New project'}
        fields={[{ name: 'name', label: 'Project', required: true, span: 2 }, { name: 'client_id', label: 'Client', type: 'select', options: clientOpts }, { name: 'lead_staff_id', label: 'Project lead', type: 'select', options: staffOpts },
          { name: 'status', label: 'Status', type: 'select', options: opts(PROJECT_STATUS) }, { name: 'priority', label: 'Priority', type: 'select', options: PRIORITY },
          { name: 'started_at', label: 'Start', type: 'date' }, { name: 'due_at', label: 'Due', type: 'date' }, { name: 'budget_kes', label: 'Budget (KES)', type: 'number' }, { name: 'progress', label: 'Progress %', type: 'number' }]}
        defaults={{ status: 'materials_pending', priority: 'medium', progress: 0, materials_checklist: ['Company logo', 'NEA licence copy', 'Staff list', 'Service price list', 'Sample contracts'].map((label) => ({ label, done: false })) }}
        activity={(v, n) => `${n ? 'Started' : 'Updated'} project ${v.name}`} />
    </div>
  )
}

function ProjectSheet({ p, onClose, onEdit, staffOpts }: { p: Row | null; onClose: () => void; onEdit: (p: Row) => void; staffOpts: any[] }) {
  const [ck, setCk] = useState<Row[] | null>(null)
  const list: Row[] = ck ?? p?.materials_checklist ?? []
  if (!p) return null
  const toggle = async (i: number) => {
    const next = list.map((c, j) => (j === i ? { ...c, done: !c.done } : c)); setCk(next)
    await update('projects', p.id, { materials_checklist: next })
    if (next.every((c) => c.done) && p.status === 'materials_pending') { await update('projects', p.id, { status: 'in_build' }); await logActivity(`${p.name}: all materials received, build started`, 'project_in_build', 'project', p.id); toast.success('All materials in. Moved to In build.') }
  }
  const setStatus = async (s: string) => {
    const patch: Row = { status: s }; if (s === 'delivered') { patch.delivered_at = new Date().toISOString(); patch.progress = 100 }
    await update('projects', p.id, patch); await logActivity(`${p.name} moved to ${PROJECT_STATUS[s]?.label}`, s === 'delivered' ? 'project_delivered' : 'project_status', 'project', p.id); toast.success('Updated'); onClose()
  }
  return (
    <Sheet open onOpenChange={(v) => { if (!v) { setCk(null); onClose() } }} title={p.name} description={p.clients?.business_name} width={520}
      footer={<Button variant="outline" onClick={() => onEdit(p)}>Edit project</Button>}>
      <div className="p-6 grid gap-6">
        <div className="flex flex-wrap gap-2"><StatusBadge map={PROJECT_STATUS} value={p.status} /><Badge>{humanize(p.priority)} priority</Badge><Badge tone="brand">{kes(p.budget_kes)}</Badge></div>
        <Field label="Move to"><Select value={p.status} onChange={setStatus} options={opts(PROJECT_STATUS)} /></Field>
        <Card title="Materials checklist" sub="The build starts automatically once everything is received">
          <ul className="space-y-1">{list.map((c, i) => (
            <li key={i}><button onClick={() => toggle(i)} className="w-full flex items-center gap-3 rounded-[10px] px-2 py-2 hover:bg-foreground/[.04] text-left text-[13.5px]">
              {c.done ? <CheckSquare className="size-5 text-success" /> : <Square className="size-5 text-muted-foreground" />}<span className={cn(c.done && 'line-through text-muted-foreground')}>{c.label}</span>
            </button></li>))}{!list.length && <li className="text-[13px] text-muted-foreground">No checklist</li>}</ul>
        </Card>
        <div className="grid grid-cols-2 gap-3 text-[13px]">
          {[['Started', fmtDate(p.started_at)], ['Due', fmtDate(p.due_at)], ['Delivered', fmtDate(p.delivered_at)], ['Lead', staffOpts.find((s) => s.value === p.lead_staff_id)?.label || '—']].map(([k, v]) => <div key={k} className="rounded-[12px] bg-foreground/[.035] px-3 py-2.5"><div className="text-[12px] text-muted-foreground">{k}</div><div className="font-medium">{v}</div></div>)}
        </div>
      </div>
    </Sheet>
  )
}