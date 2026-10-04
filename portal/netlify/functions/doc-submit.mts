// POST /api/docs/submit — a client signs a document on their phone.
// Stored in Supabase `portal_submissions`; a database trigger files it into `documents`
// and the activity feed so it appears instantly in the NAIM COMMAND office app.
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })

const clean = (v: unknown) => (typeof v === 'string' && v.trim() ? v.trim().slice(0, 2000) : null)
const VALID = ['quotation', 'agreement', 'founding-partner', 'onboarding']

export default async (req: Request) => {
  if (req.method !== 'POST') return json({ ok: false, error: 'Method not allowed.' }, 405)

  let b: Record<string, unknown>
  try { b = await req.json() } catch { return json({ ok: false, error: 'Invalid request.' }, 400) }

  const docType = clean(b.doc_type)
  if (!docType || !VALID.includes(docType)) return json({ ok: false, error: 'Invalid document type.' }, 400)
  const client = clean(b.client_name), agency = clean(b.agency_name)
  if (!client || !agency) return json({ ok: false, error: 'Please fill in your name and agency name.' }, 400)
  if (!b.agreed) return json({ ok: false, error: 'Please tick the box to confirm you have read and agree.' }, 400)
  const sig = typeof b.signature === 'string' ? b.signature : ''
  if (!sig.startsWith('data:image/')) return json({ ok: false, error: 'Please sign in the signature box before submitting.' }, 400)
  if (sig.length > 2_000_000) return json({ ok: false, error: 'Signature image is too large.' }, 413)

  const url = process.env.SUPABASE_URL, key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    console.error('doc-submit: SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set')
    return json({ ok: false, error: 'Document signing is not configured yet. Please WhatsApp us directly.' }, 503)
  }

  const row = {
    doc_type: docType,
    client_name: client,
    agency_name: agency,
    email: clean(b.email),
    phone: clean(b.phone),
    fields: typeof b.fields === 'object' && b.fields ? b.fields : {},
    signature_data: sig,
    agreed: true,
    ip: req.headers.get('x-nf-client-connection-ip') || req.headers.get('x-forwarded-for'),
    user_agent: req.headers.get('user-agent'),
  }

  const res = await fetch(`${url}/rest/v1/portal_submissions`, {
    method: 'POST',
    headers: {
      apikey: key, Authorization: `Bearer ${key}`,
      'content-type': 'application/json', Prefer: 'return=minimal',
    },
    body: JSON.stringify(row),
  })
  if (!res.ok) {
    console.error('doc-submit: supabase insert failed', res.status, await res.text())
    return json({ ok: false, error: 'Something went wrong. Please try again or WhatsApp us directly.' }, 500)
  }
  return json({ ok: true, message: 'Document signed and submitted successfully.' })
}

export const config = { path: '/api/docs/submit' }