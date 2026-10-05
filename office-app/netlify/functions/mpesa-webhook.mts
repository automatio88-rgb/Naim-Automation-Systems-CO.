// /api/webhooks/mpesa?token=MPESA_WEBHOOK_TOKEN — Safaricom Daraja callbacks.
//   C2B confirmation (Paybill: the client types the invoice number as the account number)
//   STK push callback (add &ref=<invoice number> to the CallBackURL when you start the push)
// Records the payment against the invoice. The payments trigger updates paid amount, status and the activity feed.
// Unmatched payments are never lost: they become a high-priority task to match by hand.
import { Supa, activity, findByPhone, guard, json, notify, safeEqual } from '../lib/sb.mts'

const ACCEPT = () => json({ ResultCode: 0, ResultDesc: 'Accepted' })

export default async (req: Request) => guard(async () => {
  if (req.method !== 'POST') return json({ ok: false, error: 'Method not allowed.' }, 405)
  const url = new URL(req.url)
  const token = process.env.MPESA_WEBHOOK_TOKEN
  if (!token) return json({ ok: false, error: 'Webhook is not configured yet.' }, 503)
  if (!safeEqual(url.searchParams.get('token') || '', token)) return json({ ResultCode: 1, ResultDesc: 'Rejected' }, 401)
  let b: any
  try { b = await req.json() } catch { return json({ ResultCode: 1, ResultDesc: 'Invalid JSON' }, 400) }

  // Daraja calls the validation URL first when enabled: accept everything, the confirmation records it.
  if (url.searchParams.get('stage') === 'validation') return ACCEPT()

  let p: { receipt: string; amount: number; phone: string; ref: string; name: string }
  const db = new Supa()
  if (b?.Body?.stkCallback) {
    const s = b.Body.stkCallback
    if (Number(s.ResultCode) !== 0) {
      await activity(db, 'system', 'M-Pesa', 'payment_failed', `M-Pesa STK push not completed: ${s.ResultDesc}`, undefined, undefined, { checkout: s.CheckoutRequestID })
      return ACCEPT()
    }
    const it: Record<string, any> = Object.fromEntries((s.CallbackMetadata?.Item || []).map((i: any) => [i.Name, i.Value]))
    p = { receipt: String(it.MpesaReceiptNumber || ''), amount: Number(it.Amount || 0), phone: String(it.PhoneNumber || ''), ref: url.searchParams.get('ref') || '', name: '' }
  } else {
    p = { receipt: String(b.TransID || ''), amount: Number(b.TransAmount || 0), phone: String(b.MSISDN || ''), ref: String(b.BillRefNumber || ''), name: [b.FirstName, b.LastName].filter(Boolean).join(' ') }
  }
  if (!p.receipt || !(p.amount > 0)) return json({ ResultCode: 1, ResultDesc: 'Missing receipt or amount' }, 400)

  if (await db.one('payments', { select: 'id', reference: `eq.${p.receipt}` })) return json({ ResultCode: 0, ResultDesc: 'Accepted (duplicate)' })

  const open = { deleted_at: 'is.null', status: 'in.(sent,partial,overdue,draft)' }
  let inv = p.ref.trim() ? await db.one('invoices', { select: 'id,number,client_id,total_kes,paid_kes', number: `ilike.${p.ref.trim()}`, deleted_at: 'is.null' }) : null
  if (!inv) {  // fall back to the payer's phone, but only when exactly one invoice is open for that client
    const c = await findByPhone(db, 'clients', p.phone)
    if (c) {
      const invs = await db.select('invoices', { select: 'id,number,client_id,total_kes,paid_kes', client_id: `eq.${c.id}`, ...open })
      if (invs.length === 1) inv = invs[0]
    }
  }
  if (!inv) {
    const msg = `M-Pesa ${p.receipt}: KES ${p.amount.toLocaleString('en-KE')} from ${p.name || p.phone} (account "${p.ref}") could not be matched to an invoice`
    await db.insert('tasks', { title: `Match M-Pesa payment ${p.receipt}`, description: msg, priority: 'urgent', created_by_kind: 'system', created_by: 'M-Pesa webhook', due_at: new Date().toISOString() })
    await activity(db, 'system', 'M-Pesa', 'payment_unmatched', msg, undefined, undefined, p)
    await notify(db, 'Unmatched M-Pesa payment', msg, 'warning')
    return ACCEPT()
  }
  await db.insert('payments', { invoice_id: inv.id, amount_kes: p.amount, method: 'mpesa', reference: p.receipt, paid_at: new Date().toISOString() })
  await notify(db, 'Payment received', `KES ${p.amount.toLocaleString('en-KE')} via M-Pesa for ${inv.number} (${p.receipt})`, 'success', 'invoice', inv.id)
  return ACCEPT()
})

export const config = { path: '/api/webhooks/mpesa' }