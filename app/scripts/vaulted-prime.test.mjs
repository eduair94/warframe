import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import { computed, ref } from 'vue'
import { parse } from '@vue/compiler-sfc'
import { isVaultedPrime } from '../app/utils/vaulted-prime.ts'
import { compile, declarations } from './helpers/locale-routing.mjs'

test('Prime eligibility requires explicit vault status, excluding relics and Primed mods', () => {
  for (const name of ['Frost Prime Set', 'Bo Prime Handle', 'Wyrm Prime Blueprint']) {
    assert.equal(isVaultedPrime({ item_name: name, vaulted: true }), true)
    for (const vaulted of [false, undefined, null, 'true']) assert.equal(isVaultedPrime({ item_name: name, vaulted }), false)
  }
  for (const item of [null, undefined, {}, { item_name: 'Lith H6 Relic', vaulted: true }, { item_name: 'Primed Flow', vaulted: true }]) assert.equal(isVaultedPrime(item), false)
})

for (const page of ['vaulted', 'vaulted-worth']) test(`${page}: actual page pipelines exclude relics from hero, counts, categories and SSR`, () => {
  const source = parse(readFileSync(new URL(`../app/pages/${page}.vue`, import.meta.url), 'utf8')).descriptor.scriptSetup.content
  const row = (name, vaulted, tags, price = 100) => ({ item_name: name, url_name: name.toLowerCase().replaceAll(' ', '_'), vaulted, tags, market: { sell: price, buy: 90, volume: 20 }, sell: price, avg_price: price, change30d: 10, change7d: 5, volume: 20 })
  const prime = row('Frost Prime Set', true, ['warframe'])
  const rows = ref([row('Lith H6 Relic', true, ['relic'], 999), row('Primed Flow', true, ['arcane'], 999), row('Bo Prime Set', false, ['melee']), prime])
  const names = page === 'vaulted' ? ['vaultedItems', 'categoryOf', 'categoryOptions', 'filtered', 'fallbackRows', 'topDeal', 'stats'] : ['num', 'priceOf', 'categoryOf', 'decorated', 'categoryOptions', 'filtered', 'fallbackRows', 'topBuy', 'stats', 'VERDICT_RANK']
  const context = { exports: {}, computed, isVaultedPrime, allItems: rows, items: rows, search: ref(''), minPrice: ref(0), category: ref('All'), sortKey: ref('price'), setsOnly: ref(false), verdictFilter: ref('all'), localItemName: r => r.item_name, localePath: p => p, mkt: p => p, fmtPlat: String, fmtSignedPct: String, t: k => k, verdictOf: () => 'buy' }
  runInNewContext(compile(declarations(source, names) + `\nexports.result = { categoryOptions, filtered, fallbackRows, stats, hero: ${page === 'vaulted' ? 'topDeal' : 'topBuy'} };`), context)
  const result = context.exports.result
  assert.equal(result.hero.value.item_name, prime.item_name)
  assert.deepEqual(Array.from(result.categoryOptions.value), ['All', 'Warframe'])
  assert.deepEqual(Array.from(result.fallbackRows.value, r => r.name), [prime.item_name])
  assert.equal(result.stats.value.total ?? result.stats.value.vaulted, 1)
  rows.value = rows.value.filter(r => r.item_name !== prime.item_name)
  assert.equal(result.hero.value, null)
  assert.equal(result.filtered.value.length, 0)
  assert.equal(result.fallbackRows.value.length, 0)
  assert.equal(result.stats.value.total ?? result.stats.value.vaulted, 0)
  assert.deepEqual(Array.from(result.categoryOptions.value), ['All'])
})
