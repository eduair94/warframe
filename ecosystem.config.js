module.exports = {
    apps: [{
            name: "warframe-sync-prices",
            autorestart: true,
            script: "dist/sync_prices.js",
            log_date_format: "YYYY-MM-DD HH:mm Z",
        },
        {
            name: "warframe-sync-items",
            autorestart: false,
            cron_restart: "0 0 * * *",
            script: "dist/sync_items.js",
            log_date_format: "YYYY-MM-DD HH:mm Z",
        },
        {
            name: "warframe-server",
            autorestart: true,
            script: "dist/server.js",
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
                SITE_URL: "https://warframe.digitalshopuy.com",
                PORT: "3312",
                HOST: "0.0.0.0",
            },
            log_date_format: "YYYY-MM-DD HH:mm Z",
        },
       {
            name: "warframe-sync-auctions",
            autorestart: true,
            script: "dist/sync_auctions.js",
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
            log_date_format: "YYYY-MM-DD HH:mm Z",
        },
        {
            name: "warframe-live",
            autorestart: true,
            script: "dist/live.js",
            log_date_format: "YYYY-MM-DD HH:mm Z",
        },
    ],
};