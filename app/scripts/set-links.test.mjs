import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'
import { runInNewContext } from 'node:vm'
import { compileTemplate, parse } from '@vue/compiler-sfc'
import { parse as parseHtml } from '@vue/compiler-dom'
import * as vue from 'vue'
import * as renderer from 'vue/server-renderer'
import { RouterLink } from 'vue-router'
import { compile, declarations, locales, createLocalizedRouting } from './helpers/locale-routing.mjs'
import { loadSsrComponent } from './helpers/ssr-component.mjs'

const names = ['comparison', 'vault-spikes', 'vaulted-worth', 'volatility', 'vaulted']
const pages = new Map(await Promise.all(names.map(async name => {
  const parsed = parse(await readFile(new URL(`../app/pages/${name}.vue`, import.meta.url), 'utf8'))
  assert.deepEqual(parsed.errors, [])
  return [name, parsed.descriptor]
})))
const fallback = await loadSsrComponent(new URL('../app/components/SeoFallbackTable.vue', import.meta.url))
const routes = [...names.map(name => '/' + name), '/set/:set?']
const prefixed = (locale, destination) => (locale === 'en' ? '' : '/' + locale) + destination
const elements = (node, tag) => [
  ...(node.type === 1 && node.tag.toLowerCase().replaceAll('-', '') === tag.toLowerCase().replaceAll('-', '') ? [node] : []),
  ...(node.children ?? []).flatMap(child => elements(child, tag)),
]
const attr = (node, name) => node.props.find(prop => prop.type === 6 && prop.name === name)?.value?.content
const set = { url_name: 'nami_skyla_prime_set', item_name: 'Nami Skyla Prime Set', set: { volume: 3 }, vaulted: true,
  price: 235, volume: 3, _verdict: 'buy', change7d: null, change30d: null, volatility: null, trend: null,
  acquire: { setCost: 235, partsCost: 200 }, resale: { partsValue: 220 }, market: { sell: 235, buy: 220, diff: 15, volume: 3 } }
// The catalogue marks both assembled sets and their components as set:true.
// Nami Skyla Prime Blade must remain a market destination, not a /set route.
const part = { ...set, url_name: 'nami_skyla_prime_blade', item_name: 'Nami Skyla Prime Blade', set: true, price: 60 }

function scopeFor(name, localePath) {
  const rows = name === 'comparison' ? [set] : [set, part]
  const scope = { exports: {}, computed: vue.computed, useLocalePath: () => localePath,
    filtered: vue.ref(rows), items: vue.ref(rows), decorated: vue.ref(rows),
    fmtPlat: String, fmtQuote: String, fmtSignedPct: String, fmtVol: String, trendArrow: String,
    priceOf: row => row.price, num: (value, fallback = 0) => value ?? fallback, VERDICT_RANK: { buy: 3 },
    localItemName: row => row.item_name, t: key => key,
  }
  const script = pages.get(name).scriptSetup.content
  const bindings = [
    ...(script.includes('const localePath =') ? ['localePath'] : []),
    ...(name === 'comparison' ? [] : ['mkt']), 'fallbackRows',
  ]
  runInNewContext(compile(declarations(script, bindings) + `\nexports.bindings = { ${bindings.join(',')} };`), scope)
  return { ...scope, ...scope.exports.bindings, row: set, i: 0, paged: rows, topDeal: set, topBuy: set,
    topDealUrl: set.url_name, topBuyUrl: set.url_name, onSetNav: () => {}, onMarketOpen: () => {}, rank: value => value,
  }
}

// Compile each actual navigation element's opening tag. The body is irrelevant
// to navigation; keeping directives, bindings and loops exercises all destinations.
const linkRenderers = new Map(Array.from(pages, ([name, descriptor]) => {
  const tree = parseHtml(descriptor.template.content)
  const links = [...elements(tree, 'NuxtLink'), ...elements(tree, 'a'), ...elements(tree, 'v-btn')]
    .filter(node => node.props.some(prop => prop.type === 7 && prop.name === 'bind' && ['to', 'href'].includes(prop.arg?.content)))
  const source = '<div>' + links.map(node => node.loc.source.slice(0, node.loc.source.indexOf('>') + 1) + 'Link</' + node.tag + '>').join('') + '</div>'
  const compiled = compileTemplate({ source, filename: name + '.vue', id: name, ssr: true, ssrCssVars: [] })
  assert.deepEqual(compiled.errors, [])
  const context = { exports: {}, require: name => {
    assert.ok(['vue', 'vue/server-renderer'].includes(name))
    return name === 'vue' ? vue : renderer
  } }
  runInNewContext(compile(compiled.code), context)
  return [name, { count: links.length, ssrRender: context.exports.ssrRender }]
}))

