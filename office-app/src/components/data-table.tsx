import { useLocation } from 'react-router-dom'
import { useAuth } from '@/lib/auth'
import { ALL_NAV } from '@/nav'
import { useMemo, useRef, useState, type ReactNode } from 'react'
import { toast } from 'sonner'
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight, Eye, FileDown, FileSpreadsheet, FileText, Filter, Pencil, Printer, RotateCcw, Search, Trash2, Upload, ChevronDown } from 'lucide-react'
import { cn, downloadCSV, get, humanize } from '@/lib/utils'
import { insert, type Row } from '@/services/db'
import { Button, Card, Checkbox, Confirm, Empty, Input, Select, Skeleton, Tip } from './ui'

export type Col<T = any> = {
  key: string
  label: ReactNode
  render?: (r: T) => ReactNode
  sort?: boolean | ((r: T) => any)
  csv?: (r: T) => unknown
  className?: string
  align?: 'right' | 'center'
  hideBelow?: 'sm' | 'md' | 'lg'
}

/** Text for exports: csv() > plain field > '' */
const cellText = (c: Col, r: any) => {
  const v = c.csv ? c.csv(r) : get(r, c.key)
  return v == null ? '' : typeof v === 'object' ? JSON.stringify(v) : String(v)
}

async function exportPdf(title: string, cols: Col[], rows: any[], print = false) {
  const { default: jsPDF } = await import('jspdf')
  const { default: autoTable } = await import('jspdf-autotable')
  const doc = new jsPDF({ orientation: cols.length > 6 ? 'landscape' : 'portrait' })
  doc.setFontSize(14); doc.text(title, 14, 16)
  doc.setFontSize(9); doc.setTextColor(120); doc.text(`${rows.length} records · ${new Date().toLocaleString('en-KE')}`, 14, 22)
  autoTable(doc, { startY: 27, head: [cols.map((c) => String(c.label))], body: rows.map((r) => cols.map((c) => cellText(c, r))), styles: { fontSize: 8 }, headStyles: { fillColor: [30, 30, 34] } })
  if (print) { doc.autoPrint(); window.open(doc.output('bloburl'), '_blank') } else doc.save(`${title.toLowerCase().replace(/\W+/g, '-')}.pdf`)
}

function parseCSV(text: string): string[][] {
  const out: string[][] = []; let row: string[] = [], cur = '', q = false
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (q) { if (ch === '"') { if (text[i + 1] === '"') { cur += '"'; i++ } else q = false } else cur += ch }
    else if (ch === '"') q = true
    else if (ch === ',') { row.push(cur); cur = '' }
    else if (ch === '\n' || ch === '\r') { if (ch === '\r' && text[i + 1] === '\n') i++; row.push(cur); out.push(row); row = []; cur = '' }
    else cur += ch
  }
  if (cur || row.length) { row.push(cur); out.push(row) }
  return out.filter((r) => r.some((c) => c.trim()))
}

