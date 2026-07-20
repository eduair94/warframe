/**
 * Compact wire format for the item catalogue.
 *
 * WHY THIS EXISTS
 * The catalogue is ~3 800 items and the API returns it as an array of nested
 * objects — about 1.9 MB of JSON, of which roughly two thirds is the same
 * twenty key names repeated 3 800 times. app.vue fetches it during SSR, so
 * Nuxt serialised all of it into `__NUXT_DATA__`: every HTML document the site
 * served was 2.3 MB, and the browser had to download, parse and revive it
 * before the page could become interactive. Lighthouse measured LCP at 10 s and
 * ~2 s of blocking time on that alone.
 *
 * Packing it into positional tuples with a tag dictionary removes every
 * repeated key and cuts the payload by ~65 % (1.9 MB -> 0.65 MB) with NO loss
 * of precision: numbers are copied verbatim, not rounded. Timestamps travel as
 * epoch milliseconds and are revived as ISO strings, and the constant
 * `items/images/en/thumbs/…128x128.png` wrapper around every thumbnail path is
 * stored as a two-bit flag instead of 35 repeated characters.
 *
 * Both SSR and the client call `unpackCatalogue()` on the same packed data, so
 * the hydrated store is identical to the rendered one — no hydration mismatch,
 * and no second network request.
 *
 * ONLY the fields the app reads are carried (see LAST_COMPLETED_FIELDS). If a
 * page starts needing another `last_completed` field, add it to that list —
 * otherwise it will be `undefined` after unpacking even though the API sends it.
 */
import type { WarframeItem } from '~/stores/items'

/** Constant wrapper around every warframe.market thumbnail path. */
const THUMB_PREFIX = 'items/images/en/thumbs/'
const THUMB_SUFFIX = '.128x128.png'
const THUMB_HAS_PREFIX = 1
const THUMB_HAS_SUFFIX = 2

/**
 * `last_completed` keys carried over the wire, in tuple order.
 *
 * The API also sends wa_price, donch_top, donch_bot, id, mod_rank, subtype,
 * cyan_stars and amber_stars — none of which any page reads, and which together
 * cost ~130 KB per document.
 */
const LAST_COMPLETED_FIELDS = [
  'datetime',
  'volume',
  'min_price',
  'max_price',
  'open_price',
  'closed_price',
  'avg_price',
  'median',
  'moving_avg',
] as const

type PackedLastCompleted = Array<number | null> | 0
type PackedRow = [
  string, // 0  item_name
  string, // 1  url_name
  string, // 2  thumb (wrapper stripped, see flags)
  number, // 3  thumb flags
  number[], // 4  tag ids into `tags`
  0 | 1, // 5  set
  -1 | 0 | 1, // 6  vaulted (-1 = absent)
  number | null, // 7  ducats (null = absent)
  number, // 8  priceUpdate, epoch ms
  number, // 9  market.buy
  number, // 10 market.sell
  number, // 11 market.diff
  number, // 12 market.buyAvg
  number, // 13 market.sellAvg
  number, // 14 market.volume
  number, // 15 market.avg_price
  PackedLastCompleted, // 16
]

export interface PackedCatalogue {
  /** Format version — bump if the tuple layout ever changes. */
  v: 1
  /** Tag dictionary; rows reference tags by index. */
  tags: string[]
  rows: PackedRow[]
}

export function packCatalogue(items: WarframeItem[]): PackedCatalogue {
  const tags: string[] = []
  const tagIds = new Map<string, number>()
  const tagId = (tag: string): number => {
    let id = tagIds.get(tag)
    if (id === undefined) {
      id = tags.push(tag) - 1
      tagIds.set(tag, id)
    }
    return id
  }

  const rows = items.map((item): PackedRow => {
    const market = (item.market ?? {}) as Record<string, any>
    const last = market.last_completed as Record<string, any> | undefined

    let thumb = (item.thumb as string) ?? ''
    let thumbFlags = 0
    if (thumb.startsWith(THUMB_PREFIX)) {
      thumb = thumb.slice(THUMB_PREFIX.length)
      thumbFlags |= THUMB_HAS_PREFIX
    }
    if (thumb.endsWith(THUMB_SUFFIX)) {
      thumb = thumb.slice(0, -THUMB_SUFFIX.length)
      thumbFlags |= THUMB_HAS_SUFFIX
    }

    return [
      item.item_name,
      (item.url_name as string) ?? '',
      thumb,
      thumbFlags,
      (item.tags ?? []).map(tagId),
      item.set ? 1 : 0,
      item.vaulted === undefined ? -1 : item.vaulted ? 1 : 0,
      (item.ducats as number | undefined) ?? null,
      toEpoch(item.priceUpdate as string | undefined),
      market.buy,
      market.sell,
      market.diff,
      market.buyAvg,
      market.sellAvg,
      market.volume,
      market.avg_price,
      last
        ? LAST_COMPLETED_FIELDS.map((field) =>
            field === 'datetime' ? toEpoch(last.datetime) : (last[field] ?? null)
          )
        : 0,
    ]
  })

  return { v: 1, tags, rows }
}

