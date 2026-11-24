import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import { parse } from '@vue/compiler-sfc'
import { computed, ref } from 'vue'
import { compile, declarations } from './helpers/locale-routing.mjs'

const source = parse(readFileSync(new URL('../app/pages/tools/index.vue', import.meta.url), 'utf8')).descriptor.scriptSetup.content
function directory() {
  const language = ref('es')
  const TOOLS = [
    { slug: 'planner', name: 'Build Planner', category: 'builds', platforms: ['web'] },
    { slug: 'market', name: 'Market', category: 'trading', platforms: ['desktop'] },
  ]
  const context = { exports: {}, computed, ref, TOOLS,
    TOOL_SECTIONS: [{ key: 'builds' }, { key: 'trading' }],
    toolsByCategory: category => TOOLS.filter(tool => tool.category === category),
    RESEARCH: { planner: { oneLiner: 'Compare weapon builds' } },
    cardDesc: tool => tool.slug === 'planner' ? (language.value === 'es' ? 'Estadísticas de armas' : '武器の比較') : 'Trade items',
    t: key => key.endsWith('.web') ? 'Navegador' : key.endsWith('.builds') ? 'Configuraciones' : key,
  }
  runInNewContext(compile(declarations(source, ['search', 'normalizeSearch', 'searchIndex', 'searchTerms', 'sections', 'resultCount']) + '\nexports.state = { search, sections, resultCount };'), context)
  return { ...context.exports.state, language }
}
test('directory search matches localized descriptions, category, platform and English game vocabulary', () => {
  const state = directory()
  for (const query of [' ESTADISTICAS ', 'estadi\u0301sticas', 'configuraciones navegador', 'weapon BUILDS', 'planner']) {
    state.search.value = query
    assert.equal(state.resultCount.value, 1, query)
    assert.equal(state.sections.value[0].tools[0].slug, 'planner', query)
  }
})
test('all query terms must match and clearing restores the full ordered catalogue', () => {
  const state = directory()
  state.search.value = 'weapon desktop'
  assert.equal(state.resultCount.value, 0)
  assert.equal(state.sections.value.length, 0)
  state.search.value = 'market'
  assert.equal(state.sections.value[0].key, 'trading')
  state.search.value = '  '
  assert.equal(state.resultCount.value, 2)
  assert.equal(Array.from(state.sections.value, section => section.key).join(','), 'builds,trading')
})
test('search index reacts to locale changes and supports non-Latin queries', () => {
  const state = directory()
  state.search.value = '武器'
  assert.equal(state.resultCount.value, 0)
  state.language.value = 'ja'
  assert.equal(state.resultCount.value, 1)
  state.search.value = 'estadisticas'
  assert.equal(state.resultCount.value, 0)
})
