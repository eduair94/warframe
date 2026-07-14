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
            // Nuxt frontend (SSR). API_URL is baked into publicRuntimeConfig
            // (nuxt.config.js) and serialized to the client, so it MUST point
            // at the PUBLIC API origin - otherwise the browser requests
            // http://localhost:3529 (the visitor's own machine) and every call
            // fails with ERR_CONNECTION_REFUSED. Set it here so pm2 injects it
            // regardless of shell env.
            name: "warframe-app",
            cwd: "./app",
            script: "./node_modules/nuxt/bin/nuxt.js",
            args: "start",
            interpreter: "node",
            autorestart: true,
            env: {
                API_URL: "https://warframe.digitalshopuy.com",
                FRONTEND_PORT: "3312",
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
            // Refreshes the WFCD drop-data backup (mission rewards + relic
            // contents) that powers the Star Chart and the in-app drop dialog.
            // WFCD only changes on game patches, so a daily run keeps the
            // warframe-drops collection current without hammering the source.
            name: "warframe-sync-drops",
            autorestart: false,
            cron_restart: "0 3 * * *",
            script: "dist/sync_drops.js",
            log_date_format: "YYYY-MM-DD HH:mm Z",
        },
    ],
};