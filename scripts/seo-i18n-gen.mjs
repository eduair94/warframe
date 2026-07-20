#!/usr/bin/env node
// Fill in MISSING locales for a localized-SEO overlay file
// (app/app/utils/seo-i18n*.ts).
//
//   node scripts/seo-i18n-gen.mjs app/app/utils/seo-i18n-account.ts
//   node scripts/seo-i18n-gen.mjs app/app/utils/seo-i18n-account.ts --locales es,fr --force --dry
//
// Why this exists: `i18n:check` has a BLOCKING gate requiring every PAGE_SEO key
// to carry a title AND description in all 12 non-English locales. Adding one
// page therefore means writing 24 strings by hand. This is the SEO twin of
// scripts/tr-file.mjs: the `en` block is the source of truth, Gemini fills the
// gaps, and existing entries are never touched unless --force.
//
// SEO copy has its own hard constraints the generic translator does not enforce:
// a <title> over ~60 characters is truncated in the SERP and a meta description
// over ~160 is cut off, so the prompt and the validator both bound the length.
//
// Env: GEMINI_API_KEY (read from the repo-root .env), GEMINI_MODEL.

import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')

if (existsSync(resolve(ROOT, '.env'))) {
  for (const line of readFileSync(resolve(ROOT, '.env'), 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i)
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
  }
}

// Must stay in sync with nuxt.config LOCALES (and with tr-file.mjs).
const LANGS = {
  es: 'Spanish (neutral Latin American)',
  pt: 'Brazilian Portuguese',
  de: 'German',
  fr: 'French',
  ru: 'Russian',
  ko: 'Korean',
  ja: 'Japanese',
  'zh-hans': 'Simplified Chinese',
  'zh-hant': 'Traditional Chinese',
  pl: 'Polish',
  it: 'Italian',
  uk: 'Ukrainian',
}
const ORDER = ['en', ...Object.keys(LANGS)]

/** SERP limits. Over these the copy is truncated with an ellipsis. */
const MAX_TITLE = 70
const MAX_DESC = 175

const argv = process.argv.slice(2)
const arg = (n) => {
  const i = argv.indexOf(n)
  return i >= 0 ? argv[i + 1] : undefined
}
const FILE = argv.find((a) => !a.startsWith('--') && a !== arg('--locales'))
const FORCE = argv.includes('--force')
const DRY = argv.includes('--dry')
const ONLY = (arg('--locales') || '').split(',').map((s) => s.trim()).filter(Boolean)
const LOCALES = ONLY.length ? ONLY : Object.keys(LANGS)
const MODEL = process.env.GEMINI_MODEL || 'gemini-flash-latest'

if (!FILE) {
  console.error('usage: seo-i18n-gen.mjs <app/app/utils/seo-i18n-NAME.ts> [--locales es,fr] [--force] [--dry]')
  process.exit(1)
}
const PATH = resolve(ROOT, FILE)
if (!existsSync(PATH)) {
  console.error(`FATAL: no such file: ${PATH}`)
  process.exit(1)
}

// --- parse -----------------------------------------------------------------
// The overlay files are pure data: a header, a type-only import, then
// `export const NAME: Record<...> = { ... }`. Strip the TS annotation and
// evaluate the literal (same approach as tr-file.mjs — it is our own file).
const source = readFileSync(PATH, 'utf8')
const m = source.match(/export\s+const\s+([A-Za-z0-9_]+)\s*:[^=]*=\s*/)
if (!m) {
  console.error('FATAL: file has no `export const NAME: ... = {` declaration')
  process.exit(1)
}
const EXPORT_NAME = m[1]
const header = source.slice(0, m.index).trimEnd()
const literal = source.slice(m.index + m[0].length).trim().replace(/;?\s*$/, '')

let tree
try {
  tree = new Function(`return (${literal})`)()
} catch (e) {
  console.error(`FATAL: could not parse the object literal: ${e.message}`)
  process.exit(1)
}
if (!tree.en || !Object.keys(tree.en).length) {
  console.error('FATAL: no `en` block to translate from')
  process.exit(1)
}

const PAGES = Object.keys(tree.en)

