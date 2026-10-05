import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { ArrowDownLeft, ArrowUpRight, CalendarCheck2, Percent, Scale, TrendingUp, Wallet } from 'lucide-react'
import { useList, insert, logActivity, invalidate, type Row } from '@/services/db'
import { useAuth } from '@/lib/auth'
import { useBiz } from '@/lib/business'
import { fmtDate, fmtDT, humanize, kes, kesShort, sum } from '@/lib/utils'
import { methodLabel } from '@/lib/status'
import { RANGES, rangeBounds, inRange, series, type RangeId } from '@/lib/range'
import { Badge, Button, Card, Confirm, Field, Input, Kpi, PageHeader, Segmented, Select, TabPanel, Tabs } from '@/components/ui'
import { DataTable } from '@/components/data-table'
import { AreaTrend, Bars, Donut } from '@/components/charts'

const BUCKETS = ['current', '1-30', '31-60', '61-90', '90+']
type RangeSel = RangeId | 'custom'
const RANGE_ITEMS: { id: RangeSel; label: string }[] = [...RANGES, { id: 'custom', label: 'Custom' }]
const groupSum = (rows: Row[], key: (r: Row) => string, val: (r: Row) => number) => Object.entries(rows.reduce((a: Record<string, number>, r) => { const k = key(r); a[k] = (a[k] || 0) + val(r); return a }, {})).sort((a, b) => b[1] - a[1])

/** One line of the profit and loss statement: h = section, t = total, otherwise a detail line. */
function Stmt({ rows }: { rows: [string, number, ('h' | 't')?][] }) {
  return <div className="text-[13.5px]">{rows.map(([k, v, t], i) => <div key={i} className={`flex justify-between gap-4 py-2 ${t === 't' ? 'border-t border-border font-semibold text-[14.5px]' : t === 'h' ? 'font-medium pt-3' : 'pl-4 py-1.5 text-muted-foreground'}`}><span>{k}</span><span className={`num ${t === 't' && v < 0 ? 'text-danger' : ''}`}>{kes(v)}</span></div>)}</div>
}

