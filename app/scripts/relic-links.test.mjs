import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'
import { runInNewContext } from 'node:vm'
import { compileTemplate, parse } from '@vue/compiler-sfc'
import { parse as parseHtml } from '@vue/compiler-dom'
import * as vue from 'vue'
import * as renderer from 'vue/server-renderer'
import * as routerApi from 'vue-router'
import * as ufo from 'ufo'
import * as shared from '@intlify/shared'
import { createI18n, useI18n } from 'vue-i18n'
import ts from 'typescript'
import farmingMessages from '../i18n/messages/relicFarming.ts'

const read = path => readFile(new URL(path, import.meta.url), 'utf8')
const compile = source => ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
}).outputText
function declarations(source, names) {
  const ast = ts.createSourceFile('test-source.ts', source, ts.ScriptTarget.Latest, true)
  return names.map(name => {
    const node = ast.statements.find(node => ts.isFunctionDeclaration(node)
      ? node.name?.text === name
      : ts.isVariableStatement(node) && node.declarationList.declarations.some(d => d.name.getText(ast) === name))
    assert.ok(node, `actual declaration ${name}`)
    return node.getText(ast)
  }).join('\n')
}
const config = await read('../nuxt.config.ts')
const configContext = { exports: {} }
runInNewContext(compile(declarations(config, ['LOCALES']) + '\nexports.locales = LOCALES;'), configContext)
const locales = Array.from(configContext.exports.locales, locale => locale.code)
assert.equal(locales.length, 13)
assert.match(config, /strategy:\s*'prefix_except_default'/)
assert.match(config, /defaultLocale:\s*'en'/)

// Run the installed Nuxt i18n path resolver, rather than a prefix stub. The
// selected declarations avoid its Nuxt-only imports while retaining its actual
// path/query/hash normalization and named-route resolution through Vue Router.
const runtime = '../node_modules/@nuxtjs/i18n/dist/runtime/'
const i18nCode = [
  declarations(await read(runtime + 'routing/routing.js'), ['localePath', 'getRouteBaseName', 'normalizeRawLocation', 'isRouteLocationPathRaw', 'resolveRouteObject', 'resolveRoute', 'resolve']),
  declarations(await read(runtime + 'routing/utils.js'), ['getRouteName', 'getLocaleRouteName']),
  declarations(await read(runtime + 'utils.js'), ['prefixable']),
  declarations(await read(runtime + 'compatibility.js'), ['isI18nInstance', 'getI18nTarget']),
  'exports.resolveLocalePath = localePath;',
].join('\n')
const i18nContext = { exports: {}, ...ufo, ...shared, unref: vue.unref, isNavigationFailure: routerApi.isNavigationFailure }
runInNewContext(compile(i18nCode), i18nContext)
const routePaths = ['/relics-value', '/relic-farming', '/forma-relics', '/relic/:relic?', '/guides/forma', '/star-chart-3d']
async function routing(locale) {
  const router = routerApi.createRouter({ history: routerApi.createMemoryHistory(), routes: locales.flatMap(code => routePaths.map((path, i) => ({
    name: `page-${i}___${code}`,
    path: (code === 'en' ? '' : `/${code}`) + path,
    component: { render: () => null },
  }))) })
  const localeRef = vue.ref(locale)
  const common = { router, i18n: { locale: localeRef }, runtimeConfig: { public: { i18n: {
    defaultLocale: 'en', strategy: 'prefix_except_default', differentDomains: false,
    routesNameSeparator: '___', defaultLocaleRouteNameSuffix: 'default', trailingSlash: false,
  } } } }
  await router.push((locale === 'en' ? '' : `/${locale}`) + '/relics-value')
  const localePath = path => i18nContext.exports.resolveLocalePath(common, path)
  return { router, localePath, localeRef }
}

