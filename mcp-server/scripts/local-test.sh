#!/usr/bin/env bash
# Local preview test of the Hermes fleet against the VM backend (dry run).
set -euo pipefail
cd "$(dirname "$0")/.."
[ -d .venv ] || uv venv -q .venv
VIRTUAL_ENV=.venv uv pip install -q -r requirements.txt
if ! sudo test -f /etc/naim/hermes.env; then
  SECRET=$(sudo grep JWT_SECRET /etc/naim/command.env | cut -d= -f2)
  KEY=$(.venv/bin/python - "$SECRET" <<'EOF'
import sys,hmac,hashlib,base64,json,time
b=lambda x: base64.urlsafe_b64encode(x).rstrip(b'=').decode()
h=b(json.dumps({"alg":"HS256","typ":"JWT"}).encode()); p=b(json.dumps({"role":"service_role","iss":"naim-local","exp":int(time.time())+10*365*86400}).encode())
s=b(hmac.new(sys.argv[1].encode(), f"{h}.{p}".encode(), hashlib.sha256).digest()); print(f"{h}.{p}.{s}")
EOF
)
  printf "SUPABASE_URL=http://127.0.0.1:8080\nSUPABASE_SERVICE_ROLE_KEY=%s\nHERMES_DRY_RUN=1\nPYTHONUNBUFFERED=1\n" "$KEY" | sudo tee /etc/naim/hermes.env >/dev/null
fi
set -a; eval "$(sudo cat /etc/naim/hermes.env)"; set +a
.venv/bin/python - <<'EOF'
from fleet import Fleet, COMMANDS
f=Fleet()
print('settings', f.settings())
print('funnel', f.db.select('v_lead_funnel'))
for cmd in ['run_sourcing','run_enrichment','queue_outreach','check_replies','chase_overdue','daily_summary']:
    bot,routine,fn=COMMANDS[cmd]; r=f.run(bot,routine,lambda: fn(f,{})); print(cmd,'->',r['status'],'|',r['summary'][:160])
q=f.db.select('outreach_messages',status='eq.queued',select='lead_id',limit=3); ids=[x['lead_id'] for x in q]
r=f.run('herald','outreach',lambda: f.herald_send(ids)); print('send_outreach ->',r['status'],'|',r['summary'])
EOF
.venv/bin/python -c "import server; print('mcp tools ok')"