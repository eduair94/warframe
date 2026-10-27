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
| Site up, but prices "updated N days ago" | warframe.market refusing us | §4 |

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

## 4. Site is up, prices are frozen

The site serves the last stored prices, so a dead upstream looks like "updated
N days ago", not an error.

```bash
ssh warframe167 'mongo --quiet warframe --eval "db.getCollection(\"warframe-items\").find().sort({priceUpdate:-1}).limit(1).forEach(d=>print(d.priceUpdate))"'
ssh warframe167 'pm2 logs warframe-sync-prices --lines 30 --nostream'
ssh warframe167 'curl -s -o /dev/null -w "%{http_code} cf=%header{cf-mitigated}
" -H "User-Agent: Mozilla/5.0" https://api.warframe.market/v2/orders/item/ash_prime_set'
```

- `403 cf=challenge` → Cloudflare is challenging this IP. warframe.market allows
  **3 requests/second per client** and escalates excess to challenges and
  blocks. Every process paces itself (`services/WfmRateLimiter.ts`, budgets in
  `ecosystem.config.js`) and pauses 15 min on a challenge, so the syncs resume
  on their own once the block lifts. Look for a process exceeding its budget
  before anything else. Do **not** re-enable proxy rotation or raise
  `CONCURRENCY` to push through. A verified fixed egress is supported with
  `WFM_PROXY_URL`, retaining the same request budgets and breaker (see below).
- `403` with body `Deprecated` → a retired v1 endpoint. Move that call to v2.
- Log line `⛔ warframe.market Cloudflare challenge … pausing all requests until …`
  = the breaker is open; fix the traffic source or the configured egress. A
  process that is online but repeatedly challenged is not a successful sync.

### The sync host (`.10`)

Since 2026-10-11 the syncs that call warframe.market (prices, auctions, items,
rivens, translations, repair-sets) run on `.10` (`ssh build`, root, port 2223)
from `/opt/warframe-sync`, under `ecosystem.sync.config.js` (pm2 names
`warframe-offbox-*`), at the same per-IP budget. They write to the prod
database through `warframe-offbox-tunnel`: autossh with the dedicated key
`/root/.ssh/warframe_db_tunnel`, authorized in debian10's `authorized_keys` on
`.11` as `restrict,port-forwarding,permitopen="127.0.0.1:27017",command="/bin/false"`
(no shell, Mongo only). The API host parks its copies with
`WFM_SYNC_ENABLED=false` in its `.env`; drops, foundry and live stay there.

```bash
ssh build 'pm2 ls | grep offbox; pm2 logs warframe-offbox-sync-prices --lines 20 --nostream'
# update after a deploy that touches sync code:
ssh build 'cd /opt/warframe-sync && git pull --ff-only && export PATH=$(dirname $(. ~/.nvm/nvm.sh && nvm which 24)):$PATH && npm ci && npm run build && pm2 startOrRestart ecosystem.sync.config.js --update-env && pm2 save'
```

To move the syncs back to `.11` (block lifted): `ssh build 'pm2 delete
ecosystem.sync.config.js && pm2 save'`, remove `WFM_SYNC_ENABLED=false` from
`.11`'s `.env`, then `pm2 restart` the six syncs there. Never run both copies:
two price syncs would double the request rate.

### Fixed egress recovery (2026-10-23)

The sync host also started receiving Cloudflare challenges on October 18.
Both direct IPs and sampled authenticated pool proxies failed. The database
tunnel and processes stayed healthy, but no price updates were saved for five
days. The owned `box83` host could still fetch both v2 orders and v1 statistics.

The API and sync hosts now use a dedicated, loopback-only SOCKS tunnel to
`box83` (`83.147.54.179`). `ecosystem.egress.config.js` registers
`warframe-egress-proxy`; SSH keepalives and PM2 restart it after a disconnect.
Each host has its own `/root/.ssh/warframe_wfm_egress` key. On the egress host,
each public key is authorized with:

```
restrict,port-forwarding,permitopen="api.warframe.market:443",command="/bin/false" <public-key>
```

Set in each caller host's private `.env`:

```dotenv
WFM_PROXY_URL=socks5h://127.0.0.1:27028
WFM_EGRESS_SSH_TARGET=root@83.147.54.179
WFM_EGRESS_SSH_KEY=/root/.ssh/warframe_wfm_egress
WFM_EGRESS_PORT=27028
WFM_V1_STATS=true
```

`socks5://` is also accepted and normalized to remote DNS, preserving the SSH
hostname restriction. Only `api.warframe.market` uses this fixed proxy. WFCD
and GitHub requests retain their existing transport. A failed tunnel never
falls back to the blocked direct IP. Keep the rotating pool disabled.