const filenames = ['relics-value.vue', 'relic-farming.vue', 'forma-relics.vue', 'relic/[[relic]].vue']
const pages = new Map(await Promise.all(filenames.map(async filename => {
  const parsed = parse(await read('../app/pages/' + filename))
  assert.deepEqual(parsed.errors, [])
  return [filename, parsed.descriptor]
})))
const elements = (node, tag) => [
  ...(node.type === 1 && node.tag.replaceAll('-', '').toLowerCase() === tag.replaceAll('-', '').toLowerCase() ? [node] : []),
  ...(node.children ?? []).flatMap(child => elements(child, tag)),
]
const attr = (node, name) => node.props.find(prop => prop.type === 6 && prop.name === name)?.value?.content
const text = node => node.type === 2 ? node.content : (node.children ?? []).map(text).join('')
function renderFunction(source, filename) {
  const compiled = compileTemplate({ source, filename, id: filename, ssr: true, ssrCssVars: [] })
  assert.deepEqual(compiled.errors, [])
  const context = { exports: {}, require: name => {
    assert.ok(['vue', 'vue/server-renderer'].includes(name))
    return name === 'vue' ? vue : renderer
  } }
  runInNewContext(compile(compiled.code), context)
  return context.exports.ssrRender
}
const linkRenderers = new Map(Array.from(pages, ([filename, descriptor]) => {
  const links = elements(parseHtml(descriptor.template.content), 'nuxt-link')
  return [filename, { count: links.length, render: renderFunction(`<div>${links.map(n => n.loc.source).join('')}</div>`, filename) }]
}))
const fallback = parse(await read('../app/components/SeoFallbackTable.vue')).descriptor
const fallbackRender = renderFunction(fallback.template.content, 'SeoFallbackTable.vue')
const fallbackContext = { exports: {} }
runInNewContext(compile(declarations(fallback.scriptSetup.content, ['opensNewTab']) + '\nexports.opensNewTab = opensNewTab;'), fallbackContext)
const fallbackHelpers = fallbackContext.exports
const row = { url_name: 'lith_h7_relic', relicName: 'Lith H7', tier: 'Lith', relic: { volume: 4 }, rewards: [] }
const forma = { row, count: 2, intactChance: 11, rarity: 'Uncommon', status: 'dropping' }
function pageScope(filename, localePath) {
  const context = { exports: {}, computed: vue.computed, useLocalePath: () => localePath,
    filtered: vue.ref(filename === 'forma-relics.vue' ? [forma] : [row]),
    fmtPlat: String, fmtPct: String, statusLabel: String,
    ev: () => 2, evRaw: () => 3, relicSellNow: () => 1, platPerHour: () => 30,
    demand: () => ({ label: 'Demand', cls: '' }), localName: (_scope, _slug, name) => name,
  }
  // This also catches a template referring to a missing setup composable.
  const names = [
    ...(pages.get(filename).scriptSetup.content.includes('const localePath =') ? ['localePath'] : []),
    ...(filename.startsWith('relic/') ? [] : ['fallbackRows']),
  ]
  runInNewContext(compile(declarations(pages.get(filename).scriptSetup.content, names) + `\nexports.scope = { ${names.join(',')} };`), context)
  return { ...context, ...context.exports.scope, row, topDeal: row, topDealUrl: row.url_name,
    f: forma, paged: filename === 'forma-relics.vue' ? [forma] : [row],
    refinementLabel: 'Intact', t: key => key, localItemName: item => item.item_name,
    relicThumb: () => '', onImgError: () => {}, openDrops: () => {},
    dropMix: () => ({ vaulted: 0 }), liquidity: () => 1,
    topDrop: () => ({ item_name: 'Example Prime', price: 3, volume: 4, rarity: 'Common' }),
    rewardVaulted: () => false,
  }
}
async function render(render, scope, router) {
  const app = vue.createSSRApp({ setup: () => scope, ssrRender: render })
  app.use(router)
  app.component('NuxtLink', routerApi.RouterLink)
  app.component('v-icon', { setup: (_, { slots }) => () => vue.h('span', slots.default?.()) })
  const warnings = []
  app.config.warnHandler = warning => warnings.push(warning)
  const html = await renderer.renderToString(app)
  assert.deepEqual(warnings, [])
  return { html, anchors: elements(parseHtml(html), 'a') }
}
const prefixed = (locale, path) => (locale === 'en' ? '' : `/${locale}`) + path

