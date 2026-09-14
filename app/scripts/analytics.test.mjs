import assert from 'node:assert/strict'
import { afterEach, test } from 'node:test'

let moduleId = 0
const freshAnalytics = () => import(`../app/composables/useAnalytics.ts?test=${++moduleId}`)
afterEach(() => { delete globalThis.window; delete globalThis.defineNitroPlugin })

test('early page views and properties replay in order after tag configuration', async () => {
  globalThis.window = {}
  const analytics = await freshAnalytics()
  analytics.setUserProperties({ app_locale: 'es' })
  analytics.trackEvent('page_view', { page_path: '/es/guides' })
  window.dataLayer = [['config', 'G-TEST']]
  analytics.flushPendingEvents()
  analytics.flushPendingEvents()
  assert.equal(window.dataLayer.length, 3)
  assert.deepEqual(Array.from(window.dataLayer[1]), ['set', 'user_properties', { app_locale: 'es' }])
  assert.deepEqual(Array.from(window.dataLayer[2]), ['event', 'page_view', { page_path: '/es/guides' }])
})

test('missing tag cannot grow the event buffer beyond 50 entries', async () => {
  globalThis.window = {}
  const analytics = await freshAnalytics()
  for (let i = 0; i < 70; i++) analytics.trackEvent('page_view', { page_path: `/page-${i}` })
  window.dataLayer = []
  analytics.flushPendingEvents()
  assert.equal(window.dataLayer.length, 50)
  assert.equal(window.dataLayer[0][2].page_path, '/page-0')
  assert.equal(window.dataLayer[49][2].page_path, '/page-49')
})

test('SSR emits and buffers nothing', async () => {
  const analytics = await freshAnalytics()
  analytics.trackEvent('page_view', { page_path: '/server' })
  analytics.setUserProperties({ app_locale: 'en' })
  analytics.flushPendingEvents()
  globalThis.window = { dataLayer: [] }
  analytics.flushPendingEvents()
  assert.deepEqual(window.dataLayer, [])
})

test('CLS precision and zero values survive sanitization', async () => {
  globalThis.window = { dataLayer: [] }
  const analytics = await freshAnalytics()
  analytics.trackEvent('web_vitals', { metric_value: 0.104, metric_delta: 0, invalid: NaN, price: 12.345 })
  assert.deepEqual(window.dataLayer[0][2], { metric_value: 0.104, metric_delta: 0, price: 12.35 })
})

test('events preserve GA4 arguments transport and sanitization bounds', async () => {
  globalThis.window = { dataLayer: [] }
  const analytics = await freshAnalytics()
  analytics.trackEvent('x'.repeat(60), Object.fromEntries(Array.from({ length: 40 }, (_, i) => [`key${i}`, 'y'.repeat(120)])))
  const event = window.dataLayer[0]
  assert.equal(Object.prototype.toString.call(event), '[object Arguments]')
  assert.equal(event[1].length, 40)
  assert.equal(Object.keys(event[2]).length, 25)
  assert.equal(event[2].key0.length, 100)
})

test('events after boot send immediately without replaying on later flushes', async () => {
  globalThis.window = { dataLayer: [] }
  const analytics = await freshAnalytics()
  analytics.trackEvent('page_view', { page_path: '/es/guides' })
  analytics.trackEvent('outbound_click', { link_domain: 'wiki.warframe.com' })
  analytics.flushPendingEvents()
  assert.deepEqual(window.dataLayer.map((entry) => entry[1]), ['page_view', 'outbound_click'])
})

test('resource hints keep required scripts, styles and external prefetches', async () => {
  globalThis.defineNitroPlugin = (plugin) => plugin
  const { removeSpeculativeScripts } = await import('../server/plugins/resource-hints.ts')
  const required = '<link rel="modulepreload" as="script" href="/_nuxt/entry.js">'
    + '<link rel="stylesheet" href="/_nuxt/app.css">'
    + '<link rel="prefetch" as="style" href="/_nuxt/route.css">'
    + '<link rel="prefetch" as="script" href="https://example.com/asset.js">'
  const speculative = '<link rel="prefetch" as="script" crossorigin href="/_nuxt/unvisited.js">'
    + "<link href='/_nuxt/locale.js' as='script' rel='prefetch'>"
  assert.equal(removeSpeculativeScripts(required + speculative), required)
})

test('Nitro removes speculative head scripts before rendering while preserving body and preloads', async () => {
  globalThis.defineNitroPlugin = (plugin) => plugin
  const { default: plugin } = await import('../server/plugins/resource-hints.ts')
  let render
  plugin({ hooks: { hook: (name, handler) => { assert.equal(name, 'render:html'); render = handler } } })
  const required = '<link rel="modulepreload" as="script" href="/_nuxt/entry.js">'
  const html = {
    head: [required, '<LINK REL=prefetch AS=script HREF="/_nuxt/unused.js">'],
    body: ['<main>Rendered guide content</main>'],
  }
  render(html)
  assert.deepEqual(html.head, [required, ''])
  assert.deepEqual(html.body, ['<main>Rendered guide content</main>'])
})
