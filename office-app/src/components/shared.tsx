// Cross-module building blocks: funnel, activity feed, 360 shell, Client 360 (Customers, 5 tabs + NAIM extras),
// Appointment 360 (exactly 3 tabs: Services, Notes, Timeline), Invoice 360 + branded PDF, record-payment dialog.
import { useMemo, useRef, useState, type ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  Bot, CalendarCheck, CalendarClock, ChevronRight, CircleDollarSign, FileSignature, FileText, Handshake, Mail, MessageSquare,
  Phone, Printer, Radar, ReceiptText, Send, Sparkles, UserRound, Download, CreditCard, Wallet,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { run, insert, update, logActivity, useList, type Row } from '@/services/db'
import { ago, cn, fmtDate, fmtDT, fmtTime, humanize, kes, pct, sum } from '@/lib/utils'
import { useGrow } from '@/lib/motion'
import { APPT_STATUS, INVOICE_STATUS, PAY_METHODS, PROJECT_STATUS, dealStage, methodLabel } from '@/lib/status'
import { Avatar, Badge, Button, Dialog, Empty, Field, Input, Progress, Select, Skeleton, StatusBadge, TabPanel, Tabs, Textarea, type Tone } from './ui'

/* ---------------- Funnel (Lead Engine pattern, conversion % between every stage) ---------------- */
const FUNNEL_TONES: Tone[] = ['neutral', 'info', 'teal', 'brand', 'success', 'violet', 'warning']
export function Funnel({ stages, compact }: { stages: { label: string; count: number }[]; compact?: boolean }) {
  const root = useRef<HTMLDivElement>(null)
  const max = Math.max(1, ...stages.map((s) => s.count))
  useGrow(root, '[data-bar]', [stages.map((s) => s.count).join(',')])
  return (
    <div ref={root} className="overflow-x-auto scroll-thin">
      <div className={cn('flex items-stretch min-w-[640px]', compact ? 'gap-1' : 'gap-1.5')}>
        {stages.map((s, i) => {
          const prev = stages[i - 1]?.count
          return (
            <div key={s.label} className="flex items-stretch flex-1 min-w-0">
              {i > 0 && (
                <div className="flex flex-col items-center justify-center px-1.5 text-muted-foreground shrink-0">
                  <span className="text-[11.5px] font-medium num">{prev ? `${pct(s.count, prev)}%` : '—'}</span>
                  <ChevronRight className="size-4 opacity-50" />
                </div>
              )}
              <div className={cn('tone-' + FUNNEL_TONES[i % FUNNEL_TONES.length], 'flex-1 min-w-0 rounded-[14px] bg-foreground/[.03] p-3')}>
                <div className="ink text-[26px] font-semibold num leading-none">{s.count.toLocaleString('en-KE')}</div>
                <div className="mt-2 h-1.5 rounded-full bg-foreground/[.07] overflow-hidden"><div data-bar className="fill-tone h-full rounded-full" style={{ width: `${Math.max(4, (s.count / max) * 100)}%` }} /></div>
                <div className="mt-2 text-[12px] text-muted-foreground truncate">{s.label}</div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/** Cumulative pipeline counts from lead statuses (a lead at "booked" has passed every earlier stage). */
export const LEAD_PIPE = ['new', 'enriched', 'queued', 'sent', 'replied', 'booked', 'converted']
export function cumulativeFunnel(leads: Row[]) {
  const labels = ['Scraped', 'Enriched', 'Qualified', 'Outreach', 'Replied', 'Call booked', 'Won']
  const idx = (s: string) => LEAD_PIPE.indexOf(s)
  return LEAD_PIPE.map((_, i) => ({ label: labels[i], count: leads.filter((l) => idx(l.status) >= i).length }))
}

/* ---------------- Activity feed ---------------- */
const VERB: Record<string, { icon: any; tone: Tone; label: string }> = {
  lead_created: { icon: Radar, tone: 'neutral', label: 'Lead' }, lead_enriched: { icon: Sparkles, tone: 'info', label: 'Enriched' },
  outreach_sent: { icon: Send, tone: 'teal', label: 'Outreach' }, reply_received: { icon: MessageSquare, tone: 'success', label: 'Reply' },
  call_booked: { icon: CalendarCheck, tone: 'violet', label: 'Call booked' }, deal_won: { icon: Handshake, tone: 'brand', label: 'Deal won' },
  document_signed: { icon: FileSignature, tone: 'violet', label: 'Signed' }, payment_received: { icon: CircleDollarSign, tone: 'success', label: 'Payment' },
  project_delivered: { icon: Sparkles, tone: 'brand', label: 'Delivered' }, hermes_command: { icon: Bot, tone: 'info', label: 'Command' },
  routine_success: { icon: Bot, tone: 'success', label: 'Hermes' }, routine_failed: { icon: Bot, tone: 'danger', label: 'Hermes' }, routine_skipped: { icon: Bot, tone: 'warning', label: 'Hermes' },
}
export const verbMeta = (v: string) => VERB[v] || { icon: FileText, tone: 'neutral' as Tone, label: humanize(v.split('_')[0]) }

export function ActivityList({ items, loading, max = 12, empty = 'No activity yet' }: { items?: Row[]; loading?: boolean; max?: number; empty?: string }) {
  if (loading) return <div className="space-y-3">{[0, 1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-10" />)}</div>
  if (!items?.length) return <Empty title={empty} />
  return (
    <ol className="relative">
      {items.slice(0, max).map((a, i) => {
        const m = verbMeta(a.verb)
        return (
          <li key={a.id ?? i} className="flex gap-3 py-2.5 group">
            <span className={cn('tone-' + m.tone, 'chip size-8 rounded-full grid place-items-center shrink-0 [&_svg]:size-4')}><m.icon /></span>
            <div className="min-w-0 flex-1">
              <div className="text-[13.5px] leading-snug">{a.summary}</div>
              <div className="text-[12px] text-muted-foreground mt-0.5 flex items-center gap-2">
                <span className={cn('tone-' + m.tone, 'ink font-medium')}>{m.label}</span><span>{a.actor_name}</span><span>{ago(a.created_at)}</span>
              </div>
            </div>
          </li>
        )
      })}
    </ol>
  )
}

/* ---------------- 360 shell: left profile panel + tabbed right panel ---------------- */
export function Shell360({ open, onOpenChange, icon, title, badge, rows, actions, tabs, tab, setTab, children }: {
  open: boolean; onOpenChange: (v: boolean) => void; icon: ReactNode; title: string; badge?: ReactNode; rows: [string, ReactNode][]
  actions?: ReactNode; tabs: { id: string; label: string; count?: number }[]; tab: string; setTab: (t: string) => void; children: ReactNode
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange} size="xl" title={<span className="inline-flex items-center gap-2">{title}<span className="text-[14px] font-sans font-normal text-muted-foreground">360 View</span></span>}>
      <div className="grid lg:grid-cols-[300px_1fr] gap-6">
        <aside className="rounded-panel bg-foreground/[.035] p-5 h-max">
          <div className="flex flex-col items-center text-center">
            <div className="size-16 rounded-full bg-foreground text-background grid place-items-center [&_svg]:size-7">{icon}</div>
            <div className="mt-3 font-semibold text-[16px] leading-tight">{title}</div>
            {badge && <div className="mt-2">{badge}</div>}
          </div>
          <dl className="mt-5 divide-y divide-border/70 text-[13px]">
            {rows.map(([k, v]) => (
              <div key={k} className="flex justify-between gap-3 py-2"><dt className="text-muted-foreground shrink-0">{k}</dt><dd className="font-medium text-right min-w-0 break-words">{v ?? '—'}</dd></div>
            ))}
          </dl>
          {actions && <div className="mt-4 grid gap-2">{actions}</div>}
        </aside>
        <div className="min-w-0">
          <Tabs value={tab} onChange={setTab} items={tabs}>{children}</Tabs>
        </div>
      </div>
    </Dialog>
  )
}

const MiniTable = ({ head, rows, empty }: { head: string[]; rows: ReactNode[][]; empty: string }) =>
  rows.length ? (
    <div className="overflow-x-auto scroll-thin rounded-[14px] border border-border/70">
      <table className="w-full text-[13px]">
        <thead><tr className="bg-foreground/[.025] text-muted-foreground">{head.map((h, i) => <th key={h} className={cn('text-left font-medium px-3 h-9 whitespace-nowrap', i === head.length - 1 && 'text-right')}>{h}</th>)}</tr></thead>
        <tbody>{rows.map((r, i) => <tr key={i} className="border-t border-border/60">{r.map((c, j) => <td key={j} className={cn('px-3 py-2.5', j === r.length - 1 && 'text-right num')}>{c}</td>)}</tr>)}</tbody>
      </table>
    </div>
  ) : <Empty title={empty} />

/* ---------------- CLIENT 360 (Customers page): Visits · Invoices · Memberships · Packages · Preferences (+ Deals & projects, Documents, Timeline) ---------------- */
export function Client360({ id, onOpenChange }: { id: string | null; onOpenChange: (v: boolean) => void }) {
  const [tab, setTab] = useState('visits')
  const [inv, setInv] = useState<string | null>(null)
  const q = useQuery({
    queryKey: ['client360', id], enabled: !!id,
    queryFn: async () => {
      const [c, appts, invoices, subs, pkgs, deals, projects, docs, acts, tasks] = await Promise.all([
        run(supabase.from('clients').select('*').eq('id', id).single()),
        run(supabase.from('appointments').select('*, staff(full_name)').eq('client_id', id).order('starts_at', { ascending: false })),
        run(supabase.from('invoices').select('*').eq('client_id', id).is('deleted_at', null).order('issued_at', { ascending: false })),
        run(supabase.from('subscriptions').select('*, membership_plans(name,color,benefits)').eq('client_id', id).order('started_at', { ascending: false })),
        run(supabase.from('client_packages').select('*, packages(name,items)').eq('client_id', id)),
        run(supabase.from('deals').select('*').eq('client_id', id).is('deleted_at', null)),
        run(supabase.from('projects').select('*').eq('client_id', id).is('deleted_at', null)),
        run(supabase.from('documents').select('*').eq('client_id', id).is('deleted_at', null).order('created_at', { ascending: false })),
        run(supabase.from('activities').select('*').eq('entity_id', id).order('created_at', { ascending: false }).limit(60)),
        run(supabase.from('tasks').select('*').eq('entity_id', id).is('deleted_at', null)),
      ])
      let leadActs: Row[] = []
      if ((c as Row).lead_id) leadActs = await run(supabase.from('activities').select('*').eq('entity_id', (c as Row).lead_id).order('created_at', { ascending: false }).limit(60))
      const invIds = (invoices as Row[]).map((i) => i.id)
      const invActs = invIds.length ? await run<Row[]>(supabase.from('activities').select('*').in('entity_id', invIds).limit(60)) : []
      const timeline = [...(acts as Row[]), ...leadActs, ...invActs].sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at))
      return { c: c as Row, appts: appts as Row[], invoices: invoices as Row[], subs: subs as Row[], pkgs: pkgs as Row[], deals: deals as Row[], projects: projects as Row[], docs: docs as Row[], timeline, tasks: tasks as Row[] }
    },
  })
  const d = q.data
  const c = d?.c
  const ltv = sum(d?.invoices, 'paid_kes'), due = sum(d?.invoices?.filter((i) => i.status !== 'void'), (i) => i.total_kes - i.paid_kes)
  const health = c?.health ?? 0
  const healthTone: Tone = health >= 75 ? 'success' : health >= 50 ? 'warning' : 'danger'
  return (
    <>
      <Shell360 open={!!id} onOpenChange={onOpenChange} icon={<UserRound />} title={c?.business_name || 'Loading'} tab={tab} setTab={setTab}
        badge={c && <div className="flex gap-1.5 justify-center"><Badge tone={healthTone} dot>{health >= 75 ? 'Active' : health >= 50 ? 'At risk' : 'Churn risk'}</Badge><Badge tone="brand">{humanize(c.tier)}</Badge></div>}
        rows={c ? [
          ['Contact', c.contact_name], ['Mobile', c.phone], ['Email', c.email], ['Location', c.location], ['Licence', c.licence_no], ['Size', c.company_size],
          ['Health', `${health}/100`], ['Lifetime paid', kes(ltv)], ['Outstanding', kes(due)], ['Client since', fmtDate(c.created_at)], ['Source', humanize(c.source)],
        ] : []}
        actions={c && <>
          {c.phone && <Button variant="outline" size="sm" onClick={() => window.open(`https://wa.me/${String(c.phone).replace(/\D/g, '')}`, '_blank')}><Phone />WhatsApp</Button>}
          {c.email && <Button variant="outline" size="sm" onClick={() => window.open(`mailto:${c.email}`)}><Mail />Email</Button>}
        </>}
        tabs={[
          { id: 'visits', label: 'Visits', count: d?.appts.length }, { id: 'invoices', label: 'Invoices', count: d?.invoices.length },
          { id: 'memberships', label: 'Memberships', count: d?.subs.length }, { id: 'packages', label: 'Packages', count: d?.pkgs.length },
          { id: 'preferences', label: 'Preferences' }, { id: 'deals', label: 'Deals & projects', count: (d?.deals.length || 0) + (d?.projects.length || 0) },
          { id: 'documents', label: 'Documents', count: d?.docs.length }, { id: 'timeline', label: 'Timeline' },
        ]}>
        {!d ? <Skeleton className="h-60 mt-4" /> : <>
          <TabPanel id="visits">
            <div className="grid grid-cols-3 gap-3 mb-4">
              <MiniStat label="Total visits" value={d.appts.length} /><MiniStat label="Completed" value={d.appts.filter((a) => a.status === 'completed').length} />
              <MiniStat label="Last visit" value={fmtDate(d.appts.find((a) => new Date(a.starts_at) < new Date())?.starts_at)} />
            </div>
            <MiniTable head={['Date', 'Visit', 'With', 'Status', 'Value']} empty="No visits yet"
              rows={d.appts.map((a) => [fmtDT(a.starts_at), a.title, a.staff?.full_name || '—', <StatusBadge map={APPT_STATUS} value={a.status} />, kes(sum(a.services || [], 'price_kes'))])} />
          </TabPanel>
          <TabPanel id="invoices">
            <div className="grid grid-cols-3 gap-3 mb-4"><MiniStat label="Billed" value={kes(sum(d.invoices, 'total_kes'))} /><MiniStat label="Paid" value={kes(ltv)} /><MiniStat label="Outstanding" value={kes(due)} /></div>
            <MiniTable head={['Invoice', 'Type', 'Issued', 'Status', 'Total']} empty="No invoices yet"
              rows={d.invoices.map((i) => [<button className="font-medium text-brand-strong hover:underline" onClick={() => setInv(i.id)}>{i.number}</button>, humanize(i.type), fmtDate(i.issued_at), <StatusBadge map={INVOICE_STATUS} value={i.status} />, kes(i.total_kes)])} />
          </TabPanel>
          <TabPanel id="memberships">
            {d.subs.length ? <div className="grid sm:grid-cols-2 gap-3">{d.subs.map((s) => (
              <div key={s.id} className="rounded-card bg-foreground/[.035] p-4">
                <div className="flex items-center justify-between"><div className="font-semibold">{s.membership_plans?.name}</div><Badge tone={s.status === 'active' ? 'success' : 'danger'} dot>{humanize(s.status)}</Badge></div>
                <div className="text-[22px] font-semibold num mt-2">{kes(s.amount_kes)}<span className="text-[13px] text-muted-foreground font-normal"> / {s.billing_cycle === 'yearly' ? 'year' : 'month'}</span></div>
                <div className="text-[12.5px] text-muted-foreground mt-1">Since {fmtDate(s.started_at)} · next due {fmtDate(s.next_due)}</div>
                <ul className="mt-3 space-y-1 text-[13px]">{(s.membership_plans?.benefits || []).map((b: string) => <li key={b} className="flex gap-2"><span className="mt-2 size-1 rounded-full bg-foreground/40" />{b}</li>)}</ul>
              </div>))}</div> : <Empty title="No care plan yet" body="Sell a care plan from the Care Plans module to start recurring revenue." />}
          </TabPanel>
          <TabPanel id="packages">
            {d.pkgs.length ? <div className="space-y-3">{d.pkgs.map((p) => (
              <div key={p.id} className="rounded-card bg-foreground/[.035] p-4">
                <div className="flex items-center justify-between gap-3"><div className="font-semibold">{p.packages?.name}</div><Badge tone={p.status === 'active' ? 'success' : 'neutral'} dot>{humanize(p.status)}</Badge></div>
                <div className="flex items-center gap-3 mt-3"><Progress value={pct(p.sessions_used, p.sessions_total)} className="flex-1" /><span className="text-[13px] num">{p.sessions_used}/{p.sessions_total} used</span></div>
                <div className="text-[12.5px] text-muted-foreground mt-2">Bought {fmtDate(p.purchased_at)} · expires {fmtDate(p.expires_at)}</div>
              </div>))}</div> : <Empty title="No packages" />}
          </TabPanel>
          <TabPanel id="preferences"><ClientPreferences c={c!} /></TabPanel>
          <TabPanel id="deals">
            <div className="space-y-2 mb-5">{d.deals.map((x) => (
              <div key={x.id} className="flex items-center justify-between gap-3 rounded-[14px] bg-foreground/[.035] px-4 py-3">
                <div className="min-w-0"><div className="font-medium truncate">{x.title}</div><div className="text-[12.5px] text-muted-foreground">Close {fmtDate(x.won_at || x.expected_close)}</div></div>
                <div className="flex items-center gap-3"><Badge tone={dealStage(x.stage).tone} dot>{dealStage(x.stage).label}</Badge><span className="num font-medium">{kes(x.value_kes)}</span></div>
              </div>))}{!d.deals.length && <Empty title="No deals" />}</div>
            {d.projects.map((p) => (
              <div key={p.id} className="rounded-[14px] bg-foreground/[.035] px-4 py-3 mb-2">
                <div className="flex items-center justify-between gap-3"><div className="font-medium">{p.name}</div><StatusBadge map={PROJECT_STATUS} value={p.status} /></div>
                <div className="flex items-center gap-3 mt-2"><Progress value={p.progress} className="flex-1" /><span className="text-[12.5px] num">{p.progress}%</span></div>
              </div>))}
          </TabPanel>
          <TabPanel id="documents">
            <MiniTable head={['Document', 'Source', 'Date', 'Status']} empty="No documents"
              rows={d.docs.map((x) => [<span className="inline-flex items-center gap-2"><FileSignature className="size-4 text-muted-foreground" />{x.name}</span>, humanize(x.source), fmtDate(x.signed_at || x.created_at), <Badge tone={x.status === 'signed' ? 'success' : 'neutral'} dot>{humanize(x.status)}</Badge>])} />
          </TabPanel>
          <TabPanel id="timeline"><ActivityList items={d.timeline} max={60} empty="No history yet" /></TabPanel>
        </>}
      </Shell360>
      <Invoice360 id={inv} onOpenChange={(v) => !v && setInv(null)} />
    </>
  )
}
const MiniStat = ({ label, value }: { label: string; value: ReactNode }) => (
  <div className="rounded-[14px] bg-foreground/[.035] px-3.5 py-3 min-w-0"><div className="text-[12px] text-muted-foreground">{label}</div><div className="font-semibold num mt-0.5 truncate">{value}</div></div>
)

function ClientPreferences({ c }: { c: Row }) {
  const [notes, setNotes] = useState(c.notes || '')
  const [tags, setTags] = useState((c.tags || []).join(', '))
  const [birthday, setBirthday] = useState(c.birthday || '')
  const [busy, setBusy] = useState(false)
  return (
    <div className="grid gap-4 max-w-[640px]">
      <Field label="Notes & preferences" hint="How they like to be contacted, decision makers, sensitivities."><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="min-h-[140px]" /></Field>
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Tags"><Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="vip, whatsapp-first" /></Field>
        <Field label="Director's birthday"><Input type="date" value={birthday} onChange={(e) => setBirthday(e.target.value)} /></Field>
      </div>
      <div><Button loading={busy} onClick={async () => {
        setBusy(true)
        try { await update('clients', c.id, { notes, tags: tags.split(',').map((t: string) => t.trim()).filter(Boolean), birthday: birthday || null }); toast.success('Preferences saved') }
        catch (e: any) { toast.error(e.message) } finally { setBusy(false) }
      }}>Save preferences</Button></div>
    </div>
  )
}

/* ---------------- APPOINTMENT 360 (Appointments page): exactly Services · Notes · Timeline ---------------- */
export function Appointment360({ id, onOpenChange, onEdit }: { id: string | null; onOpenChange: (v: boolean) => void; onEdit?: (a: Row) => void }) {
  const [tab, setTab] = useState('services')
  const q = useQuery({
    queryKey: ['appointments', 'a360', id], enabled: !!id,
    queryFn: async () => {
      const a = await run<Row>(supabase.from('appointments').select('*, staff(full_name), clients(business_name, phone), leads(business_name, phone)').eq('id', id).single())
      const acts = await run<Row[]>(supabase.from('activities').select('*').in('entity_id', [a.id, a.client_id, a.lead_id].filter(Boolean)).order('created_at', { ascending: false }).limit(40))
      return { a, acts }
    },
  })
  const a = q.data?.a
  const who = a?.clients?.business_name || a?.leads?.business_name || a?.title
  const [note, setNote] = useState('')
  const setStatus = async (status: string) => {
    await update('appointments', a!.id, { status }); await logActivity(`${who}: appointment ${humanize(status).toLowerCase()}`, 'appointment_' + status, 'appointment', a!.id)
    if (status === 'no_show') await insert('tasks', { title: `Follow up no-show: ${who}`, priority: 'urgent', status: 'todo', due_at: new Date().toISOString(), entity_type: a!.client_id ? 'client' : 'lead', entity_id: a!.client_id || a!.lead_id, created_by_kind: 'system', created_by: 'No-show rule' })
    toast.success(status === 'no_show' ? 'Marked no-show. Follow-up task created.' : 'Status updated'); q.refetch()
  }
  const total = sum(a?.services || [], 'price_kes')
  return (
    <Shell360 open={!!id} onOpenChange={onOpenChange} icon={<CalendarCheck />} title={a ? `${who}${a.queue_no ? ` · #${a.queue_no}` : ''}` : 'Loading'} tab={tab} setTab={setTab}
      badge={a && <StatusBadge map={APPT_STATUS} value={a.status} />}
      rows={a ? [['Date', fmtDate(a.starts_at)], ['Time', `${fmtTime(a.starts_at)}–${fmtTime(a.ends_at)}`], ['With', a.staff?.full_name], ['Type', humanize(a.type)],
        ['Source', humanize(a.source)], ['Meet link', a.meet_link ? <a href={a.meet_link} target="_blank" rel="noreferrer" className="text-brand-strong hover:underline">Join</a> : '—'], ['Booked on', fmtDT(a.created_at)]] : []}
      actions={a && <>
        <div className="grid grid-cols-2 gap-2">
          {a.status !== 'checked_in' && a.status !== 'completed' && <Button size="sm" variant="outline" onClick={() => setStatus('checked_in')}>Check in</Button>}
          {a.status !== 'completed' && <Button size="sm" variant="success" onClick={() => setStatus('completed')}>Complete</Button>}
          {!['completed', 'no_show'].includes(a.status) && <Button size="sm" variant="danger-soft" onClick={() => setStatus('no_show')}>No-show</Button>}
          {!['completed', 'cancelled'].includes(a.status) && <Button size="sm" variant="ghost" onClick={() => setStatus('cancelled')}>Cancel</Button>}
        </div>
        {onEdit && <Button size="sm" variant="outline" onClick={() => onEdit(a)}>Edit appointment</Button>}
      </>}
      tabs={[{ id: 'services', label: 'Services', count: a?.services?.length }, { id: 'notes', label: 'Notes' }, { id: 'timeline', label: 'Timeline' }]}>
      {!a ? <Skeleton className="h-60 mt-4" /> : <>
        <TabPanel id="services">
          <MiniTable head={['Service', 'Duration', 'Price']} empty="No services on this appointment"
            rows={(a.services || []).map((s: Row) => [s.name, `${s.duration_min || 0} min`, kes(s.price_kes)])} />
          <div className="flex justify-end mt-3 text-[14px]"><span className="text-muted-foreground mr-3">Total</span><span className="font-semibold num">{kes(total)}</span></div>
        </TabPanel>
        <TabPanel id="notes">
          <div className="rounded-card bg-foreground/[.035] p-4 text-[14px] whitespace-pre-wrap min-h-[80px]">{a.notes || <span className="text-muted-foreground">No notes yet.</span>}</div>
          <div className="mt-4 grid gap-2">
            <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add a note" />
            <div><Button size="sm" disabled={!note.trim()} onClick={async () => {
              await update('appointments', a.id, { notes: [a.notes, `${fmtDT(new Date())}: ${note.trim()}`].filter(Boolean).join('\n') }); setNote(''); q.refetch(); toast.success('Note added')
            }}>Add note</Button></div>
          </div>
        </TabPanel>
        <TabPanel id="timeline"><ActivityList items={q.data?.acts} max={40} /></TabPanel>
      </>}
    </Shell360>
  )
}

/* ---------------- INVOICE 360: Items · Payments · Tips & Commissions · Stock posted ---------------- */
export function Invoice360({ id, onOpenChange }: { id: string | null; onOpenChange: (v: boolean) => void }) {
  const [tab, setTab] = useState('items')
  const [pay, setPay] = useState(false)
  const q = useQuery({
    queryKey: ['invoices', 'i360', id], enabled: !!id,
    queryFn: async () => {
      const i = await run<Row>(supabase.from('invoices').select('*, clients(business_name, contact_name, phone, email, location), staff(full_name)').eq('id', id).single())
      const [payments, comms] = await Promise.all([
        run<Row[]>(supabase.from('payments').select('*, staff:received_by(full_name)').eq('invoice_id', id).order('paid_at')),
        run<Row[]>(supabase.from('commissions').select('*, staff(full_name)').eq('invoice_id', id)),
      ])
      return { i, payments, comms }
    },
  })
  const i = q.data?.i
  const out = i ? Number(i.total_kes) - Number(i.paid_kes) : 0
  const items: Row[] = i?.line_items || []
  return (
    <>
      <Shell360 open={!!id} onOpenChange={onOpenChange} icon={<ReceiptText />} title={i?.number || 'Loading'} tab={tab} setTab={setTab}
        badge={i && <StatusBadge map={INVOICE_STATUS} value={i.status} />}
        rows={i ? [['Client', i.clients?.business_name || 'Walk-in'], ['Type', humanize(i.type)], ['Issued', fmtDate(i.issued_at)], ['Due', fmtDate(i.due_date)],
          ['Subtotal', kes(i.subtotal_kes)], ['Discount', kes(i.discount_kes)], ['Tax', kes(i.tax_kes)], ['Tip', kes(i.tip_kes)], ['Total', kes(i.total_kes)], ['Paid', kes(i.paid_kes)], ['Balance', kes(out)]] : []}
        actions={i && <>
          {out > 0 && i.status !== 'void' && <Button size="sm" onClick={() => setPay(true)}><CreditCard />Record payment</Button>}
          <div className="grid grid-cols-2 gap-2">
            <Button size="sm" variant="outline" onClick={() => invoicePdf(i, q.data!.payments)}><Download />PDF</Button>
            <Button size="sm" variant="outline" onClick={() => invoicePdf(i, q.data!.payments, true)}><Printer />Print</Button>
          </div>
          {i.status === 'draft' && <Button size="sm" variant="soft" onClick={async () => { await update('invoices', i.id, { status: 'sent' }); q.refetch(); toast.success('Marked as sent') }}><Send />Mark as sent</Button>}
        </>}
        tabs={[{ id: 'items', label: 'Items', count: items.length }, { id: 'payments', label: 'Payments', count: q.data?.payments.length }, { id: 'tips', label: 'Tips & Commissions' }, { id: 'stock', label: 'Stock posted' }]}>
        {!i ? <Skeleton className="h-60 mt-4" /> : <>
          <TabPanel id="items">
            <MiniTable head={['Item', 'Kind', 'Qty', 'Unit', 'Amount']} empty="No line items"
              rows={items.map((li) => [li.name, humanize(li.kind), li.qty, kes(li.unit_price_kes), kes(li.qty * li.unit_price_kes)])} />
          </TabPanel>
          <TabPanel id="payments">
            <MiniTable head={['Date', 'Method', 'Reference', 'Received by', 'Amount']} empty="No payments yet"
              rows={q.data!.payments.map((p) => [fmtDT(p.paid_at), methodLabel(p.method), <span className="font-mono text-[12px]">{p.reference || '—'}</span>, p.staff?.full_name || '—', kes(p.amount_kes)])} />
          </TabPanel>
          <TabPanel id="tips">
            <div className="grid grid-cols-2 gap-3 mb-4"><MiniStat label="Tip on invoice" value={kes(i.tip_kes)} /><MiniStat label="Commission" value={kes(sum(q.data!.comms, 'amount_kes'))} /></div>
            <MiniTable head={['Staff', 'Kind', 'Status', 'Amount']} empty="No commissions on this invoice"
              rows={q.data!.comms.map((c) => [c.staff?.full_name, humanize(c.kind), <Badge tone={c.status === 'paid' ? 'success' : 'warning'} dot>{humanize(c.status)}</Badge>, kes(c.amount_kes)])} />
          </TabPanel>
          <TabPanel id="stock">
            <MiniTable head={['Product', 'Qty out', 'Unit price']} empty="No stock was posted by this invoice"
              rows={items.filter((li) => li.kind === 'product').map((li) => [li.name, li.qty, kes(li.unit_price_kes)])} />
          </TabPanel>
        </>}
      </Shell360>
      {i && <PaymentDialog open={pay} onOpenChange={setPay} invoice={i} onDone={() => q.refetch()} />}
    </>
  )
}

export function PaymentDialog({ open, onOpenChange, invoice, onDone }: { open: boolean; onOpenChange: (v: boolean) => void; invoice: Row; onDone?: () => void }) {
  const out = Number(invoice.total_kes) - Number(invoice.paid_kes)
  const [amount, setAmount] = useState(String(out))
  const [method, setMethod] = useState('mpesa')
  const [ref, setRef] = useState('')
  const [busy, setBusy] = useState(false)
  const { data: till = [] } = useList('till_sessions', { filter: (b) => b.eq('status', 'open'), limit: 1 })
  return (
    <Dialog open={open} onOpenChange={onOpenChange} size="sm" title="Record payment" description={`${invoice.number} · balance ${kes(out)}`}
      footer={<><Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button loading={busy} onClick={async () => {
        const a = Number(amount)
        if (!(a > 0)) return toast.error('Enter an amount')
        if (method === 'mpesa' && !ref.trim()) return toast.error('Enter the M-PESA confirmation code')
        setBusy(true)
        try {
          await insert('payments', { invoice_id: invoice.id, amount_kes: a, method, reference: ref.trim() || null, paid_at: new Date().toISOString(), till_session_id: method === 'cash' ? till[0]?.id ?? null : null })
          await logActivity(`${kes(a)} received via ${methodLabel(method)} on ${invoice.number}`, 'payment_received', 'invoice', invoice.id, { amount_kes: a })
          toast.success('Payment recorded. Invoice status updated.'); onOpenChange(false); onDone?.()
        } catch (e: any) { toast.error(e.message) } finally { setBusy(false) }
      }}>Record {kes(Number(amount) || 0)}</Button></>}>
      <div className="grid gap-4">
        <Field label="Amount (KES)"><Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} /></Field>
        <Field label="Method"><Select value={method} onChange={setMethod} options={PAY_METHODS} /></Field>
        <Field label={method === 'mpesa' ? 'M-PESA confirmation code' : 'Reference'} hint={method === 'cash' && !till.length ? 'No till is open. Cash will not be linked to a till session.' : undefined}>
          <Input value={ref} onChange={(e) => setRef(e.target.value.toUpperCase())} placeholder={method === 'mpesa' ? 'e.g. SJK3H7Q2LM' : 'Optional'} />
        </Field>
      </div>
    </Dialog>
  )
}

/* ---------------- Branded invoice PDF (jsPDF) ---------------- */
export async function invoicePdf(i: Row, payments: Row[] = [], print = false) {
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([import('jspdf'), import('jspdf-autotable')])
  const { data: settings } = await supabase.from('app_settings').select('key,value')
  const S: Row = Object.fromEntries((settings || []).map((s: Row) => [s.key, s.value]))
  const co = S.company || {}, bank = S.banking || {}, invS = S.invoice || {}
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const W = doc.internal.pageSize.getWidth()
  const gold: [number, number, number] = [200, 162, 74], esp: [number, number, number] = [33, 24, 18]
  doc.setFillColor(...esp); doc.rect(0, 0, W, 110, 'F')
  doc.setFillColor(...gold); doc.roundedRect(40, 32, 44, 44, 10, 10, 'F')
  doc.setTextColor(...esp); doc.setFont('times', 'bold'); doc.setFontSize(26); doc.text('N', 62, 63, { align: 'center' })
  doc.setTextColor(239, 230, 214); doc.setFontSize(17); doc.text(co.name || 'Naim Automation Systems Co.', 98, 52)
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9.5); doc.setTextColor(200, 186, 160)
  doc.text([co.city || 'Nairobi, Kenya', [co.phone, co.email].filter(Boolean).join('   '), co.kra_pin ? `KRA PIN ${co.kra_pin}` : ''].filter(Boolean), 98, 68)
  doc.setTextColor(...gold); doc.setFont('times', 'bold'); doc.setFontSize(24); doc.text('INVOICE', W - 40, 56, { align: 'right' })
  doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor(239, 230, 214); doc.text(i.number || '', W - 40, 74, { align: 'right' })
  doc.setTextColor(...esp); doc.setFontSize(9); doc.setTextColor(120, 110, 98); doc.text('BILLED TO', 40, 145); doc.text('DETAILS', W / 2 + 20, 145)
  doc.setTextColor(...esp); doc.setFontSize(11); doc.setFont('helvetica', 'bold'); doc.text(i.clients?.business_name || 'Walk-in client', 40, 162)
  doc.setFont('helvetica', 'normal'); doc.setFontSize(10)
  doc.text([i.clients?.contact_name, i.clients?.phone, i.clients?.email, i.clients?.location].filter(Boolean), 40, 178)
  const meta = [['Issued', fmtDate(i.issued_at)], ['Due', fmtDate(i.due_date)], ['Type', humanize(i.type)], ['Status', humanize(i.status)]]
  meta.forEach(([k, v], n) => { doc.setTextColor(120, 110, 98); doc.text(k, W / 2 + 20, 162 + n * 15); doc.setTextColor(...esp); doc.text(String(v), W - 40, 162 + n * 15, { align: 'right' }) })
  autoTable(doc, {
    startY: 240, margin: { left: 40, right: 40 },
    head: [['Description', 'Qty', 'Unit (KES)', 'Amount (KES)']],
    body: (i.line_items || []).map((li: Row) => [li.name, li.qty, Number(li.unit_price_kes).toLocaleString('en-KE'), (li.qty * li.unit_price_kes).toLocaleString('en-KE')]),
    headStyles: { fillColor: esp, textColor: [239, 230, 214], fontStyle: 'bold' }, styles: { font: 'helvetica', fontSize: 10, cellPadding: 7 },
    columnStyles: { 1: { halign: 'center', cellWidth: 50 }, 2: { halign: 'right', cellWidth: 95 }, 3: { halign: 'right', cellWidth: 105 } },
    alternateRowStyles: { fillColor: [248, 245, 239] },
  })
  let y = (doc as any).lastAutoTable.finalY + 20
  const tot = [['Subtotal', i.subtotal_kes], ['Discount', -Number(i.discount_kes || 0)], ['Tax', i.tax_kes], ['Tip', i.tip_kes], ['Total', i.total_kes], ['Paid', -Number(i.paid_kes || 0)], ['Balance due', Number(i.total_kes) - Number(i.paid_kes)]]
  tot.filter(([k, v]) => Number(v) !== 0 || ['Total', 'Balance due'].includes(String(k))).forEach(([k, v]) => {
    const strong = k === 'Total' || k === 'Balance due'
    doc.setFont('helvetica', strong ? 'bold' : 'normal'); doc.setFontSize(strong ? 11.5 : 10); doc.setTextColor(...(strong ? esp : [110, 100, 90] as [number, number, number]))
    doc.text(String(k), W - 220, y); doc.text(kes(v), W - 40, y, { align: 'right' }); y += 17
  })
  y += 10; doc.setDrawColor(...gold); doc.setLineWidth(1); doc.line(40, y, W - 40, y); y += 22
  doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(...esp); doc.text('How to pay', 40, y); y += 15
  doc.setFont('helvetica', 'normal'); doc.setTextColor(90, 82, 74)
  doc.text([`M-PESA Paybill ${bank.mpesa_paybill || '—'}, account ${bank.account || i.number}`, `${bank.bank || 'Bank'} · A/C ${bank.bank_account || '—'} · ${bank.bank_branch || ''}`, `Please use ${i.number} as the payment reference.`], 40, y)
  if (payments.length) { y += 52; doc.setFont('helvetica', 'bold'); doc.setTextColor(...esp); doc.text('Payments received', 40, y); y += 14; doc.setFont('helvetica', 'normal'); doc.setTextColor(90, 82, 74)
    payments.forEach((p) => { doc.text(`${fmtDate(p.paid_at)}  ${methodLabel(p.method)}  ${p.reference || ''}`, 40, y); doc.text(kes(p.amount_kes), W - 40, y, { align: 'right' }); y += 13 }) }
  doc.setFontSize(9); doc.setTextColor(150, 140, 128); doc.text(invS.footer || 'Thank you for building with Naim Automation Systems Co.', W / 2, doc.internal.pageSize.getHeight() - 36, { align: 'center' })
  if (print) { doc.autoPrint(); window.open(doc.output('bloburl'), '_blank') } else doc.save(`${i.number || 'invoice'}.pdf`)
}

/* ---------------- Simple table PDF export (reports, lists) ---------------- */
export async function tablePdf(title: string, head: string[], body: (string | number)[][], subtitle?: string) {
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([import('jspdf'), import('jspdf-autotable')])
  const doc = new jsPDF({ unit: 'pt', format: 'a4', orientation: head.length > 6 ? 'landscape' : 'portrait' })
  doc.setFont('times', 'bold'); doc.setFontSize(18); doc.setTextColor(33, 24, 18); doc.text(title, 40, 50)
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9.5); doc.setTextColor(120, 110, 98)
  doc.text(subtitle || `Naim Automation Systems Co. · generated ${fmtDT(new Date())}`, 40, 66)
  autoTable(doc, { startY: 84, head: [head], body, margin: { left: 40, right: 40 }, styles: { fontSize: 9, cellPadding: 5 }, headStyles: { fillColor: [33, 24, 18], textColor: [239, 230, 214] }, alternateRowStyles: { fillColor: [248, 245, 239] } })
  doc.save(`${title.toLowerCase().replace(/\s+/g, '-')}.pdf`)
}

/* ---------------- Misc ---------------- */
export function useStaffOptions() {
  const { data = [] } = useList('staff', { select: 'id,full_name,title,color,department_id,commission_pct', filter: (b) => b.is('deleted_at', null).eq('status', 'active'), order: ['full_name', true] })
  return { staff: data, options: data.map((s) => ({ value: s.id, label: s.full_name })) }
}
export function useClientOptions() {
  const { data = [] } = useList('clients', { select: 'id,business_name,contact_name,phone', filter: (b) => b.is('deleted_at', null), order: ['business_name', true] })
  return { clients: data, options: data.map((c) => ({ value: c.id, label: c.business_name })) }
}
export const SectionTitle = ({ children, action }: { children: ReactNode; action?: ReactNode }) => (
  <div className="flex items-center justify-between gap-3 mb-3"><h2 className="text-[16px] font-semibold">{children}</h2>{action}</div>
)
export const money = { icon: Wallet }
export function useDerived<T>(fn: () => T, deps: unknown[]) { return useMemo(fn, deps) } // eslint-disable-line react-hooks/exhaustive-deps
export { CalendarClock }