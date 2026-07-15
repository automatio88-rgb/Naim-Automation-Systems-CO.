import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { landingPage } from './landing'
import { docsHubPage } from './docs/hub'
import { quotationPage } from './docs/quotation'
import { agreementPage } from './docs/agreement'
import { foundingPartnerPage } from './docs/founding'
import { onboardingPage } from './docs/onboarding'

type Bindings = {
  DB: D1Database
}

const ADMIN_KEY = 'naim-admin-2026'

const app = new Hono<{ Bindings: Bindings }>()

app.use('/api/*', cors())

// ---------- API: Lead capture (our own speed-to-lead) ----------
app.post('/api/leads', async (c) => {
  try {
    const body = await c.req.json()
    const { agency_name, contact_name, phone, email, nea_reg_no, agency_size, main_challenge } = body

    if (!agency_name || !contact_name || !phone) {
      return c.json({ ok: false, error: 'Agency name, contact name and phone are required.' }, 400)
    }

    const { env } = c
    if (env.DB) {
      await env.DB.prepare(`
        INSERT INTO leads (agency_name, contact_name, phone, email, nea_reg_no, agency_size, main_challenge)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).bind(
        agency_name, contact_name, phone,
        email || null, nea_reg_no || null, agency_size || null, main_challenge || null
      ).run()
    }

    return c.json({ ok: true, message: 'Audit request received.' })
  } catch (e) {
    return c.json({ ok: false, error: 'Something went wrong. Please try again or WhatsApp us directly.' }, 500)
  }
})

app.get('/api/leads', async (c) => {
  const key = c.req.query('key')
  if (key !== ADMIN_KEY) return c.json({ ok: false, error: 'Unauthorized' }, 401)
  const { env } = c
  if (!env.DB) return c.json({ ok: true, leads: [] })
  const { results } = await env.DB.prepare(`SELECT * FROM leads ORDER BY created_at DESC LIMIT 200`).all()
  return c.json({ ok: true, leads: results })
})

// ---------- API: Interactive document submissions ----------
app.post('/api/docs/submit', async (c) => {
  try {
    const body = await c.req.json()
    const { doc_type, client_name, agency_name, email, phone, fields, signature, agreed } = body

    const validTypes = ['quotation', 'agreement', 'founding-partner', 'onboarding']
    if (!doc_type || !validTypes.includes(doc_type)) {
      return c.json({ ok: false, error: 'Invalid document type.' }, 400)
    }
    if (!client_name || !agency_name) {
      return c.json({ ok: false, error: 'Please fill in your name and agency name.' }, 400)
    }
    if (!agreed) {
      return c.json({ ok: false, error: 'Please tick the box to confirm you have read and agree.' }, 400)
    }
    if (!signature) {
      return c.json({ ok: false, error: 'Please sign in the signature box before submitting.' }, 400)
    }

    const { env } = c
    if (env.DB) {
      await env.DB.prepare(`
        INSERT INTO doc_submissions (doc_type, client_name, agency_name, email, phone, fields_json, signature_data, agreed, ip, user_agent)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        doc_type, client_name, agency_name,
        email || null, phone || null,
        JSON.stringify(fields || {}),
        signature, 1,
        c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for') || null,
        c.req.header('user-agent') || null
      ).run()
    }

    return c.json({ ok: true, message: 'Document signed and submitted successfully.' })
  } catch (e) {
    return c.json({ ok: false, error: 'Something went wrong. Please try again or WhatsApp us directly.' }, 500)
  }
})

app.get('/api/docs/submissions', async (c) => {
  const key = c.req.query('key')
  if (key !== ADMIN_KEY) return c.json({ ok: false, error: 'Unauthorized' }, 401)
  const { env } = c
  if (!env.DB) return c.json({ ok: true, submissions: [] })
  const { results } = await env.DB.prepare(
    `SELECT id, doc_type, client_name, agency_name, email, phone, fields_json, agreed, created_at FROM doc_submissions ORDER BY created_at DESC LIMIT 200`
  ).all()
  return c.json({ ok: true, submissions: results })
})

app.get('/api/docs/submissions/:id', async (c) => {
  const key = c.req.query('key')
  if (key !== ADMIN_KEY) return c.json({ ok: false, error: 'Unauthorized' }, 401)
  const { env } = c
  if (!env.DB) return c.json({ ok: false, error: 'No database' }, 500)
  const row = await env.DB.prepare(`SELECT * FROM doc_submissions WHERE id = ?`).bind(c.req.param('id')).first()
  return c.json({ ok: true, submission: row })
})

// ---------- Landing Page ----------
app.get('/', (c) => c.html(landingPage()))

// ---------- Document Suite (interactive, sign-on-phone) ----------
app.get('/docs', (c) => c.html(docsHubPage()))
app.get('/docs/quotation', (c) => c.html(quotationPage()))
app.get('/docs/agreement', (c) => c.html(agreementPage()))
app.get('/docs/founding-partner', (c) => c.html(foundingPartnerPage()))
app.get('/docs/onboarding', (c) => c.html(onboardingPage()))

export default app
