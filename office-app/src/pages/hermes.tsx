import { useState } from 'react'
import { toast } from 'sonner'
import { Bot, Cpu, MessageSquare, Pause, Play, Radar, Send, Terminal, Wallet, Zap } from 'lucide-react'
import { useList, update, sendCommand, setSetting, logActivity, type Row } from '@/services/db'
import { useAuth } from '@/lib/auth'
import { ago, cn, fmtDT, humanize } from '@/lib/utils'
import { RUN_STATUS } from '@/lib/status'
import { Badge, Button, Card, ChevronFilter, Confirm, Kpi, PageHeader, Switch, TabPanel, Tabs } from '@/components/ui'
import { DataTable } from '@/components/data-table'
import { Bars } from '@/components/charts'

const ICON: Record<string, any> = { scout: Radar, sage: Cpu, herald: Send, echo: MessageSquare, ledger: Wallet }
const COMMANDS: Record<string, { cmd: string; label: string }[]> = {
  scout: [{ cmd: 'run_sourcing', label: 'Run sourcing' }],
  sage: [{ cmd: 'run_enrichment', label: 'Enrich waiting leads' }],
  herald: [{ cmd: 'send_outreach', label: 'Send approved outreach' }],
  echo: [{ cmd: 'check_replies', label: 'Check replies' }],
  ledger: [{ cmd: 'chase_overdue', label: 'Chase overdue invoices' }, { cmd: 'morning_briefing', label: 'Send morning briefing' }, { cmd: 'daily_summary', label: 'Send daily summary' }],
}
const botTone = (b: Row) => (!b.enabled ? 'neutral' : b.status === 'error' ? 'danger' : b.status === 'running' ? 'info' : b.status === 'paused' ? 'warning' : 'success') as any

