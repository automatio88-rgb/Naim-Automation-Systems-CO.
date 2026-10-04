import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { Handshake, Plus, ReceiptText, Trophy } from 'lucide-react'
import { useList, update, rpc, logActivity, type Row } from '@/services/db'
import { useAuth } from '@/lib/auth'
import { useBiz } from '@/lib/business'
import { cn, fmtDate, kes, kesShort, sum } from '@/lib/utils'
import { DEAL_STAGES, dealStage } from '@/lib/status'
import { Flip, gsap, prefersReduced } from '@/lib/gsap'
import { Badge, Button, Card, Confirm, Kpi, PageHeader, Segmented } from '@/components/ui'
import { DataTable } from '@/components/data-table'
import { RecordForm } from '@/components/form'
import { useClientOptions } from '@/components/shared'

export default function Deals() {
  const { can } = useAuth()
  const { scope } = useBiz()
  const deals = useList('deals', { select: '*, clients(business_name), leads(business_name)', filter: (b) => scope(b.is('deleted_at', null)), order: ['created_at'] })
  const { options: clientOpts } = useClientOptions()
  const [view, setView] = useState<'board' | 'table'>('board')
  const [edit, setEdit] = useState<Row | null | undefined>(undefined)
  const [invFor, setInvFor] = useState<Row | null>(null)
  const [drag, setDrag] = useState<string | null>(null)
  const board = useRef<HTMLDivElement>(null)
  const rows = deals.data || []
  const open = rows.filter((d) => !['won', 'lost'].includes(d.stage))
  const name = (d: Row) => d.clients?.business_name || d.leads?.business_name || '—'

  async function move(d: Row, stage: string) {
    if (d.stage === stage) return
    const state = !prefersReduced() && board.current ? Flip.getState(board.current.querySelectorAll('[data-deal]')) : null
    const patch: Row = { stage }
    if (stage === 'won') { patch.won_at = new Date().toISOString(); patch.probability = 100 }
    if (stage === 'lost') { patch.lost_at = new Date().toISOString(); patch.probability = 0 }
    if (stage === 'contract') patch.probability = 80
    try {
      await update('deals', d.id, patch)
      await logActivity(`${d.title} moved to ${dealStage(stage).label}`, stage === 'won' ? 'deal_won' : 'deal_stage', 'deal', d.id, { stage })
      await deals.refetch()
      if (state) requestAnimationFrame(() => Flip.from(state, { duration: 0.5, ease: 'md-emph', absolute: false, nested: true }))
      if (stage === 'contract') setInvFor(d)
      if (stage === 'won' && !prefersReduced()) gsap.fromTo(`[data-deal="${d.id}"]`, { scale: 1.04 }, { scale: 1, duration: 0.6, ease: 'elastic.out(1,0.5)' })
      toast.success(`Moved to ${dealStage(stage).label}`)
    } catch (e: any) { toast.error(e.message) }
  }

  return (
    <div>
      <PageHeader title="Deals" sub="Discovery to deposit to won. Signing a contract creates the 50/50 invoices."
        actions={<><Segmented value={view} onChange={setView} items={[{ id: 'board', label: 'Board' }, { id: 'table', label: 'Table' }]} />{can('deals', 'create') && <Button onClick={() => setEdit(null)}><Plus />New deal</Button>}</>} />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-5">
        <Kpi label="Open pipeline" value={sum(open, 'value_kes')} format={kesShort} icon={<Handshake />} />
        <Kpi tone="info" label="Weighted" value={sum(open, (d) => (d.value_kes * (d.probability || 0)) / 100)} format={kesShort} />
        <Kpi tone="success" label="Won (all time)" value={sum(rows.filter((d) => d.stage === 'won'), 'value_kes')} format={kesShort} icon={<Trophy />} />
        <Kpi tone="violet" label="Win rate" value={Math.round((rows.filter((d) => d.stage === 'won').length / Math.max(1, rows.filter((d) => ['won', 'lost'].includes(d.stage)).length)) * 100)} format={(n) => `${Math.round(n)}%`} />
      </div>
      {view === 'board' ? (
        <div ref={board} className="overflow-x-auto scroll-thin pb-3 -mx-4 px-4 sm:mx-0 sm:px-0">
          <div className="flex gap-3 min-w-max">
            {DEAL_STAGES.map((s) => {
              const col = rows.filter((d) => d.stage === s.id)
              return (
                <div key={s.id} data-reveal onDragOver={(e) => e.preventDefault()} onDrop={() => { const d = rows.find((x) => x.id === drag); if (d) move(d, s.id); setDrag(null) }}
                  className={cn('w-[272px] rounded-panel bg-foreground/[.035] p-2.5 flex flex-col transition-colors', drag && 'outline-dashed outline-1 outline-border')}>
                  <div className="flex items-center gap-2 px-2 py-1.5">
                    <Badge tone={s.tone} dot>{s.label}</Badge><span className="text-[12px] text-muted-foreground num">{col.length}</span>
                    <span className="ml-auto text-[12px] text-muted-foreground num">{kesShort(sum(col, 'value_kes'))}</span>
                  </div>
                  <div className="space-y-2 mt-1 min-h-[80px]">
                    {col.map((d) => (
                      <div key={d.id} data-deal={d.id} draggable={can('deals', 'edit')} onDragStart={() => setDrag(d.id)} onDragEnd={() => setDrag(null)} onClick={() => setEdit(d)}
                        className={cn('rounded-card bg-card border border-border/70 shadow-e1 p-3.5 cursor-grab active:cursor-grabbing hover:shadow-e2 transition-shadow', drag === d.id && 'opacity-50')}>
                        <div className="text-[13.5px] font-medium leading-snug">{d.title}</div>
                        <div className="text-[12px] text-muted-foreground mt-0.5 truncate">{name(d)}</div>
                        <div className="flex items-center justify-between mt-3">
                          <span className="font-semibold num text-[14px]">{kes(d.value_kes)}</span>
                          <span className="text-[12px] text-muted-foreground num">{d.probability ?? 0}%</span>
                        </div>
                        <div className="text-[11.5px] text-muted-foreground mt-1">{d.stage === 'won' ? `Won ${fmtDate(d.won_at)}` : `Close ${fmtDate(d.expected_close)}`}</div>
                        <select aria-label="Move stage" value={d.stage} onClick={(e) => e.stopPropagation()} onChange={(e) => move(d, e.target.value)}
                          className="mt-2 w-full h-8 rounded-[9px] bg-foreground/[.04] text-[12.5px] px-2 outline-none sm:hidden">
                          {DEAL_STAGES.map((x) => <option key={x.id} value={x.id}>{x.label}</option>)}
                        </select>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        <Card pad={false}><div className="p-4">
          <DataTable rows={rows} loading={deals.isLoading} onRow={setEdit} searchKeys={['title', 'clients.business_name', 'leads.business_name']} exportName="deals" initialSort={['value_kes', 'desc']}
            cols={[
              { key: 'title', label: 'Deal', sort: true, render: (d) => <div><div className="font-medium">{d.title}</div><div className="text-[12px] text-muted-foreground">{name(d)}</div></div> },
              { key: 'stage', label: 'Stage', sort: true, render: (d) => <Badge tone={dealStage(d.stage).tone} dot>{dealStage(d.stage).label}</Badge> },
              { key: 'probability', label: 'Prob.', align: 'right', sort: true, render: (d) => `${d.probability ?? 0}%` },
              { key: 'expected_close', label: 'Close', sort: true, hideBelow: 'md', render: (d) => fmtDate(d.won_at || d.expected_close) },
              { key: 'value_kes', label: 'Value', align: 'right', sort: true, render: (d) => kes(d.value_kes) },
            ]} />
        </div></Card>
      )}
      <RecordForm open={edit !== undefined} onOpenChange={(v) => !v && setEdit(undefined)} table="deals" initial={edit} title={edit ? 'Edit deal' : 'New deal'}
        fields={[
          { name: 'title', label: 'Title', required: true, span: 2 }, { name: 'client_id', label: 'Client', type: 'select', options: clientOpts },
          { name: 'stage', label: 'Stage', type: 'select', options: DEAL_STAGES.map((s) => ({ value: s.id, label: s.label })) },
          { name: 'value_kes', label: 'Value (KES)', type: 'number', required: true }, { name: 'probability', label: 'Probability %', type: 'number' },
          { name: 'expected_close', label: 'Expected close', type: 'date' }, { name: 'lost_reason', label: 'Lost reason' },
        ]} defaults={{ stage: 'discovery', probability: 30 }} activity={(v, n) => `${n ? 'Created' : 'Updated'} deal ${v.title}`} />
      <Confirm open={!!invFor} onOpenChange={(v) => !v && setInvFor(null)} title="Create the 50/50 invoices?" confirm="Create invoices"
        body={invFor && <>Contract signed for <b>{invFor.title}</b>. Create a deposit invoice and a balance invoice of {kes(invFor.value_kes / 2)} each?</>}
        onConfirm={async () => {
          try { await rpc('create_deal_invoices', { p_deal: invFor!.id }); await logActivity(`Created 50/50 invoices for ${invFor!.title}`, 'invoice_created', 'deal', invFor!.id); toast.success('Deposit and balance invoices created', { icon: <ReceiptText className="size-4" /> }) }
          catch (e: any) { toast.error(e.message) } finally { setInvFor(null) }
        }} />
    </div>
  )
}