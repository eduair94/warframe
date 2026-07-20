import type { MaybeRefOrGetter } from 'vue'

/**
 * Product JSON-LD for a single-item market page (/set/<item>, /relic/<item>).
 *
 * Deliberately NOT an Offer with `priceCurrency` — platinum is an in-game
 * currency, not an ISO 4217 code, and claiming otherwise would be invalid
 * (and could read as misleading) structured data for Google Merchant-style
 * price rich results. Instead the platinum price rides as a plain
 * `additionalProperty` PropertyValue: still real, valid schema.org that AI
 * answer engines (GEO) can cite ("X Prime Set is worth ~140 platinum"),
 * without pretending to be a real-money offer.
 */
interface MarketItemLdInput {
  name: MaybeRefOrGetter<string>
  description: MaybeRefOrGetter<string>
  image?: MaybeRefOrGetter<string | undefined>
  /** Reference platinum price, when one exists for this entity. */
  plat?: MaybeRefOrGetter<number | undefined>
  platLabel?: MaybeRefOrGetter<string | undefined>
}

export function useMarketItemLd(input: MarketItemLdInput): void {
  const origin = useRequestURL().origin
  const route = useRoute()

  useHead(() => {
    const name = toValue(input.name)
    if (!name) return {}

    const node: Record<string, unknown> = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name,
      description: toValue(input.description) || undefined,
      url: origin + route.fullPath,
    }

    const image = toValue(input.image)
    if (image) node.image = image

    const plat = toValue(input.plat)
    if (typeof plat === 'number' && plat > 0) {
      node.additionalProperty = {
        '@type': 'PropertyValue',
        name: toValue(input.platLabel) || 'Platinum price (Warframe Market)',
        value: Math.round(plat * 100) / 100,
      }
    }

    return {
      script: [
        {
          type: 'application/ld+json',
          innerHTML: JSON.stringify(node).replace(/</g, '\\u003c'),
        },
      ],
    }
  })
}
