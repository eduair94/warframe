// Item image helpers. Drop tables, the star chart reward panel and the riven
// list carry STALE thumb hashes (warframe.market rotates them), so images 404.
// The freshly-synced catalog (Pinia items store) has the current thumb — cross
// reference by url_name (preferred) or item_name to show a working thumbnail.

import { modImageName } from '~/data/modImages'

const ASSET_BASE = 'https://warframe.market/static/assets/'
const WFCD_IMAGE_BASE = 'https://cdn.warframestat.us/img/'
const UNKNOWN_MARKET_THUMB = 'items/unknown.thumb.png'

// Generic veiled-riven card image — a stable warframe.market *build* asset (its
// hash doesn't rotate like per-item thumbs). Riven rows are all veiled cards, so
// they use this single image instead of a stale per-weapon thumb.
export const RIVEN_TEMPLATE_IMG =
  'https://warframe.market/static/build/resources/images/RivenTemplate.81f2d178b365147e808d.png'

// Neutral diamond-node placeholder (matches the Orokin look) for anything we
// can't resolve to a real thumbnail.
export const THUMB_PLACEHOLDER =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='44' height='44'%3E%3Crect width='44' height='44' rx='8' fill='%232a2a3d'/%3E%3Cpath d='M22 11 L31 22 L22 33 L13 22 Z' fill='none' stroke='%234fb3bf' stroke-width='2' opacity='0.75'/%3E%3C/svg%3E"

export interface ThumbLookup {
  urlName?: string
  itemName?: string
  /** the row's own (possibly stale) thumb path, used as a last resort */
  thumb?: string
}

export function useItemThumb() {
  const store = useItemsStore()

  /** Full, working thumbnail URL for an item, cross-referenced against the fresh catalog. */
  function itemThumb(opts: ThumbLookup): string {
    // warframe.market now sends a cross-origin resource policy that blocks its
    // item thumbnails when embedded. Prefer the stable WFCD card image for
    // every recognized mod, not only records carrying unknown.thumb.png.
    const modImage = opts.itemName && modImageName(opts.itemName)
    if (modImage) return WFCD_IMAGE_BASE + encodeURIComponent(modImage)

    const fresh =
      (opts.urlName && store.thumbByUrlName[opts.urlName]) ||
      (opts.itemName && store.thumbByName[opts.itemName]) ||
      opts.thumb
    if (fresh && fresh !== UNKNOWN_MARKET_THUMB) return ASSET_BASE + fresh

    return THUMB_PLACEHOLDER
  }

  return { itemThumb, RIVEN_TEMPLATE_IMG, THUMB_PLACEHOLDER }
}
