"""Telegram cockpit: run the fleet from your phone. Only TELEGRAM_CHAT_ID is obeyed.

  /status /funnel /pause /resume /enrich /approve /overdue /summary
"""
from __future__ import annotations

import os
import time

import httpx

from fleet import Fleet, telegram_send


def handle(f: Fleet, cmd: str) -> str:
    if cmd == "/status":
        n = f.summary_numbers(); s = f.settings()
        bots = " · ".join(f"{b['name']}:{'off' if not b['enabled'] else b['status']}" for b in f.db.select("hermes_bots"))
        return f"Outreach {'PAUSED' if s.get('outreach_paused') else 'on'} · threshold {s.get('min_score_threshold')}\n{bots}\nToday KES {n['collected_today_kes']:,.0f} · leads {n['new_leads_today']} · calls {n['calls_today']} · overdue {n['overdue_invoices']}"
    if cmd == "/funnel":
        out, prev = [], None
        for r in f.db.select("v_lead_funnel"):
            c = r.get("count") or r.get("n") or 0
            out.append(f"{r.get('status')}: {c}" + (f" ({round(100 * c / prev)}%)" if prev else ""))
            prev = c or None
        return "\n".join(out)
    if cmd in ("/pause", "/resume"):
        f.set_setting("outreach_paused", cmd == "/pause"); return "All outreach stopped." if cmd == "/pause" else "Outreach resumed."
    if cmd == "/enrich":
        return f.run("sage", "enrichment", lambda: f.sage_enrich())["summary"]
    if cmd == "/approve":
        ids = list({m["lead_id"] for m in f.db.select("outreach_messages", select="lead_id", status="eq.queued", limit=500)})
        return f.run("herald", "outreach", lambda: f.herald_send(ids))["summary"]
    if cmd == "/overdue":
        return f.run("ledger", "chase_overdue", lambda: f.ledger_overdue())["summary"]
    if cmd == "/summary":
        return f.ledger_summary()[1]
    return "Commands: /status /funnel /pause /resume /enrich /approve /overdue /summary"


def main() -> None:
    tok, chat = os.environ["TELEGRAM_BOT_TOKEN"], str(os.environ["TELEGRAM_CHAT_ID"])
    f, offset = Fleet(), 0
    telegram_send("NAIM cockpit online. /status")
    while True:
        try:
            r = httpx.get(f"https://api.telegram.org/bot{tok}/getUpdates", params={"timeout": 50, "offset": offset}, timeout=60).json()
            for u in r.get("result", []):
                offset = u["update_id"] + 1
                m = u.get("message") or {}
                if str((m.get("chat") or {}).get("id")) != chat or not (m.get("text") or "").startswith("/"):
                    continue
                telegram_send(handle(f, m["text"].split()[0].split("@")[0].lower()))
        except Exception as e:  # noqa: BLE001
            print("telegram error", e); time.sleep(5)


if __name__ == "__main__":
    main()