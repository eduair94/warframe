import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'
import { runInNewContext } from 'node:vm'
import { compileTemplate, parse } from '@vue/compiler-sfc'
import { parse as parseHtml } from '@vue/compiler-dom'
import * as vue from 'vue'
import * as renderer from 'vue/server-renderer'
import { createI18n, useI18n } from 'vue-i18n'
import ts from 'typescript'
import messages from '../i18n/messages/live.ts'

const compile = source => ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
}).outputText
const composable = await readFile(new URL('../app/composables/useLiveFeed.ts', import.meta.url), 'utf8')
// Nuxt supplies import.meta.client at build time. Only that environment constant
// is substituted; every event handler and computed binding runs from real source.
const composableCode = compile(composable.replaceAll('import.meta.client', '__isClient'))

function setupFeed(client = true) {
  const handlers = new Map()
  const emitted = []
  const connections = []
  const socket = {
    connected: false,
    on(event, handler) { handlers.set(event, handler); return socket },
    emit(event, payload) { emitted.push({ event, payload }); return socket },
  }
  const context = {
    exports: {}, __isClient: client, ref: vue.ref, computed: vue.computed,
    window: { location: { origin: 'https://example.test' } },
    require: name => {
      assert.equal(name, 'socket.io-client')
      return { io: (...args) => { connections.push(args); return socket } }
    },
  }
  runInNewContext(composableCode, context)
  return {
    ...context.exports, state: context.exports.useLiveFeed(), emitted, connections,
    receive(event, payload) {
      if (event === 'connect') socket.connected = true
      if (event === 'disconnect') socket.connected = false
      assert.ok(handlers.has(event), `actual socket handler: ${event}`)
      handlers.get(event)(payload)
    },
  }
}

const validPulse = (updatedAt = 1000) => ({
  updatedAt, onlineUpdatedAt: updatedAt, online: { connections: 12, authorizedUsers: 8 }, ordersPerMin: 0,
  recent: [{ itemId: 'item-a', url_name: 'test_item', item_name: 'Test Item', type: 'sell', platinum: 25, at: 900 }],
})

test('SSR creates neither a connection nor a subscription and starts with no source observations', () => {
  const f = setupFeed(false)
  f.ensureLiveConnected()
  const off = f.subscribeLive('test_item', () => assert.fail('SSR cannot receive updates'))
  off()
  assert.equal(f.connections.length, 0)
  assert.equal(f.emitted.length, 0)
  assert.equal(f.state.connected.value, false)
  assert.equal(f.state.feedUp.value, false)
  assert.equal(f.state.pulse.value, null)
})

test('own connection and an old server without source-status never imply a live upstream', () => {
  const f = setupFeed()
  f.ensureLiveConnected()
  f.ensureLiveConnected()
  assert.equal(f.connections.length, 1)
  f.receive('connect')
  assert.equal(f.state.connected.value, true)
  assert.equal(f.state.feedUp.value, false)
  f.receive('pulse', validPulse())
  assert.equal(f.state.pulse.value, null)
  assert.equal(f.state.feedUp.value, false)
})

test('book source status toggles feedUp and only explicit true means available', () => {
  const f = setupFeed()
  f.ensureLiveConnected()
  f.receive('connect')
  f.receive('source-status', { books: true, orders: false })
  assert.equal(f.state.feedUp.value, true)
  for (const status of [{ books: false }, {}, null, undefined, { books: 'true' }, { books: 1 }]) {
    f.receive('source-status', status)
    assert.equal(f.state.feedUp.value, false)
  }
  f.receive('source-status', { books: true, orders: false })
  assert.equal(f.state.feedUp.value, true)
})

test('orders availability independently controls the pulse, including a legitimate quiet feed', () => {
  const f = setupFeed()
  f.ensureLiveConnected()
  f.receive('connect')
  f.receive('source-status', { books: false, orders: true })
  f.receive('pulse', validPulse())
  assert.equal(f.state.feedUp.value, false)
  assert.equal(f.state.pulse.value.ordersPerMin, 0)
  assert.equal(f.state.pulse.value.online.connections, 12)
  f.receive('source-status', { books: true, orders: false })
  assert.equal(f.state.feedUp.value, true)
  assert.equal(f.state.pulse.value, null)
  f.receive('pulse', validPulse(2000))
  assert.equal(f.state.pulse.value, null)
})

