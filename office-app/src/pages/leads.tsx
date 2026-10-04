import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Ban, Cpu, Eye, Globe, Mail, MapPin, MessageSquare, Pause, Phone, Play, Plus, RefreshCw, Send, SlidersHorizontal, Sparkles, UserCheck, ScanSearch, CalendarPlus, ChevronDown } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { run, useList, insert, update, rpc, logActivity, sendCommand, setSetting, invalidate, type Row } from '@/services/db'
import { useAuth } from '@/lib/auth'
import { ago, cn, fmtDate, fmtDT, humanize, pct } from '@/lib/utils'
import { LEAD_STATUS, QUALITY, scoreTone, opts } from '@/lib/status'
import { Badge, Button, Card, ChevronFilter, Confirm, Empty, Input, PageHeader, Select, Sheet, Skeleton, StatusBadge, Switch, TabPanel, Tabs, Textarea, Field } from '@/components/ui'
import { DataTable, type Col } from '@/components/data-table'
import { ActivityList, Funnel, cumulativeFunnel } from '@/components/shared'
import { RecordForm } from '@/components/form'

const LEAD_FIELDS = [
  { name: 'business_name', label: 'Agency / business name', required: true, span: 2 as const },
  { name: 'contact_name', label: 'Contact person' }, { name: 'phone', label: 'Phone', type: 'tel' as const },
  { name: 'email', label: 'Email', type: 'email' as const }, { name: 'website', label: 'Website' },
  { name: 'location', label: 'Location' }, { name: 'licence_no', label: 'NEA licence no.' },
  { name: 'company_size', label: 'Team size', type: 'select' as const, options: ['1-5', '6-15', '16-40', '40+'].map((v) => ({ value: v, label: v })) },
  { name: 'source', label: 'Source', type: 'select' as const, options: ['manual', 'referral', 'landing_page', 'scraper', 'event'].map((v) => ({ value: v, label: humanize(v) })) },
  { name: 'main_challenge', label: 'Main challenge', type: 'textarea' as const },
]

export default function Leads() {
  const [params, setParams] = useSearchParams()
  const [tab, setTab] = useState(params.get('tab') || 'leads')
  const [open, setOpen] = useState<string | null>(params.get('lead'))
  const [adding, setAdding] = useState(params.get('new') === '1')
  const { can } = useAuth()
  const leads = useList('leads', { select: 'id,business_name,contact_name,website,location,score,quality,status,source,scraped_at,created_at,phone,email', filter: (b) => b.is('deleted_at', null), order: ['score'], limit: 5000 })
  const replies = useList('replies', { select: '*, leads(id,business_name,status,converted_client_id)', order: ['received_at'], limit: 300 })
  useEffect(() => { if (params.get('lead')) setOpen(params.get('lead')) }, [params])
  const closeLead = () => { setOpen(null); params.delete('lead'); setParams(params, { replace: true }) }
  const unreadReplies = (replies.data || []).filter((r) => r.leads?.status === 'replied').length

  return (
    <div>
      <PageHeader title="Lead Engine" sub={`${leads.data?.length ?? '…'} leads · sourced by Scout, enriched by Sage, contacted by Herald, answered by Echo`}
        actions={<>
          <Button variant="outline" onClick={() => leads.refetch()}><RefreshCw />Refresh</Button>
          {can('leads', 'create') && <Button onClick={() => setAdding(true)}><Plus />Add lead</Button>}
        </>} />
      <Card className="mb-5" data-reveal title="Pipeline funnel" sub="Scraped to won, with conversion between every stage">
        {leads.data ? <Funnel stages={cumulativeFunnel(leads.data)} /> : <Skeleton className="h-24" />}
      </Card>
      <Tabs value={tab} onChange={(t) => { setTab(t); params.set('tab', t); setParams(params, { replace: true }) }}
        items={[{ id: 'leads', label: 'Leads', count: leads.data?.length }, { id: 'actions', label: 'Actions' }, { id: 'replies', label: 'Replies inbox', count: unreadReplies }, { id: 'campaigns', label: 'Campaigns' }]}>
        <TabPanel id="leads"><LeadsTable rows={leads.data} loading={leads.isLoading} onOpen={setOpen} selected={open} /></TabPanel>
        <TabPanel id="actions"><ActionsPanel leads={leads.data || []} /></TabPanel>
        <TabPanel id="replies"><RepliesInbox rows={replies.data} loading={replies.isLoading} onOpen={setOpen} /></TabPanel>
        <TabPanel id="campaigns"><Campaigns /></TabPanel>
      </Tabs>
      <LeadDrawer id={open} onClose={closeLead} />
      <RecordForm open={adding} onOpenChange={(v) => { setAdding(v); if (!v && params.get('new')) { params.delete('new'); setParams(params, { replace: true }) } }}
        table="leads" title="Add lead" description="Sage will enrich and score it on the next run, or trigger enrichment now." fields={LEAD_FIELDS} defaults={{ source: 'manual', status: 'new' }}
        activity={(v) => `Added lead ${v.business_name}`} />
    </div>
  )
}

