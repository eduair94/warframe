// Pre-renders the main pages after boot so the Nitro SWR cache is warm and no
// visitor ever hits a cold multi-second SSR render (the mirror of the API's
// CacheWarmer). Fire-and-forget self-requests on the local port; a request to a
// still-fresh SWR entry is a cheap cache hit (no re-render), so a frequent sweep
// keeps pages warm at very low cost.
//
// Only the low-cardinality English routes are warmed — the ones with real SSR
// data fetches. Locale-prefixed and dynamic param routes (/set, /relic) warm on
// demand. Disable with APP_WARM_ENABLED=false.
export default defineNitroPlugin(() => {
  if (process.env.APP_WARM_ENABLED === 'false') return

  const port = process.env.PORT || process.env.NITRO_PORT || '3312'
  const base = `http://127.0.0.1:${port}`
  const routes = [
    '/',
    '/movers',
    '/volatility',
    '/timing',
    '/vault-spikes',
    '/relic-farming',
    '/relics-value',
    '/comparison',
    '/endo',
    '/screener',
    '/riven-value',
    '/guides/endo',
  ]

  const intervalMs = Number(process.env.APP_WARM_INTERVAL_MS || 45000)
  const bootDelayMs = Number(process.env.APP_WARM_BOOT_DELAY_MS || 8000)

  const sweep = async () => {
    for (const r of routes) {
      try {
        await $fetch(base + r, { responseType: 'text' })
      } catch {
        // best-effort; a failed warm just leaves that page to warm on demand
      }
    }
    if (process.env.APP_WARM_LOG === 'true') console.log('[app-warmer] swept', routes.length, 'routes')
  }

  setTimeout(sweep, bootDelayMs)
  const timer = setInterval(sweep, intervalMs)
  if (typeof timer.unref === 'function') timer.unref()
  console.log(`[app-warmer] warming ${routes.length} routes every ${Math.round(intervalMs / 1000)}s`)
})
