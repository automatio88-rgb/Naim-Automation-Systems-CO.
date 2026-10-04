// Local test harness for the Netlify Functions: runs each handler against a mock Supabase REST server.
// Usage: tsx scripts/test-functions.mjs site|portal
import http from 'node:http'

const target = process.argv[2]
const inserted = []
const mock = http.createServer((req, res) => {
  let data = ''
  req.on('data', (c) => (data += c))
  req.on('end', () => {
    inserted.push({ path: req.url, auth: req.headers.authorization, body: JSON.parse(data || '{}') })
    res.writeHead(201).end()
  })
})
await new Promise((r) => mock.listen(54329, r))
process.env.SUPABASE_URL = 'http://127.0.0.1:54329'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key'

const post = (body) => new Request('http://x/api', { method: 'POST', body: JSON.stringify(body), headers: { 'x-forwarded-for': '1.2.3.4' } })
let fail = 0
const check = async (name, handler, body, status) => {
  const r = await handler(post(body))
  const ok = r.status === status
  if (!ok) fail++
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name} -> ${r.status} ${await r.text()}`)
}

if (target === 'site') {
  const { default: leads } = await import('../site/netlify/functions/leads.mts')
  await check('leads: missing phone', leads, { agency_name: 'A', contact_name: 'B' }, 400)
  await check('leads: valid', leads, { agency_name: 'Demo Agency', contact_name: 'Jane', phone: '0700000000', nea_reg_no: 'NEA/1' }, 200)
} else {
  const { default: submit } = await import('../portal/netlify/functions/doc-submit.mts')
  const base = { doc_type: 'onboarding', client_name: 'Jane', agency_name: 'Demo', agreed: true, signature: 'data:image/png;base64,AAA' }
  await check('docs: bad type', submit, { ...base, doc_type: 'x' }, 400)
  await check('docs: unsigned', submit, { ...base, signature: '' }, 400)
  await check('docs: not agreed', submit, { ...base, agreed: false }, 400)
  await check('docs: valid', submit, base, 200)
}
console.log('mock supabase received:', JSON.stringify(inserted.map((i) => ({ path: i.path, keys: Object.keys(i.body) }))))
mock.close()
process.exit(fail ? 1 : 0)