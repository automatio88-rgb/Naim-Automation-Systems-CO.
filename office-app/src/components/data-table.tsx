import { useMemo, useState, type ReactNode } from 'react'
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight, Download, Search } from 'lucide-react'
import { cn, downloadCSV, get } from '@/lib/utils'
import { Button, Empty, Input, Skeleton } from './ui'

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

export function DataTable<T extends Record<string, any>>({ rows, cols, loading, onRow, searchKeys, toolbar, exportName, pageSize = 15, empty, initialSort, dense, rowClass, selectedId }: {
  rows?: T[]; cols: Col<T>[]; loading?: boolean; onRow?: (r: T) => void; searchKeys?: string[]; toolbar?: ReactNode
  exportName?: string; pageSize?: number; empty?: ReactNode; initialSort?: [string, 'asc' | 'desc']; dense?: boolean; rowClass?: (r: T) => string; selectedId?: string | null
}) {
  const [q, setQ] = useState('')
  const [sort, setSort] = useState<[string, 'asc' | 'desc'] | null>(initialSort || null)
  const [page, setPage] = useState(0)

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

  const pages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const p = Math.min(page, pages - 1)
  const view = filtered.slice(p * pageSize, p * pageSize + pageSize)
  const hide = { sm: 'hidden sm:table-cell', md: 'hidden md:table-cell', lg: 'hidden lg:table-cell' }

  return (
    <div className="min-w-0">
      {(searchKeys || toolbar || exportName) && (
        <div className="flex flex-wrap items-center gap-2 mb-3">
          {searchKeys && (
            <div className="relative w-full sm:w-[280px]">
              <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input value={q} onChange={(e) => { setQ(e.target.value); setPage(0) }} placeholder="Search" className="pl-9 h-9" />
            </div>
          )}
          {toolbar}
          <div className="flex-1" />
          {exportName && (
            <Button variant="outline" size="sm" onClick={() => downloadCSV(exportName, filtered, cols.filter((c) => typeof c.label === 'string').map((c) => ({ key: c.key, label: c.label as string, csv: c.csv })))}>
              <Download /> Export
            </Button>
          )}
        </div>
      )}
      <div className="overflow-x-auto scroll-thin rounded-[14px] border border-border/70">
        <table className="w-full text-[13.5px]">
          <thead>
            <tr className="bg-foreground/[.025] text-muted-foreground">
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
            </tr>
          </thead>
          <tbody>
            {loading && Array.from({ length: 6 }).map((_, i) => (
              <tr key={i} className="border-t border-border/60">{cols.map((c) => <td key={c.key} className="px-3.5 py-3"><Skeleton className="h-4 w-[70%]" /></td>)}</tr>
            ))}
            {!loading && view.map((r, i) => (
              <tr key={r.id ?? i} onClick={onRow ? () => onRow(r) : undefined}
                className={cn('border-t border-border/60 transition-colors', onRow && 'cursor-pointer hover:bg-foreground/[.035]', selectedId && r.id === selectedId && 'bg-foreground/[.06]', rowClass?.(r))}>
                {cols.map((c) => (
                  <td key={c.key} className={cn('px-3.5 align-middle', dense ? 'py-2' : 'py-3', c.align === 'right' && 'text-right num', c.align === 'center' && 'text-center', c.hideBelow && hide[c.hideBelow], c.className)}>
                    {c.render ? c.render(r) : (get(r, c.key) ?? '—')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && !filtered.length && (empty || <Empty title={q ? 'No matches' : 'Nothing here yet'} body={q ? 'Try a different search.' : undefined} />)}
      </div>
      {filtered.length > pageSize && (
        <div className="flex items-center justify-between mt-3 text-[13px] text-muted-foreground">
          <span className="num">{p * pageSize + 1}–{Math.min(filtered.length, (p + 1) * pageSize)} of {filtered.length}</span>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon-sm" disabled={p === 0} onClick={() => setPage(p - 1)} aria-label="Previous page"><ChevronLeft /></Button>
            <span className="num px-2">{p + 1} / {pages}</span>
            <Button variant="ghost" size="icon-sm" disabled={p >= pages - 1} onClick={() => setPage(p + 1)} aria-label="Next page"><ChevronRight /></Button>
          </div>
        </div>
      )}
    </div>
  )
}