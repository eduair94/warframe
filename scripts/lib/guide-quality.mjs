import ts from 'typescript'
import { isDeepStrictEqual } from 'node:util'

export const ALLOWED_BLOCK_TYPES = new Set(['p', 'list', 'steps', 'tip', 'warn', 'info', 'table', 'video', 'links', 'kv', 'quote'])
const hasText = (value) => typeof value === 'string' && value.trim().length > 0
const videoId = (value) => typeof value === 'string' && /^[A-Za-z0-9_-]{11}$/.test(value)

// Guides are data, but some use ordinary TypeScript object syntax rather than
// JSON. Read literals through the TS parser; never execute generated content.
export function extractGuideJson(source) {
  const file = ts.createSourceFile('guide.ts', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS)
  if (file.parseDiagnostics.length) throw new Error('guide has invalid TypeScript syntax')
  const declaration = file.statements.flatMap((statement) => ts.isVariableStatement(statement)
    ? [...statement.declarationList.declarations] : [])
    .find((node) => ts.isIdentifier(node.name) && node.name.text === 'guide')
  if (!declaration?.initializer) throw new Error('could not locate the guide data object')

  const read = (node) => {
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text
    if (ts.isNumericLiteral(node)) return Number(node.text)
    if (node.kind === ts.SyntaxKind.TrueKeyword) return true
    if (node.kind === ts.SyntaxKind.FalseKeyword) return false
    if (node.kind === ts.SyntaxKind.NullKeyword) return null
    if (ts.isArrayLiteralExpression(node)) return node.elements.map(read)
    if (ts.isObjectLiteralExpression(node)) {
      return Object.fromEntries(node.properties.map((property) => {
        if (!ts.isPropertyAssignment(property)
          || !(ts.isIdentifier(property.name) || ts.isStringLiteral(property.name))) {
          throw new Error('guide must contain literal properties only')
        }
        return [property.name.text, read(property.initializer)]
      }))
    }
    throw new Error('guide must contain data literals only')
  }
  return read(declaration.initializer)
}

export function validateGuide(guide, slug, today = new Date().toISOString().slice(0, 10)) {
  const errors = []
  const fail = (message) => errors.push(`${slug}: ${message}`)
  if (!guide || typeof guide !== 'object' || Array.isArray(guide)) return [`${slug}: not an object`]
  if (guide.slug !== slug) fail(`slug changed to "${guide.slug}"`)
  for (const key of ['eyebrow', 'title', 'lede', 'category']) if (!hasText(guide[key])) fail(`missing ${key}`)
  if (!['start', 'farming', 'systems', 'endgame', 'reference'].includes(guide.category)) fail('unknown category')
  if (guide.updated !== undefined) {
    const date = new Date(guide.updated)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(guide.updated) || !Number.isFinite(date.getTime())
      || date.toISOString().slice(0, 10) !== guide.updated || guide.updated > today) fail('updated must be a real, non-future ISO date')
  }
  const array = (value, label, required = false) => {
    if (value === undefined && !required) return []
    if (!Array.isArray(value) || (required && value.length === 0)) { fail(`${label} must be ${required ? 'a non-empty' : 'an'} array`); return [] }
    return value
  }
  const checkVideo = (video, label) => {
    if (!videoId(video?.id) || !hasText(video?.title) || !hasText(video?.channel)) fail(`${label} malformed video`)
  }
  const checkLink = (link, label) => {
    if (!hasText(link?.label)) fail(`${label} missing link label`)
    if (link?.to !== undefined && (typeof link.to !== 'string' || !/^\/(?!\/)/.test(link.to))) fail(`${label} invalid internal route`)
    if (link?.href !== undefined) {
      try {
        const internal = typeof link.href === 'string' && /^\/(?!\/)/.test(link.href)
        if (!(internal && label !== 'sources') && !['http:', 'https:'].includes(new URL(link.href).protocol)) throw new Error()
      }
      catch { fail(`${label} invalid source URL`) }
    }
    if (!link?.to && !link?.href) fail(`${label} missing link destination`)
  }
  const ids = new Set()
  for (const [i, section] of array(guide.sections, 'sections', true).entries()) {
    const label = `section ${i}`
    if (!hasText(section?.id) || !hasText(section?.title)) fail(`${label} missing id/title`)
    if (ids.has(section?.id)) fail(`${label} duplicate anchor ${section?.id}`)
    ids.add(section?.id)
    for (const [j, block] of array(section?.blocks, `${label} blocks`, true).entries()) {
      const at = `${label} block ${j}`
      if (!ALLOWED_BLOCK_TYPES.has(block?.type)) { fail(`${at} bad block type`); continue }
      if (['p', 'tip', 'warn', 'info', 'quote'].includes(block.type) && !hasText(block.text)) fail(`${at} missing text`)
      if (block.type === 'list') for (const item of array(block.items, `${at} items`, true)) if (!hasText(item)) fail(`${at} invalid list item`)
      if (block.type === 'steps') for (const step of array(block.steps, `${at} steps`, true)) if (!hasText(step?.h) || !hasText(step?.p)) fail(`${at} malformed step`)
      if (block.type === 'kv') for (const pair of array(block.kv, `${at} kv`, true)) if (!hasText(pair?.k) || !hasText(pair?.v)) fail(`${at} malformed key/value`)
      if (block.type === 'video') checkVideo(block.video, at)
      if (block.type === 'links') for (const link of array(block.links, `${at} links`, true)) checkLink(link, at)
      if (block.type === 'table') {
        const columns = array(block.table?.columns, `${at} columns`, true)
        // Comparison tables can intentionally leave the row-label corner blank.
        if (columns.some((column) => typeof column !== 'string')) fail(`${at} invalid table heading`)
        for (const row of array(block.table?.rows, `${at} rows`, true)) {
          if (!Array.isArray(row) || row.length !== columns.length || row.some((cell) => !['string', 'number'].includes(typeof cell))) fail(`${at} malformed table row`)
        }
      }
    }
  }
  for (const video of array(guide.videos, 'videos')) checkVideo(video, 'grid')
  for (const faq of array(guide.faqs, 'faqs')) if (!hasText(faq?.q) || !hasText(faq?.a)) fail('malformed FAQ')
  for (const key of ['sources', 'related']) for (const link of array(guide[key], key)) checkLink(link, key)
  return errors
}

