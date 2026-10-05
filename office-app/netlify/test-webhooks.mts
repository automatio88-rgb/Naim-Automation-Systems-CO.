// Local test of the 4 inbound webhooks against the preview backend. Creates ZZ test rows and removes them.
//   set -a; eval "$(sudo cat /etc/naim/hermes.env)"; set +a; node netlify/test-webhooks.mts
import { Supa, hmacHex } from './lib/sb.mts'
import wa from './functions/whatsapp-webhook.mts'
import mpesa from './functions/mpesa-webhook.mts'
import booking from './functions/booking-webhook.mts'
import mail from './functions/email-webhook.mts'

Object.assign(process.env, { WHATSAPP_VERIFY_TOKEN: 'vt', WHATSAPP_APP_SECRET: 'wa-secret', MPESA_WEBHOOK_TOKEN: 'mp-token', CAL_WEBHOOK_SECRET: 'cal-secret', INBOUND_EMAIL_TOKEN: 'em-token' })
const db = new Supa()
const B = 'https://office.test'
let pass = 0, fail = 0
const ok = (name: string, cond: boolean, info: unknown = '') => { cond ? pass++ : fail++; console.log(cond ? 'PASS' : 'FAIL', name, cond ? '' : JSON.stringify(info)) }
const post = (fn: any, path: string, body: unknown, headers: Record<string, string> = {}) =>
  fn(new Request(B + path, { method: 'POST', headers: { 'content-type': 'application/json', ...headers }, body: typeof body === 'string' ? body : JSON.stringify(body) }))

const lead = (await db.insert('leads', { business_name: 'ZZ Hook Agency', contact_name: 'Zed Test', phone: '0711 222 333', email: 'zzhook@example.com', status: 'sent', source: 'test' }))[0]
await db.insert('outreach_messages', { lead_id: lead.id, channel: 'whatsapp', step: 1, body: 'hi', status: 'sent' })
const client = (await db.insert('clients', { business_name: 'ZZ Hook Client', phone: '0799 888 777', email: 'zzclient@example.com' }))[0]
const inv = (await db.insert('invoices', { client_id: client.id, type: 'one_off', status: 'sent', line_items: [{ kind: 'service', name: 'ZZ setup', qty: 1, unit_price_kes: 10000 }], due_date: '2026-10-30' }))[0]
const ids: string[] = [lead.id, client.id]

