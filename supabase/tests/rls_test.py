#!/usr/bin/env python3
"""Per-role Row Level Security test for NAIM COMMAND (masterprompt Phase 5).

For every role (owner, admin, manager, staff, viewer) and every table protected by has_perm(),
this signs in as a user with that role (a JWT `sub` claim, exactly as Supabase does) and checks
that the database itself allows or blocks:
  view    SELECT returns rows
  create  INSERT passes the RLS check (SQLSTATE 42501 = blocked)
  edit    UPDATE touches a row
  delete  DELETE removes a row
The expected answer is read from role_permissions, so the test follows whatever the owner sets in
Roles & Permissions. Everything runs in one transaction per role and is rolled back: no data changes.

  Local preview:  PSQL="sudo -u postgres psql -d naim" python3 supabase/tests/rls_test.py
  Supabase:       PSQL="psql $DATABASE_URL" python3 supabase/tests/rls_test.py   (use a staging project)
"""
from __future__ import annotations

import os
import re
import shlex
import subprocess
import sys
import uuid

PSQL = shlex.split(os.environ.get("PSQL", "psql"))
ROLES = ["owner", "admin", "manager", "staff", "viewer"]
CMD_FOR = {"view": "SELECT", "create": "INSERT", "edit": "UPDATE", "delete": "DELETE"}
COL = {"view": "can_view", "create": "can_create", "edit": "can_edit", "delete": "can_delete"}


def psql(sql: str) -> list[str]:
    r = subprocess.run(PSQL + ["-X", "-q", "-tA", "-v", "ON_ERROR_STOP=1", "-f", "-"], input=sql, capture_output=True, text=True)
    if r.returncode:
        sys.exit(f"psql failed:\n{r.stderr[-2000:]}")
    return [l for l in r.stdout.splitlines() if l.strip()]


def q(s: str) -> str:
    return "'" + s.replace("'", "''") + "'"


def dummy(t: str) -> str:
    t = t.lower()
    if t in ("uuid",): return "gen_random_uuid()"
    if t in ("integer", "bigint", "smallint", "numeric", "double precision", "real"): return "1"
    if t == "boolean": return "true"
    if t == "date": return "current_date"
    if t.startswith("timestamp"): return "now()"
    if t in ("jsonb", "json"): return "'{}'"
    if t == "array": return "'{}'"
    return "'ZZ rls test'"


