"""Hermes fleet: the five bots that run NAIM's growth and money engine.

  scout   sources new licensed agencies (CSV drops + optional Google Places)
  sage    researches, writes the dossier + personalization, scores 0-100
  herald  drafts and sends outreach (email via Resend, WhatsApp Cloud API)
  echo    reads replies (IMAP), classifies intent, books follow-ups
  ledger  chases overdue invoices and sends the daily summary

Every routine reads automation_settings first (kill switch, threshold, limits,
send window, approval mode) and logs to automation_runs + activities, so the
office app shows exactly what the fleet did. Nothing is invented: when a
provider is not configured the run is logged as skipped (or as a clearly
labelled dry run when HERMES_DRY_RUN=1).
"""
from __future__ import annotations

import csv
import datetime as dt
import email
import imaplib
import json
import os
import re
from email.utils import parseaddr
from pathlib import Path
from zoneinfo import ZoneInfo

import httpx

from naim_db import DB

TZ = ZoneInfo("Africa/Nairobi")
DRY_RUN = os.environ.get("HERMES_DRY_RUN") == "1"
SOURCES = Path(os.environ.get("SCOUT_SOURCES_DIR", Path(__file__).resolve().parent.parent / "hermes-fleet" / "sources"))
BOT_NAMES = {"scout": "Scout", "sage": "Sage", "herald": "Herald", "echo": "Echo", "ledger": "Ledger"}


def now() -> dt.datetime:
    return dt.datetime.now(TZ)


def iso(t: dt.datetime | None = None) -> str:
    return (t or now()).isoformat()