export default function Finance() {
  const nav = useNavigate()
  const { scope, businesses } = useBiz()
  const [tab, setTab] = useState('cashflow')
  const [range, setRange] = useState<RangeSel>('year')
  const [cFrom, setCFrom] = useState('')
  const [cTo, setCTo] = useState('')
  const [fBiz, setFBiz] = useState('')
  const [bucket, setBucket] = useState('')
  const preset: RangeId = range === 'custom' ? 'year' : range
  const pb = rangeBounds(preset)
  const from = range === 'custom' && cFrom ? new Date(`${cFrom}T00:00:00`) : pb.from
  const to = range === 'custom' && cTo ? new Date(`${cTo}T23:59:59`) : pb.to
  const bizOk = (id: unknown) => !fBiz || id === fBiz
  const pay = useList('payments', { select: '*, invoices!inner(number,type,business_id,clients(business_name))', filter: (b) => scope(b, 'invoices.business_id'), order: ['paid_at'], limit: 10000 })
  const exp = useList('expenses', { filter: (b) => scope(b.is('deleted_at', null).neq('status', 'rejected')), limit: 10000 })
  const ar = useList('v_receivables_ageing', { limit: 2000 })
  const po = useList('purchase_orders', { select: '*, suppliers(name)', filter: (b) => b.neq('status', 'cancelled'), limit: 2000 })
  const runsQ = useList('payroll_runs', { filter: (b) => b.eq('status', 'paid'), limit: 500 })
  const mrr = useList('v_mrr')
  const settings = useList('app_settings')
  const closes = useList('day_closes', { order: ['business_date'], limit: 120 })
  const tax = (settings.data || []).find((s) => s.key === 'tax')?.value || {}
  const PAll = (pay.data || []).filter((p) => bizOk(p.invoices?.business_id)), EAll = (exp.data || []).filter((e) => bizOk(e.business_id))
  const P = PAll.filter((p) => inRange(p.paid_at, from, to)), E = EAll.filter((e) => inRange(e.paid_at, from, to) && e.status === 'paid')
  const inflow = sum(P, 'amount_kes'), outflow = sum(E, 'amount_kes')
  const key = `${P.length}-${E.length}-${range}-${fBiz}-${cFrom}-${cTo}`
  const trend = useMemo(() => { const a = series(P, preset, (p) => p.paid_at, (p) => Number(p.amount_kes)), b = series(E, preset, (e) => e.paid_at, (e) => Number(e.amount_kes)); let run = 0; return a.map((x, i) => { run += x.value - (b[i]?.value || 0); return { label: x.label, in: x.value, out: b[i]?.value || 0, net: run } }) }, [key]) // eslint-disable-line

  // Profit and loss (cash basis)
  const POs = (po.data || []).filter((p) => bizOk(p.business_id))
  const poPaid = POs.flatMap((p) => (p.payments || []).map((x: Row) => ({ ...x, ref: p.number }))).filter((x: Row) => inRange(x.paid_at, from, to))
  const PR = fBiz ? [] : (runsQ.data || []).filter((r) => inRange(r.period_end, from, to))
  const payroll = sum(PR, (r) => Number(r.totals?.gross || 0))
  const revByType = groupSum(P, (p) => p.invoices?.type || 'other', (p) => Number(p.amount_kes))
  const opexRows = groupSum(E.filter((e) => !(PR.length && e.category === 'salaries')), (e) => e.category || 'other', (e) => Number(e.amount_kes))
  const cogs = sum(poPaid, 'amount_kes'), opex = sum(opexRows, (r) => r[1]), gp = inflow - cogs, np = gp - opex - payroll
  const margin = inflow ? (np / inflow) * 100 : 0
  const plChart = useMemo(() => {
    const rev = series(P, preset, (p) => p.paid_at, (p) => Number(p.amount_kes))
    const costs = [...E.map((e) => ({ d: e.paid_at, v: Number(e.amount_kes) })), ...poPaid.map((x: Row) => ({ d: x.paid_at, v: Number(x.amount_kes) })), ...PR.map((r) => ({ d: r.period_end, v: Number(r.totals?.gross || 0) }))]
    const c = series(costs, preset, (x) => x.d, (x) => x.v)
    return rev.map((x, i) => ({ label: x.label, rev: x.value, cost: c[i]?.value || 0 }))
  }, [key, poPaid.length, PR.length]) // eslint-disable-line

  const AR = (ar.data || []).filter((r) => Number(r.outstanding_kes) > 0 && (!fBiz || r.business_id === undefined || r.business_id === fBiz))
  const payables = [...POs.filter((p) => Number(p.total_kes) > Number(p.paid_kes)).map((p) => ({ id: p.id, kind: 'Purchase order', ref: p.number, party: p.suppliers?.name, due: p.expected_at, amount: Number(p.total_kes) - Number(p.paid_kes) })),
    ...EAll.filter((e) => e.status === 'pending').map((e) => ({ id: e.id, kind: 'Expense', ref: humanize(e.category), party: e.vendor || e.description, due: e.paid_at, amount: Number(e.amount_kes) }))]
  const vatPct = Number(tax.vat_pct || 16), whPct = Number(tax.withholding_pct || 5)
  const isProject = (p: Row) => ['deposit', 'balance'].includes(p.invoices?.type)
  const taxMonths = useMemo(() => {
    const g = series(PAll, 'year', (p) => p.paid_at, (p) => Number(p.amount_kes)), w = series(PAll.filter(isProject), 'year', (p) => p.paid_at, (p) => Number(p.amount_kes))
    return g.map((x, i) => ({ id: x.label + i, month: x.label, gross: x.value, vat: tax.vat_registered ? (x.value * vatPct) / (100 + vatPct) : 0, wht: ((w[i]?.value || 0) * whPct) / 100, tot: x.value * 0.03 })).reverse()
  }, [PAll.length, fBiz, settings.data]) // eslint-disable-line
  const period = `${fmtDate(from)} – ${fmtDate(to)}`
  return (
    <div>
      <PageHeader title="Finance" sub="Cash flow, profit and loss, what we are owed, what we owe, tax and the daily close" actions={<Segmented value={range} onChange={setRange} items={RANGE_ITEMS} />} />
      <div className="flex flex-wrap items-end gap-3 mb-4">
        <div className="w-[200px]"><Select size="sm" allowClear="All businesses" value={fBiz} onChange={setFBiz} placeholder="All businesses" options={businesses.map((b) => ({ value: b.id, label: b.name }))} /></div>
        {range === 'custom' && <><Input type="date" className="h-9 w-[160px]" value={cFrom} onChange={(e) => setCFrom(e.target.value)} aria-label="From" /><span className="text-muted-foreground text-[13px] pb-2">to</span><Input type="date" className="h-9 w-[160px]" value={cTo} onChange={(e) => setCTo(e.target.value)} aria-label="To" /></>}
        <span className="text-[12.5px] text-muted-foreground pb-2">{period}{fBiz ? ` · ${businesses.find((b) => b.id === fBiz)?.name}` : ''}</span>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-5">
        <Kpi solid tone="success" label="Money in" value={inflow} format={kesShort} icon={<ArrowDownLeft />} foot={`${P.length} payments`} />
        <Kpi solid tone="danger" label="Money out" value={outflow + cogs} format={kesShort} icon={<ArrowUpRight />} foot={`${kesShort(outflow)} expenses · ${kesShort(cogs)} stock`} />
        <Kpi solid tone="brand" label="Net profit" value={np} format={kesShort} icon={<Wallet />} foot={`${margin.toFixed(1)}% margin`} />
        <Kpi solid tone="info" label="MRR" value={Number(mrr.data?.[0]?.mrr_kes || 0)} format={kesShort} foot={`${mrr.data?.[0]?.active_subscriptions ?? 0} care plans`} />
      </div>
      <Tabs value={tab} onChange={setTab} items={[{ id: 'cashflow', label: 'Cash flow' }, { id: 'pl', label: 'Profit & loss' }, { id: 'ar', label: 'Receivables', count: AR.length }, { id: 'payables', label: 'Payables', count: payables.length }, { id: 'tax', label: 'Tax' }, { id: 'close', label: 'Day close' }, { id: 'payments', label: 'Payments' }]}>
        <TabPanel id="cashflow">
          <div className="grid lg:grid-cols-3 gap-4">
            <Card className="lg:col-span-2" title="In, out and running balance"><AreaTrend data={trend} x="label" height={280} series={[{ key: 'in', name: 'In', color: 'var(--success)' }, { key: 'out', name: 'Out', color: 'var(--danger)' }, { key: 'net', name: 'Running net', color: 'var(--p)' }]} /></Card>
            <Card title="Money in by method"><Donut height={180} data={groupSum(P, (p) => p.method, (p) => Number(p.amount_kes)).map(([k, v]) => ({ name: methodLabel(k), value: v }))} /></Card>
            <Card className="lg:col-span-3" title="Expenses by category"><Bars height={240} x="cat" series={[{ key: 'v', name: 'Spent', color: 'var(--c5)' }]} data={groupSum(E, (e) => e.category, (e) => Number(e.amount_kes)).map(([k, v]) => ({ cat: humanize(k), v }))} /></Card>
          </div>
        </TabPanel>
        <TabPanel id="pl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <Kpi tone="success" label="Revenue" value={inflow} format={kesShort} icon={<TrendingUp />} />
            <Kpi tone="info" label="Gross profit" value={gp} format={kesShort} foot={inflow ? `${((gp / inflow) * 100).toFixed(1)}% gross margin` : undefined} />
            <Kpi tone={np >= 0 ? 'brand' : 'danger'} label="Net profit" value={np} format={kesShort} icon={<Wallet />} />
            <Kpi tone="warning" label="Net margin" value={margin} format={(n) => `${n.toFixed(1)}%`} icon={<Percent />} />
          </div>
          <div className="grid lg:grid-cols-5 gap-4">
            <Card className="lg:col-span-2" title="Profit and loss" sub={`${period} · cash basis${fBiz ? ' · payroll is not allocated to a business' : ''}`}>
              <Stmt rows={[['Revenue collected', inflow, 'h'], ...revByType.map(([k, v]) => [humanize(k), v] as [string, number]), ['Cost of sales (stock purchases paid)', -cogs, 'h'], ['Gross profit', gp, 't'],
                ['Operating expenses', -opex, 'h'], ...opexRows.map(([k, v]) => [humanize(k), -v] as [string, number]), ['Payroll (paid runs, gross)', -payroll, 'h'], ['Net profit', np, 't']]} />
            </Card>
            <Card className="lg:col-span-3" title="Revenue vs costs" sub="Costs include expenses, stock purchases and paid payroll">
              <Bars height={300} x="label" data={plChart} series={[{ key: 'rev', name: 'Revenue', color: 'var(--success)' }, { key: 'cost', name: 'Costs', color: 'var(--danger)' }]} />
            </Card>
          </div>
        </TabPanel>
        <TabPanel id="ar">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">{BUCKETS.map((b, i) => <Kpi key={b} solid={bucket === b} onClick={() => setBucket(bucket === b ? '' : b)} tone={(['success', 'info', 'warning', 'danger', 'danger'] as const)[i]} label={b === 'current' ? 'Not yet due' : `${b} days`} value={sum(AR.filter((r) => r.bucket === b), 'outstanding_kes')} format={kesShort} foot={`${AR.filter((r) => r.bucket === b).length} invoices${bucket === b ? ' · filtered' : ''}`} />)}</div>
          <DataTable rows={AR.filter((r) => !bucket || r.bucket === bucket)} loading={ar.isLoading} onRow={(r) => nav(`/invoices?invoice=${r.id}`)} searchKeys={['number', 'business_name']} exportName="receivables" initialSort={['outstanding_kes', 'desc']}
            filters={<Select size="sm" allowClear="Any age" value={bucket} onChange={setBucket} placeholder="Any age" options={BUCKETS.map((b) => ({ value: b, label: b === 'current' ? 'Not yet due' : `${b} days` }))} />} onClearFilters={() => setBucket('')}
            cols={[{ key: 'number', label: 'Invoice', render: (r) => <span className="num font-medium">{r.number}</span> }, { key: 'business_name', label: 'Client', sort: true }, { key: 'due_date', label: 'Due', sort: true, render: (r) => fmtDate(r.due_date) },
              { key: 'bucket', label: 'Age', render: (r) => <Badge tone={r.bucket === 'current' ? 'success' : r.bucket === '1-30' ? 'warning' : 'danger'}>{r.bucket === 'current' ? 'Not due' : `${r.bucket} days`}</Badge> },
              { key: 'total_kes', label: 'Total', align: 'right', hideBelow: 'md', render: (r) => kes(r.total_kes) }, { key: 'outstanding_kes', label: 'Outstanding', align: 'right', sort: true, render: (r) => <span className="font-medium">{kes(r.outstanding_kes)}</span> }]} />
        </TabPanel>
        <TabPanel id="payables">
          <div className="grid grid-cols-2 gap-3 mb-4 max-w-[560px]"><Kpi tone="warning" label="Total payable" value={sum(payables, 'amount')} format={kesShort} icon={<Scale />} /><Kpi tone="danger" label="Past due" value={sum(payables.filter((p) => p.due && new Date(p.due) < new Date()), 'amount')} format={kesShort} /></div>
          <DataTable rows={payables} exportName="payables" initialSort={['due', 'asc']}
            cols={[{ key: 'kind', label: 'Type' }, { key: 'ref', label: 'Reference' }, { key: 'party', label: 'To', sort: true }, { key: 'due', label: 'Due', sort: true, render: (r) => <span className={r.due && new Date(r.due) < new Date() ? 'text-danger font-medium' : ''}>{fmtDate(r.due)}</span> }, { key: 'amount', label: 'Amount', align: 'right', sort: true, render: (r) => kes(r.amount) }]} />
        </TabPanel>
        <TabPanel id="tax">
          <div className="grid md:grid-cols-3 gap-4">
            <Card title="VAT" sub={tax.vat_registered ? `Registered at ${vatPct}%` : 'Not VAT registered (turnover under KES 5M)'}><div className="font-display text-[30px] font-semibold num">{kes(tax.vat_registered ? (inflow * vatPct) / (100 + vatPct) : 0)}</div><p className="text-[13px] text-muted-foreground mt-1">Output VAT included in collections for the period.</p></Card>
            <Card title="Withholding tax" sub={`${whPct}% deducted by corporate clients`}><div className="font-display text-[30px] font-semibold num">{kes((sum(P.filter(isProject), 'amount_kes') * whPct) / 100)}</div><p className="text-[13px] text-muted-foreground mt-1">Estimate on project payments. Claim against income tax with the certificates.</p></Card>
            <Card title="Turnover tax estimate" sub="3% of gross receipts (TOT)"><div className="font-display text-[30px] font-semibold num">{kes(inflow * 0.03)}</div><p className="text-[13px] text-muted-foreground mt-1">Confirm the regime with your accountant. Rates are editable in Settings.</p></Card>
          </div>
          <div className="grid lg:grid-cols-2 gap-4 mt-4">
            <Card title="Monthly tax base" sub="Last 12 months"><Bars height={260} x="month" series={[{ key: 'gross', name: 'Gross receipts', color: 'var(--p)' }, { key: 'tot', name: 'TOT 3%', color: 'var(--warning)' }]} data={[...taxMonths].reverse()} /></Card>
            <Card title="Tax by month" sub="VAT, withholding and turnover tax per month"><DataTable title="Tax by month" rows={taxMonths} exportName="tax-by-month" pageSize={12}
              cols={[{ key: 'month', label: 'Month' }, { key: 'gross', label: 'Receipts', align: 'right', render: (r) => kes(r.gross) }, { key: 'vat', label: 'VAT', align: 'right', hideBelow: 'sm', render: (r) => kes(r.vat) }, { key: 'wht', label: 'Withholding', align: 'right', render: (r) => kes(r.wht) }, { key: 'tot', label: 'TOT', align: 'right', render: (r) => <span className="font-medium">{kes(r.tot)}</span> }]} /></Card>
          </div>
        </TabPanel>
        <TabPanel id="close"><DayClose closes={closes.data || []} payments={PAll} expenses={EAll} /></TabPanel>
        <TabPanel id="payments">
          <DataTable rows={P} loading={pay.isLoading} searchKeys={['reference', 'invoices.number', 'invoices.clients.business_name']} exportName="payments" initialSort={['paid_at', 'desc']}
            cols={[{ key: 'paid_at', label: 'Date', sort: true, render: (r) => fmtDT(r.paid_at) }, { key: 'invoices.number', label: 'Invoice', render: (r) => <span className="num">{r.invoices?.number}</span> }, { key: 'invoices.clients.business_name', label: 'Client', render: (r) => r.invoices?.clients?.business_name || 'Walk-in' },
              { key: 'method', label: 'Method', render: (r) => methodLabel(r.method) }, { key: 'reference', label: 'Reference', hideBelow: 'md', render: (r) => <span className="font-mono text-[12px]">{r.reference || '—'}</span> }, { key: 'amount_kes', label: 'Amount', align: 'right', sort: true, render: (r) => <span className="font-medium">{kes(r.amount_kes)}</span> }]} />
        </TabPanel>
      </Tabs>
    </div>
  )
}

