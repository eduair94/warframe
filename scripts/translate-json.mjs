#!/usr/bin/env node
// Generic content translator: walk a JSON file, collect every string leaf whose
// IMMEDIATE key is in the --keys allowlist (arrays-of-strings under such a key are
// translated element-wise), translate that flat array with Gemini, reinject into a
// deep clone. Keys not in the allowlist (slug, url, name, icon, tier, …) are left
// untouched, so identifiers and proper nouns never drift.
//
//   node scripts/translate-json.mjs <input.json> <outDir> --keys blurb,oneLiner,pros [--locales es,fr] [--force]
// Writes <outDir>/<locale>.json for every locale. Env: GEMINI_API_KEY, GEMINI_MODEL.

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'

const LANGS = {
  es: 'Spanish', pt: 'Brazilian Portuguese', de: 'German', fr: 'French', ru: 'Russian',
  ko: 'Korean', ja: 'Japanese', 'zh-hans': 'Simplified Chinese', 'zh-hant': 'Traditional Chinese',
  pl: 'Polish', it: 'Italian', uk: 'Ukrainian',
}
const argv = process.argv.slice(2)
const positional = argv.filter((a) => !a.startsWith('--') && argv[argv.indexOf(a) - 1] !== '--keys' && argv[argv.indexOf(a) - 1] !== '--locales')
const IN = positional[0]
const OUT_DIR = positional[1]
const arg = (n) => { const i = argv.indexOf(n); return i >= 0 ? argv[i + 1] : undefined }
const FORCE = argv.includes('--force')
const KEYS = new Set((arg('--keys') || '').split(',').map((s) => s.trim()).filter(Boolean))
const ONLY = (arg('--locales') || '').split(',').map((s) => s.trim()).filter(Boolean)
const MODEL = process.env.GEMINI_MODEL || 'gemini-flash-latest'
const LOCALES = ONLY.length ? ONLY : Object.keys(LANGS)

function collect(node, strings, setters) {
  if (Array.isArray(node)) {
    for (const item of node) collect(item, strings, setters)
  } else if (node && typeof node === 'object') {
    for (const key of Object.keys(node)) {
      const v = node[key]
      if (KEYS.has(key)) {
        if (typeof v === 'string' && v.trim()) { strings.push(v); setters.push((s) => { node[key] = s }) }
        else if (Array.isArray(v)) v.forEach((el, i) => { if (typeof el === 'string' && el.trim()) { strings.push(el); setters.push((s) => { v[i] = s }) } })
      }
      if (v && typeof v === 'object') collect(v, strings, setters)
    }
  }
}

function parseArray(text) {
  let t = String(text || '').trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim()
  const a = t.indexOf('['), b = t.lastIndexOf(']')
  if (a > 0 || b < t.length - 1) t = t.slice(a, b + 1)
  return JSON.parse(t)
}
// Chunk large string sets so one call stays reasonable.
function chunk(arr, n) { const out = []; for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n)); return out }

async function translateBatch(ai, strings, langName) {
  const prompt = [
    `Translate each string in this JSON array from English to ${langName}. Context: a Warframe (video game) tools/creators directory.`,
    `- Keep Warframe game proper nouns, brand/tool/creator names, and website names in English.`,
    `- Preserve markdown links [text](/route): translate visible text, keep URL. Keep inline \`code\`, {placeholders}, numbers, URLs unchanged.`,
    `- "farm/farming" = grinding for loot (gaming sense), not agriculture.`,
    `- Return ONLY a JSON array of the SAME length and order. No commentary.`,
    ``, `Input:`, JSON.stringify(strings),
  ].join('\n')
  const res = await ai.models.generateContent({ model: MODEL, contents: prompt, config: { temperature: 0.3 } })
  return parseArray(res.text)
}

async function translateAll(ai, strings, langName) {
  const chunks = chunk(strings, 40)
  const out = []
  for (const c of chunks) {
    let r = await translateBatch(ai, c, langName)
    if (!Array.isArray(r) || r.length !== c.length) r = await translateBatch(ai, c, langName)
    if (!Array.isArray(r) || r.length !== c.length) throw new Error(`chunk length mismatch ${r?.length}/${c.length}`)
    out.push(...r)
  }
  return out
}

async function main() {
  if (!process.env.GEMINI_API_KEY) { console.error('FATAL: GEMINI_API_KEY not set'); process.exit(1) }
  if (!IN || !OUT_DIR || !KEYS.size) { console.error('usage: translate-json.mjs <in.json> <outDir> --keys a,b,c'); process.exit(1) }
  if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true })
  const en = JSON.parse(readFileSync(IN, 'utf8'))
  const { GoogleGenAI } = await import('@google/genai')
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })

  let ok = 0, fail = 0
  const CONC = Number(process.env.TRANSLATE_CONCURRENCY || 4)
  let idx = 0
  const worker = async () => {
    while (idx < LOCALES.length) {
      const loc = LOCALES[idx++]
      const outPath = `${OUT_DIR}/${loc}.json`
      if (!FORCE && existsSync(outPath)) { console.log(`  skip ${loc}`); continue }
      try {
        const clone = JSON.parse(JSON.stringify(en))
        const strings = [], setters = []
        collect(clone, strings, setters)
        const out = await translateAll(ai, strings, LANGS[loc])
        setters.forEach((set, i) => set(typeof out[i] === 'string' ? out[i] : strings[i]))
        writeFileSync(outPath, JSON.stringify(clone, null, 2), 'utf8')
        ok++; console.log(`  ✓ ${loc} (${strings.length} strings)`)
      } catch (e) { fail++; console.error(`  ✗ ${loc}: ${e?.message || e}`) }
    }
  }
  await Promise.all(Array.from({ length: Math.min(CONC, LOCALES.length) }, worker))
  console.log(`translate-json[${OUT_DIR.split(/[\\/]/).pop()}]: ${ok} ok, ${fail} failed`)
  if (fail) process.exitCode = 2
}
main().catch((e) => { console.error('fatal', e); process.exit(1) })
