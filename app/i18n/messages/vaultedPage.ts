// Vaulted items page (/vaulted). Namespaced under `vaultedPage.*` (NOT `vaulted`,
// to avoid clashing with nav.items.vaulted). Follows the shared glossary:
// vaulted→vedado/vedado, vault→bóveda/cofre, ask/bid→pedido·oferta / puja·lance,
// platinum→platino/platina ("plat"/"p" suffix kept). Item names, "p"/"vol"
// suffixes, numbers, routes, icons and proper nouns (Warframe, Prime, SET) kept.
export default {
  en: {
    vaultedPage: {
      eyebrow: 'Warframe Market · Vaulted',
      hero: {
        title: 'Locked in the {vault}.',
        titleVault: 'Vault',
        lede: "Vaulted prime gear can't be farmed from relics anymore — supply only shrinks, so prices tend to climb. Here's every vaulted item on the market, ranked by what it's worth today.",
        dealLabel: 'Priciest vaulted',
        dealSub: 'vol {vol}',
      },
      stats: {
        total: 'vaulted items',
        priciest: 'priciest',
        avg: 'avg price',
        sets: 'full sets',
      },
      filters: {
        search: 'Search an item',
        minPrice: 'Min price (plat)',
        sortBy: 'Sort by',
        setsOnly: 'Full sets only',
        count: '{n} item match | {n} items match',
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
        price: 'Price (high → low)',
        volume: 'Volume',
        name: 'Name (A–Z)',
      },
      empty: 'No vaulted items match these filters. Some items may not be enriched with vault status yet.',
      table: {
        item: 'Vaulted item',
        ask: 'Price (ask)',
        bid: 'Buy (bid)',
        spread: 'Spread',
        vol: 'Vol',
      },
      row: {
        set: 'SET',
        catVol: '{cat} · vol {vol}',
        open: 'Open {name}',
      },
      card: {
        marketValue: 'Market value',
      },
      disclaimer:
        "Vault status comes from Warframe Market. Prices are today's orders — not a guarantee of future value. Low-volume items can swing hard.",
    },
  },
  es: {
    vaultedPage: {
      eyebrow: 'Warframe Market · Vedado',
      hero: {
        title: 'Bloqueado en la {vault}.',
        titleVault: 'Bóveda',
        lede: 'El equipo Prime vedado ya no se puede farmear de reliquias — la oferta solo se reduce, así que los precios tienden a subir. Aquí está cada objeto vedado del mercado, ordenado por lo que vale hoy.',
        dealLabel: 'Vedado más caro',
        dealSub: 'vol {vol}',
      },
      stats: {
        total: 'objetos vedados',
        priciest: 'más caro',
        avg: 'precio prom.',
        sets: 'sets completos',
      },
      filters: {
        search: 'Buscar un objeto',
        minPrice: 'Precio mín. (plat)',
        sortBy: 'Ordenar por',
        setsOnly: 'Solo sets completos',
        count: '{n} objeto coincide | {n} objetos coinciden',
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
        price: 'Precio (mayor → menor)',
        volume: 'Volumen',
        name: 'Nombre (A–Z)',
      },
      empty: 'Ningún objeto vedado coincide con estos filtros. Puede que algunos objetos aún no tengan el estado de vedado.',
      table: {
        item: 'Objeto vedado',
        ask: 'Precio (pedido)',
        bid: 'Compra (puja)',
        spread: 'Spread',
        vol: 'Vol',
      },
      row: {
        set: 'SET',
        catVol: '{cat} · vol {vol}',
        open: 'Abrir {name}',
      },
      card: {
        marketValue: 'Valor de mercado',
      },
      disclaimer:
        'El estado de vedado proviene de Warframe Market. Los precios son las órdenes de hoy — no una garantía de valor futuro. Los objetos de bajo volumen pueden variar mucho.',
    },
  },
  pt: {
    vaultedPage: {
      eyebrow: 'Warframe Market · Vedado',
      hero: {
        title: 'Trancado no {vault}.',
        titleVault: 'Cofre',
        lede: 'O equipamento Prime vedado não pode mais ser farmado de relíquias — a oferta só diminui, então os preços tendem a subir. Aqui está cada item vedado do mercado, ordenado pelo que vale hoje.',
        dealLabel: 'Vedado mais caro',
        dealSub: 'vol {vol}',
      },
      stats: {
        total: 'itens vedados',
        priciest: 'mais caro',
        avg: 'preço méd.',
        sets: 'sets completos',
      },
      filters: {
        search: 'Buscar um item',
        minPrice: 'Preço mín. (plat)',
        sortBy: 'Ordenar por',
        setsOnly: 'Apenas sets completos',
        count: '{n} item corresponde | {n} itens correspondem',
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
        price: 'Preço (maior → menor)',
        volume: 'Volume',
        name: 'Nome (A–Z)',
      },
      empty: 'Nenhum item vedado corresponde a esses filtros. Alguns itens podem ainda não ter o status de vedado.',
      table: {
        item: 'Item vedado',
        ask: 'Preço (oferta)',
        bid: 'Compra (lance)',
        spread: 'Spread',
        vol: 'Vol',
      },
      row: {
        set: 'SET',
        catVol: '{cat} · vol {vol}',
        open: 'Abrir {name}',
      },
      card: {
        marketValue: 'Valor de mercado',
      },
      disclaimer:
        'O status de vedado vem do Warframe Market. Os preços são as ordens de hoje — não uma garantia de valor futuro. Itens de baixo volume podem variar bastante.',
    },
  },
}
