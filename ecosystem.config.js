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
    ],
};