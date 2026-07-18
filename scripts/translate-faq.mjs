#!/usr/bin/env node
// Translate the /faq content (FAQS + FAQ_CATEGORIES) into every non-English locale
// with Gemini → app/app/data/faq.locales/<locale>.json ({ faqs, categories }).
// Same extract→translate-array→reinject pattern as translate-guides.mjs.
//
//   node scripts/translate-faq.mjs <en.json> [--locales es,fr] [--force]
// en.json = { faqs:[{q,a,cat}], categories:[{key,title,icon}] } (extract via tsx).
// Env: GEMINI_API_KEY, GEMINI_MODEL (default gemini-flash-latest).

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT_DIR = join(__dirname, '..', 'app', 'app', 'data', 'faq.locales')

const LANGS = {
  es: 'Spanish', pt: 'Brazilian Portuguese', de: 'German', fr: 'French', ru: 'Russian',
  ko: 'Korean', ja: 'Japanese', 'zh-hans': 'Simplified Chinese', 'zh-hant': 'Traditional Chinese',
  pl: 'Polish', it: 'Italian', uk: 'Ukrainian',
}
const argv = process.argv.slice(2)
const EN_PATH = argv.find((a) => !a.startsWith('--'))
const arg = (n) => { const i = argv.indexOf(n); return i >= 0 ? argv[i + 1] : undefined }
const FORCE = argv.includes('--force')
const ONLY = (arg('--locales') || '').split(',').map((s) => s.trim()).filter(Boolean)
const MODEL = process.env.GEMINI_MODEL || 'gemini-flash-latest'
const LOCALES = ONLY.length ? ONLY : Object.keys(LANGS)

function collect(data) {
  const strings = [], setters = []
  const add = (o, k) => { const v = o?.[k]; if (typeof v === 'string' && v.trim()) { strings.push(v); setters.push((s) => { o[k] = s }) } }
  for (const f of data.faqs || []) { add(f, 'q'); add(f, 'a') }
  for (const c of data.categories || []) add(c, 'title')
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
    `Translate each string in this JSON array from English to ${langName}. Context: a Warframe (video game) FAQ website.`,
    `- Keep Warframe game proper nouns in English (frame/weapon/item/node/faction names, Steel Path, Prime, Kuva, Eidolon, etc.).`,
    `- Preserve markdown links [text](/route): translate the visible text, keep the URL. Keep inline \`code\`, {placeholders}, numbers unchanged.`,
    `- "farm/farming" = grinding for loot (gaming sense), NOT agriculture.`,
    `- Return ONLY a JSON array of the SAME length and order. No commentary.`,
    ``, `Input:`, JSON.stringify(strings),
  ].join('\n')
  const res = await ai.models.generateContent({ model: MODEL, contents: prompt, config: { temperature: 0.3 } })
  return parseArray(res.text)
}

async function main() {
  if (!process.env.GEMINI_API_KEY) { console.error('FATAL: GEMINI_API_KEY not set'); process.exit(1) }
  if (!EN_PATH) { console.error('usage: translate-faq.mjs <en.json>'); process.exit(1) }
  if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true })
  const en = JSON.parse(readFileSync(EN_PATH, 'utf8'))
  const { GoogleGenAI } = await import('@google/genai')
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })

  let ok = 0, fail = 0
  for (const loc of LOCALES) {
    const outPath = join(OUT_DIR, `${loc}.json`)
    if (!FORCE && existsSync(outPath)) { console.log(`  skip ${loc} (exists)`); continue }
    try {
      const clone = JSON.parse(JSON.stringify(en))
      const { strings, setters } = collect(clone)
      let out = await translateBatch(ai, strings, LANGS[loc])
      if (!Array.isArray(out) || out.length !== strings.length) out = await translateBatch(ai, strings, LANGS[loc])
      if (!Array.isArray(out) || out.length !== strings.length) throw new Error(`length mismatch ${out?.length}/${strings.length}`)
      setters.forEach((set, i) => set(typeof out[i] === 'string' ? out[i] : strings[i]))
      writeFileSync(outPath, JSON.stringify(clone, null, 2), 'utf8')
      ok++; console.log(`  ✓ faq.${loc}`)
    } catch (e) { fail++; console.error(`  ✗ faq.${loc}: ${e?.message || e}`) }
  }
  console.log(`translate-faq: ${ok} ok, ${fail} failed`)
  if (fail) process.exit(2)
}
main().catch((e) => { console.error('fatal', e); process.exit(1) })
