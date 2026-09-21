import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { extractGuideJson, validateGuide, oembedOk, verifyVideos, preserveUnchangedReviewDate, hasSearchGrounding, translationNeedsRefresh } from './guide-quality.mjs'

const video = { id: 'abcdefghijk', title: 'Guide', channel: 'Creator' }
const guide = () => ({
  slug: 'sample', eyebrow: 'Knowledge Center', title: 'Sample', lede: 'Learn the basics', category: 'start',
  updated: '2026-07-18', sections: [{ id: 'intro', title: 'Intro', blocks: [{ type: 'p', text: 'Useful content.' }] }],
  sources: [{ label: 'Official wiki', href: 'https://wiki.warframe.com/' }],
})

test('reads the existing guides that caused strict JSON refreshes to fail', () => {
  for (const slug of ['builds', 'forma', 'new-player']) {
    const source = readFileSync(new URL(`../../app/app/data/guides/${slug}.ts`, import.meta.url), 'utf8')
    assert.equal(extractGuideJson(source).slug, slug)
  }
})

test('parses data syntax without executing expressions', () => {
  assert.deepEqual(extractGuideJson("const guide = {text: 'word', flags: [true, false, null], /* note */ count: 2,}"), { text: 'word', flags: [true, false, null], count: 2 })
  assert.throws(() => extractGuideJson('const guide = { text: process.exit(1) }'), /data literals/)
  assert.throws(() => extractGuideJson('const guide = { ...other }'), /literal properties/)
})

test('accepts a complete guide and rejects malformed renderer inputs without throwing', () => {
  assert.deepEqual(validateGuide(guide(), 'sample', '2026-09-14'), [])
  const broken = guide()
  broken.sections[0].blocks = [null, { type: 'table', table: { columns: ['a', 'b'], rows: [['only one']] } }, { type: 'steps', steps: {} }]
  broken.faqs = [null]
  broken.related = [{ label: 'Bad route', to: '//example.com' }]
  const errors = validateGuide(broken, 'sample', '2026-09-14')
  assert.equal(errors.length, 5)
  assert.ok(errors.some((error) => error.includes('malformed table row')))
})

test('rejects future or impossible review dates and repeated table-of-contents anchors', () => {
  for (const updated of ['2026-02-30', '2026-09-15', 'not-a-date']) {
    assert.ok(validateGuide({ ...guide(), updated }, 'sample', '2026-09-14').some((error) => error.includes('non-future ISO date')))
  }
  const duplicate = guide()
  duplicate.sections.push(structuredClone(duplicate.sections[0]))
  assert.ok(validateGuide(duplicate, 'sample', '2026-09-14').some((error) => error.includes('duplicate anchor')))
})

test('only a definitive absent video response can remove an existing video', async () => {
  for (const status of [404, 410]) assert.equal(await oembedOk(video.id, async () => new Response('', { status })), false)
  for (const status of [401, 403, 429, 500, 503]) {
    await assert.rejects(oembedOk(video.id, async () => new Response('', { status })), /retaining existing content/)
  }
  await assert.rejects(oembedOk(video.id, async () => { throw new Error('timeout') }), /retaining existing content/)
  await assert.rejects(oembedOk(video.id, async () => new Response('{}')), /incomplete verification/)
  await assert.rejects(oembedOk(video.id, async () => new Response('<html>')), /invalid verification/)
})

test('valid video checks have a timeout and accept a real oEmbed title', async () => {
  assert.equal(await oembedOk(video.id, async (url, options) => {
    assert.ok(url.startsWith('https://www.youtube.com/oembed?'))
    assert.ok(options.signal instanceof AbortSignal)
    return Response.json({ title: 'Actual video' })
  }), true)
  assert.equal(await oembedOk('bad ID'), false)
})

test('video verification deduplicates network work and does not mutate source data', async () => {
  const source = { ...guide(), videos: [video] }
  source.sections[0].blocks.push({ type: 'video', video })
  let calls = 0
  const result = await verifyVideos(source, async () => { calls++; return false })
  assert.equal(calls, 1)
  assert.deepEqual(result.dropped, [video.id])
  assert.equal(result.guide.videos.length, 0)
  assert.equal(result.guide.sections[0].blocks.length, 1)
  assert.equal(source.videos.length, 1)
  assert.equal(source.sections[0].blocks.length, 2)
  await assert.rejects(verifyVideos(source, async () => { throw new Error('provider unavailable') }), /provider unavailable/)
  assert.equal(source.videos.length, 1)
})

