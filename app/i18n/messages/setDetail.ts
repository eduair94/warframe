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
  de: {
    setDetail: {
      h1WithName: '{name} — Preis & Set vs. Teile',
      h1Fallback: 'Warframe-Set-Preise',
      saveAlert: 'Der Kauf nach Teilen kann dir bis zu: {save} Platin sparen',
      helpDonating: 'Unterstütze uns mit einer Spende!',
      donatePaypal: 'Mit PayPal spenden',
      donateMercadoPago: 'Mit Mercado Pago spenden',
    },
  },
  fr: {
    setDetail: {
      h1WithName: '{name} — Prix et set vs pièces',
      h1Fallback: 'Prix des sets Warframe',
      saveAlert: "Acheter par pièces peut vous faire économiser jusqu'à : {save} platine",
      helpDonating: 'Aidez-nous en faisant un don !',
      donatePaypal: 'Faire un don avec PayPal',
      donateMercadoPago: 'Faire un don avec Mercado Pago',
    },
  },
  ru: {
    setDetail: {
      h1WithName: '{name} — цена и набор против частей',
      h1Fallback: 'Цены на наборы Warframe',
      saveAlert: 'Покупка по частям может сэкономить до: {save} платины',
      helpDonating: 'Поддержите нас пожертвованием!',
      donatePaypal: 'Пожертвовать через PayPal',
      donateMercadoPago: 'Пожертвовать через Mercado Pago',
    },
  },
  ko: {
    setDetail: {
      h1WithName: '{name} — 가격 및 세트 대 부품',
      h1Fallback: 'Warframe 세트 가격',
      saveAlert: '부품별로 구매하면 최대: {save} 플래티넘을 절약할 수 있습니다',
      helpDonating: '기부로 응원해 주세요!',
      donatePaypal: 'PayPal로 기부하기',
      donateMercadoPago: 'Mercado Pago로 기부하기',
    },
  },
  ja: {
    setDetail: {
      h1WithName: '{name} — 価格とセット対パーツ',
      h1Fallback: 'Warframe セット価格',
      saveAlert: 'パーツごとに購入すると最大: {save} プラチナ節約できます',
      helpDonating: '寄付でご支援ください！',
      donatePaypal: 'PayPalで寄付する',
      donateMercadoPago: 'Mercado Pagoで寄付する',
    },
  },
  'zh-hans': {
    setDetail: {
      h1WithName: '{name} — 价格及套装与部件对比',
      h1Fallback: 'Warframe 套装价格',
      saveAlert: '按部件购买最多可为你节省: {save} 白金',
      helpDonating: '捐赠支持我们！',
      donatePaypal: '使用 PayPal 捐赠',
      donateMercadoPago: '使用 Mercado Pago 捐赠',
    },
  },
  'zh-hant': {
    setDetail: {
      h1WithName: '{name} — 價格及套裝與零件比較',
      h1Fallback: 'Warframe 套裝價格',
      saveAlert: '依零件購買最多可為你節省: {save} 白金',
      helpDonating: '捐款支持我們！',
      donatePaypal: '使用 PayPal 捐款',
      donateMercadoPago: '使用 Mercado Pago 捐款',
    },
  },
  pl: {
    setDetail: {
      h1WithName: '{name} — cena i zestaw vs części',
      h1Fallback: 'Ceny zestawów Warframe',
      saveAlert: 'Kupno na części może zaoszczędzić ci nawet: {save} platyny',
      helpDonating: 'Wesprzyj nas datkiem!',
      donatePaypal: 'Wesprzyj przez PayPal',
      donateMercadoPago: 'Wesprzyj przez Mercado Pago',
    },
  },
  it: {
    setDetail: {
      h1WithName: '{name} — Prezzo e set vs parti',
      h1Fallback: 'Prezzi dei set di Warframe',
      saveAlert: 'Comprare a parti può farti risparmiare fino a: {save} platino',
      helpDonating: 'Aiutaci con una donazione!',
      donatePaypal: 'Dona con PayPal',
      donateMercadoPago: 'Dona con Mercado Pago',
    },
  },
  uk: {
    setDetail: {
      h1WithName: '{name} — ціна та набір проти частин',
      h1Fallback: 'Ціни на набори Warframe',
      saveAlert: 'Купівля частинами може заощадити до: {save} платини',
      helpDonating: 'Підтримайте нас донатом!',
      donatePaypal: 'Підтримати через PayPal',
      donateMercadoPago: 'Підтримати через Mercado Pago',
    },
  },
}
