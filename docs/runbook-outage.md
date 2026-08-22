# Runbook — production is down

The public stack is two hostnames on one box, reached through a Cloudflare
Tunnel. Anything that kills the box, the tunnel, or pm2 takes both hostnames
down at once.

```
visitor ──► Cloudflare edge ──► [Worker: edge cache + outage shield]
                                      │
                                      ▼
                          Cloudflare Tunnel (cloudflared)
                                      │
                          prod VPS 167.148.41.11 (InterServer)
                            ├─ pm2 warframe-server   :3529   API
                            ├─ pm2 warframe-app      :3312   Nuxt SSR
                            ├─ pm2 warframe-sync-*           importers
                            └─ mongod                :27017
```

Redis lives on **separate** boxes (`104.234.204.107`, `147.93.146.232`), so a
prod-box outage does not take the cache layer with it.

---

## 1. Identify which layer is broken

Run this from anywhere:

```bash
curl -sI https://warframe.digitalshopuy.com/health | head -3
curl -s   https://warframe.digitalshopuy.com/health
ssh warframe167 'pm2 status; systemctl is-active cloudflared mongod'
```

| Symptom | Layer | Go to |
| --- | --- | --- |
| `530` + body says **Cloudflare Tunnel error / 1033** | tunnel or box | §2 |
| `521` / `522` / `523` | box up, service or firewall down | §3 |
| `503` + `x-edge-cache: OFFLINE` | origin down, shield answering | §2 |
| `200` + `x-edge-cache: STALE-ON-ERROR` | origin down, visitors served stale | §2 |
| `200` + `{"ok":false,"mongo":"down"}` | API up, mongo down | §3 |
| `200` + `{"ok":true}` but a page is broken | app bug, not infra | normal debugging |

**`x-edge-cache` is also how you tell whether the Worker is deployed at all.**
If the header is missing entirely, the Worker is not routed at that hostname —
the new Worker tags every response it handles.

## 2. The box or the tunnel is gone

```bash
ping -c3 167.148.41.11
ssh warframe167 'uptime'
```

**SSH times out and ping fails → the VM itself is not running.** Nothing on the
box can be fixed remotely, and no amount of config would have prevented it.
Check the host:

