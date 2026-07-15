// DropLocationsDialog component. Namespaced under `dropDialog.*`. Follows the
// shared glossary: relic→reliquia/relíquia, drops→drops (kept), vaulted→vedado/a,
// refinement tiers Intact/Radiant→Intacta/Radiante. Item/relic/mission/planet/node
// names, numbers, `%`, the `p` plat suffix, rotation letters (A/B/C), rarity
// labels from the API, and proper nouns (Warframe.Market, warframestat, Wiki) are
// kept verbatim. `marketSignal` note text lives in a shared util and is untranslated.
export default {
  en: {
    dropDialog: {
      eyebrow: 'Drop locations',
      itemFallback: 'Item',
      closeAria: 'Close drop locations',
      market: {
        buy: 'Buy',
        sell: 'Sell',
        avg48h: 'Avg 48h',
        diff: 'Diff',
        vol48h: 'Vol 48h',
        updated: 'Updated',
        lastTrade: 'last trade {price}p · {time}',
        viewOnMarket: 'View on Warframe.Market ↗',
        notTraded: 'Not traded on Warframe Market',
      },
      state: {
        error: "Couldn't load drop data.",
        retry: 'Retry',
        empty: 'No drop sources found for this item.',
        emptyHint: 'It may be vaulted, sold by a shop, or traded only between players.',
      },
      results: {
        directDrops: 'Drops directly at',
        foundInRelics: 'Found in relics',
        farmRelicAt: 'Farm the relic at',
        showLess: 'Show less',
        showMore: '+{n} more',
        noFarmSource: 'Relic currently has no farmable source (likely vaulted).',
      },
      refine: {
        intact: 'Intact',
        exceptional: 'Excep.',
        flawless: 'Flawless',
        radiant: 'Radiant',
      },
      footer: {
        wiki: 'Wiki',
        crossCheck: 'Cross-check on warframestat',
      },
    },
  },
  es: {
    dropDialog: {
      eyebrow: 'Ubicaciones de drop',
      itemFallback: 'Objeto',
      closeAria: 'Cerrar ubicaciones de drop',
      market: {
        buy: 'Compra',
        sell: 'Venta',
        avg48h: 'Prom. 48h',
        diff: 'Dif.',
        vol48h: 'Vol 48h',
        updated: 'Actualizado',
        lastTrade: 'último intercambio {price}p · {time}',
        viewOnMarket: 'Ver en Warframe.Market ↗',
        notTraded: 'No se comercia en Warframe Market',
      },
      state: {
        error: 'No se pudieron cargar los datos de drop.',
        retry: 'Reintentar',
        empty: 'No se encontraron fuentes de drop para este objeto.',
        emptyHint: 'Puede estar vedado, venderse en una tienda o intercambiarse solo entre jugadores.',
      },
      results: {
        directDrops: 'Drops directos en',
        foundInRelics: 'Encontrado en reliquias',
        farmRelicAt: 'Farmea la reliquia en',
        showLess: 'Mostrar menos',
        showMore: '+{n} más',
        noFarmSource: 'La reliquia no tiene fuente farmeable actualmente (probablemente vedada).',
      },
      refine: {
        intact: 'Intacta',
        exceptional: 'Excep.',
        flawless: 'Impecable',
        radiant: 'Radiante',
      },
      footer: {
        wiki: 'Wiki',
        crossCheck: 'Verificar en warframestat',
      },
    },
  },
  pt: {
    dropDialog: {
      eyebrow: 'Locais de drop',
      itemFallback: 'Item',
      closeAria: 'Fechar locais de drop',
      market: {
        buy: 'Compra',
        sell: 'Venda',
        avg48h: 'Méd. 48h',
        diff: 'Dif.',
        vol48h: 'Vol 48h',
        updated: 'Atualizado',
        lastTrade: 'última troca {price}p · {time}',
        viewOnMarket: 'Ver no Warframe.Market ↗',
        notTraded: 'Não comercializado no Warframe Market',
      },
      state: {
        error: 'Não foi possível carregar os dados de drop.',
        retry: 'Tentar novamente',
        empty: 'Nenhuma fonte de drop encontrada para este item.',
        emptyHint: 'Pode estar vedado, ser vendido em uma loja ou trocado apenas entre jogadores.',
      },
      results: {
        directDrops: 'Drops diretos em',
        foundInRelics: 'Encontrado em relíquias',
        farmRelicAt: 'Farme a relíquia em',
        showLess: 'Mostrar menos',
        showMore: '+{n} mais',
        noFarmSource: 'A relíquia não tem fonte farmável no momento (provavelmente vedada).',
      },
      refine: {
        intact: 'Intacta',
        exceptional: 'Excep.',
        flawless: 'Impecável',
        radiant: 'Radiante',
      },
      footer: {
        wiki: 'Wiki',
        crossCheck: 'Verificar no warframestat',
      },
    },
  },
}