for (const locale of locales) {
  test(`${locale}: actual hero, desktop and mobile relic links resolve in the active language`, async () => {
    const { router, localePath } = await routing(locale)
    for (const filename of ['relics-value.vue', 'relic-farming.vue']) {
      const { render: renderer, count } = linkRenderers.get(filename)
      assert.equal(count, 3, `${filename}: hero, desktop and mobile`)
      const output = await render(renderer, pageScope(filename, localePath), router)
      assert.equal(output.anchors.length, 3)
      for (const anchor of output.anchors) {
        assert.equal(attr(anchor, 'href'), prefixed(locale, '/relic/lith_h7_relic'))
        assert.equal(attr(anchor, 'target'), undefined)
      }
    }
  })

  test(`${locale}: actual fallback rows render localized crawlable destinations on all three boards`, async () => {
    const { router, localePath } = await routing(locale)
    for (const filename of filenames.slice(0, 3)) {
      const scope = pageScope(filename, localePath)
      const output = await render(fallbackRender, {
        ...fallbackHelpers, caption: 'Relics', nameLabel: 'Relic', columns: [], rows: scope.fallbackRows.value,
      }, router)
      assert.equal(output.anchors.length, 1)
      assert.equal(attr(output.anchors[0], 'href'), prefixed(locale, '/relic/lith_h7_relic'))
      assert.equal(attr(output.anchors[0], 'target'), undefined, 'internal fallback links stay in the current tab')
    }
  })

  test(`${locale}: Forma guide/map query links and relic-detail return/picker retain existing behavior`, async () => {
    const { router, localePath } = await routing(locale)
    const formaLinks = linkRenderers.get('forma-relics.vue')
    assert.equal(formaLinks.count, 5)
    const output = await render(formaLinks.render, pageScope('forma-relics.vue', localePath), router)
    assert.deepEqual(output.anchors.map(a => attr(a, 'href')), [
      '/guides/forma', '/star-chart-3d?forma=1', '/relic/lith_h7_relic', '/relic/lith_h7_relic', '/guides/forma',
    ].map(path => prefixed(locale, path)))
    const detail = 'relic/[[relic]].vue'
    const detailLinks = linkRenderers.get(detail)
    assert.equal(detailLinks.count, 1)
    const detailOutput = await render(detailLinks.render, pageScope(detail, localePath), router)
    assert.equal(attr(detailOutput.anchors[0], 'href'), prefixed(locale, '/relics-value'))
    const events = []
    const context = { exports: {}, router, localePath, relicSlug: vue.ref(row.url_name),
      allSets: vue.ref([{ url_name: 'axi_a1_relic', item_name: 'Axi A1 Relic' }]),
      trackSelectItem: (...args) => events.push(args),
    }
    runInNewContext(compile(declarations(pages.get(detail).scriptSetup.content, ['onPick']) + '\nexports.onPick = onPick;'), context)
    context.exports.onPick(null)
    context.exports.onPick(row.url_name)
    assert.equal(events.length, 0)
    context.exports.onPick('axi_a1_relic')
    await new Promise(resolve => router.afterEach(resolve))
    assert.equal(router.currentRoute.value.fullPath, prefixed(locale, '/relic/axi_a1_relic'))
    assert.equal(events.length, 1)
  })

  test(`${locale}: the complete farming template renders one localized heading before data without client widgets`, async () => {
    const filename = 'relic-farming.vue'
    const descriptor = pages.get(filename)
    const ssrRender = renderFunction(descriptor.template.content, filename)
    for (const hasData of [true, false]) for (const refinement of ['Intact', 'Radiant']) {
      const { router, localePath } = await routing(locale)
      const scope = pageScope(filename, localePath)
      if (!hasData) scope.filtered.value = []
      const i18n = createI18n({ legacy: false, locale, messages: farmingMessages })
      const labelContext = { exports: {}, computed: vue.computed, refinement: vue.ref(refinement), t: i18n.global.t }
      runInNewContext(compile(declarations(descriptor.scriptSetup.content, ['refinementLabel']) + '\nexports.label = refinementLabel;'), labelContext)
      const refinementLabel = labelContext.exports.label.value
      const app = vue.createSSRApp({ ssrRender, setup: () => ({
        t: useI18n({ useScope: 'local', messages: farmingMessages }).t,
        fallbackRows: scope.fallbackRows, refinementLabel,
      }) })
      app.use(i18n)
      app.use(router)
      // Nuxt's server boundary renders only fallback slots. Throwing widgets
      // catch accidental promotion of data-dependent UI into the SSR hero.
      app.component('ClientOnly', { setup: (_, { slots }) => () => slots.fallback?.() ?? vue.h('span') })
      app.component('SeoFallbackTable', { props: ['caption', 'nameLabel', 'columns', 'rows'], setup: () => fallbackHelpers, ssrRender: fallbackRender })
      for (const tag of new Set([...descriptor.template.content.matchAll(/<(v-[a-z-]+|nuxt-link|DropLocationsDialog)/g)].map(match => match[1]))) {
        app.component(tag, { setup: () => () => { throw new Error(`${tag} escaped its client boundary`) } })
      }
      const warnings = []
      app.config.warnHandler = warning => warnings.push(warning)
      const html = await renderer.renderToString(app)
      const tree = parseHtml(html, { whitespace: 'preserve' })
      const t = i18n.global.t
      assert.deepEqual(elements(tree, 'h1').map(text), [t('relicFarming.hero.title', {
        farm: t('relicFarming.hero.titleFarm'), platHour: t('relicFarming.hero.titlePlatHour'),
      })])
      assert.deepEqual(elements(tree, 'p').map(text), [t('relicFarming.hero.lede', { refinement: refinementLabel.toLowerCase() })])
      assert.ok(html.indexOf('<h1') < html.indexOf('<table'))
      assert.equal(elements(elements(tree, 'tbody')[0], 'tr').length, Number(hasData))
      assert.equal(html.includes('an-hero__deal'), false)
      assert.equal(html.includes('an-filters'), false)
      assert.equal(html.includes('an-stats'), false)
      assert.deepEqual(warnings, [])
    }
  })
}

test('the real locale resolver preserves query/fragment and reacts to locale changes without altering external URLs', async () => {
  const { router, localePath, localeRef } = await routing('es')
  const scope = pageScope('relics-value.vue', localePath)
  for (const locale of locales) {
    localeRef.value = locale
    assert.equal(scope.fallbackRows.value[0].href, prefixed(locale, '/relic/lith_h7_relic'))
    const destination = localePath('/relic/lith_h7_relic?ref=Radiant&q=Forma%20Prime#rewards')
    const resolved = router.resolve(destination)
    assert.equal(resolved.path, prefixed(locale, '/relic/lith_h7_relic'))
    assert.deepEqual(resolved.query, { ref: 'Radiant', q: 'Forma Prime' })
    assert.equal(resolved.hash, '#rewards')
    assert.equal(localePath('https://warframe.market/items/lith_h7_relic#orders'), 'https://warframe.market/items/lith_h7_relic#orders')
  }
})
