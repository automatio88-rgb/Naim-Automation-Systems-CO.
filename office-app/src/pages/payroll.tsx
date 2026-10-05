import { useState } from 'react'
import { toast } from 'sonner'
import { Banknote, Calculator, CheckCheck, FileText, HandCoins, Plus, Users, Wallet } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useList, insert, update, run, logActivity, invalidate, type Row } from '@/services/db'
import { useAuth } from '@/lib/auth'
import { fmtDate, humanize, kes, kesShort, sum } from '@/lib/utils'
import { PAY_METHODS, methodLabel } from '@/lib/status'
import { Badge, Button, Card, ChevronFilter, Confirm, Dialog, Field, Input, Kpi, PageHeader, Select, TabPanel, Tabs } from '@/components/ui'
import { DataTable } from '@/components/data-table'
import { RecordForm } from '@/components/form'
import { useStaffOptions, tablePdf } from '@/components/shared'
/** Kenyan statutory deductions (2025 rates). Shown on every payslip; rates are kept in one place. */
export function statutory(gross: number) {
  const nssf = Math.min(gross, 72000) * 0.06
  const shif = Math.max(gross * 0.0275, 300)
  const housing = gross * 0.015
  const taxable = gross - nssf - shif - housing
  const bands: [number, number][] = [[24000, 0.1], [8333, 0.25], [467667, 0.3], [300000, 0.325], [Infinity, 0.35]]
  let left = Math.max(0, taxable), paye = 0
  for (const [w, r] of bands) { const x = Math.min(left, w); paye += x * r; left -= x; if (left <= 0) break }
  paye = Math.max(0, paye - 2400)
  const r2 = (n: number) => Math.round(n * 100) / 100
  return { nssf: r2(nssf), shif: r2(shif), housing: r2(housing), paye: r2(paye), total: r2(nssf + shif + housing + paye) }
}

const ADV_TONE: Record<string, any> = { pending: 'warning', approved: 'info', repaid: 'success', rejected: 'danger' }
const SLIP_TONE: Record<string, any> = { draft: 'warning', approved: 'info', paid: 'success' }
const owedOn = (a: Row) => Math.max(0, Number(a.amount_kes) - Number(a.repaid_kes || 0))
/** What the next run will recover: the monthly instalment, or everything if no instalment is set. */
const dueNextRun = (a: Row) => { const per = Number(a.recovery_per_month_kes || 0); return per > 0 ? Math.min(owedOn(a), per) : owedOn(a) }
const n0 = (v: unknown) => Number(v || 0).toLocaleString('en-KE', { maximumFractionDigits: 0 })