class Fleet:
    def __init__(self, db: DB | None = None):
        self.db = db or DB()

    # ---------- shared ----------
    def settings(self) -> dict:
        return {r["key"]: r["value"] for r in self.db.select("automation_settings", select="key,value")}

    def set_setting(self, key: str, value) -> None:
        self.db.upsert("automation_settings", {"key": key, "value": value, "updated_at": iso()})

    def company(self) -> dict:
        r = self.db.one("app_settings", key="eq.company", select="value")
        return (r or {}).get("value") or {}

    def activity(self, bot: str, verb: str, summary: str, entity_type: str | None = None, entity_id: str | None = None, metadata: dict | None = None):
        self.db.insert("activities", {"actor_kind": "bot", "actor_name": f"Hermes · {BOT_NAMES.get(bot, bot)}", "verb": verb, "summary": summary,
                                      "entity_type": entity_type, "entity_id": entity_id, "metadata": metadata or {}})

    def notify(self, title: str, body: str, type_: str = "info", entity_type: str | None = None, entity_id: str | None = None):
        self.db.insert("notifications", {"type": type_, "title": title, "body": body, "entity_type": entity_type, "entity_id": entity_id})

    def heartbeat(self, bot: str, status: str = "idle"):
        self.db.update("hermes_bots", {"status": status, "last_heartbeat": iso()}, name=f"eq.{bot}")

    def run(self, bot: str, routine: str, fn, command_id: str | None = None) -> dict:
        """Execute a routine with run logging. fn returns (status, summary, stats)."""
        row = self.db.insert("automation_runs", {"bot_name": bot, "routine": routine, "command_id": command_id, "status": "running"})[0]
        self.heartbeat(bot, "running")
        try:
            status, summary, stats = fn()
            if DRY_RUN and stats.get("dry_run"):
                summary = f"[dry run] {summary}"
        except Exception as e:  # noqa: BLE001
            status, summary, stats = "failed", f"{type(e).__name__}: {e}"[:500], {}
        self.db.update("automation_runs", {"status": status, "summary": summary, "stats": stats, "finished_at": iso()}, id=f"eq.{row['id']}")
        self.heartbeat(bot, "error" if status == "failed" else "idle")
        return {"status": status, "summary": summary, "stats": stats}

    # ---------- LLM (optional, OpenAI-compatible) ----------
    def llm_json(self, system: str, user: str) -> dict | None:
        key = os.environ.get("LLM_API_KEY")
        if not key:
            return None
        base = os.environ.get("LLM_BASE_URL", "https://openrouter.ai/api/v1").rstrip("/")
        r = httpx.post(f"{base}/chat/completions", timeout=90, headers={"Authorization": f"Bearer {key}"}, json={
            "model": os.environ.get("LLM_MODEL", "nousresearch/hermes-4-70b"), "response_format": {"type": "json_object"},
            "messages": [{"role": "system", "content": system}, {"role": "user", "content": user}]})
        r.raise_for_status()
        txt = r.json()["choices"][0]["message"]["content"]
        m = re.search(r"\{.*\}", txt, re.S)
        return json.loads(m.group(0)) if m else None

    # ---------- SCOUT ----------
    def scout_source(self, target: int = 25) -> tuple[str, str, dict]:
        existing = self.db.select("leads", select="business_name,phone", limit=20000)
        seen = {(r["business_name"] or "").strip().lower() for r in existing} | {re.sub(r"\D", "", r["phone"] or "") for r in existing if r.get("phone")}
        found, rows = 0, []
        for f in sorted(SOURCES.glob("*.csv")) if SOURCES.exists() else []:
            demo = f.name.startswith("sample")
            for r in csv.DictReader(f.open(encoding="utf-8")):
                found += 1
                name, phone = (r.get("business_name") or "").strip(), re.sub(r"\D", "", r.get("phone") or "")
                if not name or name.lower() in seen or (phone and phone in seen):
                    continue
                seen |= {name.lower(), phone}
                rows.append({"business_name": name, "contact_name": r.get("contact_name") or None, "phone": r.get("phone") or None, "email": r.get("email") or None,
                             "website": r.get("website") or None, "location": r.get("location") or None, "licence_no": r.get("licence_no") or None,
                             "company_size": r.get("company_size") or None, "main_challenge": r.get("main_challenge") or None,
                             "source": "scout_csv", "status": "new", "scraped_at": iso(), "is_demo": demo})
        gkey = os.environ.get("GOOGLE_PLACES_API_KEY")
        if gkey and len(rows) < target:
            bot = self.db.one("hermes_bots", name="eq.scout", select="config") or {}
            for q in (bot.get("config") or {}).get("queries", ["recruitment agency Nairobi", "employment agency Mombasa", "recruitment agency Kisumu"]):
                r = httpx.post("https://places.googleapis.com/v1/places:searchText", timeout=30, json={"textQuery": q, "regionCode": "KE"},
                               headers={"X-Goog-Api-Key": gkey, "X-Goog-FieldMask": "places.displayName,places.formattedAddress,places.nationalPhoneNumber,places.websiteUri"})
                r.raise_for_status()
                for p in r.json().get("places", []):
                    found += 1
                    name = (p.get("displayName") or {}).get("text", "").strip()
                    phone = re.sub(r"\D", "", p.get("nationalPhoneNumber") or "")
                    if not name or name.lower() in seen or (phone and phone in seen):
                        continue
                    seen |= {name.lower(), phone}
                    rows.append({"business_name": name, "phone": p.get("nationalPhoneNumber"), "website": p.get("websiteUri"), "location": p.get("formattedAddress"),
                                 "source": "scout_places", "status": "new", "scraped_at": iso()})
        rows = rows[:target]
        if rows:
            self.db.insert("leads", rows)
            self.activity("scout", "lead_created", f"Scout sourced {len(rows)} new agencies ({found - len(rows)} duplicates or extra skipped)")
        if not found:
            return "skipped", "No sources configured. Drop CSVs into hermes-fleet/sources/ or set GOOGLE_PLACES_API_KEY.", {"found": 0}
        return "success", f"Sourced {len(rows)} new agencies, {found - len(rows)} duplicates skipped.", {"found": found, "inserted": len(rows), "duplicates": found - len(rows)}

    # ---------- SAGE ----------
    @staticmethod
    def heuristic_score(l: dict) -> int:
        s = 20
        s += 15 if l.get("email") else 0
        s += 10 if l.get("phone") else 0
        s += 10 if l.get("website") else 0
        s += 10 if l.get("licence_no") else 0
        s += 10 if l.get("contact_name") else 0
        s += 15 if l.get("main_challenge") else 0
        size = (l.get("company_size") or "").lower()
        s += 10 if any(x in size for x in ["16", "30", "50", "+"]) else 5 if size else 0
        return max(0, min(100, s))

    def enrich_one(self, l: dict) -> dict:
        prompt = json.dumps({k: l.get(k) for k in ["business_name", "contact_name", "location", "website", "licence_no", "company_size", "main_challenge", "source"]})
        out = self.llm_json(
            "You are Sage, the research bot for Naim Automation Systems Co. (Nairobi). We build operations systems (candidate databases, document "
            "tracking, WhatsApp bots, booking, invoicing) for Kenyan recruitment agencies sending workers to the Gulf. Given a lead, return JSON: "
            '{"dossier": "3-4 factual sentences, no invented facts, say unknown when unknown", "personalization": ["2-3 short opening lines"], '
            '"score": 0-100 fit score, "tags": ["short tags"]}. Never use emojis.', prompt)
        if out:
            score = int(out.get("score", 50))
            dossier, pers, tags, how = out.get("dossier"), out.get("personalization") or [], out.get("tags") or [], "llm"
        else:
            score = self.heuristic_score(l)
            bits = [f"{l['business_name']} is a recruitment agency" + (f" in {l['location']}" if l.get("location") else "") + "."]
            if l.get("licence_no"): bits.append(f"Licence on record: {l['licence_no']}.")
            if l.get("company_size"): bits.append(f"Team size {l['company_size']}.")
            if l.get("main_challenge"): bits.append(f"Stated challenge: {l['main_challenge']}.")
            dossier, how = " ".join(bits), "heuristic"
            pers = [f"Saw that {l['business_name']} is growing its placements" + (f" out of {l['location'].split(',')[0]}" if l.get("location") else "") + "."]
            if l.get("main_challenge"): pers.append(f"You mentioned {l['main_challenge'].lower().rstrip('.')}; that is exactly what we fix.")
            tags = [t for t in [l.get("source"), "licensed" if l.get("licence_no") else None] if t]
        quality = "high" if score >= 75 else "medium" if score >= 50 else "low"
        self.db.update("leads", {"dossier": dossier, "personalization": pers, "score": score, "quality": quality, "tags": tags, "status": "enriched" if l["status"] == "new" else l["status"], "enriched_at": iso()}, id=f"eq.{l['id']}")
        self.activity("sage", "lead_enriched", f"Sage enriched {l['business_name']}: score {score} ({quality})", "lead", l["id"], {"method": how})
        return {"score": score, "quality": quality, "method": how}

    def sage_enrich(self, limit: int = 40, lead_id: str | None = None) -> tuple[str, str, dict]:
        leads = self.db.select("leads", id=f"eq.{lead_id}") if lead_id else self.db.select("leads", status="eq.new", deleted_at="is.null", order="created_at.asc", limit=limit)
        if not leads:
            return "skipped", "No leads waiting for enrichment.", {"enriched": 0}
        res = [self.enrich_one(l) for l in leads]
        high = sum(1 for r in res if r["quality"] == "high")
        return "success", f"Enriched {len(res)} leads. {high} scored HIGH.", {"enriched": len(res), "high": high, "llm": sum(r["method"] == "llm" for r in res)}

    # ---------- HERALD ----------
    def _draft(self, l: dict, step: int = 1) -> dict:
        camp = self.db.one("campaigns", status="eq.active", order="created_at.asc") or {}
        steps = camp.get("steps") or [{"step": 1, "subject": "{{agency}}: admin chaos to clean systems"}]
        st = next((s for s in steps if s.get("step") == step), steps[-1])
        co = self.company()
        first = (l.get("contact_name") or "there").split()[0]
        pers = (l.get("personalization") or [""])[0]
        body = {1: f"Hi {first},\n\n{pers}\n\nWe build one system for recruitment agencies: candidates, passports, medicals, visas, employer follow-ups and invoices, with a WhatsApp bot that answers candidates for you. Agencies like yours stop chasing paper within weeks.\n\nWould a 20-minute call this week be useful?",
                2: f"Hi {first},\n\nQuick idea for {l['business_name']}: a candidate tracker that sends you a WhatsApp alert the moment a medical or visa status changes. Happy to show you a live demo.",
                3: f"Hi {first},\n\nShould I close the loop on this? If now is not the right time, just say so and I will check back next quarter."}[min(step, 3)]
        body += f"\n\n{co.get('founder', 'M.A. Salmin')}\n{co.get('name', 'Naim Automation Systems Co.')}\n{co.get('phone', '')}".rstrip()
        channel = "email" if l.get("email") else "whatsapp"
        return {"lead_id": l["id"], "campaign_id": camp.get("id"), "channel": channel, "step": step, "subject": st.get("subject", "").replace("{{agency}}", l["business_name"]), "body": body, "status": "queued"}

    def queue_outreach(self, threshold: int | None = None, limit: int = 50) -> tuple[str, str, dict]:
        s = self.settings()
        threshold = int(threshold if threshold is not None else s.get("min_score_threshold", 70))
        leads = self.db.select("leads", status="eq.enriched", score=f"gte.{threshold}", deleted_at="is.null", order="score.desc", limit=limit)
        queued = 0
        for l in leads:
            if not (l.get("email") or l.get("phone")):
                continue
            if self.db.select("outreach_messages", lead_id=f"eq.{l['id']}", step="eq.1", select="id"):
                continue
            self.db.insert("outreach_messages", self._draft(l, 1))
            self.db.update("leads", {"status": "queued"}, id=f"eq.{l['id']}")
            queued += 1
        auto = s.get("approval_mode") == "auto"
        if auto:
            self.db.update("outreach_messages", {"status": "approved"}, status="eq.queued")
        return "success", f"Queued {queued} drafts at threshold {threshold}." + (" Auto-approved." if auto else " Waiting for founder approval."), {"queued": queued, "threshold": threshold}

    def _deliver(self, m: dict, l: dict) -> str:
        if m["channel"] == "email" and l.get("email") and os.environ.get("RESEND_API_KEY"):
            r = httpx.post("https://api.resend.com/emails", timeout=30, headers={"Authorization": f"Bearer {os.environ['RESEND_API_KEY']}"},
                           json={"from": os.environ.get("OUTREACH_FROM", "Naim Automation Systems <hello@naimautomations.co.ke>"), "to": [l["email"]], "subject": m["subject"], "text": m["body"]})
            r.raise_for_status(); return "sent"
        if m["channel"] == "whatsapp" and l.get("phone") and os.environ.get("WHATSAPP_TOKEN") and os.environ.get("WHATSAPP_PHONE_ID"):
            to = re.sub(r"\D", "", l["phone"]); to = "254" + to[1:] if to.startswith("0") else to
            r = httpx.post(f"https://graph.facebook.com/v20.0/{os.environ['WHATSAPP_PHONE_ID']}/messages", timeout=30, headers={"Authorization": f"Bearer {os.environ['WHATSAPP_TOKEN']}"},
                           json={"messaging_product": "whatsapp", "to": to, "type": "text", "text": {"body": m["body"]}})
            r.raise_for_status(); return "sent"
        return "dry_run" if DRY_RUN else "no_provider"

    def herald_send(self, lead_ids: list[str] | None = None, threshold: int | None = None) -> tuple[str, str, dict]:
        s = self.settings()
        if s.get("outreach_paused") is True:
            return "skipped", "Kill switch is on. Nothing sent.", {"sent": 0}
        win = s.get("send_window") or {}
        t = now().strftime("%H:%M")
        if not DRY_RUN and not (win.get("start", "09:00") <= t <= win.get("end", "17:00")):
            return "skipped", f"Outside the send window ({win.get('start')}–{win.get('end')} EAT). Approved messages wait for the next window.", {"sent": 0}
        if lead_ids:  # founder approved these leads in the app
            for lid in lead_ids:
                l = self.db.one("leads", id=f"eq.{lid}")
                if l and not self.db.select("outreach_messages", lead_id=f"eq.{lid}", select="id"):
                    self.db.insert("outreach_messages", self._draft(l, 1))
                self.db.update("outreach_messages", {"status": "approved"}, lead_id=f"eq.{lid}", status="eq.queued")
        start = now().replace(hour=0, minute=0, second=0, microsecond=0)
        sent_today = self.db.count("outreach_messages", sent_at=f"gte.{start.isoformat()}")
        budget = max(0, int(s.get("daily_send_limit", 40)) - sent_today)
        msgs = self.db.select("outreach_messages", status="eq.approved", order="created_at.asc", limit=budget) if budget else []
        sent = dry = missing = 0
        for m in msgs:
            l = self.db.one("leads", id=f"eq.{m['lead_id']}")
            if not l:
                continue
            res = self._deliver(m, l)
            if res == "no_provider":
                missing += 1; continue
            self.db.update("outreach_messages", {"status": "sent", "sent_at": iso()}, id=f"eq.{m['id']}")
            self.db.update("leads", {"status": "sent" if l["status"] in ("new", "enriched", "queued") else l["status"], "last_contacted_at": iso()}, id=f"eq.{l['id']}")
            self.activity("herald", "outreach_sent", f"Herald {'(dry run) ' if res == 'dry_run' else ''}sent step {m['step']} {m['channel']} to {l['business_name']}", "lead", l["id"])
            sent += res == "sent"; dry += res == "dry_run"
        if missing and not (sent or dry):
            return "skipped", f"{missing} approved messages waiting: no email (RESEND_API_KEY) or WhatsApp (WHATSAPP_TOKEN) provider configured.", {"waiting": missing}
        return "success", f"Sent {sent + dry} messages ({budget} left in today's limit before sending).", {"sent": sent, "dry_run": dry, "waiting": missing}

    # ---------- ECHO ----------
    @staticmethod
    def classify(text: str) -> tuple[str, str]:
        t = text.lower()
        if any(w in t for w in ["unsubscribe", "stop", "not interested", "remove me"]): return "not_interested", "negative"
        if any(w in t for w in ["call", "meet", "demo", "interested", "yes", "price", "cost", "how much", "available"]): return "interested", "positive"
        if any(w in t for w in ["later", "next month", "not now", "busy"]): return "not_now", "neutral"
        if "?" in t: return "question", "neutral"
        return "unknown", "neutral"

    def echo_check(self) -> tuple[str, str, dict]:
        stats = {"replies": 0, "followups": 0}
        host = os.environ.get("IMAP_HOST")
        if host:
            M = imaplib.IMAP4_SSL(host); M.login(os.environ["IMAP_USER"], os.environ["IMAP_PASSWORD"]); M.select("INBOX")
            _, ids = M.search(None, "UNSEEN")
            for i in ids[0].split()[:100]:
                _, data = M.fetch(i, "(RFC822)")
                msg = email.message_from_bytes(data[0][1]); sender = parseaddr(msg.get("From"))[1].lower()
                l = self.db.one("leads", email=f"ilike.{sender}")
                if not l:
                    continue
                part = next((p for p in msg.walk() if p.get_content_type() == "text/plain"), msg)
                body = (part.get_payload(decode=True) or b"").decode(errors="ignore").split("\nOn ")[0].strip()[:4000]
                intent, sentiment = self.classify(body)
                self.db.insert("replies", {"lead_id": l["id"], "channel": "email", "body": body, "intent": intent, "sentiment": sentiment})
                self.db.update("leads", {"status": "dead" if intent == "not_interested" else "replied"}, id=f"eq.{l['id']}")
                self.db.update("outreach_messages", {"status": "replied"}, lead_id=f"eq.{l['id']}", status="eq.sent")
                self.activity("echo", "reply_received", f"{l['business_name']} replied ({intent.replace('_', ' ')})", "lead", l["id"])
                if intent == "interested":
                    self.db.insert("tasks", {"title": f"Book a call with {l['business_name']}", "description": body[:500], "priority": "high", "entity_type": "lead", "entity_id": l["id"], "created_by_kind": "hermes", "due_at": iso(now() + dt.timedelta(hours=4))})
                    self.notify("Hot reply", f"{l['business_name']} wants to talk", "lead", "lead", l["id"])
                stats["replies"] += 1
            M.logout()
        s = self.settings()
        if s.get("outreach_paused") is not True:  # queue follow-ups for silent leads
            gap = int(s.get("followup_spacing_days", 3))
            cutoff = (now() - dt.timedelta(days=gap)).isoformat()
            for l in self.db.select("leads", status="eq.sent", last_contacted_at=f"lt.{cutoff}", deleted_at="is.null", limit=100):
                done = self.db.select("outreach_messages", lead_id=f"eq.{l['id']}", select="step,status", order="step.desc")
                if not done or done[0]["status"] in ("queued", "approved") or done[0]["step"] >= 3:
                    continue
                self.db.insert("outreach_messages", self._draft(l, done[0]["step"] + 1)); stats["followups"] += 1
        if not host and not stats["followups"]:
            return "skipped", "No inbox connected (set IMAP_HOST/IMAP_USER/IMAP_PASSWORD). No follow-ups due.", stats
        return "success", f"{stats['replies']} new replies, {stats['followups']} follow-ups queued.", stats

    # ---------- LEDGER ----------
    def ledger_overdue(self) -> tuple[str, str, dict]:
        today = now().date().isoformat()
        invs = self.db.select("invoices", select="id,number,total_kes,paid_kes,due_date,status,clients(business_name)", status="in.(sent,partial)", due_date=f"lt.{today}", deleted_at="is.null")
        for i in invs:
            self.db.update("invoices", {"status": "overdue"}, id=f"eq.{i['id']}")
        allod = self.db.select("invoices", select="id,number,total_kes,paid_kes,clients(business_name)", status="eq.overdue", deleted_at="is.null")
        owed = sum(float(i["total_kes"]) - float(i["paid_kes"]) for i in allod)
        for i in invs:
            name = (i.get("clients") or {}).get("business_name") or "client"
            self.db.insert("tasks", {"title": f"Chase {i['number']} ({name})", "priority": "high", "entity_type": "invoice", "entity_id": i["id"], "created_by_kind": "hermes", "due_at": iso()})
            self.activity("ledger", "invoice_overdue", f"{i['number']} for {name} is overdue: KES {float(i['total_kes']) - float(i['paid_kes']):,.0f}", "invoice", i["id"])
        if allod:
            self.notify("Overdue invoices", f"{len(allod)} invoices overdue, KES {owed:,.0f} outstanding", "warning")
        return "success", f"{len(invs)} newly overdue. {len(allod)} overdue in total, KES {owed:,.0f} outstanding.", {"new_overdue": len(invs), "overdue": len(allod), "outstanding_kes": owed}

    def summary_numbers(self) -> dict:
        start = now().replace(hour=0, minute=0, second=0, microsecond=0).isoformat()
        pays = self.db.select("payments", select="amount_kes", paid_at=f"gte.{start}")
        mrr = (self.db.select("v_mrr") or [{}])[0]
        return {"collected_today_kes": sum(float(p["amount_kes"]) for p in pays), "new_leads_today": self.db.count("leads", created_at=f"gte.{start}"),
                "calls_today": self.db.count("appointments", starts_at=f"gte.{start}", status="neq.cancelled"),
                "overdue_invoices": self.db.count("invoices", status="eq.overdue"), "mrr_kes": float(mrr.get("mrr_kes") or 0),
                "funnel": self.db.select("v_lead_funnel")}

    def ledger_summary(self) -> tuple[str, str, dict]:
        n = self.summary_numbers()
        text = (f"NAIM daily summary {now():%a %d %b}\nCollected today: KES {n['collected_today_kes']:,.0f}\nNew leads: {n['new_leads_today']}\n"
                f"Calls today: {n['calls_today']}\nOverdue invoices: {n['overdue_invoices']}\nMRR: KES {n['mrr_kes']:,.0f}")
        self.notify("Daily summary", text)
        sent = telegram_send(text)
        return "success", text.replace("\n", " · "), {**{k: v for k, v in n.items() if k != "funnel"}, "telegram": sent}


