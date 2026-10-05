// /api/webhooks/whatsapp — WhatsApp Cloud API webhook (Meta).
//   GET  verification handshake (WHATSAPP_VERIFY_TOKEN)
//   POST inbound messages, signed with X-Hub-Signature-256 (WHATSAPP_APP_SECRET)
// A message from a known lead becomes a reply (Echo's job, done instantly). An unknown number becomes a new lead.
import { Supa, activity, findByPhone, guard, hmacHex, json, notify, recordReply, safeEqual } from '../lib/sb.mts'

export default async (req: Request) => guard(async () => {
  const url = new URL(req.url)
  if (req.method === 'GET') {
    const ok = url.searchParams.get('hub.mode') === 'subscribe' && process.env.WHATSAPP_VERIFY_TOKEN && url.searchParams.get('hub.verify_token') === process.env.WHATSAPP_VERIFY_TOKEN
    return ok ? new Response(url.searchParams.get('hub.challenge') || '', { status: 200 }) : new Response('Forbidden', { status: 403 })
  }
  if (req.method !== 'POST') return json({ ok: false, error: 'Method not allowed.' }, 405)

  const raw = await req.text()
  const secret = process.env.WHATSAPP_APP_SECRET
  if (!secret) return json({ ok: false, error: 'Webhook is not configured yet.' }, 503)
  const sig = (req.headers.get('x-hub-signature-256') || '').replace(/^sha256=/, '')
  if (!sig || !safeEqual(sig, await hmacHex(secret, raw))) return json({ ok: false, error: 'Bad signature' }, 401)

  let body: any
  try { body = JSON.parse(raw) } catch { return json({ ok: false, error: 'Invalid JSON' }, 400) }
  const db = new Supa()
  const out: any[] = []
  for (const entry of body.entry || []) for (const ch of entry.changes || []) {
    const v = ch.value || {}
    const names: Record<string, string> = Object.fromEntries((v.contacts || []).map((c: any) => [c.wa_id, c.profile?.name]))
    for (const m of v.messages || []) {
      const text = m.text?.body || m.button?.text || m.interactive?.button_reply?.title || m.interactive?.list_reply?.title || `[${m.type} message]`
      let lead = await findByPhone(db, 'leads', m.from)
      if (!lead) {
        const client = await findByPhone(db, 'clients', m.from)
        if (client) {
          await activity(db, 'client', client.business_name, 'whatsapp_message', `${client.business_name} on WhatsApp: ${text.slice(0, 140)}`, 'client', client.id, { from: m.from })
          await notify(db, 'Client message', `${client.business_name}: ${text.slice(0, 140)}`, 'info', 'client', client.id)
          out.push({ client_id: client.id }); continue
        }
        const name = names[m.from] || `WhatsApp +${m.from}`
        lead = (await db.insert('leads', { business_name: name, contact_name: names[m.from] || null, phone: `+${m.from}`, source: 'whatsapp_inbound', status: 'new' }))[0]
        await activity(db, 'system', 'WhatsApp', 'lead_created', `New inbound WhatsApp lead: ${name}`, 'lead', lead.id)
        await notify(db, 'New WhatsApp lead', `${name}: ${text.slice(0, 140)}`, 'lead', 'lead', lead.id)
      }
      out.push(await recordReply(db, lead, 'whatsapp', text))
    }
  }
  return json({ ok: true, processed: out.length, results: out })
})

export const config = { path: '/api/webhooks/whatsapp' }