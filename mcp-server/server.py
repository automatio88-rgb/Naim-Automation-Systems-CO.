"""NAIM COMMAND MCP server (FastMCP). Gives Hermes Agent (or Claude, Cursor, any MCP client)
the same powers the office app has: read the funnel, work leads, run the five bots, chase money.

  stdio:  python server.py
  http:   MCP_TRANSPORT=http MCP_PORT=8765 python server.py
"""
from __future__ import annotations

import datetime as dt
import os

from fastmcp import FastMCP

from fleet import COMMANDS, Fleet, iso

mcp = FastMCP("naim-command")
_f: Fleet | None = None


def F() -> Fleet:
    global _f
    _f = _f or Fleet()
    return _f


@mcp.tool
def get_status() -> dict:
    """Fleet health, kill switch, and today's numbers (cash collected, new leads, calls, overdue, MRR)."""
    f = F()
    return {"settings": f.settings(), "bots": f.db.select("hermes_bots", select="name,display_name,enabled,status,last_heartbeat,schedule"), "today": f.summary_numbers()}


@mcp.tool
def get_funnel() -> list[dict]:
    """Lead funnel counts by stage (new, enriched, queued, sent, replied, booked, converted)."""
    return F().db.select("v_lead_funnel")


@mcp.tool
def list_leads(status: str | None = None, min_score: int | None = None, quality: str | None = None, limit: int = 25) -> list[dict]:
    """List leads, newest first. status: new|enriched|queued|sent|replied|booked|converted|dead. quality: high|medium|low."""
    p = {"select": "id,business_name,contact_name,phone,email,location,score,quality,status,last_contacted_at", "deleted_at": "is.null", "order": "created_at.desc", "limit": limit}
    if status: p["status"] = f"eq.{status}"
    if min_score is not None: p["score"] = f"gte.{min_score}"
    if quality: p["quality"] = f"eq.{quality}"
    return F().db.select("leads", **p)


@mcp.tool
def get_lead(lead_id: str) -> dict:
    """Full lead with dossier, outreach history and replies."""
    f = F()
    return {"lead": f.db.one("leads", id=f"eq.{lead_id}"), "outreach": f.db.select("outreach_messages", lead_id=f"eq.{lead_id}", order="step.asc"),
            "replies": f.db.select("replies", lead_id=f"eq.{lead_id}", order="received_at.desc")}


@mcp.tool
def add_leads(leads: list[dict]) -> dict:
    """Insert new leads. Each: business_name (required), contact_name, phone, email, website, location, licence_no, company_size, main_challenge."""
    rows = [{**{k: l.get(k) for k in ["business_name", "contact_name", "phone", "email", "website", "location", "licence_no", "company_size", "main_challenge"]}, "source": l.get("source", "hermes"), "status": "new", "scraped_at": iso()} for l in leads if l.get("business_name")]
    out = F().db.insert("leads", rows) if rows else []
    if out: F().activity("scout", "lead_created", f"Hermes added {len(out)} leads")
    return {"inserted": len(out)}


@mcp.tool
def update_lead(lead_id: str, status: str | None = None, score: int | None = None, dossier: str | None = None) -> dict:
    """Change a lead's status, score, or dossier."""
    patch = {k: v for k, v in {"status": status, "score": score, "dossier": dossier}.items() if v is not None}
    return F().db.update("leads", patch, id=f"eq.{lead_id}")[0]


@mcp.tool
def run_bot(command: str, payload: dict | None = None) -> dict:
    """Run a fleet routine now. command: run_sourcing | run_enrichment | enrich_lead{lead_id} | queue_outreach{threshold} | send_outreach{lead_ids} | check_replies | chase_overdue | daily_summary."""
    if command not in COMMANDS:
        return {"error": f"unknown command, use one of {list(COMMANDS)}"}
    bot, routine, fn = COMMANDS[command]
    f = F()
    return f.run(bot, routine, lambda: fn(f, payload or {}))


@mcp.tool
def preview_outreach_queue(limit: int = 20) -> list[dict]:
    """Drafted outreach waiting for approval (status queued) with lead name and score."""
    return F().db.select("outreach_messages", select="id,step,channel,subject,body,status,leads(business_name,score)", status="eq.queued", order="created_at.asc", limit=limit)


