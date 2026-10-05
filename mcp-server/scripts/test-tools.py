"""Exercise every MCP tool against the local preview backend (dry run). Creates and then purges its own test rows."""
import asyncio, json, sys, traceback
sys.path.insert(0, ".")
import server, crm_tools as t
from fleet import Fleet

f = Fleet()
t._F = lambda: f
ok, bad = [], []


def chk(name, fn, *a, **k):
    try:
        r = fn(*a, **k); ok.append(name); return r
    except Exception as e:  # noqa: BLE001
        bad.append(f"{name}: {type(e).__name__}: {str(e)[:220]}"); return None


def expect_err(name, fn, *a, **k):
    try:
        fn(*a, **k); bad.append(f"{name}: expected validation error")
    except ValueError:
        ok.append(name)


for n in ["list_clients", "list_deals", "list_projects", "list_invoices", "list_subscriptions", "list_appointments", "list_tasks", "list_documents", "list_activities",
          "dashboard_stats", "funnel_stats", "finance_stats", "get_settings", "get_commands"]:
    chk(n, getattr(t, n))
for p in ["today", "week", "month", "quarter", "year"]:
    chk(f"report({p})", t.report, p)
chk("report(custom)", t.report, "custom", "2026-09-01", "2026-09-30")
print("dashboard", json.dumps({k: v for k, v in (t.dashboard_stats() or {}).items() if k != "funnel"}))
print("finance", json.dumps({k: t.finance_stats("year")[k] for k in ["invoiced_kes", "collected_kes", "expenses_kes", "net_cash_kes", "mrr_kes", "receivables_kes"]}))

c = chk("create_client", t.create_client, {"business_name": "ZZ Test Agency", "contact_name": "Test Person", "phone": "0700000000", "tier": "gold"})
if c:
    cid = c["id"]
    chk("get_client", t.get_client, cid)
    chk("update_client", t.update_client, cid, {"health": 81})
    d = chk("create_deal", t.create_deal, {"title": "ZZ Test deal", "client_id": cid, "value_kes": 120000})
    if d:
        chk("move_stage", t.move_stage, d["id"], "proposal")
        chk("update_deal", t.update_deal, d["id"], {"value_kes": 150000})
        chk("create_deal_invoices", t.create_deal_invoices, d["id"])
        expect_err("move_stage(lost no reason)", t.move_stage, d["id"], "lost")
    p = chk("create_project", t.create_project, {"name": "ZZ Test build", "client_id": cid})
    if p: chk("update_progress", t.update_progress, p["id"], 60, "in_build", "pages done")
    i = chk("create_invoice", t.create_invoice, {"client_id": cid, "type": "one_off", "line_items": [{"name": "Setup", "qty": 1, "unit_price_kes": 25000}], "due_date": "2026-10-20"})
    if i: chk("get_invoice", t.get_invoice, i["id"]); chk("update_invoice", t.update_invoice, i["id"], {"status": "sent"})
    s = chk("create_subscription", t.create_subscription, {"client_id": cid, "amount_kes": 8000})
    if s: chk("update_subscription", t.update_subscription, s["id"], {"status": "paused"})
    a = chk("create_appointment", t.create_appointment, {"title": "ZZ Test review", "client_id": cid, "starts_at": "2026-10-06T10:00:00+03:00"})
    if a: chk("update_appointment", t.update_appointment, a["id"], {"status": "confirmed"}); chk("cancel_appointment", t.cancel_appointment, a["id"], "test")
    tk = chk("create_task", t.create_task, {"title": "ZZ Test task", "entity_type": "client", "entity_id": cid, "priority": "high"})
    if tk: chk("complete_task", t.complete_task, tk["id"])
    chk("log_activity", t.log_activity, "ZZ test note", "note", "client", cid)
    r = chk("client360", t.client360, cid)
    if r: print("client360 sections", {k: (len(v) if isinstance(v, list) else "obj") for k, v in r.items()})
    expect_err("create_client(bad field)", t.create_client, {"business_name": "x", "nope": 1})
    expect_err("create_deal(bad stage)", t.create_deal, {"title": "x", "stage": "maybe"})
    expect_err("update_progress(>100)", t.update_progress, p["id"] if p else cid, 140)
    expect_err("set_setting(bad mode)", t.set_setting, "approval_mode", "yolo")

lead = (f.db.select("leads", status="eq.enriched", deleted_at="is.null", limit=1) or [None])[0]
if lead:
    chk("score_lead", t.score_lead, lead["id"], int(lead.get("score") or 60))
cmd = f.db.insert("automation_commands", {"command": "zz_test", "payload": {}, "requested_by": "test"})[0]
chk("ack_command", t.ack_command, cmd["id"], "done", {"ok": True})
chk("log_run", t.log_run, "ledger", "zz_test", "success", "test run")
cur = t.get_settings().get("daily_send_limit", 40)
chk("set_setting", t.set_setting, "daily_send_limit", cur)

# purge test rows
import httpx
H = f.db.h
for tbl, flt in [("payments", None), ("tasks", "title=like.ZZ*"), ("appointments", "title=like.ZZ*"), ("automation_commands", "command=eq.zz_test"), ("automation_runs", "routine=eq.zz_test"), ("activities", "summary=like.*ZZ*")]:
    if flt: httpx.delete(f"{f.db.base}/{tbl}?{flt}", headers=H)
if c:
    for tbl in ["invoices", "subscriptions", "projects", "deals", "documents", "activities"]:
        httpx.delete(f"{f.db.base}/{tbl}?client_id=eq.{c['id']}", headers=H)
    httpx.delete(f"{f.db.base}/activities?entity_id=eq.{c['id']}", headers=H)
    httpx.delete(f"{f.db.base}/clients?id=eq.{c['id']}", headers=H)


async def count():
    for name in ("get_tools", "list_tools", "_list_tools"):
        fn = getattr(server.mcp, name, None)
        if fn:
            tools = await fn()
            return len(tools)
    return -1

n = asyncio.run(count())
print(f"MCP tools registered: {n}")
print(f"PASS {len(ok)}  FAIL {len(bad)}")
for b in bad: print("  FAIL", b)
sys.exit(1 if bad else 0)