function DayClose({ closes, payments, expenses }: { closes: Row[]; payments: Row[]; expenses: Row[] }) {
  const { profile } = useAuth()
  const [confirm, setConfirm] = useState(false)
  const [counted, setCounted] = useState('')
  const [notes, setNotes] = useState('')
  const today = new Date().toISOString().slice(0, 10)
  const isToday = (d: string) => d && new Date(d).toISOString().slice(0, 10) === today
  const P = payments.filter((p) => isToday(p.paid_at)), E = expenses.filter((e) => isToday(e.paid_at) && e.status === 'paid')
  const totals = { mpesa: sum(P.filter((p) => p.method === 'mpesa'), 'amount_kes'), cash: sum(P.filter((p) => p.method === 'cash'), 'amount_kes'), bank: sum(P.filter((p) => ['bank', 'card'].includes(p.method)), 'amount_kes'), expenses: sum(E, 'amount_kes') }
  const expectedCash = totals.cash - sum(E.filter((e) => e.method === 'cash'), 'amount_kes')
  const variance = counted === '' ? null : Number(counted) - expectedCash
  const closed = closes.some((c) => c.business_date === today)
  const vTone = (v: number | null) => (v === null ? '' : Math.abs(v) < 1 ? 'text-success' : v < 0 ? 'text-danger' : 'text-warning')
  return (
    <div className="grid gap-4">
      <Card title={`Today, ${fmtDate(new Date(), 'd MMMM')}`} sub={closed ? 'Already closed' : 'Count the cash, check the variance and close the books'} action={!closed && <Button onClick={() => setConfirm(true)}><CalendarCheck2 />Close the day</Button>}>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[['M-PESA', totals.mpesa], ['Cash', totals.cash], ['Bank & card', totals.bank], ['Expenses', totals.expenses], ['Net', totals.mpesa + totals.cash + totals.bank - totals.expenses]].map(([k, v]) => <div key={k as string} className="rounded-[14px] bg-foreground/[.035] px-4 py-3"><div className="text-[12px] text-muted-foreground">{k}</div><div className="font-semibold num text-[18px]">{kes(v)}</div></div>)}
        </div>
        {!closed && <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4 items-end">
          <Field label="Counted cash (KES)" hint="What is physically in the drawer"><Input type="number" min={0} value={counted} onChange={(e) => setCounted(e.target.value)} placeholder="0" /></Field>
          <div className="rounded-[14px] border border-border/70 px-4 py-2.5"><div className="text-[12px] text-muted-foreground">Expected cash</div><div className="font-semibold num">{kes(expectedCash)}</div></div>
          <div className="rounded-[14px] border border-border/70 px-4 py-2.5"><div className="text-[12px] text-muted-foreground">Variance</div><div className={`font-semibold num ${vTone(variance)}`}>{variance === null ? 'Not counted' : `${variance > 0 ? '+' : ''}${kes(variance)}`}</div></div>
          <Field label="Notes"><Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={variance && Math.abs(variance) >= 1 ? 'Explain the variance' : 'Optional'} /></Field>
        </div>}
      </Card>
      <DataTable rows={closes} exportName="day-closes" initialSort={['business_date', 'desc']}
        cols={[{ key: 'business_date', label: 'Date', sort: true, render: (r) => fmtDate(r.business_date, 'EEE d MMM yyyy') }, { key: 'mpesa', label: 'M-PESA', align: 'right', hideBelow: 'sm', render: (r) => kes(r.totals?.mpesa) }, { key: 'cash', label: 'Cash', align: 'right', render: (r) => kes(r.totals?.cash) },
          { key: 'bank', label: 'Bank', align: 'right', hideBelow: 'md', render: (r) => kes(r.totals?.bank) }, { key: 'exp', label: 'Expenses', align: 'right', hideBelow: 'md', render: (r) => kes(r.totals?.expenses) },
          { key: 'counted_cash_kes', label: 'Counted', align: 'right', hideBelow: 'lg', render: (r) => r.counted_cash_kes == null ? '—' : kes(r.counted_cash_kes) },
          { key: 'variance_kes', label: 'Variance', align: 'right', render: (r) => r.variance_kes == null ? <span className="text-muted-foreground">—</span> : <span className={`font-medium ${vTone(Number(r.variance_kes))}`}>{Number(r.variance_kes) > 0 ? '+' : ''}{kes(r.variance_kes)}</span> },
          { key: 'net', label: 'Net', align: 'right', render: (r) => <span className="font-medium">{kes(Number(r.totals?.mpesa || 0) + Number(r.totals?.cash || 0) + Number(r.totals?.bank || 0) - Number(r.totals?.expenses || 0))}</span> },
          { key: 'notes', label: 'Notes', hideBelow: 'lg', render: (r) => <span className="text-muted-foreground">{r.notes || ''}</span> }]} />
      <Confirm open={confirm} onOpenChange={setConfirm} title="Close today's books?" confirm="Close the day"
        body={variance === null ? 'No cash count entered. You can still close, but the variance will be blank.' : `Counted ${kes(Number(counted))} against ${kes(expectedCash)} expected (${variance > 0 ? '+' : ''}${kes(variance)}).`}
        onConfirm={async () => {
          try {
            await insert('day_closes', { business_date: today, totals: { ...totals, expected_cash: expectedCash }, closed_at: new Date().toISOString(), closed_by: profile?.id, counted_cash_kes: counted === '' ? null : Number(counted), variance_kes: variance, notes: notes || null })
            await logActivity(`Closed the day: net ${kes(totals.mpesa + totals.cash + totals.bank - totals.expenses)}${variance !== null ? `, cash variance ${kes(variance)}` : ''}`, 'day_closed', 'day_close')
            invalidate(['day_closes']); toast.success('Day closed')
          } catch (e: any) { toast.error(e.message) } finally { setConfirm(false) }
        }} />
    </div>
  )
}