export async function oembedOk(id, fetcher = fetch) {
  if (!videoId(id)) return false
  const url = `https://www.youtube.com/oembed?url=${encodeURIComponent(`https://www.youtube.com/watch?v=${id}`)}&format=json`
  let response
  try { response = await fetcher(url, { redirect: 'follow', signal: AbortSignal.timeout(15_000) }) }
  catch (error) { throw new Error(`video ${id}: verification unavailable (${error.message}); retaining existing content`) }
  // Only a definite absence proves an old video should be removed. Rate limits,
  // bot blocks, timeouts and provider failures must never erase valid content.
  if ([404, 410].includes(response.status)) return false
  if (!response.ok) throw new Error(`video ${id}: verification returned HTTP ${response.status}; retaining existing content`)
  let data
  try { data = await response.json() }
  catch { throw new Error(`video ${id}: invalid verification response; retaining existing content`) }
  if (!hasText(data?.title)) throw new Error(`video ${id}: incomplete verification response; retaining existing content`)
  return true
}

export async function verifyVideos(guide, check = oembedOk) {
  // Work on a copy so a failed lookup never leaves a partially edited object.
  const next = structuredClone(guide)
  const dropped = []
  const seen = new Map()
  const keep = async (id) => {
    if (!seen.has(id)) seen.set(id, await check(id))
    if (!seen.get(id)) dropped.push(id)
    return seen.get(id)
  }
  if (Array.isArray(next.videos)) {
    const kept = []
    for (const video of next.videos) if (await keep(video.id)) kept.push(video)
    next.videos = kept
  }
  for (const section of next.sections || []) {
    const kept = []
    for (const block of section.blocks || []) if (block.type !== 'video' || await keep(block.video?.id)) kept.push(block)
    section.blocks = kept
  }
  return { guide: next, dropped: [...new Set(dropped)] }
}

export function preserveUnchangedReviewDate(current, next) {
  const content = ({ updated, ...guide }) => guide
  if (isDeepStrictEqual(content(current), content(next))) return structuredClone(current)
  return next
}

export function hasSearchGrounding(response) {
  return response?.candidates?.some(({ groundingMetadata: metadata }) =>
    Array.isArray(metadata?.webSearchQueries) && metadata.webSearchQueries.length > 0
    && metadata.groundingChunks?.some((chunk) => /^https?:\/\//.test(chunk.web?.uri || ''))
  ) || false
}

// Locale guides are complete snapshots. An English correction cannot become
// visible in them until they are translated again from that reviewed version.
export function translationNeedsRefresh(current, localized) {
  return !localized || localized.slug !== current.slug || localized.updated !== current.updated
}
