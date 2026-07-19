import { computed } from 'vue'
import {
  trueRarity,
  isVaulted,
  isResurgence,
  RELIC_CHANCES,
  type RelicRow,
  type RelicReward,
} from './useRelicValue'

/**
 * Shared "which relics drop a Forma Blueprint" data, derived from the same
 * `/relics_ev` payload the relic-farming / relics-value pages use. Powers the
 * /forma-relics board AND the "Forma" preset on the 2D & 3D star charts.
 *
 * Forma Blueprint is a Common (1×) or Uncommon (2×) relic reward — never the
 * Rare slot — so a relic "drops Forma" iff one of its rewards is a Forma item.
 * The true rarity is taken from the WFCD `chance` (via `trueRarity`), not the
 * mislabeled rarity string, so a 25.33% Common Forma is never read as Uncommon.
 */

const FORMA_RE = /forma/i

/**
 * Canonical relic key that matches BOTH sides of the join:
 *  - `/relics_ev` relic display names ("Lith C7")
 *  - `/drops/map` node reward item names ("Lith C7 Relic" / "…Intact Relic")
 * → "lith c7". Lets a star-chart node reward be tested against the Forma set.
 */
export function relicKey(name: string): string {
  return String(name || '')
    .toLowerCase()
    .replace(/\brelic\b/g, '')
    .replace(/\b(intact|exceptional|flawless|radiant)\b/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export type FormaStatus = 'dropping' | 'vaulted' | 'resurgence'

export interface FormaRelic {
  /** The full relic EV row (rewards, market, thumb, flags). */
  row: RelicRow
  /** The relic's Forma reward line. */
  reward: RelicReward
  /** Reliable rarity bucket of the Forma reward: 'Common' | 'Uncommon'. */
  rarity: string
  /** Forma Blueprints per crack: 2 for an Uncommon-slot relic, else 1. */
  count: number
  /** Intact per-slot chance for the Forma reward (25.33 Common / 11 Uncommon). */
  intactChance: number
  /** Normalized key for map-node matching (see `relicKey`). */
  key: string
  /** Farmability: currently dropping, vaulted, or Prime Resurgence (Varzia). */
  status: FormaStatus
}

export function useFormaRelics() {
  const base = useApiBase()

  // Shared SSR fetch — the 'forma-relics-ev' key dedupes with any sibling call
  // on the same page (distinct from relic-farming's 'relic-farming' key).
  const { data, error } = useAsyncData('forma-relics-ev', () =>
    $fetch<{ relics: RelicRow[] }>(`${base}/relics_ev`),
  )
  const loadError = computed(() => !!error.value)
  const rows = computed<RelicRow[]>(() => data.value?.relics ?? [])

  /** Every relic whose reward pool contains a Forma Blueprint. */
  const formaRelics = computed<FormaRelic[]>(() => {
    const out: FormaRelic[] = []
    for (const row of rows.value) {
      const reward = (row.rewards || []).find((r) => FORMA_RE.test(r.item_name || ''))
      if (!reward) continue
      const rarity = trueRarity(reward)
      const status: FormaStatus = isResurgence(row)
        ? 'resurgence'
        : isVaulted(row)
          ? 'vaulted'
          : 'dropping'
      out.push({
        row,
        reward,
        rarity,
        count: rarity === 'Uncommon' ? 2 : 1,
        intactChance: (RELIC_CHANCES.Intact as Record<string, number>)[rarity] || 0,
        key: relicKey(row.relicName),
        status,
      })
    }
    return out
  })

  /** Keys of Forma relics that CURRENTLY drop from a fissure (farmable now). */
  const formaKeysDropping = computed<Set<string>>(
    () => new Set(formaRelics.value.filter((f) => f.status === 'dropping').map((f) => f.key)),
  )
  /** Keys of every Forma relic, vaulted included. */
  const formaKeysAll = computed<Set<string>>(
    () => new Set(formaRelics.value.map((f) => f.key)),
  )

  /**
   * Does a drop-map reward item name correspond to a Forma relic? Defaults to
   * the currently-dropping set (the "where can I farm Forma right now" answer);
   * pass includeVaulted to match any Forma relic.
   */
  function rewardIsForma(itemName: string, opts: { includeVaulted?: boolean } = {}): boolean {
    const keys = opts.includeVaulted ? formaKeysAll.value : formaKeysDropping.value
    return keys.size > 0 && keys.has(relicKey(itemName))
  }

  return {
    loadError,
    formaRelics,
    formaKeysDropping,
    formaKeysAll,
    rewardIsForma,
    relicKey,
  }
}
