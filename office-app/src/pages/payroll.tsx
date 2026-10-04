import { useState } from 'react'
import { toast } from 'sonner'
import { Banknote, Calculator, FileText, HandCoins, Plus, Users } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useList, insert, update, run, logActivity, invalidate, type Row } from '@/services/db'
import { useAuth } from '@/lib/auth'
import { fmtDate, humanize, kes, kesShort, sum } from '@/lib/utils'
import { Badge, Button, Card, Confirm, Dialog, Field, Input, Kpi, PageHeader, TabPanel, Tabs } from '@/components/ui'
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

export default function Payroll() {
  const { can, profile } = useAuth()
  const runs = useList('payroll_runs', { order: ['period_start'] })
  const slips = useList('payslips', { select: '*, staff(full_name,title)', limit: 5000 })
  const adv = useList('salary_advances', { select: '*, staff(full_name)', order: ['requested_at'] })
  const { options: staffOpts } = useStaffOptions()
  const [tab, setTab] = useState('runs')
  const [newRun, setNewRun] = useState(false)
  const [view, setView] = useState<Row | null>(null)
  const [addAdv, setAddAdv] = useState(false)
  const R = runs.data || [], last = R[0]
  const openAdv = (adv.data || []).filter((a) => a.status === 'approved')
  return (
    <div>
      <PageHeader title="Payroll" sub="Monthly runs with commissions, tips, advances and Kenyan statutory deductions"
        actions={can('payroll', 'create') && (tab === 'advances' ? <Button onClick={() => setAddAdv(true)}><Plus />Record advance</Button> : <Button onClick={() => setNewRun(true)}><Calculator />Run payroll</Button>)} />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-5">
        <Kpi solid tone="brand" label="Last gross" value={Number(last?.totals?.gross || 0)} format={kesShort} icon={<Banknote />} foot={last ? `${fmtDate(last.period_start, 'MMM yyyy')}` : '—'} />
        <Kpi solid tone="success" label="Last net paid" value={Number(last?.totals?.net || 0)} format={kesShort} />
        <Kpi solid tone="info" label="Headcount" value={Number(last?.totals?.headcount || staffOpts.length)} icon={<Users />} />
        <Kpi solid tone="warning" label="Advances outstanding" value={sum(openAdv, (a) => a.amount_kes - (a.repaid_kes || 0))} format={kesShort} icon={<HandCoins />} />
      </div>
      <Tabs value={tab} onChange={setTab} items={[{ id: 'runs', label: 'Payroll runs', count: R.length }, { id: 'advances', label: 'Salary advances', count: (adv.data || []).filter((a) => a.status === 'pending').length }]}>
        <TabPanel id="runs">
          <DataTable rows={R} loading={runs.isLoading} onRow={setView} exportName="payroll-runs"
            cols={[{ key: 'period_start', label: 'Period', render: (r) => `${fmtDate(r.period_start, 'd MMM')} – ${fmtDate(r.period_end, 'd MMM yyyy')}` }, { key: 'headcount', label: 'Staff', align: 'right', render: (r) => r.totals?.headcount },
              { key: 'gross', label: 'Gross', align: 'right', render: (r) => kes(r.totals?.gross) }, { key: 'ded', label: 'Deductions', align: 'right', hideBelow: 'md', render: (r) => kes(r.totals?.deductions) },
              { key: 'net', label: 'Net', align: 'right', render: (r) => <span className="font-medium">{kes(r.totals?.net)}</span> }, { key: 'status', label: 'Status', render: (r) => <Badge tone={r.status === 'paid' ? 'success' : r.status === 'approved' ? 'info' : 'warning'} dot>{humanize(r.status)}</Badge> }]} />
        </TabPanel>
        <TabPanel id="advances">
          <DataTable rows={adv.data} loading={adv.isLoading} exportName="salary-advances"
            cols={[{ key: 'staff.full_name', label: 'Staff', sort: true }, { key: 'requested_at', label: 'Requested', render: (r) => fmtDate(r.requested_at) }, { key: 'reason', label: 'Reason', hideBelow: 'md' },
              { key: 'amount_kes', label: 'Amount', align: 'right', render: (r) => kes(r.amount_kes) }, { key: 'repaid_kes', label: 'Repaid', align: 'right', hideBelow: 'sm', render: (r) => kes(r.repaid_kes) },
              { key: 'status', label: 'Status', render: (r) => <Badge tone={r.status === 'approved' ? 'info' : r.status === 'repaid' ? 'success' : r.status === 'pending' ? 'warning' : 'danger'} dot>{humanize(r.status)}</Badge> },
              { key: 'act', label: '', align: 'right', render: (r) => r.status === 'pending' && can('payroll', 'edit') && <div className="flex justify-end gap-1"><Button size="sm" variant="soft" onClick={async () => { await update('salary_advances', r.id, { status: 'approved', approved_by: profile?.id }); await logActivity(`Approved ${kes(r.amount_kes)} advance for ${r.staff?.full_name}`, 'advance_approved', 'salary_advance', r.id); toast.success('Approved. It will be deducted on the next run.') }}>Approve</Button><Button size="sm" variant="ghost" className="text-danger" onClick={async () => { await update('salary_advances', r.id, { status: 'rejected' }); toast.success('Rejected') }}>Reject</Button></div> }]} />
        </TabPanel>
      </Tabs>
      {newRun && <NewRun onClose={() => setNewRun(false)} />}
      {view && <RunView run={view} slips={(slips.data || []).filter((s) => s.run_id === view.id)} onClose={() => setView(null)} />}
      <RecordForm open={addAdv} onOpenChange={setAddAdv} table="salary_advances" title="Record salary advance"
        fields={[{ name: 'staff_id', label: 'Staff', type: 'select', options: staffOpts, required: true }, { name: 'amount_kes', label: 'Amount (KES)', type: 'number', required: true }, { name: 'reason', label: 'Reason', type: 'textarea' }]}
        defaults={{ status: 'pending', repaid_kes: 0, requested_at: new Date().toISOString() }} activity={(v) => `Salary advance request ${kes(v.amount_kes)}`} />
    </div>
  )
}

