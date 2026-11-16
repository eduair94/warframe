import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'
import { runInNewContext } from 'node:vm'
import { compileScript, compileTemplate, parse } from '@vue/compiler-sfc'
import { parse as parseHtml } from '@vue/compiler-dom'
import * as vue from 'vue'
import * as renderer from 'vue/server-renderer'
import ts from 'typescript'

// Compile the actual SFC script and template, so both binding and destination
// classification must work before hydration (including when JS is unavailable).
const filename = 'SeoFallbackTable.vue'
const parsed = parse(await readFile(new URL('../app/components/SeoFallbackTable.vue', import.meta.url), 'utf8'), { filename })
assert.deepEqual(parsed.errors, [])
const script = compileScript(parsed.descriptor, { id: 'seo-fallback-links' })
const template = compileTemplate({ source: parsed.descriptor.template.content, filename, id: 'seo-fallback-links', ssr: true, ssrCssVars: [], compilerOptions: { bindingMetadata: script.bindings } })
assert.deepEqual(template.errors, [])
const execute = source => {
  const context = { exports: {}, require: name => {
    assert.ok(['vue', 'vue/server-renderer'].includes(name))
    return name === 'vue' ? vue : renderer
  } }
  runInNewContext(ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } }).outputText, context)
  return context.exports
}
const component = execute(script.content).default
component.ssrRender = execute(template.code).ssrRender
const elements = (node, tag) => [...(node.type === 1 && node.tag === tag ? [node] : []), ...(node.children ?? []).flatMap(child => elements(child, tag))]
const attr = (node, name) => node.props.find(prop => prop.name === name)?.value?.content

async function renderLinks(destinations) {
  const app = vue.createSSRApp(component, {
    caption: 'Relic rewards', nameLabel: 'Relic', columns: ['Value'],
    rows: destinations.map((href, index) => ({ key: String(index), href, name: `Relic ${index}`, cells: [index] })),
  })
  const warnings = []
  app.config.warnHandler = warning => warnings.push(warning)
  const html = await renderer.renderToString(app)
  assert.deepEqual(warnings, [])
  return { anchors: elements(parseHtml(html), 'a'), html }
}

test('SSR internal links preserve the supplied locale/query/fragment and stay in the same tab', async () => {
  const hrefs = ['/relic/lith_a1_relic', '/es/relic/lith_a1_relic?refinement=Radiant&mode=all#rewards', '/zh-hant/relic/axi_a1_relic', '#rewards', 'relic/lith_a1_relic']
  const { anchors } = await renderLinks(hrefs)
  assert.equal(anchors.length, hrefs.length)
  anchors.forEach((anchor, index) => {
    assert.equal(attr(anchor, 'href'), hrefs[index])
    assert.equal(attr(anchor, 'target'), undefined)
    assert.equal(attr(anchor, 'rel'), undefined)
  })
})

test('SSR external market links retain a separate tab and noopener', async () => {
  const hrefs = ['https://warframe.market/items/bronco_prime_barrel', 'http://example.test/item', '//example.test/item']
  const { anchors } = await renderLinks(hrefs)
  anchors.forEach((anchor, index) => {
    assert.equal(attr(anchor, 'href'), hrefs[index])
    assert.equal(attr(anchor, 'target'), '_blank')
    assert.equal(attr(anchor, 'rel'), 'noopener')
  })
})

test('SSR link destinations cannot inject attributes', async () => {
  const href = '/es/relic/lith_a1_relic?search=" onclick="bad'
  const { anchors, html } = await renderLinks([href])
  assert.equal(attr(anchors[0], 'href'), href)
  assert.equal(attr(anchors[0], 'onclick'), undefined)
  assert.match(html, /&quot;/)
})
