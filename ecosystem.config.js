// warframe.market allows 3 requests/second per client (WFM v2 docs) and its
// third-party rules (https://docs.warframe.market/docs/rules/overview/) ask
// clients to identify themselves, minimize calls and prefer incremental
// updates; it restricts data mirrors and browser impersonation. Every egress IP
// that carried our old traffic (a full-catalogue mirror at ~2.7 RPS with spoofed
// browser headers) was Cloudflare-challenged for weeks: prices froze
// 2026-10-02..10-11, 10-18..10-23, 10-25..10-27 and 11-04..11-20.
// Every process paces its warframe.market calls through
// services/WfmRateLimiter.ts at WFM_MAX_RPS and identifies itself honestly
// (services/WfmIdentity.ts). Continuous budget across both hosts' shared
// egress: prices 0.6 (incremental, sync host) + auctions 0.1 + live 0.25 +
// server 0.1 ~= 1 RPS; the nightly one-shots add 0.1-0.15 each.
// auctions/search is a contract endpoint (~10-20 req/min upstream), so 0.1.
// Only one host runs the syncs (WFM_SYNC_ENABLED). PROXY_LESS disables the
// rotating pool for good; WFM_PROXY_URL selects the one fixed egress.
const egress = require("./ecosystem.egress.config.js");
const WFM = (rps) => ({
    WFM_MAX_RPS: String(rps), PROXY_LESS: "true",
    WFM_PROXY_URL: process.env.WFM_PROXY_URL || "",
});

module.exports = {
    apps: [...egress.apps, {
            name: "warframe-sync-prices",
            autorestart: true,
            script: "dist/sync_prices.js",
            env: WFM(0.6),
            log_date_format: "YYYY-MM-DD HH:mm Z",
        },
        {
            name: "warframe-sync-items",
            autorestart: false,
            cron_restart: "0 0 * * *",
            script: "dist/sync_items.js",
            env: WFM(0.15),
            log_date_format: "YYYY-MM-DD HH:mm Z",
        },
        {
            name: "warframe-server",
            autorestart: true,
            script: "dist/server.js",
            env: WFM(0.1),
            log_date_format: "YYYY-MM-DD HH:mm Z",
        },
        {
            // Nuxt 4 (Nitro) frontend (SSR). Build first: `cd app && npm ci &&
            // npm run build`, which emits a self-contained .output/ bundle run
            // directly by node (no `nuxt start`, no --openssl-legacy-provider).
            // NUXT_PUBLIC_API_URL overrides runtimeConfig.public.apiURL at
            // RUNTIME and MUST be the PUBLIC API origin, or the browser would
            // call localhost and every request fails with ERR_CONNECTION_REFUSED
            // (API_URL is kept as the build-time default).
            name: "warframe-app",
            cwd: "./app",
            script: ".output/server/index.mjs",
            interpreter: "node",
            autorestart: true,
            env: {
                NUXT_PUBLIC_API_URL: "https://warframe.digitalshopuy.com",
                API_URL: "https://warframe.digitalshopuy.com",
                SITE_URL: "https://warframe-app.digitalshopuy.com",
                PORT: "3312",
                HOST: "0.0.0.0",
            },
            log_date_format: "YYYY-MM-DD HH:mm Z",
        },
       {
            name: "warframe-sync-auctions",
            autorestart: true,
            script: "dist/sync_auctions.js",
            env: WFM(0.1),
            log_date_format: "YYYY-MM-DD HH:mm Z",
        },
        {
            // Populates/refreshes the riven weapon list that
            // warframe-sync-auctions depends on (getAllRivens) - was
            // previously missing from this file entirely, so on a fresh
            // deploy or DB reset the auctions sync had no weapons to loop
            // over and the endo/plat rivens leaderboard stayed empty.
            name: "warframe-sync-rivens",
            autorestart: false,
            cron_restart: "0 0 * * 0",
            script: "dist/sync_rivens.js",
            env: WFM(0.1),
            log_date_format: "YYYY-MM-DD HH:mm Z",
        },
        {
            // Refreshes the WFCD drop data daily: the drop-data backup (mission
            // rewards + relic contents) that powers the Star Chart, the in-app
            // drop dialog, and the relic EV board's "currently dropping" gate —
            // AND the relic collection behind /relics_ev (buildRelics), so the
            // relic list stays current when Varzia rotates the Prime Resurgence
            // set instead of only refreshing on a manual /build_relics call.
            // WFCD only changes on game patches, so a daily run keeps both
            // collections current without hammering the source.
            name: "warframe-sync-drops",
            autorestart: false,
            cron_restart: "0 3 * * *",
            script: "dist/sync_drops.js",
            env: WFM(0.1),
            log_date_format: "YYYY-MM-DD HH:mm Z",
        },
        {
            // i18n: rebuilds the localized game-noun name dictionaries
            // (warframe-translations collection) that power the multi-language
            // item names + the /i18n/:scope/:lang endpoint. Reuses warframe.market's
            // own localized names (one Language-header list fetch per scope×lang),
            // so it only changes on game/content updates — a daily run (staggered
            // after sync-drops) keeps all 12 non-en locales current without
            // hammering the source.
            name: "warframe-sync-translations",
            autorestart: false,
            cron_restart: "0 4 * * *",
            script: "dist/sync_translations.js",
            env: WFM(0.1),
            log_date_format: "YYYY-MM-DD HH:mm Z",
        },
        {
            // Rebuilds the Foundry mastery/build catalogue (warframe-foundry
            // collection) from WFCD warframe-items and re-links every item and
            // part to its warframe.market url_name using our own item catalogue.
            // That link is what lets /foundry price the gear a player is still
            // missing. Staggered after sync-translations so the market names it
            // matches against are already fresh. Only changes on a game patch.
            name: "warframe-sync-foundry",
            autorestart: false,
            cron_restart: "0 5 * * *",
            script: "dist/sync_foundry.js",
            env: WFM(0.1),
            log_date_format: "YYYY-MM-DD HH:mm Z",
        },
        {
            // Targeted heal for set docs whose items_in_set roster never got
            // populated (a Prime enriched before warframe.market published its
            // setParts — /set_full then 500s "Not a set", /set shows zero parts).
            // sync-items already re-enriches these on its nightly run, but that
            // is the heavy full-catalogue sync the deploy leaves stopped; this
            // one-shot scans only the sets and fixes the degenerate ones fast, so
            // a Prime released between nightly syncs is healed on the next deploy.
            // Staggered after sync-foundry. See sync_repair_sets.ts.
            name: "warframe-sync-repair-sets",
            autorestart: false,
            cron_restart: "30 5 * * *",
            script: "dist/sync_repair_sets.js",
            env: WFM(0.1),
            log_date_format: "YYYY-MM-DD HH:mm Z",
        },
        {
            name: "warframe-live",
            autorestart: true,
            script: "dist/live.js",
            env: { ...WFM(0.25), LIVE_POLL_CONCURRENCY: "2" },
            log_date_format: "YYYY-MM-DD HH:mm Z",
        },
    ],
};
