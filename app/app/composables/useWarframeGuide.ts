import { computed, ref } from 'vue'

/**
 * Warframe farming guide data, shared by the 2D and 3D star chart pages.
 *
 * Sources the WFCD community `warframe-items` dataset (same project family the
 * backend drop sync mirrors) straight from raw.githubusercontent.com — it is
 * rebuilt against every game update, so part sources stay current without a
 * backend change. Fetched lazily the first time the guide opens, parsed down
 * to a lean structure and cached for the session.
 *
 * - Standard frames: component drops are boss / mission sources
 *   ("Venus/Fossa (Assassination)", 38.72%).
 * - Prime frames: component drops are relics ("Axi A12 Relic (Radiant)"),
 *   which the maps can highlight because relics are themselves map drops.
 */

const WARFRAMES_URL =
  'https://raw.githubusercontent.com/WFCD/warframe-items/master/data/json/Warframes.json'

/** Build materials listed among components that are not farmable "parts". */
const NON_PART_COMPONENTS = new Set([
  'Orokin Cell', 'Neurodes', 'Neural Sensors', 'Morphics', 'Gallium', 'Plastids',
  'Rubedo', 'Alloy Plate', 'Nano Spores', 'Salvage', 'Circuits', 'Control Module',
  'Ferrite', 'Polymer Bundle', 'Argon Crystal', 'Tellurium', 'Cryotic', 'Oxium',
  'Kuva', 'Credits', 'Forma', 'Nitain Extract', 'Hexenon', 'Mutagen Mass',
  'Fieldron', 'Detonite Injector', 'Aya',
  // newer frame-specific build resources (zero-drop rows, not farmable parts)
  'Fate Pearl', 'Pathos Clamp', 'Lua Thrax Plasm', 'Echo Voca',
])

const RELIC_RE = /^(Lith|Meso|Neo|Axi|Requiem|Vanguard)\s+\S+\s+Relic/i
const REFINEMENT_RE = /\s*\((?:Intact|Exceptional|Flawless|Radiant)\)\s*$/i

export interface GuideDropSource {
  /** raw WFCD location string, refinement suffix stripped for relics */
  location: string
  /** relic name when the source is a relic (e.g. "Axi A12 Relic") */
  relic?: string
  /** planet name when the source looks like "Planet/Node (Mode)" */
  planet?: string
  chanceMin: number
  chanceMax: number
  rarity?: string
}

export interface GuideComponent {
  name: string
  itemCount: number
  sources: GuideDropSource[]
}

export interface GuideFrame {
  name: string
  isPrime: boolean
  vaulted: boolean
  masteryReq: number
  description: string
  wikiaUrl: string
  /** PLATINUM price of the fully-built frame on the in-game (NPC) market */
  marketCost: number
  /** CREDITS price of the main blueprint on the in-game market (0 = not sold there) */
  bpCost: number
  components: GuideComponent[]
}

let fetchPromise: Promise<GuideFrame[]> | null = null

function parseDrops(drops: any[]): GuideDropSource[] {
  const byKey = new Map<string, GuideDropSource>()
  for (const d of drops || []) {
    const raw = String(d.location || '').trim()
    if (!raw) continue
    const isRelic = RELIC_RE.test(raw)
    const location = isRelic ? raw.replace(REFINEMENT_RE, '') : raw
    const chance = Number(d.chance) || 0
    let entry = byKey.get(location)
    if (!entry) {
      let planet: string | undefined
      if (!isRelic && raw.includes('/')) planet = raw.split('/')[0]!.trim()
      entry = {
        location,
        relic: isRelic ? location : undefined,
        planet,
        chanceMin: chance,
        chanceMax: chance,
        rarity: d.rarity,
      }
      byKey.set(location, entry)
    } else {
      entry.chanceMin = Math.min(entry.chanceMin, chance)
      entry.chanceMax = Math.max(entry.chanceMax, chance)
    }
  }
  return [...byKey.values()].sort((a, b) => b.chanceMax - a.chanceMax)
}

function parseFrames(raw: any[]): GuideFrame[] {
  const frames: GuideFrame[] = []
  for (const f of raw || []) {
    if (!f || !f.name) continue
    const components: GuideComponent[] = []
    for (const c of f.components || []) {
      if (!c || !c.name || NON_PART_COMPONENTS.has(c.name)) continue
      components.push({
        name: c.name,
        itemCount: Number(c.itemCount) || 1,
        sources: parseDrops(c.drops),
      })
    }
    // Blueprint first, then alphabetical — reads like the foundry
    components.sort((a, b) => {
      if (a.name === 'Blueprint') return -1
      if (b.name === 'Blueprint') return 1
      return a.name.localeCompare(b.name)
    })
    frames.push({
      name: f.name,
      isPrime: !!f.isPrime,
      vaulted: !!f.vaulted,
      masteryReq: Number(f.masteryReq) || 0,
      description: String(f.description || ''),
      wikiaUrl: String(f.wikiaUrl || ''),
      marketCost: Number(f.marketCost) || 0,
      bpCost: Number(f.bpCost) || 0,
      components,
    })
  }
  return frames.sort((a, b) => a.name.localeCompare(b.name))
}

export function useWarframeGuide() {
  const frames = ref<GuideFrame[]>([])
  const loading = ref(false)
  const error = ref('')

  async function load() {
    if (frames.value.length || loading.value) return
    loading.value = true
    error.value = ''
    try {
      if (!fetchPromise) {
        fetchPromise = $fetch<any[]>(WARFRAMES_URL, { responseType: 'json' }).then(parseFrames)
      }
      frames.value = await fetchPromise
    } catch (e) {
      fetchPromise = null
      error.value = 'Could not load the warframe data. Check your connection and retry.'
    } finally {
      loading.value = false
    }
  }

  const primes = computed(() => frames.value.filter((f) => f.isPrime))
  const standard = computed(() => frames.value.filter((f) => !f.isPrime))

  return { frames, primes, standard, loading, error, load }
}
