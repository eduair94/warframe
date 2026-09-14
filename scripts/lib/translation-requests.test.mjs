import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import { ApiError, GoogleGenAI } from '@google/genai'
import ts from 'typescript'
import { createTranslationRequestGate, runTranslationJobs, translationErrorPolicy } from './translation-requests.mjs'

const apiError = (code, message, details = []) => new ApiError({
  status: code, message: JSON.stringify({ error: { code, message, details } }),
})
const quota = (period, retryDelay = '47s') => apiError(429, 'Quota exceeded', [
  { '@type': 'type.googleapis.com/google.rpc.QuotaFailure', violations: [{ quotaId: `GenerateRequestsPer${period}PerProjectPerModel-FreeTier` }] },
  { '@type': 'type.googleapis.com/google.rpc.RetryInfo', retryDelay },
])
const flush = async () => { for (let i = 0; i < 30; i++) await Promise.resolve() }

function fakeClock() {
  let now = 0
  const timers = new Set()
  const sleep = (ms, signal) => new Promise((resolve, reject) => {
    const timer = { at: now + ms, finish: () => { timers.delete(timer); signal.removeEventListener('abort', abort); resolve() } }
    const abort = () => { timers.delete(timer); reject(new Error('aborted')) }
    signal.addEventListener('abort', abort, { once: true })
    timers.add(timer)
  })
  return {
    now: () => now, sleep,
    get pending() { return timers.size },
    async finish(promise) {
      let done = false, value, error
      promise.then((result) => { done = true; value = result }, (reason) => { done = true; error = reason })
      for (let step = 0; step < 100 && !done; step++) {
        await flush()
        if (done) break
        assert.ok(timers.size, 'work must finish or have a scheduled fake timer')
        now = Math.min(...[...timers].map((timer) => timer.at))
        for (const timer of [...timers]) if (timer.at <= now) timer.finish()
      }
      assert.equal(done, true, 'bounded scheduler completion')
      if (error) throw error
      return value
    },
  }
}

test('daily quota beats a misleading short RetryInfo; authentication and model errors stop', () => {
  assert.equal(translationErrorPolicy(quota('Day')).stop, true)
  assert.equal(translationErrorPolicy(quota('Day')).retry, undefined)
  for (const error of [apiError(401, 'unauthenticated'), apiError(403, 'permission denied'), apiError(404, 'model missing'), apiError(400, 'API key not valid'), apiError(400, 'model is not supported for generateContent')]) {
    assert.equal(translationErrorPolicy(error).stop, true)
  }
  assert.equal(translationErrorPolicy(apiError(429, 'Unspecified quota limit')).stop, true)
  assert.equal(translationErrorPolicy(apiError(400, 'Invalid input array')).retry, false)
})

test('all concurrent locale starts share the default 13-second spacing', async () => {
  const clock = fakeClock(), gate = createTranslationRequestGate(clock), starts = []
  const tasks = Array.from({ length: 6 }, () => gate.request(async () => { starts.push(clock.now()); return 'translated' }))
  assert.deepEqual(await clock.finish(Promise.all(tasks)), Array(6).fill('translated'))
  assert.deepEqual(starts, [0, 13_000, 26_000, 39_000, 52_000, 65_000])
  assert.throws(() => createTranslationRequestGate({ intervalMs: 1000 }), /at least 13000/)
})

test('minute quota retries once after the supplied fractional retryDelay', async () => {
  const clock = fakeClock(), gate = createTranslationRequestGate(clock), starts = []
  const result = gate.request(async () => {
    starts.push(clock.now())
    if (starts.length === 1) throw quota('Minute', '45.5s')
    return 'translated'
  })
  assert.equal(await clock.finish(result), 'translated')
  assert.deepEqual(starts, [0, 45_500])
})

test('503 retry is bounded and preserves the final provider error', async () => {
  const clock = fakeClock(), gate = createTranslationRequestGate(clock), starts = []
  const error = apiError(503, 'High demand')
  await assert.rejects(clock.finish(gate.request(async () => { starts.push(clock.now()); throw error })), (caught) => caught === error)
  assert.deepEqual(starts, [0, 60_000])
})

test('minute-limit cooldown also delays other queued locales', async () => {
  const clock = fakeClock(), gate = createTranslationRequestGate(clock), starts = []
  let first = true
  const results = await clock.finish(Promise.all([
    gate.request(async () => { starts.push(clock.now()); if (first) { first = false; throw quota('Minute', '45s') } return 'a' }),
    gate.request(async () => { starts.push(clock.now()); return 'b' }),
  ]))
  assert.deepEqual(results, ['a', 'b'])
  assert.deepEqual(starts, [0, 45_000, 58_000])
})

