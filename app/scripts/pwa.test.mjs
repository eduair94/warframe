import assert from 'node:assert/strict'
import { test } from 'node:test'
import { mkdtemp, mkdir, writeFile, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, dirname, resolve } from 'node:path'
import { runInNewContext } from 'node:vm'
import { createRequire } from 'node:module'
import ts from 'typescript'

const require = createRequire(import.meta.url)
const { generateSW } = require('workbox-build')

// Load just the actual Workbox config: importing Nuxt's full config would need
// Nuxt/Vite initialization and could disturb a running build or development app.
async function loadConfigSection(path) {
  const source = await readFile(new URL('../nuxt.config.ts', import.meta.url), 'utf8')
  const file = ts.createSourceFile('nuxt.config.ts', source, ts.ScriptTarget.Latest, true)
  const exported = file.statements.find(ts.isExportAssignment)?.expression
  const config = exported?.arguments?.[0]
  const property = (node, name) => node?.properties?.find((entry) => (entry.name?.text ?? entry.name?.getText(file)) === name)?.initializer
  const section = path.reduce(property, config)
  assert.ok(section, `${path.join('.')} exists in nuxt.config.ts`)
  const compiled = ts.transpileModule(`exports.section = ${section.getText(file)}`, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
  }).outputText
  const context = { exports: {}, RegExp, process: { env: { API_URL: 'https://warframe.digitalshopuy.com' } } }
  runInNewContext(compiled, context)
  return context.exports.section
}

export const loadWorkboxConfig = () => loadConfigSection(['pwa', 'workbox'])

test('worker migration preserves root scope and prevents browser/CDN response caching', async () => {
  const pwa = await loadConfigSection(['pwa'])
  assert.equal(pwa.filename, 'sw-v2.js')
  assert.equal(pwa.scope, '/')
  assert.equal(pwa.manifest.scope, '/')
  assert.equal(pwa.injectRegister, false)
  assert.equal(pwa.client.registerPlugin, true)
  for (const path of ['/sw.js', '/sw-v2.js', '/manifest.webmanifest']) {
    const rule = await loadConfigSection(['nitro', 'routeRules', path])
    assert.equal(rule.cache, false, path)
    assert.equal(rule.headers['cache-control'], 'no-store', path)
  }
})

test('Vite generates root-scope v2 registration in the imported client module, without registerSW.js', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'warframe-pwa-test-'))
  try {
    const pwa = await loadConfigSection(['pwa'])
    const fromNuxt = createRequire(require.resolve('@vite-pwa/nuxt'))
    const { VitePWA } = fromNuxt('vite-plugin-pwa')
    const plugins = VitePWA(pwa)
    const main = plugins.find((plugin) => plugin.name === 'vite-plugin-pwa')
    await main.configResolved({
      root: directory, base: '/', publicDir: join(directory, 'public'), command: 'build', isProduction: true,
      build: { outDir: join(directory, 'dist'), assetsDir: '_nuxt', sourcemap: false }, plugins: [],
    })
    const moduleId = main.resolveId.handler('virtual:pwa-register/vue')
    const registration = await main.load.handler(moduleId)
    assert.match(registration, /new Workbox\("\/sw-v2\.js", \{ scope: "\/"/)
    assert.ok(!registration.includes('"/sw.js"'))
    const htmlPlugin = plugins.find((plugin) => plugin.name === 'vite-plugin-pwa:build')
    const html = htmlPlugin.transformIndexHtml.handler('<html><head></head><body></body></html>')
    assert.ok(!html.includes('registerSW.js'))
    assert.ok(!html.includes('navigator.serviceWorker.register'))
  } finally {
    assert.equal(dirname(resolve(directory)), resolve(tmpdir()))
    assert.ok(directory.includes('warframe-pwa-test-'))
    await rm(directory, { recursive: true, force: true })
  }
})