test('missing, nonnumeric and nonpositive timestamps cannot display an observed pulse', () => {
  const f = setupFeed()
  f.ensureLiveConnected()
  f.receive('connect')
  f.receive('source-status', { books: true, orders: true })
  for (const updatedAt of [0, -1, NaN, Infinity, -Infinity, '1000', null, undefined]) {
    f.receive('pulse', validPulse())
    assert.ok(f.state.pulse.value)
    f.receive('pulse', { ...validPulse(), updatedAt })
    assert.equal(f.state.pulse.value, null, `timestamp ${String(updatedAt)}`)
  }
  for (const payload of [null, undefined, {}]) {
    f.receive('pulse', payload)
    assert.equal(f.state.pulse.value, null)
  }
})

test('disconnect clears observations and reconnect requires new source confirmation and data', () => {
  const f = setupFeed()
  f.ensureLiveConnected()
  f.receive('connect')
  f.receive('source-status', { books: true, orders: true })
  f.receive('pulse', validPulse())
  assert.equal(f.state.feedUp.value, true)
  f.receive('disconnect')
  assert.equal(f.state.connected.value, false)
  assert.equal(f.state.feedUp.value, false)
  assert.equal(f.state.pulse.value, null)
  f.receive('pulse', validPulse(2000))
  assert.equal(f.state.pulse.value, null)
  f.receive('connect')
  assert.equal(f.state.feedUp.value, false)
  f.receive('pulse', validPulse(3000))
  assert.equal(f.state.pulse.value, null)
  f.receive('source-status', { books: true, orders: true })
  assert.equal(f.state.feedUp.value, true)
  assert.equal(f.state.pulse.value, null)
  f.receive('pulse', validPulse(4000))
  assert.equal(f.state.pulse.value.updatedAt, 4000)
})

test('source confirmation does not duplicate room subscriptions or break update delivery', () => {
  const f = setupFeed()
  const updates = []
  const off = f.subscribeLive('test_item', update => updates.push(update))
  assert.equal(f.emitted.length, 0)
  f.receive('connect')
  f.receive('source-status', { books: true, orders: false })
  assert.equal(f.emitted.filter(e => e.event === 'subscribe').length, 1)
  const update = { url_name: 'test_item', book: { updatedAt: 1000 } }
  f.receive('update', update)
  assert.equal(updates[0], update)
  f.receive('disconnect')
  f.receive('connect')
  assert.equal(f.emitted.filter(e => e.event === 'subscribe').length, 2)
  off()
  assert.equal(f.emitted.at(-1).event, 'unsubscribe')
  f.receive('update', update)
  assert.equal(updates.length, 1)
})

const parsedPage = parse(await readFile(new URL('../app/pages/live.vue', import.meta.url), 'utf8'))
assert.deepEqual(parsedPage.errors, [])
const page = parsedPage.descriptor
const script = ts.createSourceFile('live.vue', page.scriptSetup.content, ts.ScriptTarget.Latest, true)
const declarations = new Map()
for (const statement of script.statements) {
  if (ts.isVariableStatement(statement)) for (const declaration of statement.declarationList.declarations) {
    declarations.set(declaration.name.getText(script), `const ${declaration.getText(script)};`)
  }
  else if (ts.isFunctionDeclaration(statement) && statement.name) declarations.set(statement.name.text, statement.getText(script))
}
const bookBindings = ['live', 'now', 'flashAt', 'prevKey', 'LIVE_BOOK_STALE_AFTER_MS', 'currentLiveUpdate',
  'onUpdate', 'buyCount', 'sellCount', 'liveCount', 'liveOrStatic', 'agoOf', 'detailRow', 'detail', 'pulseOnline']
const bookCode = compile(bookBindings.map(name => {
  assert.ok(declarations.has(name), `actual live page binding: ${name}`)
  return declarations.get(name)
}).join('\n') + `\nexports.bindings = { ${bookBindings.join(',')} };`)

