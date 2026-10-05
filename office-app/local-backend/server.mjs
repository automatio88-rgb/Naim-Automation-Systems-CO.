// LOCAL PREVIEW ONLY. Supabase-compatible facade for the VM preview:
//   /rest/v1/*   -> PostgREST (same API supabase-js uses in production)
//   /auth/v1/*   -> minimal GoTrue emulation (password login, user, logout, refresh)
//   /readyz      -> 204 once Postgres + PostgREST answer
//   everything else -> office-app/dist (SPA fallback)
import http from 'node:http'
import { createHmac, randomUUID } from 'node:crypto'
import { readFileSync, existsSync, statSync } from 'node:fs'
import { join, extname, normalize } from 'node:path'
import pg from 'pg'

const PORT = Number(process.env.PORT || 8080)
const PGRST = process.env.PGRST_URL || 'http://127.0.0.1:3001'
const SECRET = process.env.JWT_SECRET
const DIST = process.env.DIST_DIR || new URL('../dist', import.meta.url).pathname
if (!SECRET) throw new Error('JWT_SECRET required')
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL || 'postgres://authenticator:authenticator-local@127.0.0.1:5432/naim', max: 4 })
const adminPool = new pg.Pool({ connectionString: process.env.ADMIN_DATABASE_URL, max: 2 })

const b64 = (o) => Buffer.from(typeof o === 'string' ? o : JSON.stringify(o)).toString('base64url')
const sign = (payload) => {
  const h = b64({ alg: 'HS256', typ: 'JWT' }), p = b64(payload)
  return `${h}.${p}.${createHmac('sha256', SECRET).update(`${h}.${p}`).digest('base64url')}`
}
const verify = (tok) => {
  const [h, p, s] = String(tok || '').split('.')
  if (!s || createHmac('sha256', SECRET).update(`${h}.${p}`).digest('base64url') !== s) return null
  const c = JSON.parse(Buffer.from(p, 'base64url').toString())
  return c.exp > Date.now() / 1000 ? c : null
}
const session = (u) => {
  const exp = Math.floor(Date.now() / 1000) + 8 * 3600
  const access_token = sign({ sub: u.id, email: u.email, role: 'authenticated', aud: 'authenticated', exp })
  const user = { id: u.id, aud: 'authenticated', role: 'authenticated', email: u.email, user_metadata: u.raw_user_meta_data || {}, app_metadata: { provider: 'email' }, created_at: u.created_at }
  return { access_token, token_type: 'bearer', expires_in: 8 * 3600, expires_at: exp, refresh_token: sign({ sub: u.id, typ: 'refresh', exp: exp + 7 * 86400 }), user }
}
const send = (res, status, body, headers = {}) => {
  res.writeHead(status, { 'content-type': 'application/json', ...headers }); res.end(body === undefined ? '' : JSON.stringify(body))
}
const readBody = (req) => new Promise((r) => { const c = []; req.on('data', (d) => c.push(d)); req.on('end', () => r(Buffer.concat(c))) })

async function auth(req, res, url) {
  const path = url.pathname.replace('/auth/v1', '')
  if (path === '/token' && req.method === 'POST') {
    const body = JSON.parse((await readBody(req)).toString() || '{}')
    const grant = url.searchParams.get('grant_type')
    let u
    if (grant === 'password') {
      const r = await adminPool.query('select id, email, raw_user_meta_data, created_at from auth.users where lower(email) = lower($1) and encrypted_password = crypt($2, encrypted_password)', [body.email, body.password])
      u = r.rows[0]
      if (!u) return send(res, 400, { error: 'invalid_grant', error_description: 'Invalid login credentials', msg: 'Invalid login credentials' })
    } else if (grant === 'refresh_token') {
      const c = verify(body.refresh_token)
      if (!c || c.typ !== 'refresh') return send(res, 400, { error: 'invalid_grant', error_description: 'Invalid refresh token' })
      u = (await adminPool.query('select id, email, raw_user_meta_data, created_at from auth.users where id = $1', [c.sub])).rows[0]
    }
    return u ? send(res, 200, session(u)) : send(res, 400, { error: 'unsupported_grant_type' })
  }
  if (path === '/user') {
    const c = verify((req.headers.authorization || '').replace(/^Bearer /i, ''))
    if (!c || !c.email) return send(res, 401, { msg: 'invalid JWT' })
    const u = (await adminPool.query('select id, email, raw_user_meta_data, created_at from auth.users where id = $1', [c.sub])).rows[0]
    return u ? send(res, 200, session(u).user) : send(res, 404, { msg: 'user not found' })
  }
  if (path === '/logout') return send(res, 204)
  if (path === '/settings') return send(res, 200, { external: { email: true }, disable_signup: true })
  return send(res, 404, { msg: `auth emulation: ${path} not supported locally` })
}

