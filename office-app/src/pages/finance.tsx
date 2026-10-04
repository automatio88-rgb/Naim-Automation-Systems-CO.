import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { ArrowDownLeft, ArrowUpRight, CalendarCheck2, Landmark, Percent, Scale, Wallet } from 'lucide-react'
import { useList, insert, logActivity, type Row } from '@/services/db'
import { useBiz } from '@/lib/business'
import { fmtDate, fmtDT, humanize, kes, kesShort, sum } from '@/lib/utils'
import { methodLabel } from '@/lib/status'
import { RANGES, rangeBounds, inRange, series, type RangeId } from '@/lib/range'
import { Badge, Button, Card, Confirm, Kpi, PageHeader, Segmented, TabPanel, Tabs } from '@/components/ui'
import { DataTable } from '@/components/data-table'
import { AreaTrend, Bars, Donut } from '@/components/charts'

const BUCKETS = ['current', '1-30', '31-60', '61-90', '90+']

export default function Finance() {
  const nav = useNavigate()
  const { scope } = useBiz()
  const [tab, setTab] = useState('cashflow')
  const [range, setRange] = useState<RangeId>('year')
  const { from, to } = rangeBounds(range)
  const pay = useList('payments', { select: '*, invoices!inner(number,type,business_id,clients(business_name))', filter: (b) => scope(b, 'invoices.business_id'), order: ['paid_at'], limit: 10000 })
  const exp = useList('expenses', { filter: (b) => scope(b.is('deleted_at', null).neq('status', 'rejected')), limit: 10000 })
  const ar = useList('v_receivables_ageing', { limit: 2000 })
  const po = useList('purchase_orders', { select: '*, suppliers(name)', filter: (b) => b.neq('status', 'cancelled'), limit: 2000 })
  const mrr = useList('v_mrr')
  const settings = useList('app_settings')
  const closes = useList('day_closes', { order: ['business_date'], limit: 120 })
  const tax = (settings.data || []).find((s) => s.key === 'tax')?.value || {}
  const P = (pay.data || []).filter((p) => inRange(p.paid_at, from, to)), E = (exp.data || []).filter((e) => inRange(e.paid_at, from, to) && e.status === 'paid')
  const inflow = sum(P, 'amount_kes'), outflow = sum(E, 'amount_kes')
  const trend = useMemo(() => { const a = series(P, range, (p) => p.paid_at, (p) => Number(p.amount_kes)), b = series(E, range, (e) => e.paid_at, (e) => Number(e.amount_kes)); let run = 0; return a.map((x, i) => { run += x.value - (b[i]?.value || 0); return { label: x.label, in: x.value, out: b[i]?.value || 0, net: run } }) }, [P.length, E.length, range]) // eslint-disable-line
  const AR = (ar.data || []).filter((r) => Number(r.outstanding_kes) > 0)
  const payables = [...(po.data || []).filter((p) => Number(p.total_kes) > Number(p.paid_kes)).map((p) => ({ id: p.id, kind: 'Purchase order', ref: p.number, party: p.suppliers?.name, due: p.expected_at, amount: Number(p.total_kes) - Number(p.paid_kes) })),
    ...(exp.data || []).filter((e) => e.status === 'pending').map((e) => ({ id: e.id, kind: 'Expense', ref: humanize(e.category), party: e.vendor || e.description, due: e.paid_at, amount: Number(e.amount_kes) }))]
  const vatPct = Number(tax.vat_pct || 16), whPct = Number(tax.withholding_pct || 5)
  return (
    <div>
      <PageHeader title="Finance" sub="Cash flow, what we are owed, what we owe, tax and the daily close" actions={<Segmented value={range} onChange={setRange} items={RANGES} />} />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-5">
        <Kpi solid tone="success" label="Money in" value={inflow} format={kesShort} icon={<ArrowDownLeft />} />
        <Kpi solid tone="danger" label="Money out" value={outflow} format={kesShort} icon={<ArrowUpRight />} />
        <Kpi solid tone="brand" label="Net cash" value={inflow - outflow} format={kesShort} icon={<Wallet />} />
        <Kpi solid tone="info" label="MRR" value={Number(mrr.data?.[0]?.mrr_kes || 0)} format={kesShort} foot={`${mrr.data?.[0]?.active_subscriptions ?? 0} care plans`} />
      </div>
      <Tabs value={tab} onChange={setTab} items={[{ id: 'cashflow', label: 'Cash flow' }, { id: 'ar', label: 'Receivables', count: AR.length }, { id: 'payables', label: 'Payables', count: payables.length }, { id: 'tax', label: 'Tax' }, { id: 'close', label: 'Day close' }, { id: 'payments', label: 'Payments' }]}>
        <TabPanel id="cashflow">
          <div className="grid lg:grid-cols-3 gap-4">
            <Card className="lg:col-span-2" title="In, out and running balance"><AreaTrend data={trend} x="label" height={280} series={[{ key: 'in', name: 'In', color: 'var(--success)' }, { key: 'out', name: 'Out', color: 'var(--danger)' }, { key: 'net', name: 'Running net', color: 'var(--p)' }]} /></Card>
            <Card title="Money in by method"><Donut height={180} data={Object.entries(P.reduce((a: Row, p) => { a[p.method] = (a[p.method] || 0) + Number(p.amount_kes); return a }, {})).map(([k, v]) => ({ name: methodLabel(k), value: v as number }))} /></Card>
            <Card className="lg:col-span-3" title="Expenses by category"><Bars height={240} x="cat" series={[{ key: 'v', name: 'Spent', color: 'var(--c5)' }]} data={Object.entries(E.reduce((a: Row, e) => { a[e.category] = (a[e.category] || 0) + Number(e.amount_kes); return a }, {})).map(([k, v]) => ({ cat: humanize(k), v })).sort((a: any, b: any) => b.v - a.v)} /></Card>
          </div>
        </TabPanel>
        <TabPanel id="ar">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">{BUCKETS.map((b, i) => <Kpi key={b} tone={(['success', 'info', 'warning', 'danger', 'danger'] as const)[i]} label={b === 'current' ? 'Not yet due' : `${b} days`} value={sum(AR.filter((r) => r.bucket === b), 'outstanding_kes')} format={kesShort} foot={`${AR.filter((r) => r.bucket === b).length} invoices`} />)}</div>
          <DataTable rows={AR} loading={ar.isLoading} onRow={(r) => nav(`/invoices?invoice=${r.id}`)} searchKeys={['number', 'business_name']} exportName="receivables" initialSort={['outstanding_kes', 'desc']}
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
            <Card title="Withholding tax" sub={`${whPct}% deducted by corporate clients`}><div className="font-display text-[30px] font-semibold num">{kes((sum(P.filter((p) => ['deposit', 'balance'].includes(p.invoices?.type)), 'amount_kes') * whPct) / 100)}</div><p className="text-[13px] text-muted-foreground mt-1">Estimate on project payments. Claim against income tax with the certificates.</p></Card>
            <Card title="Turnover tax estimate" sub="3% of gross receipts (TOT)"><div className="font-display text-[30px] font-semibold num">{kes(inflow * 0.03)}</div><p className="text-[13px] text-muted-foreground mt-1">Confirm the regime with your accountant. Rates are editable in Settings.</p></Card>
          </div>
          <Card className="mt-4" title="Monthly tax base"><Bars height={240} x="label" series={[{ key: 'value', name: 'Gross receipts', color: 'var(--p)' }]} data={series(P, range === 'today' || range === 'week' ? 'month' : range, (p) => p.paid_at, (p) => Number(p.amount_kes))} /></Card>
        </TabPanel>
        <TabPanel id="close"><DayClose closes={closes.data || []} payments={pay.data || []} expenses={exp.data || []} /></TabPanel>
        <TabPanel id="payments">
          <DataTable rows={P} loading={pay.isLoading} searchKeys={['reference', 'invoices.number', 'invoices.clients.business_name']} exportName="payments" initialSort={['paid_at', 'desc']}
            cols={[{ key: 'paid_at', label: 'Date', sort: true, render: (r) => fmtDT(r.paid_at) }, { key: 'invoices.number', label: 'Invoice', render: (r) => <span className="num">{r.invoices?.number}</span> }, { key: 'invoices.clients.business_name', label: 'Client', render: (r) => r.invoices?.clients?.business_name || 'Walk-in' },
              { key: 'method', label: 'Method', render: (r) => methodLabel(r.method) }, { key: 'reference', label: 'Reference', hideBelow: 'md', render: (r) => <span className="font-mono text-[12px]">{r.reference || '—'}</span> }, { key: 'amount_kes', label: 'Amount', align: 'right', sort: true, render: (r) => <span className="font-medium">{kes(r.amount_kes)}</span> }]} />
        </TabPanel>
      </Tabs>
      <div className="hidden"><Landmark /><Percent /><CalendarCheck2 /></div>
    </div>
  )
}

