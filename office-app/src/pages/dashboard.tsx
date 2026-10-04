import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, ArrowUpRight, Banknote, Bot, CalendarCheck, CircleDollarSign, Clock, Coins, Handshake, Radar, Repeat, TrendingDown, TrendingUp, Users, Video, ReceiptText } from 'lucide-react'
import { useList, type Row } from '@/services/db'
import { useAuth } from '@/lib/auth'
import { useBiz } from '@/lib/business'
import { ago, cn, fmtTime, kes, kesShort, sum, fmtDate, humanize } from '@/lib/utils'
import { RANGES, rangeBounds, inRange, series, delta, type RangeId } from '@/lib/range'
import { methodLabel, dealStage } from '@/lib/status'
import { Badge, Button, Card, Empty, Kpi, Segmented, Skeleton } from '@/components/ui'
import { ActivityList, Funnel, cumulativeFunnel } from '@/components/shared'
import { AreaTrend, Donut, Bars } from '@/components/charts'

const greet = () => { const h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening' }

export default function Dashboard() {
  const nav = useNavigate()
  const { profile, can } = useAuth()
  const { scope } = useBiz()
  const [range, setRange] = useState<RangeId>('month')
  const { from, to, prevFrom, prevTo } = rangeBounds(range)
  const since = new Date(Date.now() - 400 * 864e5).toISOString()

  const payments = useList('payments', { select: 'id,amount_kes,method,paid_at,invoices!inner(business_id,type)', filter: (b) => scope(b.gte('paid_at', since), 'invoices.business_id'), limit: 5000, enabled: can('finance') || can('pos') })
  const invoices = useList('invoices', { select: 'id,number,total_kes,paid_kes,status,due_date,issued_at,type,clients(business_name)', filter: (b) => scope(b.is('deleted_at', null)), limit: 5000, enabled: can('pos') })
  const expenses = useList('expenses', { select: 'id,amount_kes,paid_at,category', filter: (b) => scope(b.is('deleted_at', null).gte('paid_at', since)), limit: 5000, enabled: can('expenses') })
  const leads = useList('leads', { select: 'id,status,created_at,quality,score', filter: (b) => scope(b.is('deleted_at', null)), limit: 5000, enabled: can('leads') })
  const appts = useList('appointments', { select: 'id,title,type,status,starts_at,ends_at,meet_link,staff(full_name),clients(business_name),leads(business_name)', filter: (b) => scope(b.is('deleted_at', null).gte('starts_at', new Date(Date.now() - 120 * 864e5).toISOString())), order: ['starts_at', true], limit: 2000, enabled: can('appointments') })
  const deals = useList('deals', { select: 'id,title,stage,value_kes,probability,won_at,created_at', filter: (b) => scope(b.is('deleted_at', null)), limit: 2000, enabled: can('deals') })
  const mrr = useList('v_mrr', { enabled: can('finance') || can('memberships') })
  const acts = useList('activities', { order: ['created_at'], limit: 14 })
  const bots = useList('hermes_bots', { order: ['name', true], enabled: can('hermes') })
  const tasks = useList('tasks', { select: 'id,title,priority,status,due_at', filter: (b) => b.is('deleted_at', null).neq('status', 'done'), order: ['due_at', true], limit: 200, enabled: can('tasks') })

  const m = useMemo(() => {
    const P = payments.data || [], E = expenses.data || [], L = leads.data || [], A = appts.data || [], D = deals.data || []
    const rev = sum(P.filter((p) => inRange(p.paid_at, from, to)), 'amount_kes'), revPrev = sum(P.filter((p) => inRange(p.paid_at, prevFrom, prevTo)), 'amount_kes')
    const exp = sum(E.filter((e) => inRange(e.paid_at, from, to)), 'amount_kes'), expPrev = sum(E.filter((e) => inRange(e.paid_at, prevFrom, prevTo)), 'amount_kes')
    const newLeads = L.filter((l) => inRange(l.created_at, from, to)).length, newLeadsPrev = L.filter((l) => inRange(l.created_at, prevFrom, prevTo)).length
    const calls = A.filter((a) => inRange(a.starts_at, from, to)).length
    const won = D.filter((d) => d.stage === 'won' && inRange(d.won_at, from, to))
    const open = D.filter((d) => !['won', 'lost'].includes(d.stage))
    const outstanding = sum((invoices.data || []).filter((i) => !['void', 'paid', 'draft'].includes(i.status)), (i) => i.total_kes - i.paid_kes)
    const trendRev = series(P, range, (p) => p.paid_at, (p) => Number(p.amount_kes)), trendExp = series(E, range, (e) => e.paid_at, (e) => Number(e.amount_kes))
    const trend = trendRev.map((r, i) => ({ label: r.label, revenue: r.value, expenses: trendExp[i]?.value || 0 }))
    const byMethod = Object.entries(P.filter((p) => inRange(p.paid_at, from, to)).reduce((a: Row, p) => { a[p.method] = (a[p.method] || 0) + Number(p.amount_kes); return a }, {})).map(([k, v]) => ({ name: methodLabel(k), value: v as number }))
    const byType = Object.entries(P.filter((p) => inRange(p.paid_at, from, to)).reduce((a: Row, p) => { const t = p.invoices?.type || 'one_off'; a[t] = (a[t] || 0) + Number(p.amount_kes); return a }, {})).map(([k, v]) => ({ name: humanize(k), value: v as number }))
    const now = Date.now(), endToday = new Date(); endToday.setHours(23, 59, 59)
    const upcoming = A.filter((a) => new Date(a.starts_at).getTime() >= now - 30 * 6e4 && !['cancelled', 'completed', 'no_show'].includes(a.status)).slice(0, 6)
    const today = A.filter((a) => inRange(a.starts_at, new Date(new Date().setHours(0, 0, 0, 0)), endToday))
    return { rev, revPrev, exp, expPrev, newLeads, newLeadsPrev, calls, won, open, outstanding, trend, byMethod, byType, upcoming, today, profit: rev - exp, profitPrev: revPrev - expPrev,
      pipeline: sum(open, 'value_kes'), weighted: sum(open, (d) => (d.value_kes * (d.probability || 0)) / 100) }
  }, [payments.data, expenses.data, leads.data, appts.data, deals.data, invoices.data, range]) // eslint-disable-line

  const overdue = (invoices.data || []).filter((i) => i.status === 'overdue' || (i.due_date && new Date(i.due_date) < new Date() && ['sent', 'partial'].includes(i.status)))
  const hot = (leads.data || []).filter((l) => l.status === 'replied')
  const lateTasks = (tasks.data || []).filter((t) => t.due_at && new Date(t.due_at) < new Date())
  const attention = [
    ...overdue.slice(0, 3).map((i) => ({ k: i.id, tone: 'danger', icon: <ReceiptText />, text: `${i.number} overdue · ${kes(i.total_kes - i.paid_kes)}`, sub: i.clients?.business_name, to: `/invoices?invoice=${i.id}` })),
    ...(hot.length ? [{ k: 'hot', tone: 'success', icon: <Radar />, text: `${hot.length} replies waiting for a call booking`, sub: 'Replies inbox', to: '/leads?tab=replies' }] : []),
    ...(lateTasks.length ? [{ k: 'late', tone: 'warning', icon: <Clock />, text: `${lateTasks.length} overdue tasks`, sub: lateTasks[0]?.title, to: '/tasks' }] : []),
  ]
  const deltaFoot = (c: number, p: number, invert = false) => {
    const d = delta(c, p), good = invert ? d <= 0 : d >= 0
    return <span className="inline-flex items-center gap-1">{d >= 0 ? <TrendingUp className="size-3.5" /> : <TrendingDown className="size-3.5" />}<span className="num font-medium">{Math.abs(d)}%</span> vs previous {good ? '' : ''}</span>
  }
  const loading = payments.isLoading || leads.isLoading
  const mrrRow = mrr.data?.[0]

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4 mb-6" data-reveal>
        <div>
          <h1 className="font-display text-[32px] sm:text-[36px] leading-[1.05] font-semibold tracking-[-.015em]">{greet()}, {profile?.full_name?.split(' ')[0] || 'there'}</h1>
          <p className="text-muted-foreground mt-1.5">{fmtDate(new Date(), 'EEEE, d MMMM yyyy')} · {m.today.length} appointments today · {(tasks.data || []).length} open tasks</p>
        </div>
        <Segmented value={range} onChange={setRange} items={RANGES} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-4">
        <Kpi solid tone="brand" label="Revenue collected" value={m.rev} format={kesShort} icon={<CircleDollarSign />} foot={deltaFoot(m.rev, m.revPrev)} onClick={() => nav('/finance')} />
        <Kpi solid tone="danger" label="Expenses" value={m.exp} format={kesShort} icon={<Banknote />} foot={deltaFoot(m.exp, m.expPrev, true)} onClick={() => nav('/expenses')} />
        <Kpi solid tone="success" label="Net profit" value={m.profit} format={kesShort} icon={<TrendingUp />} foot={deltaFoot(m.profit, m.profitPrev)} />
        <Kpi solid tone="info" label="MRR (care plans)" value={Number(mrrRow?.mrr_kes || 0)} format={kesShort} icon={<Repeat />} foot={`${mrrRow?.active_subscriptions ?? 0} active plans`} onClick={() => nav('/memberships')} />
        <Kpi tone="violet" label="New leads" value={m.newLeads} icon={<Radar />} foot={deltaFoot(m.newLeads, m.newLeadsPrev)} onClick={() => nav('/leads')} />
        <Kpi tone="teal" label="Calls & meetings" value={m.calls} icon={<CalendarCheck />} foot="In this period" onClick={() => nav('/appointments')} />
        <Kpi tone="brand" label="Deals won" value={m.won.length} icon={<Handshake />} foot={kes(sum(m.won, 'value_kes'))} onClick={() => nav('/deals')} />
        <Kpi tone="warning" label="Outstanding" value={m.outstanding} format={kesShort} icon={<Coins />} foot={`${overdue.length} overdue invoices`} onClick={() => nav('/finance')} />
      </div>

      {can('leads') && <Card className="mb-4" data-reveal title="Pipeline funnel" sub="Every lead, scraped to won" action={<Button size="sm" variant="ghost" onClick={() => nav('/leads')}>Lead Engine<ArrowUpRight /></Button>}>
        {leads.data ? <Funnel stages={cumulativeFunnel(leads.data)} compact /> : <Skeleton className="h-24" />}
      </Card>}

      <div className="grid lg:grid-cols-3 gap-4 mb-4">
        <Card className="lg:col-span-2" data-reveal title="Money in vs money out" sub={RANGES.find((r) => r.id === range)?.label}>
          {loading ? <Skeleton className="h-[240px]" /> : <AreaTrend data={m.trend} x="label" series={[{ key: 'revenue', name: 'Collected', color: 'var(--p)' }, { key: 'expenses', name: 'Expenses', color: 'var(--c5)' }]} />}
        </Card>
        <Card data-reveal title="Needs attention">
          {attention.length ? <ul className="space-y-2">{attention.map((a) => (
            <li key={a.k}><button onClick={() => nav(a.to)} className={cn('tone-' + a.tone, 'w-full flex items-center gap-3 rounded-[14px] bg-foreground/[.035] hover:bg-foreground/[.06] px-3 py-2.5 text-left transition-colors')}>
              <span className="chip size-8 rounded-full grid place-items-center shrink-0 [&_svg]:size-4">{a.icon}</span>
              <span className="min-w-0"><span className="block text-[13.5px] font-medium truncate">{a.text}</span><span className="block text-[12px] text-muted-foreground truncate">{a.sub}</span></span>
            </button></li>))}</ul> : <Empty title="All clear" body="Nothing overdue, nothing waiting." icon={<AlertTriangle />} />}
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-4 mb-4">
        <Card data-scroll title="Live activity" sub="People, clients and Hermes" action={<span className="tone-success inline-flex items-center gap-1.5 text-[12px] text-muted-foreground"><span className="dot live-dot size-2 rounded-full" />Live</span>}>
          <ActivityList items={acts.data} loading={acts.isLoading} max={9} />
        </Card>
        <Card data-scroll title="Upcoming calls" sub="Discovery calls and client meetings" action={<Button size="sm" variant="ghost" onClick={() => nav('/appointments')}>All<ArrowUpRight /></Button>}>
          {m.upcoming.length ? <ul className="space-y-2">{m.upcoming.map((a) => (
            <li key={a.id} className="flex items-center gap-3 rounded-[14px] bg-foreground/[.035] px-3 py-2.5">
              <div className="text-center w-12 shrink-0"><div className="text-[11px] text-muted-foreground">{fmtDate(a.starts_at, 'EEE d')}</div><div className="font-semibold num">{fmtTime(a.starts_at)}</div></div>
              <div className="min-w-0 flex-1"><div className="text-[13.5px] font-medium truncate">{a.clients?.business_name || a.leads?.business_name || a.title}</div><div className="text-[12px] text-muted-foreground truncate">{humanize(a.type)} · {a.staff?.full_name || 'Unassigned'}</div></div>
              {a.meet_link && <Button size="icon-sm" variant="outline" onClick={() => window.open(a.meet_link, '_blank')} aria-label="Join"><Video /></Button>}
            </li>))}</ul> : <Empty title="No upcoming calls" body="When Echo books a discovery call it lands here." />}
        </Card>
        <Card data-scroll title="Hermes fleet" sub="Five bots, one kill switch" action={<Button size="sm" variant="ghost" onClick={() => nav('/hermes')}>Fleet<ArrowUpRight /></Button>}>
          <ul className="space-y-2">{(bots.data || []).map((b) => {
            const tone = !b.enabled ? 'neutral' : b.status === 'error' ? 'danger' : b.status === 'running' ? 'info' : b.status === 'paused' ? 'warning' : 'success'
            return (
              <li key={b.name} className="flex items-center gap-3 rounded-[14px] bg-foreground/[.035] px-3 py-2.5">
                <span className={cn('tone-' + tone, 'chip size-8 rounded-full grid place-items-center shrink-0')}><Bot className="size-4" /></span>
                <div className="min-w-0 flex-1"><div className="text-[13.5px] font-medium">{b.display_name}</div><div className="text-[12px] text-muted-foreground truncate">{b.role}</div></div>
                <div className="text-right"><Badge tone={tone as any} dot>{b.enabled ? humanize(b.status) : 'Off'}</Badge><div className="text-[11px] text-muted-foreground mt-0.5">{b.last_heartbeat ? ago(b.last_heartbeat) : 'never'}</div></div>
              </li>)
          })}</ul>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <Card data-scroll title="Money in by method"><Donut data={m.byMethod} height={170} /></Card>
        <Card data-scroll title="Revenue mix"><Donut data={m.byType} height={170} /></Card>
        <Card data-scroll title="Open pipeline" sub={`${kes(m.pipeline)} open · ${kes(m.weighted)} weighted`}>
          <Bars height={190} layout="vertical" x="stage" series={[{ key: 'value', name: 'Value', color: 'var(--p)' }]}
            data={['discovery', 'consultation', 'proposal', 'contract', 'deposit_paid'].map((s) => ({ stage: dealStage(s).label, value: sum(m.open.filter((d) => d.stage === s), 'value_kes') }))} />
        </Card>
      </div>
      <div className="hidden"><Users /></div>
    </div>
  )
}