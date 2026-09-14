import assert from 'node:assert/strict'
import { test } from 'node:test'
import { buildGuideCards, filterGuideCards } from '../app/utils/guide-search.ts'

const guides = [
  { slug: 'mastery-rank', route: '/guides/mastery-rank', title: 'Mastery Rank', blurb: 'Level weapons and frames.', category: 'start', icon: 'rank', readMins: 8 },
  { slug: 'forma', route: '/guides/forma', title: 'Forma Farming', blurb: 'Relic refinement and blueprints.', category: 'farming', icon: 'forma', readMins: 10 },
]
const translated = {
  es: {
    '/guides/mastery-rank': { title: 'Rango de maestría', description: 'Sube de nivel tus armas.' },
    '/guides/forma': { title: 'Conseguir Forma', description: 'Encuentra planos y elige reliquias.' },
  },
  ja: { '/guides/forma': { title: 'フォーマの入手方法', description: '設計図を集める。' } },
}
const resolve = (route, locale) => translated[locale]?.[route] ?? {}

test('localized cards display translated titles and search their visible descriptions', () => {
  const cards = buildGuideCards(guides, 'es', resolve)
  assert.equal(cards[1].title, 'Conseguir Forma')
  assert.equal(filterGuideCards(cards, 'planos')[0].route, '/guides/forma')
  assert.equal(filterGuideCards(cards, 'nivel')[0].slug, 'mastery-rank')
})

test('search handles accents, decomposed text, capitalization and English game terms', () => {
  const cards = buildGuideCards(guides, 'es', resolve)
  for (const term of [' maestria ', 'MAESTRÍA', 'maestri\u0301a', 'mastery-rank']) {
    assert.deepEqual(filterGuideCards(cards, term).map((g) => g.slug), ['mastery-rank'])
  }
  assert.equal(filterGuideCards(cards, 'blueprints')[0].slug, 'forma')
})

test('changing locale does not mutate the registry and keeps links and categories', () => {
  const before = structuredClone(guides)
  buildGuideCards(guides, 'es', resolve)
  const english = buildGuideCards(guides, 'en', () => { throw new Error('English needs no translated copy') })
  assert.equal(english[0].title, 'Mastery Rank')
  assert.equal(english[1].category, 'farming')
  assert.equal(english[1].route, '/guides/forma')
  assert.deepEqual(guides, before)
})

test('non-Latin search, empty queries and missing translated fields remain usable', () => {
  const cards = buildGuideCards(guides, 'ja', resolve)
  assert.deepEqual(filterGuideCards(cards, '設計図').map((g) => g.slug), ['forma'])
  assert.equal(cards[0].title, 'Mastery Rank')
  assert.equal(filterGuideCards(cards, '   ').length, 2)
  assert.equal(filterGuideCards(cards, 'no matching guide').length, 0)
})