test('a date-only rewrite cannot manufacture freshness, even with reordered properties', () => {
  const source = guide()
  const reordered = Object.fromEntries(Object.entries({ ...source, updated: '2026-09-14' }).reverse())
  assert.deepEqual(preserveUnchangedReviewDate(source, reordered), source)
  assert.equal(preserveUnchangedReviewDate(source, { ...source, title: 'Corrected title', updated: '2026-09-14' }).updated, '2026-09-14')
})

test('a generated answer must contain actual search grounding metadata', () => {
  assert.equal(hasSearchGrounding({ text: 'Trust me, I searched' }), false)
  assert.equal(hasSearchGrounding({ candidates: [{ groundingMetadata: { webSearchQueries: ['Warframe'] } }] }), false)
  assert.equal(hasSearchGrounding({ candidates: [{ groundingMetadata: {
    webSearchQueries: ['Warframe update'], groundingChunks: [{ web: { uri: 'https://www.warframe.com/updates' } }],
  } }] }), true)
})

test('old locale snapshots enter the follow-up queue after an English correction', () => {
  const current = { ...guide(), updated: '2026-09-14' }
  assert.equal(translationNeedsRefresh(current, guide()), true)
  assert.equal(translationNeedsRefresh(current, undefined), true)
  assert.equal(translationNeedsRefresh(current, { ...current, title: 'Título traducido' }), false)
  assert.equal(translationNeedsRefresh(current, { ...current, slug: 'wrong-guide' }), true)
})

test('equal review dates do not hide missing sections, FAQs or changed internal destinations', () => {
  const current = {
    ...guide(),
    faqs: [{ q: 'How?', a: 'Read [the guide](/guides/forma#build).' }],
    related: [{ label: 'Forma guide', to: '/guides/forma', icon: 'book' }],
  }
  const localized = structuredClone(current)
  localized.title = 'Guía de mods'
  localized.sections[0].title = 'Introducción'
  localized.sections[0].blocks[0].text = 'Contenido útil.'
  localized.faqs[0] = { q: '¿Cómo?', a: 'Lee [la guía](/guides/forma#build).' }
  localized.related[0].label = 'Guía de Forma'
  assert.equal(translationNeedsRefresh(current, localized), false)
  for (const mutate of [
    (copy) => copy.sections.push({ id: 'missing', title: 'New section', blocks: [] }),
    (copy) => copy.faqs.push({ q: 'Another question?', a: 'Another answer.' }),
    (copy) => { copy.related[0].to = '/guides/builds' },
    (copy) => { copy.faqs[0].a = 'Read [the guide](/guides/forma#variants).' },
  ]) {
    const changed = structuredClone(current)
    mutate(changed)
    assert.equal(translationNeedsRefresh(changed, localized), true)
  }
})

test('translated prose can reorder links while preserving every destination and duplicate count', () => {
  const current = guide()
  current.sections[0].blocks[0].text = 'Read [Forma](/guides/forma) then [builds](/guides/builds).'
  const localized = structuredClone(current)
  localized.sections[0].blocks[0].text = 'Consulta [las builds](/guides/builds) y [Forma](/guides/forma).'
  assert.equal(translationNeedsRefresh(current, localized), false)
  localized.sections[0].blocks[0].text += ' [Otra vez](/guides/forma).'
  assert.equal(translationNeedsRefresh(current, localized), true)
})

test('locale structure retains stat values, block types and source/video metadata', () => {
  const current = {
    ...guide(), stats: [{ num: '23 h', label: 'Build time' }],
    videos: [{ id: 'abcdefghijk', title: 'Verified video', channel: 'Creator' }],
  }
  const reordered = Object.fromEntries(Object.entries(current).reverse())
  assert.equal(translationNeedsRefresh(current, reordered), false)
  for (const mutate of [
    (copy) => { copy.stats[0].num = '24 h' },
    (copy) => { copy.sections[0].blocks[0].type = 'warn' },
    (copy) => { copy.sources[0].href = 'https://www.warframe.com/updates' },
    (copy) => { copy.videos[0].id = 'newvideo123' },
  ]) {
    const changed = structuredClone(current)
    mutate(changed)
    assert.equal(translationNeedsRefresh(current, changed), true)
  }
})
