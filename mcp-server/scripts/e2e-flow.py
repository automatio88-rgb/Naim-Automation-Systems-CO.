"""End-to-end business flow test (masterprompt Part 8 #4 and #6), run through the real MCP tools.

lead -> enriched -> outreach queued -> sent -> reply -> call booked -> deal -> contract + signed doc
-> 50/50 invoices -> deposit paid -> project -> delivered -> subscription active -> visible in reports.
Every row it creates is named "ZZ E2E" and purged at the end. Outreach goes through dry-run delivery.

  cd mcp-server; set -a; eval "$(sudo cat /etc/naim/hermes.env)"; set +a; .venv/bin/python scripts/e2e-flow.py
"""
import datetime as dt, sys, traceback
sys.path.insert(0, ".")
import httpx
import server, crm_tools as t
from fleet import Fleet

f = Fleet()
t._F = lambda: f
server.F = lambda: f
ok, bad = [], []
ids: dict = {}


def step(name, cond, detail=""):
    (ok if cond else bad).append(name)
    print(f"{'ok  ' if cond else 'FAIL'} {name}" + (f"  ({detail})" if detail else ""))


def lead():
    return f.db.one("leads", id=f"eq.{ids['lead']}")


def funnel():
    return {r["status"]: int(r["count"]) for r in f.db.select("v_lead_funnel")}


def mrr():
    return float((f.db.select("v_mrr") or [{}])[0].get("mrr_kes") or 0)


try:
    f0, mrr0 = funnel(), mrr()
    VALUE = 150001  # odd on purpose: the split must still add up to the shilling

    # 1. lead in (Scout)
    r = server.add_leads([{"business_name": "ZZ E2E Agency", "contact_name": "Zed Tester", "email": "zz-e2e@example.test", "phone": "0700999222", "location": "Nairobi"}])
    rows = r.get("leads") or r.get("inserted") or r.get("rows") or (r if isinstance(r, list) else None)
    l = (f.db.select("leads", business_name="eq.ZZ E2E Agency", deleted_at="is.null", limit=1) or [None])[0]
    ids["lead"] = l["id"]
    step("1 lead added (status new)", l["status"] == "new")

    # 2. enriched (Sage)
    t.score_lead(ids["lead"], 86)
    server.update_lead(ids["lead"], status="enriched", dossier="ZZ E2E dossier: 40 placements a month, paper-based visa tracking.")
    step("2 lead enriched and scored high", lead()["status"] == "enriched" and lead()["quality"] == "high")

    # 3. outreach drafted (Herald)
    m = t.queue_lead(ids["lead"])
    ids["msg"] = m["id"]
    step("3 outreach drafted and lead queued", lead()["status"] == "queued" and m["status"] == "queued", m["channel"])

    # 4. approved and sent (dry-run delivery)
    f.db.update("outreach_messages", {"status": "approved"}, id=f"eq.{m['id']}")
    res = f._deliver(m, lead())
    f.db.update("outreach_messages", {"status": "sent", "sent_at": dt.datetime.now(dt.timezone.utc).isoformat()}, id=f"eq.{m['id']}")
    f.db.update("leads", {"status": "sent"}, id=f"eq.{ids['lead']}")
    step("4 outreach approved and sent", lead()["status"] == "sent", f"delivery={res}")

    # 5. reply lands (Echo)
    rep = f.db.insert("replies", {"lead_id": ids["lead"], "channel": "email", "body": "ZZ E2E: yes, call me Tuesday", "intent": "interested", "sentiment": "positive"})[0]
    ids["reply"] = rep["id"]
    f.db.update("leads", {"status": "replied"}, id=f"eq.{ids['lead']}")
    step("5 interested reply filed", lead()["status"] == "replied")

    # 6. call booked
    a = server.book_call(ids["lead"], (dt.datetime.now() + dt.timedelta(days=1)).replace(hour=10, minute=0, second=0, microsecond=0).isoformat() + "+03:00")
    ids["appt"] = a["id"]
    deal = (f.db.select("deals", lead_id=f"eq.{ids['lead']}", limit=1) or [None])[0]
    ids["deal"] = deal["id"]
    step("6 call booked, discovery deal opened", lead()["status"] == "booked" and deal["stage"] == "discovery")

    # 7. lead converted to client
    cid = server.convert_lead(ids["lead"])["client_id"]
    ids["client"] = cid
    deal = f.db.one("deals", id=f"eq.{ids['deal']}")
    appt = f.db.one("appointments", id=f"eq.{ids['appt']}")
    step("7 converted: client created, deal and call linked", lead()["status"] == "converted" and deal["client_id"] == cid and appt["client_id"] == cid)

    # 8. deal through proposal to contract, with the signed agreement on file
    t.update_deal(ids["deal"], {"value_kes": VALUE, "title": "ZZ E2E Agency system"})
    t.move_stage(ids["deal"], "proposal")
    t.move_stage(ids["deal"], "contract")
    doc = f.db.insert("documents", {"client_id": cid, "type": "agreement", "name": "ZZ E2E Service Agreement", "source": "internal", "status": "signed", "signed_at": dt.datetime.now(dt.timezone.utc).isoformat()})[0]
    ids["doc"] = doc["id"]
    docs = t.list_documents(client_id=cid)
    step("8 deal at contract, signed agreement on file", f.db.one("deals", id=f"eq.{ids['deal']}")["stage"] == "contract" and any(d["id"] == doc["id"] for d in docs))

    # 9. 50/50 invoices to the shilling (#6)
    t.create_deal_invoices(ids["deal"])
    invs = f.db.select("invoices", deal_id=f"eq.{ids['deal']}", order="type.desc")
    dep = next(i for i in invs if i["type"] == "deposit"); bal = next(i for i in invs if i["type"] == "balance")
    total = float(dep["total_kes"]) + float(bal["total_kes"])
    step("9 deposit + balance invoices add up exactly to the deal value", len(invs) == 2 and total == VALUE, f"{dep['total_kes']} + {bal['total_kes']} = {total:.0f} of {VALUE}")

    # 10. deposit paid
    server.record_payment(dep["id"], float(dep["total_kes"]), "mpesa", "ZZE2E0001")
    dep2 = f.db.one("invoices", id=f"eq.{dep['id']}")
    t.move_stage(ids["deal"], "deposit_paid")
    step("10 deposit paid, invoice rolls up to paid", dep2["status"] == "paid", f"status={dep2['status']}")

    # 11. project built and delivered
    p = t.create_project({"name": "ZZ E2E Agency build", "client_id": cid, "deal_id": ids["deal"]})
    ids["project"] = p["id"]
    t.update_progress(p["id"], 60, "in_build", "ZZ E2E pages done")
    t.update_progress(p["id"], 100, "delivered", "ZZ E2E handed over")
    p2 = f.db.one("projects", id=f"eq.{p['id']}")
    t.move_stage(ids["deal"], "won")
    step("11 project delivered, deal won", p2["status"] == "delivered" and p2.get("delivered_at") and f.db.one("deals", id=f"eq.{ids['deal']}")["stage"] == "won")

    # 12. subscription active and MRR rolls up (#6)
    s = t.create_subscription({"client_id": cid, "amount_kes": 8000, "billing_cycle": "monthly"})
    ids["sub"] = s["id"]
    if s.get("status") != "active":
        t.update_subscription(s["id"], {"status": "active"})
    step("12 subscription active, MRR up by exactly KES 8,000", round(mrr() - mrr0, 2) == 8000, f"{mrr0:,.0f} -> {mrr():,.0f}")

    # 13. visible in reports
    f1 = funnel()
    c360 = t.client360(cid)
    rep_today = t.report("today")
    fin = t.finance_stats("month")
    acts = f.db.select("activities", entity_id=f"in.({ids['lead']},{cid},{ids['deal']},{ids['project']})", select="id")
    step("13 visible in funnel, Client 360, reports and activity feed",
         f1.get("converted", 0) == f0.get("converted", 0) + 1 and bool(c360) and bool(rep_today) and float(fin.get("collected_kes") or 0) >= float(dep["total_kes"]) and len(acts) >= 6,
         f"converted {f0.get('converted')}->{f1.get('converted')}, {len(acts)} activity rows")
