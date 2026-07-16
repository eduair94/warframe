// Backs Nitro's SWR route cache with Redis instead of in-process memory.
//
// Why: the prod box is memory-starved (heavy swap). An in-memory SWR cache of
// rendered pages grew warframe-app's RSS by hundreds of MB, adding to the swap
// pressure. Storing the rendered HTML in Redis moves it OFF the box's RAM while
// keeping the speed (and making it durable/shared).
//
// Prod runs the built `.output` with no dotenv, and REDIS_URL must not be
// committed into the pm2 ecosystem file, so we read it from the repo-root `.env`
// (gitignored, the same file the API uses). If no Redis is reachable we simply
// leave Nitro's default memory cache in place — SWR still works, just in-process.
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import redisDriver from 'unstorage/drivers/redis'

function loadRedisUrl(): string | undefined {
  if (process.env.REDIS_URL) return process.env.REDIS_URL
  // pm2 runs this process with cwd = <repo>/app, so ../.env is the repo-root env.
  for (const p of ['../.env', '.env']) {
    try {
      const txt = readFileSync(resolve(process.cwd(), p), 'utf8')
      const m = txt.match(/^\s*REDIS_URL\s*=\s*(.+)\s*$/m)
      if (m) return m[1].trim().replace(/^["']|["']$/g, '')
    } catch {
      /* file not present in this environment — fine */
    }
  }
  return undefined
}

export default defineNitroPlugin(() => {
  const url = loadRedisUrl()
  if (!url) {
    console.warn('[swr-redis] no REDIS_URL — SWR cache stays in-process memory')
    return
  }
  // Namespace by build id so a deploy starts a FRESH cache: HTML rendered by an
  // old build references old hashed /_nuxt chunks (purged on rebuild), and
  // serving that after a deploy would 404 those chunks. A per-build base means
  // the new build never reads the old build's cached pages; old keys expire by TTL.
  const buildId = (useRuntimeConfig().app as any)?.buildId || 'dev'
  try {
    useStorage().mount(
      'cache',
      redisDriver({
        url,
        base: `nuxt:swr:${buildId}:`,
        // TTL bounds Redis memory — entries auto-expire well before they matter.
        ttl: Number(process.env.SWR_REDIS_TTL || 3600),
      })
    )
    console.log(`[swr-redis] SWR route cache -> Redis (base nuxt:swr:${buildId})`)
  } catch (e: any) {
    console.warn('[swr-redis] mount failed, staying on memory cache:', e?.message)
  }
})