// --- translate -------------------------------------------------------------
function parseArray(text) {
  let t = String(text || '').trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim()
  const a = t.indexOf('[')
  const b = t.lastIndexOf(']')
  if (a > 0 || b < t.length - 1) t = t.slice(a, b + 1)
  return JSON.parse(t)
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

/** Same transient-failure policy as tr-file.mjs (429 rate limit, 503 overload). */
async function withRetry(fn, label, attempts = 5) {
  for (let i = 1; i <= attempts; i++) {
    try {
      return await fn()
    } catch (e) {
      const msg = String(e?.message || e)
      const transient = /\b429\b|RESOURCE_EXHAUSTED|\b503\b|UNAVAILABLE|high demand/i.test(msg)
      if (!transient || i === attempts) throw e
      const asked = Number(msg.match(/"retryDelay"\s*:\s*"(\d+)s"/)?.[1] || 0)
      const wait = Math.max(asked ? (asked + 2) * 1000 : 0, 5000 * i)
      console.log(`  … ${label}: waiting ${Math.round(wait / 1000)}s (attempt ${i}/${attempts - 1})`)
      await sleep(wait)
    }
  }
}

async function askGemini(ai, pairs, langName) {
  const prompt = [
    `Localize these web-page SEO entries from English into ${langName}.`,
    `Context: a free Warframe (video game) market-analytics site. Each entry is a browser <title> and a meta description for one page.`,
    ``,
    `HARD RULES — a violation breaks the production build or the search snippet:`,
    `- Return ONLY a JSON array of objects, SAME length and SAME order as the input, each { "title": "...", "description": "..." }. No commentary, no markdown fence.`,
    `- title: at most ${MAX_TITLE} characters. description: at most ${MAX_DESC} characters. Count characters, not words.`,
    `- NEVER output a literal @ character, and never output { or }.`,
    `- Do not translate the game's proper nouns: Warframe, Prime, Relic, Tenno, Ducats, Baro Ki Teer, Prime Resurgence.`,
    ``,
    `GLOSSARY: "platinum" = the premium currency (translate it); "set" = an assembled multi-part item; "parts" = its components;`,
    `"vaulted" = removed from the drop tables; "vault" here means the player's own collection, NOT the game's Prime Vault.`,
    ``,
    `STYLE: this is marketing copy that must read naturally to a native speaker and to a search engine. Lead with the benefit,`,
    `keep the keyword ("Warframe" plus the page's topic) in the title, and do not pad to reach the limit.`,
    ``,
    `Input:`,
    JSON.stringify(pairs),
  ].join('\n')
  const res = await ai.models.generateContent({
    model: MODEL,
    contents: prompt,
    config: { temperature: 0.3 },
  })
  return parseArray(res.text)
}

/** A usable entry is a non-empty, @-free, brace-free, length-bounded pair. */
function usableEntry(entry) {
  if (!entry || typeof entry !== 'object') return false
  const { title, description } = entry
  for (const [value, max] of [[title, MAX_TITLE], [description, MAX_DESC]]) {
    if (typeof value !== 'string') return false
    const v = value.trim()
    if (!v || v.length > max) return false
    if (v.includes('@') || v.includes('{') || v.includes('}')) return false
  }
  return true
}

async function main() {
  const work = []
  for (const loc of LOCALES) {
    const block = tree[loc] || {}
    const missing = FORCE
      ? PAGES
      : PAGES.filter((p) => {
          const e = block[p]
          return !e || typeof e.title !== 'string' || !e.title || typeof e.description !== 'string' || !e.description
        })
    if (missing.length) work.push({ loc, missing })
  }

  if (!work.length) {
    console.log(`seo-i18n-gen[${FILE}]: nothing missing across ${LOCALES.length} locales`)
    return
  }

  console.log(`seo-i18n-gen[${FILE}] (${EXPORT_NAME}):`)
  for (const w of work) console.log(`  ${w.loc}: ${w.missing.length} page(s) missing`)
  if (DRY) return

  if (!process.env.GEMINI_API_KEY) {
    console.error('FATAL: GEMINI_API_KEY not set')
    process.exit(1)
  }
  const { GoogleGenAI } = await import('@google/genai')
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })

  let ok = 0
  let fail = 0
  const CONC = Number(process.env.TRANSLATE_CONCURRENCY || 2)
  let idx = 0
  const worker = async () => {
    while (idx < work.length) {
      const { loc, missing } = work[idx++]
      const pairs = missing.map((p) => ({ title: tree.en[p].title, description: tree.en[p].description }))
      try {
        let out = await withRetry(() => askGemini(ai, pairs, LANGS[loc]), loc)
        const bad = () =>
          !Array.isArray(out) || out.length !== pairs.length || out.some((e) => !usableEntry(e))
        // One retry: over-long or @-bearing copy is worth a second call before
        // falling back to English (which would ship an untranslated snippet).
        if (bad()) out = await withRetry(() => askGemini(ai, pairs, LANGS[loc]), loc)
        if (!Array.isArray(out)) throw new Error('no usable response')
        if (!tree[loc]) tree[loc] = {}
        let kept = 0
        missing.forEach((p, i) => {
          const entry = out[i]
          if (usableEntry(entry)) {
            tree[loc][p] = { title: entry.title.trim(), description: entry.description.trim() }
            kept++
          } else {
            tree[loc][p] = { ...tree.en[p] }
          }
        })
        ok++
        console.log(
          `  ✓ ${loc}: ${kept}/${missing.length} localized${kept < missing.length ? ' (rest fell back to English)' : ''}`
        )
      } catch (e) {
        fail++
        // Still write the English fallback: an English snippet is a far smaller
        // problem than a red build that blocks the whole deploy.
        if (!tree[loc]) tree[loc] = {}
        for (const p of missing) if (!tree[loc][p]) tree[loc][p] = { ...tree.en[p] }
        console.error(`  ✗ ${loc}: ${e?.message || e} (fell back to English)`)
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(CONC, work.length) }, worker))

  // --- emit ----------------------------------------------------------------
  const locales = ORDER.filter((l) => tree[l] && Object.keys(tree[l]).length)
  const lines = [header, '', `export const ${EXPORT_NAME}: Record<string, Record<string, PageSeo>> = {`]
  locales.forEach((loc, li) => {
    lines.push(`  ${JSON.stringify(loc)}: {`)
    const pages = Object.keys(tree[loc])
    pages.forEach((p, pi) => {
      const e = tree[loc][p]
      lines.push(`    ${JSON.stringify(p)}: {`)
      lines.push(`      "title": ${JSON.stringify(e.title)},`)
      lines.push(`      "description": ${JSON.stringify(e.description)}`)
      lines.push(`    }${pi === pages.length - 1 ? '' : ','}`)
    })
    lines.push(`  }${li === locales.length - 1 ? '' : ','}`)
  })
  lines.push('}', '')

  writeFileSync(PATH, lines.join('\n'), 'utf8')
  console.log(`seo-i18n-gen[${FILE}]: wrote ${locales.length} locale block(s) — ${ok} ok, ${fail} failed`)
  if (fail) process.exitCode = 2
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
