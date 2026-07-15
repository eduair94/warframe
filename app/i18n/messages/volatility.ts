// Volatility index page (/volatility). Namespaced under `volatility.*`. Follows the
// shared glossary: volatility→volatilidad/volatilidade, platinum→platino/platina,
// vaulted→vedado/vedado, volume→volumen/volume. Item/category proper nouns
// (Warframe, Mod) are kept; category commons are localized. Technical abbreviations
// ("% cv", "vol") are kept verbatim across locales.
export default {
  en: {
    volatility: {
      eyebrow: 'Warframe Market · Volatility',
      hero: {
        title: "What's {stable}, what's {wild}.",
        titleStable: 'stable',
        titleWild: 'wild',
        lede: "A volatility index built from our own daily price history — the coefficient of variation of each item's trade price. warframe.market computes no such metric. Low volatility means a price you can trust to hold or farm against; high volatility means swingy, arbitrage-rich markets where timing pays.",
        dealLabel: 'Most volatile',
        cv: '% cv',
        dealSub: '{price}p · vol {vol}',
      },
      stats: {
        scored: 'items scored',
        mostVolatile: 'most volatile',
        mostStable: 'most stable',
        history: 'days of history',
      },
      filters: {
        search: 'Search an item',
        board: 'Board',
        boardVolatile: 'Most volatile',
        boardStable: 'Most stable',
        count: '{n} item | {n} items',
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
      level: {
        high: 'High',
        medium: 'Medium',
        low: 'Low',
      },
      loadError: "Couldn't load analytics. The market service may be waking up — try a refresh.",
      empty: {
        noHistory: 'Not enough price history yet — volatility fills in as daily snapshots accumulate.',
        noMatch: 'No items match these filters. Widen the search or reset the category.',
      },
      table: {
        item: 'Item',
        price: 'Price',
        volatility: 'Volatility',
        trend: 'Trend',
        vol: 'Vol',
        history: 'History',
      },
      row: {
        vaulted: 'VAULTED',
        tracked: '{days}d tracked',
      },
      card: {
        priceTracked: '{price}p · {days}d tracked',
        priceHistory: 'Price history · {days} days tracked',
      },
      disclaimer:
        'Volatility is the coefficient of variation (standard deviation ÷ mean, as a %) of our own daily price series — average trade price, falling back to the sell order. Items need at least 3 history points to be scored; the stability board also requires a week of tracking. Coverage grows every day the sync runs.',
    },
  },
  es: {
    volatility: {
      eyebrow: 'Warframe Market · Volatilidad',
      hero: {
        title: 'Lo {stable}, lo {wild}.',
        titleStable: 'estable',
        titleWild: 'volátil',
        lede: 'Un índice de volatilidad construido a partir de nuestro propio historial diario de precios — el coeficiente de variación del precio de comercio de cada objeto. warframe.market no calcula tal métrica. Baja volatilidad significa un precio en el que puedes confiar para mantener o farmear; alta volatilidad significa mercados inestables y ricos en arbitraje donde el timing paga.',
        dealLabel: 'Más volátil',
        cv: '% cv',
        dealSub: '{price}p · vol {vol}',
      },
      stats: {
        scored: 'objetos evaluados',
        mostVolatile: 'más volátil',
        mostStable: 'más estable',
        history: 'días de historial',
      },
      filters: {
        search: 'Buscar un objeto',
        board: 'Tablero',
        boardVolatile: 'Más volátil',
        boardStable: 'Más estable',
        count: '{n} objeto | {n} objetos',
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
      level: {
        high: 'Alta',
        medium: 'Media',
        low: 'Baja',
      },
      loadError: 'No se pudieron cargar las analíticas. El servicio de mercado puede estar despertando — intenta refrescar.',
      empty: {
        noHistory: 'Aún no hay suficiente historial de precios — la volatilidad se completa a medida que se acumulan las capturas diarias.',
        noMatch: 'Ningún objeto coincide con estos filtros. Amplía la búsqueda o restablece la categoría.',
      },
      table: {
        item: 'Objeto',
        price: 'Precio',
        volatility: 'Volatilidad',
        trend: 'Tendencia',
        vol: 'Vol',
        history: 'Historial',
      },
      row: {
        vaulted: 'VEDADO',
        tracked: '{days}d rastreados',
      },
      card: {
        priceTracked: '{price}p · {days}d rastreados',
        priceHistory: 'Historial de precios · {days} días rastreados',
      },
      disclaimer:
        'La volatilidad es el coeficiente de variación (desviación estándar ÷ media, como %) de nuestra propia serie diaria de precios — precio de comercio promedio, recurriendo a la orden de venta. Los objetos necesitan al menos 3 puntos de historial para ser evaluados; el tablero de estabilidad también requiere una semana de seguimiento. La cobertura crece cada día que se ejecuta la sincronización.',
    },
  },
  pt: {
    volatility: {
      eyebrow: 'Warframe Market · Volatilidade',
      hero: {
        title: 'O {stable}, o {wild}.',
        titleStable: 'estável',
        titleWild: 'volátil',
        lede: 'Um índice de volatilidade construído a partir do nosso próprio histórico diário de preços — o coeficiente de variação do preço de comércio de cada item. O warframe.market não calcula tal métrica. Baixa volatilidade significa um preço no qual você pode confiar para manter ou farmar; alta volatilidade significa mercados instáveis e ricos em arbitragem onde o timing compensa.',
        dealLabel: 'Mais volátil',
        cv: '% cv',
        dealSub: '{price}p · vol {vol}',
      },
      stats: {
        scored: 'itens avaliados',
        mostVolatile: 'mais volátil',
        mostStable: 'mais estável',
        history: 'dias de histórico',
      },
      filters: {
        search: 'Buscar um item',
        board: 'Quadro',
        boardVolatile: 'Mais volátil',
        boardStable: 'Mais estável',
        count: '{n} item | {n} itens',
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
      level: {
        high: 'Alta',
        medium: 'Média',
        low: 'Baixa',
      },
      loadError: 'Não foi possível carregar as análises. O serviço de mercado pode estar iniciando — tente atualizar.',
      empty: {
        noHistory: 'Ainda não há histórico de preços suficiente — a volatilidade se preenche à medida que os snapshots diários se acumulam.',
        noMatch: 'Nenhum item corresponde a esses filtros. Amplie a busca ou redefina a categoria.',
      },
      table: {
        item: 'Item',
        price: 'Preço',
        volatility: 'Volatilidade',
        trend: 'Tendência',
        vol: 'Vol',
        history: 'Histórico',
      },
      row: {
        vaulted: 'VEDADO',
        tracked: '{days}d monitorados',
      },
      card: {
        priceTracked: '{price}p · {days}d monitorados',
        priceHistory: 'Histórico de preços · {days} dias monitorados',
      },
      disclaimer:
        'A volatilidade é o coeficiente de variação (desvio padrão ÷ média, como %) da nossa própria série diária de preços — preço médio de comércio, recorrendo à ordem de venda. Os itens precisam de pelo menos 3 pontos de histórico para serem avaliados; o quadro de estabilidade também exige uma semana de monitoramento. A cobertura cresce a cada dia em que a sincronização é executada.',
    },
  },
}
