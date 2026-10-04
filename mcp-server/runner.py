"""Hermes runner: executes app commands (automation_commands) and cron schedules (hermes_bots.schedule).

  python runner.py --once     process pending commands once and exit
  python runner.py            loop forever (poll every HERMES_POLL_SECONDS, default 20)
"""
from __future__ import annotations

import argparse
import os
import time
import traceback

from fleet import COMMANDS, SCHEDULED, Fleet, iso, now


def _field(spec: str, v: int, lo: int, hi: int) -> bool:
    for part in spec.split(","):
        step = 1
        if "/" in part:
            part, s = part.split("/"); step = int(s)
        if part == "*": a, b = lo, hi
        elif "-" in part: a, b = map(int, part.split("-"))
        else: a = b = int(part)
        if a <= v <= b and (v - a) % step == 0:
            return True
    return False


def cron_match(expr: str, t) -> bool:
    m, h, dom, mon, dow = expr.split()
    return _field(m, t.minute, 0, 59) and _field(h, t.hour, 0, 23) and _field(dom, t.day, 1, 31) and _field(mon, t.month, 1, 12) and _field(dow, t.isoweekday() % 7, 0, 6)


def process_commands(f: Fleet) -> int:
    pending = f.db.select("automation_commands", status="eq.pending", order="created_at.asc", limit=20)
    for c in pending:
        cid, name, payload = c["id"], c["command"], c.get("payload") or {}
        f.db.update("automation_commands", {"status": "running", "acked_at": iso()}, id=f"eq.{cid}")
        try:
            if name in ("pause_outreach", "resume_outreach"):
                f.set_setting("outreach_paused", name == "pause_outreach")
                f.activity("herald", "hermes_command", "Kill switch ON: all outreach stopped" if name == "pause_outreach" else "Outreach resumed")
                result = {"status": "success", "summary": "Outreach paused" if name == "pause_outreach" else "Outreach resumed"}
            elif name in COMMANDS:
                bot, routine, fn = COMMANDS[name]
                b = f.db.one("hermes_bots", name=f"eq.{bot}", select="enabled")
                if b and not b["enabled"]:
                    result = {"status": "skipped", "summary": f"{bot} is disabled"}
                else:
                    result = f.run(bot, routine, lambda: fn(f, payload), command_id=cid)
            else:
                result = {"status": "failed", "summary": f"Unknown command {name}"}
            f.db.update("automation_commands", {"status": "failed" if result["status"] == "failed" else "done", "result": result, "done_at": iso()}, id=f"eq.{cid}")
        except Exception as e:  # noqa: BLE001
            f.db.update("automation_commands", {"status": "failed", "result": {"summary": str(e)[:500]}, "done_at": iso()}, id=f"eq.{cid}")
    return len(pending)


def run_schedules(f: Fleet, t) -> None:
    for b in f.db.select("hermes_bots", enabled="eq.true"):
        if b.get("schedule") and cron_match(b["schedule"], t):
            for routine, fn in SCHEDULED[b["name"]](f, b.get("config") or {}, t):
                f.run(b["name"], routine, fn)


def main() -> None:
    ap = argparse.ArgumentParser(); ap.add_argument("--once", action="store_true"); a = ap.parse_args()
    f = Fleet()
    if a.once:
        print(f"processed {process_commands(f)} commands"); return
    poll, last_minute = int(os.environ.get("HERMES_POLL_SECONDS", "20")), None
    print("Hermes runner started", flush=True)
    while True:
        try:
            process_commands(f)
            t = now().replace(second=0, microsecond=0)
            if t != last_minute:
                last_minute = t
                if os.environ.get("HERMES_SCHEDULES", "1") == "1":
                    run_schedules(f, t)
                for b in f.db.select("hermes_bots", select="name,status"):
                    if b["status"] != "running":
                        f.heartbeat(b["name"], b["status"])
        except Exception:  # noqa: BLE001
            traceback.print_exc()
        time.sleep(poll)


if __name__ == "__main__":
    main()