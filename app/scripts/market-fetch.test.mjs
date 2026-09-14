import assert from 'node:assert/strict'
import { afterEach, test } from 'node:test'
import { readFile } from 'node:fs/promises'
import { runInNewContext } from 'node:vm'
import { ofetch } from 'ofetch'
import ts from 'typescript'
import { parse } from '@vue/compiler-sfc'
import { fetchMarketData } from '../app/utils/market-fetch.ts'

afterEach(() => { delete globalThis.window; delete globalThis.$fetch })

function useFetchAdapter(respond = () => ({ price: 24 })) {
  const requests = []
  globalThis.$fetch = ofetch.create({}, {
    fetch: async (input, options) => {
      const request = new Request(input, options)
      requests.push(request)
      const response = respond(request, requests.length)
      return response instanceof Response ? response : Response.json(response)
    },
  })
  return requests
}

test('browser market reads revalidate a locally fresh four-hour response through the ofetch adapter', async () => {
  globalThis.window = {}
  // Model the observed HTTP-cache boundary: a default request may return a
  // still-fresh old price; no-cache must validate it against the network.
  const requests = useFetchAdapter((request) => ({ price: request.cache === 'default' ? 11 : 24 }))
  const url = 'https://warframe.digitalshopuy.com/market_analytics'
  assert.equal((await $fetch(url)).price, 11)
  assert.equal((await fetchMarketData(url)).price, 24)
  assert.equal(requests[1].cache, 'no-cache')
  assert.equal(requests[1].url, url)
  assert.equal(requests[1].headers.has('cache-control'), false)
  assert.equal(requests[1].headers.has('pragma'), false)
  await fetchMarketData(url, { cache: undefined })
  assert.equal(requests[2].cache, 'no-cache')
})

test('SSR keeps the internal origin and the existing request cache policy', async () => {
  const requests = useFetchAdapter()
  const url = 'http://127.0.0.1:3529/?schema=rank-prices-v1'
  assert.deepEqual(await fetchMarketData(url), { price: 24 })
  assert.equal(requests[0].cache, 'default')
  assert.equal(requests[0].url, url)
  await fetchMarketData(url, { cache: 'reload' })
  assert.equal(requests[1].cache, 'reload')
})

test('browser reads preserve retries, hooks and query options without mutating callers', async () => {
  globalThis.window = {}
  const requests = useFetchAdapter((request, attempt) => attempt === 1
    ? new Response('unavailable', { status: 503 })
    : { price: 24 })
  let responses = 0
  const query = Object.freeze({ rank: 10 })
  const options = Object.freeze({ retry: 1, retryDelay: 1, timeout: 1000, query, onResponse: () => { responses++ } })
  assert.deepEqual(await fetchMarketData('https://warframe.digitalshopuy.com/orders/mod', options), { price: 24 })
  assert.equal(requests.length, 2)
  assert.equal(responses, 2)
  assert.ok(requests.every((request) => request.cache === 'no-cache'))
  assert.ok(requests.every((request) => request.url === 'https://warframe.digitalshopuy.com/orders/mod?rank=10'))
  assert.equal(Object.hasOwn(options, 'cache'), false)
})

test('explicit stronger caller cache policies remain intact', async () => {
  globalThis.window = {}
  const requests = useFetchAdapter()
  for (const cache of ['no-store', 'reload']) {
    await fetchMarketData('https://warframe.digitalshopuy.com/', { cache })
  }
  assert.deepEqual(requests.map((request) => request.cache), ['no-store', 'reload'])
})

async function loadAsyncDataHandler(relativePath, key) {
  const source = await readFile(new URL(relativePath, import.meta.url), 'utf8')
  const script = parse(source).descriptor.scriptSetup.content
  const file = ts.createSourceFile(relativePath, script, ts.ScriptTarget.Latest, true)
  let handler
  const visit = (node) => {
    if (ts.isCallExpression(node) && node.expression.getText(file) === 'useAsyncData'
      && ts.isStringLiteral(node.arguments[0]) && node.arguments[0].text === key) handler = node.arguments[1]
    ts.forEachChild(node, visit)
  }
  visit(file)
  assert.ok(handler, `${relativePath}: ${key} loader exists`)
  const compiled = ts.transpileModule(`exports.load = ${handler.getText(file)}`, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
  }).outputText
  const context = {
    exports: {}, fetchMarketData, $fetch,
    base: 'https://warframe.digitalshopuy.com',
    catalogueUrl: 'https://warframe.digitalshopuy.com/?schema=rank-prices-v1',
    needsCatalogue: true, CATALOGUE_FETCH: { retry: 2, retryDelay: 400, timeout: 25000 },
    packCatalogue: (rows) => rows,
  }
  runInNewContext(compiled, context)
  return context.exports.load
}

test('actual catalogue bootstrap and every analytics page loader pass revalidation to fetch', async () => {
  globalThis.window = {}
  const requests = useFetchAdapter(() => [{ price: 24 }])
  const pages = [
    ['../app/app.vue', 'app-items'],
    ['../app/pages/movers.vue', 'movers-analytics'],
    ['../app/pages/timing.vue', 'timing-analytics'],
    ['../app/pages/volatility.vue', 'market-analytics-volatility'],
    ['../app/pages/vault-spikes.vue', 'vault-spikes-market-analytics'],
    ['../app/pages/vaulted-worth.vue', 'vaulted-worth-analytics'],
    ['../app/pages/portfolio.vue', 'portfolio-market-analytics'],
    ['../app/pages/vault.vue', 'vault-market-analytics'],
    ['../app/pages/foundry/[[tab]].vue', 'foundry-market-analytics'],
  ]
  for (const [path, key] of pages) {
    const load = await loadAsyncDataHandler(path, key)
    await load()
    assert.equal(requests.at(-1).cache, 'no-cache', `${path} reaches fetch with revalidation`)
  }
  assert.equal(requests.length, pages.length)
})
