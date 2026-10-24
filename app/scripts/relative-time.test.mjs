import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'
import { runInNewContext } from 'node:vm'
import { parse } from '@vue/compiler-sfc'
import { computed, createSSRApp, h, ref } from 'vue'
import { renderToString } from 'vue/server-renderer'
import ts from 'typescript'
import { formatRelativeTime, parseRecordedTimestamp } from '../app/utils/relative-time.ts'

const now = Date.parse('2026-10-24T21:00:00.000Z')

test('relative update labels use all 13 site languages without leaking a previous locale', () => {
  const expected = {
    en: '2 minutes ago', es: 'hace 2 minutos', pt: 'há 2 minutos', de: 'vor 2 Minuten',
    fr: 'il y a 2 minutes', ru: '2 минуты назад', ko: '2분 전', ja: '2 分前',
    'zh-hans': '2分钟前', 'zh-hant': '2 分鐘前', pl: '2 minuty temu',
    it: '2 minuti fa', uk: '2 хвилини тому',
  }
  for (const locale of [...Object.keys(expected), ...Object.keys(expected).reverse()]) {
    assert.equal(formatRelativeTime(now - 120_000, now, locale), expected[locale], locale)
  }
  assert.equal(formatRelativeTime(now - 120_000, now, 'invalid_locale'), expected.en)
  assert.equal(formatRelativeTime(now - 120_000, now, '__proto__'), expected.en)
})

test('relative labels select elapsed seconds, minutes, hours, days, months and years', () => {
  for (const [age, expected] of [
    [0, 'now'], [999, 'now'], [1_000, '1 second ago'], [59_999, '59 seconds ago'],
    [60_000, '1 minute ago'], [119_999, '1 minute ago'], [120_000, '2 minutes ago'],
    [3_599_999, '59 minutes ago'], [3_600_000, '1 hour ago'],
    [86_399_999, '23 hours ago'], [86_400_000, 'yesterday'],
    [2 * 86_400_000, '2 days ago'], [30 * 86_400_000, 'last month'],
    [365 * 86_400_000, 'last year'],
  ]) assert.equal(formatRelativeTime(now - age, now, 'en'), expected, String(age))
  for (const timestamp of [NaN, Infinity, -Infinity, now + 1]) {
    assert.equal(formatRelativeTime(timestamp, now, 'es'), '')
  }
  assert.equal(formatRelativeTime(now, NaN, 'es'), '')
})

test('recorded times require a real calendar date and timezone and cannot be in the future', () => {
  for (const value of [
    '2026-10-24T20:58:00Z', '2026-10-24T20:58:00.000Z',
    '2026-10-24T17:58:00-03:00', '2026-10-24T22:58:00+02:00',
  ]) assert.equal(parseRecordedTimestamp(value, now), now - 120_000, value)
  assert.equal(parseRecordedTimestamp('2024-02-29T00:00:00Z', now), Date.parse('2024-02-29T00:00:00Z'))
  assert.equal(parseRecordedTimestamp('2026-10-24T21:00:00.000Z', now), now)
  for (const value of [
    undefined, null, '', 0, NaN, {}, 'invalid', '2026-10-24', '2026-10-24T20:58:00',
    '2026-02-30T00:00:00Z', '2026-02-29T00:00:00Z', '2026-02-30T00:00:00-03:00',
    '2026-10-23T24:00:00Z', '2026-10-24T20:58:00+25:00', '2026-10-24T21:00:00.001Z',
  ]) assert.equal(parseRecordedTimestamp(value, now), null, String(value))
  assert.equal(parseRecordedTimestamp('2026-10-24T20:58:00Z', NaN), null)
})

async function setupCode(path, names, hooks = []) {
  const content = await readFile(new URL(path, import.meta.url), 'utf8')
  const source = parse(content).descriptor.scriptSetup.content
  const file = ts.createSourceFile(path, source, ts.ScriptTarget.Latest, true)
  const statements = []
  for (const statement of file.statements) {
    if (ts.isVariableStatement(statement)) {
      for (const declaration of statement.declarationList.declarations) {
        if (names.includes(declaration.name.getText(file))) {
          statements.push(`${statement.declarationList.flags & ts.NodeFlags.Const ? 'const' : 'let'} ${declaration.getText(file)};`)
        }
      }
    } else if (ts.isExpressionStatement(statement) && ts.isCallExpression(statement.expression)
      && hooks.includes(statement.expression.expression.getText(file))) statements.push(statement.getText(file))
  }
  assert.equal(statements.length, names.length + hooks.length, 'all actual page/component bindings are exercised')
  return ts.transpileModule(`${statements.join('\n')}\nexports.bindings = { ${names.join(', ')} };`, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
  }).outputText
}