// Local stand-in for netlify/functions/users-invite.mts: no email locally, so it returns a one-time password.
async function inviteUser(req, res) {
  const c = verify((req.headers.authorization || '').replace(/^Bearer /i, ''))
  if (!c) return send(res, 401, { error: 'Sign in first.' })
  const me = (await adminPool.query('select role, full_name, email from public.profiles where id = $1 and active', [c.sub])).rows[0]
  if (!me || !['owner', 'admin'].includes(me.role)) return send(res, 403, { error: 'Only the owner or an admin can add users.' })
  const b = JSON.parse((await readBody(req)).toString() || '{}')
  const email = String(b.email || '').trim().toLowerCase()
  const role = ['admin', 'manager', 'staff', 'viewer'].includes(b.role) ? b.role : 'staff'
  if (!/^\S+@\S+\.\S+$/.test(email)) return send(res, 400, { error: 'Enter a valid email.' })
  if (role === 'admin' && me.role !== 'owner') return send(res, 403, { error: 'Only the owner can add admins.' })
  if ((await adminPool.query('select 1 from auth.users where lower(email) = $1', [email])).rowCount) return send(res, 409, { error: 'That email already has an account.' })
  const pw = 'Naim-' + randomUUID().slice(0, 6)
  const full = String(b.full_name || '').trim() || null
  const u = (await adminPool.query("insert into auth.users (email, encrypted_password, raw_user_meta_data) values ($1, crypt($2, gen_salt('bf')), $3) returning id", [email, pw, { full_name: full }])).rows[0]
  await adminPool.query('update public.profiles set role = $2, full_name = coalesce($3, full_name), phone = $4 where id = $1', [u.id, role, full, b.phone || null])
  await adminPool.query("insert into public.activities (actor_kind, actor_name, verb, entity_type, entity_id, summary, metadata) values ('human', $1, 'role_changed', 'profile', $2, $3, $4)", [me.full_name || me.email, u.id, `Added ${full || email} as ${role}`, { email, role }])
  return send(res, 200, { ok: true, id: u.id, temp_password: pw })
}

async function rest(req, res, url) {
  const headers = { ...req.headers }
  delete headers.host; delete headers.apikey
  const auth = (headers.authorization || '').replace(/^Bearer /i, '')
  if (!verify(auth)) delete headers.authorization // anon key / expired → anon role
  const body = ['GET', 'HEAD'].includes(req.method) ? undefined : await readBody(req)
  const r = await fetch(PGRST + url.pathname.replace('/rest/v1', '') + url.search, { method: req.method, headers, body })
  const out = Buffer.from(await r.arrayBuffer())
  const h = {}; r.headers.forEach((v, k) => { if (!['content-encoding', 'transfer-encoding', 'connection'].includes(k)) h[k] = v })
  res.writeHead(r.status, h); res.end(out)
}

const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.ico': 'image/x-icon', '.json': 'application/json', '.woff2': 'font/woff2', '.webmanifest': 'application/manifest+json' }
function stat(req, res, url) {
  let p = normalize(decodeURIComponent(url.pathname)).replace(/^(\.\.[/\\])+/, '')
  let f = join(DIST, p)
  if (!f.startsWith(DIST) || !existsSync(f) || statSync(f).isDirectory()) f = join(DIST, 'index.html')
  if (!existsSync(f)) return send(res, 503, { error: 'office-app not built yet' })
  const hashed = /\/assets\/.+-[A-Za-z0-9_-]{8,}\./.test(f)
  res.writeHead(200, { 'content-type': MIME[extname(f)] || 'application/octet-stream', 'cache-control': hashed ? 'public, max-age=31536000, immutable' : 'no-store' })
  res.end(readFileSync(f))
}

let ready = false
async function probe() {
  try { await pool.query('select 1'); const r = await fetch(PGRST + '/'); ready = r.ok && existsSync(join(DIST, 'index.html')) } catch { ready = false }
  if (!ready) setTimeout(probe, 500)
}
probe()

http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://local')
  try {
    if (url.pathname === '/readyz') return send(res, ready ? 204 : 503)
    if (url.pathname.startsWith('/auth/v1')) return await auth(req, res, url)
    if (url.pathname.startsWith('/rest/v1')) return await rest(req, res, url)
    if (url.pathname === '/api/users/invite' && req.method === 'POST') return await inviteUser(req, res)
    if (url.pathname.startsWith('/realtime/v1')) return send(res, 404, { msg: 'realtime not emulated locally; app polls instead' })
    return stat(req, res, url)
  } catch (e) {
    console.error(e); send(res, 502, { error: String(e?.message || e) })
  }
}).listen(PORT, () => console.log(`NAIM COMMAND local preview on :${PORT} (request id ${randomUUID().slice(0, 8)})`))