#!/usr/bin/env bash
#
# prod-bootstrap.sh — make the production box come back on its own after a
# reboot, and keep serving if a process dies.
#
# Run as root on the prod VPS, from the repo checkout:
#
#     bash scripts/prod-bootstrap.sh
#
# Idempotent: safe to run any number of times, and safe to run while the site is
# serving. It changes boot/persistence configuration only — it does not deploy,
# rebuild, or restart anything that is already healthy.
#
# Why this exists
# ---------------
# The 2026-08 outage was a host-level failure (the VM was off), so nothing on the
# box could have prevented it. But it exposed that recovery was entirely manual:
# nothing guaranteed pm2, cloudflared and mongod would come back when the VM
# finally did. A box that boots into a dead stack turns a 10-minute host blip
# into an outage that lasts until a human notices. See docs/runbook-outage.md.
#
# What it arms
#   1. pm2 resurrects the saved process list on boot (systemd unit + pm2 save)
#   2. cloudflared runs as an enabled systemd service (no tunnel = error 1033,
#      which is exactly what visitors saw during the outage)
#   3. mongod + redis (if local) are enabled at boot
#   4. a local watchdog that restarts the API if it stops answering /health,
#      covering the "process is alive but wedged" case pm2 cannot see

set -uo pipefail

API_PORT="${API_PORT:-3529}"
APP_PORT="${APP_PORT:-3312}"
REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# Does a systemd unit file exist for this service?
#
# Deliberately pipe-free. The obvious `systemctl list-unit-files | grep -q ...`
# is WRONG under `set -o pipefail`: grep -q exits the moment it matches,
# systemctl dies of SIGPIPE with status 141, and pipefail reports the pipeline as
# FAILED precisely when the unit was found. That inverted every check here and
# made a fully configured box report cloudflared/mongod/redis as "not installed".
has_unit() { systemctl cat "$1.service" >/dev/null 2>&1; }

ok()   { printf '  \033[32m✓\033[0m %s\n' "$*"; }
warn() { printf '  \033[33m!\033[0m %s\n' "$*"; }
bad()  { printf '  \033[31m✗\033[0m %s\n' "$*"; }
head_() { printf '\n\033[1m%s\033[0m\n' "$*"; }

if [ "$(id -u)" -ne 0 ]; then
  echo "Run as root (systemd units and boot config are being changed)." >&2
  exit 1
fi
if ! command -v systemctl >/dev/null 2>&1; then
  echo "No systemd on this host; nothing here applies." >&2
  exit 1
fi

# The deploy prepends /usr/local/bin for node 24; match it so pm2 resolves to the
# same runtime the app was built against.
export PATH=/usr/local/bin:$PATH

head_ "0. Environment"
command -v node >/dev/null 2>&1 && ok "node $(node -v)" || bad "node not on PATH"
command -v pm2  >/dev/null 2>&1 && ok "pm2 $(pm2 -v 2>/dev/null)" || bad "pm2 not on PATH"
ok "repo: $REPO_DIR"

# ---------------------------------------------------------------- 1. pm2 boot
head_ "1. pm2 resurrect on boot"
if command -v pm2 >/dev/null 2>&1; then
  # `pm2 startup` writes/refreshes the systemd unit. Running it again on an
  # already-configured box is a no-op refresh, which is why this is safe to rerun.
  pm2 startup systemd -u root --hp /root >/dev/null 2>&1 && ok "pm2 systemd unit installed" \
    || warn "pm2 startup returned non-zero (often already installed)"

  # THE step people forget. Without `pm2 save`, the unit boots pm2 with an EMPTY
  # process list: pm2 is "running" and every app is gone.
  # Count by parsing the list, not by counting `"pm_id"` occurrences — that key
  # appears twice per app (top level and inside pm2_env), so it reported double.
  APP_COUNT=$(pm2 jlist 2>/dev/null | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{console.log(JSON.parse(s).length)}catch(e){console.log("?")}})' 2>/dev/null || echo "?")

  if pm2 save >/dev/null 2>&1; then
    ok "process list saved (${APP_COUNT} apps) -> /root/.pm2/dump.pm2"
  else
    bad "pm2 save failed — pm2 will boot with no apps"
  fi

  systemctl is-enabled pm2-root >/dev/null 2>&1 && ok "pm2-root enabled at boot" \
    || { systemctl enable pm2-root >/dev/null 2>&1 && ok "pm2-root enabled" || bad "could not enable pm2-root"; }
else
  bad "pm2 missing — skipping"
fi

# -------------------------------------------------------------- 2. cloudflared
head_ "2. Cloudflare Tunnel (cloudflared)"
if has_unit cloudflared; then
  systemctl is-enabled cloudflared >/dev/null 2>&1 && ok "enabled at boot" \
    || { systemctl enable cloudflared >/dev/null 2>&1 && ok "enabled at boot" || bad "could not enable"; }
  systemctl is-active cloudflared >/dev/null 2>&1 && ok "running" \
    || { systemctl start cloudflared >/dev/null 2>&1 && ok "started" || bad "could not start"; }

  # A tunnel that dies and stays dead is a full outage (Cloudflare error 1033),
  # so it must restart itself rather than wait for a human. `on-failure` is NOT
  # good enough here: cloudflared exiting 0 (a refused token, a config reload it
  # does not like) would be treated as a clean shutdown and left down forever.
  CF_RESTART=$(systemctl show cloudflared -p Restart --value 2>/dev/null || echo "")
  if [ "$CF_RESTART" = "always" ]; then
    ok "auto-restart: always"
  else
    mkdir -p /etc/systemd/system/cloudflared.service.d
    cat > /etc/systemd/system/cloudflared.service.d/override.conf <<'UNIT'
