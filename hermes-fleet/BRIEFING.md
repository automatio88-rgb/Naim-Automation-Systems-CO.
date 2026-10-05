# Morning briefing spec

Ledger sends this to the founder at **07:00 EAT** every day:
- to Telegram, when `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` are set
- always as an in-app notification

You can also trigger it from:
- the app (Hermes Fleet → Run → Morning briefing)
- Telegram: `/briefing`
- MCP: `morning_briefing(send=true)`
- the command `morning_briefing` in `automation_commands`

## Content, in this order (empty sections are left out)
1. **Header:** `NAIM morning briefing · Mon 05 Oct 2026`
2. **Money:** KES collected yesterday, MRR, total overdue.
3. **Today:** every appointment today (time in EAT and title), up to 6.
4. **Hot replies:** replies from the last 24 hours with intent `interested` (agency and the first 80 characters), up to 4.
5. **Due today:** open tasks due by end of today (priority and title), up to 5.
6. **Chase:** the top 3 overdue invoices by amount (number, client, KES, ageing bucket).
7. **Renewals this week:** active subscriptions due in the next 7 days.
8. **Needs you:**
   - outreach drafts waiting for approval
   - kill switch on
   - any bot run that failed in the last 24 hours

## Rules
- Plain text, no emojis, no more than about 25 lines. Every number is read from the database, never estimated.
- Amounts in KES with thousands separators. Times in Africa/Nairobi.
- If the database cannot be reached, send a one-line failure notice, and the run is logged as `failed`.

## Source
`Fleet.briefing_data()` and `Fleet.ledger_briefing()` in `mcp-server/fleet.py`.