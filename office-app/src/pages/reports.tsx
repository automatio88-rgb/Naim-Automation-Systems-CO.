import { useMemo, useState } from 'react'
import { ArrowRight, FileDown, Filter, Radar, ShoppingBag, Sparkles, TrendingUp, Users, Wallet } from 'lucide-react'
import { useList, type Row } from '@/services/db'
import { useBiz } from '@/lib/business'
import { downloadCSV, humanize, kes, kesShort, pct, sum } from '@/lib/utils'
import { RANGES, rangeBounds, inRange, series, type RangeId } from '@/lib/range'
import { Button, Card, Kpi, PageHeader, Segmented, TabPanel, Tabs } from '@/components/ui'
import { AreaTrend, Bars, Donut } from '@/components/charts'
import { Funnel, cumulativeFunnel, tablePdf } from '@/components/shared'
import { DataTable } from '@/components/data-table'

export default function Reports() {
  const { scope } = useBiz()
  const [range, setRange] = useState<RangeId>('year')
  const [tab, setTab] = useState('hub')
  const [svcKind, setSvcKind] = useState('all')
  const { from, to } = rangeBounds(range)
  const pay = useList('payments', { select: 'amount_kes,paid_at,method,invoices!inner(business_id,type,client_id,staff_id,line_items)', filter: (b) => scope(b, 'invoices.business_id'), limit: 10000 })
  const exp = useList('expenses', { select: 'amount_kes,paid_at,category,status', filter: (b) => scope(b.is('deleted_at', null)), limit: 10000 })
  const leads = useList('leads', { select: 'id,status,source,created_at,quality', filter: (b) => scope(b.is('deleted_at', null)), limit: 10000 })
  const staff = useList('staff', { select: 'id,full_name', filter: (b) => b.is('deleted_at', null) })
  const comm = useList('commissions', { select: 'staff_id,kind,amount_kes,created_at', limit: 10000 })
  const appts = useList('appointments', { select: 'staff_id,status,starts_at', limit: 10000 })
  const clients = useList('clients', { select: 'id,business_name', limit: 5000 })
  const svcs = useList('services', { select: 'id,name,cost_kes,price_kes', limit: 2000 })
  const prods = useList('products', { select: 'id,name,cost_kes', limit: 5000 })
  const ar = useList('v_receivables_ageing', { select: 'id,number,business_name,outstanding_kes,due_date,bucket', order: ['outstanding_kes'], limit: 1000 })
  const P = (pay.data || []).filter((p) => inRange(p.paid_at, from, to)), E = (exp.data || []).filter((e) => inRange(e.paid_at, from, to) && e.status === 'paid')
  const rev = sum(P, 'amount_kes'), cost = sum(E, 'amount_kes')
  const pnl = useMemo(() => { const a = series(P, range, (p) => p.paid_at, (p) => Number(p.amount_kes)), b = series(E, range, (e) => e.paid_at, (e) => Number(e.amount_kes)); return a.map((x, i) => ({ label: x.label, revenue: x.value, expenses: b[i]?.value || 0, profit: x.value - (b[i]?.value || 0) })) }, [P.length, E.length, range]) // eslint-disable-line
  const bySvc = useMemo(() => { const m: Row = {}; P.forEach((p) => { const li: Row[] = p.invoices?.line_items || []; const tot = sum(li, (l) => l.qty * l.unit_price_kes) || 1; li.forEach((l) => { m[l.name] = (m[l.name] || 0) + (Number(p.amount_kes) * l.qty * l.unit_price_kes) / tot }) }); return Object.entries(m).map(([name, value]) => ({ name, value: Math.round(value as number) })).sort((a, b) => b.value - a.value).slice(0, 10) }, [P.length]) // eslint-disable-line
  const byClient = useMemo(() => { const m: Row = {}; P.forEach((p) => { const k = p.invoices?.client_id || 'walk-in'; m[k] = (m[k] || 0) + Number(p.amount_kes) }); return Object.entries(m).map(([id, v]) => ({ name: (clients.data || []).find((c) => c.id === id)?.business_name || 'Walk-in', value: v as number })).sort((a, b) => b.value - a.value).slice(0, 10) }, [P.length, clients.data]) // eslint-disable-line
  const profit = useMemo(() => {
    const m: Record<string, Row> = {}
    P.forEach((p) => {
      const li: Row[] = p.invoices?.line_items || []; const tot = sum(li, (l) => l.qty * l.unit_price_kes) || 1
      li.forEach((l) => {
        const k = l.name || 'Item', gross = Number(l.qty) * Number(l.unit_price_kes) || 1
        const r = m[k] || (m[k] = { name: k, kind: l.kind || 'service', qty: 0, revenue: 0, cost: 0 })
        const share = (Number(p.amount_kes) * gross) / tot, frac = share / gross
        const src = l.kind === 'product' ? prods.data : svcs.data
        const unitCost = Number((src || []).find((x) => x.id === (l.ref_id || l.service_id || l.product_id) || x.name === l.name)?.cost_kes || 0)
        r.qty += Number(l.qty) * frac; r.revenue += share; r.cost += unitCost * Number(l.qty) * frac
      })
    })
    return Object.values(m).map((r): Row => ({ ...r, qty: Math.round(r.qty * 10) / 10, revenue: Math.round(r.revenue), cost: Math.round(r.cost), profit: Math.round(r.revenue - r.cost), margin: r.revenue ? Math.round(((r.revenue - r.cost) / r.revenue) * 100) : 0 })).sort((a, b) => b.revenue - a.revenue)
  }, [P.length, svcs.data, prods.data]) // eslint-disable-line
  const profitView = profit.filter((r) => svcKind === 'all' || r.kind === svcKind)
  const L = (leads.data || []).filter((l) => inRange(l.created_at, from, to))
  const sources = Array.from(new Set(L.map((l) => l.source))).map((s) => { const x = L.filter((l) => l.source === s); return { source: humanize(s), leads: x.length, booked: x.filter((l) => ['booked', 'converted'].includes(l.status)).length, won: x.filter((l) => l.status === 'converted').length } }).sort((a, b) => b.leads - a.leads)
  const team = (staff.data || []).map((s) => { const c = (comm.data || []).filter((x) => x.staff_id === s.id && inRange(x.created_at, from, to)); const a = (appts.data || []).filter((x) => x.staff_id === s.id && inRange(x.starts_at, from, to)); return { name: s.full_name, sales: sum(P.filter((p) => p.invoices?.staff_id === s.id), 'amount_kes'), commission: sum(c.filter((x) => x.kind === 'commission'), 'amount_kes'), tips: sum(c.filter((x) => x.kind === 'tip'), 'amount_kes'), appointments: a.length, completed: a.filter((x) => x.status === 'completed').length } }).sort((a, b) => b.sales - a.sales)
  const exportPnl = () => tablePdf('Profit and loss', ['Period', 'Revenue', 'Expenses', 'Profit'], pnl.map((r) => [r.label, kes(r.revenue), kes(r.expenses), kes(r.profit)]), `${RANGES.find((r) => r.id === range)?.label} · Naim Automation Systems Co.`)
  return (
    <div>
      <PageHeader title="Reports" sub="Profit and loss, what sells, where leads come from and how the team performs"
        actions={<><Segmented value={range} onChange={setRange} items={RANGES} /><Button variant="outline" onClick={exportPnl}><FileDown />P&L PDF</Button></>} />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-5">
        <Kpi solid tone="brand" label="Revenue" value={rev} format={kesShort} />
        <Kpi solid tone="danger" label="Expenses" value={cost} format={kesShort} />
        <Kpi solid tone="success" label="Profit" value={rev - cost} format={kesShort} />
        <Kpi solid tone="info" label="Margin" value={rev ? ((rev - cost) / rev) * 100 : 0} format={(n) => `${Math.round(n)}%`} />
      </div>
      <Tabs value={tab} onChange={setTab} items={[{ id: 'hub', label: 'All reports' }, { id: 'revenue', label: 'Profit & loss' }, { id: 'sales', label: 'Sales' }, { id: 'services', label: 'Service profitability' }, { id: 'leads', label: 'Lead sources' }, { id: 'team', label: 'Team' }, { id: 'funnel', label: 'Funnel' }, { id: 'ar', label: 'Receivables' }]}>
        <TabPanel id="hub">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">{([
            ['revenue', 'Profit & loss', 'Revenue, expenses and profit over time, expenses by category, PDF export.', <TrendingUp />, 'brand', kes(rev - cost) + ' profit'],
            ['sales', 'Sales', 'Top services, items and clients by money collected.', <ShoppingBag />, 'info', `${P.length} payments`],
            ['services', 'Service profitability', 'Quantity, revenue, cost, profit and margin for every service and product.', <Sparkles />, 'success', profit[0] ? `Top: ${profit[0].name}` : 'No sales yet'],
            ['leads', 'Lead sources', 'Leads, bookings and wins by source with conversion rates.', <Radar />, 'teal', `${L.length} leads`],
            ['team', 'Team performance', 'Sales, commission, tips and appointments per staff member.', <Users />, 'violet', `${team.length} staff`],
            ['funnel', 'Lead funnel', 'Scraped to won, stage by stage, and lead quality.', <Filter />, 'warning', `${L.filter((l) => l.status === 'converted').length} won`],
            ['ar', 'Receivables ageing', 'Who owes us, by age bucket, with PDF export.', <Wallet />, 'danger', kes(sum(ar.data, 'outstanding_kes')) + ' due'],
          ] as const).map(([id, title, body, icon, tone, foot]) => (
            <button key={id} onClick={() => setTab(id)} className="text-left rounded-card border border-border/70 bg-card p-5 shadow-e1 hover:shadow-e2 hover:border-primary/40 transition group">
              <div className={'tone-' + tone + ' chip size-10 rounded-[12px] grid place-items-center [&_svg]:size-5'}>{icon}</div>
              <div className="mt-3 font-semibold text-[15px]">{title}</div>
              <p className="text-[13px] text-muted-foreground mt-1 leading-snug">{body}</p>
              <div className="flex items-center justify-between mt-4 text-[12.5px]"><span className="font-medium num">{foot}</span><span className="inline-flex items-center gap-1 text-brand-strong font-medium">Open<ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" /></span></div>
            </button>))}</div>
        </TabPanel>
        <TabPanel id="services">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <Kpi label="Revenue" value={sum(profitView, 'revenue')} format={kesShort} />
            <Kpi label="Direct cost" value={sum(profitView, 'cost')} format={kesShort} tone="danger" />
            <Kpi label="Gross profit" value={sum(profitView, 'profit')} format={kesShort} tone="success" />
            <Kpi label="Margin" value={sum(profitView, 'revenue') ? (sum(profitView, 'profit') / sum(profitView, 'revenue')) * 100 : 0} format={(n) => `${Math.round(n)}%`} tone="info" />
          </div>
          <div className="mb-4"><Segmented value={svcKind} onChange={setSvcKind} items={[{ id: 'all', label: 'All' }, { id: 'service', label: 'Services' }, { id: 'product', label: 'Products' }, { id: 'plan', label: 'Plans' }, { id: 'package', label: 'Packages' }]} /></div>
          <div className="grid xl:grid-cols-[1fr_1.3fr] gap-4">
            <Card title="Top 10 by revenue"><Bars layout="vertical" height={360} x="name" data={profitView.slice(0, 10)} series={[{ key: 'revenue', name: 'Revenue', color: 'var(--p)' }, { key: 'profit', name: 'Profit', color: 'var(--success)' }]} /></Card>
            <Card title="Profitability table" sub="Cost uses each service's flat cost and each product's unit cost">
              <DataTable rows={profitView} searchKeys={['name']} exportName="service-profitability" title="Service profitability" initialSort={['revenue', 'desc']}
                cols={[{ key: 'name', label: 'Item', sort: true, render: (r) => <span className="font-medium">{r.name}</span> }, { key: 'kind', label: 'Kind', hideBelow: 'md', render: (r) => humanize(r.kind) },
                  { key: 'qty', label: 'Qty', align: 'right', sort: true }, { key: 'revenue', label: 'Revenue', align: 'right', sort: true, render: (r) => kes(r.revenue) },
                  { key: 'cost', label: 'Cost', align: 'right', sort: true, hideBelow: 'sm', render: (r) => kes(r.cost) }, { key: 'profit', label: 'Profit', align: 'right', sort: true, render: (r) => <span className={r.profit < 0 ? 'text-danger' : ''}>{kes(r.profit)}</span> },
                  { key: 'margin', label: 'Margin', align: 'right', sort: true, render: (r) => <span className={r.margin < 30 ? 'text-warning font-medium' : 'text-success font-medium'}>{r.margin}%</span>, csv: (r) => r.margin }]} />
            </Card>
          </div>
        </TabPanel>
        <TabPanel id="revenue">
          <Card title="Revenue, expenses and profit" action={<Button size="sm" variant="ghost" onClick={() => downloadCSV('pnl', pnl, [{ key: 'label', label: 'Period' }, { key: 'revenue', label: 'Revenue' }, { key: 'expenses', label: 'Expenses' }, { key: 'profit', label: 'Profit' }])}>CSV</Button>}>
            <AreaTrend data={pnl} x="label" height={300} series={[{ key: 'revenue', name: 'Revenue', color: 'var(--p)' }, { key: 'expenses', name: 'Expenses', color: 'var(--danger)' }, { key: 'profit', name: 'Profit', color: 'var(--success)' }]} />
          </Card>
          <Card className="mt-4" title="Expenses by category"><Donut height={200} data={Object.entries(E.reduce((a: Row, e) => { a[e.category] = (a[e.category] || 0) + Number(e.amount_kes); return a }, {})).map(([k, v]) => ({ name: humanize(k), value: v as number })).sort((a, b) => b.value - a.value)} /></Card>
        </TabPanel>
        <TabPanel id="sales">
          <div className="grid lg:grid-cols-2 gap-4">
            <Card title="Top services and items"><Bars layout="vertical" height={340} x="name" data={bySvc} series={[{ key: 'value', name: 'Revenue', color: 'var(--p)' }]} /></Card>
            <Card title="Top clients"><Bars layout="vertical" height={340} x="name" data={byClient} series={[{ key: 'value', name: 'Paid', color: 'var(--c2)' }]} /></Card>
          </div>
        </TabPanel>
        <TabPanel id="leads">
          <div className="grid lg:grid-cols-[1fr_420px] gap-4">
            <Card title="Leads, bookings and wins by source"><Bars height={300} money={false} x="source" data={sources} series={[{ key: 'leads', name: 'Leads' }, { key: 'booked', name: 'Booked' }, { key: 'won', name: 'Won' }]} /></Card>
            <Card title="Conversion by source"><table className="w-full text-[13px]"><thead><tr className="text-muted-foreground"><th className="text-left font-medium pb-2">Source</th><th className="text-right font-medium">Leads</th><th className="text-right font-medium">Booked</th><th className="text-right font-medium">Won</th></tr></thead>
              <tbody>{sources.map((s) => <tr key={s.source} className="border-t border-border/60"><td className="py-2">{s.source}</td><td className="text-right num">{s.leads}</td><td className="text-right num">{pct(s.booked, s.leads)}%</td><td className="text-right num font-medium">{pct(s.won, s.leads)}%</td></tr>)}</tbody></table></Card>
          </div>
        </TabPanel>
        <TabPanel id="team">
          <Card title="Team performance" action={<Button size="sm" variant="ghost" onClick={() => tablePdf('Team performance', ['Staff', 'Sales', 'Commission', 'Tips', 'Appointments', 'Completed'], team.map((t) => [t.name, kes(t.sales), kes(t.commission), kes(t.tips), t.appointments, t.completed]))}>PDF</Button>}>
            <div className="overflow-x-auto"><table className="w-full text-[13.5px] min-w-[620px]"><thead><tr className="text-muted-foreground">{['Staff', 'Sales', 'Commission', 'Tips', 'Appointments', 'Completed'].map((h, i) => <th key={h} className={i ? 'text-right font-medium pb-2' : 'text-left font-medium pb-2'}>{h}</th>)}</tr></thead>
              <tbody>{team.map((t) => <tr key={t.name} className="border-t border-border/60"><td className="py-2.5 font-medium">{t.name}</td><td className="text-right num">{kes(t.sales)}</td><td className="text-right num">{kes(t.commission)}</td><td className="text-right num">{kes(t.tips)}</td><td className="text-right num">{t.appointments}</td><td className="text-right num">{t.completed}</td></tr>)}</tbody></table></div>
          </Card>
        </TabPanel>
        <TabPanel id="funnel">
          <Card title="Lead funnel for the period" sub={`${L.length} leads created`}><Funnel stages={cumulativeFunnel(L)} /></Card>
          <Card className="mt-4" title="Lead quality"><Donut height={200} money={false} data={['high', 'medium', 'low'].map((q) => ({ name: humanize(q), value: L.filter((l) => l.quality === q).length }))} /></Card>
        </TabPanel>
        <TabPanel id="ar">
          <div className="grid lg:grid-cols-[380px_1fr] gap-4">
            <Card title="Ageing" sub={`${kes(sum(ar.data, 'outstanding_kes'))} outstanding`}><Bars height={260} x="bucket" data={['current', '1-30', '31-60', '61-90', '90+'].map((b) => ({ bucket: b === 'current' ? 'Not due' : `${b} days`, value: sum((ar.data || []).filter((r) => r.bucket === b), 'outstanding_kes') }))} series={[{ key: 'value', name: 'Outstanding', color: 'var(--warning)' }]} /></Card>
            <Card title="Who owes us" action={<Button size="sm" variant="ghost" onClick={() => tablePdf('Receivables ageing', ['Invoice', 'Client', 'Due', 'Bucket', 'Outstanding'], (ar.data || []).map((r) => [r.number, r.business_name || '—', r.due_date || '—', r.bucket, kes(r.outstanding_kes)]))}>PDF</Button>}>
              <DataTable rows={ar.data} loading={ar.isLoading} searchKeys={['number', 'business_name']} exportName="receivables" initialSort={['outstanding_kes', 'desc']}
                cols={[{ key: 'number', label: 'Invoice', render: (r) => <span className="font-mono">{r.number}</span> }, { key: 'business_name', label: 'Client', sort: true }, { key: 'bucket', label: 'Age', render: (r) => r.bucket === 'current' ? 'Not due' : `${r.bucket} days` }, { key: 'outstanding_kes', label: 'Outstanding', align: 'right', sort: true, render: (r) => kes(r.outstanding_kes) }]} />
            </Card>
          </div>
        </TabPanel>
      </Tabs>
    </div>
  )
}