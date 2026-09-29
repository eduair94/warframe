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

1. **Provider status page first: <https://status.vshield.com/>.** The VDS runs on
   vShield's network. A "Network outage — VDS USA" incident listing NY/LA nodes
   as *Host unreachable* means the VM is fine and only its network is gone —
   there is nothing to fix on our side (2026-09-29 incident below).
2. **InterServer control panel** (<https://my.interserver.net>) → VPS → is it
   *powered off*, is the node under *maintenance*, is the account *suspended*?
   Caveat: **"Running" only means the hypervisor process is up**, and during a
   node network outage the panel's *Restart* never reaches the guest (the VM
   kept 38 days of uptime through a "restart" on 2026-09-29).
3. Powered off → power it on. Node under maintenance → **open a ticket and ask
   to be migrated to a healthy node** rather than waiting out the repair.
4. Sanity check from inside the datacentre: `.10` (`ssh build`, port 2223) has
   sat on a different node in both incidents. From there, an ARP probe tells a
   dead guest/network from a firewall:
   ```bash
   ssh build 'ip neigh flush 167.148.41.11; ping -c2 -W2 167.148.41.11; ip neigh show 167.148.41.11'
   ```
   `FAILED` / `INCOMPLETE` = nothing answering at layer 2 (VM off, hung, or its
   node's network down). `REACHABLE` with ports closed = guest up, services or
   firewall down → §3.
5. Both `167.148.41.10` and `.11` dark at once usually means one host node or an
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

A **cold standby** exists on `box147` (`147.93.146.232`, different provider),
prepared during the 2026-09-29 outage and then stopped. Everything lives under
`/opt/warframe-standby/` and nothing is registered with that box's pm2 while
idle:

| Path | What |
| --- | --- |
| `repo/` | shallow clone of `main`, built (`dist/` + `app/.output/`) |
| `repo/.env` | standby env — `MONGODB_URI=…127.0.0.1:27018`, `PROXY_LESS=true`, **no `REDIS_URL`** |
| `db/` | data dir of an isolated mongod on `127.0.0.1:27018` (box147's own mongod on 27017 is someone else's, auth-protected) |
| `ecosystem.standby.config.js` | pm2 apps named `warframe-standby-*`, Node 24 via `/root/.nvm` |

Bring it up:

```bash
ssh box147
cd /opt/warframe-standby/repo && git pull --ff-only && export PATH=/root/.nvm/versions/node/v24.21.0/bin:$PATH \
  && npm ci && npm run build; (cd app && npm ci && npm run build)   # tsc may exit 1 on an app/ file — it still emits dist/
cd /opt/warframe-standby && pm2 start ecosystem.standby.config.js --only warframe-standby-mongod
pm2 start ecosystem.standby.config.js --only "warframe-standby-server,warframe-standby-app,warframe-standby-sync-items,warframe-standby-sync-drops,warframe-standby-sync-rivens,warframe-standby-sync-translations"
# after sync-items finishes: warframe-standby-sync-prices, warframe-standby-sync-foundry
```

Gotchas learned bringing it up (build ~10 min; data refresh ~40 min items +
~35 min prices on an empty db):

- **Keep it off prod Redis.** box147 *hosts* one of prod's Redis instances; a
  standby with an empty db writing through `CacheService` would poison the
  shared cache for when the real origin returns.
- **Proxyless → throttle the price sync.** The proxy pool
  (`localhost:3030/proxy_list`) lives on the prod box. `sync_prices` defaults to
  `CONCURRENCY=50` and 429-storms warframe.market without it; the standby
  ecosystem pins `CONCURRENCY=3 MIN_DELAY=300 MAX_DELAY=600` (~1.9 items/s).
- **No accounts — same as prod today.** As of 2026-09-29 the prod `.env` has no
  `FIREBASE_*` vars either, so `/me*` answers `503 {"error":"auth disabled"}`
  on both; the app is local-first and degrades. Once Firebase is configured on
  prod, copy the same vars into the standby `.env`.

**Failover** (not yet exercised): Cloudflare Zero Trust → Networks → Tunnels →
the warframe tunnel → copy the connector token, then on box147
`pm2 start cloudflared --name warframe-standby-tunnel -- tunnel --no-autoupdate run --token <token>`.
A second connector on the same tunnel shares traffic with the prod connector,
so **delete `warframe-standby-tunnel` the moment `.11` answers again** —
otherwise visitors are split across two databases. Stand down with
`pm2 delete` on every `warframe-standby-*` app; keep `db/` so the next bring-up
starts warm.

Still missing for a *real* failover: a replica-set member or nightly
`mongodump` shipped off-box (accounts, portfolios and alerts exist only in the
prod db).

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

**2026-09-29 — provider network outage (~2h20m).** Both hostnames served `530` /
error 1033 from ~05:23 to 07:43 UTC. The uptime monitor opened issue #4 at 05:25
UTC, two minutes in. Root cause: vShield "Network outage — VDSPRO & VDS USA"
(Major, ~62 NY/LA nodes *Host unreachable* since 05:23 UTC). `.11` did not answer
ARP even from `.10` on the same `/24`, while `.10` sat on an unaffected node. The
InterServer panel showed the VM as *Running* throughout, and its *Restart* never
reached the guest: `.11` came back with 38 days of uptime, cloudflared, mongod
and all 25 pm2 apps still up, so no recovery steps were needed. A cold standby
was built on box147 during the outage (section above) but traffic was never
switched: no Cloudflare credentials were on hand for the tunnel token, and the
edge Worker was still not routed (responses carried no `x-edge-cache`), so
visitors got the raw 1033 page rather than stale data.