def telegram_send(text: str) -> bool:
    tok, chat = os.environ.get("TELEGRAM_BOT_TOKEN"), os.environ.get("TELEGRAM_CHAT_ID")
    if not (tok and chat):
        return False
    httpx.post(f"https://api.telegram.org/bot{tok}/sendMessage", timeout=20, json={"chat_id": chat, "text": text})
    return True


# command name -> (bot, routine, callable(fleet, payload))
COMMANDS = {
    "run_sourcing": ("scout", "sourcing", lambda f, p: f.scout_source(int(p.get("target", 25)))),
    "run_enrichment": ("sage", "enrichment", lambda f, p: f.sage_enrich(int(p.get("limit", 40)))),
    "enrich_lead": ("sage", "enrichment", lambda f, p: f.sage_enrich(lead_id=p["lead_id"])),
    "queue_outreach": ("herald", "queue", lambda f, p: f.queue_outreach(p.get("threshold"))),
    "send_outreach": ("herald", "outreach", lambda f, p: f.herald_send(p.get("lead_ids"), p.get("threshold"))),
    "check_replies": ("echo", "replies", lambda f, p: f.echo_check()),
    "chase_overdue": ("ledger", "chase_overdue", lambda f, p: f.ledger_overdue()),
    "daily_summary": ("ledger", "daily_summary", lambda f, p: f.ledger_summary()),
}

# scheduled routine per bot (cron lives in hermes_bots.schedule)
SCHEDULED = {
    "scout": lambda f, cfg, t: [("sourcing", lambda: f.scout_source(int(cfg.get("daily_target", 25))))],
    "sage": lambda f, cfg, t: [("enrichment", lambda: f.sage_enrich(int(cfg.get("batch", 40))))],
    "herald": lambda f, cfg, t: [("queue", lambda: f.queue_outreach()), ("outreach", lambda: f.herald_send())],
    "echo": lambda f, cfg, t: [("replies", lambda: f.echo_check())],
    "ledger": lambda f, cfg, t: [("chase_overdue", lambda: f.ledger_overdue())] if t.hour < 12 else [("daily_summary", lambda: f.ledger_summary())],
}