// /api/webhooks/booking — Cal.com booking webhook, signed with X-Cal-Signature-256 (CAL_WEBHOOK_SECRET).
// BOOKING_CREATED / RESCHEDULED -> appointment (with Meet link), lead moves to booked, a discovery deal opens.
// BOOKING_CANCELLED -> appointment cancelled. Unknown attendees become new leads (source booking).
import { Supa, activity, emailOf, findByEmail, guard, hmacHex, json, notify, safeEqual } from '../lib/sb.mts'

export default async (req: Request) => guard(async () => {
  if (req.method !== 'POST') return json({ ok: false, error: 'Method not allowed.' }, 405)
  const raw = await req.text()
  const secret = process.env.CAL_WEBHOOK_SECRET
  if (!secret) return json({ ok: false, error: 'Webhook is not configured yet.' }, 503)
  const sig = req.headers.get('x-cal-signature-256') || ''
  if (!sig || !safeEqual(sig, await hmacHex(secret, raw))) return json({ ok: false, error: 'Bad signature' }, 401)
  let b: any
  try { b = JSON.parse(raw) } catch { return json({ ok: false, error: 'Invalid JSON' }, 400) }

  const ev = b.triggerEvent, p = b.payload || {}
  const db = new Supa()
  const key = (uid: string) => `cal:${uid}`

  if (ev === 'BOOKING_CANCELLED') {
    const rows = await db.update('appointments', { notes: `like.${key(p.uid)}*` }, { status: 'cancelled' })
    for (const a of rows) await activity(db, 'system', 'Cal.com', 'appointment_cancelled', `Booking cancelled: ${a.title}`, a.client_id ? 'client' : 'lead', a.client_id || a.lead_id)
    return json({ ok: true, cancelled: rows.length })
  }
  if (ev !== 'BOOKING_CREATED' && ev !== 'BOOKING_RESCHEDULED') return json({ ok: true, ignored: ev })

  const att = (p.attendees || [])[0] || {}
  const email = emailOf(att.email || '')
  const name = att.name || email || 'Online booking'
  const agency = p.responses?.agency?.value || p.responses?.company?.value || null
  const fields = {
    starts_at: p.startTime, ends_at: p.endTime || null,
    meet_link: p.metadata?.videoCallUrl || p.videoCallData?.url || (typeof p.location === 'string' && p.location.startsWith('http') ? p.location : null),
  }

  if (ev === 'BOOKING_RESCHEDULED' && p.rescheduleUid) {
    const moved = await db.update('appointments', { notes: `like.${key(p.rescheduleUid)}*` }, { ...fields, status: 'booked', notes: `${key(p.uid)} (rescheduled)` })
    if (moved.length) {
      await activity(db, 'system', 'Cal.com', 'appointment_rescheduled', `${moved[0].title} moved to ${p.startTime}`, moved[0].client_id ? 'client' : 'lead', moved[0].client_id || moved[0].lead_id)
      return json({ ok: true, rescheduled: moved[0].id })
    }
  }
  if (await db.one('appointments', { select: 'id', notes: `like.${key(p.uid)}*` })) return json({ ok: true, duplicate: true })

  const client = await findByEmail(db, 'clients', email)
  let lead = client ? null : await findByEmail(db, 'leads', email)
  if (!client && !lead) {
    lead = (await db.insert('leads', { business_name: agency || name, contact_name: att.name || null, email: email || null, source: 'booking', status: 'new' }))[0]
    await activity(db, 'system', 'Cal.com', 'lead_created', `New lead from online booking: ${lead.business_name}`, 'lead', lead.id)
  }
  const who = (client || lead)!.business_name
  const isClient = !!client
  const appt = (await db.insert('appointments', {
    ...fields, client_id: client?.id ?? null, lead_id: lead?.id ?? null,
    title: `${isClient ? 'Client call' : 'Discovery call'}: ${who}`, type: isClient ? 'review' : 'discovery_call',
    status: 'booked', source: 'online', notes: key(p.uid),
  }))[0]

  if (lead && !['converted'].includes(lead.status)) {
    await db.update('leads', { id: `eq.${lead.id}` }, { status: 'booked' })
    if (!(await db.one('deals', { select: 'id', lead_id: `eq.${lead.id}`, stage: 'not.in.(won,lost)', deleted_at: 'is.null' })))
      await db.insert('deals', { lead_id: lead.id, title: who, stage: 'discovery', value_kes: 0, probability: 20 })
    await db.update('tasks', { entity_type: 'eq.lead', entity_id: `eq.${lead.id}`, title: 'like.Book a call*', status: 'neq.done' }, { status: 'done', completed_at: new Date().toISOString() })
  }
  await activity(db, 'system', 'Cal.com', 'call_booked', `${who} booked a call for ${new Date(p.startTime).toLocaleString('en-KE', { timeZone: 'Africa/Nairobi', dateStyle: 'medium', timeStyle: 'short' })}`, isClient ? 'client' : 'lead', (client || lead)!.id)
  await notify(db, 'Call booked', `${who} booked online`, 'success', isClient ? 'client' : 'lead', (client || lead)!.id)
  return json({ ok: true, appointment_id: appt.id })
})

export const config = { path: '/api/webhooks/booking' }