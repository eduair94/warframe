import assert from 'node:assert/strict'
import { test } from 'node:test'
import { renderRich } from '../app/utils/richText.ts'

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