test('hard failures abort waiting timers immediately and skip every unstarted API call', async () => {
  const clock = fakeClock(), gate = createTranslationRequestGate(clock)
  let rejectFirst, calls = 0
  const response = new Promise((resolve, reject) => { rejectFirst = reject })
  const work = runTranslationJobs([1, 2, 3, 4], 3, () => gate.request(() => { calls++; return response }), gate)
  await flush()
  assert.equal(calls, 1)
  assert.equal(clock.pending, 1)
  rejectFirst(quota('Day'))
  const outcomes = await work
  assert.deepEqual(outcomes.map((result) => result.status), ['failed', 'skipped', 'skipped', 'skipped'])
  assert.equal(clock.now(), 0)
  assert.equal(clock.pending, 0)
  assert.equal(calls, 1)
})

test('completed translations survive a later hard failure and skipped jobs are never OK', async () => {
  const clock = fakeClock(), gate = createTranslationRequestGate(clock)
  const saved = new Map([['existing', 'old snapshot']])
  const results = await clock.finish(runTranslationJobs(['es', 'pt', 'ja', 'ko'], 1, async (locale) => {
    const translated = await gate.request(async () => { if (locale === 'pt') throw quota('Day'); return 'new snapshot' })
    saved.set(locale, translated)
  }, gate))
  assert.deepEqual(results.map((result) => result.status), ['ok', 'failed', 'skipped', 'skipped'])
  assert.deepEqual([...saved], [['existing', 'old snapshot'], ['es', 'new snapshot']])
})

test('invalid concurrency rejects before starting jobs or scheduling API calls', async () => {
  const clock = fakeClock(), gate = createTranslationRequestGate(clock)
  let calls = 0
  for (const concurrency of [0, -1, NaN, Infinity, 1.5]) {
    await assert.rejects(runTranslationJobs(['es', 'pt'], concurrency, () => gate.request(() => { calls++ }), gate), /positive integer/)
  }
  assert.equal(calls, 0)
  assert.equal(clock.pending, 0)
})

test('the actual SDK sends once and preserves daily-quota metadata for the gate', async () => {
  const originalFetch = globalThis.fetch
  let calls = 0
  globalThis.fetch = async () => {
    calls++
    return Response.json(JSON.parse(quota('Day').message), { status: 429 })
  }
  try {
    const ai = new GoogleGenAI({ apiKey: 'test-fixture-key' })
    const clock = fakeClock(), gate = createTranslationRequestGate(clock)
    const results = await runTranslationJobs(['es', 'pt', 'ja'], 1, () => gate.request(() => ai.models.generateContent({
      model: 'test-fixture-model', contents: 'Translate fixture',
    })), gate)
    assert.deepEqual(results.map((result) => result.status), ['failed', 'skipped', 'skipped'])
    assert.equal(calls, 1)
    assert.equal(gate.stopReason, 'daily quota exhausted')
  } finally { globalThis.fetch = originalFetch }
})

test('the actual translation function requests JSON through the shared request gate', async () => {
  const source = readFileSync(new URL('../translate-guides.mjs', import.meta.url), 'utf8')
  const file = ts.createSourceFile('translate-guides.mjs', source, ts.ScriptTarget.Latest, true)
  const batch = file.statements.find((node) => ts.isFunctionDeclaration(node) && node.name?.text === 'translateBatch')
  const context = { exports: {}, MODEL: 'test-fixture-model', parseArray: JSON.parse }
  runInNewContext(`exports.translateBatch = ${batch.getText(file)}`, context)
  let request, starts = 0
  const ai = { models: { generateContent: async (options) => { request = options; return { text: '["translated fixture"]' } } } }
  const requests = { request: async (send) => { starts++; return send() } }
  assert.deepEqual(await context.exports.translateBatch(ai, requests, ['Blueprint reward'], 'Japanese'), ['translated fixture'])
  assert.equal(starts, 1)
  assert.equal(request.model, 'test-fixture-model')
  assert.equal(request.config.responseMimeType, 'application/json')
  assert.equal(request.config.responseSchema.type, 'ARRAY')
  assert.equal(request.config.responseSchema.items.type, 'STRING')
  assert.equal(request.config.httpOptions.timeout, 180_000)
  const originalFetch = globalThis.fetch
  globalThis.fetch = async (url, options) => {
    const body = JSON.parse(options.body)
    assert.equal(body.generationConfig.responseMimeType, 'application/json')
    assert.equal(body.generationConfig.responseSchema.type, 'ARRAY')
    assert.equal(body.generationConfig.responseSchema.items.type, 'STRING')
    return Response.json({ candidates: [{ content: { parts: [{ text: '["translated fixture"]' }] } }] })
  }
  try {
    const sdk = new GoogleGenAI({ apiKey: 'test-fixture-key' })
    assert.deepEqual(await context.exports.translateBatch(sdk, requests, ['Blueprint reward'], 'Japanese'), ['translated fixture'])
  } finally { globalThis.fetch = originalFetch }
})