export default function Payroll() {
  const { can, profile } = useAuth()
  const runs = useList('payroll_runs', { order: ['period_start'] })
  const slips = useList('payslips', { select: '*, staff(full_name,title)', limit: 5000 })
  const adv = useList('salary_advances', { select: '*, staff(full_name)', order: ['requested_at'] })
  const { options: staffOpts } = useStaffOptions()
  const [tab, setTab] = useState('runs')
  const [newRun, setNewRun] = useState(false)
  const [viewId, setViewId] = useState<string | null>(null)
  const [addAdv, setAddAdv] = useState(false)
  const [af, setAf] = useState('all')
  const canApprove = can('payroll', 'approve')
  const R = runs.data || [], last = R[0], A = adv.data || [], SL = slips.data || []
  const slipsOf = (id: string) => SL.filter((s) => s.run_id === id)
  const view = R.find((r) => r.id === viewId) || null
  const openAdv = A.filter((a) => a.status === 'approved')
  const decideAdv = async (r: Row, status: 'approved' | 'rejected') => {
    try {
      await update('salary_advances', r.id, { status, approved_by: profile?.id })
      await logActivity(`${status === 'approved' ? 'Approved' : 'Rejected'} ${kes(r.amount_kes)} advance for ${r.staff?.full_name}`, 'advance_' + status, 'salary_advance', r.id)
      toast.success(status === 'approved' ? 'Approved. Recovery starts on the next run.' : 'Rejected')
    } catch (e: any) { toast.error(e.message) }
  }
  return (
    <div>
      <PageHeader title="Payroll" sub="Monthly runs with proration, incentives, commissions, tips, advances and Kenyan statutory deductions"
        actions={can('payroll', 'create') && (tab === 'advances' ? <Button onClick={() => setAddAdv(true)}><Plus />Record advance</Button> : <Button onClick={() => setNewRun(true)}><Calculator />Run payroll</Button>)} />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-5">
        <Kpi solid tone="brand" label="Last gross" value={Number(last?.totals?.gross || 0)} format={kesShort} icon={<Banknote />} foot={last ? `${fmtDate(last.period_start, 'MMM yyyy')} · ${humanize(last.status)}` : '—'} />
        <Kpi solid tone="success" label="Last net" value={Number(last?.totals?.net || 0)} format={kesShort} icon={<Wallet />} foot={last ? `${slipsOf(last.id).filter((s) => s.status === 'paid').length}/${slipsOf(last.id).length} payslips paid` : undefined} />
        <Kpi solid tone="info" label="Headcount" value={Number(last?.totals?.headcount || staffOpts.length)} icon={<Users />} />
        <Kpi solid tone="warning" label="Advances outstanding" value={sum(openAdv, owedOn)} format={kesShort} icon={<HandCoins />} foot={`${kesShort(sum(openAdv, dueNextRun))} recovered next run`} />
      </div>
      <Tabs value={tab} onChange={setTab} items={[{ id: 'runs', label: 'Payroll runs', count: R.length }, { id: 'advances', label: 'Salary advances', count: A.filter((a) => a.status === 'pending').length }]}>
        <TabPanel id="runs">
          <DataTable rows={R} loading={runs.isLoading} onRow={(r) => setViewId(r.id)} exportName="payroll-runs"
            cols={[{ key: 'period_start', label: 'Period', render: (r) => `${fmtDate(r.period_start, 'd MMM')} – ${fmtDate(r.period_end, 'd MMM yyyy')}` }, { key: 'headcount', label: 'Staff', align: 'right', render: (r) => r.totals?.headcount },
              { key: 'gross', label: 'Gross', align: 'right', render: (r) => kes(r.totals?.gross) }, { key: 'inc', label: 'Incentives', align: 'right', hideBelow: 'lg', render: (r) => kes(r.totals?.incentives || 0) }, { key: 'ded', label: 'Deductions', align: 'right', hideBelow: 'md', render: (r) => kes(r.totals?.deductions) },
              { key: 'net', label: 'Net', align: 'right', render: (r) => <span className="font-medium">{kes(r.totals?.net)}</span> },
              { key: 'paid', label: 'Paid', align: 'right', hideBelow: 'md', render: (r) => { const s = slipsOf(r.id); return `${s.filter((x) => x.status === 'paid').length}/${s.length}` } },
              { key: 'status', label: 'Status', render: (r) => <Badge tone={r.status === 'paid' ? 'success' : r.status === 'approved' ? 'info' : 'warning'} dot>{humanize(r.status)}</Badge> }]} />
        </TabPanel>
        <TabPanel id="advances">
          <div className="mb-4"><ChevronFilter value={af} onChange={setAf} items={[{ id: 'all', label: 'All', count: A.length }, ...Object.keys(ADV_TONE).map((k) => ({ id: k, label: humanize(k), tone: ADV_TONE[k], count: A.filter((a) => a.status === k).length }))]} /></div>
          <DataTable rows={A.filter((a) => af === 'all' || a.status === af)} loading={adv.isLoading} exportName="salary-advances" searchKeys={['staff.full_name', 'reason']}
            cols={[{ key: 'staff.full_name', label: 'Staff', sort: true, render: (r) => <span className="font-medium">{r.staff?.full_name}</span> }, { key: 'requested_at', label: 'Requested', sort: true, hideBelow: 'sm', render: (r) => fmtDate(r.requested_at) }, { key: 'reason', label: 'Reason', hideBelow: 'lg' },
              { key: 'amount_kes', label: 'Amount', align: 'right', sort: true, render: (r) => kes(r.amount_kes) },
              { key: 'repaid_kes', label: 'Recovered', align: 'right', hideBelow: 'md', render: (r) => kes(r.repaid_kes || 0) },
              { key: 'outstanding', label: 'Outstanding', align: 'right', render: (r) => <span className={owedOn(r) > 0 && r.status === 'approved' ? 'font-medium' : 'text-muted-foreground'}>{kes(r.status === 'rejected' ? 0 : owedOn(r))}</span> },
              { key: 'recovery_per_month_kes', label: 'Per month', align: 'right', hideBelow: 'md', render: (r) => Number(r.recovery_per_month_kes) > 0 ? kes(r.recovery_per_month_kes) : <span className="text-muted-foreground">In full</span> },
              { key: 'left', label: 'Runs left', align: 'right', hideBelow: 'lg', render: (r) => r.status !== 'approved' ? '—' : Number(r.recovery_per_month_kes) > 0 ? Math.ceil(owedOn(r) / Number(r.recovery_per_month_kes)) : 1 },
              { key: 'status', label: 'Status', render: (r) => <Badge tone={ADV_TONE[r.status]} dot>{humanize(r.status)}</Badge> },
              { key: 'act', label: '', align: 'right', render: (r) => r.status === 'pending' && canApprove && <div className="flex justify-end gap-1"><Button size="sm" variant="soft" onClick={() => decideAdv(r, 'approved')}>Approve</Button><Button size="sm" variant="ghost" className="text-danger" onClick={() => decideAdv(r, 'rejected')}>Reject</Button></div> }]} />
        </TabPanel>
      </Tabs>
      {newRun && <NewRun onClose={() => setNewRun(false)} />}
      {view && <RunView run={view} slips={slipsOf(view.id)} onClose={() => setViewId(null)} />}
      <RecordForm open={addAdv} onOpenChange={setAddAdv} table="salary_advances" title="Record salary advance"
        fields={[{ name: 'staff_id', label: 'Staff', type: 'select', options: staffOpts, required: true }, { name: 'amount_kes', label: 'Amount (KES)', type: 'number', required: true },
          { name: 'recovery_per_month_kes', label: 'Recover per month (KES)', type: 'number', hint: 'Blank recovers it in full on the next run' }, { name: 'reason', label: 'Reason', type: 'textarea', span: 2 }]}
        preview={(v) => Number(v.amount_kes) > 0 && <div className="text-[13px]">{Number(v.recovery_per_month_kes) > 0 ? `Recovered over ${Math.ceil(Number(v.amount_kes) / Number(v.recovery_per_month_kes))} runs at ${kes(v.recovery_per_month_kes)} a month.` : 'Recovered in full on the next payroll run.'} Needs approval before it is deducted.</div>}
        defaults={{ status: 'pending', repaid_kes: 0, requested_at: new Date().toISOString() }} activity={(v) => `Salary advance request ${kes(v.amount_kes)}`} />
    </div>
  )
}