function setupBooks(feed, urls = ['a']) {
  const context = { exports: {}, ref: vue.ref, computed: vue.computed, feedUp: feed.state.feedUp,
    pulse: feed.state.pulse, paged: vue.ref(urls.map(url_name => ({ url_name }))), t: key => key }
  runInNewContext(bookCode, context)
  const b = context.exports.bindings
  b.now.value = 200_000
  return b
}
const book = (url_name, updatedAt, verdict = 'buy') => ({
  url_name, book: { updatedAt, bestBuy: 90, bestSell: 100 },
  verdict: { verdict, fv: 110, flipMargin: 10, volume: 100 },
})
function activeFeed() {
  const f = setupFeed()
  f.ensureLiveConnected()
  f.receive('connect')
  f.receive('source-status', { books: true, orders: false })
  return f
}

test('actual page admits age zero and the exact three-minute boundary, never future or unknown books', () => {
  const b = setupBooks(activeFeed())
  assert.equal(b.currentLiveUpdate('missing'), null)
  b.onUpdate(book('a', 200_000))
  assert.equal(b.currentLiveUpdate('a').book.updatedAt, 200_000)
  b.now.value = 380_000
  assert.ok(b.currentLiveUpdate('a'))
  b.now.value = 380_001
  assert.equal(b.currentLiveUpdate('a'), null)
  b.now.value = 199_999
  assert.equal(b.currentLiveUpdate('a'), null)
})

test('actual page excludes missing, nonpositive, nonnumeric and nonfinite book timestamps', () => {
  const b = setupBooks(activeFeed())
  for (const at of [undefined, null, 0, -1, NaN, Infinity, -Infinity, '200000']) {
    b.onUpdate(book('a', at))
    assert.equal(b.currentLiveUpdate('a'), null, `book timestamp ${String(at)}`)
    assert.equal(b.liveCount.value, 0)
    assert.equal(b.buyCount.value, 0)
  }
})

test('actual page counts each book independently and expires a row without a new socket message', () => {
  const b = setupBooks(activeFeed(), ['a', 'b', 'stale', 'future', 'unknown'])
  b.onUpdate(book('a', 190_000, 'buy'))
  b.onUpdate(book('b', 200_000, 'sell'))
  b.onUpdate(book('stale', 10_000, 'buy'))
  b.onUpdate(book('future', 999_999, 'sell'))
  assert.equal(b.liveCount.value, 2)
  assert.equal(b.buyCount.value, 1)
  assert.equal(b.sellCount.value, 1)
  b.now.value = 370_001
  assert.equal(b.liveCount.value, 1)
  assert.equal(b.buyCount.value, 0)
  assert.equal(b.sellCount.value, 1)
  b.now.value = 380_001
  assert.equal(b.liveCount.value, 0)
  assert.equal(b.sellCount.value, 0)
})

test('disconnect removes active counts while keeping historical prices, age and the readable detail', () => {
  const f = activeFeed()
  const b = setupBooks(f)
  b.onUpdate(book('a', 190_000))
  b.detailRow.value = { url_name: 'a' }
  assert.equal(b.liveCount.value, 1)
  f.receive('disconnect')
  assert.equal(b.liveCount.value, 0)
  assert.equal(b.buyCount.value, 0)
  assert.equal(b.sellCount.value, 0)
  assert.equal(b.currentLiveUpdate('a'), null)
  assert.equal(b.liveOrStatic({ url_name: 'a' }, 'bestSell'), 100)
  assert.equal(b.agoOf('a'), '10s')
  assert.equal(b.detail.value.book.updatedAt, 190_000)
  f.receive('connect')
  assert.equal(b.liveCount.value, 0)
})

test('an expired book recovers after an actual new snapshot without losing its retained history', () => {
  const b = setupBooks(activeFeed())
  b.onUpdate(book('a', 10_000))
  assert.equal(b.liveCount.value, 0)
  assert.equal(b.liveOrStatic({ url_name: 'a' }, 'bestSell'), 100)
  b.onUpdate(book('a', 200_000, 'sell'))
  assert.equal(b.liveCount.value, 1)
  assert.equal(b.buyCount.value, 0)
  assert.equal(b.sellCount.value, 1)
  assert.equal(b.currentLiveUpdate('a').book.updatedAt, 200_000)
})