function NewRun({ onClose }: { onClose: () => void }) {
  const d = new Date(); const start = new Date(d.getFullYear(), d.getMonth(), 1), end = new Date(d.getFullYear(), d.getMonth() + 1, 0)
  const [from, setFrom] = useState(start.toISOString().slice(0, 10)); const [to, setTo] = useState(end.toISOString().slice(0, 10))
  const [busy, setBusy] = useState(false)
  const staff = useList('staff', { filter: (b) => b.is('deleted_at', null).eq('status', 'active'), order: ['full_name', true] })
  const comms = useList('commissions', { filter: (b) => b.eq('status', 'pending'), limit: 5000 })
  const adv = useList('salary_advances', { filter: (b) => b.eq('status', 'approved'), limit: 1000 })
  const lines = (staff.data || []).map((s) => {
    const c = (comms.data || []).filter((x) => x.staff_id === s.id)
    const commission = sum(c.filter((x) => x.kind === 'commission'), 'amount_kes'), tips = sum(c.filter((x) => x.kind === 'tip'), 'amount_kes')
    const advances = sum((adv.data || []).filter((a) => a.staff_id === s.id), (a) => a.amount_kes - (a.repaid_kes || 0))
    const gross = Number(s.base_salary_kes || 0) + commission + tips, st = statutory(gross)
    return { s, base: Number(s.base_salary_kes || 0), commission, tips, advances, gross, st, net: Math.round((gross - st.total - advances) * 100) / 100 }
  })
  const T = { gross: sum(lines, 'gross'), deductions: sum(lines, (l) => l.st.total + l.advances), net: sum(lines, 'net'), headcount: lines.length }
  return (
    <Dialog open onOpenChange={(v) => !v && onClose()} size="xl" title="Run payroll" description="Base + pending commissions and tips, less statutory deductions and approved advances."
      footer={<><Button variant="outline" onClick={onClose}>Cancel</Button><Button loading={busy} disabled={!lines.length} onClick={async () => {
        setBusy(true)
        try {
          const r = await insert('payroll_runs', { period_start: from, period_end: to, status: 'draft', totals: T })
          await insert('payslips', lines.map((l) => ({ run_id: r.id, staff_id: l.s.id, base_kes: l.base, commission_kes: l.commission, tips_kes: l.tips, allowances_kes: 0, deductions_kes: l.st.total, advances_kes: l.advances, net_kes: l.net, status: 'draft' })))
          await logActivity(`Prepared payroll ${fmtDate(from, 'MMM yyyy')}: net ${kes(T.net)}`, 'payroll_prepared', 'payroll_run', r.id); invalidate(['payroll_runs', 'payslips']); toast.success('Payroll prepared as draft'); onClose()
        } catch (e: any) { toast.error(e.message) } finally { setBusy(false) }
      }}>Prepare draft · {kes(T.net)} net</Button></>}>
      <div className="grid grid-cols-2 gap-4 max-w-[420px] mb-4"><Field label="From"><Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></Field><Field label="To"><Input type="date" value={to} onChange={(e) => setTo(e.target.value)} /></Field></div>
      <div className="overflow-x-auto scroll-thin rounded-[14px] border border-border/70">
        <table className="w-full text-[13px] whitespace-nowrap">
          <thead><tr className="bg-foreground/[.025] text-muted-foreground">{['Staff', 'Base', 'Commission', 'Tips', 'Gross', 'NSSF', 'SHIF', 'Housing', 'PAYE', 'Advances', 'Net'].map((h, i) => <th key={h} className={i ? 'text-right font-medium px-3 h-9' : 'text-left font-medium px-3 h-9'}>{h}</th>)}</tr></thead>
          <tbody>{lines.map((l) => <tr key={l.s.id} className="border-t border-border/60">
            <td className="px-3 py-2.5 font-medium">{l.s.full_name}</td>{[l.base, l.commission, l.tips, l.gross, l.st.nssf, l.st.shif, l.st.housing, l.st.paye, l.advances].map((v, i) => <td key={i} className="px-3 text-right num">{Number(v).toLocaleString('en-KE', { maximumFractionDigits: 0 })}</td>)}
            <td className="px-3 text-right num font-semibold">{l.net.toLocaleString('en-KE', { maximumFractionDigits: 0 })}</td></tr>)}</tbody>
          <tfoot><tr className="border-t border-border bg-foreground/[.025] font-semibold"><td className="px-3 py-2.5">Total</td><td colSpan={3} /><td className="px-3 text-right num">{T.gross.toLocaleString('en-KE')}</td><td colSpan={5} className="px-3 text-right num text-muted-foreground">−{T.deductions.toLocaleString('en-KE')}</td><td className="px-3 text-right num">{T.net.toLocaleString('en-KE')}</td></tr></tfoot>
        </table>
      </div>
    </Dialog>
  )
}

