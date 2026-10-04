import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, formatDistanceToNowStrict, isValid } from 'date-fns'

export const cn = (...a: ClassValue[]) => twMerge(clsx(a))

export const kes = (n: unknown, d = 0) =>
  'KES ' + Number(n || 0).toLocaleString('en-KE', { minimumFractionDigits: d, maximumFractionDigits: d })
export const kesShort = (n: unknown) => {
  const v = Number(n || 0), a = Math.abs(v)
  if (a >= 1e6) return `KES ${(v / 1e6).toFixed(a >= 1e7 ? 1 : 2)}M`
  if (a >= 1e4) return `KES ${(v / 1e3).toFixed(a >= 1e5 ? 0 : 1)}K`
  return kes(v)
}
export const num = (n: unknown) => Math.round(Number(n || 0)).toLocaleString('en-KE')
export const pct = (a: number, b: number) => (b ? Math.round((a / b) * 100) : 0)
export const sum = (rows: any[] | undefined, key: string | ((r: any) => number)) =>
  (rows || []).reduce((s, r) => s + Number(typeof key === 'function' ? key(r) : r?.[key] || 0), 0)

const toDate = (d: unknown) => {
  if (!d) return null
  const x = d instanceof Date ? d : new Date(String(d).length === 10 ? `${d}T00:00:00` : String(d))
  return isValid(x) ? x : null
}
export const fmtDate = (d: unknown, f = 'd MMM yyyy') => { const x = toDate(d); return x ? format(x, f) : '—' }
export const fmtTime = (d: unknown) => fmtDate(d, 'HH:mm')
export const fmtDT = (d: unknown) => fmtDate(d, 'd MMM, HH:mm')
export const ago = (d: unknown) => { const x = toDate(d); return x ? formatDistanceToNowStrict(x, { addSuffix: true }) : '—' }
export const isoDay = (d: Date = new Date()) => format(d, 'yyyy-MM-dd')
export const toLocalInput = (d: unknown) => { const x = toDate(d); return x ? format(x, "yyyy-MM-dd'T'HH:mm") : '' }

export const humanize = (s: unknown) => {
  const t = String(s ?? '').replace(/[_-]+/g, ' ').trim()
  return t ? t.charAt(0).toUpperCase() + t.slice(1) : '—'
}
export const initials = (s: unknown) =>
  String(s || '?').split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase()

export const get = (o: any, path: string) => path.split('.').reduce((v, k) => (v == null ? v : v[k]), o)

export function downloadCSV(name: string, rows: any[], cols: { key: string; label: string; csv?: (r: any) => unknown }[]) {
  const esc = (v: unknown) => {
    const s = v == null ? '' : typeof v === 'object' ? JSON.stringify(v) : String(v)
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  const lines = [cols.map((c) => esc(c.label)).join(','), ...rows.map((r) => cols.map((c) => esc(c.csv ? c.csv(r) : get(r, c.key))).join(','))]
  const blob = new Blob(['\ufeff' + lines.join('\n')], { type: 'text/csv;charset=utf-8' })
  const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: `${name}-${isoDay()}.csv` })
  a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000)
}

const TONES = ['brand', 'info', 'teal', 'violet', 'warning', 'success'] as const
export const toneFor = (s: unknown) => {
  let h = 0; for (const ch of String(s || '')) h = (h * 31 + ch.charCodeAt(0)) >>> 0
  return TONES[h % TONES.length]
}