const endoCode = await setupCode('../app/pages/endo.vue', ['marketClock', 'updatedLabel'])
const noticeCode = await setupCode('../app/components/MarketFreshnessNotice.vue', ['clock', 'timer'], ['onMounted', 'onBeforeUnmount'])

function endoSetup(state, locale, flipData, actualNow = now) {
  const context = {
    exports: {}, computed, locale, flipData, formatRelativeTime, parseRecordedTimestamp,
    Date: class extends Date { static now() { return actualNow } },
    useState: (key, init) => {
      if (!state.has(key)) state.set(key, ref(init()))
      return state.get(key)
    },
  }
  runInNewContext(endoCode, context)
  return { ...context.exports.bindings, context }
}

function mod(updatedAt) { return { flip: { updatedAt } } }

test('actual Endo label chooses the newest valid past row and reacts to locale, clock and feed changes', () => {
  const locale = ref('es')
  const flipData = ref({ mods: [
    mod('2026-10-24T20:55:00Z'), mod('2026-10-24T20:58:00Z'),
    mod('invalid'), mod('2026-10-24T21:00:01Z'), mod('2026-10-24T20:59:00'),
  ] })
  const page = endoSetup(new Map(), locale, flipData)
  assert.equal(page.updatedLabel.value, 'hace 2 minutos')
  locale.value = 'ja'
  assert.equal(page.updatedLabel.value, '2 分前')
  flipData.value.mods = flipData.value.mods.filter((row) => row.flip.updatedAt !== '2026-10-24T21:00:01Z')
  page.marketClock.value += 60_000
  assert.equal(page.updatedLabel.value, '3 分前')
  flipData.value = { mods: [mod('invalid'), mod('2026-10-25T00:00:00Z')] }
  assert.equal(page.updatedLabel.value, '')
  flipData.value = { mods: [] }
  assert.equal(page.updatedLabel.value, '')
})

test('SSR and hydration share the existing market clock; only the notice runs a timer', async () => {
  const state = new Map()
  const locale = ref('es')
  const data = ref({ mods: [mod('2026-10-24T20:58:00Z')] })
  const server = endoSetup(state, locale, data)
  const payload = JSON.stringify(Object.fromEntries([...state].map(([key, value]) => [key, value.value])))
  const browserState = new Map(Object.entries(JSON.parse(payload)).map(([key, value]) => [key, ref(value)]))
  const browser = endoSetup(browserState, locale, data, now + 60_000)
  const render = (page) => renderToString(createSSRApp({ render: () => h('span', page.updatedLabel.value) }))
  assert.equal(await render(server), '<span>hace 2 minutos</span>')
  assert.equal(await render(browser), await render(server), 'elapsed browser time must not alter hydration text')

  let currentTime = now + 60_000
  const mounted = [], unmounted = [], timers = new Map()
  const notice = {
    ...browser.context, exports: {},
    Date: class extends Date { static now() { return currentTime } },
    onMounted: (callback) => mounted.push(callback),
    onBeforeUnmount: (callback) => unmounted.push(callback),
    setInterval: (callback, delay) => { assert.equal(delay, 60_000); timers.set(1, callback); return 1 },
    clearInterval: (id) => timers.delete(id),
  }
  runInNewContext(noticeCode, notice)
  assert.equal(timers.size, 0)
  assert.equal(notice.exports.bindings.clock, browser.marketClock, 'notice and page read the same Nuxt state')
  mounted.forEach((callback) => callback())
  assert.equal(timers.size, 1)
  assert.equal(await render(browser), '<span>hace 3 minutos</span>')
  currentTime += 60_000
  timers.forEach((callback) => callback())
  assert.equal(await render(browser), '<span>hace 4 minutos</span>')
  assert.equal(await render(server), '<span>hace 2 minutos</span>', 'separate requests do not share clocks')
  unmounted.forEach((callback) => callback())
  assert.equal(timers.size, 0)
})
