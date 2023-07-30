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
    ],
};