# Hermes fleet

Five bots run the growth and money engine. They work from the same Supabase database as the office app, so everything they do shows up in the app: run log, activity feed, tasks and notifications.

| Bot | Default schedule (EAT) | Job |
|---|---|---|
| Scout | 05:00 daily | Source agencies from `sources/*.csv` and from Google Places (`GOOGLE_PLACES_API_KEY`). Deduplicates by name and phone. |
| Sage | 05:30 daily | Research, write the dossier and personalisation, score 0–100. Uses an LLM via `LLM_API_KEY` (OpenRouter by default), with a transparent heuristic fallback. |
| Herald | hourly 09–16, Mon–Sat | Draft outreach for leads at or above the threshold, then send approved messages via Resend email or the WhatsApp Cloud API. |
| Echo | every 15 min | Read replies over IMAP, classify intent, create "book a call" tasks, queue follow-ups. |
| Ledger | 07:00 and 18:00 | Mark and chase overdue invoices in the morning. Send the daily summary to Telegram in the evening. |

Before acting, every bot checks the rules in *Hermes Fleet → Rules*:
- kill switch
- minimum score
- daily send limit
- send window
- approval mode (default: founder approves)

If a provider key is missing, the run is logged as **skipped** with the reason. Nothing is faked.

## Run it
```bash
sudo mkdir -p /opt/naim && sudo cp -r mcp-server /opt/naim/ && cd /opt/naim/mcp-server
uv venv .venv && VIRTUAL_ENV=.venv uv pip install -r requirements.txt
cp .env.example .env    # fill SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY and the providers you want
sudo cp systemd/*.service /etc/systemd/system/ && sudo systemctl enable --now naim-hermes naim-telegram
```
- `runner.py` executes the buttons pressed in the app (via the `automation_commands` table) and the cron schedules (`hermes_bots.schedule`).
- `python runner.py --once` processes pending commands once and exits.

## Hermes Agent / any MCP client
- `server.py` is a FastMCP server with these tools:
  - `get_status`, `get_funnel`, `list_leads`, `get_lead`, `add_leads`, `update_lead`
  - `run_bot`, `preview_outreach_queue`, `approve_and_send`, `set_kill_switch`, `set_min_score`
  - `book_call`, `convert_lead`, `overdue_invoices`, `record_payment`, `daily_summary`
- Copy `config.yaml` to `~/.hermes/config.yaml` and `SOUL.md` to `~/.hermes/SOUL.md`.
- Claude Desktop, Cursor and Claude Code can use the same server over stdio. To serve it over HTTP instead, set `MCP_TRANSPORT=http`.

## Telegram cockpit
1. Create a bot with @BotFather.
2. Put `TELEGRAM_BOT_TOKEN` and your `TELEGRAM_CHAT_ID` in `.env`.
3. Commands: `/status`, `/funnel`, `/pause`, `/resume`, `/enrich`, `/approve`, `/overdue`, `/summary`.
4. Only your chat ID is obeyed.