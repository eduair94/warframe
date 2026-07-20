#!/usr/bin/env node
// Fill in MISSING i18n keys for an app/i18n/messages/*.ts namespace file.
//
//   node scripts/tr-file.mjs app/i18n/messages/setDetail.ts
//   node scripts/tr-file.mjs app/i18n/messages/setDetail.ts --locales es,fr --force --dry
//
// The English block is the source of truth. For every other locale the script
// diffs key paths against `en`, asks Gemini for ONLY the missing strings, then
// rewrites the file with the same shape. Existing translations are never
// touched unless --force is passed (which retranslates everything).
//
// Why this exists: adding a handful of keys to a 13-locale namespace by hand (or
// by fanning out one agent per locale) is slow and drifts. This makes it one
// command, and it validates the two things that actually break the production
// build — a literal `@` (vue-i18n's linked-message marker) and a placeholder
// that does not survive translation.
//
// Env: GEMINI_API_KEY (see .env), GEMINI_MODEL (default gemini-flash-latest).

import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')

// Load .env the same way the rest of the repo's scripts expect it.
if (existsSync(resolve(ROOT, '.env'))) {
  for (const line of readFileSync(resolve(ROOT, '.env'), 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i)
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
  }
}

// Must stay in sync with nuxt.config LOCALES.
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
// Translation backend: 'gemini' (default, best copy) or 'free' (free-translate,
// Google-backed, no API key — faster/cheaper for bulk fills, plainer wording).
const ENGINE = (arg('--engine') || 'gemini').toLowerCase()

// Our locale codes -> the codes free-translate/Google expect. Most match; only
// the Chinese scripts differ (zh-hans -> zh-CN, zh-hant -> zh-TW).
const GOOGLE_CODE = {
  es: 'es', pt: 'pt', de: 'de', fr: 'fr', ru: 'ru', ko: 'ko', ja: 'ja',
  'zh-hans': 'zh-CN', 'zh-hant': 'zh-TW', pl: 'pl', it: 'it', uk: 'uk',
}

if (!FILE) {
  console.error('usage: tr-file.mjs <app/i18n/messages/NAME.ts> [--locales es,fr] [--force] [--dry]')
  process.exit(1)
}
const PATH = resolve(ROOT, FILE)
if (!existsSync(PATH)) {
  console.error(`FATAL: no such file: ${PATH}`)
  process.exit(1)
}

// --- parse -----------------------------------------------------------------
// These namespace files are pure data: a header comment then
// `export default { en: {...}, es: {...} }`. Evaluating the literal is far more
// robust than regex-scraping it, and the input is our own repo file.
const source = readFileSync(PATH, 'utf8')
const start = source.indexOf('export default')
if (start < 0) {
  console.error('FATAL: file has no `export default` object literal')
  process.exit(1)
}
const header = source.slice(0, start).trimEnd()
const literal = source.slice(start).replace(/^export\s+default\s*/, '').trim().replace(/;?\s*$/, '')

let tree
try {
  tree = new Function(`return (${literal})`)()
} catch (e) {
  console.error(`FATAL: could not parse the object literal: ${e.message}`)
  process.exit(1)
}
if (!tree.en) {
  console.error('FATAL: no `en` block to translate from')
  process.exit(1)
}

// --- key walking -----------------------------------------------------------
function paths(obj, prefix = '') {
  const out = []
  for (const [k, v] of Object.entries(obj || {})) {
    const p = prefix ? `${prefix}.${k}` : k
    if (v && typeof v === 'object' && !Array.isArray(v)) out.push(...paths(v, p))
    else out.push(p)
  }
  return out
}
const get = (obj, p) => p.split('.').reduce((o, k) => (o == null ? o : o[k]), obj)
function set(obj, p, value) {
  const keys = p.split('.')
  let node = obj
  for (const k of keys.slice(0, -1)) {
    if (!node[k] || typeof node[k] !== 'object') node[k] = {}
    node = node[k]
  }
  node[keys[keys.length - 1]] = value
}

const PLACEHOLDER = /\{([a-zA-Z_][a-zA-Z0-9_]*)\}/g
const phOf = (s) => [...String(s).matchAll(PLACEHOLDER)].map((m) => m[1]).sort().join(',')

const enPaths = paths(tree.en)

// --- translate -------------------------------------------------------------
function parseArray(text) {
  let t = String(text || '').trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim()
  const a = t.indexOf('[')
  const b = t.lastIndexOf(']')
  if (a > 0 || b < t.length - 1) t = t.slice(a, b + 1)
  return JSON.parse(t)
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

/**
 * Retry on the two transient Gemini failures: 429 (free tier is 5 requests per
 * minute, so a 12-locale run WILL hit it) and 503 (model overloaded). Honours
 * the server's own retryDelay when it supplies one.
 */
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
      console.log(`  … ${label}: ${asked ? `rate limited, waiting ${asked + 2}s` : `transient error, retrying in ${wait / 1000}s`} (attempt ${i}/${attempts - 1})`)
      await sleep(wait)
    }
  }
}