try {
  // WhatsApp
  let r = await wa(new Request(`${B}/api/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=vt&hub.challenge=42`))
  ok('whatsapp verify', r.status === 200 && (await r.text()) === '42')
  const waBody = JSON.stringify({ entry: [{ changes: [{ value: { contacts: [{ wa_id: '254711222333', profile: { name: 'Zed' } }], messages: [{ from: '254711222333', type: 'text', text: { body: 'Yes we are interested, can we do a call tomorrow?' } }] } }] }] })
  r = await post(wa, '/api/webhooks/whatsapp', waBody, { 'x-hub-signature-256': 'sha256=bad' })
  ok('whatsapp bad signature -> 401', r.status === 401)
  r = await post(wa, '/api/webhooks/whatsapp', waBody, { 'x-hub-signature-256': 'sha256=' + await hmacHex('wa-secret', waBody) })
  let j = await r.json()
  ok('whatsapp reply filed as interested', r.status === 200 && j.results?.[0]?.intent === 'interested', j)
  const l2 = await db.one('leads', { id: `eq.${lead.id}` })
  ok('lead moved to replied', l2?.status === 'replied', l2?.status)
  ok('hot-reply task created', !!(await db.one('tasks', { entity_id: `eq.${lead.id}`, title: 'like.Book a call*' })))
  const unk = JSON.stringify({ entry: [{ changes: [{ value: { contacts: [{ wa_id: '254700999111', profile: { name: 'ZZ Unknown Sender' } }], messages: [{ from: '254700999111', type: 'text', text: { body: 'How much is the system?' } }] } }] }] })
  r = await post(wa, '/api/webhooks/whatsapp', unk, { 'x-hub-signature-256': 'sha256=' + await hmacHex('wa-secret', unk) })
  j = await r.json()
  ok('unknown WhatsApp number becomes a lead', !!j.results?.[0]?.lead_id, j)
  if (j.results?.[0]?.lead_id) ids.push(j.results[0].lead_id)

  // Email
  r = await post(mail, '/api/webhooks/email', { from: 'Zed <zzhook@example.com>', text: 'Busy now, try next month.\n\nOn Mon, Herald wrote:\n> hi' }, { 'x-webhook-token': 'em-token' })
  j = await r.json(); ok('email reply matched + classified not_now', j.matched === 'lead' && j.intent === 'not_now', j)
  r = await post(mail, '/api/webhooks/email', { from: 'zzclient@example.com', subject: 'ZZ question' }, { 'x-webhook-token': 'em-token' })
  j = await r.json(); ok('email from client logged', j.matched === 'client', j)
  r = await post(mail, '/api/webhooks/email', { from: 'x@y.z', text: 'x' }, { 'x-webhook-token': 'nope' })
  ok('email bad token -> 401', r.status === 401)

  // M-Pesa
  const rc = 'ZZ' + Date.now().toString().slice(-8)
  r = await post(mpesa, '/api/webhooks/mpesa?token=mp-token', { TransID: rc, TransAmount: '4000', MSISDN: '254799888777', BillRefNumber: inv.number, FirstName: 'ZZ' })
  j = await r.json(); ok('mpesa C2B accepted', j.ResultCode === 0, j)
  const inv2 = await db.one('invoices', { id: `eq.${inv.id}` })
  ok('invoice now partial with KES 4,000 paid', Number(inv2?.paid_kes) === 4000 && inv2?.status === 'partial', { paid: inv2?.paid_kes, status: inv2?.status })
  r = await post(mpesa, '/api/webhooks/mpesa?token=mp-token', { TransID: rc, TransAmount: '4000', MSISDN: '254799888777', BillRefNumber: inv.number })
  j = await r.json(); ok('mpesa duplicate ignored', /duplicate/.test(j.ResultDesc), j)
  const stk = { Body: { stkCallback: { ResultCode: 0, ResultDesc: 'ok', CheckoutRequestID: 'x', CallbackMetadata: { Item: [{ Name: 'Amount', Value: 6000 }, { Name: 'MpesaReceiptNumber', Value: rc + 'S' }, { Name: 'PhoneNumber', Value: 254799888777 }] } } } }
  r = await post(mpesa, `/api/webhooks/mpesa?token=mp-token&ref=${inv.number}`, stk)
  const inv3 = await db.one('invoices', { id: `eq.${inv.id}` })
  ok('mpesa STK clears the invoice (paid)', inv3?.status === 'paid', { paid: inv3?.paid_kes, status: inv3?.status })
  r = await post(mpesa, '/api/webhooks/mpesa?token=mp-token', { TransID: rc + 'U', TransAmount: '1500', MSISDN: '254700000001', BillRefNumber: 'ZZ-NOPE' })
  ok('unmatched mpesa -> urgent task', !!(await db.one('tasks', { title: `eq.Match M-Pesa payment ${rc}U` })))
  r = await post(mpesa, '/api/webhooks/mpesa?token=bad', {})
  ok('mpesa bad token -> 401', r.status === 401)

  // Cal.com booking
  const uid = 'zz-' + Date.now()
  const cal = JSON.stringify({ triggerEvent: 'BOOKING_CREATED', payload: { uid, startTime: '2026-10-07T07:00:00Z', endTime: '2026-10-07T07:30:00Z', attendees: [{ name: 'Zed', email: 'zzhook@example.com' }], metadata: { videoCallUrl: 'https://meet.google.com/zzz-test' } } })
  r = await post(booking, '/api/webhooks/booking', cal, { 'x-cal-signature-256': 'bad' })
  ok('booking bad signature -> 401', r.status === 401)
  r = await post(booking, '/api/webhooks/booking', cal, { 'x-cal-signature-256': await hmacHex('cal-secret', cal) })
  j = await r.json(); ok('booking created appointment', !!j.appointment_id, j)
  const l3 = await db.one('leads', { id: `eq.${lead.id}` })
  ok('lead moved to booked + discovery deal', l3?.status === 'booked' && !!(await db.one('deals', { lead_id: `eq.${lead.id}` })), l3?.status)
  ok('book-a-call task auto-closed', (await db.one('tasks', { entity_id: `eq.${lead.id}`, title: 'like.Book a call*' }))?.status === 'done')
  const cancel = JSON.stringify({ triggerEvent: 'BOOKING_CANCELLED', payload: { uid } })
  r = await post(booking, '/api/webhooks/booking', cancel, { 'x-cal-signature-256': await hmacHex('cal-secret', cancel) })
  j = await r.json(); ok('booking cancelled', j.cancelled === 1, j)
} finally {
  const del = (t: string, q: string) => db.req('DELETE', `${t}?${q}`)
  const list = ids.join(',')
  for (const t of ['replies', 'outreach_messages', 'appointments', 'deals']) await del(t, `lead_id=in.(${list})`)
  await del('payments', `invoice_id=eq.${inv.id}`)
  await del('invoices', `client_id=eq.${client.id}`)
  await del('tasks', `or=(entity_id.in.(${list}),title.like.*ZZ*,description.like.*ZZ*)`)
  await del('activities', `or=(entity_id.in.(${list},${inv.id}),summary.like.*ZZ*)`)
  await del('notifications', `or=(entity_id.in.(${list},${inv.id}),body.like.*ZZ*,title.like.*ZZ*)`)
  await del('leads', `id=in.(${ids.filter((x) => x !== client.id).join(',')})`)
  await del('clients', `id=eq.${client.id}`)
}
console.log(`\nPASS ${pass}  FAIL ${fail}`)
process.exit(fail ? 1 : 0)