function DayClose({ closes, payments, expenses }: { closes: Row[]; payments: Row[]; expenses: Row[] }) {
  const [confirm, setConfirm] = useState(false)
  const today = new Date().toISOString().slice(0, 10)
  const isToday = (d: string) => d && new Date(d).toISOString().slice(0, 10) === today
  const P = payments.filter((p) => isToday(p.paid_at)), E = expenses.filter((e) => isToday(e.paid_at) && e.status === 'paid')
  const totals = { mpesa: sum(P.filter((p) => p.method === 'mpesa'), 'amount_kes'), cash: sum(P.filter((p) => p.method === 'cash'), 'amount_kes'), bank: sum(P.filter((p) => ['bank', 'card'].includes(p.method)), 'amount_kes'), expenses: sum(E, 'amount_kes') }
  const closed = closes.some((c) => c.business_date === today)
  return (
    <div className="grid gap-4">
      <Card title={`Today, ${fmtDate(new Date(), 'd MMMM')}`} sub={closed ? 'Already closed' : 'Review and close the books for today'} action={!closed && <Button onClick={() => setConfirm(true)}><CalendarCheck2 />Close the day</Button>}>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[['M-PESA', totals.mpesa], ['Cash', totals.cash], ['Bank & card', totals.bank], ['Expenses', totals.expenses], ['Net', totals.mpesa + totals.cash + totals.bank - totals.expenses]].map(([k, v]) => <div key={k as string} className="rounded-[14px] bg-foreground/[.035] px-4 py-3"><div className="text-[12px] text-muted-foreground">{k}</div><div className="font-semibold num text-[18px]">{kes(v)}</div></div>)}
        </div>
      </Card>
      <DataTable rows={closes} exportName="day-closes" initialSort={['business_date', 'desc']}
        cols={[{ key: 'business_date', label: 'Date', sort: true, render: (r) => fmtDate(r.business_date, 'EEE d MMM yyyy') }, { key: 'mpesa', label: 'M-PESA', align: 'right', render: (r) => kes(r.totals?.mpesa) }, { key: 'cash', label: 'Cash', align: 'right', render: (r) => kes(r.totals?.cash) },
          { key: 'bank', label: 'Bank', align: 'right', hideBelow: 'md', render: (r) => kes(r.totals?.bank) }, { key: 'exp', label: 'Expenses', align: 'right', hideBelow: 'md', render: (r) => kes(r.totals?.expenses) },
          { key: 'net', label: 'Net', align: 'right', render: (r) => <span className="font-medium">{kes(Number(r.totals?.mpesa || 0) + Number(r.totals?.cash || 0) + Number(r.totals?.bank || 0) - Number(r.totals?.expenses || 0))}</span> }]} />
      <Confirm open={confirm} onOpenChange={setConfirm} title="Close today's books?" confirm="Close the day" body="This records today's totals. Payments recorded later still count, but the close is a snapshot."
        onConfirm={async () => { try { await insert('day_closes', { business_date: today, totals, closed_at: new Date().toISOString() }); await logActivity(`Closed the day: net ${kes(totals.mpesa + totals.cash + totals.bank - totals.expenses)}`, 'day_closed', 'day_close'); toast.success('Day closed') } catch (e: any) { toast.error(e.message) } finally { setConfirm(false) } }} />
    </div>
  )
}