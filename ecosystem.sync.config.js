// pm2 apps for the warframe.market SYNC HOST (currently `.10`, 167.148.41.10).
//
// Since 2026-10-02 Cloudflare challenges the API host's IP (167.148.41.11) on
// api.warframe.market. The syncs that call warframe.market run here instead,
// paced under the documented 3 requests/second together with the API/live
// callers sharing WFM_PROXY_URL's fixed egress, and write to the prod
// database through an SSH tunnel (warframe-offbox-tunnel). The API host parks
// its own copies with WFM_SYNC_ENABLED=false in its .env (services/WfmSyncGuard.ts).
// drops/foundry/live stay on the API host: drops and foundry read WFCD/GitHub,
// live serves the app's socket.
//
// Start (on the sync host, from the repo checkout):
//   export WFM_SYNC_NODE=$(. ~/.nvm/nvm.sh && nvm which 24)
//   pm2 start ecosystem.sync.config.js && pm2 save
// The tunnel key must be authorized on the API host for port-forwarding only;
// see docs/runbook-outage.md §4.
const egress = require("./ecosystem.egress.config.js");
const NODE = process.env.WFM_SYNC_NODE || "node";
const TUNNEL_TARGET = process.env.WFM_DB_TUNNEL_TARGET || "debian10@167.148.41.11";
const TUNNEL_KEY = process.env.WFM_DB_TUNNEL_KEY || "/root/.ssh/warframe_db_tunnel";
const TUNNEL_PORT = process.env.WFM_DB_TUNNEL_PORT || "27027";

const env = (rps) => ({
  MONGODB_URI: `mongodb://127.0.0.1:${TUNNEL_PORT}/warframe`,
  WFM_MAX_RPS: String(rps),
  PROXY_LESS: "true",
  WFM_PROXY_URL: process.env.WFM_PROXY_URL || "",
  WFM_SYNC_ENABLED: "true",
});
const app = (name, script, rps, extra = {}) => ({
  name: `warframe-offbox-${name}`,
  script,
  interpreter: NODE,
  log_date_format: "YYYY-MM-DD HH:mm Z",
  env: env(rps),
  ...extra,
});

module.exports = {
  apps: [
    ...egress.apps,
    {
      // Local 127.0.0.1:27027 -> API host's mongod (127.0.0.1:27017). autossh
      // with -M 0 relies on ServerAlive to notice a dead link; pm2 restarts it
      // if it exits.
      name: "warframe-offbox-tunnel",
      script: "autossh",
      interpreter: "none",
      args: [
        "-M", "0", "-N",
        "-o", "ServerAliveInterval=15",
        "-o", "ServerAliveCountMax=3",
        "-o", "ExitOnForwardFailure=yes",
        "-o", "StrictHostKeyChecking=accept-new",
        "-i", TUNNEL_KEY,
        "-L", `127.0.0.1:${TUNNEL_PORT}:127.0.0.1:27017`,
        TUNNEL_TARGET,
      ],
      env: { AUTOSSH_GATETIME: "0" },
      autorestart: true,
      restart_delay: 5000,
    },
    app("sync-prices", "dist/sync_prices.js", 1.2, { autorestart: true, restart_delay: 10000 }),
    app("sync-auctions", "dist/sync_auctions.js", 0.1, { autorestart: true, restart_delay: 10000 }),
    app("sync-items", "dist/sync_items.js", 0.15, { autorestart: false, cron_restart: "0 0 * * *" }),
    app("sync-rivens", "dist/sync_rivens.js", 0.15, { autorestart: false, cron_restart: "0 0 * * 0" }),
    app("sync-translations", "dist/sync_translations.js", 0.15, { autorestart: false, cron_restart: "0 4 * * *" }),
    app("sync-repair-sets", "dist/sync_repair_sets.js", 0.15, { autorestart: false, cron_restart: "30 5 * * *" }),
  ],
};
