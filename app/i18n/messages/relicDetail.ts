// Relic detail page (/relic/[[relic]]). Namespaced under `relicDetail.*`. Only
// the strings NOT already covered by shared keys live here: the visually-hidden
// SEO <h1> and the two donation aria-labels. The search box, "sell or earn"
// alert, drops button, donate prompt, disclaimer and every table header still
// use the shared `relic_*` / `col_*` / `disclaimer` keys. Follows the shared
// glossary: relic→reliquia/relíquia, drops kept as "drops"; proper nouns
// (Warframe, PayPal, Mercado Pago) are kept.
export default {
  en: {
    relicDetail: {
      h1Titled: '{name} — Drops & Value',
      h1Fallback: 'Warframe Relic Drops',
      donatePaypal: 'Donate with PayPal',
      donateMercadoPago: 'Donate with Mercado Pago',
    },
  },
  es: {
    relicDetail: {
      h1Titled: '{name} — Drops y valor',
      h1Fallback: 'Drops de reliquias de Warframe',
      donatePaypal: 'Donar con PayPal',
      donateMercadoPago: 'Donar con Mercado Pago',
    },
  },
  pt: {
    relicDetail: {
      h1Titled: '{name} — Drops e valor',
      h1Fallback: 'Drops de relíquias de Warframe',
      donatePaypal: 'Doar com PayPal',
      donateMercadoPago: 'Doar com Mercado Pago',
    },
  },
}