function NewRun({ onClose }: { onClose: () => void }) {
  const d = new Date(); const start = new Date(d.getFullYear(), d.getMonth(), 1), end = new Date(d.getFullYear(), d.getMonth() + 1, 0)
  const iso = (x: Date) => `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`
  const [from, setFrom] = useState(iso(start)); const [to, setTo] = useState(iso(end))
  const [adj, setAdj] = useState<Record<string, { days?: string; inc?: string }>>({})
  const setA = (id: string, k: 'days' | 'inc', v: string) => setAdj((p) => ({ ...p, [id]: { ...p[id], [k]: v } }))
  const [busy, setBusy] = useState(false)
  const staff = useList('staff', { filter: (b) => b.is('deleted_at', null).eq('status', 'active'), order: ['full_name', true] })
  const comms = useList('commissions', { filter: (b) => b.eq('status', 'pending'), limit: 5000 })
  const adv = useList('salary_advances', { filter: (b) => b.eq('status', 'approved'), limit: 1000 })
  const pd = Math.max(1, Math.round((new Date(to).getTime() - new Date(from).getTime()) / 864e5) + 1)
  const lines = (staff.data || []).map((s) => {
    const a = adj[s.id] || {}
    const days = Math.min(pd, Math.max(0, a.days === undefined || a.days === '' ? pd : Number(a.days)))
    const full = Number(s.base_salary_kes || 0), base = Math.round((full * days) / pd)
    const c = (comms.data || []).filter((x) => x.staff_id === s.id)
    const commission = sum(c.filter((x) => x.kind === 'commission'), 'amount_kes'), tips = sum(c.filter((x) => x.kind === 'tip'), 'amount_kes'), incentives = Number(a.inc || 0)
    const gross = base + commission + tips + incentives, st = statutory(gross)
    const owed = sum((adv.data || []).filter((x) => x.staff_id === s.id), dueNextRun)
    const advances = Math.min(owed, Math.max(0, gross - st.total))
    return { s, days, base, commission, tips, incentives, advances, gross, st, net: Math.round((gross - st.total - advances) * 100) / 100 }
  })
  const T = { gross: sum(lines, 'gross'), incentives: sum(lines, 'incentives'), deductions: sum(lines, (l) => l.st.total + l.advances), net: sum(lines, 'net'), headcount: lines.length }
  const prorated = lines.filter((l) => l.days < pd).length
  return (
    <Dialog open onOpenChange={(v) => !v && onClose()} size="xl" title="Run payroll" description="Base prorated by days worked, plus incentives and pending commissions and tips, less statutory deductions and this month's advance recovery."
      footer={<><Button variant="outline" onClick={onClose}>Cancel</Button><Button loading={busy} disabled={!lines.length} onClick={async () => {
        setBusy(true)
        try {
          const r = await insert('payroll_runs', { period_start: from, period_end: to, status: 'draft', totals: T })
          await insert('payslips', lines.map((l) => ({ run_id: r.id, staff_id: l.s.id, base_kes: l.base, commission_kes: l.commission, tips_kes: l.tips, incentives_kes: l.incentives, allowances_kes: 0, deductions_kes: l.st.total, advances_kes: l.advances, net_kes: l.net, days_worked: l.days, period_days: pd, status: 'draft' })))
          await logActivity(`Prepared payroll ${fmtDate(from, 'MMM yyyy')}: net ${kes(T.net)}`, 'payroll_prepared', 'payroll_run', r.id, { prorated, incentives: T.incentives }); invalidate(['payroll_runs', 'payslips']); toast.success('Payroll prepared as draft'); onClose()
        } catch (e: any) { toast.error(e.message) } finally { setBusy(false) }
      }}>Prepare draft · {kes(T.net)} net</Button></>}>
      <div className="flex flex-wrap items-end gap-4 mb-4">
        <div className="grid grid-cols-2 gap-4 w-full max-w-[420px]"><Field label="From"><Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></Field><Field label="To"><Input type="date" value={to} onChange={(e) => setTo(e.target.value)} /></Field></div>
        <div className="text-[13px] text-muted-foreground pb-2">{pd} days in period{prorated ? ` · ${prorated} prorated` : ''}{T.incentives ? ` · ${kes(T.incentives)} incentives` : ''}</div>
      </div>
      <div className="overflow-x-auto scroll-thin rounded-[14px] border border-border/70">
        <table className="w-full text-[13px] whitespace-nowrap">
          <thead><tr className="bg-foreground/[.025] text-muted-foreground">{['Staff', 'Days', 'Base', 'Commission', 'Tips', 'Incentives', 'Gross', 'NSSF', 'SHIF', 'Housing', 'PAYE', 'Advances', 'Net'].map((h, i) => <th key={h} className={i ? 'text-right font-medium px-3 h-9' : 'text-left font-medium px-3 h-9'}>{h}</th>)}</tr></thead>
          <tbody>{lines.map((l) => <tr key={l.s.id} className="border-t border-border/60">
            <td className="px-3 py-2 font-medium">{l.s.full_name}{l.days < pd && <div className="text-[11px] font-normal text-warning">Prorated {l.days}/{pd} days</div>}</td>
            <td className="px-2 text-right"><Input type="number" min={0} max={pd} className="h-8 w-[70px] text-right ml-auto" value={adj[l.s.id]?.days ?? String(pd)} onChange={(e) => setA(l.s.id, 'days', e.target.value)} /></td>
            {[l.base, l.commission, l.tips].map((v, i) => <td key={i} className="px-3 text-right num">{n0(v)}</td>)}
            <td className="px-2 text-right"><Input type="number" min={0} placeholder="0" className="h-8 w-[100px] text-right ml-auto" value={adj[l.s.id]?.inc ?? ''} onChange={(e) => setA(l.s.id, 'inc', e.target.value)} /></td>
            {[l.gross, l.st.nssf, l.st.shif, l.st.housing, l.st.paye, l.advances].map((v, i) => <td key={i} className="px-3 text-right num">{n0(v)}</td>)}
            <td className="px-3 text-right num font-semibold">{n0(l.net)}</td></tr>)}</tbody>
          <tfoot><tr className="border-t border-border bg-foreground/[.025] font-semibold"><td className="px-3 py-2.5">Total</td><td colSpan={5} /><td className="px-3 text-right num">{n0(T.gross)}</td><td colSpan={5} className="px-3 text-right num text-muted-foreground">−{n0(T.deductions)}</td><td className="px-3 text-right num">{n0(T.net)}</td></tr></tfoot>
        </table>
      </div>
    </Dialog>
  )
}

