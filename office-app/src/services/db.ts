// Service layer — every module reads/writes Supabase through these helpers.
import { useEffect } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { supabase, realtimeEnabled } from '@/lib/supabase'
import { queryClient } from '@/lib/query'
import { currentActor } from '@/lib/auth'

export type Row = Record<string, any>

export async function run<T = any>(p: PromiseLike<{ data: any; error: any }>): Promise<T> {
  const r = await p
  if (r.error) throw new Error(r.error.message || 'Request failed')
  return r.data as T
}

type ListOpts = {
  select?: string
  order?: [string, boolean?]
  filter?: (b: any) => any
  limit?: number
  key?: unknown[]
  enabled?: boolean
}
/** Query a table. The first query-key element is the table name so realtime/mutations can invalidate it. */
export function useList<T = Row>(table: string, opts: ListOpts = {}) {
  const { select = '*', order, filter, limit = 2000, key = [] } = opts
  return useQuery<T[]>({
    queryKey: [table, select, order, limit, ...key],
    enabled: opts.enabled ?? true,
    queryFn: async () => {
      let b: any = supabase.from(table).select(select)
      if (filter) b = filter(b)
      if (order) b = b.order(order[0], { ascending: order[1] ?? false, nullsFirst: false })
      return run(b.limit(limit))
    },
  })
}

export function useOne<T = Row>(table: string, id: string | null | undefined, select = '*') {
  return useQuery<T | null>({
    queryKey: [table, 'one', id, select],
    enabled: !!id,
    queryFn: () => run(supabase.from(table).select(select).eq('id', id).maybeSingle()),
  })
}

export const invalidate = (tables?: string[]) =>
  queryClient.invalidateQueries(tables ? { predicate: (q) => tables.includes(String(q.queryKey[0])) } : undefined)

export async function insert(table: string, row: Row | Row[]) {
  const d = await run(supabase.from(table).insert(row).select())
  invalidate(); return Array.isArray(row) ? d : d?.[0]
}
export async function update(table: string, id: string, patch: Row) {
  const d = await run(supabase.from(table).update(patch).eq('id', id).select())
  invalidate(); return d?.[0]
}
export async function updateWhere(table: string, col: string, val: unknown, patch: Row) {
  await run(supabase.from(table).update(patch).eq(col, val)); invalidate()
}
export async function remove(table: string, id: string, soft = false) {
  if (soft) await run(supabase.from(table).update({ deleted_at: new Date().toISOString() }).eq('id', id))
  else await run(supabase.from(table).delete().eq('id', id))
  invalidate()
}
export async function rpc<T = any>(fn: string, args: Row = {}) {
  const d = await run<T>(supabase.rpc(fn, args)); invalidate(); return d
}

export async function logActivity(summary: string, verb: string, entity_type?: string, entity_id?: string, metadata: Row = {}) {
  await supabase.from('activities').insert({ actor_kind: 'human', actor_name: currentActor, verb, entity_type, entity_id, summary, metadata })
}

/** App → Hermes: write a command row; the fleet picks it up (via MCP get_commands / ack_command). */
export async function sendCommand(command: string, target_bot: string | null, payload: Row = {}, label?: string) {
  const row = await insert('automation_commands', { command, target_bot, payload, requested_by: currentActor })
  await logActivity(label || `Sent "${command.replace(/_/g, ' ')}" to ${target_bot ? target_bot[0].toUpperCase() + target_bot.slice(1) : 'the fleet'}`, 'hermes_command', 'automation_command', row?.id, { command, payload })
  invalidate(['activities'])
  return row
}

export async function setSetting(key: string, value: unknown) {
  await run(supabase.from('automation_settings').upsert({ key, value, updated_at: new Date().toISOString(), updated_by: currentActor }))
  invalidate(['automation_settings'])
}

export function useAction<V = void>(fn: (v: V) => Promise<unknown>, success?: string | ((r: any) => string)) {
  return useMutation({
    mutationFn: fn,
    onSuccess: (r) => { invalidate(); if (success) toast.success(typeof success === 'function' ? success(r) : success) },
    onError: (e: Error) => toast.error(e.message),
  })
}

const LIVE_TABLES = ['leads', 'activities', 'notifications', 'appointments', 'automation_commands', 'automation_runs', 'hermes_bots', 'invoices', 'payments', 'tasks', 'documents', 'deals']
/** Production: Supabase Realtime → invalidate the affected queries instantly. Preview: polling (see query.ts). */
export function useRealtimeSync(enabled: boolean) {
  useEffect(() => {
    if (!enabled || !realtimeEnabled) return
    const ch: any = supabase.channel('naim-live')
    LIVE_TABLES.forEach((t) => ch.on('postgres_changes', { event: '*', schema: 'public', table: t }, (p: any) => {
      queryClient.invalidateQueries({ predicate: (q) => q.queryKey[0] === p.table || q.queryKey[0] === 'dash' })
    }))
    ch.subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [enabled])
}