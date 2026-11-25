import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFileSync, readdirSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import { computed } from 'vue'
import { parse } from '@vue/compiler-sfc'
import { isGuideTranslationCurrent } from '../app/utils/guide-translation.ts'
import { extractGuideJson, translationNeedsRefresh } from '../../scripts/lib/guide-quality.mjs'
import { compile, declarations } from './helpers/locale-routing.mjs'

const source = readFileSync(new URL('../app/composables/useLocalizedGuide.ts', import.meta.url), 'utf8')
const directory = new URL('../app/data/guides/', import.meta.url)
const guide = { slug: 'example', updated: '2026-11-01', sections: [{ id: 'first', title: 'First', blocks: [{ type: 'p', text: 'Read [Focus](/guides/focus).' }] }] }
async function load(locale, loader, en = guide) {
  const context = { exports: {}, isGuideTranslationCurrent, useI18n: () => ({ locale: { value: locale } }),
    overrides: loader ? { [`../data/guides/locales/${en.slug}.${locale}.json`]: loader } : {} }
  runInNewContext(compile(declarations(source, ['useLocalizedGuide'])), context)
  return JSON.parse(JSON.stringify(await context.exports.useLocalizedGuide(en.slug, en)))
}

test('actual loader keeps valid translated prose with source destinations', async () => {
  const translated = structuredClone(guide)
  translated.sections[0].title = 'Primero'
  translated.sections[0].blocks[0].text = 'Lee [Enfoque](/guides/focus).'
  assert.deepEqual(await load('es', async () => ({ default: translated })), { ...translated, contentLanguage: 'es' })
  assert.deepEqual(await load('es', async () => translated), { ...translated, contentLanguage: 'es' })
})
test('actual loader falls back for stale dates, moved links, incomplete sections and invalid snapshots', async () => {
  const mutations = [
    value => { value.updated = '2026-10-01' },
    value => { value.sections[0].title = value.sections[0].blocks[0].text; value.sections[0].blocks[0].text = 'First' },
    value => { value.sections = [] },
  ]
  for (const mutate of mutations) {
    const translated = structuredClone(guide); mutate(translated)
    assert.deepEqual(await load('es', async () => ({ default: translated })), { ...guide, contentLanguage: 'en' })
  }
  for (const value of [null, {}, 'invalid']) assert.deepEqual(await load('es', async () => value), { ...guide, contentLanguage: 'en' })
})
test('English, missing overrides and failed chunks retain the canonical guide', async () => {
  assert.deepEqual(await load('en', async () => { throw Error('must not load') }), { ...guide, contentLanguage: 'en' })
  assert.deepEqual(await load('es'), { ...guide, contentLanguage: 'en' })
  assert.deepEqual(await load('es', async () => { throw Error('chunk unavailable') }), { ...guide, contentLanguage: 'en' })
})
test('all 300 stored snapshots agree with editorial gate; four known mismatches fall back', async () => {
  const rejected = []
  const names = readdirSync(new URL('locales/', directory)).filter(name => name.endsWith('.json'))
  assert.equal(names.length, 300)
  for (const name of names) {
    const [slug, locale] = name.split('.')
    const en = extractGuideJson(readFileSync(new URL(slug + '.ts', directory), 'utf8'))
    const translated = JSON.parse(readFileSync(new URL('locales/' + name, directory), 'utf8'))
    const accepted = isGuideTranslationCurrent(en, translated)
    assert.equal(accepted, !translationNeedsRefresh(en, translated), name)
    assert.deepEqual(await load(locale, async () => ({ default: translated }), en), { ...(accepted ? translated : en), contentLanguage: accepted ? locale : 'en' }, name)
    if (!accepted) rejected.push(name)
  }
  assert.deepEqual(rejected, ['archon-shards.ru.json', 'focus.zh-hans.json', 'resources.zh-hans.json', 'standing.pl.json'])
})

test('actual Article schema records content language and original review date on a localized route', () => {
  const sfc = parse(readFileSync(new URL('../app/components/GuideArticle.vue', import.meta.url), 'utf8')).descriptor
  for (const contentLanguage of ['en', 'pl', undefined]) {
    const context = { exports: {}, computed, props: { guide: { title: 'Guide', lede: 'Description', category: 'farming', updated: '2026-07-18', contentLanguage } },
      origin: 'https://example.test', route: { path: '/pl/guides/standing' }, locale: { value: 'pl' } }
    runInNewContext(compile(declarations(sfc.scriptSetup.content, ['jsonLd']) + '\nexports.graph = jsonLd.value;'), context)
    const article = context.exports.graph['@graph'].find(item => item['@type'] === 'Article')
    assert.equal(article.inLanguage, contentLanguage || 'pl')
    assert.equal(article.dateModified, '2026-07-18')
    assert.equal(article.mainEntityOfPage['@id'], 'https://example.test/pl/guides/standing')
  }
})
