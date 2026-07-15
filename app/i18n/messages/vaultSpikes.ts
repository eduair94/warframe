// Vault Spike Feed page (/vault-spikes). Namespaced under `vaultSpikes.*`.
// Follows the shared glossary (see i18n/messages/README): vaulted→vedado/vedado,
// vault→bóveda (es) / cofre (pt), platinum→platino/platina (short suffix "p"
// kept). "spike"→pico, "climbing"→subiendo/subindo. Item and category proper
// nouns (Warframe, Prime, warframe.market) are kept; category commons localized.
export default {
  en: {
    vaultSpikes: {
      eyebrow: 'Warframe Market · Vault Spike Feed',
      hero: {
        title: 'Vaulted primes that are {climbing} again.',
        titleClimbing: 'climbing',
        lede: "Vaulted prime items can't drop anymore, so scarcity slowly pushes their plat price up. This feed ranks every vaulted item by how fast it's rising, built from our own daily price history — warframe.market only gives you a static vaulted flag and a per-item 90-day chart. Catch the sell window before the spike fades.",
        dealLabel: 'Hottest vault spike · {window}',
        dealSub: '{price}p · vol {vol}',
      },
      stats: {
        vaultedTracked: 'vaulted tracked',
        climbingNow: 'climbing now',
        biggestSpike: 'biggest spike',
        avgSpike: 'avg spike',
      },
      filters: {
        search: 'Search an item',
        window: 'Window',
        filter: 'Filter',
        onlyClimbing: 'Only climbing',
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
      loadError: "Couldn't load analytics. The market service may be waking up — try a refresh.",
      empty: "No vaulted items are climbing right now — either prices are flat or history is still accumulating. Toggle off 'Only climbing' to see every vaulted item.",
      table: {
        item: 'Item',
        price: 'Price',
        vsLow: 'vs Low',
        vol: 'Vol',
        history: 'History',
      },
      row: {
        vaulted: 'VAULTED',
        tracked: '{n}d tracked',
      },
      card: {
        sub: '{price}p · vol {vol}',
        change: 'change',
        spikeTracked: '{window} spike · {days} days tracked',
      },
      disclaimer:
        "Change is measured on our own daily price series (average trade price, falling back to the sell order). “Vaulted” reflects the item's current availability flag; a freshly vaulted item needs a few days of history before its spike shows up here — coverage grows every day the sync runs.",
    },
  },
  es: {
    vaultSpikes: {
      eyebrow: 'Warframe Market · Feed de Picos de la Bóveda',
      hero: {
        title: 'Primes vedados que vuelven a {climbing}.',
        titleClimbing: 'subir',
        lede: 'Los objetos prime vedados ya no dropean, así que la escasez empuja lentamente su precio en plat hacia arriba. Este feed clasifica cada objeto vedado según qué tan rápido está subiendo, construido a partir de nuestro propio historial diario de precios — warframe.market solo te da una marca estática de vedado y un gráfico de 90 días por objeto. Aprovecha la ventana de venta antes de que el pico se desvanezca.',
        dealLabel: 'Mayor pico de la bóveda · {window}',
        dealSub: '{price}p · vol {vol}',
      },
      stats: {
        vaultedTracked: 'vedados rastreados',
        climbingNow: 'subiendo ahora',
        biggestSpike: 'mayor pico',
        avgSpike: 'pico prom.',
      },
      filters: {
        search: 'Buscar un objeto',
        window: 'Ventana',
        filter: 'Filtro',
        onlyClimbing: 'Solo subiendo',
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
      loadError: 'No se pudieron cargar las analíticas. El servicio de mercado puede estar despertando — intenta recargar.',
      empty: "Ningún objeto vedado está subiendo ahora mismo — o los precios están planos o el historial aún se está acumulando. Desactiva 'Solo subiendo' para ver todos los objetos vedados.",
      table: {
        item: 'Objeto',
        price: 'Precio',
        vsLow: 'vs Mín.',
        vol: 'Vol',
        history: 'Historial',
      },
      row: {
        vaulted: 'VEDADO',
        tracked: '{n}d rastreados',
      },
      card: {
        sub: '{price}p · vol {vol}',
        change: 'cambio',
        spikeTracked: 'pico {window} · {days} días rastreados',
      },
      disclaimer:
        'El cambio se mide sobre nuestra propia serie diaria de precios (precio de comercio promedio, recurriendo a la orden de venta). «Vedado» refleja la marca de disponibilidad actual del objeto; un objeto recién vedado necesita unos días de historial antes de que su pico aparezca aquí — la cobertura crece cada día que se ejecuta la sincronización.',
    },
  },
  pt: {
    vaultSpikes: {
      eyebrow: 'Warframe Market · Feed de Picos do Cofre',
      hero: {
        title: 'Primes vedados que voltam a {climbing}.',
        titleClimbing: 'subir',
        lede: 'Os itens prime vedados não dropam mais, então a escassez empurra lentamente o preço em plat para cima. Este feed classifica cada item vedado pela rapidez com que está subindo, construído a partir do nosso próprio histórico diário de preços — o warframe.market só te dá uma marca estática de vedado e um gráfico de 90 dias por item. Aproveite a janela de venda antes que o pico desapareça.',
        dealLabel: 'Maior pico do cofre · {window}',
        dealSub: '{price}p · vol {vol}',
      },
      stats: {
        vaultedTracked: 'vedados monitorados',
        climbingNow: 'subindo agora',
        biggestSpike: 'maior pico',
        avgSpike: 'pico méd.',
      },
      filters: {
        search: 'Buscar um item',
        window: 'Janela',
        filter: 'Filtro',
        onlyClimbing: 'Apenas subindo',
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
      loadError: 'Não foi possível carregar as análises. O serviço de mercado pode estar acordando — tente atualizar.',
      empty: "Nenhum item vedado está subindo agora — ou os preços estão estáveis ou o histórico ainda está sendo acumulado. Desative 'Apenas subindo' para ver todos os itens vedados.",
      table: {
        item: 'Item',
        price: 'Preço',
        vsLow: 'vs Mín.',
        vol: 'Vol',
        history: 'Histórico',
      },
      row: {
        vaulted: 'VEDADO',
        tracked: '{n}d monitorados',
      },
      card: {
        sub: '{price}p · vol {vol}',
        change: 'variação',
        spikeTracked: 'pico {window} · {days} dias monitorados',
      },
      disclaimer:
        'A variação é medida na nossa própria série diária de preços (preço médio de comércio, recorrendo à ordem de venda). «Vedado» reflete a marca de disponibilidade atual do item; um item recém-vedado precisa de alguns dias de histórico antes que seu pico apareça aqui — a cobertura cresce a cada dia que a sincronização é executada.',
    },
  },
}