The two hosts share one upstream budget: prices 1.2 RPS, auctions 0.1, live
0.5, API 0.3, and four WFM one-shots at 0.15 each, totaling at most 2.7 RPS.
The API host's WFM syncs must remain parked. Rates include retries and statistics.
`WFM_V1_STATS=true` restores real 48-hour volume and averages; only enable it
after a successful JSON response from that endpoint, since access may differ
by egress. Do not treat a new orders timestamp as proof statistics refreshed.

After deploying, update/build the sync host too with the command above. Verify
both transports through the tunnel, then confirm advancing stored timestamps:

The production TypeScript build excludes test files and fixtures. The sync
host only needs root dependencies; frontend-only Vue test imports must not
force installing or building Nuxt there. Jest still uses the base tsconfig.

```bash
ssh build 'curl --socks5-hostname 127.0.0.1:27028 -s -o /dev/null -w "%{http_code}\n" https://api.warframe.market/v2/orders/item/ash_prime_set'
ssh build 'pm2 logs warframe-offbox-sync-prices --lines 12 --nostream'
curl -s https://warframe.digitalshopuy.com/health
```

Inspect several catalogue rows and their `market.last_completed` too. The
sync processes oldest prices first, so a five-day backlog needs a full sweep;
`/health` reports the newest update, not coverage of the whole catalogue.

### Egress challenged too (2026-10-25) — the 429s were the warning

Prices stopped at 2026-10-25 16:37 UTC: Cloudflare challenged `box83`, two
days after the cutover. Both earlier blocks had the same precursor. The
auctions sync's v1 `/auctions/search` answered **~1,000 429s per day** at its
0.3 RPS budget (Oct 14–18 on `.10`, Oct 23–25 through `box83`). Prices
rarely got one. Each 429 cost a 5 s pause and was retried up to 25 times
(5 client attempts × 5 `syncSingleRiven` attempts). After a few days of that,
Cloudflare escalated to a challenge for the whole IP, and every caller on it
stopped, prices included.

Now a 429 halves the caller's rate and pauses it 30 s, doubling per further
429 (`WfmRateLimiter.rateLimited`); successes slowly restore it. Auctions run
at 0.1 RPS. Count 429s before trusting a new egress:

```bash
ssh build 'grep -c " 429 " /root/.pm2/logs/warframe-offbox-sync-*-out.log'
```

A steady stream of 429s means a block is coming; a handful per day is fine.
Moving the syncs to yet another IP while they still draw 429s just loses that
IP too. When every egress is challenged, the breakers probe once per 15
minutes and resume on their own once warframe.market lifts the challenge.

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
3. Verify with a GET (HEAD requests bypass the Worker):
   `curl -sD - -o /dev/null https://warframe.digitalshopuy.com/health | grep -i x-edge-cache`
   must return `BYPASS` because health is uncached. No header = not routed.
4. Do **not** also run the dashboard Cache Rule from `cloudflare-cache.md` on the
   same paths — one or the other.

The Worker retains outage backups for seven days, but responses served from a
backup (`x-edge-cache: STALE-ON-ERROR`) send `Cache-Control: no-store`. The long
retention applies only inside the Worker; browsers must retry when the origin
recovers. This also applies to backups written before the header fix. Verify
both outage paths without interrupting production:
`npm test -- --runInBand cloudflare/worker.test.ts`.

Every origin subrequest uses `fetch(request, { cache: "no-store" })`, including
private requests and fail-open recovery. This bypasses a second CDN cache while
the Worker retains its own explicit fresh/backup cache. It prevents an old
dashboard Cache Rule from feeding stale data back into a Worker cache miss;
recovery no longer depends on editing that rule or purging the entire zone.

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

**2026-10-02 → 2026-10-11 — prices frozen, warframe.market blocked us.** The
site stayed up, but no price was updated after 2026-10-02 18:13 UTC; noticed
9 days later. Two causes. (1) Our own traffic: `sync-prices` ran 50 parallel
requests rotated over ~3,500 ProxyScrape IPs with 5 retries each, `warframe-live`
polled ~50 req/s (150 items every 3 s, 10 retries), `sync-auctions` retried
too. warframe.market documents 3 req/s; Cloudflare started answering the prod IP
and the whole proxy pool with managed challenges (`cf-mitigated: challenge`),
while untouched IPs (`.10`, box147) still got 200. Our client labelled every
403 "Cloudflare block" and kept retrying, which kept the block fresh (25k pm2
restarts of sync-prices). (2) The v1 `/items/{slug}/statistics` endpoint now
answers third-party clients with `403 Deprecated`; v2 has no replacement.
Fix: stopped the three processes, then shipped a per-process limiter + breaker
for every warframe.market call (axios and undici), no retries on a challenge or
a plain 403, proxyless pacing budgets in `ecosystem.config.js`, price-sync
concurrency 50 → 4, and v1 statistics off by default (`WFM_V1_STATS`), carrying
each item's last stored volume/avg_price forward without using that stale
average to fence live prices.
