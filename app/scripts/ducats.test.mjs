import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'
import { runInNewContext } from 'node:vm'
import { compileTemplate, parse } from '@vue/compiler-sfc'
import * as vue from 'vue'
import * as serverRenderer from 'vue/server-renderer'
import { computed, ref } from 'vue'
import { createI18n, useI18n } from 'vue-i18n'
import ts from 'typescript'
import messages from '../i18n/messages/ducatsPage.ts'

// Execute the actual page's eligibility binding, so SSR rows and interactive
// filters cannot silently drift from the rule exercised by these fixtures.
const descriptor = parse(await readFile(new URL('../app/pages/ducats.vue', import.meta.url), 'utf8')).descriptor
const source = descriptor.scriptSetup.content
const file = ts.createSourceFile('ducats.vue', source, ts.ScriptTarget.Latest, true)
const wanted = new Set(['isDucatPart', 'ducatItems'])
const statements = []
for (const statement of file.statements) {
  if (ts.isFunctionDeclaration(statement) && wanted.has(statement.name?.text)) statements.push(statement.getText(file))
  if (ts.isVariableStatement(statement)) for (const declaration of statement.declarationList.declarations) {
    if (wanted.has(declaration.name.getText(file))) statements.push(`const ${declaration.getText(file)};`)
  }
}
assert.equal(statements.length, wanted.size)
const compiled = ts.transpileModule(statements.join('\n') + '\nexports.rows = ducatItems;', {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
}).outputText
function eligible(rows) {
  const context = { exports: {}, computed, allItems: ref(rows) }
  runInNewContext(compiled, context)
  return Array.from(context.exports.rows.value)
}

test('Ducat comparison keeps the current Blade value and excludes its assembled set', () => {
  const blade = { url_name: 'nami_skyla_prime_blade', tags: ['component', 'weapon', 'prime'], ducats: 65, market: { sell: 25 } }
  const set = { url_name: 'nami_skyla_prime_set', tags: ['weapon', 'prime', 'set'], ducats: 235, market: { sell: 94 } }
  assert.deepEqual(eligible([blade, set]), [blade])
  assert.equal(eligible([blade])[0].ducats / blade.market.sell, 2.6)
})

test('legacy parts remain exchangeable despite inherited set tags while canonical sets stay excluded', () => {
  const parts = [
    { url_name: 'tigris_prime_receiver', tags: ['primary', 'prime', 'weapon', 'set'], ducats: 45, market: { sell: 10 } },
    { url_name: 'helios_prime_carapace', tags: ['prime', 'sentinel', 'set'], ducats: 15, market: { sell: 10 } },
    { url_name: 'equinox_prime_blueprint', tags: ['set', 'prime', 'warframe'], ducats: 45, market: { sell: 10 } },
  ]
  assert.deepEqual(eligible([
    ...parts,
    { url_name: 'nami_skyla_prime_set', tags: ['component', 'prime'], ducats: 235, market: { sell: 94 } },
    { url_name: 'tigris_prime_set', tags: ['primary', 'prime', 'weapon', 'set'], ducats: 205, market: { sell: 94 } },
  ]), parts)
})

test('missing, invalid and nonpositive exchange values or asks cannot become offers', () => {
  const part = { url_name: 'nami_skyla_prime_blade', ducats: 65, market: { sell: 25 } }
  for (const ducats of [undefined, null, '65', 0, -1, 65.5, NaN, Infinity]) assert.deepEqual(eligible([{ ...part, ducats }]), [])
  for (const sell of [undefined, null, '25', 0, -1, NaN, Infinity]) assert.deepEqual(eligible([{ ...part, market: { sell } }]), [])
  assert.deepEqual(eligible([null, {}, { ...part, market: undefined }]), [])
})

function ssrRender(template, filename) {
  const result = compileTemplate({ source: template, filename, id: filename, ssr: true, ssrCssVars: [] })
  assert.deepEqual(result.errors, [], `${filename} compiles for SSR`)
  const context = {
    exports: {},
    require: (name) => {
      assert.ok(['vue', 'vue/server-renderer'].includes(name), name)
      return name === 'vue' ? vue : serverRenderer
    },
  }
  runInNewContext(ts.transpileModule(result.code, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
  }).outputText, context)
  return context.exports.ssrRender
}

const renderPage = ssrRender(descriptor.template.content, 'ducats.vue')
const fallbackTemplate = parse(await readFile(new URL('../app/components/SeoFallbackTable.vue', import.meta.url), 'utf8')).descriptor.template.content
const fallbackTable = {
  props: ['caption', 'nameLabel', 'columns', 'rows'],
  ssrRender: ssrRender(fallbackTemplate, 'SeoFallbackTable.vue'),
}

test('SSR includes one localized heading and lede before the real fallback table while controls stay client-only', async () => {
  for (const locale of ['en', 'es']) {
    const i18n = createI18n({ legacy: false, locale, messages })
    const app = vue.createSSRApp({
      ssrRender: renderPage,
      setup: () => {
        const { t } = useI18n({ useScope: 'local', messages })
        return {
          t,
          fallbackRows: [{ key: 'blade', href: 'https://warframe.market/items/nami_skyla_prime_blade', name: 'Nami Skyla Prime Blade', cells: ['25p', 65, '2.6', 62] }],
        }
      },
    })
    app.use(i18n)
    // Nuxt ClientOnly renders only its fallback slot before mounting. Using
    // that boundary here catches the original missing-heading regression.
    app.component('ClientOnly', { setup: (_, { slots }) => () => slots.fallback?.() ?? vue.h('span') })
    app.component('SeoFallbackTable', fallbackTable)
    for (const tag of ['VTextField', 'VSelect', 'VChipGroup', 'VChip', 'VBtn', 'VIcon', 'VPagination', 'VAlert']) {
      app.component(tag, { setup: () => () => { throw new Error(`${tag} must remain behind ClientOnly during SSR`) } })
    }
    const warnings = []
    app.config.warnHandler = (message) => warnings.push(message)
    const html = await serverRenderer.renderToString(app)
    assert.equal((html.match(/<h1\b/g) ?? []).length, 1, locale)
    const heading = html.match(/<h1\b[^>]*>(.*?)<\/h1>/s)[1].replace(/<[^>]+>/g, '')
    assert.equal(heading, i18n.global.t('ducatsPage.hero.title', {
      ducats: i18n.global.t('ducatsPage.hero.titleDucats'),
      platinum: i18n.global.t('ducatsPage.hero.titlePlatinum'),
    }), locale)
    const lede = html.match(/<p class="an-lede">(.*?)<\/p>/s)[1].replace(/&#39;/g, "'")
    assert.equal(lede, messages[locale].ducatsPage.hero.lede, locale)
    assert.ok(html.indexOf('<h1') < html.indexOf('<table'), 'heading precedes crawlable rows')
    assert.match(html, /<td>65<\/td>/)
    assert.match(html, /nami_skyla_prime_blade/)
    assert.equal(html.includes('an-filters'), false)
    assert.deepEqual(warnings, [], locale)
  }
})