test('online counts require their own observation time and do not inherit new-order freshness', () => {
  const f = activeFeed()
  f.receive('source-status', { books: true, orders: true })
  const b = setupBooks(f)
  assert.equal(b.pulseOnline.value, null)
  for (const onlineUpdatedAt of [undefined, null, 0, -1, NaN, Infinity, '200000', 10_000, 200_001]) {
    f.receive('pulse', { ...validPulse(200_000), onlineUpdatedAt })
    assert.equal(b.pulseOnline.value, null, `online report timestamp ${String(onlineUpdatedAt)}`)
    assert.equal(f.state.pulse.value.ordersPerMin, 0)
    assert.equal(f.state.pulse.value.recent.length, 1)
  }
  f.receive('pulse', { ...validPulse(200_000), online: { connections: 0, authorizedUsers: 0 } })
  assert.equal(b.pulseOnline.value.connections, 0)
  b.now.value = 380_000
  assert.ok(b.pulseOnline.value)
  b.now.value = 380_001
  assert.equal(b.pulseOnline.value, null)
  f.receive('pulse', { ...validPulse(380_001), onlineUpdatedAt: 200_000 })
  assert.equal(b.pulseOnline.value, null, 'new listings do not rejuvenate the online report')
})

const elements = (node, tag) => [
  ...(node.type === 1 && node.tag === tag ? [node] : []),
  ...(node.children ?? []).flatMap(child => elements(child, tag)),
]
const hasClass = (node, name) => node.props?.some(p => p.name === 'class' && p.value?.content.split(/\s+/).includes(name))
const text = node => node.type === 2 ? node.content : (node.children ?? []).map(text).join('')
const tree = parseHtml(page.template.content)
const header = elements(tree, 'header').find(node => hasClass(node, 'an-hero'))
const pulse = elements(tree, 'div').find(node => hasClass(node, 'live-pulse'))
assert.ok(header && pulse, 'actual live header and pulse exist')
test('actual AST exposes the hero to SSR and gates every verdict and advice on book freshness', () => {
  const clientBoundaries = elements(tree, 'client-only')
  assert.equal(clientBoundaries.length, 1)
  assert.equal(elements(clientBoundaries[0], 'header').some(node => hasClass(node, 'an-hero')), false)
  const badges = elements(tree, 'MarketVerdictBadge')
  assert.equal(badges.length, 3)
  for (const badge of badges) {
    assert.ok(badge.props.some(p => p.name === 'bind' && p.arg?.content === 'verdict'
      && p.exp?.content.includes('currentLiveUpdate(')))
  }
  const advice = elements(tree, 'div').filter(node => hasClass(node, 'ob-advice__row'))
  assert.equal(advice.length, 2)
  for (const row of advice) assert.ok(row.props.some(p => p.name === 'if' && p.exp?.content.includes('currentLiveUpdate(')))
})

function renderTemplate(source, filename) {
  const compiled = compileTemplate({ source, filename, id: filename, ssr: true, ssrCssVars: [] })
  assert.deepEqual(compiled.errors, [])
  const context = { exports: {}, require: name => {
    assert.ok(['vue', 'vue/server-renderer'].includes(name))
    return name === 'vue' ? vue : renderer
  } }
  runInNewContext(compile(compiled.code), context)
  return context.exports.ssrRender
}
const headerRender = renderTemplate(`<div>${header.loc.source}${pulse.loc.source}</div>`, 'live-header.vue')
const pageRender = renderTemplate(page.template.content, 'live.vue')
const fallback = parse(await readFile(new URL('../app/components/SeoFallbackTable.vue', import.meta.url), 'utf8')).descriptor.template
const fallbackRender = renderTemplate(fallback.content, 'SeoFallbackTable.vue')

