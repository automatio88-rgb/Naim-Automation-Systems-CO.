import { useState } from 'react'
import { CheckCheck, FileDown, FileSignature, FileText, Globe, Hourglass, Link2, Plus, Send } from 'lucide-react'
import { toast } from 'sonner'
import { useList, update, logActivity, type Row } from '@/services/db'
import { useAuth } from '@/lib/auth'
import { ago, fmtDT, fmtDate, humanize } from '@/lib/utils'
import { Badge, Button, ChevronFilter, Dialog, Kpi, PageHeader, Select, TabPanel, Tabs } from '@/components/ui'
import { DataTable } from '@/components/data-table'
import { RecordForm } from '@/components/form'
import { ActivityList, tablePdf, useClientOptions } from '@/components/shared'

const TYPES = ['onboarding', 'quotation', 'agreement', 'founding-partner', 'proposal', 'invoice', 'brief', 'other']
const PORTAL_TYPES = ['onboarding', 'quotation', 'agreement', 'founding-partner']
const STATUS_TONE: Record<string, any> = { signed: 'success', sent: 'info', draft: 'neutral', archived: 'neutral' }

export default function Documents() {
  const { can } = useAuth()
  const d = useList('documents', { select: '*, clients(business_name,phone,email)', filter: (b) => b.is('deleted_at', null), order: ['created_at'] })
  const subs = useList('portal_submissions', { select: 'id,doc_type,client_name,agency_name,email,phone,agreed,created_at', order: ['created_at'], limit: 500 })
  const { options: clientOpts } = useClientOptions()
  const [tab, setTab] = useState('all')
  const [f, setF] = useState('all')
  const [type, setType] = useState('')
  const [view, setView] = useState<Row | null>(null)
  const [add, setAdd] = useState(false)
  const rows = d.data || []
  const waiting = rows.filter((r) => ['draft', 'sent'].includes(r.status))
  const portalUrl = ((import.meta.env.VITE_PORTAL_URL as string) || `${location.origin.replace('office', 'portal')}/docs`).replace(/\/$/, '')
  const linkFor = (t: string) => (PORTAL_TYPES.includes(t) ? `${portalUrl}/${t}` : portalUrl)
  const m = new Date()
  const sendLink = async (r: Row) => {
    const url = linkFor(r.type)
    const phone = String(r.clients?.phone || '').replace(/\D/g, '').replace(/^0/, '254')
    const msg = `Hello, please review and sign your ${humanize(r.type).toLowerCase()} here: ${url}`
    navigator.clipboard?.writeText(msg)
    if (r.status === 'draft') await update('documents', r.id, { status: 'sent' })
    await logActivity(`Sent ${r.name} for signature`, 'document_sent', 'document', r.id)
    if (phone) window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank')
    toast.success(phone ? 'Opening WhatsApp. The message is also copied.' : 'Signing link copied')
  }
  const filtered = (list: Row[]) => list.filter((r) => (f === 'all' || r.source === f) && (!type || r.type === type))
  const cols = [
    { key: 'name', label: 'Document', sort: true, render: (r: Row) => <span className="inline-flex items-center gap-2.5 font-medium"><span className="tone-brand chip size-8 rounded-[10px] grid place-items-center"><FileSignature className="size-4" /></span>{r.name}</span> },
    { key: 'clients.business_name', label: 'Client', sort: true, render: (r: Row) => r.clients?.business_name || r.fields?.agency_name || '—' },
    { key: 'type', label: 'Type', hideBelow: 'md' as const, render: (r: Row) => humanize(r.type) },
    { key: 'source', label: 'Source', hideBelow: 'sm' as const, render: (r: Row) => <Badge tone={r.source === 'portal' ? 'violet' : r.source === 'hermes' ? 'info' : 'neutral'}>{humanize(r.source)}</Badge> },
    { key: 'status', label: 'Status', render: (r: Row) => <Badge tone={STATUS_TONE[r.status] || 'neutral'} dot>{humanize(r.status)}</Badge> },
    { key: 'created_at', label: 'Date', sort: true, render: (r: Row) => fmtDate(r.signed_at || r.created_at) },
  ]
  return (
    <div>
      <PageHeader title="Documents" sub="Every document signed on the client portal is filed here automatically, linked to the client"
        actions={<><Button variant="outline" onClick={() => { navigator.clipboard?.writeText(portalUrl); toast.success('Portal link copied') }}><Link2 />Copy portal link</Button>{can('documents', 'create') && <Button onClick={() => setAdd(true)}><Plus />Add document</Button>}</>} />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-5">
        <Kpi tone="brand" label="Documents" value={rows.length} icon={<FileText />} />
        <Kpi tone="success" label="Signed" value={rows.filter((r) => r.status === 'signed').length} icon={<FileSignature />} foot={`${rows.filter((r) => r.signed_at && new Date(r.signed_at).getMonth() === m.getMonth() && new Date(r.signed_at).getFullYear() === m.getFullYear()).length} this month`} />
        <Kpi tone="warning" label="Awaiting signature" value={waiting.length} icon={<Hourglass />} onClick={() => setTab('waiting')} />
        <Kpi tone="violet" label="Portal submissions" value={subs.data?.length || 0} icon={<Globe />} onClick={() => setTab('portal')} />
      </div>
      <Tabs value={tab} onChange={setTab} items={[{ id: 'all', label: 'All documents', count: rows.length }, { id: 'waiting', label: 'Awaiting signature', count: waiting.length }, { id: 'portal', label: 'Portal submissions', count: subs.data?.length }]}>
        <TabPanel id="all">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <ChevronFilter value={f} onChange={setF} items={[{ id: 'all', label: 'All', count: rows.length }, ...['portal', 'internal', 'hermes'].map((s, i) => ({ id: s, label: humanize(s), tone: (['violet', 'neutral', 'info'] as const)[i], count: rows.filter((r) => r.source === s).length }))]} />
            <Select className="w-[200px] ml-auto" value={type} onChange={setType} options={TYPES.map((t) => ({ value: t, label: humanize(t) }))} placeholder="Any type" allowClear="Any type" />
          </div>
          <DataTable rows={filtered(rows)} loading={d.isLoading} onRow={setView} searchKeys={['name', 'type', 'clients.business_name']} exportName="documents" initialSort={['created_at', 'desc']} cols={cols} />
        </TabPanel>
        <TabPanel id="waiting">
          <DataTable rows={waiting} loading={d.isLoading} onRow={setView} searchKeys={['name', 'clients.business_name']} initialSort={['created_at', 'asc']}
            cols={[...cols.slice(0, 3), { key: 'created_at', label: 'Waiting', sort: true, render: (r: Row) => <span className="text-muted-foreground">{ago(r.created_at)}</span> },
              { key: 'act', label: '', align: 'right' as const, render: (r: Row) => can('documents', 'edit') && <div className="flex justify-end gap-1">
                <Button size="sm" variant="soft" onClick={(e) => { e.stopPropagation(); sendLink(r) }}><Send />{r.status === 'sent' ? 'Resend' : 'Send link'}</Button>
                <Button size="sm" variant="ghost" onClick={async (e) => { e.stopPropagation(); await update('documents', r.id, { status: 'signed', signed_at: new Date().toISOString() }); await logActivity(`${r.name} marked as signed`, 'document_signed', 'document', r.id); toast.success('Marked as signed') }}><CheckCheck />Signed</Button></div> }]} />
          <p className="text-[12.5px] text-muted-foreground mt-3">Send link opens WhatsApp with the right portal page. When the client signs, the portal files the signed copy here automatically.</p>
        </TabPanel>
        <TabPanel id="portal">
          <DataTable rows={subs.data} loading={subs.isLoading} searchKeys={['agency_name', 'client_name', 'email', 'doc_type']} exportName="portal-submissions" initialSort={['created_at', 'desc']}
            cols={[{ key: 'created_at', label: 'Received', sort: true, render: (r) => fmtDT(r.created_at) }, { key: 'agency_name', label: 'Agency', sort: true, render: (r) => <span className="font-medium">{r.agency_name}</span> },
              { key: 'client_name', label: 'Signed by' }, { key: 'doc_type', label: 'Document', render: (r) => humanize(r.doc_type) }, { key: 'email', label: 'Email', hideBelow: 'lg' },
              { key: 'agreed', label: 'Agreed', render: (r) => <Badge tone={r.agreed ? 'success' : 'danger'} dot>{r.agreed ? 'Yes' : 'No'}</Badge> }]} />
        </TabPanel>
      </Tabs>
      <DocView doc={view} onClose={() => setView(null)} onSend={sendLink} />
      <RecordForm open={add} onOpenChange={setAdd} table="documents" title="Add document"
        fields={[{ name: 'name', label: 'Name', required: true, span: 2 }, { name: 'client_id', label: 'Client', type: 'select', options: clientOpts }, { name: 'type', label: 'Type', type: 'select', options: TYPES.map((t) => ({ value: t, label: humanize(t) })) },
          { name: 'status', label: 'Status', type: 'select', options: ['draft', 'sent', 'signed'].map((s) => ({ value: s, label: humanize(s) })) }, { name: 'storage_path', label: 'File link / storage path', span: 2 }]}
        defaults={{ source: 'internal', status: 'draft', type: 'other' }} activity={(v) => `Added document ${v.name}`} />
    </div>
  )
}

