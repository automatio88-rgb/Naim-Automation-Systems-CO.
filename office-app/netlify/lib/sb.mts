// Shared helpers for the NAIM COMMAND inbound webhooks (Netlify Functions, server-side only).
// Uses the Supabase service role key, which never reaches a browser.

export const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })

export class ConfigError extends Error {}

type Row = Record<string, any>

export class Supa {
  base: string
  h: Record<string, string>
  constructor() {
    const url = process.env.SUPABASE_URL, key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !key) throw new ConfigError('SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set')
    this.base = url.replace(/\/$/, '') + '/rest/v1'
    this.h = { apikey: key, Authorization: `Bearer ${key}`, 'content-type': 'application/json', Prefer: 'return=representation' }
  }
  async req(method: string, path: string, body?: unknown): Promise<any> {
    const r = await fetch(`${this.base}/${path}`, { method, headers: this.h, body: body === undefined ? undefined : JSON.stringify(body) })
    const t = await r.text()
    if (!r.ok) throw new Error(`${method} ${path.split('?')[0]} -> ${r.status}: ${t.slice(0, 300)}`)
    return t ? JSON.parse(t) : null
  }
  select(table: string, q: Record<string, string> = {}): Promise<Row[]> { return this.req('GET', `${table}?${new URLSearchParams(q)}`) }
  async one(table: string, q: Record<string, string> = {}): Promise<Row | null> { return (await this.select(table, { ...q, limit: '1' }))[0] ?? null }
  insert(table: string, rows: Row | Row[]): Promise<Row[]> { return this.req('POST', table, rows) }
  update(table: string, q: Record<string, string>, patch: Row): Promise<Row[]> { return this.req('PATCH', `${table}?${new URLSearchParams(q)}`, patch) }
}

export async function hmacHex(secret: string, body: string): Promise<string> {
  const enc = new TextEncoder()
  const k = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const s = await crypto.subtle.sign('HMAC', k, enc.encode(body))
  return [...new Uint8Array(s)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

export function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let d = 0
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return d === 0
}

/** Same rules as Echo's classifier in mcp-server/fleet.py, so the app and the fleet agree. */
export function classify(text: string): [string, string] {
  const t = text.toLowerCase()
  if (['unsubscribe', 'stop', 'not interested', 'remove me'].some((w) => t.includes(w))) return ['not_interested', 'negative']
  if (['call', 'meet', 'demo', 'interested', 'yes', 'price', 'cost', 'how much', 'available'].some((w) => t.includes(w))) return ['interested', 'positive']
  if (['later', 'next month', 'not now', 'busy'].some((w) => t.includes(w))) return ['not_now', 'neutral']
  if (t.includes('?')) return ['question', 'neutral']
  return ['unknown', 'neutral']
}

export const last9 = (p: string | null | undefined) => (p || '').replace(/\D/g, '').slice(-9)
export const emailOf = (s: string) => (s.match(/<([^>]+)>/)?.[1] || s).trim().toLowerCase()
export const stripQuoted = (s: string) => s.split(/\r?\nOn .{0,200}wrote:|\r?\n-{2,} ?Original Message|\r?\n>/)[0].trim()

export async function findByPhone(db: Supa, table: 'leads' | 'clients', phone: string): Promise<Row | null> {
  const d = last9(phone)
  if (d.length < 9) return null
  const rows = await db.select(table, { select: 'id,business_name,phone,email,' + (table === 'leads' ? 'status' : 'tier'), deleted_at: 'is.null', phone: `like.*${d.slice(-3)}`, limit: '2000' })
  return rows.find((r) => last9(r.phone) === d) ?? null
}

export async function findByEmail(db: Supa, table: 'leads' | 'clients', email: string): Promise<Row | null> {
  if (!email.includes('@')) return null
  return db.one(table, { select: 'id,business_name,phone,email,' + (table === 'leads' ? 'status' : 'tier'), deleted_at: 'is.null', email: `ilike.${email}` })
}

export function activity(db: Supa, actorKind: string, actor: string, verb: string, summary: string, entityType?: string, entityId?: string, metadata: Row = {}) {
  return db.insert('activities', { actor_kind: actorKind, actor_name: actor, verb, summary, entity_type: entityType ?? null, entity_id: entityId ?? null, metadata })
}

export function notify(db: Supa, title: string, body: string, type = 'info', entityType?: string, entityId?: string) {
  return db.insert('notifications', { type, title, body, entity_type: entityType ?? null, entity_id: entityId ?? null })
}

/** A lead replied (WhatsApp or email): store it, move the lead, stop the sequence, and raise a task when it is hot. */
export async function recordReply(db: Supa, lead: Row, channel: string, body: string) {
  const [intent, sentiment] = classify(body)
  await db.insert('replies', { lead_id: lead.id, channel, body: body.slice(0, 4000), intent, sentiment })
  const keep = ['booked', 'converted'].includes(lead.status)
  await db.update('leads', { id: `eq.${lead.id}` }, { status: intent === 'not_interested' ? 'dead' : keep ? lead.status : 'replied' })
  await db.update('outreach_messages', { lead_id: `eq.${lead.id}`, status: 'in.(sent,delivered)' }, { status: 'replied' })
  await db.update('outreach_messages', { lead_id: `eq.${lead.id}`, status: 'in.(queued,approved)' }, { status: 'failed' })
  await activity(db, 'client', lead.business_name, 'reply_received', `${lead.business_name} replied on ${channel} (${intent.replace('_', ' ')})`, 'lead', lead.id, { channel, intent })
  if (intent === 'interested') {
    await db.insert('tasks', { title: `Book a call with ${lead.business_name}`, description: body.slice(0, 500), priority: 'high', entity_type: 'lead', entity_id: lead.id,
      created_by_kind: 'system', created_by: `${channel} webhook`, due_at: new Date(Date.now() + 4 * 3600e3).toISOString() })
    await notify(db, 'Hot reply', `${lead.business_name} wants to talk (${channel})`, 'lead', 'lead', lead.id)
  }
  return { lead_id: lead.id, intent }
}

export async function guard(fn: () => Promise<Response>): Promise<Response> {
  try { return await fn() } catch (e) {
    if (e instanceof ConfigError) { console.error(e.message); return json({ ok: false, error: 'Webhook is not configured yet.' }, 503) }
    console.error('webhook error', e)
    return json({ ok: false, error: 'Internal error' }, 500)
  }
}