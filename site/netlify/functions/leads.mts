// POST /api/leads — Free Operations Audit form → Supabase `leads` (source = landing_page).
// The office app (NAIM COMMAND) reads these leads in real time in the Lead Engine.
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })

const clean = (v: unknown) => (typeof v === 'string' && v.trim() ? v.trim().slice(0, 2000) : null)

export default async (req: Request) => {
  if (req.method !== 'POST') return json({ ok: false, error: 'Method not allowed.' }, 405)

  let body: Record<string, unknown>
  try { body = await req.json() } catch { return json({ ok: false, error: 'Invalid request.' }, 400) }

  const agency = clean(body.agency_name), contact = clean(body.contact_name), phone = clean(body.phone)
  if (!agency || !contact || !phone) {
    return json({ ok: false, error: 'Agency name, contact name and phone are required.' }, 400)
  }

  const url = process.env.SUPABASE_URL, key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    console.error('leads: SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set')
    return json({ ok: false, error: 'Lead capture is not configured yet. Please WhatsApp us directly.' }, 503)
  }

  const row = {
    business_name: agency,
    contact_name: contact,
    phone,
    email: clean(body.email),
    licence_no: clean(body.nea_reg_no),
    company_size: clean(body.agency_size),
    main_challenge: clean(body.main_challenge),
    source: 'landing_page',
    status: 'new',
  }

  const res = await fetch(`${url}/rest/v1/leads`, {
    method: 'POST',
    headers: {
      apikey: key, Authorization: `Bearer ${key}`,
      'content-type': 'application/json', Prefer: 'return=minimal',
    },
    body: JSON.stringify(row),
  })
  if (!res.ok) {
    console.error('leads: supabase insert failed', res.status, await res.text())
    return json({ ok: false, error: 'Something went wrong. Please try again or WhatsApp us directly.' }, 500)
  }
  return json({ ok: true, message: 'Audit request received.' })
}

export const config = { path: '/api/leads' }