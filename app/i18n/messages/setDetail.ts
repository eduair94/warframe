// Set detail page (/set/[[set]]). Namespaced under `setDetail.*`. Only the
// still-hardcoded English lives here — table headers reuse the shared `col_*`
// keys, the Search input/button reuse `relic_search`, the Drops links reuse
// `relic_drops`, and the info banner reuses the shared `disclaimer` key.
// Follows the glossary: set→set, parts→partes/peças, platinum→platino/platina.
// The screen-reader-only h1 keeps the set name (a proper noun) via {name}.
export default {
  en: {
    setDetail: {
      h1WithName: '{name} — Price & Set vs Parts',
      h1Fallback: 'Warframe Set Prices',
      saveAlert: 'Purchasing by parts can save you up to: {save} platinum',
      helpDonating: 'Help us donating!',
      donatePaypal: 'Donate with PayPal',
      donateMercadoPago: 'Donate with Mercado Pago',
    },
  },
  es: {
    setDetail: {
      h1WithName: '{name} — Precio y set vs partes',
      h1Fallback: 'Precios de sets de Warframe',
      saveAlert: 'Comprar por partes puede ahorrarte hasta: {save} de platino',
      helpDonating: '¡Ayúdanos donando!',
      donatePaypal: 'Donar con PayPal',
      donateMercadoPago: 'Donar con Mercado Pago',
    },
  },
  pt: {
    setDetail: {
      h1WithName: '{name} — Preço e set vs peças',
      h1Fallback: 'Preços de sets do Warframe',
      saveAlert: 'Comprar por peças pode economizar até: {save} de platina',
      helpDonating: 'Ajude-nos doando!',
      donatePaypal: 'Doar com PayPal',
      donateMercadoPago: 'Doar com Mercado Pago',
    },
  },
}