export function unpackCatalogue(packed: PackedCatalogue | null | undefined): WarframeItem[] {
  if (!packed?.rows) return []
  const { tags } = packed

  return packed.rows.map((row) => {
    const [
      itemName, urlName, thumb, thumbFlags, tagIds, set, vaulted, ducats,
      priceUpdate, buy, sell, diff, buyAvg, sellAvg, volume, avgPrice, last,
    ] = row

    const market: Record<string, unknown> = {
      buy, sell, diff, buyAvg, sellAvg, volume, avg_price: avgPrice,
    }
    if (last !== 0) {
      const lastCompleted: Record<string, unknown> = {}
      LAST_COMPLETED_FIELDS.forEach((field, i) => {
        const value = last[i]
        if (field === 'datetime') lastCompleted.datetime = fromEpoch(value)
        else if (value !== null) lastCompleted[field] = value
      })
      market.last_completed = lastCompleted
    }

    const item: WarframeItem = {
      item_name: itemName,
      url_name: urlName,
      thumb:
        (thumbFlags & THUMB_HAS_PREFIX ? THUMB_PREFIX : '') +
        thumb +
        (thumbFlags & THUMB_HAS_SUFFIX ? THUMB_SUFFIX : ''),
      tags: tagIds.map((id) => tags[id]!),
      set: set === 1,
      priceUpdate: fromEpoch(priceUpdate),
      market,
    }
    // Absent (not false / not zero) for most items — reproduce that exactly, so
    // `'vaulted' in item` and `item.ducats === undefined` behave as before.
    if (vaulted !== -1) item.vaulted = vaulted === 1
    if (ducats !== null) item.ducats = ducats

    return item
  })
}

/**
 * Route names (locale suffix stripped) that render NO market data.
 *
 * The catalogue is fetched once in app.vue and, packed, still adds ~250 KB to
 * the page payload plus the cost of reviving ~3 800 items during hydration.
 * Roughly half the site — the written guides, the FAQ, the creators list, the
 * community-tools directory, the circuit rotation — never touches the items
 * store, so that whole cost is pure waste there.
 *
 * This is an OPT-OUT list on purpose: a route that isn't listed keeps the
 * catalogue, so a new page that needs it works without anyone remembering to
 * register it. The cost of being wrong is only that a listed page renders
 * empty, which is why every entry here was checked against the store, the
 * thumb/drop composables and the components that use them.
 */
const CATALOGUE_FREE_ROUTES = new Set([
  'faq',
  'creators',
  'circuit',
  'tools',
  'tools-best',
  'tools-slug',
])

/** True for `/guides`, `/guides/anything`, and their localized variants. */
const CATALOGUE_FREE_PREFIXES = ['guides']

export function routeNeedsCatalogue(routeName: unknown): boolean {
  if (typeof routeName !== 'string') return true
  // @nuxtjs/i18n suffixes every route name with `___<locale>`.
  const base = routeName.split('___')[0] ?? ''
  if (CATALOGUE_FREE_ROUTES.has(base)) return false
  return !CATALOGUE_FREE_PREFIXES.some((p) => base === p || base.startsWith(`${p}-`))
}

function toEpoch(value: string | undefined): number {
  if (!value) return 0
  const ms = Date.parse(value)
  return Number.isNaN(ms) ? 0 : ms
}

function fromEpoch(ms: number | null): string | undefined {
  return ms ? new Date(ms).toISOString() : undefined
}
