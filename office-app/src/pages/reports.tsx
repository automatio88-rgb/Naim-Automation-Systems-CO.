import { useMemo, useState } from 'react'
import { FileDown } from 'lucide-react'
import { useList, type Row } from '@/services/db'
import { useBiz } from '@/lib/business'
import { downloadCSV, humanize, kes, kesShort, pct, sum } from '@/lib/utils'
import { RANGES, rangeBounds, inRange, series, type RangeId } from '@/lib/range'
import { Button, Card, Kpi, PageHeader, Segmented, TabPanel, Tabs } from '@/components/ui'
import { AreaTrend, Bars, Donut } from '@/components/charts'
import { tablePdf } from '@/components/shared'

export default function Reports() {
  const { scope } = useBiz()
  const [range, setRange] = useState<RangeId>('year')
  const [tab, setTab] = useState('revenue')
  const { from, to } = rangeBounds(range)
  const pay = useList('payments', { select: 'amount_kes,paid_at,method,invoices!inner(business_id,type,client_id,staff_id,line_items)', filter: (b) => scope(b, 'invoices.business_id'), limit: 10000 })
  const exp = useList('expenses', { select: 'amount_kes,paid_at,category,status', filter: (b) => scope(b.is('deleted_at', null)), limit: 10000 })
  const leads = useList('leads', { select: 'id,status,source,created_at,quality', filter: (b) => scope(b.is('deleted_at', null)), limit: 10000 })
  const staff = useList('staff', { select: 'id,full_name', filter: (b) => b.is('deleted_at', null) })
  const comm = useList('commissions', { select: 'staff_id,kind,amount_kes,created_at', limit: 10000 })
  const appts = useList('appointments', { select: 'staff_id,status,starts_at', limit: 10000 })
  const clients = useList('clients', { select: 'id,business_name', limit: 5000 })
  const P = (pay.data || []).filter((p) => inRange(p.paid_at, from, to)), E = (exp.data || []).filter((e) => inRange(e.paid_at, from, to) && e.status === 'paid')
  const rev = sum(P, 'amount_kes'), cost = sum(E, 'amount_kes')
  const pnl = useMemo(() => { const a = series(P, range, (p) => p.paid_at, (p) => Number(p.amount_kes)), b = series(E, range, (e) => e.paid_at, (e) => Number(e.amount_kes)); return a.map((x, i) => ({ label: x.label, revenue: x.value, expenses: b[i]?.value || 0, profit: x.value - (b[i]?.value || 0) })) }, [P.length, E.length, range]) // eslint-disable-line
  const bySvc = useMemo(() => { const m: Row = {}; P.forEach((p) => { const li: Row[] = p.invoices?.line_items || []; const tot = sum(li, (l) => l.qty * l.unit_price_kes) || 1; li.forEach((l) => { m[l.name] = (m[l.name] || 0) + (Number(p.amount_kes) * l.qty * l.unit_price_kes) / tot }) }); return Object.entries(m).map(([name, value]) => ({ name, value: Math.round(value as number) })).sort((a, b) => b.value - a.value).slice(0, 10) }, [P.length]) // eslint-disable-line
  const byClient = useMemo(() => { const m: Row = {}; P.forEach((p) => { const k = p.invoices?.client_id || 'walk-in'; m[k] = (m[k] || 0) + Number(p.amount_kes) }); return Object.entries(m).map(([id, v]) => ({ name: (clients.data || []).find((c) => c.id === id)?.business_name || 'Walk-in', value: v as number })).sort((a, b) => b.value - a.value).slice(0, 10) }, [P.length, clients.data]) // eslint-disable-line
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
      <Tabs value={tab} onChange={setTab} items={[{ id: 'revenue', label: 'Profit & loss' }, { id: 'sales', label: 'Sales' }, { id: 'leads', label: 'Lead sources' }, { id: 'team', label: 'Team' }]}>
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
      </Tabs>
    </div>
  )
}