async function askGemini(ai, strings, langName) {
  const prompt = [
    `Translate each string in this JSON array from English to ${langName}.`,
    `Context: UI strings for a Warframe (video game) market-analysis web app. Terse, confident product copy.`,
    ``,
    `HARD RULES — a violation breaks the production build:`,
    `- Return ONLY a JSON array of the SAME length and SAME order. No commentary, no markdown fence.`,
    `- Placeholders look like {name} {pct} {basis} {time} {days} {total}. Copy them EXACTLY: same spelling, same single braces, no spaces inside. Never translate a placeholder name.`,
    `- NEVER output a literal @ character, and never output { or } except as part of a placeholder. vue-i18n treats @ as a linked-message marker and the build gate rejects it.`,
    ``,
    `GLOSSARY: "set" = an assembled multi-part item; "parts" = its components; "platinum" = the premium currency;`,
    `"Ducats" = Baro Ki Teer currency; "Vaulted" = removed from the drop tables; "Relic" and "Prime" stay in English.`,
    `"order book", "sell orders", "buy orders", "spread", "median", "volume" are standard trading terms.`,
    ``,
    `STYLE: strings that look like column headers or buttons must stay SHORT — they sit in a dense table and a long label breaks the layout.`,
    ``,
    `Input:`,
    JSON.stringify(strings),
  ].join('\n')
  const res = await ai.models.generateContent({ model: MODEL, contents: prompt, config: { temperature: 0.2 } })
  return parseArray(res.text)
}

async function translate(ai, strings, langName, label) {
  let out = await withRetry(() => askGemini(ai, strings, langName), label)
  const bad = () =>
    !Array.isArray(out) ||
    out.length !== strings.length ||
    out.some((s, i) => typeof s !== 'string' || phOf(s) !== phOf(strings[i]) || s.includes('@'))
  // One retry: a placeholder or an @ slipping through is a build-breaker, so it
  // is worth a second call before falling back to English.
  if (bad()) out = await withRetry(() => askGemini(ai, strings, langName), label)
  if (!Array.isArray(out)) return null
  return out
}

// --- free-translate backend -------------------------------------------------
// Brand/domain literals Google would otherwise translate (e.g. "warframe.market"
// -> "warframe.mercado", "Warframe" -> localized). Masked like placeholders.
const PROTECT_LITERALS = ['warframe.market', 'Warframe', 'WTS', 'WTB']

// Google mangles named placeholders like {price} (it translates/reorders the
// word or spaces the braces) and brand literals. Swap each for a numeric
// sentinel {0}, {1}, … that Google preserves, then restore. Anything that still
// comes back malformed is caught by the phOf validation in main() and falls back
// to English.
function protectPlaceholders(s) {
  const names = [] // each entry: { kind: 'lit' | 'ph', val }
  let masked = String(s)
  // Literals first (longest/most-specific first so 'warframe.market' wins over 'Warframe').
  for (const lit of PROTECT_LITERALS) {
    if (masked.includes(lit)) {
      const token = `{${names.push({ kind: 'lit', val: lit }) - 1}}`
      masked = masked.split(lit).join(token)
    }
  }
  // Then named placeholders {price}, {item}, … (regex requires an alpha start,
  // so it never re-matches the numeric sentinels above).
  masked = masked.replace(PLACEHOLDER, (_m, name) => `{${names.push({ kind: 'ph', val: name }) - 1}}`)
  return { masked, names }
}
function restorePlaceholders(s, names) {
  return String(s).replace(/\{\s*(\d+)\s*\}/g, (_m, i) => {
    const n = names[Number(i)]
    if (!n) return _m
    return n.kind === 'ph' ? `{${n.val}}` : n.val
  })
}

/**
 * Keyless Google translate — the same backend the `free-translate` package
 * wraps, called directly. (The npm package itself pulls in `nightmare`/Electron
 * and cannot run headless, so we hit the public endpoint over plain fetch: no
 * dependency, no browser, same result.) Returns the joined translation.
 */
async function googleTranslate(text, to, attempts = 3) {
  const url =
    `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${encodeURIComponent(to)}&dt=t&q=${encodeURIComponent(text)}`
  for (let i = 1; i <= attempts; i++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } })
      if (res.status === 429 || res.status >= 500) throw new Error(`google ${res.status}`)
      if (!res.ok) throw new Error(`google ${res.status}`)
      const data = await res.json()
      // Response: [[[translatedChunk, originalChunk, …], …], …] — join the chunks.
      return (data?.[0] || []).map((seg) => (seg && seg[0]) || '').join('')
    } catch (e) {
      if (i === attempts) throw e
      await sleep(400 * i)
    }
  }
  return ''
}

/**
 * Translate one namespace's missing strings for one locale via the keyless
 * Google endpoint. Per-string; a failed string is left null so the caller falls
 * it back to English.
 */
