#!/usr/bin/env node
// Export / import the translation GAPS of app/i18n/messages/*.ts as flat JSON.
//
//   node scripts/i18n-gaps.mjs export <outDir> <file.ts> [more.ts ...]
//   node scripts/i18n-gaps.mjs export <outDir> --all
//   node scripts/i18n-gaps.mjs import <inDir>
//
// This is the offline half of the translation pipeline. `tr-file.mjs` is the
// happy path (Gemini fills the gaps directly), but its free tier has a hard
// daily request cap, so when it is exhausted the same work has to be done by
// something else. `export` writes one `<namespace>.<locale>.json` per gap
// containing ONLY the missing keys and their English source; whatever produces
// the translations writes the same file back with the values replaced, and
// `import` merges them in.
//
// The merge is deliberately paranoid — anything that lost a {placeholder},
// gained a literal "@", or is not a non-empty string is dropped rather than
// merged, because those are exactly the inputs that turn the blocking
// `i18n:check` gate red. Run `node scripts/i18n-verify.mjs --all --fix`
// afterwards to backfill whatever was rejected with the English string.

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve, basename, relative } from 'node:path'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const MESSAGES_DIR = resolve(ROOT, 'app/i18n/messages')

const LOCALES = ['es', 'pt', 'de', 'fr', 'ru', 'ko', 'ja', 'zh-hans', 'zh-hant', 'pl', 'it', 'uk']
const ORDER = ['en', ...LOCALES]

const PLACEHOLDER = /\{([a-zA-Z_][a-zA-Z0-9_]*)\}/g
const phOf = (s) => [...String(s).matchAll(PLACEHOLDER)].map((m) => m[1]).sort().join(',')

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

function load(file) {
  const PATH = resolve(ROOT, file)
  const source = readFileSync(PATH, 'utf8')
  const start = source.indexOf('export default')
  if (start < 0) return null
  const header = source.slice(0, start).trimEnd()
  const literal = source.slice(start).replace(/^export\s+default\s*/, '').trim().replace(/;?\s*$/, '')
  try {
    return { PATH, header, tree: new Function(`return (${literal})`)() }
  } catch {
    return null
  }
}

function render(obj, indent) {
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

function write(file, header, tree) {
  const locales = ORDER.filter((l) => tree[l])
  const body = locales
    .map((l) => {
      const key = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(l) ? l : `'${l}'`
      return `  ${key}: {\n${render(tree[l], 4)}\n  },`
    })
    .join('\n')
  writeFileSync(file, `${header}\nexport default {\n${body}\n}\n`, 'utf8')
}

const [cmd, dir, ...rest] = process.argv.slice(2)
if (!cmd || !dir) {
  console.error('usage: i18n-gaps.mjs export <dir> <file.ts ...|--all>  |  i18n-gaps.mjs import <dir>')
  process.exit(1)
}
const DIR = resolve(process.cwd(), dir)

if (cmd === 'export') {
  const files = rest.includes('--all')
    ? readdirSync(MESSAGES_DIR)
        .filter((f) => f.endsWith('.ts'))
        .map((f) => relative(ROOT, resolve(MESSAGES_DIR, f)).replace(/\\/g, '/'))
    : rest
  if (!files.length) {
    console.error('nothing to export')
    process.exit(1)
  }
  mkdirSync(DIR, { recursive: true })
  let total = 0
  for (const file of files) {
    const loaded = load(file)
    if (!loaded || !loaded.tree.en) {
      console.log(`· ${file}: skipped (not a self-contained literal)`)
      continue
    }
    const ns = basename(file, '.ts')
    const enPaths = paths(loaded.tree.en)
    for (const loc of LOCALES) {
      const block = loaded.tree[loc] || {}
      const missing = enPaths.filter((p) => typeof get(block, p) !== 'string' || !get(block, p).trim())
      if (!missing.length) continue
      const payload = {}
      for (const p of missing) payload[p] = get(loaded.tree.en, p)
      writeFileSync(resolve(DIR, `${ns}.${loc}.json`), JSON.stringify(payload, null, 2), 'utf8')
      total += missing.length
      console.log(`  ${ns}.${loc}.json — ${missing.length} key(s)`)
    }
  }
  console.log(`exported ${total} gap string(s) to ${DIR}`)
  process.exit(0)
}

if (cmd === 'import') {
  if (!existsSync(DIR)) {
    console.error(`no such dir: ${DIR}`)
    process.exit(1)
  }
  const jsons = readdirSync(DIR).filter((f) => f.endsWith('.json'))
  // Group by namespace so each source file is parsed and written exactly once.
  const byNs = new Map()
  for (const f of jsons) {
    const m = f.match(/^(.+)\.([a-z]{2}(?:-[a-z]+)?)\.json$/)
    if (!m) continue
    const [, ns, loc] = m
    if (!LOCALES.includes(loc)) continue
    if (!byNs.has(ns)) byNs.set(ns, [])
    byNs.get(ns).push({ loc, file: resolve(DIR, f) })
  }

  let merged = 0
  let rejected = 0
  for (const [ns, entries] of byNs) {
    const rel = `app/i18n/messages/${ns}.ts`
    const loaded = load(rel)
    if (!loaded || !loaded.tree.en) {
      console.log(`· ${rel}: skipped`)
      continue
    }
    for (const { loc, file } of entries) {
      let data
      try {
        data = JSON.parse(readFileSync(file, 'utf8'))
      } catch (e) {
        console.error(`  ✗ ${ns}.${loc}: unparseable JSON — ${e.message}`)
        continue
      }
      if (!loaded.tree[loc]) loaded.tree[loc] = {}
      let ok = 0
      let bad = 0
      for (const [p, value] of Object.entries(data)) {
        const en = get(loaded.tree.en, p)
        if (typeof en !== 'string') {
          bad++
          continue
        }
        const usable =
          typeof value === 'string' &&
          value.trim() &&
          !value.includes('@') &&
          phOf(value) === phOf(en)
        if (!usable) {
          bad++
          continue
        }
        set(loaded.tree[loc], p, value.trim())
        ok++
      }
      merged += ok
      rejected += bad
      console.log(`  ${ns}.${loc}: merged ${ok}${bad ? `, rejected ${bad}` : ''}`)
    }
    write(loaded.PATH, loaded.header, loaded.tree)
  }
  console.log(`imported ${merged} string(s)${rejected ? `, rejected ${rejected}` : ''}`)
  console.log('now run: node scripts/i18n-verify.mjs --all --fix')
  process.exit(0)
}

console.error(`unknown command: ${cmd}`)
process.exit(1)