function DocView({ doc, onClose, onSend }: { doc: Row | null; onClose: () => void; onSend: (d: Row) => void }) {
  const [tab, setTab] = useState('fields')
  const acts = useList('activities', { filter: (b) => b.eq('entity_id', doc?.id || '00000000-0000-0000-0000-000000000000'), order: ['created_at'], key: [doc?.id], enabled: !!doc, limit: 50 })
  const fields = Object.entries(doc?.fields || {}).filter(([, v]) => typeof v !== 'object')
  const pdf = () => doc && tablePdf(doc.name, ['Field', 'Value'], [['Client', doc.clients?.business_name || doc.fields?.agency_name || '—'], ['Status', humanize(doc.status)], ['Signed', doc.signed_at ? fmtDT(doc.signed_at) : '—'], ['Source', humanize(doc.source)], ...fields.map(([k, v]) => [humanize(k), String(v)])], 'Signed record · Naim Automation Systems Co.')
  return (
    <Dialog open={!!doc} onOpenChange={(v) => !v && onClose()} size="lg" title={doc?.name || ''} description={doc ? `${doc.clients?.business_name || ''} · ${humanize(doc.source)} · ${doc.signed_at ? `signed ${fmtDT(doc.signed_at)}` : humanize(doc.status)}` : ''}
      footer={doc && <><Button variant="outline" onClick={pdf}><FileDown />Record PDF</Button>{doc.status !== 'signed' && <Button onClick={() => onSend(doc)}><Send />Send for signature</Button>}</>}>
      {doc && <Tabs value={tab} onChange={setTab} items={[{ id: 'fields', label: 'Details' }, { id: 'timeline', label: 'Timeline', count: acts.data?.length }]}>
        <TabPanel id="fields">
          <div className="grid md:grid-cols-[1fr_260px] gap-6">
            <dl className="divide-y divide-border/70 rounded-card bg-foreground/[.035] px-4 h-max">
              {fields.map(([k, v]) => <div key={k} className="flex justify-between gap-4 py-2 text-[13px]"><dt className="text-muted-foreground">{humanize(k)}</dt><dd className="font-medium text-right break-words">{String(v)}</dd></div>)}
              {!fields.length && <div className="py-4 text-[13px] text-muted-foreground">No fields captured</div>}
            </dl>
            <div>
              <div className="text-[13px] font-medium mb-2">Signature</div>
              <div className="rounded-card border border-border bg-white p-3 grid place-items-center min-h-[120px]">
                {doc.signature_data ? <img src={doc.signature_data.startsWith('data:') ? doc.signature_data : `data:image/png;base64,${doc.signature_data}`} alt="Signature" className="max-h-[120px]" /> : <span className="text-[13px] text-neutral-500">Not signed yet</span>}
              </div>
              {doc.storage_path && <a href={doc.storage_path} target="_blank" rel="noreferrer" className="text-[12px] text-primary mt-2 block break-all">{doc.storage_path}</a>}
            </div>
          </div>
        </TabPanel>
        <TabPanel id="timeline"><ActivityList items={acts.data} loading={acts.isLoading} max={50} empty="Nothing logged for this document yet" /></TabPanel>
      </Tabs>}
    </Dialog>
  )
}