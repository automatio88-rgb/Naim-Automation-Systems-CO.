import { useState } from 'react'
import { toast } from 'sonner'
import { Copy, Lock, MailPlus, ShieldCheck, UserCheck, UserX, UsersRound } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useList, update, logActivity, invalidate, type Row } from '@/services/db'
import { useAuth } from '@/lib/auth'
import { ROLE_TONE } from '@/lib/status'
import { ago, fmtDate, humanize } from '@/lib/utils'
import { Avatar, Badge, Button, ChevronFilter, Dialog, Field, Input, Kpi, PageHeader, Select, Switch } from '@/components/ui'
import { DataTable } from '@/components/data-table'

const ROLES = ['admin', 'manager', 'staff', 'viewer']
const ROLE_OPTS = ROLES.map((r) => ({ value: r, label: humanize(r) }))

export default function Users() {
  const { profile } = useAuth()
  const users = useList('profiles', { order: ['created_at', true] })
  const acts = useList('activities', { select: 'actor_name,created_at', filter: (b) => b.eq('actor_kind', 'human'), order: ['created_at'], limit: 3000 })
  const staff = useList('staff', { select: 'id,full_name,title,profile_id', filter: (b) => b.is('deleted_at', null), order: ['full_name', true] })
  const [f, setF] = useState('all')
  const [fRole, setFRole] = useState('')
  const [invite, setInvite] = useState(false)
  const [edit, setEdit] = useState<Row | null>(null)
  const isAdmin = profile?.role === 'owner' || profile?.role === 'admin'
  const U = users.data || []
  const last: Record<string, string> = {}
  for (const a of acts.data || []) if (a.actor_name && !last[a.actor_name]) last[a.actor_name] = a.created_at
  const seen = (u: Row) => last[u.full_name] || last[u.email]
  const staffOf = (u: Row) => (staff.data || []).find((s) => s.profile_id === u.id)
  const locked = (u: Row) => u.role === 'owner' || u.id === profile?.id || !isAdmin
  const view = U.filter((u) => (f === 'all' || (f === 'active' ? u.active : !u.active)) && (!fRole || u.role === fRole))
  const setActive = async (u: Row, active: boolean) => {
    try { await update('profiles', u.id, { active }); await logActivity(`${active ? 'Reactivated' : 'Deactivated'} ${u.full_name || u.email}`, 'role_changed', 'profile', u.id, { active }); toast.success(active ? 'Access restored' : 'Access removed. They can no longer sign in to the office.') }
    catch (e: any) { toast.error(e.message) }
  }
  const setRole = async (u: Row, role: string) => {
    try { await update('profiles', u.id, { role }); await logActivity(`${u.full_name || u.email} changed from ${humanize(u.role)} to ${humanize(role)}`, 'role_changed', 'profile', u.id, { from: u.role, to: role }); toast.success(`${u.full_name || u.email} is now ${humanize(role)}`) }
    catch (e: any) { toast.error(e.message) }
  }
  return (
    <div>
      <PageHeader title="Users" sub="Everyone who can sign in to NAIM COMMAND, their role and their access"
        actions={isAdmin && <Button onClick={() => setInvite(true)}><MailPlus />Add user</Button>} />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-5">
        <Kpi solid tone="brand" label="Users" value={U.length} icon={<UsersRound />} />
        <Kpi solid tone="success" label="Active" value={U.filter((u) => u.active).length} icon={<UserCheck />} />
        <Kpi solid tone="violet" label="Owners and admins" value={U.filter((u) => ['owner', 'admin'].includes(u.role)).length} icon={<ShieldCheck />} />
        <Kpi solid tone="danger" label="Deactivated" value={U.filter((u) => !u.active).length} icon={<UserX />} onClick={() => setF('inactive')} />
      </div>
      <div className="mb-4"><ChevronFilter value={f} onChange={setF} items={[{ id: 'all', label: 'All', count: U.length }, { id: 'active', label: 'Active', tone: 'success', count: U.filter((u) => u.active).length }, { id: 'inactive', label: 'Deactivated', tone: 'danger', count: U.filter((u) => !u.active).length }]} /></div>
      <DataTable rows={view} loading={users.isLoading} searchKeys={['full_name', 'email', 'phone', 'role']} exportName="users" initialSort={['created_at', 'asc']}
        filters={<Select size="sm" value={fRole} onChange={setFRole} allowClear="All roles" options={[{ value: 'owner', label: 'Owner' }, ...ROLE_OPTS]} />} onClearFilters={() => { setFRole(''); setF('all') }}
        onEdit={isAdmin ? (u) => setEdit(u) : undefined}
        cols={[
          { key: 'full_name', label: 'User', sort: true, render: (r) => <div className="flex items-center gap-3"><Avatar name={r.full_name || r.email} src={r.avatar_url} size={34} /><div><div className="font-medium">{r.full_name || '—'}{r.id === profile?.id && <span className="text-muted-foreground font-normal"> (you)</span>}</div><div className="text-[12px] text-muted-foreground">{r.email}</div></div></div> },
          { key: 'role', label: 'Role', sort: true, render: (r) => locked(r) ? <Badge tone={ROLE_TONE[r.role] as any}>{r.role === 'owner' && <Lock className="size-3" />}{humanize(r.role)}</Badge>
            : <Select size="sm" className="w-[130px]" value={r.role} options={ROLE_OPTS} onChange={(v) => setRole(r, v)} /> },
          { key: 'staff', label: 'Staff profile', hideBelow: 'lg', render: (r) => { const s = staffOf(r); return s ? <div><div>{s.full_name}</div><div className="text-[12px] text-muted-foreground">{s.title}</div></div> : <span className="text-muted-foreground">Not linked</span> }, csv: (r) => staffOf(r)?.full_name || '' },
          { key: 'phone', label: 'Phone', hideBelow: 'md', render: (r) => r.phone || '—' },
          { key: 'created_at', label: 'Joined', sort: true, hideBelow: 'md', render: (r) => fmtDate(r.created_at) },
          { key: 'seen', label: 'Last activity', hideBelow: 'sm', render: (r) => seen(r) ? ago(seen(r)) : <span className="text-muted-foreground">Never</span>, csv: (r) => seen(r) || '' },
          { key: 'active', label: 'Access', render: (r) => locked(r) ? <Badge tone={r.active ? 'success' : 'danger'} dot>{r.active ? 'Active' : 'Off'}</Badge> : <Switch checked={!!r.active} onChange={(v) => setActive(r, v)} label={r.active ? 'Active' : 'Off'} tone="success" />, csv: (r) => (r.active ? 'Active' : 'Deactivated') },
        ]} />
      <p className="text-[12.5px] text-muted-foreground mt-3">Roles decide what each person can see and do. Fine-tune them on Roles & Permissions. The owner can't be demoted or deactivated, and you can't change your own role.</p>
      {invite && <Invite onClose={() => setInvite(false)} />}
      {edit && <EditUser u={edit} staff={staff.data || []} current={staffOf(edit)} onClose={() => setEdit(null)} />}
    </div>
  )
}