function RunView({ run: r, slips, onClose }: { run: Row; slips: Row[]; onClose: () => void }) {
  const [confirm, setConfirm] = useState<'approve' | 'pay' | null>(null)
  const advance = async (status: 'approved' | 'paid') => {
    try {
      await update('payroll_runs', r.id, { status })
      await run(supabase.from('payslips').update({ status }).eq('run_id', r.id))
      if (status === 'paid') {
        const staffIds = slips.map((s) => s.staff_id)
        await run(supabase.from('commissions').update({ status: 'paid' }).eq('status', 'pending').in('staff_id', staffIds))
        for (const s of slips.filter((x) => Number(x.advances_kes) > 0)) await run(supabase.from('salary_advances').update({ status: 'repaid' }).eq('staff_id', s.staff_id).eq('status', 'approved'))
      }
      await logActivity(`Payroll ${fmtDate(r.period_start, 'MMM yyyy')} ${status}`, 'payroll_' + status, 'payroll_run', r.id); invalidate(); toast.success(status === 'paid' ? 'Marked paid. Commissions and advances settled.' : 'Approved'); onClose()
    } catch (e: any) { toast.error(e.message) }
  }
  return (
    <Dialog open onOpenChange={(v) => !v && onClose()} size="xl" title={`Payroll · ${fmtDate(r.period_start, 'MMMM yyyy')}`} description={`${humanize(r.status)} · net ${kes(r.totals?.net)}`}
      footer={<>
        <Button variant="outline" onClick={() => tablePdf(`Payroll ${fmtDate(r.period_start, 'MMMM yyyy')}`, ['Staff', 'Base', 'Commission', 'Tips', 'Deductions', 'Advances', 'Net'], slips.map((s) => [s.staff?.full_name, kes(s.base_kes), kes(s.commission_kes), kes(s.tips_kes), kes(s.deductions_kes), kes(s.advances_kes), kes(s.net_kes)]))}><FileText />Payroll PDF</Button>
        {r.status === 'draft' && <Button onClick={() => setConfirm('approve')}>Approve</Button>}
        {r.status === 'approved' && <Button variant="success" onClick={() => setConfirm('pay')}>Mark paid</Button>}
      </>}>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">{slips.map((s) => {
        const st = statutory(Number(s.base_kes) + Number(s.commission_kes) + Number(s.tips_kes))
        return (
          <Card key={s.id} title={s.staff?.full_name} sub={s.staff?.title}>
            <dl className="text-[13px] space-y-1">
              {[['Base', s.base_kes], ['Commission', s.commission_kes], ['Tips', s.tips_kes], ['NSSF', -st.nssf], ['SHIF', -st.shif], ['Housing levy', -st.housing], ['PAYE', -st.paye], ['Advances', -Number(s.advances_kes)]].filter(([, v]) => Number(v) !== 0).map(([k, v]) => <div key={k as string} className="flex justify-between"><dt className="text-muted-foreground">{k}</dt><dd className="num">{kes(v)}</dd></div>)}
              <div className="flex justify-between border-t border-border/70 pt-1.5 mt-1.5 font-semibold"><dt>Net pay</dt><dd className="num">{kes(s.net_kes)}</dd></div>
            </dl>
          </Card>)
      })}</div>
      <Confirm open={!!confirm} onOpenChange={(v) => !v && setConfirm(null)} title={confirm === 'pay' ? 'Mark payroll as paid?' : 'Approve payroll?'} confirm={confirm === 'pay' ? 'Mark paid' : 'Approve'}
        body={confirm === 'pay' ? 'Commissions and tips move to paid and deducted advances are marked repaid.' : 'Locks the numbers for payment.'} onConfirm={() => advance(confirm === 'pay' ? 'paid' : 'approved')} />
    </Dialog>
  )
}