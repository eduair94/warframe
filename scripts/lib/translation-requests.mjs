import { setTimeout as delay } from 'node:timers/promises'

export function translationErrorPolicy(error) {
  let body
  try { body = JSON.parse(error?.message || '').error } catch {}
  body ||= error?.error || error || {}
  const text = `${error?.message || ''} ${JSON.stringify(body.details || [])} ${body.status || ''}`
  const status = Number(body.code || error?.status || error?.code)
  const seconds = Number(text.match(/"retryDelay"\s*:\s*"([\d.]+)s"/)?.[1])
  const retryDelayMs = Number.isFinite(seconds) ? Math.ceil(seconds * 1000) : 60_000
  // A daily-quota response can also contain a short RetryInfo delay. It must
  // stop the queue, never be mistaken for a per-minute limit.
  if (status === 429 && /per[_\s-]?day|daily|\bRPD\b/i.test(text)) return { stop: true, reason: 'daily quota exhausted' }
  if ([401, 403, 404].includes(status)
    || /API_KEY_INVALID|PERMISSION_DENIED|UNAUTHENTICATED/i.test(text)
    || (status === 400 && /api.?key|credential|model.*(?:not found|not supported|not available|access)/i.test(text))) {
    return { stop: true, reason: 'API authentication or model access failed' }
  }
  if (status === 503 || (status === 429 && /per[_\s-]?minute|\bRPM\b/i.test(text))) {
    return { retry: true, retryDelayMs }
  }
  // Unknown quota scope is not evidence that another request can succeed.
  if (status === 429) return { stop: true, reason: 'quota exhausted with unknown reset scope' }
  return { retry: false }
}

export class TranslationQueueStoppedError extends Error {
  constructor(reason) { super(`Skipped: ${reason}`); this.name = 'TranslationQueueStoppedError' }
}

/** One gate per process, shared by all locales and content-length retries. */
export function createTranslationRequestGate({
  intervalMs = 13_000,
  now = Date.now,
  sleep = (ms, signal) => delay(ms, undefined, { signal }),
} = {}) {
  if (!Number.isFinite(intervalMs) || intervalMs < 13_000) throw new Error('TRANSLATE_INTERVAL_MS must be at least 13000')
  let nextStart = 0, cooldownUntil = 0, stopReason
  let queue = Promise.resolve()
  const abort = new AbortController()
  const stopped = () => new TranslationQueueStoppedError(stopReason)

  function reserveStart() {
    const turn = queue.then(async () => {
      while (!stopReason) {
        const remaining = Math.max(nextStart, cooldownUntil) - now()
        if (remaining <= 0) break
        try { await sleep(remaining, abort.signal) } catch (error) {
          if (stopReason) throw stopped()
          throw error
        }
      }
      if (stopReason) throw stopped()
      nextStart = now() + intervalMs
    })
    queue = turn.catch(() => {})
    return turn
  }

  return {
    get stopReason() { return stopReason },
    async request(send) {
      for (let attempt = 0; attempt < 2; attempt++) {
        await reserveStart()
        if (stopReason) throw stopped()
        try { return await send() } catch (error) {
          const policy = translationErrorPolicy(error)
          if (policy.stop) {
            stopReason ||= policy.reason
            abort.abort()
            throw error
          }
          if (policy.retry) cooldownUntil = Math.max(cooldownUntil, now() + policy.retryDelayMs)
          if (!policy.retry || attempt === 1) throw error
        }
      }
    },
  }
}

/** Explicit outcomes prevent unstarted jobs from being reported as successful. */
export async function runTranslationJobs(items, concurrency, work, gate) {
  if (!Number.isInteger(concurrency) || concurrency < 1) throw new Error('Translation concurrency must be a positive integer')
  const results = new Array(items.length)
  let index = 0
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (index < items.length) {
      const current = index++
      if (gate.stopReason) {
        results[current] = { status: 'skipped', error: gate.stopReason }
        continue
      }
      try { results[current] = { status: 'ok', value: await work(items[current]) } } catch (error) {
        results[current] = {
          status: error instanceof TranslationQueueStoppedError ? 'skipped' : 'failed',
          error: error?.message || String(error),
        }
      }
    }
  }))
  return results
}