function RunView({ run: r, slips, onClose }: { run: Row; slips: Row[]; onClose: () => void }) {
  const { can } = useAuth()
  const canApprove = can('payroll', 'approve')
  const [confirm, setConfirm] = useState<'approve' | 'pay' | null>(null)
  const [method, setMethod] = useState('bank')
  const [busy, setBusy] = useState(false)
  const unpaid = slips.filter((s) => s.status !== 'paid')
  const approveAll = async () => {
    try {
      await update('payroll_runs', r.id, { status: 'approved' })
      await run(supabase.from('payslips').update({ status: 'approved' }).eq('run_id', r.id).neq('status', 'paid'))
      await logActivity(`Payroll ${fmtDate(r.period_start, 'MMM yyyy')} approved`, 'payroll_approved', 'payroll_run', r.id); invalidate(); toast.success('Approved. Payslips can now be paid.')
    } catch (e: any) { toast.error(e.message) }
  }
  /** Pays the given payslips: settles each person's commissions and recovers their advances, then closes the run once every slip is paid. */
  const pay = async (list: Row[]) => {
    setBusy(true)
    try {
      const at = new Date().toISOString()
      for (const s of list) {
        await update('payslips', s.id, { status: 'paid', paid_at: at, method })
        await run(supabase.from('commissions').update({ status: 'paid' }).eq('status', 'pending').eq('staff_id', s.staff_id))
        let left = Number(s.advances_kes || 0)
        if (left > 0) {
          const advs = await run<Row[]>(supabase.from('salary_advances').select('id,amount_kes,repaid_kes').eq('staff_id', s.staff_id).eq('status', 'approved').order('requested_at'))
          for (const a of advs) {
            if (left <= 0) break
            const take = Math.min(owedOn(a), left); left -= take
            const repaid = Number(a.repaid_kes || 0) + take
            await update('salary_advances', a.id, { repaid_kes: repaid, status: repaid >= Number(a.amount_kes) ? 'repaid' : 'approved' })
          }
        }
      }
      const done = slips.every((s) => s.status === 'paid' || list.some((l) => l.id === s.id))
      if (done) await update('payroll_runs', r.id, { status: 'paid' })
      await logActivity(list.length === 1 ? `Paid ${list[0].staff?.full_name} ${kes(list[0].net_kes)} (${methodLabel(method)})` : `Paid ${list.length} payslips, ${kes(sum(list, 'net_kes'))} (${methodLabel(method)})`, 'payslip_paid', 'payroll_run', r.id, { method, slips: list.map((l) => l.id) })
      invalidate(); toast.success(done ? 'Payroll fully paid. Commissions and advances settled.' : 'Payslip paid')
    } catch (e: any) { toast.error(e.message) } finally { setBusy(false) }
  }
  return (
    <Dialog open onOpenChange={(v) => !v && onClose()} size="xl" title={`Payroll · ${fmtDate(r.period_start, 'MMMM yyyy')}`} description={`${humanize(r.status)} · net ${kes(r.totals?.net)} · ${slips.length - unpaid.length}/${slips.length} paid`}
      footer={<>
        <Button variant="outline" onClick={() => tablePdf(`Payroll ${fmtDate(r.period_start, 'MMMM yyyy')}`, ['Staff', 'Days', 'Base', 'Commission', 'Tips', 'Incentives', 'Deductions', 'Advances', 'Net', 'Status'], slips.map((s) => [s.staff?.full_name, s.period_days ? `${s.days_worked}/${s.period_days}` : '—', kes(s.base_kes), kes(s.commission_kes), kes(s.tips_kes), kes(s.incentives_kes || 0), kes(s.deductions_kes), kes(s.advances_kes), kes(s.net_kes), humanize(s.status)]))}><FileText />Payroll PDF</Button>
        {r.status === 'draft' && canApprove && <Button onClick={() => setConfirm('approve')}><CheckCheck />Approve all</Button>}
        {r.status === 'approved' && canApprove && unpaid.length > 0 && <><div className="w-[160px]"><Select value={method} onChange={setMethod} options={PAY_METHODS} /></div><Button variant="success" loading={busy} onClick={() => setConfirm('pay')}>Pay all · {kes(sum(unpaid, 'net_kes'))}</Button></>}
      </>}>
      {!canApprove && r.status !== 'paid' && <p className="text-[13px] text-muted-foreground mb-3">You can view this run. Approving and paying needs payroll approval rights.</p>}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">{slips.map((s) => {
        const st = statutory(Number(s.base_kes) + Number(s.commission_kes) + Number(s.tips_kes) + Number(s.incentives_kes || 0) + Number(s.allowances_kes || 0))
        return (
          <Card key={s.id} title={s.staff?.full_name} sub={s.period_days && Number(s.days_worked) < Number(s.period_days) ? `${s.staff?.title || ''} · ${s.days_worked}/${s.period_days} days` : s.staff?.title} action={<Badge tone={SLIP_TONE[s.status] || 'neutral'} dot>{humanize(s.status)}</Badge>}>
            <dl className="text-[13px] space-y-1">
              {[['Base', s.base_kes], ['Commission', s.commission_kes], ['Tips', s.tips_kes], ['Incentives', s.incentives_kes], ['NSSF', -st.nssf], ['SHIF', -st.shif], ['Housing levy', -st.housing], ['PAYE', -st.paye], ['Advance recovery', -Number(s.advances_kes)]].filter(([, v]) => Number(v || 0) !== 0).map(([k, v]) => <div key={k as string} className="flex justify-between"><dt className="text-muted-foreground">{k}</dt><dd className="num">{kes(v)}</dd></div>)}
              <div className="flex justify-between border-t border-border/70 pt-1.5 mt-1.5 font-semibold"><dt>Net pay</dt><dd className="num">{kes(s.net_kes)}</dd></div>
            </dl>
            {s.status === 'paid' ? <div className="mt-3 text-[12px] text-muted-foreground">Paid {s.paid_at ? fmtDate(s.paid_at) : ''}{s.method ? ` · ${methodLabel(s.method)}` : ''}</div>
              : r.status === 'approved' && canApprove && <Button size="sm" variant="soft" className="mt-3 w-full" disabled={busy} onClick={() => pay([s])}>Pay {kes(s.net_kes)} by {methodLabel(method)}</Button>}
          </Card>)
      })}</div>
      <Confirm open={!!confirm} onOpenChange={(v) => !v && setConfirm(null)} title={confirm === 'pay' ? `Pay ${unpaid.length} payslips by ${methodLabel(method)}?` : 'Approve payroll?'} confirm={confirm === 'pay' ? 'Pay all' : 'Approve all'}
        body={confirm === 'pay' ? 'Each slip is marked paid today. Commissions and tips move to paid and advance instalments are recovered.' : 'Locks the numbers and moves every payslip to approved, ready to pay.'}
        onConfirm={async () => { const c = confirm; setConfirm(null); if (c === 'pay') await pay(unpaid); else await approveAll() }} />
    </Dialog>
  )
}