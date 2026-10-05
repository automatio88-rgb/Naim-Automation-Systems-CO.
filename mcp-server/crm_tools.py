"""Full MCP tool surface (masterprompt Part 5.4) on top of the core fleet tools in server.py.

Every tool validates its inputs (unknown fields and bad enum values are rejected with a clear
message), returns plain JSON, and writes an `activities` row for every mutation so the app's live
feed and entity timelines show what Hermes did.
"""
from __future__ import annotations

import datetime as dt
from typing import Any, Callable

from fleet import Fleet, iso, now

_F: Callable[[], Fleet] = lambda: Fleet()  # replaced by register()

# ---------- validation ----------
ENUMS = {
    "deal.stage": {"discovery", "consultation", "proposal", "contract", "deposit_paid", "won", "lost"},
    "project.status": {"materials_pending", "in_build", "review", "live_demo", "delivered", "in_care_plan", "on_hold", "cancelled"},
    "subscription.status": {"active", "paused", "past_due", "cancelled", "expired"},
    "subscription.billing_cycle": {"monthly", "quarterly", "yearly"},
    "invoice.type": {"deposit", "balance", "subscription", "one_off", "pos"},
    "invoice.status": {"draft", "sent", "partial", "paid", "overdue", "void"},
    "appointment.status": {"booked", "confirmed", "checked_in", "in_progress", "completed", "no_show", "cancelled"},
    "task.priority": {"low", "medium", "high", "urgent"},
    "task.status": {"todo", "in_progress", "done"},
    "client.tier": {"standard", "gold", "platinum"},
    "command.status": {"acked", "running", "done", "failed", "cancelled"},
    "run.status": {"running", "success", "failed", "skipped"},
}
FIELDS = {
    "client": {"business_name", "contact_name", "phone", "email", "location", "licence_no", "company_size", "tier", "health", "tags", "notes", "birthday", "source", "business_id", "lead_id"},
    "deal": {"client_id", "lead_id", "title", "value_kes", "stage", "probability", "expected_close", "lost_reason", "business_id"},
    "project": {"client_id", "deal_id", "name", "status", "priority", "started_at", "due_at", "delivered_at", "materials_checklist", "progress", "budget_kes", "business_id"},
    "subscription": {"client_id", "plan_id", "amount_kes", "billing_cycle", "status", "started_at", "next_due"},
    "invoice": {"client_id", "deal_id", "project_id", "subscription_id", "type", "line_items", "discount_kes", "tax_kes", "status", "issued_at", "due_date", "notes", "business_id"},
    "appointment": {"client_id", "lead_id", "staff_id", "title", "type", "services", "starts_at", "ends_at", "meet_link", "location", "status", "source", "notes", "business_id"},
    "task": {"title", "description", "priority", "status", "due_at", "entity_type", "entity_id", "assignee_id"},
}
TABLE = {"client": "clients", "deal": "deals", "project": "projects", "subscription": "subscriptions", "invoice": "invoices", "appointment": "appointments", "task": "tasks"}
SOFT_DELETE = {"client", "deal", "project", "invoice", "appointment", "task"}


def _clean(kind: str, fields: dict | None, required: tuple[str, ...] = ()) -> dict:
    fields = {k: v for k, v in (fields or {}).items() if v is not None}
    bad = sorted(set(fields) - FIELDS[kind])
    if bad:
        raise ValueError(f"Unknown {kind} fields {bad}. Allowed: {sorted(FIELDS[kind])}")
    for r in required:
        if not fields.get(r):
            raise ValueError(f"{kind} needs '{r}'")
    for k, v in fields.items():
        allowed = ENUMS.get(f"{kind}.{k}")
        if allowed and v not in allowed:
            raise ValueError(f"{kind}.{k} must be one of {sorted(allowed)}, got {v!r}")
    if "progress" in fields and not 0 <= int(fields["progress"]) <= 100:
        raise ValueError("progress must be 0-100")
    if "health" in fields and not 0 <= int(fields["health"]) <= 100:
        raise ValueError("health must be 0-100")
    return fields


def _enum(name: str, value: str) -> str:
    if value not in ENUMS[name]:
        raise ValueError(f"{name} must be one of {sorted(ENUMS[name])}, got {value!r}")
    return value