export default function Hermes() {
  const { can } = useAuth()
  const bots = useList('hermes_bots', { order: ['name', true] })
  const runs = useList('automation_runs', { order: ['started_at'], limit: 500 })
  const cmds = useList('automation_commands', { order: ['created_at'], limit: 200 })
  const settings = useList('automation_settings')
  const [tab, setTab] = useState('fleet')
  const [f, setF] = useState('all')
  const [kill, setKill] = useState(false)
  const S = Object.fromEntries((settings.data || []).map((s) => [s.key, s.value]))
  const paused = S.outreach_paused === true
  const R = runs.data || []
  const day = 864e5
  const last24 = R.filter((r) => Date.now() - +new Date(r.started_at) < day)
  const perDay = Array.from({ length: 14 }, (_, i) => { const d = new Date(Date.now() - (13 - i) * day); const k = d.toISOString().slice(0, 10); const x = R.filter((r) => String(r.started_at).slice(0, 10) === k); return { label: d.toLocaleDateString('en-KE', { day: 'numeric', month: 'short' }), success: x.filter((r) => r.status === 'success').length, failed: x.filter((r) => r.status === 'failed').length, skipped: x.filter((r) => r.status === 'skipped').length } })
  const edit = can('hermes', 'edit')
  return (
    <div>
      <PageHeader title="Hermes Fleet" sub="Five autonomous bots run the growth engine. The app commands them through the database; Telegram is the pocket cockpit."
        actions={edit && <Button variant={paused ? 'success' : 'danger'} onClick={() => setKill(true)}>{paused ? <><Play />Resume all outreach</> : <><Pause />Kill switch</>}</Button>} />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-5">
        <Kpi solid tone="brand" label="Bots enabled" value={(bots.data || []).filter((b) => b.enabled).length} icon={<Bot />} foot={`of ${(bots.data || []).length}`} />
        <Kpi solid tone="success" label="Runs (24h)" value={last24.length} foot={`${last24.filter((r) => r.status === 'success').length} succeeded`} />
        <Kpi solid tone="danger" label="Failures (24h)" value={last24.filter((r) => r.status === 'failed').length} />
        <Kpi solid tone="info" label="Commands pending" value={(cmds.data || []).filter((c) => ['pending', 'acked', 'running'].includes(c.status)).length} icon={<Terminal />} />
      </div>
      {paused && <div className="rounded-card bg-danger/10 px-5 py-3.5 mb-4 flex items-center gap-3" data-reveal><span className="tone-danger dot live-dot size-2.5 rounded-full" /><span className="font-medium">Kill switch is on. Herald and Echo send nothing until you resume.</span></div>}
      <Tabs value={tab} onChange={setTab} items={[{ id: 'fleet', label: 'Fleet' }, { id: 'runs', label: 'Run log', count: R.length }, { id: 'commands', label: 'Commands' }, { id: 'settings', label: 'Rules' }, { id: 'telegram', label: 'Telegram cockpit' }]}>
        <TabPanel id="fleet">
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">{(bots.data || []).map((b) => {
            const Icon = ICON[b.name] || Bot, lastRun = R.find((r) => r.bot_name === b.name)
            return (
              <div key={b.name} data-reveal className={cn('tone-' + botTone(b), 'rounded-card bg-card border border-border/70 shadow-e1 p-5')}>
                <div className="flex items-start gap-3">
                  <span className="chip size-12 rounded-[16px] grid place-items-center shrink-0"><Icon className="size-6" /></span>
                  <div className="min-w-0 flex-1"><div className="font-semibold text-[16px]">{b.display_name}</div><div className="text-[12.5px] text-muted-foreground">{b.role}</div></div>
                  {edit && <Switch checked={b.enabled} tone="success" onChange={async (v) => { await update('hermes_bots', b.name, { enabled: v }); await logActivity(`${v ? 'Enabled' : 'Disabled'} ${b.display_name}`, 'hermes_command', 'hermes_bot'); toast.success(`${b.display_name} ${v ? 'enabled' : 'disabled'}`) }} />}
                </div>
                <p className="text-[13px] mt-3">{b.routine}</p>
                <div className="grid grid-cols-3 gap-2 mt-4 text-[12px]">
                  <div className="rounded-[12px] bg-foreground/[.035] px-2.5 py-2"><div className="text-muted-foreground">Status</div><div className="font-medium"><span className="ink">{b.enabled ? humanize(b.status) : 'Off'}</span></div></div>
                  <div className="rounded-[12px] bg-foreground/[.035] px-2.5 py-2"><div className="text-muted-foreground">Schedule</div><div className="font-mono">{b.schedule}</div></div>
                  <div className="rounded-[12px] bg-foreground/[.035] px-2.5 py-2"><div className="text-muted-foreground">Heartbeat</div><div className="font-medium">{b.last_heartbeat ? ago(b.last_heartbeat) : 'never'}</div></div>
                </div>
                {lastRun && <div className="text-[12.5px] text-muted-foreground mt-3 line-clamp-2"><Badge tone={RUN_STATUS[lastRun.status] || 'neutral'} dot>{humanize(lastRun.status)}</Badge> <span className="ml-1">{lastRun.summary}</span></div>}
                {edit && <div className="flex flex-wrap gap-2 mt-4">{(COMMANDS[b.name] || []).map((c) => (
                  <Button key={c.cmd} size="sm" variant="outline" disabled={!b.enabled} onClick={async () => { try { await sendCommand(c.cmd, b.name, {}, `${c.label} (${b.display_name})`); toast.success(`${b.display_name} will pick it up on the next poll`) } catch (e: any) { toast.error(e.message) } }}><Zap />{c.label}</Button>))}</div>}
              </div>)
          })}</div>
          <Card className="mt-4" title="Runs per day" sub="Last 14 days"><Bars height={220} money={false} stacked x="label" data={perDay} series={[{ key: 'success', name: 'Success', color: 'var(--success)' }, { key: 'skipped', name: 'Skipped', color: 'var(--warning)' }, { key: 'failed', name: 'Failed', color: 'var(--danger)' }]} /></Card>
        </TabPanel>
        <TabPanel id="runs">
          <div className="mb-4"><ChevronFilter value={f} onChange={setF} items={[{ id: 'all', label: 'All', count: R.length }, ...(bots.data || []).map((b) => ({ id: b.name, label: b.display_name, count: R.filter((r) => r.bot_name === b.name).length }))]} /></div>
          <DataTable rows={R.filter((r) => f === 'all' || r.bot_name === f)} loading={runs.isLoading} searchKeys={['summary', 'routine', 'bot_name']} exportName="hermes-runs" initialSort={['started_at', 'desc']}
            cols={[{ key: 'started_at', label: 'Started', sort: true, render: (r) => fmtDT(r.started_at) }, { key: 'bot_name', label: 'Bot', render: (r) => humanize(r.bot_name) }, { key: 'routine', label: 'Routine', hideBelow: 'md', render: (r) => humanize(r.routine) },
              { key: 'summary', label: 'Summary', render: (r) => <span className="line-clamp-2 max-w-[420px]">{r.summary}</span> }, { key: 'duration', label: 'Took', hideBelow: 'lg', align: 'right', render: (r) => r.finished_at ? `${Math.max(1, Math.round((+new Date(r.finished_at) - +new Date(r.started_at)) / 1000))}s` : '—' },
              { key: 'status', label: 'Status', render: (r) => <Badge tone={RUN_STATUS[r.status] || 'neutral'} dot>{humanize(r.status)}</Badge> }]} />
        </TabPanel>
        <TabPanel id="commands">
          <DataTable rows={cmds.data} loading={cmds.isLoading} exportName="hermes-commands" initialSort={['created_at', 'desc']}
            cols={[{ key: 'created_at', label: 'Sent', sort: true, render: (r) => fmtDT(r.created_at) }, { key: 'command', label: 'Command', render: (r) => <span className="font-mono text-[12.5px]">{r.command}</span> }, { key: 'target_bot', label: 'To', render: (r) => humanize(r.target_bot || 'fleet') },
              { key: 'requested_by', label: 'By', hideBelow: 'md' }, { key: 'result', label: 'Result', hideBelow: 'lg', render: (r) => <span className="text-muted-foreground line-clamp-1 max-w-[300px]">{r.result ? (typeof r.result === 'string' ? r.result : r.result.summary || JSON.stringify(r.result)) : '—'}</span> },
              { key: 'status', label: 'Status', render: (r) => <Badge tone={r.status === 'done' ? 'success' : r.status === 'failed' ? 'danger' : r.status === 'pending' ? 'warning' : 'info'} dot>{humanize(r.status)}</Badge> }]} />
        </TabPanel>
        <TabPanel id="settings">
          <Card title="Automation rules" sub="Stored in automation_settings. Every bot reads these before acting.">
            <dl className="divide-y divide-border/70">{(settings.data || []).map((s) => (
              <div key={s.key} className="grid sm:grid-cols-[240px_1fr_auto] gap-2 py-3 items-center">
                <dt><div className="font-medium text-[13.5px]">{humanize(s.key)}</div><div className="text-[12px] text-muted-foreground">{s.description}</div></dt>
                <dd className="font-mono text-[12.5px] break-all">{JSON.stringify(s.value)}</dd>
                <dd>{typeof s.value === 'boolean' && edit && <Switch checked={s.value} onChange={async (v) => { await setSetting(s.key, v); toast.success('Saved') }} />}
                  {typeof s.value === 'number' && edit && <input type="number" defaultValue={s.value} className="h-8 w-24 rounded-[9px] border border-input bg-transparent px-2 text-[13px]" onBlur={async (e) => { const n = Number(e.target.value); if (n !== s.value) { await setSetting(s.key, n); toast.success('Saved') } }} />}</dd>
              </div>))}</dl>
          </Card>
        </TabPanel>
        <TabPanel id="telegram">
          <Card title="Telegram cockpit" sub="Run the fleet from your phone">
            <p className="text-[14px] mb-4">The Hermes MCP server exposes the same tools this app uses. Point a Hermes Agent at it with the Telegram gateway enabled, and these commands work from chat:</p>
            <div className="grid sm:grid-cols-2 gap-2 font-mono text-[13px]">{[['/status', 'Fleet health and today\'s numbers'], ['/funnel', 'Pipeline funnel with conversion'], ['/pause', 'Kill switch: stop all outreach'], ['/resume', 'Resume outreach'], ['/enrich', 'Run Sage now'], ['/approve', 'Approve today\'s outreach queue'], ['/overdue', 'Overdue invoices'], ['/summary', 'Daily summary from Ledger']].map(([c, d]) => (
              <div key={c} className="rounded-[12px] bg-foreground/[.035] px-3 py-2.5"><span className="text-brand-strong font-semibold">{c}</span><span className="font-sans text-muted-foreground ml-2">{d}</span></div>))}</div>
            <p className="text-[13px] text-muted-foreground mt-4">Setup is in <span className="font-mono">hermes-fleet/README.md</span> in the repository: MCP server, SOUL.md, config.yaml and the Telegram bot token.</p>
          </Card>
        </TabPanel>
      </Tabs>
      <Confirm open={kill} onOpenChange={setKill} danger={!paused} title={paused ? 'Resume all outreach?' : 'Stop all outreach now?'} confirm={paused ? 'Resume' : 'Stop everything'}
        body={paused ? 'Herald and Echo will send again within the send window and limits.' : 'Herald and Echo stop immediately. Scout, Sage and Ledger keep working internally.'}
        onConfirm={async () => { await setSetting('outreach_paused', !paused); await sendCommand(paused ? 'resume_outreach' : 'pause_outreach', null, {}, paused ? 'Resumed all outreach' : 'Kill switch: paused all outreach'); toast.success(paused ? 'Outreach resumed' : 'All outreach stopped'); setKill(false) }} />
    </div>
  )
}