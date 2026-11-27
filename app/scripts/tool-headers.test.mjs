import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'
import { runInNewContext } from 'node:vm'
import { compileTemplate, parse } from '@vue/compiler-sfc'
import { parse as parseHtml } from '@vue/compiler-dom'
import * as vue from 'vue'
import * as serverRenderer from 'vue/server-renderer'
import { createI18n, useI18n } from 'vue-i18n'
import ts from 'typescript'
import { loadSsrComponent } from './helpers/ssr-component.mjs'
import navMessages from '../i18n/messages/nav.ts'
import worthMessages from '../i18n/messages/vaultedWorth.ts'

const pages = [
  ['comparison', 'comparison', { set: 'titleSet', parts: 'titleParts' }],
  ['screener', 'screener', { whole: 'titleWhole', atOnce: 'titleAtOnce' }],
  ['movers', 'movers', { pumping: 'titlePumping', dumping: 'titleDumping' }],
  ['volatility', 'volatility', { stable: 'titleStable', wild: 'titleWild' }],
  ['timing', 'timing', { low: 'low', high: 'high' }],
  ['vault-spikes', 'vaultSpikes', { climbing: 'titleClimbing' }],
  ['vaulted', 'vaultedPage', { vault: 'titleVault' }],
  ['vaulted-worth', 'vaultedWorth', { worth: 'titleWorth' }],
]

function renderTemplate(template, filename) {
  const result = compileTemplate({ source: template, filename, id: filename, ssr: true, ssrCssVars: [] })
  assert.deepEqual(result.errors, [])
  const context = { exports: {}, require: name => {
    assert.ok(['vue', 'vue/server-renderer'].includes(name))
    return name === 'vue' ? vue : serverRenderer
  } }
  runInNewContext(ts.transpileModule(result.code, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
  }).outputText, context)
  return context.exports.ssrRender
}

function elements(node, tag) {
  return [...(node.type === 1 && node.tag === tag ? [node] : []), ...(node.children ?? []).flatMap(child => elements(child, tag))]
}
const text = node => node.type === 2 ? node.content : (node.children ?? []).map(text).join('')
const fallbackTable = await loadSsrComponent(new URL('../app/components/SeoFallbackTable.vue', import.meta.url))

for (const [page, namespace, slots] of pages) {
  test(`${page}: localized heading and introduction precede real rows even without client JavaScript`, async () => {
    const template = parse(await readFile(new URL(`../app/pages/${page}.vue`, import.meta.url), 'utf8')).descriptor.template
    const originalMessages = (await import(`../i18n/messages/${namespace}.ts`)).default
    const messages = Object.fromEntries(Object.entries(originalMessages).map(([locale, values]) => [locale, {
      ...values, nav: navMessages[locale].nav, vaultedWorth: worthMessages[locale].vaultedWorth,
    }]))
    const ssrRender = renderTemplate(template.content, `${page}.vue`)
    for (const locale of ['en', 'es']) for (const hasData of [true, false]) {
      const i18n = createI18n({ legacy: false, locale, messages })
      const rows = hasData ? [{ key: 'test', href: 'https://warframe.market/items/bronco_prime_barrel', name: 'Bronco Prime Barrel', cells: ['1p', '25', '37'] }] : []
      const app = vue.createSSRApp({ ssrRender, setup: () => {
        const { t } = useI18n({ useScope: 'local', messages })
        return { t, fallbackRows: rows, timeframeLabel: '7d' }
      } })
      app.use(i18n)
      // Match Nuxt's server boundary; only the fallback is rendered before hydration.
      app.component('ClientOnly', { setup: (_, { slots }) => () => slots.fallback?.() ?? vue.h('span') })
      app.component('SeoFallbackTable', fallbackTable)
      for (const tag of new Set([...template.content.matchAll(/<(v-[a-z-]+)/g)].map(match => match[1]))) {
        app.component(tag, { setup: () => () => { throw new Error(`${tag} escaped its client boundary`) } })
      }
      const hasResurgenceLinks = ['vaulted', 'vaulted-worth'].includes(page)
      if (hasResurgenceLinks) {
        app.component('PrimeResurgenceLinks', await loadSsrComponent(new URL('../app/components/PrimeResurgenceLinks.vue', import.meta.url), {
          useI18n, useLocalePath: () => path => (locale === 'en' ? '' : '/' + locale) + path,
        }))
        app.component('NuxtLink', { props: ['to'], setup: (props, { slots }) => () => vue.h('a', { href: props.to }, slots.default?.()) })
      } else {
        app.component('NuxtLink', { setup: () => () => { throw new Error('Dynamic hero escaped its client boundary') } })
      }
      const warnings = []
      app.config.warnHandler = warning => warnings.push(warning)
      const html = await serverRenderer.renderToString(app)
      const tree = parseHtml(html)
      const expectedSlots = Object.fromEntries(Object.entries(slots).map(([slot, key]) => [slot, i18n.global.t(`${namespace}.hero.${key}`)]))
      assert.deepEqual(elements(tree, 'h1').map(text), [i18n.global.t(`${namespace}.hero.title`, expectedSlots)])
      const paragraphs = [messages[locale][namespace].hero.lede]
      if (page === 'comparison') paragraphs.push(messages[locale][namespace].pricingNote)
      if (hasResurgenceLinks) {
        paragraphs.push(messages[locale].vaultedWorth.reason.resurgence)
        const panel = elements(tree, 'section').find(node => node.props.some(prop => prop.name === 'aria-labelledby' && prop.value?.content === 'prime-resurgence-title'))
        assert.ok(panel, 'Reference links must render even without market data or client JavaScript')
        assert.deepEqual(elements(panel, 'a').map(node => node.props.find(prop => prop.name === 'href')?.value?.content), [
          'https://www.warframe.com/en/shop/prime/resurgence',
          (locale === 'en' ? '' : '/' + locale) + '/relics',
          (locale === 'en' ? '' : '/' + locale) + '/guides/relics#vaulting',
        ])
      }
      assert.deepEqual(elements(tree, 'p').map(text), paragraphs)
      assert.ok(html.indexOf('<h1') < html.indexOf('<table'), `${locale}: heading must precede data`)
      assert.equal(elements(elements(tree, 'tbody')[0], 'tr').length, rows.length)
      assert.equal(html.includes('bronco_prime_barrel'), hasData)
      assert.equal(html.includes('an-filters'), false)
      assert.equal(html.includes('an-hero__deal'), false)
      assert.deepEqual(warnings, [], `${page}/${locale}`)
    }
  })
}