def _act(verb: str, summary: str, entity_type: str | None = None, entity_id: str | None = None, metadata: dict | None = None, actor: str = "Hermes") -> None:
    _F().db.insert("activities", {"actor_kind": "bot", "actor_name": actor, "verb": verb, "summary": summary,
                                  "entity_type": entity_type, "entity_id": entity_id, "metadata": metadata or {}})


def _one(kind: str, id_: str) -> dict:
    row = _F().db.one(TABLE[kind], id=f"eq.{id_}")
    if not row:
        raise ValueError(f"No {kind} with id {id_}")
    return row


def _label(kind: str, row: dict) -> str:
    return row.get("business_name") or row.get("title") or row.get("name") or row.get("number") or row["id"][:8]


def _create(kind: str, fields: dict, required: tuple[str, ...]) -> dict:
    row = _F().db.insert(TABLE[kind], _clean(kind, fields, required))[0]
    _act(f"{kind}_created", f"Hermes created {kind} {_label(kind, row)}", kind, row["id"])
    return row


def _update(kind: str, id_: str, fields: dict) -> dict:
    patch = _clean(kind, fields)
    if not patch:
        raise ValueError("Nothing to update")
    _one(kind, id_)
    row = _F().db.update(TABLE[kind], patch, id=f"eq.{id_}")[0]
    _act(f"{kind}_updated", f"Hermes updated {kind} {_label(kind, row)}: {', '.join(sorted(patch))}", kind, id_, {"fields": sorted(patch)})
    return row


def _delete(kind: str, id_: str) -> dict:
    row = _one(kind, id_)
    _F().db.update(TABLE[kind], {"deleted_at": iso()}, id=f"eq.{id_}")
    _act(f"{kind}_deleted", f"Hermes archived {kind} {_label(kind, row)}", kind, id_)
    return {"archived": id_}


def _list(table: str, limit: int, soft: bool = True, **filters: Any) -> list[dict]:
    p = {k: v for k, v in filters.items() if v is not None}
    if soft:
        p["deleted_at"] = "is.null"
    return _F().db.select(table, limit=max(1, min(int(limit), 500)), **p)


