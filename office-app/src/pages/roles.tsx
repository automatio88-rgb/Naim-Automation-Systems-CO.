import { useState } from 'react'
import { toast } from 'sonner'
import { ShieldCheck } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useList, run, invalidate, type Row } from '@/services/db'
import { useAuth } from '@/lib/auth'
import { humanize, fmtDate } from '@/lib/utils'
import { Avatar, Badge, Card, Checkbox, PageHeader, Segmented, Select, TabPanel, Tabs } from '@/components/ui'
import { DataTable } from '@/components/data-table'

const ROLES = ['admin', 'manager', 'staff', 'viewer'] as const
const ACTIONS = ['can_view', 'can_create', 'can_edit', 'can_delete'] as const

export default function Roles() {
  const { profile, can } = useAuth()
  const perms = useList('role_permissions', { limit: 500 })
  const users = useList('profiles', { order: ['created_at', true] })
  const [role, setRole] = useState<(typeof ROLES)[number]>('manager')
  const [tab, setTab] = useState('matrix')
  const editable = can('settings', 'edit')
  const rows = (perms.data || []).filter((p) => p.role === role).sort((a, b) => a.module.localeCompare(b.module))
  const toggle = async (p: Row, k: string, v: boolean) => {
    try { await run(supabase.from('role_permissions').update({ [k]: v }).eq('role', p.role).eq('module', p.module)); invalidate(['role_permissions']); toast.success(`${humanize(p.role)}: ${humanize(k.replace('can_', ''))} ${humanize(p.module)} ${v ? 'on' : 'off'}`) }
    catch (e: any) { toast.error(e.message) }
  }
  return (
    <div>
      <PageHeader title="Roles & Permissions" sub="Enforced by Row Level Security in the database, not just hidden in the UI. Owners always have full access." />
      <Tabs value={tab} onChange={setTab} items={[{ id: 'matrix', label: 'Permission matrix' }, { id: 'users', label: 'Users', count: users.data?.length }]}>
        <TabPanel id="matrix">
          <div className="mb-4"><Segmented value={role} onChange={setRole} items={ROLES.map((r) => ({ id: r, label: humanize(r) }))} /></div>
          <Card pad={false}>
            <div className="overflow-x-auto scroll-thin">
              <table className="w-full text-[13.5px] min-w-[560px]">
                <thead><tr className="text-muted-foreground border-b border-border/70"><th className="text-left font-medium px-5 h-11">Module</th>{ACTIONS.map((a) => <th key={a} className="font-medium px-3">{humanize(a.replace('can_', ''))}</th>)}</tr></thead>
                <tbody>{rows.map((p) => (
                  <tr key={p.module} className="border-b border-border/50 last:border-0"><td className="px-5 py-2.5 font-medium">{humanize(p.module)}</td>
                    {ACTIONS.map((a) => <td key={a} className="px-3 text-center"><span className="inline-flex justify-center">{editable ? <Checkbox checked={!!p[a]} onChange={(v) => toggle(p, a, v)} /> : <Badge tone={p[a] ? 'success' : 'neutral'}>{p[a] ? 'Yes' : 'No'}</Badge>}</span></td>)}</tr>))}</tbody>
              </table>
            </div>
          </Card>
        </TabPanel>
        <TabPanel id="users">
          <DataTable rows={users.data} loading={users.isLoading} searchKeys={['full_name', 'email']}
            cols={[{ key: 'full_name', label: 'User', render: (r) => <div className="flex items-center gap-3"><Avatar name={r.full_name || r.email} size={32} /><div><div className="font-medium">{r.full_name || '—'}{r.id === profile?.id && <span className="text-muted-foreground font-normal"> (you)</span>}</div><div className="text-[12px] text-muted-foreground">{r.email}</div></div></div> },
              { key: 'created_at', label: 'Joined', hideBelow: 'md', render: (r) => fmtDate(r.created_at) },
              { key: 'role', label: 'Role', render: (r) => r.role === 'owner' || !editable || r.id === profile?.id ? <Badge tone={r.role === 'owner' ? 'brand' : 'info'}><ShieldCheck className="size-3.5" />{humanize(r.role)}</Badge>
                : <Select size="sm" className="w-[140px]" value={r.role} options={ROLES.map((x) => ({ value: x, label: humanize(x) }))} onChange={async (v) => { try { await run(supabase.from('profiles').update({ role: v }).eq('id', r.id)); invalidate(['profiles']); toast.success(`${r.full_name || r.email} is now ${humanize(v)}`) } catch (e: any) { toast.error(e.message) } }} /> }]} />
          <p className="text-[13px] text-muted-foreground mt-3">New team members sign up with their email, then you assign their role here. The first account becomes the owner.</p>
        </TabPanel>
      </Tabs>
    </div>
  )
}