for (const locale of Object.keys(messages)) {
  test(`${locale}: actual header and pulse render confirmed source availability`, async () => {
    const f = setupFeed()
    f.ensureLiveConnected()
    f.receive('connect')
    const b = setupBooks(f)
    b.now.value = 1000
    const i18n = createI18n({ legacy: false, locale, messages })
    async function render() {
      const warnings = []
      const app = vue.createSSRApp({ ssrRender: headerRender, setup: () => {
        const { t } = useI18n({ useScope: 'local', messages })
        return { ...f.state, pulseOnline: b.pulseOnline, t, fmtVol: n => String(n), localItemName: row => row.item_name }
      } })
      app.use(i18n)
      app.config.warnHandler = message => warnings.push(message)
      const html = await renderer.renderToString(app)
      assert.deepEqual(warnings, [])
      return parseHtml(html)
    }
    function checkState(rendered, isUp, hasPulse) {
      const state = elements(rendered, 'span').find(node => hasClass(node, 'live-state'))
      const dot = elements(rendered, 'span').find(node => hasClass(node, 'live-dot'))
      assert.equal(text(state), messages[locale].live.status[isUp ? 'live' : 'connecting'])
      assert.equal(hasClass(dot, 'is-on'), isUp)
      assert.equal(elements(rendered, 'div').some(node => hasClass(node, 'live-pulse')), hasPulse)
      assert.equal(elements(rendered, 'h1').length, 1)
    }
    checkState(await render(), false, false)
    f.receive('source-status', { books: false, orders: true })
    f.receive('pulse', validPulse())
    const observed = await render()
    checkState(observed, false, true)
    const observedStats = elements(observed, 'span').filter(node => hasClass(node, 'live-pulse__stat')).map(text)
    assert.equal(observedStats.length, 3)
    assert.ok(observedStats.some(label => label.includes(messages[locale].live.pulse.tradersOnline)))
    for (const onlineUpdatedAt of [undefined, 0, 1000]) {
      b.now.value = onlineUpdatedAt === 1000 ? 181_001 : 1000
      f.receive('pulse', { ...validPulse(b.now.value), onlineUpdatedAt })
      const unknownOnline = await render()
      checkState(unknownOnline, false, true)
      const stats = elements(unknownOnline, 'span').filter(node => hasClass(node, 'live-pulse__stat')).map(text)
      assert.equal(stats.length, 1)
      assert.equal(stats.some(label => label.includes(messages[locale].live.pulse.tradersOnline)), false)
      assert.equal(stats.some(label => label.includes(messages[locale].live.pulse.signedIn)), false)
      assert.ok(stats[0].includes(messages[locale].live.pulse.ordersPerMin))
      assert.ok(text(unknownOnline).includes('Test Item'))
    }
    f.receive('source-status', { books: true, orders: false })
    checkState(await render(), true, false)
    f.receive('disconnect')
    checkState(await render(), false, false)
  })

  test(`${locale}: full SSR page renders one localized heading before the real fallback table`, async () => {
    const f = setupFeed(false)
    const i18n = createI18n({ legacy: false, locale, messages })
    const app = vue.createSSRApp({ ssrRender: pageRender, setup: () => {
      const { t } = useI18n({ useScope: 'local', messages })
      return { ...f.state, t, fallbackRows: [{ key: 'a', name: 'Retained Item', href: '/items/a', cells: ['90p', '100p', '110p', '100'] }] }
    } })
    app.use(i18n)
    // Match Nuxt's server boundary explicitly. Rendering the default slot or
    // allowing attributes to fall through would make this an invalid SSR test.
    app.component('ClientOnly', { inheritAttrs: false, setup: (_, { slots }) => () => slots.fallback?.() ?? vue.h('span') })
    app.component('SeoFallbackTable', { props: ['caption', 'nameLabel', 'columns', 'rows'], ssrRender: fallbackRender })
    const interactive = new Set([...page.template.content.matchAll(/<(v-[a-z-]+)/g)].map(match => match[1]))
    interactive.add('MarketVerdictBadge')
    for (const tag of interactive) app.component(tag, { setup: () => () => { throw new Error(`${tag} escaped ClientOnly`) } })
    const warnings = []
    app.config.warnHandler = warning => warnings.push(warning)
    const html = await renderer.renderToString(app)
    const rendered = parseHtml(html)
    const heading = i18n.global.t('live.hero.title', { signals: messages[locale].live.hero.titleSignals })
    assert.deepEqual(elements(rendered, 'h1').map(text), [heading])
    assert.ok(elements(rendered, 'p').some(node => text(node) === messages[locale].live.hero.lede))
    assert.ok(html.indexOf('<h1') < html.indexOf('<table'))
    assert.equal(elements(rendered, 'tbody').length, 1)
    assert.equal(elements(elements(rendered, 'tbody')[0], 'tr').length, 1)
    assert.ok(html.includes('Retained Item'))
    assert.equal(elements(rendered, 'div').some(node => hasClass(node, 'live-pulse')), false)
    assert.equal(elements(rendered, 'span').some(node => hasClass(node, 'is-on')), false)
    assert.equal(f.connections.length, 0)
    assert.deepEqual(warnings, [])
  })
}
