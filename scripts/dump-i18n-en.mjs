#!/usr/bin/env node
// Extract the inline-TS content datasets (creators, FAQ, farm index) to flat JSON
// so the generic Gemini translators can localize them. Parses the .ts as TEXT and
// evaluates the exported literal (same philosophy as translate-guides.mjs — no TS
// import, so it works regardless of the app's ESM package scope). English stays
// canonical in the .ts files; this only produces the translation INPUT.
//   node scripts/dump-i18n-en.mjs   ->  scripts/.i18n-en/{creators,faq,farmIndex}.json
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DATA = join(__dirname, '..', 'app', 'app', 'data')
const OUT = join(__dirname, '.i18n-en')

// Find the balanced [..]/{..} literal that follows `<marker> ... =`, skipping
// strings and //, /* */ comments so brackets inside them don't fool the scanner.
function extractLiteral(src, marker) {
  const mi = src.indexOf(marker)
  if (mi < 0) throw new Error(`marker not found: ${marker}`)
  const eq = src.indexOf('=', mi + marker.length)
  if (eq < 0) throw new Error(`no '=' after ${marker}`)
  let i = eq + 1
  while (i < src.length && src[i] !== '[' && src[i] !== '{') i++
  const open = src[i]
  const close = open === '[' ? ']' : '}'
  const start = i
  let depth = 0
  let str = null
  let inLine = false
  let inBlock = false
  for (; i < src.length; i++) {
    const c = src[i]
    const n = src[i + 1]
    if (inLine) { if (c === '\n') inLine = false; continue }
    if (inBlock) { if (c === '*' && n === '/') { inBlock = false; i++ } continue }
    if (str) { if (c === '\\') { i++; continue } if (c === str) str = null; continue }
    if (c === '/' && n === '/') { inLine = true; i++; continue }
    if (c === '/' && n === '*') { inBlock = true; i++; continue }
    if (c === '"' || c === "'" || c === '`') { str = c; continue }
    if (c === open) depth++
    else if (c === close) { depth--; if (depth === 0) return src.slice(start, i + 1) }
  }
  throw new Error(`unbalanced literal for ${marker}`)
}

function evalLiteral(src, marker) {
  const lit = extractLiteral(src, marker)
  // eslint-disable-next-line no-new-func
  return new Function(`return (${lit})`)()
}

mkdirSync(OUT, { recursive: true })

const creatorsSrc = readFileSync(join(DATA, 'creators.ts'), 'utf8')
const CREATORS = evalLiteral(creatorsSrc, 'export const CREATORS')

const faqSrc = readFileSync(join(DATA, 'faq.ts'), 'utf8')
const FAQS = evalLiteral(faqSrc, 'export const FAQS')
const FAQ_CATEGORIES = evalLiteral(faqSrc, 'export const FAQ_CATEGORIES')

const farmSrc = readFileSync(join(DATA, 'guides', 'farmIndex.ts'), 'utf8')
const FARM_TARGETS = evalLiteral(farmSrc, 'export const FARM_TARGETS')
const FARM_KIND_LABEL = evalLiteral(farmSrc, 'export const FARM_KIND_LABEL')

writeFileSync(join(OUT, 'creators.json'), JSON.stringify(CREATORS, null, 2), 'utf8')
writeFileSync(
  join(OUT, 'faq.json'),
  JSON.stringify(
    {
      faqs: FAQS.map((f) => ({ q: f.q, a: f.a, cat: f.cat })),
      categories: FAQ_CATEGORIES.map((c) => ({ key: c.key, title: c.title, icon: c.icon })),
    },
    null,
    2,
  ),
  'utf8',
)
writeFileSync(
  join(OUT, 'farmIndex.json'),
  JSON.stringify({ targets: FARM_TARGETS, kinds: FARM_KIND_LABEL }, null, 2),
  'utf8',
)

console.log(`dumped: creators=${CREATORS.length} faqs=${FAQS.length} farmTargets=${FARM_TARGETS.length} -> ${OUT}`)
