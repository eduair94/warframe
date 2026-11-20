/**
 * pm2 entry (sync host): local SOCKS5 front that fails over between the
 * warframe.market egresses (services/SocksFailover.ts).
 *
 *   WFM_EGRESS_FAILOVER_UPSTREAMS  "pc=127.0.0.1:27040,gsearch=127.0.0.1:27028" (tried in order)
 *   WFM_EGRESS_FAILOVER_LISTEN     "127.0.0.1:27030" (default)
 *   WFM_PROXY_URL                  "socks5h://127.0.0.1:27030" so every WFM caller uses it
 *
 * Registered by ecosystem.egress.config.js only when the upstream list is set.
 * See docs/runbook-outage.md §4 ("Temporary PC egress").
 */
import "./env";
import { SocksFailover, parseListen, parseUpstreams } from "./services/SocksFailover";

const stamp = () => new Date().toISOString().replace("T", " ").split(".")[0];
const log = (message: string) => console.log(`[${stamp()}] ${message}`);
const int = (value: string | undefined, fallback: number, min: number) => {
  const n = parseInt(value || "", 10);
  return Number.isFinite(n) ? Math.max(min, n) : fallback;
};

async function main() {
  const upstreams = parseUpstreams(process.env.WFM_EGRESS_FAILOVER_UPSTREAMS);
  if (!upstreams.length) throw new Error("WFM_EGRESS_FAILOVER_UPSTREAMS is empty");
  const listen = parseListen(process.env.WFM_EGRESS_FAILOVER_LISTEN);
  const failover = new SocksFailover({
    upstreams,
    greetingTimeoutMs: int(process.env.WFM_EGRESS_FAILOVER_TIMEOUT_MS, 4_000, 500),
    cooldownMs: int(process.env.WFM_EGRESS_FAILOVER_COOLDOWN_MS, 60_000, 5_000),
    log,
  });
  await failover.listen(listen.port, listen.host);
  log(`egress failover listening on ${listen.host}:${listen.port} -> ` +
    upstreams.map((u) => `${u.name}=${u.host}:${u.port}`).join(", "));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
