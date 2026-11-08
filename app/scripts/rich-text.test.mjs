import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'
import { runInNewContext } from 'node:vm'
import { compileTemplate, parse } from '@vue/compiler-sfc'
import { parse as parseHtml } from '@vue/compiler-dom'
import * as vue from 'vue'
import * as renderer from 'vue/server-renderer'
import { createMemoryHistory, createRouter, RouterLink } from 'vue-router'
import ts from 'typescript'
import { renderRich } from '../app/utils/richText.ts'
import railjack from '../app/data/guides/railjack.ts'

test('guide body links use the active locale and preserve fragments', () => {
  const seen = []
  const html = renderRich('[Relics](/guides/relics#refinement) · [Foundry](/foundry)', path => {
    seen.push(path)
    return `/es${path}`
  })
  assert.deepEqual(seen, ['/guides/relics#refinement', '/foundry'])
  assert.match(html, /href="\/es\/guides\/relics#refinement"/)
  assert.match(html, /href="\/es\/foundry"/)
})

test('home links can resolve to the locale root', () => {
  const html = renderRich('[Home](/)', path => path === '/' ? '/pt' : `/pt${path}`)
  assert.equal(html, '<a class="ga-inline" href="/pt">Home</a>')
})

test('locale resolvers receive query strings before HTML attribute escaping', () => {
  let resolvedPath
  const html = renderRich('[Results](/foundry?tab=weapons&view=all#results)', path => {
    resolvedPath = path
    return `/es${path}`
  })
  assert.equal(resolvedPath, '/foundry?tab=weapons&view=all#results')
  assert.equal(html, '<a class="ga-inline" href="/es/foundry?tab=weapons&amp;view=all#results">Results</a>')
})

test('quotes in internal and external destinations cannot create HTML attributes', () => {
  const internal = renderRich('[Results](/foundry?search=" autofocus onfocus="bad)', path => `/es${path}`)
  assert.equal(internal, '<a class="ga-inline" href="/es/foundry?search=&quot; autofocus onfocus=&quot;bad">Results</a>')
  const external = renderRich('[Source](https://example.com/?search=" autofocus onfocus="bad)')
  assert.equal(external, '<a class="ga-inline" href="https://example.com/?search=&quot; autofocus onfocus=&quot;bad" target="_blank" rel="noopener">Source</a>')
})

test('official source links bypass the internal locale resolver', () => {
  const html = renderRich('[Source](https://www.warframe.com/en/patch-notes/pc/38-0-0)', () => {
    throw new Error('External source passed to locale resolver')
  })
  assert.equal(html, '<a class="ga-inline" href="https://www.warframe.com/en/patch-notes/pc/38-0-0" target="_blank" rel="noopener">Source</a>')
})

test('callers without a locale resolver retain their original routes and formatting', () => {
  assert.equal(renderRich('**Open** [Relics](/guides/relics)'), '<strong>Open</strong> <a class="ga-inline" href="/guides/relics">Relics</a>')
})

test('protocol-relative URLs are not treated as local routes and HTML stays escaped', () => {
  const html = renderRich('[Other](//example.com) <script>bad()</script>', () => {
    throw new Error('Protocol-relative URL passed to locale resolver')
  })
  assert.equal(html, '[Other](//example.com) &lt;script&gt;bad()&lt;/script&gt;')
})

// Execute the real card helpers and compile both actual card grids. RouterLink
// renders the internal cards, so a mistaken dynamic component or href/to binding
// cannot pass by merely returning the right string from an isolated helper.
const component = parse(await readFile(new URL('../app/components/GuideArticle.vue', import.meta.url), 'utf8'))
assert.deepEqual(component.errors, [])
const script = ts.createSourceFile('GuideArticle.vue', component.descriptor.scriptSetup.content, ts.ScriptTarget.Latest, true)
const functions = new Map(script.statements.filter(ts.isFunctionDeclaration).map(node => [node.name.text, node.getText(script)]))
const helperNames = ['isInternalLink', 'cardLinkProps', 'onLinkClick']
const compile = source => ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
}).outputText
const helperCode = compile(helperNames.map(name => {
  assert.ok(functions.has(name), `actual guide helper: ${name}`)
  return functions.get(name)
}).join('\n') + `\nexports.helpers = { ${helperNames.join(',')} };`)
const elements = (node, tag) => [
  ...(node.type === 1 && node.tag === tag ? [node] : []),
  ...(node.children ?? []).flatMap(child => elements(child, tag)),
]
const attr = (node, name) => node.props.find(prop => prop.name === name)?.value?.content
const text = node => node.type === 2 ? node.content : (node.children ?? []).map(text).join('')
const grids = elements(parseHtml(component.descriptor.template.content), 'div').filter(node => attr(node, 'class') === 'ga-linkgrid')
assert.equal(grids.length, 2, 'actual inline and related card grids')
const compiled = compileTemplate({ source: `<div>${grids.map(grid => grid.loc.source).join('')}</div>`, filename: 'GuideArticle.vue', id: 'guide-cards', ssr: true, ssrCssVars: [] })
assert.deepEqual(compiled.errors, [])
const renderContext = { exports: {}, require: name => {
  assert.ok(['vue', 'vue/server-renderer'].includes(name))
  return name === 'vue' ? vue : renderer
} }
runInNewContext(compile(compiled.code), renderContext)

