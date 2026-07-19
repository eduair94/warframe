/**
 * Localized copy for the Web Push notifications (Spec B). Pure — no I/O — so it
 * is safe to import from the unit-tested evaluator.
 *
 * Only en/es/pt are translated; every other stored `locale` falls back to
 * English. The in-app UI is fully 13-locale, but a background push arriving in
 * English is acceptable for v1; the subscription stores its `locale` so the
 * remaining languages can be filled in later without a data migration.
 */
export type PushKind = 'below' | 'above' | 'atl'

export interface PushCopy {
  title: string
  body: string
}

export interface PushContext {
  item: string
  /** current sell price (below/above) */
  price?: number
  /** the user's threshold (below/above) */
  target?: number
  /** the all-time-low price, if known (atl) */
  atl?: number | null
}

type Builder = (c: PushContext) => PushCopy

const DICT: Record<string, Record<PushKind, Builder>> = {
  en: {
    below: (c) => ({ title: `${c.item} — price drop`, body: `Now ${c.price}p, at or below your ${c.target}p alert.` }),
    above: (c) => ({ title: `${c.item} — price rise`, body: `Now ${c.price}p, at or above your ${c.target}p alert.` }),
    atl: (c) => ({
      title: `${c.item} — all-time low`,
      body: c.atl != null ? `Cheapest in our records (~${c.atl}p) — a good time to buy.` : `Cheapest in our records — a good time to buy.`,
    }),
  },
  es: {
    below: (c) => ({ title: `${c.item} — baja de precio`, body: `Ahora ${c.price}p, en o por debajo de tu alerta de ${c.target}p.` }),
    above: (c) => ({ title: `${c.item} — subida de precio`, body: `Ahora ${c.price}p, en o por encima de tu alerta de ${c.target}p.` }),
    atl: (c) => ({
      title: `${c.item} — mínimo histórico`,
      body: c.atl != null ? `Lo más barato en nuestro historial (~${c.atl}p) — buen momento para comprar.` : `Lo más barato en nuestro historial — buen momento para comprar.`,
    }),
  },
  pt: {
    below: (c) => ({ title: `${c.item} — queda de preço`, body: `Agora ${c.price}p, igual ou abaixo do seu alerta de ${c.target}p.` }),
    above: (c) => ({ title: `${c.item} — alta de preço`, body: `Agora ${c.price}p, igual ou acima do seu alerta de ${c.target}p.` }),
    atl: (c) => ({
      title: `${c.item} — mínima histórica`,
      body: c.atl != null ? `O mais barato no nosso histórico (~${c.atl}p) — boa hora para comprar.` : `O mais barato no nosso histórico — boa hora para comprar.`,
    }),
  },
}

/** Base language of a locale code ("pt-BR" -> "pt"), lower-cased. */
function baseLocale(locale?: string): string {
  return (locale || 'en').toLowerCase().split('-')[0]
}

export function buildPushMessage(kind: PushKind, ctx: PushContext, locale?: string): PushCopy {
  const lang = DICT[baseLocale(locale)] ? baseLocale(locale) : 'en'
  return DICT[lang][kind](ctx)
}