async function translateFreeLocale(strings, googleCode) {
  const out = []
  for (const s of strings) {
    try {
      const { masked, names } = protectPlaceholders(s)
      const raw = await googleTranslate(masked, googleCode)
      out.push(restorePlaceholders(raw, names))
    } catch {
      out.push(null)
    }
  }
  return out
}

async function runFree(work) {
  let ok = 0
  let fail = 0
  // free-translate hits Google's public endpoint; a little concurrency across
  // locales is fine, too much risks a throttle. 3 keeps it quick and polite.
  const CONC = Number(process.env.TRANSLATE_CONCURRENCY || 3)
  let idx = 0
  const worker = async () => {
    while (idx < work.length) {
      const { loc, missing } = work[idx++]
      const google = GOOGLE_CODE[loc] || loc
      const strings = missing.map((p) => get(tree.en, p))
      try {
        const out = await translateFreeLocale(strings, google)
        let kept = 0
        missing.forEach((p, i) => {
          const v = out[i]
          const usable = typeof v === 'string' && v.trim() && !v.includes('@') && phOf(v) === phOf(strings[i])
          if (!tree[loc]) tree[loc] = {}
          set(tree[loc], p, usable ? v : strings[i])
          if (usable) kept++
        })
        ok++
        console.log(`  ✓ ${loc}: ${kept}/${missing.length} translated${kept < missing.length ? ' (rest fell back to English)' : ''}`)
      } catch (e) {
        fail++
        console.error(`  ✗ ${loc}: ${e?.message || e}`)
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(CONC, work.length) }, worker))
  return { ok, fail }
}

async function runGemini(work) {
  if (!process.env.GEMINI_API_KEY) {
    console.error('FATAL: GEMINI_API_KEY not set')
    process.exit(1)
  }
  const { GoogleGenAI } = await import('@google/genai')
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })

  let ok = 0
  let fail = 0
  // Free-tier Gemini allows ~5 requests/minute; 2 in flight keeps the backoff
  // path rare instead of the norm.
  const CONC = Number(process.env.TRANSLATE_CONCURRENCY || 2)
  let idx = 0
  const worker = async () => {
    while (idx < work.length) {
      const { loc, missing } = work[idx++]
      const strings = missing.map((p) => get(tree.en, p))
      try {
        const out = await translate(ai, strings, LANGS[loc], loc)
        if (!out) throw new Error('no usable response')
        let kept = 0
        missing.forEach((p, i) => {
          const v = out[i]
          // Per-string validation: anything that lost a placeholder or gained an
          // @ falls back to English rather than breaking the compile gate.
          const usable = typeof v === 'string' && v.trim() && !v.includes('@') && phOf(v) === phOf(strings[i])
          if (!tree[loc]) tree[loc] = {}
          set(tree[loc], p, usable ? v : strings[i])
          if (usable) kept++
        })
        ok++
        console.log(`  ✓ ${loc}: ${kept}/${missing.length} translated${kept < missing.length ? ' (rest fell back to English)' : ''}`)
      } catch (e) {
        fail++
        console.error(`  ✗ ${loc}: ${e?.message || e}`)
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(CONC, work.length) }, worker))
  return { ok, fail }
}

async function main() {
  const work = []
  for (const loc of LOCALES) {
    const block = tree[loc] || {}
    const missing = FORCE ? enPaths : enPaths.filter((p) => typeof get(block, p) !== 'string')
    if (missing.length) work.push({ loc, missing })
  }

  if (!work.length) {
    console.log(`tr-file[${FILE}]: nothing missing across ${LOCALES.length} locales`)
    return
  }

  console.log(`tr-file[${FILE}]: engine=${ENGINE}`)
  for (const w of work) console.log(`  ${w.loc}: ${w.missing.length} missing`)
  if (DRY) return

  let ok = 0
  let fail = 0
  if (ENGINE === 'free') {
    ;({ ok, fail } = await runFree(work))
  } else {
    ;({ ok, fail } = await runGemini(work))
  }

  // --- emit ----------------------------------------------------------------
  const render = (obj, indent) => {
    const pad = ' '.repeat(indent)
    const lines = []
    for (const [k, v] of Object.entries(obj)) {
      const key = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(k) ? k : `'${k}'`
      if (v && typeof v === 'object' && !Array.isArray(v)) {
        lines.push(`${pad}${key}: {`)
        lines.push(render(v, indent + 2))
        lines.push(`${pad}},`)
      } else {
        lines.push(`${pad}${key}: ${JSON.stringify(v)},`)
      }
    }
    return lines.join('\n')
  }

  const body = ORDER.filter((loc) => tree[loc])
    .map((loc) => {
      const key = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(loc) ? loc : `'${loc}'`
      return `  ${key}: {\n${render(tree[loc], 4)}\n  },`
    })
    .join('\n')

  writeFileSync(PATH, `${header}\nexport default {\n${body}\n}\n`, 'utf8')
  console.log(`tr-file[${FILE}]: ${ok} ok, ${fail} failed — wrote ${PATH}`)
  if (fail) process.exitCode = 2
}

main().catch((e) => {
  console.error('fatal', e)
  process.exit(1)
})
