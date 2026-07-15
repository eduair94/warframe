// Top Movers page (/movers). Namespaced under `movers.*`. Follows the shared
// glossary (see i18n/messages/README): platinum→platino/platina,
// vaulted→vedado/vedado, volume→volumen/volume. Item and category proper nouns
// (Warframe, Mod) are kept; category commons are localized. Timeframe short
// codes (24h/7d/30d) and the "p"/"vol" suffixes are left as-is.
export default {
  en: {
    movers: {
      eyebrow: 'Warframe Market · Top Movers',
      hero: {
        title: "What's {pumping}, what's {dumping}.",
        titlePumping: 'pumping',
        titleDumping: 'dumping',
        lede: "The biggest price and volume moves across the whole market, built from our own daily price history — something warframe.market's per-item 90-day chart can't show you. Catch a rally before it peaks or a dip before it recovers.",
        dealLabel: 'Top gainer · {tf}',
        dealSub: '{price}p · vol {vol}',
      },
      stats: {
        withHistory: 'items with history',
        biggestGain: 'biggest gain',
        biggestDrop: 'biggest drop',
        daysHistory: 'days of history',
      },
      filters: {
        search: 'Search an item',
        board: 'Board',
        window: 'Window',
        count: '{n} item | {n} items',
      },
      boards: {
        gainers: 'Gainers',
        losers: 'Losers',
        volume: 'Volume',
      },
      categories: {
        All: 'All',
        Warframe: 'Warframe',
        Primary: 'Primary',
        Secondary: 'Secondary',
        Melee: 'Melee',
        Mod: 'Mod',
        Sentinel: 'Sentinel',
        Companion: 'Companion',
        Arcane: 'Arcane',
        Other: 'Other',
      },
      loadError: "Couldn't load analytics. The market service may be waking up — try a refresh.",
      empty: {
        volume: 'No items match these filters.',
        history:
          'No items have {tf} history yet. The movers board fills in as daily snapshots accumulate — check back soon.',
      },
      table: {
        item: 'Item',
        price: 'Price',
        change: '{tf} change',
        trend: 'Trend',
        vol: 'Vol',
        history: 'History',
      },
      row: {
        vaulted: 'VAULTED',
        tracked: '{n}d tracked',
      },
      card: {
        trackedDays: '{tf} · {n} days tracked',
      },
      disclaimer:
        'Change is measured on our own daily price series (average trade price, falling back to the sell order). Items need at least the selected window of history to appear on the gainers/losers boards — coverage grows every day the sync runs.',
    },
  },
  es: {
    movers: {
      eyebrow: 'Warframe Market · Mayores movimientos',
      hero: {
        title: 'Lo que {pumping}, lo que {dumping}.',
        titlePumping: 'se dispara',
        titleDumping: 'se desploma',
        lede: 'Los mayores movimientos de precio y volumen en todo el mercado, construidos a partir de nuestro propio historial de precios diario — algo que el gráfico de 90 días por objeto de warframe.market no puede mostrarte. Atrapa un repunte antes de que llegue a su pico o una caída antes de que se recupere.',
        dealLabel: 'Mayor subida · {tf}',
        dealSub: '{price}p · vol {vol}',
      },
      stats: {
        withHistory: 'objetos con historial',
        biggestGain: 'mayor subida',
        biggestDrop: 'mayor caída',
        daysHistory: 'días de historial',
      },
      filters: {
        search: 'Buscar un objeto',
        board: 'Tablero',
        window: 'Ventana',
        count: '{n} objeto | {n} objetos',
      },
      boards: {
        gainers: 'En alza',
        losers: 'A la baja',
        volume: 'Volumen',
      },
      categories: {
        All: 'Todos',
        Warframe: 'Warframe',
        Primary: 'Primaria',
        Secondary: 'Secundaria',
        Melee: 'Cuerpo a cuerpo',
        Mod: 'Mod',
        Sentinel: 'Centinela',
        Companion: 'Compañero',
        Arcane: 'Arcano',
        Other: 'Otros',
      },
      loadError: 'No se pudieron cargar las analíticas. El servicio de mercado puede estar despertando — prueba a actualizar.',
      empty: {
        volume: 'Ningún objeto coincide con estos filtros.',
        history:
          'Ningún objeto tiene historial de {tf} todavía. El tablero de movimientos se llena a medida que se acumulan las capturas diarias — vuelve pronto.',
      },
      table: {
        item: 'Objeto',
        price: 'Precio',
        change: 'Cambio {tf}',
        trend: 'Tendencia',
        vol: 'Vol',
        history: 'Historial',
      },
      row: {
        vaulted: 'VEDADO',
        tracked: '{n}d rastreado',
      },
      card: {
        trackedDays: '{tf} · {n} días rastreados',
      },
      disclaimer:
        'El cambio se mide sobre nuestra propia serie de precios diaria (precio de comercio promedio, con retorno a la orden de venta). Los objetos necesitan al menos la ventana de historial seleccionada para aparecer en los tableros de subidas/caídas — la cobertura crece cada día que se ejecuta la sincronización.',
    },
  },
  pt: {
    movers: {
      eyebrow: 'Warframe Market · Maiores movimentos',
      hero: {
        title: 'O que {pumping}, o que {dumping}.',
        titlePumping: 'dispara',
        titleDumping: 'despenca',
        lede: 'As maiores variações de preço e volume em todo o mercado, construídas a partir do nosso próprio histórico de preços diário — algo que o gráfico de 90 dias por item do warframe.market não consegue mostrar. Pegue uma alta antes do pico ou uma queda antes da recuperação.',
        dealLabel: 'Maior alta · {tf}',
        dealSub: '{price}p · vol {vol}',
      },
      stats: {
        withHistory: 'itens com histórico',
        biggestGain: 'maior alta',
        biggestDrop: 'maior queda',
        daysHistory: 'dias de histórico',
      },
      filters: {
        search: 'Buscar um item',
        board: 'Painel',
        window: 'Janela',
        count: '{n} item | {n} itens',
      },
      boards: {
        gainers: 'Em alta',
        losers: 'Em queda',
        volume: 'Volume',
      },
      categories: {
        All: 'Todos',
        Warframe: 'Warframe',
        Primary: 'Primária',
        Secondary: 'Secundária',
        Melee: 'Corpo a corpo',
        Mod: 'Mod',
        Sentinel: 'Sentinela',
        Companion: 'Companheiro',
        Arcane: 'Arcano',
        Other: 'Outros',
      },
      loadError: 'Não foi possível carregar as análises. O serviço de mercado pode estar acordando — tente atualizar.',
      empty: {
        volume: 'Nenhum item corresponde a esses filtros.',
        history:
          'Nenhum item tem histórico de {tf} ainda. O painel de movimentos se preenche à medida que as capturas diárias se acumulam — volte em breve.',
      },
      table: {
        item: 'Item',
        price: 'Preço',
        change: 'Variação {tf}',
        trend: 'Tendência',
        vol: 'Vol',
        history: 'Histórico',
      },
      row: {
        vaulted: 'VEDADO',
        tracked: '{n}d rastreado',
      },
      card: {
        trackedDays: '{tf} · {n} dias rastreados',
      },
      disclaimer:
        'A variação é medida sobre a nossa própria série de preços diária (preço médio de comércio, recorrendo à ordem de venda). Os itens precisam de pelo menos a janela de histórico selecionada para aparecer nos painéis de altas/quedas — a cobertura cresce a cada dia que a sincronização é executada.',
    },
  },
}