def _range(period: str, start: str | None = None, end: str | None = None) -> tuple[dt.datetime, dt.datetime]:
    t = now()
    d0 = t.replace(hour=0, minute=0, second=0, microsecond=0)
    if period == "custom":
        if not (start and end):
            raise ValueError("custom period needs start and end (YYYY-MM-DD)")
        tz = t.tzinfo
        return dt.datetime.fromisoformat(start).replace(tzinfo=tz), dt.datetime.fromisoformat(end).replace(tzinfo=tz) + dt.timedelta(days=1)
    starts = {"today": d0, "week": d0 - dt.timedelta(days=d0.weekday()), "month": d0.replace(day=1),
              "quarter": d0.replace(month=(d0.month - 1) // 3 * 3 + 1, day=1), "year": d0.replace(month=1, day=1)}
    if period not in starts:
        raise ValueError("period must be today|week|month|quarter|year|custom")
    return starts[period], t


def _between(col: str, s: dt.datetime, e: dt.datetime, date_only: bool = False) -> dict:
    a, b = (s.date().isoformat(), e.date().isoformat()) if date_only else (s.isoformat(), e.isoformat())
    op = "lte" if date_only else "lt"
    return {"and": f"({col}.gte.{a},{col}.{op}.{b})"}


def _sum(rows: list[dict], col: str) -> float:
    return round(sum(float(r.get(col) or 0) for r in rows), 2)


# ======================= LEADS (score / queue / disqualify) =======================
def score_lead(lead_id: str, score: int) -> dict:
    """Set a lead's fit score (0-100). Quality follows: >=75 high, >=50 medium, else low."""
    if not 0 <= int(score) <= 100:
        raise ValueError("score must be 0-100")
    q = "high" if score >= 75 else "medium" if score >= 50 else "low"
    row = _F().db.update("leads", {"score": int(score), "quality": q}, id=f"eq.{lead_id}")
    if not row:
        raise ValueError(f"No lead with id {lead_id}")
    _act("lead_scored", f"Hermes scored {row[0]['business_name']} {score} ({q})", "lead", lead_id)
    return row[0]


def queue_lead(lead_id: str) -> dict:
    """Draft step-1 outreach for one lead and move it to queued (respects the kill switch)."""
    f = _F()
    if f.settings().get("outreach_paused"):
        raise ValueError("Outreach is paused (kill switch is on)")
    l = f.db.one("leads", id=f"eq.{lead_id}")
    if not l:
        raise ValueError(f"No lead with id {lead_id}")
    if not (l.get("email") or l.get("phone")):
        raise ValueError("Lead has no email or phone")
    if f.db.select("outreach_messages", lead_id=f"eq.{lead_id}", step="eq.1", select="id"):
        raise ValueError("Lead already has a step-1 draft")
    m = f.db.insert("outreach_messages", f._draft(l, 1))[0]
    f.db.update("leads", {"status": "queued"}, id=f"eq.{lead_id}")
    _act("lead_queued", f"Hermes queued outreach for {l['business_name']}", "lead", lead_id)
    return m


def disqualify_lead(lead_id: str, reason: str) -> dict:
    """Mark a lead dead with a reason (stops all outreach to it)."""
    if not reason.strip():
        raise ValueError("reason is required")
    row = _F().db.update("leads", {"status": "dead"}, id=f"eq.{lead_id}")
    if not row:
        raise ValueError(f"No lead with id {lead_id}")
    _F().db.update("outreach_messages", {"status": "failed"}, lead_id=f"eq.{lead_id}", status="eq.queued")
    _act("lead_disqualified", f"Hermes disqualified {row[0]['business_name']}: {reason}", "lead", lead_id, {"reason": reason})
    return row[0]


# ======================= CLIENTS =======================
def list_clients(search: str | None = None, tier: str | None = None, limit: int = 25) -> list[dict]:
    """List clients (newest first). search matches business or contact name."""
    if tier: _enum("client.tier", tier)
    return _list("clients", limit, select="id,business_name,contact_name,phone,email,location,tier,health,created_at", order="created_at.desc",
                 tier=f"eq.{tier}" if tier else None, **({"or": f"(business_name.ilike.*{search}*,contact_name.ilike.*{search}*)"} if search else {}))


def get_client(client_id: str) -> dict:
    """One client record."""
    return _one("client", client_id)


def create_client(fields: dict) -> dict:
    """Create a client. fields: business_name (required), contact_name, phone, email, location, licence_no, company_size, tier, health, tags, notes, source."""
    return _create("client", fields, ("business_name",))


def update_client(client_id: str, fields: dict) -> dict:
    """Update client fields (same keys as create_client)."""
    return _update("client", client_id, fields)


def delete_client(client_id: str) -> dict:
    """Archive (soft-delete) a client."""
    return _delete("client", client_id)


def client360(client_id: str) -> dict:
    """Everything about a client: deals, projects, invoices + payments, subscriptions, appointments, documents, tasks, timeline."""
    db = _F().db
    c = _one("client", client_id)
    inv = db.select("invoices", client_id=f"eq.{client_id}", deleted_at="is.null", order="issued_at.desc", select="id,number,type,status,total_kes,paid_kes,issued_at,due_date")
    pays = db.select("payments", invoice_id=f"in.({','.join(i['id'] for i in inv)})", order="paid_at.desc") if inv else []
    return {
        "client": c,
        "deals": db.select("deals", client_id=f"eq.{client_id}", deleted_at="is.null", select="id,title,stage,value_kes,expected_close"),
        "projects": db.select("projects", client_id=f"eq.{client_id}", deleted_at="is.null", select="id,name,status,progress,due_at"),
        "invoices": inv, "payments": pays,
        "subscriptions": db.select("subscriptions", client_id=f"eq.{client_id}"),
        "appointments": db.select("appointments", client_id=f"eq.{client_id}", deleted_at="is.null", order="starts_at.desc", limit=20, select="id,title,type,status,starts_at"),
        "documents": db.select("documents", client_id=f"eq.{client_id}", deleted_at="is.null", select="id,name,type,status,signed_at,source"),
        "tasks": db.select("tasks", entity_type="eq.client", entity_id=f"eq.{client_id}", deleted_at="is.null"),
        "timeline": db.select("activities", entity_id=f"eq.{client_id}", order="created_at.desc", limit=30),
        "totals": {"invoiced_kes": _sum(inv, "total_kes"), "collected_kes": _sum(inv, "paid_kes"), "outstanding_kes": round(_sum(inv, "total_kes") - _sum(inv, "paid_kes"), 2)},
    }


# ======================= DEALS =======================
def list_deals(stage: str | None = None, client_id: str | None = None, limit: int = 50) -> list[dict]:
    """Deals pipeline, optionally by stage or client."""
    if stage: _enum("deal.stage", stage)
    return _list("deals", limit, select="id,title,stage,value_kes,probability,expected_close,client_id,lead_id,clients(business_name)", order="updated_at.desc",
                 stage=f"eq.{stage}" if stage else None, client_id=f"eq.{client_id}" if client_id else None)


def get_deal(deal_id: str) -> dict:
    """One deal."""
    return _one("deal", deal_id)


def create_deal(fields: dict) -> dict:
    """Create a deal. fields: title (required), client_id or lead_id, value_kes, stage, probability, expected_close."""
    return _create("deal", fields, ("title",))


def update_deal(deal_id: str, fields: dict) -> dict:
    """Update deal fields. Use move_stage to change stage."""
    return _update("deal", deal_id, {k: v for k, v in fields.items() if k != "stage"} if "stage" in fields else fields)


def move_stage(deal_id: str, stage: str, lost_reason: str | None = None) -> dict:
    """Move a deal to discovery|consultation|proposal|contract|deposit_paid|won|lost. lost needs lost_reason."""
    _enum("deal.stage", stage)
    if stage == "lost" and not lost_reason:
        raise ValueError("lost_reason is required when moving to lost")
    d = _one("deal", deal_id)
    patch: dict = {"stage": stage, "probability": {"discovery": 20, "consultation": 35, "proposal": 50, "contract": 70, "deposit_paid": 90, "won": 100, "lost": 0}[stage]}
    if stage == "won": patch["won_at"] = iso()
    if stage == "lost": patch.update(lost_at=iso(), lost_reason=lost_reason)
    row = _F().db.update("deals", patch, id=f"eq.{deal_id}")[0]
    _act("deal_stage_changed", f"Hermes moved {d['title']} from {d['stage']} to {stage}", "deal", deal_id, {"from": d["stage"], "to": stage})
    return row


def create_deal_invoices(deal_id: str) -> dict:
    """Create the 50/50 deposit and balance invoices for a deal (uses the deal value)."""
    d = _one("deal", deal_id)
    if float(d["value_kes"] or 0) <= 0:
        raise ValueError("Deal has no value yet")
    out = _F().db.rpc("create_deal_invoices", {"p_deal": deal_id})
    _act("invoice_created", f"Hermes raised deposit and balance invoices for {d['title']}", "deal", deal_id)
    return {"result": out}


def delete_deal(deal_id: str) -> dict:
    """Archive a deal."""
    return _delete("deal", deal_id)


# ======================= PROJECTS =======================
def list_projects(status: str | None = None, client_id: str | None = None, limit: int = 50) -> list[dict]:
    """Delivery projects, optionally by status or client."""
    if status: _enum("project.status", status)
    return _list("projects", limit, select="id,name,status,progress,priority,due_at,client_id,clients(business_name)", order="due_at.asc.nullslast",
                 status=f"eq.{status}" if status else None, client_id=f"eq.{client_id}" if client_id else None)


def get_project(project_id: str) -> dict:
    """One project with its materials checklist."""
    return _one("project", project_id)


def create_project(fields: dict) -> dict:
    """Create a project. fields: name (required), client_id, deal_id, status, priority, started_at, due_at, materials_checklist, budget_kes."""
    return _create("project", fields, ("name",))


def update_project(project_id: str, fields: dict) -> dict:
    """Update project fields."""
    return _update("project", project_id, fields)


def update_progress(project_id: str, progress: int, status: str | None = None, note: str | None = None) -> dict:
    """Set project progress (0-100), optionally its status, with a note for the timeline. 100 + delivered stamps delivered_at."""
    patch = _clean("project", {"progress": progress, "status": status})
    if patch.get("status") == "delivered":
        patch["delivered_at"] = now().date().isoformat()
    p = _one("project", project_id)
    row = _F().db.update("projects", patch, id=f"eq.{project_id}")[0]
    _act("project_progress", f"{p['name']} at {progress}%" + (f" ({status})" if status else "") + (f": {note}" if note else ""), "project", project_id)
    return row


def delete_project(project_id: str) -> dict:
    """Archive a project."""
    return _delete("project", project_id)


# ======================= INVOICES / SUBSCRIPTIONS =======================
def list_invoices(status: str | None = None, client_id: str | None = None, limit: int = 50) -> list[dict]:
    """Invoices, newest first."""
    if status: _enum("invoice.status", status)
    return _list("invoices", limit, select="id,number,type,status,total_kes,paid_kes,issued_at,due_date,client_id,clients(business_name)", order="issued_at.desc",
                 status=f"eq.{status}" if status else None, client_id=f"eq.{client_id}" if client_id else None)


def get_invoice(invoice_id: str) -> dict:
    """Invoice with line items and its payments."""
    return {"invoice": _one("invoice", invoice_id), "payments": _F().db.select("payments", invoice_id=f"eq.{invoice_id}", order="paid_at.asc")}


def create_invoice(fields: dict) -> dict:
    """Create an invoice. fields: client_id (required), type, line_items [{name, qty, unit_price_kes}], discount_kes, tax_kes, due_date, status, notes. Number and totals are computed."""
    for li in fields.get("line_items") or []:
        if not li.get("name") or float(li.get("qty", 0)) <= 0 or float(li.get("unit_price_kes", -1)) < 0:
            raise ValueError("Each line item needs name, qty > 0 and unit_price_kes >= 0")
    return _create("invoice", fields, ("client_id",))


def update_invoice(invoice_id: str, fields: dict) -> dict:
    """Update an invoice (status, due_date, line_items, notes...)."""
    return _update("invoice", invoice_id, fields)


def list_subscriptions(status: str | None = None, client_id: str | None = None, limit: int = 50) -> list[dict]:
    """Care-plan subscriptions."""
    if status: _enum("subscription.status", status)
    return _list("subscriptions", limit, soft=False, select="id,client_id,amount_kes,billing_cycle,status,next_due,clients(business_name)", order="next_due.asc.nullslast",
                 status=f"eq.{status}" if status else None, client_id=f"eq.{client_id}" if client_id else None)


def create_subscription(fields: dict) -> dict:
    """Start a subscription. fields: client_id (required), amount_kes (required), billing_cycle, plan_id, started_at, next_due."""
    return _create("subscription", fields, ("client_id", "amount_kes"))


def update_subscription(subscription_id: str, fields: dict) -> dict:
    """Update a subscription (amount_kes, status active|paused|past_due|cancelled|expired, next_due...)."""
    if fields.get("status") == "cancelled":
        _F().db.update("subscriptions", {"cancelled_at": iso()}, id=f"eq.{subscription_id}")
    return _update("subscription", subscription_id, fields)


# ======================= APPOINTMENTS =======================
def list_appointments(day: str | None = None, status: str | None = None, client_id: str | None = None, limit: int = 50) -> list[dict]:
    """Appointments. day=YYYY-MM-DD (EAT) limits to that day."""
    if status: _enum("appointment.status", status)
    extra = {}
    if day:
        s = dt.datetime.fromisoformat(day).replace(tzinfo=now().tzinfo)
        extra = _between("starts_at", s, s + dt.timedelta(days=1))
    return _list("appointments", limit, select="id,title,type,status,starts_at,ends_at,meet_link,client_id,lead_id,staff_id", order="starts_at.asc",
                 status=f"eq.{status}" if status else None, client_id=f"eq.{client_id}" if client_id else None, **extra)


def create_appointment(fields: dict) -> dict:
    """Book an appointment. fields: title and starts_at (ISO, required), client_id or lead_id, staff_id, type, ends_at, meet_link, location, notes."""
    dt.datetime.fromisoformat(fields.get("starts_at", ""))  # validates
    return _create("appointment", {"source": "hermes", **fields}, ("title", "starts_at"))


def update_appointment(appointment_id: str, fields: dict) -> dict:
    """Reschedule or change status (booked|confirmed|checked_in|in_progress|completed|no_show|cancelled)."""
    return _update("appointment", appointment_id, fields)


def cancel_appointment(appointment_id: str, reason: str | None = None) -> dict:
    """Cancel an appointment."""
    return _update("appointment", appointment_id, {"status": "cancelled", **({"notes": reason} if reason else {})})


# ======================= TASKS =======================
def list_tasks(status: str | None = None, assignee_id: str | None = None, limit: int = 50) -> list[dict]:
    """Tasks, by due date."""
    if status: _enum("task.status", status)
    return _list("tasks", limit, select="id,title,priority,status,due_at,entity_type,entity_id,assignee_id,created_by_kind", order="due_at.asc.nullslast",
                 status=f"eq.{status}" if status else None, assignee_id=f"eq.{assignee_id}" if assignee_id else None)


def create_task(fields: dict) -> dict:
    """Create a task. fields: title (required), description, priority, due_at, entity_type + entity_id (link), assignee_id."""
    row = _F().db.insert("tasks", {**_clean("task", fields, ("title",)), "created_by_kind": "hermes", "created_by": "Hermes"})[0]
    _act("task_created", f"Hermes created task: {row['title']}", "task", row["id"])
    return row


def update_task(task_id: str, fields: dict) -> dict:
    """Update a task."""
    if fields.get("status") == "done":
        fields = {**fields}
        _F().db.update("tasks", {"completed_at": iso()}, id=f"eq.{task_id}")
    return _update("task", task_id, fields)


def complete_task(task_id: str) -> dict:
    """Mark a task done."""
    return update_task(task_id, {"status": "done"})


def delete_task(task_id: str) -> dict:
    """Archive a task."""
    return _delete("task", task_id)


# ======================= DOCUMENTS / ACTIVITIES =======================
def list_documents(client_id: str | None = None, type: str | None = None, signed: bool | None = None, limit: int = 50) -> list[dict]:
    """Documents (portal-signed and internal). signed=true only signed ones."""
    return _list("documents", limit, select="id,name,type,status,source,signed_at,client_id,clients(business_name),created_at", order="created_at.desc",
                 client_id=f"eq.{client_id}" if client_id else None, type=f"eq.{type}" if type else None,
                 signed_at=("not.is.null" if signed else "is.null") if signed is not None else None)


def get_document(document_id: str) -> dict:
    """One document with its captured fields."""
    row = _F().db.one("documents", id=f"eq.{document_id}")
    if not row:
        raise ValueError(f"No document with id {document_id}")
    row.pop("signature_data", None)
    return row


def log_activity(summary: str, verb: str = "note", entity_type: str | None = None, entity_id: str | None = None, actor: str = "Hermes", metadata: dict | None = None) -> dict:
    """Write an entry to the activity feed / an entity timeline."""
    if not summary.strip():
        raise ValueError("summary is required")
    _act(verb, summary, entity_type, entity_id, metadata, actor)
    return {"logged": True}


def list_activities(entity_type: str | None = None, entity_id: str | None = None, actor: str | None = None, limit: int = 30) -> list[dict]:
    """Latest activity, optionally for one entity or actor."""
    return _list("activities", limit, soft=False, order="created_at.desc", entity_type=f"eq.{entity_type}" if entity_type else None,
                 entity_id=f"eq.{entity_id}" if entity_id else None, actor_name=f"ilike.*{actor}*" if actor else None)


# ======================= STATS =======================
def dashboard_stats() -> dict:
    """Command Center numbers: pipeline, MRR, receivables, today's calls, open tasks, active projects, funnel."""
    db = _F().db
    t0 = now().replace(hour=0, minute=0, second=0, microsecond=0)
    deals = db.select("deals", deleted_at="is.null", stage="not.in.(won,lost)", select="value_kes,probability")
    ar = db.select("v_receivables_ageing", select="outstanding_kes,bucket")
    mrr = (db.select("v_mrr") or [{}])[0]
    return {
        "pipeline_kes": _sum(deals, "value_kes"),
        "weighted_pipeline_kes": round(sum(float(d["value_kes"] or 0) * (d["probability"] or 0) / 100 for d in deals), 2),
        "open_deals": len(deals),
        "mrr_kes": float(mrr.get("mrr_kes") or 0), "active_subscriptions": mrr.get("active_subscriptions", 0),
        "receivables_kes": _sum(ar, "outstanding_kes"), "overdue_kes": _sum([a for a in ar if a["bucket"] != "current"], "outstanding_kes"),
        "calls_today": db.count("appointments", deleted_at="is.null", status="neq.cancelled", **_between("starts_at", t0, t0 + dt.timedelta(days=1))),
        "open_tasks": db.count("tasks", deleted_at="is.null", status="neq.done"),
        "active_projects": db.count("projects", deleted_at="is.null", status="in.(materials_pending,in_build,review,live_demo)"),
        "new_leads_7d": db.count("leads", deleted_at="is.null", created_at=f"gte.{(t0 - dt.timedelta(days=7)).isoformat()}"),
        "funnel": db.select("v_lead_funnel"),
    }


def funnel_stats(period: str = "month", start: str | None = None, end: str | None = None) -> dict:
    """Lead funnel now plus leads created in the period by status and source, with stage conversion %."""
    db = _F().db
    s, e = _range(period, start, end)
    fun = db.select("v_lead_funnel")
    cum, run = {}, 0
    for r in reversed(fun):
        run += int(r["count"]); cum[r["status"]] = run
    order = [r["status"] for r in fun]
    conv = {f"{a}->{b}": (round(100 * cum[b] / cum[a], 1) if cum[a] else 0) for a, b in zip(order, order[1:])}
    leads = db.select("leads", deleted_at="is.null", select="status,source,quality", limit=10000, **_between("created_at", s, e))
    by = lambda k: {v: sum(1 for l in leads if (l.get(k) or "unknown") == v) for v in sorted({l.get(k) or "unknown" for l in leads})}
    return {"period": [s.isoformat(), e.isoformat()], "funnel": fun, "reached_stage": cum, "conversion_pct": conv,
            "created_in_period": len(leads), "by_status": by("status"), "by_source": by("source"), "by_quality": by("quality")}


def finance_stats(period: str = "month", start: str | None = None, end: str | None = None) -> dict:
    """Invoiced, collected, expenses and net for the period, plus MRR and receivables ageing (KES)."""
    db = _F().db
    s, e = _range(period, start, end)
    inv = db.select("invoices", deleted_at="is.null", status="neq.void", select="total_kes,type", limit=10000, **_between("issued_at", s, e, True))
    pays = db.select("payments", select="amount_kes,method", limit=10000, **_between("paid_at", s, e))
    exp = db.select("expenses", deleted_at="is.null", select="amount_kes,category", limit=10000, **_between("paid_at", s, e, True))
    ar = db.select("v_receivables_ageing", select="outstanding_kes,bucket")
    mrr = (db.select("v_mrr") or [{}])[0]
    group = lambda rows, k, v: {g: _sum([r for r in rows if r[k] == g], v) for g in sorted({r[k] for r in rows})}
    collected, spent = _sum(pays, "amount_kes"), _sum(exp, "amount_kes")
    return {"period": [s.isoformat(), e.isoformat()], "invoiced_kes": _sum(inv, "total_kes"), "invoiced_by_type": group(inv, "type", "total_kes"),
            "collected_kes": collected, "collected_by_method": group(pays, "method", "amount_kes"),
            "expenses_kes": spent, "expenses_by_category": group(exp, "category", "amount_kes"), "net_cash_kes": round(collected - spent, 2),
            "mrr_kes": float(mrr.get("mrr_kes") or 0), "receivables_ageing": group(ar, "bucket", "outstanding_kes"), "receivables_kes": _sum(ar, "outstanding_kes")}


def report(period: str = "week", start: str | None = None, end: str | None = None) -> dict:
    """Business report for today|week|month|quarter|year|custom: leads, deals won/lost, clients, projects delivered, money, bot runs."""
    db = _F().db
    s, e = _range(period, start, end)
    won = db.select("deals", stage="eq.won", select="title,value_kes", **_between("won_at", s, e))
    lost = db.select("deals", stage="eq.lost", select="title,lost_reason", **_between("lost_at", s, e))
    runs = db.select("automation_runs", select="bot_name,status", limit=5000, **_between("started_at", s, e))
    return {
        "period": period, "range": [s.isoformat(), e.isoformat()],
        "leads": funnel_stats("custom", s.date().isoformat(), (e - dt.timedelta(seconds=1)).date().isoformat()) if period != "custom" else funnel_stats(period, start, end),
        "deals_won": {"count": len(won), "value_kes": _sum(won, "value_kes"), "items": won[:20]},
        "deals_lost": {"count": len(lost), "items": lost[:20]},
        "new_clients": db.count("clients", deleted_at="is.null", **_between("created_at", s, e)),
        "projects_delivered": db.count("projects", deleted_at="is.null", **_between("delivered_at", s, e, True)),
        "finance": finance_stats("custom", s.date().isoformat(), (e - dt.timedelta(seconds=1)).date().isoformat()) if period != "custom" else finance_stats(period, start, end),
        "bot_runs": {b: {"total": sum(1 for r in runs if r["bot_name"] == b), "failed": sum(1 for r in runs if r["bot_name"] == b and r["status"] == "failed")} for b in sorted({r["bot_name"] or "-" for r in runs})},
    }


# ======================= AUTOMATION =======================
KNOWN_SETTINGS = {"min_score_threshold": int, "outreach_paused": bool, "daily_send_limit": int, "approval_mode": str, "followup_days": int, "quiet_hours": dict}


def get_settings() -> dict:
    """All automation settings (threshold, kill switch, send limit, approval mode...)."""
    return _F().settings()


def set_setting(key: str, value: Any) -> dict:
    """Change an automation setting. Known keys are type-checked; approval_mode is manual|auto."""
    typ = KNOWN_SETTINGS.get(key)
    if typ is int:
        value = int(value)
    elif typ is bool and not isinstance(value, bool):
        raise ValueError(f"{key} must be true or false")
    if key == "approval_mode" and value not in ("manual", "auto"):
        raise ValueError("approval_mode must be manual or auto")
    if key == "min_score_threshold" and not 0 <= value <= 100:
        raise ValueError("min_score_threshold must be 0-100")
    _F().set_setting(key, value)
    _act("setting_changed", f"Hermes set {key} to {value}", metadata={"key": key, "value": value})
    return {key: value}


def log_run(bot_name: str, routine: str, status: str, summary: str, stats: dict | None = None) -> dict:
    """Record a routine run done outside the runner (e.g. by Hermes directly) so it shows in the Fleet control room."""
    _enum("run.status", status)
    if bot_name not in {"scout", "sage", "herald", "echo", "ledger"}:
        raise ValueError("bot_name must be scout|sage|herald|echo|ledger")
    return _F().db.insert("automation_runs", {"bot_name": bot_name, "routine": routine, "status": status, "summary": summary, "stats": stats or {}, "finished_at": iso()})[0]


def get_commands(status: str = "pending", limit: int = 20) -> list[dict]:
    """Commands the app queued for Hermes (Trigger Enrichment, Send outreach, ...). status pending|acked|running|done|failed."""
    return _F().db.select("automation_commands", status=f"eq.{status}", order="created_at.asc", limit=limit)


def ack_command(command_id: str, status: str = "acked", result: dict | None = None) -> dict:
    """Update a command's status (acked|running|done|failed|cancelled) and optional result; the app shows it live."""
    _enum("command.status", status)
    patch: dict = {"status": status}
    if status == "acked": patch["acked_at"] = iso()
    if status in ("done", "failed", "cancelled"): patch["done_at"] = iso()
    if result is not None: patch["result"] = result
    row = _F().db.update("automation_commands", patch, id=f"eq.{command_id}")
    if not row:
        raise ValueError(f"No command with id {command_id}")
    return row[0]


TOOLS = [score_lead, queue_lead, disqualify_lead,
         list_clients, get_client, create_client, update_client, delete_client, client360,
         list_deals, get_deal, create_deal, update_deal, move_stage, create_deal_invoices, delete_deal,
         list_projects, get_project, create_project, update_project, update_progress, delete_project,
         list_invoices, get_invoice, create_invoice, update_invoice, list_subscriptions, create_subscription, update_subscription,
         list_appointments, create_appointment, update_appointment, cancel_appointment,
         list_tasks, create_task, update_task, complete_task, delete_task,
         list_documents, get_document, log_activity, list_activities,
         dashboard_stats, funnel_stats, finance_stats, report,
         get_settings, set_setting, log_run, get_commands, ack_command]


def register(mcp, fleet_factory: Callable[[], Fleet]) -> None:
    global _F
    _F = fleet_factory
    for fn in TOOLS:
        mcp.tool(fn)