export function DataTable<T extends Record<string, any>>({
  rows, cols, loading, onRow, searchKeys, toolbar, exportName, pageSize = 10, empty, initialSort, dense, rowClass, selectedId,
  filters, onClearFilters, onView, onEdit, onDelete, canDelete, importTable, importFields, importDefaults, onImported, bulkActions, title,
}: {
  rows?: T[]; cols: Col<T>[]; loading?: boolean; onRow?: (r: T) => void; searchKeys?: string[]; toolbar?: ReactNode
  exportName?: string; pageSize?: number; empty?: ReactNode; initialSort?: [string, 'asc' | 'desc']; dense?: boolean; rowClass?: (r: T) => string; selectedId?: string | null
  /** Collapsible "Filters" card content (date range, business, staff selects…) */
  filters?: ReactNode; onClearFilters?: () => void
  /** Row action icons */
  onView?: (r: T) => void; onEdit?: (r: T) => void; onDelete?: (r: T) => Promise<unknown> | void; canDelete?: (r: T) => boolean
  /** CSV import: target table + columns used for the downloadable template */
  importTable?: string; importFields?: string[]; importDefaults?: Row; onImported?: () => void
  bulkActions?: (selected: T[], clear: () => void) => ReactNode
  title?: string
}) {
  const [q, setQ] = useState('')
  const [sort, setSort] = useState<[string, 'asc' | 'desc'] | null>(initialSort || null)
  const [page, setPage] = useState(0)
  const [size, setSize] = useState(pageSize)
  const [showFilters, setShowFilters] = useState(true)
  const [sel, setSel] = useState<Set<any>>(new Set())
  const [del, setDel] = useState<T | null>(null)
  const [busy, setBusy] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const loc = useLocation()
  const { can } = useAuth()
  const pageMod = (ALL_NAV.find((n) => n.to === loc.pathname) || ALL_NAV.filter((n) => n.to !== '/' && loc.pathname.startsWith(n.to)).sort((a, b) => b.to.length - a.to.length)[0])?.module
  const canExport = can(pageMod, 'export'), canImport = can(pageMod, 'create')
  const name = title || (exportName ? humanize(exportName) : 'Records')

  const filtered = useMemo(() => {
    let r = rows || []
    if (q && searchKeys?.length) {
      const s = q.toLowerCase()
      r = r.filter((x) => searchKeys.some((k) => String(get(x, k) ?? '').toLowerCase().includes(s)))
    }
    if (sort) {
      const c = cols.find((c) => c.key === sort[0])
      const acc = typeof c?.sort === 'function' ? c.sort : (x: T) => get(x, sort[0])
      r = [...r].sort((a, b) => {
        const va = acc(a), vb = acc(b)
        const cmp = va == null ? 1 : vb == null ? -1 : typeof va === 'number' && typeof vb === 'number' ? va - vb : String(va).localeCompare(String(vb), undefined, { numeric: true })
        return sort[1] === 'asc' ? cmp : -cmp
      })
    }
    return r
  }, [rows, q, sort, searchKeys, cols])

  const pages = Math.max(1, Math.ceil(filtered.length / size))
  const p = Math.min(page, pages - 1)
  const view = filtered.slice(p * size, p * size + size)
  const hide = { sm: 'hidden sm:table-cell', md: 'hidden md:table-cell', lg: 'hidden lg:table-cell' }
  const exportCols = cols.filter((c) => typeof c.label === 'string' && c.label)
  const hasActions = !!(onView || onEdit || onDelete)
  const selectable = !!bulkActions
  const selected = filtered.filter((r) => sel.has(r.id))
  const allOnPage = view.length > 0 && view.every((r) => sel.has(r.id))

  async function onImport(f: File) {
    if (!importTable) return
    setBusy(true)
    try {
      const grid = parseCSV(await f.text())
      if (grid.length < 2) throw new Error('The file has no data rows')
      const head = grid[0].map((h) => h.trim().replace(/^\ufeff/, ''))
      const recs = grid.slice(1).map((r) => {
        const o: Row = { ...(importDefaults || {}) }
        head.forEach((h, i) => { const v = (r[i] ?? '').trim(); if (h && v !== '') o[h] = /^-?\d+(\.\d+)?$/.test(v) && !/phone|mobile|code|kra|pin/i.test(h) ? Number(v) : v })
        return o
      })
      await insert(importTable, recs)
      toast.success(`Imported ${recs.length} ${recs.length === 1 ? 'row' : 'rows'}`); onImported?.()
    } catch (e: any) { toast.error('Import failed: ' + e.message) } finally { setBusy(false); if (fileRef.current) fileRef.current.value = '' }
  }
  const template = () => {
    const cols = importFields || []
    const blob = new Blob(['\ufeff' + cols.join(',') + '\n'], { type: 'text/csv;charset=utf-8' })
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: `${importTable}-template.csv` }); a.click()
  }

  const showBar = searchKeys || toolbar || exportName || importTable
  return (
    <div className="min-w-0">
      {filters && (
        <Card pad={false} className="mb-3">
          <button onClick={() => setShowFilters((s) => !s)} className="w-full flex items-center gap-2 px-4 h-11 text-[13px] font-semibold">
            <Filter className="size-4 text-muted-foreground" />Filters
            <span className="flex-1" />
            {onClearFilters && <span role="button" tabIndex={0} onClick={(e) => { e.stopPropagation(); onClearFilters(); setQ('') }} className="inline-flex items-center gap-1 text-[12px] font-medium text-muted-foreground hover:text-foreground mr-2"><RotateCcw className="size-3.5" />Clear</span>}
            <ChevronDown className={cn('size-4 transition-transform', !showFilters && '-rotate-90')} />
          </button>
          {showFilters && <div className="px-4 pb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 items-end">{filters}</div>}
        </Card>
      )}
      {showBar && (
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <div className="flex items-center gap-2 text-[13px] text-muted-foreground">
            Show<Select size="sm" className="w-[76px]" value={String(size)} onChange={(v) => { setSize(Number(v)); setPage(0) }} options={[10, 25, 50, 100].map((n) => ({ value: String(n), label: String(n) }))} />entries
          </div>
          {searchKeys && (
            <div className="relative w-full sm:w-[240px]">
              <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input value={q} onChange={(e) => { setQ(e.target.value); setPage(0) }} placeholder="Search" className="pl-9 h-9" />
            </div>
          )}
          {toolbar}
          <div className="flex-1" />
          {selectable && selected.length > 0 && <div className="flex items-center gap-2 text-[13px]"><span className="num font-medium">{selected.length} selected</span>{bulkActions!(selected, () => setSel(new Set()))}</div>}
          <div className="flex flex-wrap items-center gap-1.5">
            {exportName && canExport && <>
              <Button variant="outline" size="sm" onClick={() => downloadCSV(exportName, filtered, exportCols.map((c) => ({ key: c.key, label: c.label as string, csv: c.csv })))}><FileSpreadsheet />CSV</Button>
              <Button variant="outline" size="sm" onClick={() => exportPdf(name, exportCols, filtered)}><FileDown />PDF</Button>
              <Button variant="outline" size="sm" onClick={() => exportPdf(name, exportCols, filtered, true)}><Printer />Print</Button>
            </>}
            {importTable && canImport && <>
              <input ref={fileRef} type="file" accept=".csv,text/csv" hidden onChange={(e) => e.target.files?.[0] && onImport(e.target.files[0])} />
              <Button variant="outline" size="sm" loading={busy} onClick={() => fileRef.current?.click()}><Upload />Import CSV</Button>
              <Button variant="ghost" size="sm" onClick={template}><FileText />Template</Button>
            </>}
          </div>
        </div>
      )}
      <div className="overflow-x-auto scroll-thin rounded-[14px] border border-border/70">
        <table className="w-full text-[13.5px]">
          <thead>
            <tr className="bg-foreground/[.025] text-muted-foreground">
              {selectable && <th className="w-10 px-3.5"><Checkbox checked={allOnPage} onChange={(v) => setSel((s) => { const n = new Set(s); view.forEach((r) => v ? n.add(r.id) : n.delete(r.id)); return n })} /></th>}
              {cols.map((c) => {
                const active = sort?.[0] === c.key
                return (
                  <th key={c.key} className={cn('text-left font-medium text-[12.5px] px-3.5 h-10 whitespace-nowrap', c.align === 'right' && 'text-right', c.align === 'center' && 'text-center', c.hideBelow && hide[c.hideBelow], c.className)}>
                    {c.sort ? (
                      <button className={cn('inline-flex items-center gap-1 hover:text-foreground', active && 'text-foreground')}
                        onClick={() => setSort(active ? (sort![1] === 'desc' ? [c.key, 'asc'] : null) : [c.key, 'desc'])}>
                        {c.label}{active ? (sort![1] === 'desc' ? <ArrowDown className="size-3.5" /> : <ArrowUp className="size-3.5" />) : <ArrowUpDown className="size-3.5 opacity-40" />}
                      </button>
                    ) : c.label}
                  </th>
                )
              })}
              {hasActions && <th className="text-right font-medium text-[12.5px] px-3.5 h-10">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {loading && Array.from({ length: 6 }).map((_, i) => (
              <tr key={i} className="border-t border-border/60">{selectable && <td />}{cols.map((c) => <td key={c.key} className="px-3.5 py-3"><Skeleton className="h-4 w-[70%]" /></td>)}{hasActions && <td />}</tr>
            ))}
            {!loading && view.map((r, i) => (
              <tr key={r.id ?? i} onClick={onRow ? () => onRow(r) : undefined}
                className={cn('border-t border-border/60 transition-colors', onRow && 'cursor-pointer hover:bg-foreground/[.035]', selectedId && r.id === selectedId && 'bg-foreground/[.06]', sel.has(r.id) && 'bg-primary/[.06]', rowClass?.(r))}>
                {selectable && <td className="px-3.5" onClick={(e) => e.stopPropagation()}><Checkbox checked={sel.has(r.id)} onChange={(v) => setSel((s) => { const n = new Set(s); v ? n.add(r.id) : n.delete(r.id); return n })} /></td>}
                {cols.map((c) => (
                  <td key={c.key} className={cn('px-3.5 align-middle', dense ? 'py-2' : 'py-3', c.align === 'right' && 'text-right num', c.align === 'center' && 'text-center', c.hideBelow && hide[c.hideBelow], c.className)}>
                    {c.render ? c.render(r) : (get(r, c.key) ?? '—')}
                  </td>
                ))}
                {hasActions && (
                  <td className="px-2 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                    {onView && <Tip label="View"><Button variant="ghost" size="icon-sm" aria-label="View" onClick={() => onView(r)}><Eye /></Button></Tip>}
                    {onEdit && <Tip label="Edit"><Button variant="ghost" size="icon-sm" aria-label="Edit" onClick={() => onEdit(r)}><Pencil /></Button></Tip>}
                    {onDelete && (!canDelete || canDelete(r)) && <Tip label="Delete"><Button variant="ghost" size="icon-sm" aria-label="Delete" className="text-danger" onClick={() => setDel(r)}><Trash2 /></Button></Tip>}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && !filtered.length && (empty || <Empty title={q ? 'No matches' : 'Nothing here yet'} body={q ? 'Try a different search.' : undefined} />)}
      </div>
      {!loading && filtered.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-2 mt-3 text-[13px] text-muted-foreground">
          <span className="num">Showing {p * size + 1} to {Math.min(filtered.length, (p + 1) * size)} of {filtered.length} entries{rows && filtered.length !== rows.length ? ` (filtered from ${rows.length})` : ''}</span>
          {pages > 1 && (
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon-sm" disabled={p === 0} onClick={() => setPage(p - 1)} aria-label="Previous page"><ChevronLeft /></Button>
              {Array.from({ length: pages }).map((_, i) => i).filter((i) => i === 0 || i === pages - 1 || Math.abs(i - p) <= 1).map((i, k, arr) => (
                <span key={i} className="flex items-center">{k > 0 && i - arr[k - 1] > 1 && <span className="px-1">…</span>}
                  <Button variant={i === p ? 'default' : 'ghost'} size="icon-sm" onClick={() => setPage(i)} className="num">{i + 1}</Button></span>))}
              <Button variant="ghost" size="icon-sm" disabled={p >= pages - 1} onClick={() => setPage(p + 1)} aria-label="Next page"><ChevronRight /></Button>
            </div>
          )}
        </div>
      )}
      {onDelete && <Confirm open={!!del} onOpenChange={(v) => !v && setDel(null)} danger title="Delete this record?" body="This can't be undone from here." confirm="Delete" loading={busy}
        onConfirm={async () => { setBusy(true); try { await onDelete(del!); toast.success('Deleted') } catch (e: any) { toast.error(e.message) } finally { setBusy(false); setDel(null) } }} />}
    </div>
  )
}