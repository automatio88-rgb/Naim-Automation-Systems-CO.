import type { ReactNode } from 'react'
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell, BarChart, Bar, Legend, LineChart, Line } from 'recharts'
import { kesShort } from '@/lib/utils'

export const SERIES = ['var(--c1)', 'var(--c2)', 'var(--c3)', 'var(--c4)', 'var(--c5)', 'var(--success)', 'var(--warning)']

function Tip({ active, payload, label, money }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-[12px] border border-border bg-popover px-3 py-2 shadow-e2 text-[12.5px]">
      {label !== undefined && <div className="font-medium mb-1">{label}</div>}
      {payload.map((p: any) => (
        <div key={p.dataKey ?? p.name} className="flex items-center gap-2">
          <span className="size-2 rounded-full" style={{ background: p.color || p.payload?.fill }} />
          <span className="text-muted-foreground">{p.name}</span>
          <span className="ml-auto pl-3 font-medium num">{money ? kesShort(p.value) : Number(p.value).toLocaleString('en-KE')}</span>
        </div>
      ))}
    </div>
  )
}

export function AreaTrend({ data, x, series, height = 240, money = true }: { data: any[]; x: string; series: { key: string; name: string; color?: string }[]; height?: number; money?: boolean }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>{series.map((s, i) => (
          <linearGradient key={s.key} id={`g-${s.key}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={s.color || SERIES[i]} stopOpacity={0.32} /><stop offset="100%" stopColor={s.color || SERIES[i]} stopOpacity={0} />
          </linearGradient>))}</defs>
        <CartesianGrid vertical={false} strokeDasharray="3 4" />
        <XAxis dataKey={x} tickLine={false} axisLine={false} minTickGap={18} />
        <YAxis tickLine={false} axisLine={false} width={money ? 64 : 36} tickFormatter={(v) => (money ? kesShort(v).replace('KES ', '') : v)} />
        <Tooltip content={<Tip money={money} />} />
        {series.map((s, i) => <Area key={s.key} type="monotone" dataKey={s.key} name={s.name} stroke={s.color || SERIES[i]} strokeWidth={2.2} fill={`url(#g-${s.key})`} animationDuration={900} />)}
      </AreaChart>
    </ResponsiveContainer>
  )
}

export function Bars({ data, x, series, height = 240, money = true, stacked, layout = 'horizontal' }: { data: any[]; x: string; series: { key: string; name: string; color?: string }[]; height?: number; money?: boolean; stacked?: boolean; layout?: 'horizontal' | 'vertical' }) {
  const vertical = layout === 'vertical'
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout={layout} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barCategoryGap="28%">
        <CartesianGrid vertical={vertical} horizontal={!vertical} strokeDasharray="3 4" />
        {vertical ? <>
          <XAxis type="number" tickLine={false} axisLine={false} tickFormatter={(v) => (money ? kesShort(v).replace('KES ', '') : v)} />
          <YAxis type="category" dataKey={x} tickLine={false} axisLine={false} width={120} />
        </> : <>
          <XAxis dataKey={x} tickLine={false} axisLine={false} minTickGap={8} />
          <YAxis tickLine={false} axisLine={false} width={money ? 64 : 36} tickFormatter={(v) => (money ? kesShort(v).replace('KES ', '') : v)} />
        </>}
        <Tooltip content={<Tip money={money} />} />
        {series.length > 1 && <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />}
        {series.map((s, i) => <Bar key={s.key} dataKey={s.key} name={s.name} fill={s.color || SERIES[i]} stackId={stacked ? 'a' : undefined} radius={stacked ? 0 : vertical ? [0, 6, 6, 0] : [6, 6, 0, 0]} animationDuration={800} />)}
      </BarChart>
    </ResponsiveContainer>
  )
}

export function Lines({ data, x, series, height = 240, money = true }: { data: any[]; x: string; series: { key: string; name: string; color?: string }[]; height?: number; money?: boolean }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 4" />
        <XAxis dataKey={x} tickLine={false} axisLine={false} />
        <YAxis tickLine={false} axisLine={false} width={money ? 64 : 36} tickFormatter={(v) => (money ? kesShort(v).replace('KES ', '') : v)} />
        <Tooltip content={<Tip money={money} />} />
        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
        {series.map((s, i) => <Line key={s.key} dataKey={s.key} name={s.name} stroke={s.color || SERIES[i]} strokeWidth={2.2} dot={false} animationDuration={900} />)}
      </LineChart>
    </ResponsiveContainer>
  )
}

export function Donut({ data, height = 220, money = true, center }: { data: { name: string; value: number; color?: string }[]; height?: number; money?: boolean; center?: ReactNode }) {
  const total = data.reduce((s, d) => s + d.value, 0)
  return (
    <div className="flex flex-col sm:flex-row items-center gap-4">
      <div className="relative shrink-0" style={{ width: height, height }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data.length ? data : [{ name: 'None', value: 1 }]} dataKey="value" nameKey="name" innerRadius="64%" outerRadius="94%" paddingAngle={data.length > 1 ? 2.5 : 0} stroke="none" animationDuration={900}>
              {(data.length ? data : [{ name: 'None', value: 1 }]).map((d: any, i) => <Cell key={i} fill={data.length ? d.color || SERIES[i % SERIES.length] : 'var(--surface-3)'} />)}
            </Pie>
            {data.length > 0 && <Tooltip content={<Tip money={money} />} />}
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 grid place-items-center pointer-events-none text-center">{center ?? <div><div className="font-semibold num text-[17px]">{money ? kesShort(total) : total.toLocaleString('en-KE')}</div><div className="text-[11.5px] text-muted-foreground">Total</div></div>}</div>
      </div>
      <ul className="flex-1 w-full space-y-2 text-[13px]">
        {data.map((d, i) => (
          <li key={d.name} className="flex items-center gap-2"><span className="size-2.5 rounded-full shrink-0" style={{ background: d.color || SERIES[i % SERIES.length] }} /><span className="truncate">{d.name}</span>
            <span className="ml-auto num font-medium">{money ? kesShort(d.value) : d.value.toLocaleString('en-KE')}</span><span className="num text-muted-foreground w-10 text-right">{total ? Math.round((d.value / total) * 100) : 0}%</span></li>
        ))}
      </ul>
    </div>
  )
}