def main() -> None:
    # 1. which module/actions guard each table, from the live policies
    pol: dict[str, dict[str, list]] = {}
    for line in psql("select tablename, cmd, coalesce(qual,'') || ' ' || coalesce(with_check,'') from pg_policies where schemaname = 'public';"):
        t, cmd, expr = line.split("|", 2)
        pairs = re.findall(r"has_perm\('([a-z_]+)'(?:::text)?,\s*'([a-z]+)'", expr)
        for c in (["SELECT", "INSERT", "UPDATE", "DELETE"] if cmd == "ALL" else [cmd]):
            pol.setdefault(t, {}).setdefault(c, []).append(pairs or None)  # None = no has_perm (any member)
    tables = sorted(t for t, cmds in pol.items() if any(p for ps in cmds.values() for p in ps if p))

    perms = {}
    for line in psql("select role, module, can_view, can_create, can_edit, can_delete from role_permissions;"):
        r, m, *v = line.split("|")
        perms[(r, m)] = dict(zip(["can_view", "can_create", "can_edit", "can_delete"], [x == "t" for x in v]))

    def allowed(role: str, table: str, action: str) -> bool:
        exprs = pol.get(table, {}).get(CMD_FOR[action], [])
        if not exprs: return False
        if role == "owner": return True
        for pairs in exprs:
            if pairs is None: return True
            if any(perms.get((role, m), {}).get(COL.get(a, ""), False) for m, a in pairs): return True
        return False

    cols: dict[str, list[tuple[str, str, bool]]] = {}
    for line in psql("select table_name, column_name, data_type, (is_nullable = 'NO' and column_default is null) from information_schema.columns where table_schema = 'public' order by ordinal_position;"):
        t, c, ty, req = line.split("|")
        cols.setdefault(t, []).append((c, ty, req == "t"))
    base = dict(l.split("|") for l in psql("\n".join(f"select {q(t)} || '|' || count(1) from public.{t};" for t in tables)))

    # 2. probes
    def probes(t: str) -> list[tuple[str, str]]:
        out = [("view", f"select count(1) from public.{t}")]
        req = [(c, ty) for c, ty, r in cols.get(t, []) if r]
        if req:
            out.append(("create", f"insert into public.{t} ({', '.join(c for c, _ in req)}) values ({', '.join(dummy(ty) for _, ty in req)})"))
        if any(c == "id" for c, _, _ in cols.get(t, [])) and int(base.get(t, 0)) > 0:
            out.append(("edit", f"update public.{t} set id = id where id = (select id from public.{t} limit 1)"))
            out.append(("delete", f"delete from public.{t} where id = (select id from public.{t} limit 1)"))
        return out

    probe_fn = """create or replace function public.zz_rls_probe(p text) returns text language plpgsql as $f$
declare n bigint;
begin
  if p ilike 'select%' then execute p into n; else execute p; get diagnostics n = row_count; end if;
  return 'rows:' || n;
exception when others then return 'err:' || sqlstate;
end $f$;
grant execute on function public.zz_rls_probe(text) to authenticated;"""

    existing = dict(l.split("|") for l in psql("select role, id from profiles where active order by created_at;"))
    total_pass = total_fail = 0
    matrix: dict[str, dict[str, str]] = {}
    for role in ROLES:
        uid = existing.get(role) or str(uuid.uuid4())
        setup = "" if role in existing else (
            f"insert into auth.users (id, email) values ('{uid}', 'zz-{role}@rls.test');\n"
            f"insert into profiles (id, full_name, email, role) values ('{uid}', 'ZZ {role}', 'zz-{role}@rls.test', '{role}') on conflict (id) do update set role = excluded.role, active = true;\n")
        body = [f"select {q(t + '|' + a + '|')} || public.zz_rls_probe({q(sql)});" for t in tables for a, sql in probes(t)]
        sql = "begin;\n" + probe_fn + "\n" + setup + \
              f"select set_config('request.jwt.claims', {q('{\"sub\":\"' + uid + '\",\"role\":\"authenticated\"}')}, true) is not null;\n" + \
              f"select set_config('request.jwt.claim.sub', '{uid}', true) is not null;\nset local role authenticated;\n" + \
              "\n".join(body) + "\nreset role;\nrollback;\n"
        fails = []
        for line in psql(sql):
            if line.count("|") != 2: continue
            t, a, res = line.split("|")
            kind, val = res.split(":", 1)
            if a == "view": got = kind == "rows" and int(val) > 0
            elif a == "create": got = not (kind == "err" and val == "42501")
            else: got = (kind == "rows" and int(val) > 0) or (kind == "err" and val != "42501")
            exp = allowed(role, t, a)
            if a in ("edit", "delete"): exp = exp and allowed(role, t, "view")
            if a == "view" and int(base.get(t, 0)) == 0: continue
            matrix.setdefault(t, {})[f"{role}.{a}"] = "Y" if got else "-"
            if got == exp: total_pass += 1
            else: total_fail += 1; fails.append(f"{t}.{a}: expected {'allow' if exp else 'block'}, got {'allow' if got else 'block'} ({res})")
        print(f"{role:8} {'PASS' if not fails else 'FAIL'}  {len([1 for t in matrix for k in matrix[t] if k.startswith(role + '.')])} checks" + ("" if not fails else "\n   " + "\n   ".join(fails[:25])))

    print(f"\nTables checked: {len(tables)}   PASS {total_pass}  FAIL {total_fail}")
    sys.exit(1 if total_fail else 0)


if __name__ == "__main__":
    main()