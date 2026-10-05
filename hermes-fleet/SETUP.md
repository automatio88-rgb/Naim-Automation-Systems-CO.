# Hermes fleet: setup

About 30 minutes. Do the root README steps 1–2 (Supabase and Netlify) first.

## 1. A small server
- Any Ubuntu VPS with 1 vCPU and 1 GB of RAM is enough.
- Install Python 3.12+ and `uv`.

```bash
sudo mkdir -p /opt/naim && sudo chown $USER /opt/naim
git clone https://github.com/automatio88-rgb/Naim-Automation-Systems-CO. /opt/naim/repo
cp -r /opt/naim/repo/mcp-server /opt/naim/ && cd /opt/naim/mcp-server
uv venv .venv && VIRTUAL_ENV=.venv uv pip install -r requirements.txt
cp .env.example .env
```

## 2. Keys (`/opt/naim/mcp-server/.env`)

| Key | Needed for | Where to get it |
|---|---|---|
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | everything | Supabase → Project Settings → API (service role, keep it secret) |
| `LLM_API_KEY` (+ optional `LLM_MODEL`) | Sage dossiers and scores | openrouter.ai → Keys |
| `RESEND_API_KEY`, `OUTREACH_FROM` | Herald email | resend.com (verify your domain) |
| `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_ID` | Herald WhatsApp | Meta for Developers → WhatsApp → API setup |
| `IMAP_HOST`, `IMAP_USER`, `IMAP_PASSWORD` | Echo inbox polling | your mailbox (use an app password) |
| `GOOGLE_PLACES_API_KEY` | Scout sourcing | Google Cloud → Places API |
| `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` | briefing and cockpit | @BotFather, then message @userinfobot for your chat ID |

- Start with `HERMES_DRY_RUN=1`. Every routine runs and logs, but nothing is sent.
- Remove it when you are happy.

## 3. Start the services
```bash
sudo cp systemd/*.service /etc/systemd/system/
sudo systemctl enable --now naim-hermes naim-telegram
journalctl -u naim-hermes -f
```
- In the app, open **Hermes Fleet**. All 5 bots should show a fresh heartbeat within a minute.
- Press **Run → Enrichment**. A run appears in the log within about 20 seconds.

## 4. Hermes Agent (the conversational layer)
```bash
cp /opt/naim/repo/hermes-fleet/config.yaml ~/.hermes/config.yaml   # set the paths and keys
cp /opt/naim/repo/hermes-fleet/SOUL.md ~/.hermes/SOUL.md
mkdir -p ~/.hermes/souls && cp /opt/naim/repo/hermes-fleet/souls/*.md ~/.hermes/souls/
```
- Hermes now has the 68 `naim-command` MCP tools. Ask it "How are we doing?" or "Move Jamii HR to proposal".
- Claude Desktop, Claude Code and Cursor can use the same server. Add it as a stdio MCP server: `python /opt/naim/mcp-server/server.py`.

## 5. Inbound webhooks
They are hosted by the office-app Netlify site. Set each env var in Netlify, then point the provider at the URL.

| Provider | URL | Env vars |
|---|---|---|
| WhatsApp Cloud API | `https://<office-site>/api/webhooks/whatsapp` | `WHATSAPP_VERIFY_TOKEN`, `WHATSAPP_APP_SECRET` |
| M-Pesa Daraja (C2B confirmation / STK callback) | `https://<office-site>/api/webhooks/mpesa?token=<MPESA_WEBHOOK_TOKEN>` (STK: add `&ref=<invoice no>`) | `MPESA_WEBHOOK_TOKEN` |
| Cal.com | `https://<office-site>/api/webhooks/booking` | `CAL_WEBHOOK_SECRET` |
| Inbound email (Resend / Postmark) | `https://<office-site>/api/webhooks/email` with header `X-Webhook-Token` | `INBOUND_EMAIL_TOKEN` |

All four also need `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` on the office-app site. They are server-side only and never reach the browser.

## 6. Check it
- `bash scripts/local-test.sh` runs the 5 routines in dry run.
- `python scripts/test-tools.py` exercises all MCP tools.
- `node netlify/test-webhooks.mts` (in `office-app/`) tests the 4 webhooks.