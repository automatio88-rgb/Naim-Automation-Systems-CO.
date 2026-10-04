import { useState } from 'react'
import { toast } from 'sonner'
import { Bot, Plus } from 'lucide-react'
import { useList, update, logActivity, type Row } from '@/services/db'
import { useAuth } from '@/lib/auth'
import { cn, fmtDate, humanize } from '@/lib/utils'
import { TASK_PRIORITY } from '@/lib/status'
import { Avatar, Badge, Button, Kpi, PageHeader, Segmented } from '@/components/ui'
import { DataTable } from '@/components/data-table'
import { RecordForm } from '@/components/form'
import { useStaffOptions } from '@/components/shared'

const COLS = [{ id: 'todo', label: 'To do' }, { id: 'in_progress', label: 'In progress' }, { id: 'done', label: 'Done' }]
const PRI = Object.keys(TASK_PRIORITY).map((v) => ({ value: v, label: humanize(v) }))

export default function Tasks() {
  const { can } = useAuth()
  const t = useList('tasks', { select: '*, staff:assignee_id(full_name)', filter: (b) => b.is('deleted_at', null), order: ['due_at', true], limit: 3000 })
  const { options: staffOpts } = useStaffOptions()
  const [view, setView] = useState<'board' | 'list'>('board')
  const [mine, setMine] = useState<'all' | 'hermes'>('all')
  const [edit, setEdit] = useState<Row | null | undefined>(undefined)
  const [drag, setDrag] = useState<string | null>(null)
  const rows = (t.data || []).filter((r) => mine === 'all' || r.created_by_kind === 'hermes')
  const open = rows.filter((r) => r.status !== 'done')
  const move = async (r: Row, status: string) => {
    if (r.status === status) return
    await update('tasks', r.id, { status, completed_at: status === 'done' ? new Date().toISOString() : null })
    if (status === 'done') await logActivity(`Completed task: ${r.title}`, 'task_done', 'task', r.id)
    toast.success(`Moved to ${COLS.find((c) => c.id === status)?.label}`)
  }
  return (
    <div>
      <PageHeader title="Tasks" sub="Team work and the follow-ups Hermes creates for you"
        actions={<><Segmented value={mine} onChange={setMine} items={[{ id: 'all', label: 'All' }, { id: 'hermes', label: 'From Hermes' }]} /><Segmented value={view} onChange={setView} items={[{ id: 'board', label: 'Board' }, { id: 'list', label: 'List' }]} />{can('tasks', 'create') && <Button onClick={() => setEdit(null)}><Plus />New task</Button>}</>} />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-5">
        <Kpi tone="brand" label="Open" value={open.length} />
        <Kpi tone="danger" label="Overdue" value={open.filter((r) => r.due_at && new Date(r.due_at) < new Date()).length} />
        <Kpi tone="warning" label="Urgent" value={open.filter((r) => r.priority === 'urgent').length} />
        <Kpi tone="info" label="Created by Hermes" value={open.filter((r) => r.created_by_kind === 'hermes').length} icon={<Bot />} />
      </div>
      {view === 'board' ? (
        <div className="grid md:grid-cols-3 gap-3">
          {COLS.map((c) => {
            const list = rows.filter((r) => r.status === c.id).slice(0, c.id === 'done' ? 20 : 200)
            return (
              <div key={c.id} onDragOver={(e) => e.preventDefault()} onDrop={() => { const r = rows.find((x) => x.id === drag); if (r) move(r, c.id); setDrag(null) }} className="rounded-panel bg-foreground/[.035] p-2.5 min-h-[200px]" data-reveal>
                <div className="px-2 py-1.5 text-[13px] font-medium">{c.label} <span className="text-muted-foreground num">{rows.filter((r) => r.status === c.id).length}</span></div>
                <div className="space-y-2">{list.map((r) => {
                  const late = r.status !== 'done' && r.due_at && new Date(r.due_at) < new Date()
                  return (
                    <div key={r.id} draggable onDragStart={() => setDrag(r.id)} onClick={() => setEdit(r)} className={cn('rounded-card bg-card border border-border/70 shadow-e1 p-3.5 cursor-grab hover:shadow-e2 transition-shadow', drag === r.id && 'opacity-50')}>
                      <div className="flex items-start gap-2"><span className={cn('text-[13.5px] font-medium flex-1', r.status === 'done' && 'line-through text-muted-foreground')}>{r.title}</span><Badge tone={TASK_PRIORITY[r.priority]}>{humanize(r.priority)}</Badge></div>
                      {r.description && <p className="text-[12.5px] text-muted-foreground mt-1 line-clamp-2">{r.description}</p>}
                      <div className="flex items-center gap-2 mt-3 text-[12px]">
                        {r.staff?.full_name ? <><Avatar name={r.staff.full_name} size={20} /><span className="text-muted-foreground truncate">{r.staff.full_name}</span></> : <span className="text-muted-foreground">Unassigned</span>}
                        {r.created_by_kind === 'hermes' && <Bot className="size-3.5 text-muted-foreground" />}
                        <span className={cn('ml-auto num', late ? 'text-danger font-medium' : 'text-muted-foreground')}>{fmtDate(r.due_at, 'd MMM')}</span>
                      </div>
                      <select aria-label="Move" value={r.status} onClick={(e) => e.stopPropagation()} onChange={(e) => move(r, e.target.value)} className="mt-2 w-full h-8 rounded-[9px] bg-foreground/[.04] text-[12.5px] px-2 outline-none md:hidden">{COLS.map((x) => <option key={x.id} value={x.id}>{x.label}</option>)}</select>
                    </div>)
                })}</div>
              </div>)
          })}
        </div>
      ) : (
        <DataTable rows={rows} loading={t.isLoading} onRow={setEdit} searchKeys={['title', 'description', 'staff.full_name']} exportName="tasks" initialSort={['due_at', 'asc']}
          cols={[{ key: 'title', label: 'Task', sort: true, render: (r) => <span className="font-medium">{r.title}</span> }, { key: 'priority', label: 'Priority', render: (r) => <Badge tone={TASK_PRIORITY[r.priority]}>{humanize(r.priority)}</Badge> },
            { key: 'status', label: 'Status', sort: true, render: (r) => humanize(r.status) }, { key: 'staff.full_name', label: 'Assignee', hideBelow: 'md' },
            { key: 'created_by', label: 'From', hideBelow: 'lg', render: (r) => r.created_by || humanize(r.created_by_kind) }, { key: 'due_at', label: 'Due', sort: true, render: (r) => fmtDate(r.due_at) }]} />
      )}
      <RecordForm open={edit !== undefined} onOpenChange={(v) => !v && setEdit(undefined)} table="tasks" initial={edit} title={edit ? 'Edit task' : 'New task'}
        fields={[{ name: 'title', label: 'Task', required: true, span: 2 }, { name: 'description', label: 'Details', type: 'textarea' }, { name: 'assignee_id', label: 'Assignee', type: 'select', options: staffOpts },
          { name: 'priority', label: 'Priority', type: 'select', options: PRI }, { name: 'status', label: 'Status', type: 'select', options: COLS.map((c) => ({ value: c.id, label: c.label })) }, { name: 'due_at', label: 'Due', type: 'datetime' }]}
        defaults={{ status: 'todo', priority: 'medium', created_by_kind: 'human' }} activity={(v, n) => `${n ? 'Created' : 'Updated'} task: ${v.title}`} />
    </div>
  )
}