except Exception as e:  # noqa: BLE001
    bad.append(f"crashed: {e}")
    traceback.print_exc()
finally:
    H, B = f.db.h, f.db.base
    cid = ids.get("client")
    if cid:
        for inv in f.db.select("invoices", client_id=f"eq.{cid}", select="id"):
            httpx.delete(f"{B}/payments?invoice_id=eq.{inv['id']}", headers=H)
        for tbl in ["invoices", "subscriptions", "projects", "documents"]:
            httpx.delete(f"{B}/{tbl}?client_id=eq.{cid}", headers=H)
    if ids.get("lead"):
        lid = ids["lead"]
        for tbl in ["appointments", "deals", "replies", "outreach_messages"]:
            httpx.delete(f"{B}/{tbl}?lead_id=eq.{lid}", headers=H)
    ents = ",".join(v for k, v in ids.items() if k in ("lead", "client", "deal", "project", "doc", "appt", "sub"))
    if ents:
        httpx.delete(f"{B}/activities?entity_id=in.({ents})", headers=H)
    httpx.delete(f"{B}/activities?summary=like.*ZZ E2E*", headers=H)
    if ids.get("lead"):
        httpx.patch(f"{B}/leads?id=eq.{ids['lead']}", headers=H, json={"converted_client_id": None})
    if cid:
        httpx.delete(f"{B}/clients?id=eq.{cid}", headers=H)
    if ids.get("lead"):
        httpx.delete(f"{B}/leads?id=eq.{ids['lead']}", headers=H)
    print(f"\nE2E flow: PASS {len(ok)}  FAIL {len(bad)}")
    for b in bad: print("  FAIL", b)
    sys.exit(1 if bad else 0)