function LeadsTable({ rows, loading, onOpen, selected }: { rows?: Row[]; loading: boolean; onOpen: (id: string) => void; selected: string | null }) {
  const [status, setStatus] = useState('all')
  const [quality, setQuality] = useState('')
  const [minScore, setMinScore] = useState('')
  const counts = useMemo(() => { const c: Record<string, number> = {}; (rows || []).forEach((r) => { c[r.status] = (c[r.status] || 0) + 1 }); return c }, [rows])
  const view = (rows || []).filter((r) => (status === 'all' || r.status === status) && (!quality || r.quality === quality) && (!minScore || r.score >= Number(minScore)))
  const cols: Col[] = [
    { key: 'business_name', label: 'Business', sort: true, render: (r) => (
      <div className="min-w-[200px]"><div className="font-medium">{r.business_name}</div>
        <div className="text-[12px] text-muted-foreground flex items-center gap-2">{r.location && <span className="inline-flex items-center gap-1"><MapPin className="size-3" />{r.location}</span>}{r.website && <span className="inline-flex items-center gap-1 truncate max-w-[160px]"><Globe className="size-3" />{r.website.replace(/^https?:\/\//, '')}</span>}</div></div>) },
    { key: 'score', label: 'Score', sort: true, align: 'right', render: (r) => <Badge tone={scoreTone(r.score)} className="num min-w-[42px] justify-center">{r.score || '—'}</Badge> },
    { key: 'quality', label: 'Quality', sort: (r) => ({ high: 3, medium: 2, low: 1 } as any)[r.quality], render: (r) => <StatusBadge map={QUALITY} value={r.quality} /> },
    { key: 'status', label: 'Status', sort: true, render: (r) => <StatusBadge map={LEAD_STATUS} value={r.status} /> },
    { key: 'source', label: 'Source', hideBelow: 'md', render: (r) => <span className="text-muted-foreground">{humanize(r.source)}</span> },
    { key: 'created_at', label: 'Scraped', sort: true, hideBelow: 'sm', render: (r) => <span className="text-muted-foreground num">{fmtDate(r.scraped_at || r.created_at, 'd MMM')}</span>, csv: (r) => r.created_at },
  ]
  return (
    <div>
      <div className="mb-4"><ChevronFilter value={status} onChange={setStatus} items={[{ id: 'all', label: 'All', count: rows?.length ?? 0 }, ...Object.entries(LEAD_STATUS).map(([id, s]) => ({ id, label: s.label, count: counts[id] || 0, tone: s.tone }))]} /></div>
      <DataTable rows={view} cols={cols} loading={loading} onRow={(r) => onOpen(r.id)} selectedId={selected} searchKeys={['business_name', 'contact_name', 'location', 'email', 'phone']} exportName="leads" initialSort={['score', 'desc']}
        toolbar={<>
          <Select size="sm" className="w-[150px]" value={quality} onChange={setQuality} allowClear="All quality" options={opts(QUALITY)} />
          <div className="flex items-center gap-2"><span className="text-[12.5px] text-muted-foreground">Min score</span><Input type="number" min={0} max={100} value={minScore} onChange={(e) => setMinScore(e.target.value)} className="h-9 w-[78px]" placeholder="0" /></div>
        </>} />
    </div>
  )
}

/* ---------- Actions — control panel commanding Hermes ---------- */
function ActionsPanel({ leads }: { leads: Row[] }) {
  const settings = useList('automation_settings', { limit: 50 })
  const cmds = useList('automation_commands', { order: ['created_at'], limit: 8 })
  const S = Object.fromEntries((settings.data || []).map((s) => [s.key, s.value]))
  const paused = S.outreach_paused === true
  const [threshold, setThreshold] = useState<string>('')
  const [confirmSend, setConfirmSend] = useState(false)
  const [showQueue, setShowQueue] = useState(false)
  const [busy, setBusy] = useState<string | null>(null)
  useEffect(() => { if (S.min_score_threshold !== undefined && threshold === '') setThreshold(String(S.min_score_threshold)) }, [S.min_score_threshold]) // eslint-disable-line
  const t = Number(threshold || S.min_score_threshold || 70)
  const unenriched = leads.filter((l) => l.status === 'new').length
  const queue = leads.filter((l) => ['enriched', 'queued'].includes(l.status) && l.score >= t && l.quality === 'high')
  const act = async (k: string, fn: () => Promise<unknown>, msg: string) => { setBusy(k); try { await fn(); toast.success(msg) } catch (e: any) { toast.error(e.message) } finally { setBusy(null) } }

  const ActionCard = ({ icon, tone, title, body, children }: any) => (
    <div className={cn('tone-' + tone, 'rounded-card bg-card border border-border/70 shadow-e1 p-5 flex gap-4')} data-reveal>
      <span className="chip size-11 rounded-[14px] grid place-items-center shrink-0 [&_svg]:size-5">{icon}</span>
      <div className="min-w-0 flex-1"><div className="font-semibold">{title}</div><p className="text-[13px] text-muted-foreground mt-1 mb-4">{body}</p>{children}</div>
    </div>
  )
  return (
    <div className="grid gap-4">
      <div className={cn('rounded-card px-5 py-3.5 flex flex-wrap items-center gap-3', paused ? 'bg-danger/10' : 'bg-success/10')} data-reveal>
        <span className={cn(paused ? 'tone-danger' : 'tone-success', 'dot live-dot size-2.5 rounded-full')} />
        <span className="font-medium">{paused ? 'Outreach is paused. Herald will send nothing until you resume.' : 'Pipeline live. Herald sends approved outreach within the daily limit.'}</span>
        <span className="text-[13px] text-muted-foreground">Approval mode: {humanize(S.approval_mode)} · daily limit {S.daily_send_limit ?? '—'}</span>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <ActionCard icon={<Cpu />} tone="violet" title="Run enrichment now" body={`Sage researches every unprocessed lead (${unenriched} waiting), writes the dossier and personalization lines, and scores it.`}>
          <Button loading={busy === 'enrich'} onClick={() => act('enrich', () => sendCommand('run_enrichment', 'sage', { limit: 50 }), 'Sage will enrich the waiting leads on its next poll')}><Sparkles />Trigger enrichment</Button>
        </ActionCard>
        <ActionCard icon={<Send />} tone="success" title="Approve and send today's outreach" body={`Approves personalized outreach to ${queue.length} high-quality leads at or above score ${t} that have not been contacted.`}>
          <Button disabled={paused || !queue.length} onClick={() => setConfirmSend(true)}><Send />Approve & send</Button>
        </ActionCard>
        <ActionCard icon={paused ? <Play /> : <Pause />} tone={paused ? 'success' : 'warning'} title={paused ? 'Resume outreach' : 'Pause all outreach'} body={paused ? 'Lets Herald send again within the send window and daily limit.' : 'Kill switch. Herald stops immediately and skips every routine until resumed.'}>
          <Button variant={paused ? 'success' : 'danger'} loading={busy === 'pause'} onClick={() => act('pause', async () => {
            await setSetting('outreach_paused', !paused); await sendCommand(paused ? 'resume_outreach' : 'pause_outreach', 'herald', {}, paused ? 'Resumed all outreach' : 'Paused all outreach (kill switch)')
          }, paused ? 'Outreach resumed' : 'All outreach paused')}>{paused ? <><Play />Resume outreach</> : <><Pause />Pause outreach</>}</Button>
        </ActionCard>
        <ActionCard icon={<SlidersHorizontal />} tone="info" title="Minimum score threshold" body="Outreach only goes to leads at or above this score. Saved to the database, so every bot reads the same value.">
          <div className="flex items-center gap-2">
            <Input type="number" min={0} max={100} value={threshold} onChange={(e) => setThreshold(e.target.value)} className="w-[96px]" />
            <Button variant="outline" loading={busy === 'th'} disabled={String(S.min_score_threshold) === threshold} onClick={() => act('th', () => setSetting('min_score_threshold', Number(threshold)), `Threshold set to ${threshold}`)}>Save</Button>
          </div>
        </ActionCard>
        <ActionCard icon={<ScanSearch />} tone="brand" title="Trigger a sourcing run" body="Scout searches the NEA licensed-agency universe and legitimate directories for new agencies, dedupes, and inserts real leads only.">
          <Button variant="outline" loading={busy === 'scout'} onClick={() => act('scout', () => sendCommand('run_sourcing', 'scout', { target: 25 }), 'Scout will start a sourcing run')}><ScanSearch />Start sourcing</Button>
        </ActionCard>
        <ActionCard icon={<MessageSquare />} tone="teal" title="Check replies now" body="Echo checks the inbox, classifies intent, drafts responses and books discovery calls for interested agencies.">
          <Button variant="outline" loading={busy === 'echo'} onClick={() => act('echo', () => sendCommand('check_replies', 'echo'), 'Echo will check replies now')}><MessageSquare />Check replies</Button>
        </ActionCard>
      </div>
      <Card data-reveal title="Preview outreach queue" sub={`${queue.length} leads, with the personalization lines Herald will use`} action={<Button size="sm" variant="ghost" onClick={() => setShowQueue(!showQueue)}><Eye />{showQueue ? 'Hide' : 'Show'}<ChevronDown className={cn('transition-transform', showQueue && 'rotate-180')} /></Button>}>
        {showQueue && (queue.length ? <QueuePreview ids={queue.map((q) => q.id)} /> : <Empty title="Queue is empty" body="Lower the threshold or run enrichment to qualify more leads." />)}
        {!showQueue && <p className="text-[13px] text-muted-foreground">Expand to review every lead and message before approving.</p>}
      </Card>
      <Card data-reveal title="Recent commands" sub="What the app has asked the fleet to do">
        <ul className="divide-y divide-border/60">{(cmds.data || []).map((c) => (
          <li key={c.id} className="flex items-center gap-3 py-2.5 text-[13.5px]"><span className="font-medium flex-1">{humanize(c.command)} <span className="text-muted-foreground font-normal">to {humanize(c.target_bot || 'fleet')}</span></span>
            <Badge tone={c.status === 'done' ? 'success' : c.status === 'failed' ? 'danger' : c.status === 'pending' ? 'warning' : 'info'} dot>{humanize(c.status)}</Badge><span className="text-[12px] text-muted-foreground w-[110px] text-right">{ago(c.created_at)}</span></li>))}
        </ul>
      </Card>
      <Confirm open={confirmSend} onOpenChange={setConfirmSend} title="Approve today's outreach?" confirm={`Approve ${queue.length} messages`}
        body={`Herald will send personalized outreach to ${queue.length} high-quality leads (score ${t}+) within the send window and daily limit. Every send is logged.`}
        loading={busy === 'send'} onConfirm={() => act('send', async () => {
          const ids = queue.map((q) => q.id)
          await run(supabase.from('leads').update({ status: 'queued' }).in('id', ids))
          await sendCommand('send_outreach', 'herald', { lead_ids: ids, threshold: t }, `Approved outreach to ${ids.length} leads`)
          invalidate(['leads']); setConfirmSend(false)
        }, 'Approved. Herald is sending.')} />
    </div>
  )
}

function QueuePreview({ ids }: { ids: string[] }) {
  const q = useQuery({ queryKey: ['leads', 'queue', ids.join()], queryFn: () => run<Row[]>(supabase.from('leads').select('id,business_name,score,location,personalization,contact_name').in('id', ids.slice(0, 60))) })
  const [openId, setOpenId] = useState<string | null>(null)
  if (!q.data) return <Skeleton className="h-32" />
  return (
    <ul className="divide-y divide-border/60">{q.data.sort((a, b) => b.score - a.score).map((l) => (
      <li key={l.id} className="py-2.5">
        <button className="w-full flex items-center gap-3 text-left" onClick={() => setOpenId(openId === l.id ? null : l.id)}>
          <Badge tone={scoreTone(l.score)} className="num">{l.score}</Badge><span className="font-medium flex-1 truncate">{l.business_name}</span><span className="text-[12.5px] text-muted-foreground hidden sm:inline">{l.contact_name} · {l.location}</span>
          <ChevronDown className={cn('size-4 text-muted-foreground transition-transform', openId === l.id && 'rotate-180')} />
        </button>
        {openId === l.id && <ul className="mt-2 ml-12 space-y-1.5 text-[13px] text-muted-foreground">{(l.personalization || []).map((p: string, i: number) => <li key={i} className="flex gap-2"><span className="mt-2 size-1 rounded-full bg-primary shrink-0" />{p}</li>)}</ul>}
      </li>))}
    </ul>
  )
}

/* ---------- Replies inbox ---------- */
const INTENT: Record<string, { label: string; tone: any }> = { interested: { label: 'Interested', tone: 'success' }, question: { label: 'Question', tone: 'info' }, not_now: { label: 'Not now', tone: 'warning' }, negative: { label: 'Negative', tone: 'danger' } }
function RepliesInbox({ rows, loading, onOpen }: { rows?: Row[]; loading: boolean; onOpen: (id: string) => void }) {
  const [f, setF] = useState('all')
  const [book, setBook] = useState<Row | null>(null)
  const view = (rows || []).filter((r) => f === 'all' || r.intent === f)
  return (
    <div>
      <div className="mb-4"><ChevronFilter value={f} onChange={setF} items={[{ id: 'all', label: 'All', count: rows?.length ?? 0 }, ...Object.entries(INTENT).map(([id, s]) => ({ id, label: s.label, tone: s.tone, count: (rows || []).filter((r) => r.intent === id).length }))]} /></div>
      {loading ? <Skeleton className="h-60" /> : !view.length ? <Empty title="No replies" /> : (
        <div className="grid gap-3">{view.map((r) => (
          <div key={r.id} className="rounded-card bg-card border border-border/70 shadow-e1 p-4" data-reveal>
            <div className="flex flex-wrap items-center gap-2">
              <button className="font-semibold hover:underline" onClick={() => onOpen(r.lead_id)}>{r.leads?.business_name}</button>
              <Badge tone={INTENT[r.intent]?.tone || 'neutral'} dot>{INTENT[r.intent]?.label || humanize(r.intent)}</Badge>
              <StatusBadge map={LEAD_STATUS} value={r.leads?.status} />
              <span className="text-[12px] text-muted-foreground ml-auto">{humanize(r.channel)} · {ago(r.received_at)}</span>
            </div>
            <p className="mt-2 text-[14px]">{r.body}</p>
            {!['booked', 'converted'].includes(r.leads?.status) && <div className="flex gap-2 mt-3">
              <Button size="sm" onClick={() => setBook(r)}><CalendarPlus />Book call</Button>
              <Button size="sm" variant="outline" onClick={async () => { try { await rpc('convert_lead', { p_lead: r.lead_id }); await logActivity(`Converted ${r.leads?.business_name} to a client`, 'lead_converted', 'lead', r.lead_id); toast.success('Converted to client with full history') } catch (e: any) { toast.error(e.message) } }}><UserCheck />Convert to client</Button>
            </div>}
          </div>))}
        </div>)}
      {book && <BookCall lead={{ id: book.lead_id, business_name: book.leads?.business_name }} onClose={() => setBook(null)} />}
    </div>
  )
}

export function BookCall({ lead, onClose }: { lead: Row; onClose: () => void }) {
  const d = new Date(); d.setDate(d.getDate() + 1); d.setHours(10, 0, 0, 0)
  return (
    <RecordForm open onOpenChange={(v) => !v && onClose()} table="appointments" title={`Book discovery call: ${lead.business_name}`}
      fields={[{ name: 'starts_at', label: 'Date and time', type: 'datetime', required: true }, { name: 'meet_link', label: 'Google Meet link', placeholder: 'https://meet.google.com/...' }, { name: 'notes', label: 'Notes', type: 'textarea' }]}
      defaults={{ starts_at: d.toISOString(), lead_id: lead.id, title: `Discovery call: ${lead.business_name}`, type: 'discovery_call', status: 'booked', source: 'manual' }}
      transform={(v) => ({ ...v, lead_id: lead.id, title: `Discovery call: ${lead.business_name}`, type: 'discovery_call', status: 'booked', source: 'manual', ends_at: new Date(new Date(v.starts_at).getTime() + 45 * 6e4).toISOString() })}
      onSaved={async () => {
        await update('leads', lead.id, { status: 'booked' })
        await insert('deals', { lead_id: lead.id, title: `${lead.business_name} — Operations System`, stage: 'discovery', value_kes: 180000, probability: 30 })
        await logActivity(`Booked discovery call with ${lead.business_name}`, 'call_booked', 'lead', lead.id)
      }} />
  )
}

/* ---------- Campaigns ---------- */
function Campaigns() {
  const c = useList('campaigns', { order: ['created_at'] })
  const msgs = useList('outreach_messages', { select: 'campaign_id,status,lead_id', limit: 5000 })
  const rep = useList('replies', { select: 'lead_id', limit: 5000 })
  const booked = useList('appointments', { select: 'lead_id', filter: (b) => b.eq('type', 'discovery_call'), limit: 5000 })
  const [edit, setEdit] = useState<Row | null | undefined>(undefined)
  const stat = (id: string) => {
    const m = (msgs.data || []).filter((x) => x.campaign_id === id), leads = new Set(m.map((x) => x.lead_id))
    const sent = m.filter((x) => x.status !== 'queued').length
    const replied = (rep.data || []).filter((r) => leads.has(r.lead_id)).length
    return { sent, opened: m.filter((x) => ['delivered', 'replied'].includes(x.status)).length, replied, booked: (booked.data || []).filter((a) => leads.has(a.lead_id)).length, queued: m.filter((x) => x.status === 'queued').length }
  }
  return (
    <div>
      <div className="flex justify-end mb-3"><Button onClick={() => setEdit(null)}><Plus />New campaign</Button></div>
      <div className="grid lg:grid-cols-3 gap-4">{(c.data || []).map((x) => {
        const s = stat(x.id)
        return (
          <Card key={x.id} data-reveal title={x.name} sub={`${humanize(x.channel)} · ${(x.steps || []).length} steps · ${x.daily_limit}/day`} action={
            <Switch checked={x.status === 'active'} label="Active" tone="success" onChange={async (v) => { await update('campaigns', x.id, { status: v ? 'active' : 'paused' }); await logActivity(`${v ? 'Started' : 'Paused'} campaign ${x.name}`, 'campaign_' + (v ? 'started' : 'paused'), 'campaign', x.id); toast.success(v ? 'Campaign started' : 'Campaign paused') }} />}>
            <div className="grid grid-cols-4 gap-2 text-center">
              {[['Sent', s.sent], ['Opened', s.opened], ['Replied', s.replied], ['Booked', s.booked]].map(([k, v]) => <div key={k as string} className="rounded-[12px] bg-foreground/[.035] py-2.5"><div className="font-semibold num text-[18px]">{v}</div><div className="text-[11.5px] text-muted-foreground">{k}</div></div>)}
            </div>
            <div className="text-[12.5px] text-muted-foreground mt-3">Reply rate <span className="text-foreground font-medium num">{pct(s.replied, s.sent)}%</span> · booking rate <span className="text-foreground font-medium num">{pct(s.booked, s.sent)}%</span>{s.queued ? ` · ${s.queued} queued` : ''}</div>
            <ol className="mt-3 space-y-1.5">{(x.steps || []).map((st: Row) => <li key={st.step} className="flex gap-2 text-[13px]"><span className="size-5 rounded-full bg-foreground/[.07] grid place-items-center text-[11px] num shrink-0">{st.step}</span><span className="truncate">{st.subject || `${humanize(x.channel)} message`}</span><span className="ml-auto text-muted-foreground text-[12px] shrink-0">day {st.delay_days}</span></li>)}</ol>
            <Button size="sm" variant="ghost" className="mt-3 -ml-3" onClick={() => setEdit(x)}>Edit</Button>
          </Card>)
      })}</div>
      <RecordForm open={edit !== undefined} onOpenChange={(v) => !v && setEdit(undefined)} table="campaigns" initial={edit} title={edit ? 'Edit campaign' : 'New campaign'}
        fields={[{ name: 'name', label: 'Name', required: true, span: 2 }, { name: 'channel', label: 'Channel', type: 'select', options: [{ value: 'email', label: 'Email' }, { value: 'whatsapp', label: 'WhatsApp' }] }, { name: 'daily_limit', label: 'Daily limit', type: 'number' }]}
        defaults={{ channel: 'email', daily_limit: 20, status: 'paused', steps: [{ step: 1, delay_days: 0, subject: '{{agency}}: admin chaos to clean systems' }, { step: 2, delay_days: 3, subject: 'Quick idea for {{agency}}' }, { step: 3, delay_days: 7, subject: 'Close the loop?' }] }}
        activity={(v, n) => `${n ? 'Created' : 'Updated'} campaign ${v.name}`} />
    </div>
  )
}

/* ---------- Lead detail drawer ---------- */
function LeadDrawer({ id, onClose }: { id: string | null; onClose: () => void }) {
  const { can } = useAuth()
  const [edit, setEdit] = useState(false)
  const [booking, setBooking] = useState(false)
  const [dq, setDq] = useState(false)
  const [tab, setTab] = useState('dossier')
  const q = useQuery({
    queryKey: ['leads', 'detail', id], enabled: !!id,
    queryFn: async () => {
      const [l, msgs, reps, acts] = await Promise.all([
        run<Row>(supabase.from('leads').select('*').eq('id', id).single()),
        run<Row[]>(supabase.from('outreach_messages').select('*, campaigns(name)').eq('lead_id', id).order('created_at', { ascending: false })),
        run<Row[]>(supabase.from('replies').select('*').eq('lead_id', id).order('received_at', { ascending: false })),
        run<Row[]>(supabase.from('activities').select('*').eq('entity_id', id).order('created_at', { ascending: false }).limit(50)),
      ])
      return { l, msgs, reps, acts }
    },
  })
  const l = q.data?.l
  const act = async (fn: () => Promise<unknown>, msg: string) => { try { await fn(); toast.success(msg); q.refetch() } catch (e: any) { toast.error(e.message) } }
  return (
    <>
      <Sheet open={!!id} onOpenChange={(v) => !v && onClose()} width={640} title={l?.business_name || 'Lead'} description={l ? [l.location, l.licence_no, l.company_size && `${l.company_size} staff`].filter(Boolean).join(' · ') : undefined}>
        {!l ? <div className="p-6"><Skeleton className="h-64" /></div> : (
          <div className="p-6">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={scoreTone(l.score)} className="num">Score {l.score}</Badge><StatusBadge map={QUALITY} value={l.quality} /><StatusBadge map={LEAD_STATUS} value={l.status} /><Badge>{humanize(l.source)}</Badge>
            </div>
            <div className="grid sm:grid-cols-2 gap-3 mt-5 text-[13.5px]">
              {[[<UserCheck />, l.contact_name], [<Phone />, l.phone], [<Mail />, l.email], [<Globe />, l.website]].filter(([, v]) => v).map(([ic, v], i) => (
                <div key={i} className="flex items-center gap-2.5 rounded-[12px] bg-foreground/[.035] px-3 py-2.5 min-w-0 [&_svg]:size-4 [&_svg]:text-muted-foreground [&_svg]:shrink-0">{ic}<span className="truncate">{v as string}</span></div>
              ))}
            </div>
            {can('leads', 'edit') && <div className="flex flex-wrap gap-2 mt-5">
              <Button size="sm" variant="outline" onClick={() => setEdit(true)}>Edit</Button>
              <Button size="sm" variant="outline" onClick={() => act(() => sendCommand('enrich_lead', 'sage', { lead_id: l.id }, `Asked Sage to re-enrich ${l.business_name}`), 'Sage will re-enrich this lead')}><Sparkles />Re-enrich</Button>
              {!['queued', 'sent', 'replied', 'booked', 'converted', 'dead'].includes(l.status) && <Button size="sm" variant="outline" onClick={() => act(async () => { await update('leads', l.id, { status: 'queued' }); await logActivity(`Queued ${l.business_name} for outreach`, 'lead_queued', 'lead', l.id) }, 'Queued for outreach')}><Send />Queue</Button>}
              {!['booked', 'converted'].includes(l.status) && <Button size="sm" variant="outline" onClick={() => setBooking(true)}><CalendarPlus />Book call</Button>}
              {l.status !== 'converted' && <Button size="sm" onClick={() => act(async () => { await rpc('convert_lead', { p_lead: l.id }); await logActivity(`Converted ${l.business_name} to a client`, 'lead_converted', 'lead', l.id) }, 'Converted to client. Full history carried over.')}><UserCheck />Convert to client</Button>}
              {l.status !== 'dead' && l.status !== 'converted' && <Button size="sm" variant="danger-soft" onClick={() => setDq(true)}><Ban />Disqualify</Button>}
            </div>}
            <Tabs className="mt-6" value={tab} onChange={setTab} items={[{ id: 'dossier', label: 'Dossier' }, { id: 'outreach', label: 'Outreach', count: q.data!.msgs.length }, { id: 'replies', label: 'Replies', count: q.data!.reps.length }, { id: 'timeline', label: 'Timeline' }]}>
              <TabPanel id="dossier">
                {l.main_challenge && <Field label="Main challenge (from the website form)"><div className="rounded-[12px] bg-foreground/[.035] p-3 text-[14px]">{l.main_challenge}</div></Field>}
                <div className="mt-4 text-[13px] font-medium text-foreground/85">Research summary</div>
                <p className="mt-1.5 text-[14px] leading-relaxed">{l.dossier || <span className="text-muted-foreground">Not enriched yet. Trigger enrichment and Sage will research this agency.</span>}</p>
                {!!l.personalization?.length && <><div className="mt-5 text-[13px] font-medium text-foreground/85">Personalization lines</div>
                  <ul className="mt-2 space-y-2">{l.personalization.map((p: string, i: number) => <li key={i} className="rounded-[12px] bg-primary/[.08] px-3.5 py-2.5 text-[13.5px]">{p}</li>)}</ul></>}
                <div className="grid grid-cols-3 gap-3 mt-5 text-[13px]">
                  <div><div className="text-muted-foreground text-[12px]">Scraped</div>{fmtDate(l.scraped_at || l.created_at)}</div>
                  <div><div className="text-muted-foreground text-[12px]">Enriched</div>{fmtDate(l.enriched_at)}</div>
                  <div><div className="text-muted-foreground text-[12px]">Last contact</div>{fmtDate(l.last_contacted_at)}</div>
                </div>
              </TabPanel>
              <TabPanel id="outreach">
                {q.data!.msgs.length ? <div className="space-y-3">{q.data!.msgs.map((m) => (
                  <div key={m.id} className="rounded-[14px] bg-foreground/[.035] p-3.5">
                    <div className="flex items-center gap-2 text-[12.5px]"><Badge tone="info">{humanize(m.channel)} step {m.step}</Badge><Badge tone={m.status === 'replied' ? 'success' : m.status === 'queued' ? 'warning' : 'neutral'} dot>{humanize(m.status)}</Badge><span className="ml-auto text-muted-foreground">{m.sent_at ? fmtDT(m.sent_at) : 'Not sent'}</span></div>
                    {m.subject && <div className="font-medium mt-2 text-[13.5px]">{m.subject}</div>}
                    <p className="text-[13px] text-muted-foreground mt-1 line-clamp-4">{m.body}</p>
                  </div>))}</div> : <Empty title="No outreach yet" />}
              </TabPanel>
              <TabPanel id="replies">
                {q.data!.reps.length ? q.data!.reps.map((r) => <div key={r.id} className="rounded-[14px] bg-foreground/[.035] p-3.5 mb-2"><div className="flex gap-2 items-center text-[12.5px]"><Badge tone={INTENT[r.intent]?.tone} dot>{INTENT[r.intent]?.label || r.intent}</Badge><span className="ml-auto text-muted-foreground">{fmtDT(r.received_at)}</span></div><p className="mt-2 text-[14px]">{r.body}</p></div>) : <Empty title="No replies yet" />}
              </TabPanel>
              <TabPanel id="timeline"><ActivityList items={q.data!.acts} max={50} /></TabPanel>
            </Tabs>
          </div>
        )}
      </Sheet>
      {l && <RecordForm open={edit} onOpenChange={setEdit} table="leads" initial={l} title="Edit lead" fields={LEAD_FIELDS} onSaved={() => q.refetch()} activity={(v) => `Updated lead ${v.business_name}`} />}
      {l && booking && <BookCall lead={l} onClose={() => { setBooking(false); q.refetch() }} />}
      {l && <DisqualifyDialog open={dq} onOpenChange={setDq} lead={l} onDone={() => q.refetch()} />}
    </>
  )
}

function DisqualifyDialog({ open, onOpenChange, lead, onDone }: { open: boolean; onOpenChange: (v: boolean) => void; lead: Row; onDone: () => void }) {
  const [reason, setReason] = useState('')
  return (
    <Confirm open={open} onOpenChange={onOpenChange} title={`Disqualify ${lead.business_name}?`} confirm="Disqualify" danger
      body={<div className="grid gap-3"><span>Herald will never contact this lead again.</span><Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason (optional)" /></div>}
      onConfirm={async () => { await update('leads', lead.id, { status: 'dead' }); await logActivity(`Disqualified ${lead.business_name}${reason ? `: ${reason}` : ''}`, 'lead_disqualified', 'lead', lead.id); toast.success('Lead disqualified'); onOpenChange(false); onDone() }} />
  )
}