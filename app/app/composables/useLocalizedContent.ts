import type { Creator } from '~/data/creators'
import type { ToolResearch } from '~/data/toolResearch'
import type { FarmTarget, FarmKind } from '~/data/guides/farmIndex'

// Lazy loaders for every generated content-locale override.
const researchOverrides = import.meta.glob('../data/tools.research.locales/*.json')
const creatorOverrides = import.meta.glob('../data/creators.locales/*.json')
const farmOverrides = import.meta.glob('../data/farmIndex.locales/*.json')

async function pick<T>(overrides: Record<string, () => Promise<unknown>>, rel: string, fallback: T): Promise<T> {
  const { locale } = useI18n()
  const loc = locale.value
  if (!loc || loc === 'en') return fallback
  const loader = overrides[rel.replace('<loc>', loc)]
  if (!loader) return fallback
  try {
    const mod = (await loader()) as { default?: T } & T
    return (mod.default ?? mod) as T
  } catch {
    return fallback
  }
}

/** Localized per-tool research map (slug → ToolResearch), English fallback. */
export function useLocalizedResearch(en: Record<string, ToolResearch>) {
  return pick(researchOverrides, '../data/tools.research.locales/<loc>.json', en)
}

/** Localized creators array (translated blurbs), English fallback. */
export function useLocalizedCreators(en: Creator[]) {
  return pick(creatorOverrides, '../data/creators.locales/<loc>.json', en)
}

/** Localized farm index ({ targets, kinds }), English fallback. */
export function useLocalizedFarmIndex(en: { targets: FarmTarget[]; kinds: Record<FarmKind, string> }) {
  return pick(farmOverrides, '../data/farmIndex.locales/<loc>.json', en)
}
