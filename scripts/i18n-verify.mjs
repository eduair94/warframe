#!/usr/bin/env node
// Structural check + repair for an app/i18n/messages/*.ts namespace file.
//
//   node scripts/i18n-verify.mjs app/i18n/messages/vault.ts            # report only
//   node scripts/i18n-verify.mjs app/i18n/messages/vault.ts --fix      # repair in place
//   node scripts/i18n-verify.mjs --all [--fix]
//
// Why this exists alongside tr-file.mjs: translations do not always arrive from
// Gemini (free-tier quota, outages) — sometimes a locale block is written by
// hand or by an agent. Whatever the source, the SAME four things break the
// production build or the UI, and this checks all of them against the English
// block, which is the source of truth:
//
//   1. MISSING key   -> t() falls back to English at runtime (survivable) but the
//                       file is silently incomplete; --fix inserts the English string.
//   2. EXTRA key     -> a typo'd path that no component reads; --fix drops it.
//   3. PLACEHOLDER drift -> "{n}" lost or renamed in translation, so the number
//                       never appears; --fix falls back to the English string.
//   4. FORBIDDEN char -> a literal "@" (vue-i18n's linked-message marker) or a
//                       stray "{"/"}" outside a placeholder. This one HARD-FAILS
//                       the blocking i18n:check gate; --fix falls back to English.
//
// Exit code 1 when problems remain (i.e. without --fix, or if --fix could not
// resolve something), so it can be used as a pre-commit / CI guard.

import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve, relative } from 'node:path'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const MESSAGES_DIR = resolve(ROOT, 'app/i18n/messages')

// Must stay in sync with nuxt.config LOCALES.
const LOCALES = ['es', 'pt', 'de', 'fr', 'ru', 'ko', 'ja', 'zh-hans', 'zh-hant', 'pl', 'it', 'uk']

const argv = process.argv.slice(2)
const FIX = argv.includes('--fix')
const ALL = argv.includes('--all')
const FILES = ALL
  ? readdirSync(MESSAGES_DIR)
      .filter((f) => f.endsWith('.ts'))
      .map((f) => relative(ROOT, resolve(MESSAGES_DIR, f)).replace(/\\/g, '/'))
  : argv.filter((a) => !a.startsWith('--'))

if (!FILES.length) {
  console.error('usage: i18n-verify.mjs <app/i18n/messages/NAME.ts | --all> [--fix]')
  process.exit(1)
}

const PLACEHOLDER = /\{([a-zA-Z_][a-zA-Z0-9_]*)\}/g
const phOf = (s) => [...String(s).matchAll(PLACEHOLDER)].map((m) => m[1]).sort().join(',')
/** Any brace that is not part of a well-formed {placeholder}. */
const strayBrace = (s) => String(s).replace(PLACEHOLDER, '').includes('{') || String(s).replace(PLACEHOLDER, '').includes('}')

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
function del(obj, p) {
  const keys = p.split('.')
  let node = obj
  for (const k of keys.slice(0, -1)) {
    if (!node[k] || typeof node[k] !== 'object') return
    node = node[k]
  }
  delete node[keys[keys.length - 1]]
}

/** Emit the same shape tr-file.mjs writes, so the two are interchangeable. */
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

const ORDER = ['en', ...LOCALES]
let anyProblem = false

for (const file of FILES) {
  const PATH = resolve(ROOT, file)
  if (!existsSync(PATH)) {
    console.error(`✗ ${file}: no such file`)
    anyProblem = true
    continue
  }
  const source = readFileSync(PATH, 'utf8')
  const start = source.indexOf('export default')
  if (start < 0) {
    console.error(`✗ ${file}: no \`export default\` object literal`)
    anyProblem = true
    continue
  }
  const header = source.slice(0, start).trimEnd()
  const literal = source.slice(start).replace(/^export\s+default\s*/, '').trim().replace(/;?\s*$/, '')

  let tree
  try {
    tree = new Function(`return (${literal})`)()
  } catch (e) {
    // The `const en = {…}; export default { en, es: en }` style is legal but not
    // evaluable in isolation; that shape is English-for-every-locale by design.
    console.log(`· ${file}: skipped (object literal is not self-contained)`)
    continue
  }
  if (!tree.en) {
    console.error(`✗ ${file}: no \`en\` block`)
    anyProblem = true
    continue
  }

  const enPaths = paths(tree.en)
  const problems = []
  let repaired = 0

  for (const loc of LOCALES) {
    const block = tree[loc]
    if (!block) {
      problems.push(`${loc}: whole locale block missing (${enPaths.length} keys)`)
      if (FIX) {
        tree[loc] = {}
        for (const p of enPaths) set(tree[loc], p, get(tree.en, p))
        repaired += enPaths.length
      }
      continue
    }
    const locPaths = paths(block)

    for (const p of enPaths) {
      const en = get(tree.en, p)
      const v = get(block, p)
      if (typeof v !== 'string' || !v.trim()) {
        problems.push(`${loc}: missing "${p}"`)
        if (FIX) {
          set(block, p, en)
          repaired++
        }
        continue
      }
      if (v.includes('@') && !String(en).includes('@')) {
        problems.push(`${loc}: literal "@" in "${p}" (breaks the build gate)`)
        if (FIX) {
          set(block, p, en)
          repaired++
        }
        continue
      }
      if (strayBrace(v) && !strayBrace(String(en))) {
        problems.push(`${loc}: stray brace in "${p}"`)
        if (FIX) {
          set(block, p, en)
          repaired++
        }
        continue
      }
      if (phOf(v) !== phOf(en)) {
        problems.push(`${loc}: placeholder drift in "${p}" — expected {${phOf(en) || '-'}}, got {${phOf(v) || '-'}}`)
        if (FIX) {
          set(block, p, en)
          repaired++
        }
      }
    }

    for (const p of locPaths) {
      if (!enPaths.includes(p)) {
        problems.push(`${loc}: extra key "${p}" (no English source)`)
        if (FIX) {
          del(block, p)
          repaired++
        }
      }
    }
  }

  if (!problems.length) {
    console.log(`✓ ${file}: ${enPaths.length} keys x ${LOCALES.length} locales — clean`)
    continue
  }

  const shown = problems.slice(0, 25)
  console.log(`${FIX ? '~' : '✗'} ${file}: ${problems.length} problem(s)`)
  for (const p of shown) console.log(`    ${p}`)
  if (problems.length > shown.length) console.log(`    … (${problems.length - shown.length} more)`)

  if (FIX) {
    const locales = ORDER.filter((l) => tree[l])
    const body = locales
      .map((l) => {
        const key = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(l) ? l : `'${l}'`
        return `  ${key}: {\n${render(tree[l], 4)}\n  },`
      })
      .join('\n')
    writeFileSync(PATH, `${header}\nexport default {\n${body}\n}\n`, 'utf8')
    console.log(`    -> repaired ${repaired} entr${repaired === 1 ? 'y' : 'ies'} (English fallback where translation was unusable)`)
  } else {
    anyProblem = true
  }
}

if (anyProblem) process.exit(1)
