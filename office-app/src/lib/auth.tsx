import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './supabase'
import { queryClient } from './query'

export type Role = 'owner' | 'admin' | 'manager' | 'staff' | 'viewer'
export type Profile = { id: string; full_name: string | null; email: string | null; role: Role; avatar_url: string | null }
type Perm = { module: string; can_view: boolean; can_create: boolean; can_edit: boolean; can_delete: boolean }
type Action = 'view' | 'create' | 'edit' | 'delete'
type Ctx = {
  session: Session | null; profile: Profile | null; perms: Perm[]; loading: boolean
  can: (module?: string, action?: Action) => boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, fullName: string) => Promise<void>
  signOut: () => Promise<void>
  reloadProfile: () => Promise<void>
}
const AuthCtx = createContext<Ctx>(null as unknown as Ctx)

/** current actor's display name, for activity logging outside React */
export let currentActor = 'Office'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [perms, setPerms] = useState<Perm[]>([])
  const [loading, setLoading] = useState(true)

  const reloadProfile = useCallback(async () => {
    const { data: s } = await supabase.auth.getSession()
    const uid = s.session?.user.id
    if (!uid) { setProfile(null); setPerms([]); return }
    const { data: p } = await supabase.from('profiles').select('id, full_name, email, role, avatar_url').eq('id', uid).maybeSingle()
    setProfile(p as Profile | null)
    currentActor = (p as Profile | null)?.full_name || s.session?.user.email || 'Office'
    if (p && p.role !== 'owner') {
      const { data: rp } = await supabase.from('role_permissions').select('module, can_view, can_create, can_edit, can_delete').eq('role', p.role)
      setPerms((rp as Perm[]) || [])
    } else setPerms([])
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session)
      if (data.session) await reloadProfile()
      setLoading(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(s)
      if (event === 'SIGNED_IN') reloadProfile()
      if (event === 'SIGNED_OUT') { setProfile(null); setPerms([]); queryClient.clear() }
    })
    return () => sub.subscription.unsubscribe()
  }, [reloadProfile])

  const value = useMemo<Ctx>(() => ({
    session, profile, perms, loading, reloadProfile,
    can: (module, action = 'view') => {
      if (!module) return true
      if (profile?.role === 'owner') return true
      const p = perms.find((x) => x.module === module)
      return !!p?.[`can_${action}` as const]
    },
    signIn: async (email, password) => {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      await reloadProfile()
    },
    signUp: async (email, password, fullName) => {
      const { error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: fullName } } })
      if (error) throw error
    },
    signOut: async () => { await supabase.auth.signOut() },
  }), [session, profile, perms, loading, reloadProfile])

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>
}
export const useAuth = () => useContext(AuthCtx)