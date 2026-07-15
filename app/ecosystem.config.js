// App-level pm2 config for the Nuxt 4 (Nitro) SSR frontend.
// Run `npm run build` first, then `pm2 start ecosystem.config.js`.
// The Nitro server is a plain node entry — no `nuxt start`, no cluster/nuxt.js.
module.exports = {
  apps: [
    {
      name: 'warframe-app',
      script: '.output/server/index.mjs',
      interpreter: 'node',
      autorestart: true,
      env: {
        // Runtime override for runtimeConfig.public.apiURL — MUST be the public
        // API origin, or the browser would call localhost and fail (the old
        // ERR_CONNECTION_REFUSED bug). API_URL is kept for the build-time default.
        NUXT_PUBLIC_API_URL: 'https://warframe.digitalshopuy.com',
        API_URL: 'https://warframe.digitalshopuy.com',
        // FRONTEND origin — powers canonical/hreflang/sitemap/OG. Must be the
        // app host, NOT the API host (warframe.digitalshopuy.com serves JSON).
        SITE_URL: 'https://warframe-app.digitalshopuy.com',
        PORT: '3312',
        HOST: '0.0.0.0',
      },
      log_date_format: 'YYYY-MM-DD HH:mm Z',
    },
  ],
}
