import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Info, Lock, Search, ShieldCheck, UsersRound } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useList, run, invalidate, logActivity, type Row } from '@/services/db'
import { ActivityList } from '@/components/shared'
import { useAuth } from '@/lib/auth'
import { NAV } from '@/nav'
import { ROLE_TONE } from '@/lib/status'
import { cn, humanize } from '@/lib/utils'
import { Badge, Button, Card, Input, Kpi, PageHeader, TabPanel, Tabs, Tip } from '@/components/ui'

const ROLES = ['admin', 'manager', 'staff', 'viewer'] as const
const ACTS = [['can_view', 'V', 'View'], ['can_create', 'A', 'Add'], ['can_edit', 'E', 'Edit'], ['can_delete', 'D', 'Delete'], ['can_approve', 'AP', 'Approve'], ['can_export', 'X', 'Export']] as const
type ActKey = (typeof ACTS)[number][0]
const ROLE_NOTE: Record<string, string> = {
  owner: 'Full access, always. Locked.', admin: 'Runs the office day to day', manager: 'Leads a team or a side business',
  staff: 'Front desk, delivery and sales', viewer: 'Read-only: accountant, partner, investor',
}
const PRESETS: { id: string; label: string; patch: Partial<Record<ActKey, boolean>> }[] = [
  { id: 'full', label: 'Full access', patch: { can_view: true, can_create: true, can_edit: true, can_delete: true, can_approve: true, can_export: true } },
  { id: 'read', label: 'Read and export', patch: { can_view: true, can_create: false, can_edit: false, can_delete: false, can_approve: false, can_export: true } },
  { id: 'none', label: 'No access', patch: { can_view: false, can_create: false, can_edit: false, can_delete: false, can_approve: false, can_export: false } },
]

/** Modules grouped the same way as the sidebar, so the grid mirrors the navigation. */
function useGroups(modules: string[]) {
  return useMemo(() => {
    const byMod = new Map<string, { module: string; label: string }>()
    const groups: { group: string; items: { module: string; label: string }[] }[] = []
    for (const g of NAV) {
      const items: { module: string; label: string }[] = []
      for (const i of g.items) {
        if (!i.module) continue
        const ex = byMod.get(i.module)
        if (ex) { ex.label += ` · ${i.label}`; continue }
        const it = { module: i.module, label: i.label }; byMod.set(i.module, it); items.push(it)
      }
      if (items.length) groups.push({ group: g.group, items })
    }
    const rest = modules.filter((m) => !byMod.has(m))
    if (rest.length) groups.push({ group: 'Other', items: rest.map((m) => ({ module: m, label: humanize(m) })) })
    return groups
  }, [modules.join(',')]) // eslint-disable-line react-hooks/exhaustive-deps
}

