#!/usr/bin/env node
// Offline editorial quality gate. Does not call a model or change review dates.
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { extractGuideJson, validateGuide, translationNeedsRefresh } from './lib/guide-quality.mjs'

const directory = new URL('../app/app/data/guides/', import.meta.url)
const today = new Date().toISOString().slice(0, 10)
const maxAgeDays = 90
let checked = 0
let failures = 0
const due = []
const staleLocales = []
const locales = ['es', 'pt', 'de', 'fr', 'ru', 'ko', 'ja', 'zh-hans', 'zh-hant', 'pl', 'it', 'uk']
for (const name of readdirSync(directory).filter((file) => file.endsWith('.ts') && !['types.ts', 'registry.ts', 'farmIndex.ts'].includes(file))) {
  const slug = name.slice(0, -3)
  try {
    const guide = extractGuideJson(readFileSync(new URL(name, directory), 'utf8'))
    const errors = validateGuide(guide, slug, today)
    if (!guide.sources?.length) errors.push(`${slug}: missing attribution sources`)
    if (errors.length) { errors.forEach((error) => console.error(error)); failures++ }
    const age = (Date.parse(today) - Date.parse(guide.updated || '')) / 86_400_000
    if (!Number.isFinite(age) || age >= maxAgeDays) due.push(`${slug} (${guide.updated || 'no review date'})`)
    const stale = locales.filter((locale) => {
      const path = new URL(`locales/${slug}.${locale}.json`, directory)
      return !existsSync(path) || translationNeedsRefresh(guide, JSON.parse(readFileSync(path, 'utf8')))
    })
    if (stale.length) staleLocales.push(`${slug}: ${stale.join(',')}`)
    checked++
  } catch (error) { console.error(`${slug}: ${error.message}`); failures++ }
}
if (!checked) { console.error(`No guides found in ${fileURLToPath(directory)}`); failures++ }
console.log(`guides:check: ${checked} guides checked, ${failures} failure(s).`)
if (due.length) console.warn(`Review queue (${maxAgeDays}+ days; dates unchanged): ${due.join(', ')}`)
if (staleLocales.length) console.warn(`Translation follow-up (missing or different review dates):\n  ${staleLocales.join('\n  ')}\nRun node scripts/translate-guides.mjs --slug <slug> to update these snapshots.`)
if (failures) process.exitCode = 1
