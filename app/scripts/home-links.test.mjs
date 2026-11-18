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

const page = parse(await readFile(new URL('../app/pages/index.vue', import.meta.url), 'utf8')).descriptor
const elements = node => [node, ...(node.children ?? []).flatMap(elements)]
const buttons = elements(parseHtml(page.template.content)).filter(node => node.tag === 'v-btn'
  && node.props.some(prop => prop.type === 7 && prop.name === 'bind' && prop.arg?.content === 'to'))
assert.equal(buttons.length, 2)
const source = '<div>' + buttons.map(node => node.loc.source.slice(0, node.loc.source.indexOf('>') + 1) + 'Link</v-btn>').join('') + '</div>'
const compiled = compileTemplate({ source, filename: 'index.vue', id: 'home-links', ssr: true, ssrCssVars: [] })
assert.deepEqual(compiled.errors, [])
const context = { exports: {}, require: name => {
  assert.ok(['vue', 'vue/server-renderer'].includes(name))
  return name === 'vue' ? vue : renderer
} }
runInNewContext(compile(compiled.code), context)
const fixtures = [
  { item_name: 'Nami Skyla Prime Set', url_name: 'nami_skyla_prime_set', tags: [], path: '/set/' },
  { item_name: 'Lith C7 Relic', url_name: 'lith_c7_relic', tags: ['relic'], path: '/relic/' },
  { item_name: 'Nami Skyla Prime Blade', url_name: 'nami_skyla_prime_blade', tags: [], path: null },
]

for (const locale of locales) {
  test(`${locale}: homepage set and relic buttons preserve language and exclude ordinary components`, async () => {
    const { router, localePath } = await createLocalizedRouting(locale, ['/', '/set/:set?', '/relic/:relic?'])
    for (const item of fixtures) {
      const app = vue.createSSRApp({ ssrRender: context.exports.ssrRender, setup: () => ({ item, localePath, trackAction: () => {} }) })
      app.use(router)
      app.component('VBtn', { props: ['to'], setup: (props, { slots }) => () => vue.h(RouterLink, { to: props.to }, slots) })
      const html = await renderer.renderToString(app)
      const anchors = elements(parseHtml(html)).filter(node => node.tag === 'a')
      assert.equal(anchors.length, item.path ? 1 : 0)
      if (item.path) {
        const href = anchors[0].props.find(prop => prop.name === 'href').value.content
        assert.equal(href, (locale === 'en' ? '' : '/' + locale) + item.path + item.url_name)
        await router.push(href)
        assert.equal(router.currentRoute.value.params[item.path.slice(1, -1)], item.url_name)
      }
    }
  })
}

test('homepage SSR rows use localized display names while preserving market identifiers and ordering', () => {
  const allItems = vue.ref(fixtures.map((item, index) => ({ ...item, market: { volume: index, buy: 10, sell: 12 } })))
  const language = vue.ref('es')
  const scope = { exports: {}, computed: vue.computed, allItems, fixPrice: String, localItemName: item => language.value + ':' + item.item_name }
  runInNewContext(compile(declarations(page.scriptSetup.content, ['fallbackRows']) + '\nexports.rows = fallbackRows;'), scope)
  const rows = scope.exports.rows
  assert.equal(rows.value[0].name, 'es:' + fixtures[2].item_name)
  assert.equal(rows.value[0].href, 'https://warframe.market/items/' + fixtures[2].url_name)
  assert.equal(rows.value[0].key, fixtures[2].url_name)
  assert.equal(allItems.value[0].url_name, fixtures[0].url_name)
  language.value = 'ja'
  assert.equal(rows.value[0].name, 'ja:' + fixtures[2].item_name)
  allItems.value = []
  assert.equal(rows.value.length, 0)
})