@mcp.tool
def approve_and_send(lead_ids: list[str] | None = None) -> dict:
    """Founder approval: approve queued drafts (for the given leads, or all queued) and send within limits."""
    f = F()
    if not lead_ids:
        lead_ids = list({m["lead_id"] for m in f.db.select("outreach_messages", select="lead_id", status="eq.queued", limit=500)})
    return f.run("herald", "outreach", lambda: f.herald_send(lead_ids))


@mcp.tool
def set_kill_switch(paused: bool) -> dict:
    """Pause (true) or resume (false) ALL outreach immediately."""
    f = F(); f.set_setting("outreach_paused", paused)
    f.activity("herald", "hermes_command", "Kill switch ON: all outreach stopped" if paused else "Outreach resumed")
    return {"outreach_paused": paused}


@mcp.tool
def set_min_score(threshold: int) -> dict:
    """Minimum Sage score a lead needs before Herald drafts outreach."""
    t = max(0, min(100, threshold))
    F().set_setting("min_score_threshold", t)
    return {"min_score_threshold": t}


@mcp.tool
def book_call(lead_id: str, starts_at: str, minutes: int = 30, meet_link: str | None = None) -> dict:
    """Book a discovery call (ISO start time, EAT). Moves the lead to booked and opens a discovery deal."""
    f = F(); l = f.db.one("leads", id=f"eq.{lead_id}")
    s = dt.datetime.fromisoformat(starts_at)
    a = f.db.insert("appointments", {"lead_id": lead_id, "title": f"Discovery call · {l['business_name']}", "type": "discovery_call", "starts_at": s.isoformat(), "ends_at": (s + dt.timedelta(minutes=minutes)).isoformat(), "meet_link": meet_link, "status": "booked", "source": "hermes"})[0]
    f.db.update("leads", {"status": "booked"}, id=f"eq.{lead_id}")
    f.db.insert("deals", {"lead_id": lead_id, "title": l["business_name"], "stage": "discovery", "value_kes": 0, "probability": 20})
    f.activity("echo", "call_booked", f"Booked a discovery call with {l['business_name']}", "lead", lead_id)
    return a


@mcp.tool
def convert_lead(lead_id: str) -> dict:
    """Convert a lead into a client (creates the client record, links deals)."""
    return {"client_id": F().db.rpc("convert_lead", {"p_lead": lead_id})}


@mcp.tool
def overdue_invoices() -> list[dict]:
    """Invoices past due with outstanding balance."""
    return F().db.select("v_receivables_ageing", outstanding_kes="gt.0", bucket="neq.current", order="outstanding_kes.desc")


@mcp.tool
def record_payment(invoice_id: str, amount_kes: float, method: str = "mpesa", reference: str | None = None) -> dict:
    """Record a payment (method mpesa|bank|cash|card). Invoice status and paid amount update automatically."""
    f = F(); p = f.db.insert("payments", {"invoice_id": invoice_id, "amount_kes": amount_kes, "method": method, "reference": reference, "paid_at": iso()})[0]
    f.activity("ledger", "payment_received", f"Payment KES {amount_kes:,.0f} via {method} recorded", "invoice", invoice_id)
    return p


@mcp.tool
def daily_summary() -> dict:
    """Today's numbers (cash, leads, calls, overdue, MRR, funnel)."""
    return F().summary_numbers()


@mcp.tool
def morning_briefing(send: bool = False) -> dict:
    """The founder's 07:00 briefing (money, today's calls, hot replies, tasks due, chase list, renewals, what needs approval).
    send=false returns the text only; send=true runs Ledger's routine (notification + Telegram)."""
    f = F()
    if send:
        return f.run("ledger", "morning_briefing", f.ledger_briefing)
    return f.briefing_data()


import crm_tools  # noqa: E402  full Part 5.4 surface: clients, deals, projects, invoices, appointments, tasks, docs, stats, automation

crm_tools.register(mcp, F)


if __name__ == "__main__":
    if os.environ.get("MCP_TRANSPORT") == "http":
        mcp.run(transport="http", host=os.environ.get("MCP_HOST", "127.0.0.1"), port=int(os.environ.get("MCP_PORT", "8765")))
    else:
        mcp.run()