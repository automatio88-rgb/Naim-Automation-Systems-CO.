// /api/webhooks/email — inbound email replies (Resend Inbound, Postmark, or any forwarder that POSTs JSON).
// Auth: header X-Webhook-Token or ?token= equal to INBOUND_EMAIL_TOKEN.
// Instant alternative to Echo's IMAP polling: a lead's reply is classified and filed the moment it lands.
import { Supa, activity, emailOf, findByEmail, guard, json, recordReply, safeEqual, stripQuoted } from '../lib/sb.mts'

export default async (req: Request) => guard(async () => {
  if (req.method !== 'POST') return json({ ok: false, error: 'Method not allowed.' }, 405)
  const token = process.env.INBOUND_EMAIL_TOKEN
  if (!token) return json({ ok: false, error: 'Webhook is not configured yet.' }, 503)
  const given = req.headers.get('x-webhook-token') || new URL(req.url).searchParams.get('token') || ''
  if (!safeEqual(given, token)) return json({ ok: false, error: 'Unauthorized' }, 401)
  let b: any
  try { b = await req.json() } catch { return json({ ok: false, error: 'Invalid JSON' }, 400) }

  const d = b.data || b
  const from = emailOf(String(d.from?.email || d.from || d.From || ''))
  const subject = String(d.subject || d.Subject || '')
  const text = stripQuoted(String(d.StrippedTextReply || d.text || d.TextBody || d.plain || '')) || subject
  if (!from) return json({ ok: false, error: 'Missing sender' }, 400)

  const db = new Supa()
  const lead = await findByEmail(db, 'leads', from)
  if (lead) return json({ ok: true, matched: 'lead', ...(await recordReply(db, lead, 'email', text)) })
  const client = await findByEmail(db, 'clients', from)
  if (client) {
    await activity(db, 'client', client.business_name, 'email_received', `${client.business_name} emailed: ${subject || text.slice(0, 120)}`, 'client', client.id, { subject })
    return json({ ok: true, matched: 'client', client_id: client.id })
  }
  return json({ ok: true, matched: null })
})

export const config = { path: '/api/webhooks/email' }