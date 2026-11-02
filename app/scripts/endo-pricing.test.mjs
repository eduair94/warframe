import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'
import { runInNewContext } from 'node:vm'
import { parse } from '@vue/compiler-sfc'
import { computed, ref } from 'vue'
import ts from 'typescript'

function compile(source) {
  return ts.transpileModule(source, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
  }).outputText
}

// Execute the production calculators, replacing only Nuxt's unavailable app
// context. This keeps the price selection, fallback and rank maths under test.
async function loadModule(path, dependencies) {
  const source = await readFile(new URL(path, import.meta.url), 'utf8')
  const context = {
    exports: {},
    require: (name) => {
      assert.ok(Object.hasOwn(dependencies, name), `unexpected dependency: ${name}`)
      return dependencies[name]
    },
  }
  runInNewContext(compile(source), context)
  return context.exports
}

const marketFormat = await loadModule('../app/composables/marketFormat.ts', {
  '#imports': { useNuxtApp: () => { throw new Error('No Nuxt app in a unit test') } },
})
const valuation = await loadModule('../app/composables/useEndoValue.ts', { './marketFormat': marketFormat })

// Exercise the page's real refs, query schema, query reader/writer and computed
// rows. Reading default values from the page catches a UI/calculator mismatch.
const source = parse(await readFile(new URL('../app/pages/endo.vue', import.meta.url), 'utf8')).descriptor.scriptSetup.content
const file = ts.createSourceFile('endo.vue', source, ts.ScriptTarget.Latest, true)
const declarations = new Map()
for (const statement of file.statements) {
  if (ts.isVariableStatement(statement)) {
    for (const declaration of statement.declarationList.declarations) {
      declarations.set(declaration.name.getText(file), `const ${declaration.getText(file)};`)
    }
  } else if (ts.isFunctionDeclaration(statement) && statement.name) {
    declarations.set(statement.name.text, statement.getText(file))
  }
}
const queryStatement = file.statements.find((statement) => ts.isVariableStatement(statement)
  && statement.declarationList.declarations.some((declaration) => declaration.name.getText(file) === 'QUERY_PARAMS'))
const queryRows = queryStatement.declarationList.declarations[0].initializer.elements
const queryRefs = queryRows.map((row) => row.elements[1].getText(file))
const names = [...queryRefs, 'QUERY_PARAMS', 'sameCsv', 'hydrateFromQuery', 'buildQuery', 'flipRows']
const pageCode = compile(names.map((name) => {
  assert.ok(declarations.has(name), `actual page binding exists: ${name}`)
  return declarations.get(name)
}).join('\n') + '\nhydrateFromQuery();\nexports.page = { sellBasis, buyViaBid, flipRows, buildQuery };')

function setupPage(mods, query = {}) {
  const context = {
    exports: {}, ref, computed, route: { query }, flipData: ref({ mods }),
    ...valuation,
  }
  runInNewContext(pageCode, context)
  return context.exports.page
}

function ammoDrum() {
  return {
    item_name: 'Ammo Drum', url_name: 'ammo_drum', thumb: '', tags: ['mod'],
    flip: {
      rarity: 'Common', maxRank: 5,
      ranks: [
        { rank: 0, ask: 2, bid: 2, sellCount: 10, buyCount: 10 },
        { rank: 5, ask: 6, bid: 4, sellCount: 10, buyCount: 10 },
      ],
      unranked: { avg_price: 2, volume: 100 },
      maxed: { avg_price: 99999, volume: 50 },
    },
  }
}

