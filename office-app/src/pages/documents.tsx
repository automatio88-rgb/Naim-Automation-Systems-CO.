import { useState } from 'react'
import { FileSignature, FileText, Globe, Link2, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { useList, type Row } from '@/services/db'
import { fmtDT, fmtDate, humanize } from '@/lib/utils'
import { Badge, Button, ChevronFilter, Dialog, Kpi, PageHeader } from '@/components/ui'
import { DataTable } from '@/components/data-table'
import { RecordForm } from '@/components/form'
import { useClientOptions } from '@/components/shared'

const TYPES = ['onboarding', 'quotation', 'agreement', 'founding-partner', 'proposal', 'invoice', 'brief', 'other']

export default function Documents() {
  const d = useList('documents', { select: '*, clients(business_name)', filter: (b) => b.is('deleted_at', null), order: ['created_at'] })
  const { options: clientOpts } = useClientOptions()
  const [f, setF] = useState('all')
  const [view, setView] = useState<Row | null>(null)
  const [add, setAdd] = useState(false)
  const rows = d.data || []
  const portalUrl = (import.meta.env.VITE_PORTAL_URL as string) || 'https://<your-portal>.netlify.app/docs'
  return (
    <div>
      <PageHeader title="Documents" sub="Every document signed on the client portal is filed here automatically, linked to the client"
        actions={<><Button variant="outline" onClick={() => { navigator.clipboard?.writeText(portalUrl); toast.success('Portal link copied') }}><Link2 />Copy portal link</Button><Button onClick={() => setAdd(true)}><Plus />Add document</Button></>} />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-5">
        <Kpi tone="brand" label="Documents" value={rows.length} icon={<FileText />} />
        <Kpi tone="success" label="Signed" value={rows.filter((r) => r.status === 'signed').length} icon={<FileSignature />} />
        <Kpi tone="violet" label="From the portal" value={rows.filter((r) => r.source === 'portal').length} icon={<Globe />} />
        <Kpi tone="info" label="Signed this month" value={rows.filter((r) => r.signed_at && new Date(r.signed_at).getMonth() === new Date().getMonth() && new Date(r.signed_at).getFullYear() === new Date().getFullYear()).length} />
      </div>
      <div className="mb-4"><ChevronFilter value={f} onChange={setF} items={[{ id: 'all', label: 'All', count: rows.length }, ...['portal', 'internal', 'hermes'].map((s, i) => ({ id: s, label: humanize(s), tone: (['violet', 'neutral', 'info'] as const)[i], count: rows.filter((r) => r.source === s).length }))]} /></div>
      <DataTable rows={rows.filter((r) => f === 'all' || r.source === f)} loading={d.isLoading} onRow={setView} searchKeys={['name', 'type', 'clients.business_name']} exportName="documents" initialSort={['created_at', 'desc']}
        cols={[
          { key: 'name', label: 'Document', sort: true, render: (r) => <span className="inline-flex items-center gap-2.5 font-medium"><span className="tone-brand chip size-8 rounded-[10px] grid place-items-center"><FileSignature className="size-4" /></span>{r.name}</span> },
          { key: 'clients.business_name', label: 'Client', sort: true, render: (r) => r.clients?.business_name || r.fields?.agency_name || '—' },
          { key: 'type', label: 'Type', hideBelow: 'md', render: (r) => humanize(r.type) },
          { key: 'source', label: 'Source', hideBelow: 'sm', render: (r) => <Badge tone={r.source === 'portal' ? 'violet' : r.source === 'hermes' ? 'info' : 'neutral'}>{humanize(r.source)}</Badge> },
          { key: 'status', label: 'Status', render: (r) => <Badge tone={r.status === 'signed' ? 'success' : 'neutral'} dot>{humanize(r.status)}</Badge> },
          { key: 'created_at', label: 'Date', sort: true, render: (r) => fmtDate(r.signed_at || r.created_at) },
        ]} />
      <Dialog open={!!view} onOpenChange={(v) => !v && setView(null)} size="lg" title={view?.name || ''} description={view ? `${view.clients?.business_name || ''} · ${humanize(view.source)} · ${view.signed_at ? `signed ${fmtDT(view.signed_at)}` : humanize(view.status)}` : ''}>
        {view && <div className="grid md:grid-cols-[1fr_260px] gap-6">
          <div>
            <div className="text-[13px] font-medium mb-2">Captured fields</div>
            <dl className="divide-y divide-border/70 rounded-card bg-foreground/[.035] px-4">
              {Object.entries(view.fields || {}).filter(([, v]) => typeof v !== 'object').map(([k, v]) => <div key={k} className="flex justify-between gap-4 py-2 text-[13px]"><dt className="text-muted-foreground">{humanize(k)}</dt><dd className="font-medium text-right break-words">{String(v)}</dd></div>)}
              {!Object.keys(view.fields || {}).length && <div className="py-4 text-[13px] text-muted-foreground">No fields captured</div>}
            </dl>
          </div>
          <div>
            <div className="text-[13px] font-medium mb-2">Signature</div>
            <div className="rounded-card border border-border bg-white p-3 grid place-items-center min-h-[120px]">
              {view.signature_data ? <img src={view.signature_data.startsWith('data:') ? view.signature_data : `data:image/png;base64,${view.signature_data}`} alt="Signature" className="max-h-[120px]" /> : <span className="text-[13px] text-neutral-500">No signature</span>}
            </div>
            {view.storage_path && <div className="text-[12px] text-muted-foreground mt-2 break-all">Stored at {view.storage_path}</div>}
          </div>
        </div>}
      </Dialog>
      <RecordForm open={add} onOpenChange={setAdd} table="documents" title="Add document"
        fields={[{ name: 'name', label: 'Name', required: true, span: 2 }, { name: 'client_id', label: 'Client', type: 'select', options: clientOpts }, { name: 'type', label: 'Type', type: 'select', options: TYPES.map((t) => ({ value: t, label: humanize(t) })) },
          { name: 'status', label: 'Status', type: 'select', options: ['draft', 'sent', 'signed'].map((s) => ({ value: s, label: humanize(s) })) }, { name: 'storage_path', label: 'File link / storage path', span: 2 }]}
        defaults={{ source: 'internal', status: 'draft', type: 'other' }} activity={(v) => `Added document ${v.name}`} />
    </div>
  )
}