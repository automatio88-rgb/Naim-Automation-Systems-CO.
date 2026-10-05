// /api/users/invite — owners and admins add a team member.
// Verifies the caller's own Supabase session, checks their role, then sends a Supabase invite
// (service role, server-side only) and sets the new profile's role.
import { Supa, guard, json } from '../lib/sb.mts'

const ROLES = ['admin', 'manager', 'staff', 'viewer']

export default async (req: Request) => guard(async () => {
  if (req.method !== 'POST') return json({ ok: false, error: 'Method not allowed.' }, 405)
  const db = new Supa()
  const base = (process.env.SUPABASE_URL || '').replace(/\/$/, ''), key = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  const token = (req.headers.get('authorization') || '').replace(/^Bearer /i, '')
  if (!token) return json({ ok: false, error: 'Sign in first.' }, 401)
  const who = await fetch(`${base}/auth/v1/user`, { headers: { apikey: key, Authorization: `Bearer ${token}` } })
  if (!who.ok) return json({ ok: false, error: 'Your session has expired. Sign in again.' }, 401)
  const caller = await who.json()
  const me = await db.one('profiles', { id: `eq.${caller.id}`, select: 'role,active,full_name' })
  if (!me?.active || !['owner', 'admin'].includes(me.role)) return json({ ok: false, error: 'Only the owner or an admin can add users.' }, 403)

  let b: any
  try { b = await req.json() } catch { return json({ ok: false, error: 'Invalid JSON.' }, 400) }
  const email = String(b?.email || '').trim().toLowerCase()
  const full_name = String(b?.full_name || '').trim() || null
  const role = ROLES.includes(b?.role) ? b.role : 'staff'
  if (!/^\S+@\S+\.\S+$/.test(email)) return json({ ok: false, error: 'Enter a valid email.' }, 400)
  if (role === 'admin' && me.role !== 'owner') return json({ ok: false, error: 'Only the owner can add admins.' }, 403)
  if (await db.one('profiles', { email: `eq.${email}`, select: 'id' })) return json({ ok: false, error: 'That email already has an account.' }, 409)

  const ir = await fetch(`${base}/auth/v1/invite`, { method: 'POST', headers: { apikey: key, Authorization: `Bearer ${key}`, 'content-type': 'application/json' }, body: JSON.stringify({ email, data: { full_name } }) })
  const inv = await ir.json().catch(() => ({}))
  if (!ir.ok) return json({ ok: false, error: inv.msg || inv.error_description || 'The invite could not be sent.' }, ir.status)
  await db.update('profiles', { id: `eq.${inv.id}` }, { role, full_name, phone: b?.phone || null })
  await db.insert('activities', { actor_kind: 'human', actor_name: me.full_name || caller.email, verb: 'role_changed', entity_type: 'profile', entity_id: inv.id, summary: `Invited ${full_name || email} as ${role}`, metadata: { email, role } })
  return json({ ok: true, id: inv.id, invited: true })
})

export const config = { path: '/api/users/invite' }