test('only requested same-origin hashed JS/CSS uses the bounded runtime cache', async () => {
  const config = await loadWorkboxConfig()
  const rule = config.runtimeCaching.find((entry) => entry.options.cacheName === 'warframe-built-assets-v1')
  const matches = (path, sameOrigin = true) => rule.urlPattern({ url: new URL(path, 'https://warframe-app.digitalshopuy.com'), sameOrigin })
  assert.equal(matches('/_nuxt/_9HBT2Nb.js'), true)
  assert.equal(matches('/_nuxt/style.d1m4jCOV.css'), true)
  assert.equal(matches('/_nuxt/_9HBT2Nb.js', false), false)
  for (const path of ['/', '/guides/credits', '/_nuxt/entry.js', '/_nuxt/builds/latest.json', '/guides/_payload.json', '/api/prices', '/push-sw.js']) {
    assert.equal(matches(path), false, path)
  }
  assert.equal(rule.handler, 'CacheFirst')
  assert.equal(rule.method, 'GET')
  assert.equal(rule.options.expiration.maxEntries, 160)
  assert.equal(rule.options.expiration.maxAgeSeconds, 30 * 24 * 60 * 60)
  assert.equal(rule.options.expiration.purgeOnQuotaError, true)
  assert.deepEqual(Array.from(rule.options.cacheableResponse.statuses), [200])
})

test('push import, network-first API cache and SSR navigation behavior are preserved', async () => {
  const config = await loadWorkboxConfig()
  assert.deepEqual(Array.from(config.importScripts), ['/push-sw.js'])
  assert.equal(config.navigateFallback, null)
  const api = config.runtimeCaching.find((entry) => entry.options.cacheName === 'warframe-api')
  assert.equal(api.handler, 'NetworkFirst')
  assert.equal(api.method, 'GET')
  assert.equal(api.urlPattern.test('https://warframe.digitalshopuy.com/relics_ev'), true)
  assert.equal(api.urlPattern.test('https://unrelated.example/relics_ev'), false)
  assert.deepEqual(Array.from(api.options.cacheableResponse.statuses), [0, 200])
})

test('Nuxt-injected manifests are excluded while revisioned icons remain intact', async () => {
  const config = await loadWorkboxConfig()
  const icon = { url: 'android-chrome-192x192.png', revision: 'icon-revision', size: 123 }
  const { manifest } = await config.manifestTransforms[0]([
    icon,
    { url: '_nuxt/builds/latest.json', revision: 'build-revision' },
    { url: '/_nuxt/builds/meta/build-id.json', revision: null },
    { url: 'guides/_payload.json', revision: 'payload-revision' },
  ])
  assert.deepEqual(Array.from(manifest), [icon])
})

test('generateSW installs only icons even when route chunks and Nuxt build metadata exist', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'warframe-pwa-test-'))
  try {
    const publicDir = join(directory, 'public')
    await mkdir(join(publicDir, '_nuxt', 'builds'), { recursive: true })
    const icons = ['favicon.svg', 'favicon.ico', 'favicon-16x16.png', 'favicon-32x32.png', 'apple-touch-icon.png', 'android-chrome-192x192.png', 'android-chrome-384x384.png', 'maskable-icon-512x512.png']
    for (const icon of icons) await writeFile(join(publicDir, icon), 'fixture-icon')
    await writeFile(join(publicDir, '_nuxt', 'abcd1234.js'), 'const locale = "unused translation";'.repeat(10_000))
    await writeFile(join(publicDir, '_nuxt', 'builds', 'latest.json'), '{"id":"new-deployment"}')
    const pwa = await loadConfigSection(['pwa'])
    const config = pwa.workbox
    // Reproduce the integration's extra glob: the filter must still win.
    config.globPatterns.push('_nuxt/builds/**/*.json')
    const result = await generateSW({
      ...config, globDirectory: publicDir, swDest: join(directory, pwa.filename), sourcemap: false,
    })
    assert.equal(result.count, icons.length)
    assert.equal(result.size, icons.length * Buffer.byteLength('fixture-icon'))
    assert.deepEqual(result.warnings, [])
    const worker = await readFile(join(directory, pwa.filename), 'utf8')
    assert.ok(worker.includes('/push-sw.js'))
    assert.ok(worker.includes('warframe-built-assets-v1'))
    assert.ok(worker.includes('warframe-api'))
    assert.ok(!worker.includes('abcd1234.js'))
    assert.ok(!worker.includes('latest.json'))
  } finally {
    // Only remove the unique temporary fixture created by this test.
    assert.equal(dirname(resolve(directory)), resolve(tmpdir()))
    assert.ok(directory.includes('warframe-pwa-test-'))
    await rm(directory, { recursive: true, force: true })
  }
})
