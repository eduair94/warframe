// Ducat Efficiency page (/ducats). Namespaced under `ducatsPage.*` to avoid
// clashing with nav.items.ducats. Follows the shared glossary: platinum→
// platino/platina, ducats→ducados, part→parte/peça, bid/ask→puja·pedido/
// lance·oferta. Proper nouns kept: Warframe, Prime, Baro Ki'Teer, Void Trader.
export default {
  en: {
    ducatsPage: {
      eyebrow: 'Warframe Market · Ducat Efficiency',
      hero: {
        title: 'Most {ducats} per {platinum}.',
        titleDucats: 'ducats',
        titlePlatinum: 'platinum',
        lede: "Baro Ki'Teer pays ducats for prime parts. Buy the parts that give the most ducats for the least platinum, and every Void Trader visit costs you less. Ranked by ducats earned per platinum spent.",
        dealLabel: 'Best ducat value',
        dealSub: '{ducats} ducats · {sell}p',
      },
      stats: {
        primeParts: 'prime parts',
        bestPerPlat: 'best ducats/plat',
        avgPerPlat: 'avg ducats/plat',
        cheapParts: '≤ 15p parts',
      },
      filters: {
        search: 'Search a part',
        maxPrice: 'Max price (plat)',
        sortBy: 'Sort by',
        count: '{n} part match | {n} parts match',
      },
      categories: {
        All: 'All',
        Warframe: 'Warframe',
        Primary: 'Primary',
        Secondary: 'Secondary',
        Melee: 'Melee',
        Sentinel: 'Sentinel',
        Companion: 'Companion',
        Other: 'Other',
      },
      sort: {
        efficiency: 'Ducats per plat',
        ducats: 'Most ducats',
        cheapest: 'Cheapest',
        volume: 'Volume',
      },
      empty: 'No parts match these filters. Some items may not be enriched with ducat values yet.',
      table: {
        primePart: 'Prime part',
        platAsk: 'Plat (ask)',
        ducats: 'Ducats',
        ducatsPerPlat: 'Ducats / plat',
        vol: 'Vol',
      },
      row: {
        best: 'BEST',
        vol: 'vol {vol}',
        open: 'Open {name}',
      },
      card: {
        value: 'Value',
        plat: 'Plat',
        ducats: 'Ducats',
        efficiency: 'Efficiency',
        ducatsPerPlat: 'Ducats/plat',
        volume: 'Volume',
      },
      disclaimer:
        "Ducats/plat = ducat value ÷ lowest sell order. Baro's ducat prices are fixed by the game; platinum prices are today's Warframe Market orders.",
    },
  },
  es: {
    ducatsPage: {
      eyebrow: 'Warframe Market · Eficiencia de ducados',
      hero: {
        title: 'Más {ducats} por {platinum}.',
        titleDucats: 'ducados',
        titlePlatinum: 'platino',
        lede: "Baro Ki'Teer paga ducados por las partes Prime. Compra las partes que dan más ducados por el menor platino, y cada visita del Void Trader te cuesta menos. Ordenado por ducados ganados por platino gastado.",
        dealLabel: 'Mejor valor en ducados',
        dealSub: '{ducats} ducados · {sell}p',
      },
      stats: {
        primeParts: 'partes Prime',
        bestPerPlat: 'mejor ducados/plat',
        avgPerPlat: 'ducados/plat prom.',
        cheapParts: 'partes ≤ 15p',
      },
      filters: {
        search: 'Buscar una parte',
        maxPrice: 'Precio máx. (plat)',
        sortBy: 'Ordenar por',
        count: '{n} parte coincide | {n} partes coinciden',
      },
      categories: {
        All: 'Todos',
        Warframe: 'Warframe',
        Primary: 'Primaria',
        Secondary: 'Secundaria',
        Melee: 'Cuerpo a cuerpo',
        Sentinel: 'Centinela',
        Companion: 'Compañero',
        Other: 'Otros',
      },
      sort: {
        efficiency: 'Ducados por plat',
        ducats: 'Más ducados',
        cheapest: 'Más barato',
        volume: 'Volumen',
      },
      empty: 'Ninguna parte coincide con estos filtros. Puede que algunos objetos aún no tengan valores de ducados.',
      table: {
        primePart: 'Parte Prime',
        platAsk: 'Plat (pedido)',
        ducats: 'Ducados',
        ducatsPerPlat: 'Ducados / plat',
        vol: 'Vol',
      },
      row: {
        best: 'MEJOR',
        vol: 'vol {vol}',
        open: 'Abrir {name}',
      },
      card: {
        value: 'Valor',
        plat: 'Plat',
        ducats: 'Ducados',
        efficiency: 'Eficiencia',
        ducatsPerPlat: 'Ducados/plat',
        volume: 'Volumen',
      },
      disclaimer:
        'Ducados/plat = valor en ducados ÷ orden de venta más baja. Los precios en ducados de Baro los fija el juego; los precios en platino son las órdenes de hoy en Warframe Market.',
    },
  },
  pt: {
    ducatsPage: {
      eyebrow: 'Warframe Market · Eficiência de ducados',
      hero: {
        title: 'Mais {ducats} por {platinum}.',
        titleDucats: 'ducados',
        titlePlatinum: 'platina',
        lede: "Baro Ki'Teer paga ducados pelas peças Prime. Compre as peças que dão mais ducados pela menor quantidade de platina, e cada visita do Void Trader custa menos. Ordenado por ducados ganhos por platina gasta.",
        dealLabel: 'Melhor valor em ducados',
        dealSub: '{ducats} ducados · {sell}p',
      },
      stats: {
        primeParts: 'peças Prime',
        bestPerPlat: 'melhor ducados/plat',
        avgPerPlat: 'ducados/plat méd.',
        cheapParts: 'peças ≤ 15p',
      },
      filters: {
        search: 'Buscar uma peça',
        maxPrice: 'Preço máx. (plat)',
        sortBy: 'Ordenar por',
        count: '{n} peça corresponde | {n} peças correspondem',
      },
      categories: {
        All: 'Todos',
        Warframe: 'Warframe',
        Primary: 'Primária',
        Secondary: 'Secundária',
        Melee: 'Corpo a corpo',
        Sentinel: 'Sentinela',
        Companion: 'Companheiro',
        Other: 'Outros',
      },
      sort: {
        efficiency: 'Ducados por plat',
        ducats: 'Mais ducados',
        cheapest: 'Mais barato',
        volume: 'Volume',
      },
      empty: 'Nenhuma peça corresponde a esses filtros. Alguns itens podem ainda não ter valores de ducados.',
      table: {
        primePart: 'Peça Prime',
        platAsk: 'Plat (oferta)',
        ducats: 'Ducados',
        ducatsPerPlat: 'Ducados / plat',
        vol: 'Vol',
      },
      row: {
        best: 'MELHOR',
        vol: 'vol {vol}',
        open: 'Abrir {name}',
      },
      card: {
        value: 'Valor',
        plat: 'Plat',
        ducats: 'Ducados',
        efficiency: 'Eficiência',
        ducatsPerPlat: 'Ducados/plat',
        volume: 'Volume',
      },
      disclaimer:
        'Ducados/plat = valor em ducados ÷ menor ordem de venda. Os preços em ducados de Baro são fixados pelo jogo; os preços em platina são as ordens de hoje no Warframe Market.',
    },
  },
}