async function renderLinks(name, scope, router) {
  const app = vue.createSSRApp({ ssrRender: linkRenderers.get(name).ssrRender, setup: () => scope })
  app.use(router)
  app.component('NuxtLink', RouterLink)
  // Exercise the real VBtn :to binding with Vue Router's anchor renderer. This
  // test does not depend on Vuetify styles or claim to test the button's styling.
  app.component('VBtn', { props: ['to', 'href'], setup: (props, { slots }) => () => props.to
    ? vue.h(RouterLink, { to: props.to }, slots)
    : vue.h('a', { href: props.href }, slots.default?.()) })
  const warnings = []
  app.config.warnHandler = warning => warnings.push(warning)
  const html = await renderer.renderToString(app)
  assert.deepEqual(warnings, [])
  return elements(parseHtml(html), 'a')
}

for (const locale of locales) {
  test(`${locale}: all five set-board fallback builders render localized internal links and preserve external part destinations`, async () => {
    const { localePath } = await createLocalizedRouting(locale, routes)
    for (const name of names) {
      const scope = scopeFor(name, localePath)
      const rows = scope.fallbackRows.value
      const app = vue.createSSRApp(fallback, { caption: 'Sets', nameLabel: 'Item', columns: [], rows })
      const anchors = elements(parseHtml(await renderer.renderToString(app)), 'a')
      assert.equal(anchors.length, name === 'comparison' ? 1 : 2, name + ' fixture rows')
      assert.equal(attr(anchors[0], 'href'), prefixed(locale, '/set/' + set.url_name), name + ' set href')
      assert.equal(attr(anchors[0], 'target'), undefined, name + ' internal same tab')
      if (name !== 'comparison') {
        assert.equal(attr(anchors[1], 'href'), 'https://warframe.market/items/' + part.url_name, name + ' external part href')
        assert.equal(attr(anchors[1], 'target'), '_blank')
        assert.equal(attr(anchors[1], 'rel'), 'noopener')
      }
      assert.equal(rows[0].key, set.url_name, 'canonical API identifier unchanged')
      scope.filtered.value = []; scope.items.value = []; scope.decorated.value = []
      assert.equal(scope.fallbackRows.value.length, 0, name + ' empty data')
    }
  })

  test(`${locale}: comparison hero, row, mobile card and button all resolve to the localized set page`, async () => {
    const { router, localePath } = await createLocalizedRouting(locale, routes)
    assert.equal(linkRenderers.get('comparison').count, 4)
    const anchors = await renderLinks('comparison', scopeFor('comparison', localePath), router)
    assert.equal(anchors.length, 4)
    for (const anchor of anchors) {
      assert.equal(attr(anchor, 'href'), prefixed(locale, '/set/' + set.url_name))
      assert.equal(attr(anchor, 'target'), undefined)
      await router.push(attr(anchor, 'href'))
      assert.equal(router.currentRoute.value.params.set, set.url_name)
      assert.equal(router.currentRoute.value.fullPath, prefixed(locale, '/set/' + set.url_name))
    }
  })

  test(`${locale}: existing market links in the four other boards keep their external destinations`, async () => {
    const { router, localePath } = await createLocalizedRouting(locale, routes)
    for (const name of names.slice(1)) {
      assert.equal(linkRenderers.get(name).count, name === 'vaulted' ? 4 : 3)
      const anchors = await renderLinks(name, scopeFor(name, localePath), router)
      assert.equal(anchors.length, name === 'vaulted' ? 5 : 4)
      assert.ok(anchors.some(anchor => attr(anchor, 'href') === 'https://warframe.market/items/' + part.url_name))
      for (const anchor of anchors) {
        assert.ok([set, part].some(row => attr(anchor, 'href') === 'https://warframe.market/items/' + row.url_name), name)
        assert.equal(attr(anchor, 'target'), '_blank')
      }
    }
  })
}

test('set fallback links react to locale changes and the real resolver preserves query/fragment and already-localized routes', async () => {
  const { router, localePath, localeRef } = await createLocalizedRouting('es', routes)
  const scopes = names.map(name => scopeFor(name, localePath))
  for (const locale of locales) {
    localeRef.value = locale
    for (const scope of scopes) assert.equal(scope.fallbackRows.value[0].href, prefixed(locale, '/set/' + set.url_name))
    const destination = localePath('/set/' + set.url_name + '?view=parts&q=Prime%20Set#prices')
    const resolved = router.resolve(destination)
    assert.equal(resolved.path, prefixed(locale, '/set/' + set.url_name))
    assert.deepEqual(resolved.query, { view: 'parts', q: 'Prime Set' })
    assert.equal(resolved.hash, '#prices')
    assert.equal(localePath(prefixed(locale, '/set/' + set.url_name)), prefixed(locale, '/set/' + set.url_name))
    assert.equal(localePath('https://warframe.market/items/' + part.url_name), 'https://warframe.market/items/' + part.url_name)
  }
})