1. **InterServer control panel** (<https://my.interserver.net>) → VPS → is it
   *powered off*, is the node under *maintenance*, is the account *suspended*?
2. Powered off → power it on. Node under maintenance → **open a ticket and ask
   to be migrated to a healthy node** rather than waiting out the repair.
3. Sanity check that it is your VM and not the whole datacentre: pick another
   address in the same `/24` and probe it. If `167.148.41.5:22` answers and
   yours does not, the network is fine and the VM is the problem.
4. Both `167.148.41.10` and `.11` dark at once usually means one host node or an
   account-level suspension — mention both IPs in the ticket.

**SSH works → the tunnel is the problem:**

```bash
ssh warframe167 'systemctl status cloudflared --no-pager | head -20'
ssh warframe167 'systemctl restart cloudflared && sleep 5 && systemctl is-active cloudflared'
```

Once the box is back, re-arm boot persistence and verify:

```bash
ssh warframe167 'cd /path/to/repo && bash scripts/prod-bootstrap.sh'
```

## 3. Box is up, service is down

```bash
ssh warframe167 'pm2 status'
ssh warframe167 'pm2 logs warframe-server --lines 60 --nostream'
ssh warframe167 'curl -s localhost:3529/health'
ssh warframe167 'pm2 restart warframe-server warframe-app'
```

If `pm2 status` is **empty** after a reboot, pm2 came up without its saved
process list. **Do not run `pm2 save` in that state** — it overwrites
`/root/.pm2/dump.pm2` with the empty list and destroys the saved definitions for
every app on the box. Recover with:

```bash
cp /root/.pm2/dump.pm2 /root/.pm2/dump.pm2.bak-$(date +%F-%H%M)   # first
pm2 resurrect                                                     # then
```

Then find out why it did not resurrect itself:

```bash
journalctl -u pm2-root -b --no-pager | tail -30
ls -la /etc/systemd/system/multi-user.target.wants/ | grep pm2   # more than one?
```

Two pm2 units enabled at boot is a fight over the same `PM2_HOME`, not
redundancy. `scripts/prod-bootstrap.sh` detects and unlinks the loser.

Mongo down: `systemctl status mongod`, check disk with `df -h` (a full disk stops
mongod and is a common silent cause).

---

## What now protects this, and what each layer does not do

| Layer | Covers | Does **not** cover |
| --- | --- | --- |
| `cloudflare/worker.js` — edge cache + outage shield | Visitors keep seeing the last good data for **7 days** after the origin dies; a branded offline page instead of Cloudflare's 1033 when even that is gone | Writes and `/me` (per-user, never cached). Data is frozen while it is engaged. |
| `.github/workflows/uptime.yml` — uptime monitor | Detects origin death **within ~10-20 min** and opens a GitHub issue; runs on GitHub, not on the box | It only tells you. Recovery is manual. |
| `scripts/prod-bootstrap.sh` — boot resilience | A reboot brings pm2 + cloudflared + mongod back on its own; a wedged API is restarted by the watchdog | A VM that is powered off at the host. |
| `deploy.yml` smoke check | A deploy that builds but cannot serve fails the run instead of silently shipping | Anything after the deploy finishes. |
| `/health` (uncached) | Truthful liveness for the monitor, watchdog and smoke check | — |

**None of these can keep the site up if the VM is off.** They shorten the outage
(you learn in minutes, not days), soften it (visitors see data, not an error),
and make recovery automatic once the box returns. Genuinely surviving a dead
host needs a second origin — see below.

### Deploying the Worker (do this once; it is not automated)

The Worker is **not** deployed by CI. After editing `cloudflare/worker.js`:

1. Cloudflare dashboard → **Workers & Pages** → the worker → **Quick edit** →
   paste `cloudflare/worker.js` → **Deploy**.
2. **Routes** — it must be attached to *both* hostnames, or the one that is
   missing has no protection at all:
   - `warframe.digitalshopuy.com/*`
   - `warframe-app.digitalshopuy.com/*`
3. Verify: `curl -sI https://warframe.digitalshopuy.com/health | grep -i x-edge-cache`
   must return a value. No header = not routed.
4. Do **not** also run the dashboard Cache Rule from `cloudflare-cache.md` on the
   same paths — one or the other.

Also turn on **Caching → Configuration → Always Online**, a free second net that
serves an Internet Archive snapshot if everything else fails.

### If you need to survive a dead host

Not built. The shape it would take:

- A warm standby origin on a different provider (`147.93.146.232` is the best
  candidate: 94 GB RAM, ~170 GB free, mongod 8, pm2 and cloudflared already
  installed — it needs node 24).
- Mongo is the hard part: it is local to the prod box, so a standby starts empty
  and must re-run `sync_items` / `sync_prices` / `sync_drops` (hours). A replica
  set member on the standby, or a nightly `mongodump` shipped off-box, is the
  prerequisite.
- With that in place a failover is: point the tunnel (or DNS) at the standby.

---

## Incident log

**2026-08-21 — prod VPS offline at the host.** Both hostnames served Cloudflare
error 1033 for days. Root cause: the VM at `167.148.41.11` was not running —
InterServer node maintenance; the neighbouring `.10` was down with it, while
`167.148.41.5` in the same `/24` answered normally, and the last deploy
(2026-07-29) had succeeded. Nothing detected it; it was found by hand. The edge
Worker's stale backup was capped at 24h and had long expired, and it was never
routed at the frontend hostname at all. Everything in the table above was built
in response.

**2026-08-22 — the box came back and the stack did not.** The host finished
maintenance and the VM booted with cloudflared and mongod healthy, so the tunnel
was up and both hostnames returned `502`: nothing was listening behind it. All
24 pm2 apps were down.

Cause: the only pm2 unit wired to boot was a 2021-vintage
`pm2-debian10.service` with `User=debian10` but `Environment=PM2_HOME=/root/.pm2`
— a combination pm2 cannot run. It died with `TypeError: Cannot read properties
of undefined (reading 'uid')`, systemd retried 5 times, hit "Start request
repeated too quickly", and gave up. `pm2-root.service` did not exist, so nothing
else tried. The apps were never coming back without a human.

Fixed by `pm2 resurrect` from the intact dump, then `scripts/prod-bootstrap.sh`
to install `pm2-root.service`, unlink the broken unit, and raise cloudflared from
`Restart=on-failure` to `Restart=always`. Note this second incident was invisible
to the edge shield: the tunnel was healthy, so Cloudflare had a live origin
returning `502` — which is exactly the case the uptime monitor's `/health` probe
catches and a "is the site loading" check does not.
