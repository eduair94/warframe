import { computed, ref } from 'vue'
import { VOL_K } from './useRelicValue'

/**
 * Shared star-chart drop-map data for the 2D (/star-chart) and 3D
 * (/star-chart-3d) views.
 *
 * Fetches `GET {apiURL}/drops/map` and re-scores every mission's plat/drop the
 * same way the 2D chart does: each reward's 48h average sell price (falling
 * back to the live ask) discounted by its 48h trade volume — vol/(vol+VOL_K) —
 * so an overpriced, zero-volume listing can't inflate a mission's worth. The
 * market join happens client-side against the Pinia items store (populated
 * app-wide by the default layout) via utils/marketLookup.ts, mirroring the
 * backend's name-matching rules.
 */

/** A single mission reward row (drop-table entry joined with market price). */
export interface DropReward {
  itemName: string
  thumb?: string
  url_name?: string
  chance: number
  price: number
  rarity: string
  tradeable?: boolean
}

export interface DropRotation {
  rotation?: string
  value: number
  rewards: DropReward[]
}

export interface DropNode {
  location: string
  gameMode: string
  isEvent?: boolean
  value: number
  rotations: DropRotation[]
}

export interface DropPlanet {
  planet: string
  value: number
  nodeCount: number
  nodes: DropNode[]
  bestNode: { location: string; gameMode: string; value: number } | null
}

export function useDropMap() {
  const items = useItemsStore()
  const base = useApiBase()

  const loading = ref(true)
  const rawPlanets = ref<any[]>([])

  const itemIndex = computed(() => buildItemIndex(items.allItems as any[]))

  // Liquidity- and average-weighted realizable plat for one reward.
  function effectivePlat(rw: DropReward): number {
    if (!rw || !rw.tradeable) return 0
    const item = resolveMarketItem(rw.itemName, itemIndex.value)
    const market: any = item && item.market ? item.market : null
    const sell = market ? Number(market.sell) || 0 : Number(rw.price) || 0
    const avg = market ? Number(market.avg_price) || 0 : 0
    const vol = market ? Number(market.volume) || 0 : 0
    const basis = avg > 0 ? avg : sell
    return basis * (vol / (vol + VOL_K))
  }

  // Live market volume + thin flag for a reward's inline signal.
  function rewardMeta(rw: DropReward): { vol: number | null; thin: boolean; note: string } {
    const item = resolveMarketItem(rw && rw.itemName, itemIndex.value)
    const market: any = item && item.market ? item.market : null
    const sig = marketSignal(market)
    return { vol: market ? Number(market.volume) || 0 : null, thin: sig.thin, note: sig.note }
  }

  // Items with real 48h volume always rank above zero-volume "trash", then by
  // liquidity-weighted expected value (same basis as the mission's plat/drop).
  function sortedRewards(rewards: DropReward[]): DropReward[] {
    const hasVol = (rw: DropReward) => ((rewardMeta(rw).vol || 0) > 0 ? 1 : 0)
    return rewards.slice().sort((a, b) => {
      const dv = hasVol(b) - hasVol(a)
      if (dv) return dv
      return (
        (b.chance / 100) * effectivePlat(b) - (a.chance / 100) * effectivePlat(a) ||
        b.chance - a.chance
      )
    })
  }

  const planets = computed<DropPlanet[]>(() =>
    rawPlanets.value.map((p) => {
      const nodes = (p.nodes || []).map((n: any) => {
        const rotations = (n.rotations || []).map((rot: any) => {
          const value = (rot.rewards || []).reduce(
            (sum: number, rw: any) => sum + (Number(rw.chance) / 100) * effectivePlat(rw),
            0,
          )
          return { ...rot, value }
        })
        const nodeValue = rotations.reduce((mx: number, r: any) => Math.max(mx, r.value), 0)
        return { ...n, rotations, value: nodeValue }
      })
      nodes.sort((a: any, b: any) => b.value - a.value)
      const best = nodes[0] || null
      return {
        ...p,
        nodes,
        nodeCount: nodes.length,
        value: best ? best.value : 0,
        bestNode: best
          ? { location: best.location, gameMode: best.gameMode, value: best.value }
          : null,
      }
    }),
  )

  const planetsByName = computed<Record<string, DropPlanet>>(() => {
    const map: Record<string, DropPlanet> = {}
    for (const p of planets.value) map[p.planet] = p
    return map
  })

  const maxValue = computed(
    () => planets.value.reduce((m, p) => Math.max(m, p.value || 0), 0) || 1,
  )

  const richest = computed(
    () => planets.value.slice().sort((a, b) => b.value - a.value)[0] || null,
  )

  const stats = computed(() => {
    let topNode: any = null
    let nodes = 0
    for (const p of planets.value) {
      nodes += p.nodeCount
      if (p.bestNode && (!topNode || p.bestNode.value > topNode.value)) {
        topNode = { ...p.bestNode, planet: p.planet }
      }
    }
    return {
      planets: planets.value.length,
      nodes,
      topValue: richest.value ? richest.value.value : 0,
      topNode,
    }
  })

  async function load() {
    loading.value = true
    try {
      const res: any = await $fetch(`${base}/drops/map`)
      rawPlanets.value = (res && res.planets) || []
    } catch {
      rawPlanets.value = []
    } finally {
      loading.value = false
    }
  }

  return {
    loading,
    planets,
    planetsByName,
    maxValue,
    richest,
    stats,
    load,
    effectivePlat,
    rewardMeta,
    sortedRewards,
  }
}
