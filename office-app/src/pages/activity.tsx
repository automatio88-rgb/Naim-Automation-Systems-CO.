import { useState } from 'react'
import { Bot, History, User, UserRound, Workflow } from 'lucide-react'
import { useList, type Row } from '@/services/db'
import { verbMeta } from '@/components/shared'
import { cn, fmtDT, fmtDate, humanize, isoDay } from '@/lib/utils'
import { Avatar, Badge, Card, Dialog, Input, Kpi, PageHeader, Select } from '@/components/ui'
import { DataTable } from '@/components/data-table'
import { Bars } from '@/components/charts'

const KIND: Record<string, { label: string; tone: any; icon: any }> = {
  human: { label: 'Team', tone: 'brand', icon: UserRound }, bot: { label: 'Hermes', tone: 'violet', icon: Bot },
  system: { label: 'System', tone: 'neutral', icon: Workflow }, client: { label: 'Client', tone: 'teal', icon: User },
}

export default function Activity() {
  const A = useList('activities', { order: ['created_at'], limit: 3000 })
  const [kind, setKind] = useState('')
  const [entity, setEntity] = useState('')
  const [verb, setVerb] = useState('')
  const [who, setWho] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [open, setOpen] = useState<Row | null>(null)
  const rows = A.data || []
  const d7 = Date.now() - 7 * 864e5
  const last7 = rows.filter((r) => +new Date(r.created_at) >= d7)
  const today = isoDay()
  const opts = (k: string) => Array.from(new Set(rows.map((r) => r[k]).filter(Boolean))).sort().map((v) => ({ value: String(v), label: k === 'verb' ? verbMeta(String(v)).label + ` (${humanize(v)})` : humanize(v) }))
  const view = rows.filter((r) => (!kind || r.actor_kind === kind) && (!entity || r.entity_type === entity) && (!verb || r.verb === verb) && (!who || r.actor_name === who)
    && (!from || isoDay(new Date(r.created_at)) >= from) && (!to || isoDay(new Date(r.created_at)) <= to))
  const trend = Array.from({ length: 14 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() - (13 - i)); const k = isoDay(d); const day = rows.filter((r) => isoDay(new Date(r.created_at)) === k); return { label: fmtDate(d, 'd MMM'), team: day.filter((r) => r.actor_kind === 'human').length, hermes: day.filter((r) => r.actor_kind === 'bot').length, other: day.filter((r) => !['human', 'bot'].includes(r.actor_kind)).length } })

  return (
    <div>
      <PageHeader title="Activity Logs" sub="Audit trail: who did what, when. Team, Hermes bots, the system and clients." />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-5">
        <Kpi solid tone="brand" label="Events today" value={rows.filter((r) => isoDay(new Date(r.created_at)) === today).length} icon={<History />} />
        <Kpi solid tone="info" label="Team actions (7 days)" value={last7.filter((r) => r.actor_kind === 'human').length} icon={<UserRound />} onClick={() => setKind('human')} />
        <Kpi solid tone="violet" label="Hermes actions (7 days)" value={last7.filter((r) => r.actor_kind === 'bot').length} icon={<Bot />} onClick={() => setKind('bot')} />
        <Kpi solid tone="teal" label="Client actions (7 days)" value={last7.filter((r) => r.actor_kind === 'client').length} icon={<User />} onClick={() => setKind('client')} />
      </div>
      <Card className="mb-4" title="Last 14 days"><Bars data={trend} x="label" height={170} money={false} stacked series={[{ key: 'team', name: 'Team', color: 'var(--p)' }, { key: 'hermes', name: 'Hermes', color: 'var(--c3)' }, { key: 'other', name: 'System and clients', color: 'var(--c5)' }]} /></Card>
      <DataTable rows={view} loading={A.isLoading} onRow={setOpen} onView={setOpen} searchKeys={['summary', 'actor_name', 'verb', 'entity_type']} exportName="activity-log" initialSort={['created_at', 'desc']} pageSize={25}
        filters={<>
          <Select size="sm" value={kind} onChange={setKind} allowClear="Anyone" options={Object.entries(KIND).map(([value, k]) => ({ value, label: k.label }))} />
          <Select size="sm" value={who} onChange={setWho} allowClear="All people and bots" options={opts('actor_name')} />
          <Select size="sm" value={entity} onChange={setEntity} allowClear="All records" options={opts('entity_type')} />
          <Select size="sm" value={verb} onChange={setVerb} allowClear="All actions" options={opts('verb')} />
          <label className="text-[12px] text-muted-foreground grid gap-1">From<Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="h-9" /></label>
          <label className="text-[12px] text-muted-foreground grid gap-1">To<Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="h-9" /></label>
        </>} onClearFilters={() => { setKind(''); setEntity(''); setVerb(''); setWho(''); setFrom(''); setTo('') }}
        cols={[
          { key: 'created_at', label: 'When', sort: true, render: (r) => <span className="num whitespace-nowrap">{fmtDT(r.created_at)}</span> },
          { key: 'actor_name', label: 'Who', sort: true, render: (r) => { const k = KIND[r.actor_kind] || KIND.system; return <div className="flex items-center gap-2.5"><Avatar name={r.actor_name || k.label} size={28} /><div><div className="font-medium leading-tight">{r.actor_name || '—'}</div><Badge tone={k.tone} className="mt-0.5">{k.label}</Badge></div></div> }, csv: (r) => `${r.actor_name} (${r.actor_kind})` },
          { key: 'verb', label: 'Action', render: (r) => { const m = verbMeta(r.verb); return <span className={cn('tone-' + m.tone, 'inline-flex items-center gap-1.5 ink text-[12.5px] font-medium')}><m.icon className="size-3.5" />{m.label}</span> }, csv: (r) => r.verb },
          { key: 'summary', label: 'What happened', render: (r) => <span className="line-clamp-2 max-w-[460px]">{r.summary}</span> },
          { key: 'entity_type', label: 'Record', hideBelow: 'md', render: (r) => r.entity_type ? <Badge>{humanize(r.entity_type)}</Badge> : '—' },
        ]} />
      {open && (
        <Dialog open onOpenChange={(v) => !v && setOpen(null)} size="md" title={verbMeta(open.verb).label} description={fmtDT(open.created_at)}>
          <div className="space-y-3 text-[13.5px]">
            <p>{open.summary}</p>
            <dl className="grid grid-cols-[120px_1fr] gap-y-1.5 text-[13px]">
              {[['Who', `${open.actor_name || '—'} (${KIND[open.actor_kind]?.label || open.actor_kind})`], ['Action', open.verb], ['Record', open.entity_type ? `${humanize(open.entity_type)}${open.entity_id ? ` · ${String(open.entity_id).slice(0, 8)}` : ''}` : '—'], ['Event id', String(open.id)]].map(([k, v]) => <div key={k} className="contents"><dt className="text-muted-foreground">{k}</dt><dd className="font-mono text-[12.5px] break-all">{v}</dd></div>)}
            </dl>
            {open.metadata && Object.keys(open.metadata).length > 0 && <pre className="rounded-[12px] bg-foreground/[.04] p-3 text-[12px] overflow-auto max-h-[260px]">{JSON.stringify(open.metadata, null, 2)}</pre>}
          </div>
        </Dialog>)}
    </div>
  )
}