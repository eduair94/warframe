#!/usr/bin/env node
// Translate the Knowledge Center guide CONTENT into every non-English locale with
// Gemini, writing data/guides/locales/<slug>.<locale>.json. The guide pages load
// these overrides via useLocalizedGuide() (English stays the canonical source).
//
// SAFE-BY-CONSTRUCTION: we don't ask the model to reproduce the nested guide JSON.
// We (1) deterministically collect the translatable LEAF strings, (2) ask Gemini to
// translate just that flat array (same length/order), (3) reinject into a deep clone
// of the English guide. Identifiers (slug, ids, routes, video ids, icons, numbers,
// source labels) never touch the model, so structure can't drift.
//
//   node scripts/translate-guides.mjs                       # all guides × 12 locales (skip existing)
//   node scripts/translate-guides.mjs --slug credits --locales es
//   node scripts/translate-guides.mjs --force               # re-translate everything
//
// Env: GEMINI_API_KEY (required), GEMINI_MODEL (default gemini-flash-latest).

import { readFileSync, writeFileSync, readdirSync, mkdirSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const GUIDES_DIR = join(__dirname, '..', 'app', 'app', 'data', 'guides')
const OUT_DIR = join(GUIDES_DIR, 'locales')
const NOT_GUIDES = new Set(['types.ts', 'registry.ts', 'farmIndex.ts'])

const LANGS = {
  es: 'Spanish', pt: 'Brazilian Portuguese', de: 'German', fr: 'French', ru: 'Russian',
  ko: 'Korean', ja: 'Japanese', 'zh-hans': 'Simplified Chinese', 'zh-hant': 'Traditional Chinese',
  pl: 'Polish', it: 'Italian', uk: 'Ukrainian',
}

const argv = process.argv.slice(2)
const arg = (name) => { const i = argv.indexOf(name); return i >= 0 ? argv[i + 1] : undefined }
const FORCE = argv.includes('--force')
const ONLY_SLUG = arg('--slug')
const ONLY_LOCALES = (arg('--locales') || '').split(',').map((s) => s.trim()).filter(Boolean)
const MODEL = process.env.GEMINI_MODEL || 'gemini-flash-latest'
const CONCURRENCY = Number(process.env.TRANSLATE_CONCURRENCY || 6)
const LOCALES = (ONLY_LOCALES.length ? ONLY_LOCALES : Object.keys(LANGS))

function listGuides() {
  return readdirSync(GUIDES_DIR)
    .filter((f) => f.endsWith('.ts') && !NOT_GUIDES.has(f))
    .map((f) => ({ slug: f.replace(/\.ts$/, ''), path: join(GUIDES_DIR, f) }))
    .filter((g) => !ONLY_SLUG || g.slug === ONLY_SLUG)
}

function extractGuideJson(source) {
  const m = source.match(/const guide: Guide =\s*([\s\S]*?)\n\s*export default guide/)
  if (!m) throw new Error('cannot locate guide payload')
  return JSON.parse(m[1].trim())
}

// Walk a guide, collecting translatable leaf strings + setters (same order).
function collect(g) {
  const strings = []
  const setters = []
  const add = (obj, key) => {
    const v = obj?.[key]
    if (typeof v === 'string' && v.trim()) { strings.push(v); setters.push((s) => { obj[key] = s }) }
  }
  const addArr = (arr) => {
    if (!Array.isArray(arr)) return
    arr.forEach((v, i) => { if (typeof v === 'string' && v.trim()) { strings.push(v); setters.push((s) => { arr[i] = s }) } })
  }
  add(g, 'eyebrow'); add(g, 'title'); add(g, 'lede')
  for (const st of g.stats || []) add(st, 'label')
  for (const sec of g.sections || []) {
    add(sec, 'title')
    for (const b of sec.blocks || []) {
      if (b.type === 'p' || b.type === 'tip' || b.type === 'warn' || b.type === 'info') { add(b, 'text'); add(b, 'title') }
      else if (b.type === 'list') addArr(b.items)
      else if (b.type === 'steps') for (const s of b.steps || []) { add(s, 'h'); add(s, 'p') }
      else if (b.type === 'quote') { add(b, 'text'); add(b, 'cite') }
      else if (b.type === 'kv') for (const row of b.kv || []) { add(row, 'k'); add(row, 'v') }
      else if (b.type === 'links') { add(b, 'title'); for (const l of b.links || []) { add(l, 'label'); add(l, 'note') } }
      else if (b.type === 'table' && b.table) { addArr(b.table.columns); for (const r of b.table.rows || []) addArr(r); add(b.table, 'note') }
      // video blocks: nothing translatable
    }
  }
  for (const f of g.faqs || []) { add(f, 'q'); add(f, 'a') }
  for (const r of g.related || []) { add(r, 'label'); add(r, 'note') }
  // sources[].label kept English (external thread / wiki titles)
  return { strings, setters }
}

function parseArray(text) {
  let t = String(text || '').trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim()
  const a = t.indexOf('['), b = t.lastIndexOf(']')
  if (a > 0 || b < t.length - 1) t = t.slice(a, b + 1)
  return JSON.parse(t)
}

async function translateBatch(ai, strings, langName) {
  const prompt = [
    `Translate each string in this JSON array from English to ${langName}. Context: a Warframe (video game) strategy/farming guide website.`,
    `Rules:`,
    `- Keep Warframe game proper nouns in English: Warframe/frame/weapon/item/mod/node/faction/mission names (e.g. Höllvania, Kuva, Steel Path, Prime, Orokin, Profit-Taker, The Index, Chroma, Necramech, Wukong, Secura Lecta, Eidolon, Railjack, Fortuna, Deimos).`,
    `- Preserve markdown links exactly as [visible text](/route): translate ONLY the visible text, keep the URL/route unchanged.`,
    `- Keep inline \`code\`, {placeholders}, numbers, and units unchanged.`,
    `- In this game "farm/farming" means grinding for loot — NOT agriculture. Translate it with the gaming sense (or keep "farming").`,
    `- Return ONLY a JSON array of the SAME length and order, each element the translation of the corresponding input. No commentary.`,
    ``,
    `Input:`,
    JSON.stringify(strings),
  ].join('\n')
  const res = await ai.models.generateContent({ model: MODEL, contents: prompt, config: { temperature: 0.3 } })
  return parseArray(res.text)
}

async function translateGuide(ai, guideObj, locale) {
  const clone = JSON.parse(JSON.stringify(guideObj))
  const { strings, setters } = collect(clone)
  if (!strings.length) return clone
  let out = await translateBatch(ai, strings, LANGS[locale])
  if (!Array.isArray(out) || out.length !== strings.length) {
    // one retry
    out = await translateBatch(ai, strings, LANGS[locale])
    if (!Array.isArray(out) || out.length !== strings.length) {
      throw new Error(`length mismatch (${Array.isArray(out) ? out.length : 'n/a'} vs ${strings.length})`)
    }
  }
  setters.forEach((set, i) => set(typeof out[i] === 'string' ? out[i] : strings[i]))
  return clone
}

async function pool(items, n, fn) {
  const results = []
  let idx = 0
  const workers = Array.from({ length: Math.min(n, items.length) }, async () => {
    while (idx < items.length) {
      const cur = idx++
      results[cur] = await fn(items[cur], cur).catch((e) => ({ error: e?.message || String(e) }))
    }
  })
  await Promise.all(workers)
  return results
}

async function main() {
  if (!process.env.GEMINI_API_KEY) { console.error('FATAL: GEMINI_API_KEY not set'); process.exit(1) }
  if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true })
  const { GoogleGenAI } = await import('@google/genai')
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })

  const guides = listGuides()
  const jobs = []
  for (const g of guides) {
    const en = extractGuideJson(readFileSync(g.path, 'utf8'))
    for (const loc of LOCALES) {
      const outPath = join(OUT_DIR, `${g.slug}.${loc}.json`)
      if (!FORCE && existsSync(outPath)) continue
      jobs.push({ slug: g.slug, loc, en, outPath })
    }
  }
  console.log(`translate-guides: model=${MODEL} guides=${guides.length} locales=${LOCALES.length} jobs=${jobs.length} conc=${CONCURRENCY}`)

  let ok = 0, fail = 0
  const res = await pool(jobs, CONCURRENCY, async (job) => {
    const localized = await translateGuide(ai, job.en, job.loc)
    writeFileSync(job.outPath, JSON.stringify(localized, null, 2), 'utf8')
    return { slug: job.slug, loc: job.loc }
  })
  for (let i = 0; i < res.length; i++) {
    const r = res[i]
    if (r && r.error) { fail++; console.error(`  ✗ ${jobs[i].slug}.${jobs[i].loc}: ${r.error}`) }
    else { ok++; console.log(`  ✓ ${jobs[i].slug}.${jobs[i].loc}`) }
  }
  console.log(`\ntranslate-guides: ${ok} ok, ${fail} failed.`)
  if (fail > 0) process.exit(2)
}

main().catch((e) => { console.error('fatal', e); process.exit(1) })