[Service]
Restart=always
RestartSec=5s
UNIT
    systemctl daemon-reload
    ok "auto-restart override installed (was '${CF_RESTART:-unset}', now always)"
  fi
elif command -v cloudflared >/dev/null 2>&1; then
  warn "cloudflared installed but NOT a systemd service — it will not survive a reboot."
  warn "Install it as one:  cloudflared service install <TUNNEL_TOKEN>"
else
  bad "cloudflared not installed — the public hostnames cannot work without it"
fi

# ------------------------------------------------------------- 3. data engines
head_ "3. Data services"
for svc in mongod redis-server; do
  if has_unit "$svc"; then
    systemctl is-enabled "$svc" >/dev/null 2>&1 && ok "$svc enabled at boot" \
      || { systemctl enable "$svc" >/dev/null 2>&1 && ok "$svc enabled at boot" || bad "could not enable $svc"; }
    systemctl is-active "$svc" >/dev/null 2>&1 && ok "$svc running" || bad "$svc NOT running"
  else
    warn "$svc not a local service here (remote/managed?) — skipping"
  fi
done

# ---------------------------------------------------------------- 4. watchdog
head_ "4. API watchdog"
# pm2 restarts a process that EXITS. It cannot see a process that is alive but
# wedged (event loop blocked, mongo pool exhausted, socket leak) — from pm2's
# view that is a healthy app serving nothing. This closes that gap by asking the
# app the same question the uptime monitor asks, and restarting it if it will not
# answer twice in a row. Two strikes, so one slow response is not a restart loop.
cat > /usr/local/bin/warframe-watchdog.sh <<WATCHDOG
#!/usr/bin/env bash
set -uo pipefail
export PATH=/usr/local/bin:\$PATH
STATE=/var/tmp/warframe-watchdog.strikes
CODE=\$(curl -s -o /dev/null --max-time 15 -w '%{http_code}' "http://127.0.0.1:${API_PORT}/health" || true)
if [ "\$CODE" = "200" ]; then
  echo 0 > "\$STATE"
  exit 0
fi
STRIKES=\$(( \$(cat "\$STATE" 2>/dev/null || echo 0) + 1 ))
echo "\$STRIKES" > "\$STATE"
logger -t warframe-watchdog "health check returned '\$CODE' (strike \$STRIKES)"
if [ "\$STRIKES" -ge 2 ]; then
  logger -t warframe-watchdog "restarting warframe-server"
  pm2 restart warframe-server >/dev/null 2>&1 || true
  echo 0 > "\$STATE"
fi
WATCHDOG
chmod +x /usr/local/bin/warframe-watchdog.sh
ok "watchdog installed -> /usr/local/bin/warframe-watchdog.sh"

CRON_LINE="*/2 * * * * /usr/local/bin/warframe-watchdog.sh"
# Same pipe-free reasoning as has_unit(): `crontab -l | grep -q` under pipefail
# reports failure exactly when the entry IS already there, which would append a
# duplicate watchdog line on every run.
CRONTAB_NOW=$(crontab -l 2>/dev/null || true)
if [ "${CRONTAB_NOW#*warframe-watchdog.sh}" != "$CRONTAB_NOW" ]; then
  ok "cron entry already present"
else
  printf '%s\n%s\n' "$CRONTAB_NOW" "$CRON_LINE" | grep -v '^$' | crontab -
  ok "cron entry added (every 2 minutes)"
fi

# ----------------------------------------------------------------- 5. verify
head_ "5. Verification"
API_CODE=$(curl -s -o /dev/null --max-time 15 -w '%{http_code}' "http://127.0.0.1:${API_PORT}/health" || echo 000)
APP_CODE=$(curl -s -o /dev/null --max-time 20 -w '%{http_code}' "http://127.0.0.1:${APP_PORT}/" || echo 000)
[ "$API_CODE" = "200" ] && ok "API  127.0.0.1:${API_PORT}/health -> 200" || bad "API  127.0.0.1:${API_PORT}/health -> ${API_CODE}"
[ "$APP_CODE" = "200" ] && ok "App  127.0.0.1:${APP_PORT}/ -> 200"       || bad "App  127.0.0.1:${APP_PORT}/ -> ${APP_CODE}"

PUB=$(curl -s -o /dev/null --max-time 20 -w '%{http_code}' https://warframe.digitalshopuy.com/health || echo 000)
[ "$PUB" = "200" ] && ok "Public https://warframe.digitalshopuy.com/health -> 200" \
  || bad "Public /health -> ${PUB} (origin is fine locally; the tunnel or Cloudflare is not)"

head_ "Done"
echo "  Reboot test (the only proof that matters):  reboot  → wait → curl https://warframe.digitalshopuy.com/health"