test('Endo page defaults to the current ask even when a liquid mod has an extreme traded average', () => {
  const row = ammoDrum()
  const before = structuredClone(row)
  const page = setupPage([row])
  assert.equal(page.sellBasis.value, 'ask')
  assert.equal(page.buyViaBid.value, true)
  const actual = page.flipRows.value[0].eval
  assert.equal(actual.maxedSell, 6)
  assert.equal(actual.maxedAvg, 99999, 'raw data remains available for the optional scenario')
  assert.equal(actual.maxedVolume, 50)
  assert.equal(actual.best.profit, 4)
  assert.equal(actual.best.instantProfit, 4)
  assert.equal(actual.maxedSell, valuation.evalFlip(row).maxedSell)
  assert.equal(Object.hasOwn(page.buildQuery(), 'sell'), false)
  assert.deepEqual(row, before, 'valuation must not rewrite upstream prices')
})

test('explicit average and instant links preserve their pricing through query serialization and reload', () => {
  for (const [basis, expectedSell, expectedProfit] of [['avg', 99999, 99997], ['instant', 4, 2]]) {
    const page = setupPage([ammoDrum()], { sell: basis })
    assert.equal(page.sellBasis.value, basis)
    assert.equal(page.flipRows.value[0].eval.maxedSell, expectedSell)
    assert.equal(page.flipRows.value[0].eval.best.profit, expectedProfit)
    assert.equal(page.buildQuery().sell, basis)
    const reloaded = setupPage([ammoDrum()], page.buildQuery())
    assert.equal(reloaded.flipRows.value[0].eval.maxedSell, expectedSell)
    page.sellBasis.value = 'ask'
    assert.equal(page.flipRows.value[0].eval.maxedSell, 6, 'changing the toggle recalculates the page')
    assert.equal(Object.hasOwn(page.buildQuery(), 'sell'), false, 'default ask removes the override')
    assert.equal(setupPage([ammoDrum()], page.buildQuery()).sellBasis.value, 'ask')
  }
})

test('missing maxed quotes do not silently substitute another pricing source', () => {
  const row = ammoDrum()
  row.flip.maxed.avg_price = 9
  row.flip.ranks[1].ask = 0
  assert.equal(setupPage([row]).flipRows.value.length, 0, 'ask mode cannot use the historical average')
  assert.equal(setupPage([row], { sell: 'avg' }).flipRows.value[0].eval.maxedSell, 9)
  assert.equal(setupPage([row], { sell: 'instant' }).flipRows.value[0].eval.maxedSell, 4)
  row.flip.ranks[1].bid = 0
  row.flip.ranks[1].ask = 6
  assert.equal(setupPage([row], { sell: 'instant' }).flipRows.value.length, 0, 'instant mode cannot use an ask or average')
  row.flip.maxed.avg_price = 0
  assert.equal(setupPage([row], { sell: 'avg' }).flipRows.value.length, 0, 'average mode cannot use an ask')
  assert.equal(setupPage([row]).flipRows.value[0].eval.maxedSell, 6)
})

test('only a positive finite selected quote can produce a profitable flip', () => {
  for (const basis of ['ask', 'instant', 'avg']) {
    for (const invalid of [undefined, null, '', 'invalid', true, false, [], [10], {}, 0, -5, NaN, Infinity, -Infinity]) {
      const row = ammoDrum()
      if (basis === 'ask') row.flip.ranks[1].ask = invalid
      else if (basis === 'instant') row.flip.ranks[1].bid = invalid
      else row.flip.maxed.avg_price = invalid
      const result = valuation.evalFlip(row, { sellBasis: basis })
      assert.equal(result.maxedSell, 0, `${basis}: ${String(invalid)}`)
      assert.equal(result.best, null, `${basis}: ${String(invalid)}`)
      assert.equal(setupPage([row], { sell: basis }).flipRows.value.length, 0)
    }
  }
})

test('a buy order without a matching sell offer is never a modeled buy-in', () => {
  const row = ammoDrum()
  row.flip.ranks[0].ask = 0
  for (const query of [{}, { sell: 'avg' }, { sell: 'instant' }]) {
    assert.equal(setupPage([row], query).flipRows.value.length, 0)
  }
  assert.equal(valuation.evalFlip(row, { buyViaBid: true }).best, null)
})