export default function Roles() {
  const { profile } = useAuth()
  const nav = useNavigate()
  const perms = useList('role_permissions', { limit: 1000 })
  const users = useList('profiles', { select: 'id,role,active' })
  const audit = useList('activities', { filter: (b) => b.in('verb', ['permission_changed', 'role_changed', 'permissions_preset']), order: ['created_at'], limit: 200 })
  const [tab, setTab] = useState('grid')
  const [q, setQ] = useState('')
  const [pending, setPending] = useState<Record<string, boolean>>({})
  const editable = profile?.role === 'owner' || profile?.role === 'admin'
  const P = perms.data || []
  const modules = Array.from(new Set(P.map((p) => p.module))).sort()
  const groups = useGroups(modules)
  const cell = (r: string, m: string) => P.find((p) => p.role === r && p.module === m)
  const val = (r: string, m: string, k: ActKey) => { const key = `${r}|${m}|${k}`; return key in pending ? pending[key] : !!cell(r, m)?.[k] }

  const toggle = async (role: string, module: string, k: ActKey) => {
    if (!editable) return
    const v = !val(role, module, k)
    // View is the gate: granting anything grants View; revoking View revokes everything
    const patch: Partial<Record<ActKey, boolean>> = k === 'can_view' && !v ? PRESETS[2].patch : { [k]: v, ...(v && k !== 'can_view' ? { can_view: true } : {}) }
    const keys = Object.keys(patch).map((x) => `${role}|${module}|${x}`)
    setPending((p) => ({ ...p, ...Object.fromEntries(keys.map((key, i) => [key, Object.values(patch)[i] as boolean])) }))
    try {
      if (cell(role, module)) await run(supabase.from('role_permissions').update(patch).eq('role', role).eq('module', module))
      else await run(supabase.from('role_permissions').insert({ role, module, ...PRESETS[2].patch, ...patch }))
      invalidate(['role_permissions'])
      const label = ACTS.find((a) => a[0] === k)![2]
      await logActivity(`${humanize(role)}: ${label} on ${humanize(module)} turned ${v ? 'on' : 'off'}`, 'permission_changed', undefined, undefined, { role, module, ...patch })
      toast.success(`${humanize(role)} · ${humanize(module)} · ${label} ${v ? 'on' : 'off'}`, { duration: 1500 })
    } catch (e: any) {
      setPending((p) => { const n = { ...p }; keys.forEach((key) => delete n[key]); return n })
      toast.error(e.message)
    }
  }
  const preset = async (role: string, pr: (typeof PRESETS)[number]) => {
    try {
      await run(supabase.from('role_permissions').update(pr.patch).eq('role', role))
      setPending((p) => Object.fromEntries(Object.entries(p).filter(([key]) => !key.startsWith(role + '|'))))
      invalidate(['role_permissions'])
      await logActivity(`${humanize(role)} set to ${pr.label.toLowerCase()} on every page`, 'permissions_preset', undefined, undefined, { role, preset: pr.id })
      toast.success(`${humanize(role)}: ${pr.label}`)
    } catch (e: any) { toast.error(e.message) }
  }
  const rowAll = async (module: string, role: string, on: boolean) => {
    const patch = on ? PRESETS[0].patch : PRESETS[2].patch
    try { await run(supabase.from('role_permissions').update(patch).eq('role', role).eq('module', module)); invalidate(['role_permissions']); await logActivity(`${humanize(role)}: ${on ? 'full access' : 'no access'} on ${humanize(module)}`, 'permission_changed', undefined, undefined, { role, module, ...patch }) }
    catch (e: any) { toast.error(e.message) }
  }
  const matches = (it: { module: string; label: string }) => !q || `${it.label} ${it.module}`.toLowerCase().includes(q.toLowerCase())
  const count = (r: string) => (users.data || []).filter((u) => u.role === r && u.active).length
  const grants = (r: string) => modules.reduce((s, m) => s + ACTS.filter((a) => val(r, m, a[0])).length, 0)

  return (
    <div>
      <PageHeader title="Roles & Permissions" sub="Every page × every role, at six levels. Enforced by Row Level Security in the database, not just hidden in the UI."
        actions={<Button variant="outline" onClick={() => nav('/users')}><UsersRound />Manage users</Button>} />
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 sm:gap-4 mb-5">
        {(['owner', ...ROLES] as string[]).map((r) => <Kpi key={r} solid tone={ROLE_TONE[r] as any} label={humanize(r)} value={count(r)} foot={r === 'owner' ? 'Full access · locked' : `${grants(r)} of ${modules.length * 6} grants`} icon={r === 'owner' ? <Lock /> : <ShieldCheck />} />)}
      </div>
      <Tabs value={tab} onChange={setTab} items={[{ id: 'grid', label: 'Permission grid' }, { id: 'roles', label: 'Roles' }, { id: 'audit', label: 'Change log', count: audit.data?.length }]}>
        <TabPanel id="grid">
          <div className="flex flex-wrap items-center gap-3 mb-3">
            <div className="relative w-full sm:w-[260px]"><Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" /><Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Find a page" className="pl-9 h-9" /></div>
            <div className="flex items-start gap-2 text-[12.5px] text-muted-foreground flex-1 min-w-[260px]"><Info className="size-4 shrink-0 mt-0.5" />
              <span>Toggle <b className="text-foreground">V A E D AP X</b> (View, Add, Edit, Delete, Approve, Export) per role and page. Changes save instantly. Granting anything also grants View. {editable ? '' : 'Only the owner or an admin can change permissions.'}</span></div>
          </div>
          <Card pad={false}>
            <div className="overflow-auto scroll-thin max-h-[calc(100dvh-300px)]">
              <table className="w-full text-[13px] border-separate border-spacing-0 min-w-[980px]">
                <thead className="sticky top-0 z-20">
                  <tr>
                    <th className="sticky left-0 z-30 bg-card text-left font-medium text-muted-foreground px-4 h-14 border-b border-border/70 min-w-[200px]">Page</th>
                    {(['owner', ...ROLES] as string[]).map((r) => (
                      <th key={r} className="bg-card px-2 border-b border-border/70 font-medium">
                        <div className="flex flex-col items-center gap-1 py-2"><Badge tone={ROLE_TONE[r] as any}>{r === 'owner' && <Lock className="size-3" />}{humanize(r)}</Badge>
                          <span className="text-[10.5px] tracking-wide text-muted-foreground font-mono">V·A·E·D·AP·X</span></div>
                      </th>))}
                  </tr>
                </thead>
                <tbody>
                  {groups.map((g) => {
                    const items = g.items.filter(matches)
                    if (!items.length) return null
                    return [
                      <tr key={g.group}><td colSpan={6} className="sticky left-0 bg-foreground/[.03] px-4 h-8 text-[11px] font-semibold uppercase tracking-[.08em] text-muted-foreground border-b border-border/60">{g.group}</td></tr>,
                      ...items.map((it) => (
                        <tr key={it.module} className="group hover:bg-foreground/[.02]">
                          <td className="sticky left-0 z-10 bg-card group-hover:bg-[color-mix(in_oklab,var(--card),var(--foreground)_2%)] px-4 py-2 border-b border-border/50">
                            <div className="font-medium">{it.label}</div><div className="text-[11.5px] text-muted-foreground font-mono">{it.module}</div>
                          </td>
                          <td className="px-2 border-b border-border/50"><div className="flex justify-center gap-1 opacity-60">{ACTS.map(([k, s, l]) => <span key={k} title={`${l} · locked`} className="h-6 min-w-6 px-1 rounded-md grid place-items-center text-[10.5px] font-semibold bg-success/15 text-success">{s}</span>)}</div></td>
                          {ROLES.map((r) => {
                            const all = ACTS.every((a) => val(r, it.module, a[0]))
                            return (
                              <td key={r} className="px-2 border-b border-border/50">
                                <div className="flex justify-center items-center gap-1">
                                  {ACTS.map(([k, s, l]) => {
                                    const on = val(r, it.module, k)
                                    return (
                                      <Tip key={k} label={`${humanize(r)} · ${it.label} · ${l}: ${on ? 'allowed' : 'not allowed'}`}>
                                        <button type="button" disabled={!editable} aria-pressed={on} aria-label={`${l} ${it.label} for ${r}`} onClick={() => toggle(r, it.module, k)}
                                          className={cn('h-6 min-w-6 px-1 rounded-md text-[10.5px] font-semibold border transition-colors', on ? 'bg-success text-white border-success' : 'bg-transparent text-muted-foreground border-border hover:border-foreground/40', !editable && 'cursor-not-allowed')}>{s}</button>
                                      </Tip>)
                                  })}
                                  {editable && <button type="button" onClick={() => rowAll(it.module, r, !all)} className="ml-0.5 text-[10.5px] text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity" aria-label={`${all ? 'Revoke' : 'Grant'} all ${it.label} for ${r}`}>{all ? 'none' : 'all'}</button>}
                                </div>
                              </td>)
                          })}
                        </tr>)),
                    ]
                  })}
                </tbody>
              </table>
            </div>
          </Card>
          <p className="text-[12.5px] text-muted-foreground mt-3">Approve covers sign-off workflows (expenses, leave, purchase orders, salary advances, payroll). Export controls the CSV, PDF and Print buttons; Add also controls CSV import.</p>
        </TabPanel>
        <TabPanel id="roles">
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
            {(['owner', ...ROLES] as string[]).map((r) => {
              const view = modules.filter((m) => r === 'owner' || val(r, m, 'can_view'))
              return (
                <Card key={r} title={<span className="inline-flex items-center gap-2"><Badge tone={ROLE_TONE[r] as any}>{humanize(r)}</Badge></span>} sub={ROLE_NOTE[r]}>
                  <div className="grid grid-cols-3 gap-2 text-center mb-3">
                    {[['Users', count(r)], ['Pages', r === 'owner' ? modules.length : view.length], ['Approve', r === 'owner' ? modules.length : modules.filter((m) => val(r, m, 'can_approve')).length]].map(([k, v]) => <div key={k as string} className="rounded-[12px] bg-foreground/[.035] py-2"><div className="text-[11px] text-muted-foreground">{k}</div><div className="font-semibold num">{v}</div></div>)}
                  </div>
                  <div className="flex flex-wrap gap-1 min-h-[52px]">{view.slice(0, 14).map((m) => <Badge key={m}>{humanize(m)}</Badge>)}{view.length > 14 && <Badge>+{view.length - 14}</Badge>}</div>
                  {r !== 'owner' && editable && <div className="flex flex-wrap gap-2 mt-4">{PRESETS.map((pr) => <Button key={pr.id} size="sm" variant={pr.id === 'none' ? 'ghost' : 'outline'} onClick={() => preset(r, pr)}>{pr.label}</Button>)}</div>}
                </Card>)
            })}
          </div>
        </TabPanel>
        <TabPanel id="audit"><Card><ActivityList items={audit.data} loading={audit.isLoading} max={200} empty="No permission or role changes yet" /></Card></TabPanel>
      </Tabs>
    </div>
  )
}

export type { Row }