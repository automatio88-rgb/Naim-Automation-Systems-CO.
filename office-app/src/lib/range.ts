import { addDays, eachDayOfInterval, eachMonthOfInterval, eachWeekOfInterval, endOfDay, format, startOfDay, startOfMonth, startOfQuarter, startOfWeek, subDays, subMonths } from 'date-fns'

export type RangeId = 'today' | 'week' | 'month' | 'quarter' | 'year'
export const RANGES: { id: RangeId; label: string }[] = [
  { id: 'today', label: 'Today' }, { id: 'week', label: 'This week' }, { id: 'month', label: 'This month' }, { id: 'quarter', label: 'This quarter' }, { id: 'year', label: '12 months' },
]
export function rangeBounds(id: RangeId, now = new Date()) {
  const to = endOfDay(now)
  const from = id === 'today' ? startOfDay(now) : id === 'week' ? startOfWeek(now, { weekStartsOn: 1 }) : id === 'month' ? startOfMonth(now) : id === 'quarter' ? startOfQuarter(now) : startOfMonth(subMonths(now, 11))
  const span = to.getTime() - from.getTime()
  return { from, to, prevFrom: new Date(from.getTime() - span), prevTo: new Date(from.getTime() - 1) }
}
export const inRange = (d: unknown, from: Date, to: Date) => { if (!d) return false; const t = new Date(String(d)).getTime(); return t >= from.getTime() && t <= to.getTime() }

/** Buckets for trend charts sized to the range. */
export function buckets(id: RangeId, now = new Date()) {
  if (id === 'year') return eachMonthOfInterval({ start: startOfMonth(subMonths(now, 11)), end: now }).map((d) => ({ key: format(d, 'yyyy-MM'), label: format(d, 'MMM'), from: d, to: startOfMonth(addDays(d, 32)) }))
  if (id === 'quarter') return eachWeekOfInterval({ start: startOfQuarter(now), end: now }, { weekStartsOn: 1 }).map((d) => ({ key: format(d, 'yyyy-ww'), label: format(d, 'd MMM'), from: d, to: addDays(d, 7) }))
  const start = id === 'month' ? startOfMonth(now) : id === 'week' ? startOfWeek(now, { weekStartsOn: 1 }) : subDays(startOfDay(now), 13)
  return eachDayOfInterval({ start, end: now }).map((d) => ({ key: format(d, 'yyyy-MM-dd'), label: format(d, id === 'week' ? 'EEE' : 'd MMM'), from: d, to: addDays(d, 1) }))
}
export function series<T>(rows: T[], id: RangeId, date: (r: T) => unknown, val: (r: T) => number) {
  const b = buckets(id)
  return b.map((x) => ({ label: x.label, value: rows.reduce((s, r) => { const t = new Date(String(date(r))).getTime(); return t >= x.from.getTime() && t < x.to.getTime() ? s + val(r) : s }, 0) }))
}
export const delta = (cur: number, prev: number) => (prev ? Math.round(((cur - prev) / Math.abs(prev)) * 100) : cur ? 100 : 0)