function Invite({ onClose }: { onClose: () => void }) {
  const [v, setV] = useState({ email: '', full_name: '', phone: '', role: 'staff' })
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState<Row | null>(null)
  const set = (k: string, x: string) => setV((s) => ({ ...s, [k]: x }))
  const valid = /^\S+@\S+\.\S+$/.test(v.email) && v.full_name.trim().length > 1
  const go = async () => {
    setBusy(true)
    try {
      const { data: s } = await supabase.auth.getSession()
      const r = await fetch('/api/users/invite', { method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${s.session?.access_token || ''}` }, body: JSON.stringify(v) })
      const j = await r.json().catch(() => ({}))
      if (!r.ok) throw new Error(j.error || `Could not add the user (${r.status})`)
      invalidate(['profiles', 'activities']); setDone(j)
    } catch (e: any) { toast.error(e.message) } finally { setBusy(false) }
  }
  if (done) return (
    <Dialog open onOpenChange={(x) => !x && onClose()} size="sm" title="User added" description={`${v.full_name} · ${humanize(v.role)}`} footer={<Button onClick={onClose}>Done</Button>}>
      {done.temp_password ? <div className="space-y-3 text-[13.5px]">
        <p>Share these sign-in details privately. Ask them to change the password after signing in.</p>
        <div className="rounded-[12px] bg-foreground/[.04] p-3 font-mono text-[13px]">{v.email}<br />{done.temp_password}</div>
        <Button size="sm" variant="outline" onClick={() => { navigator.clipboard?.writeText(`NAIM COMMAND\nEmail: ${v.email}\nPassword: ${done.temp_password}`); toast.success('Copied') }}><Copy />Copy details</Button>
      </div> : <p className="text-[13.5px]">An invitation email is on its way to <b>{v.email}</b>. They set their own password from the link.</p>}
    </Dialog>)
  return (
    <Dialog open onOpenChange={(x) => !x && onClose()} size="md" title="Add a user" description="They get their own login. What they can do depends on the role."
      footer={<><Button variant="outline" onClick={onClose}>Cancel</Button><Button loading={busy} disabled={!valid} onClick={go}><MailPlus />Add user</Button></>}>
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Full name"><Input value={v.full_name} onChange={(e) => set('full_name', e.target.value)} placeholder="Wanjiku Kamau" /></Field>
        <Field label="Email"><Input type="email" value={v.email} onChange={(e) => set('email', e.target.value)} placeholder="name@company.co.ke" /></Field>
        <Field label="Phone"><Input type="tel" value={v.phone} onChange={(e) => set('phone', e.target.value)} placeholder="+254 7…" /></Field>
        <Field label="Role"><Select value={v.role} onChange={(x) => set('role', x)} options={ROLE_OPTS} /></Field>
      </div>
      <p className="text-[12.5px] text-muted-foreground mt-4">Admin: runs the office. Manager: leads a team or side business. Staff: front desk, delivery and sales. Viewer: read-only.</p>
    </Dialog>
  )
}

function EditUser({ u, staff, current, onClose }: { u: Row; staff: Row[]; current?: Row; onClose: () => void }) {
  const [name, setName] = useState(u.full_name || '')
  const [phone, setPhone] = useState(u.phone || '')
  const [sid, setSid] = useState(current?.id || '')
  const [busy, setBusy] = useState(false)
  return (
    <Dialog open onOpenChange={(x) => !x && onClose()} size="sm" title={`Edit ${u.full_name || u.email}`} description={u.email}
      footer={<><Button variant="outline" onClick={onClose}>Cancel</Button><Button loading={busy} onClick={async () => {
        setBusy(true)
        try {
          await update('profiles', u.id, { full_name: name || null, phone: phone || null })
          if (sid !== (current?.id || '')) {
            if (current) await update('staff', current.id, { profile_id: null })
            if (sid) await update('staff', sid, { profile_id: u.id })
          }
          await logActivity(`Updated user ${name || u.email}`, 'role_changed', 'profile', u.id); invalidate(['profiles', 'staff']); toast.success('Saved'); onClose()
        } catch (e: any) { toast.error(e.message) } finally { setBusy(false) }
      }}>Save</Button></>}>
      <div className="grid gap-4">
        <Field label="Full name"><Input value={name} onChange={(e) => setName(e.target.value)} /></Field>
        <Field label="Phone"><Input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} /></Field>
        <Field label="Staff profile" hint="Links the login to an HR record, for My Day, commission and shifts"><Select value={sid} onChange={setSid} allowClear="Not linked" options={staff.filter((s) => !s.profile_id || s.profile_id === u.id).map((s) => ({ value: s.id, label: `${s.full_name}${s.title ? ` · ${s.title}` : ''}` }))} /></Field>
      </div>
    </Dialog>
  )
}