function setupCards(locale) {
  const resolved = []
  const events = []
  const context = { exports: {}, props: { guide: { slug: 'railjack' } },
    localePath: path => { resolved.push(path); return locale === 'en' ? path : `/${locale}${path}` },
    trackContent: (...args) => events.push(args),
  }
  runInNewContext(helperCode, context)
  return { ...context.exports.helpers, resolved, events }
}

async function renderCards(locale, inline, related) {
  const helpers = setupCards(locale)
  const router = createRouter({ history: createMemoryHistory(), routes: [{ path: '/:pathMatch(.*)*', component: { render: () => null } }] })
  await router.push(locale === 'en' ? '/guides/railjack' : `/${locale}/guides/railjack`)
  const app = vue.createSSRApp({ ssrRender: renderContext.exports.ssrRender, setup: () => ({
    ...helpers, NuxtLink: RouterLink, b: { links: inline }, guide: { related },
  }) })
  app.use(router)
  app.component('v-icon', { setup: (_, { slots }) => () => vue.h('span', slots.default?.()) })
  const warnings = []
  app.config.warnHandler = warning => warnings.push(warning)
  const html = await renderer.renderToString(app)
  assert.deepEqual(warnings, [])
  return { ...helpers, anchors: elements(parseHtml(html), 'a'), html }
}

const locales = ['en', 'es', 'pt', 'de', 'fr', 'ru', 'ko', 'ja', 'zh-hans', 'zh-hant', 'pl', 'it', 'uk']

test('both guide card grids localize internal to/href routes without changing external URLs or anchors', async () => {
  const fixtures = [
    { label: 'Internal href', href: '/tools' },
    { label: 'Internal to with query and fragment', to: '/guides/kuva?tab=liches&view=all#finale' },
    { label: 'Root href', href: '/' },
    { label: 'Explicit to wins', to: '/relics-value', href: 'https://example.test/ignored' },
    { label: 'Official source', href: 'https://www.warframe.com/en/patch-notes/pc/43-0-0#railjack' },
    { label: 'Protocol-relative source', href: '//example.test/resource?q=1&lang=es' },
    { label: 'Section anchor', href: '#intrinsics' },
  ]
  for (const locale of locales) {
    const rendered = await renderCards(locale, fixtures, fixtures)
    assert.equal(rendered.anchors.length, fixtures.length * 2)
    for (let i = 0; i < rendered.anchors.length; i++) {
      const link = fixtures[i % fixtures.length]
      const anchor = rendered.anchors[i]
      const destination = link.to || link.href
      const internal = i % fixtures.length < 4
      assert.ok(text(anchor).includes(link.label))
      assert.equal(attr(anchor, 'href'), internal && locale !== 'en' ? `/${locale}${destination}` : destination)
      assert.equal(attr(anchor, 'target'), internal || destination.startsWith('#') ? undefined : '_blank')
      assert.equal(attr(anchor, 'rel'), internal || destination.startsWith('#') ? undefined : 'noopener')
    }
    assert.deepEqual(rendered.resolved, [...fixtures.slice(0, 4), ...fixtures.slice(0, 4)].map(link => link.to || link.href))
    assert.ok(!rendered.html.includes('<nuxtlink'))
  }
})

test('all 52 affected Railjack cards and existing related cards retain their guide locale', async () => {
  let repairedCards = 0
  for (const locale of locales) {
    const guide = locale === 'en' ? railjack : JSON.parse(await readFile(new URL(`../app/data/guides/locales/railjack.${locale}.json`, import.meta.url), 'utf8'))
    const inline = guide.sections.flatMap(section => section.blocks.filter(block => block.type === 'links').flatMap(block => block.links))
    const related = guide.related ?? []
    const rendered = await renderCards(locale, inline, related)
    const links = [...inline, ...related]
    assert.equal(rendered.anchors.length, links.length)
    for (let i = 0; i < links.length; i++) {
      const destination = links[i].to || links[i].href
      assert.ok(destination.startsWith('/') && !destination.startsWith('//'))
      assert.equal(attr(rendered.anchors[i], 'href'), locale === 'en' ? destination : `/${locale}${destination}`)
      assert.equal(attr(rendered.anchors[i], 'target'), undefined)
      if (!links[i].to && links[i].href) repairedCards++
    }
  }
  assert.equal(repairedCards, 52)
})

test('guide click analytics classify internal href cards using the same destination rule', () => {
  const cards = setupCards('es')
  cards.onLinkClick({ label: 'Relic values', href: '/relics-value' }, 'inline')
  cards.onLinkClick({ label: 'Kuva', to: '/guides/kuva' }, 'related')
  cards.onLinkClick({ label: 'Source', href: 'https://www.warframe.com/' }, 'inline')
  assert.deepEqual(cards.events.map(args => args[2].internal), [true, true, false])
  assert.deepEqual(cards.events.map(args => args[2].placement), ['inline', 'related', 'inline'])
  assert.ok(cards.events.every(args => args[2].guide_slug === 'railjack'))
})
