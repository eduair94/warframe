// Buy / Sell Timing page (/timing). Namespaced under `timing.*`. Follows the
// shared glossary (see i18n/messages/README): buy/sell→compra/venta·compra/venda,
// vaulted→vedado/vedado. Signal verdicts (buy/hold/sell) keep a stable internal
// key in <script>; only the displayed label/note are localized. Item and
// category proper nouns (Warframe, Mod) are kept; category commons are localized.
export default {
  en: {
    timing: {
      eyebrow: 'Warframe Market · Buy / Sell Timing',
      hero: {
        title: 'Buy the {low}, sell the {high}.',
        low: 'low',
        high: 'high',
        lede: "warframe.market's per-item chart only reaches back 90 days. We keep a longer daily price history, so we can tell you when an item is sitting near its all-time low — a buy — or pressed up against its high — a sell. Every row gets a plain buy / hold / sell read.",
        dealLabel: 'Strongest buy signal',
        dealSub: 'above its {days}d low',
      },
      stats: {
        withSignal: 'items with a signal',
        buy: 'buy signals',
        sell: 'sell signals',
        history: 'days of history',
      },
      filters: {
        search: 'Search an item',
        signal: 'Signal',
        count: '{n} item | {n} items',
      },
      mode: {
        all: 'All',
        buy: 'Buy signals',
        sell: 'Sell signals',
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
      empty: 'No items have enough price history for a timing call yet — this fills in as daily snapshots accumulate.',
      table: {
        item: 'Item',
        price: 'Price',
        vsLow: 'vs Low',
        vsHigh: 'vs High',
        signal: 'Signal',
        trend: 'Trend',
        history: 'History',
      },
      signal: {
        buy: { label: 'Buy', note: 'near its low' },
        sell: { label: 'Sell', note: 'near its high' },
        hold: { label: 'Hold', note: 'mid-range' },
      },
      row: {
        vaulted: 'VAULTED',
        history: '{days}d history',
      },
      card: {
        priceBands: 'Price bands',
        vsLow: 'vs low',
        vsHigh: 'vs high',
        historyDays: 'History · {days}d',
      },
      disclaimer:
        'Bands are built from our own daily price series (average trade price, falling back to the sell order). An item needs at least 7 days of history to get a call, and "near its low / high" means within 5% of the extreme we have on record — coverage deepens every day the sync runs.',
    },
  },
  es: {
    timing: {
      eyebrow: 'Warframe Market · Momento de Compra / Venta',
      hero: {
        title: 'Compra en el {low}, vende en el {high}.',
        low: 'mínimo',
        high: 'máximo',
        lede: 'El gráfico por objeto de warframe.market solo llega a 90 días atrás. Nosotros guardamos un historial diario de precios más largo, así podemos decirte cuándo un objeto está cerca de su mínimo histórico — una compra — o pegado a su máximo — una venta. Cada fila recibe una lectura clara de compra / mantener / venta.',
        dealLabel: 'Señal de compra más fuerte',
        dealSub: 'sobre su mínimo de {days}d',
      },
      stats: {
        withSignal: 'objetos con señal',
        buy: 'señales de compra',
        sell: 'señales de venta',
        history: 'días de historial',
      },
      filters: {
        search: 'Buscar un objeto',
        signal: 'Señal',
        count: '{n} objeto | {n} objetos',
      },
      mode: {
        all: 'Todas',
        buy: 'Señales de compra',
        sell: 'Señales de venta',
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
      loadError: 'No se pudo cargar la analítica. El servicio de mercado puede estar despertando — intenta refrescar.',
      empty: 'Ningún objeto tiene suficiente historial de precios para una señal de timing todavía — esto se completa a medida que se acumulan las capturas diarias.',
      table: {
        item: 'Objeto',
        price: 'Precio',
        vsLow: 'vs Mín.',
        vsHigh: 'vs Máx.',
        signal: 'Señal',
        trend: 'Tendencia',
        history: 'Historial',
      },
      signal: {
        buy: { label: 'Compra', note: 'cerca de su mínimo' },
        sell: { label: 'Venta', note: 'cerca de su máximo' },
        hold: { label: 'Mantener', note: 'rango medio' },
      },
      row: {
        vaulted: 'VEDADO',
        history: '{days}d de historial',
      },
      card: {
        priceBands: 'Bandas de precio',
        vsLow: 'vs mín.',
        vsHigh: 'vs máx.',
        historyDays: 'Historial · {days}d',
      },
      disclaimer:
        'Las bandas se construyen a partir de nuestra propia serie diaria de precios (precio de comercio promedio, recurriendo a la orden de venta). Un objeto necesita al menos 7 días de historial para recibir una señal, y "cerca de su mínimo / máximo" significa dentro del 5% del extremo que tenemos registrado — la cobertura se profundiza cada día que corre la sincronización.',
    },
  },
  pt: {
    timing: {
      eyebrow: 'Warframe Market · Momento de Compra / Venda',
      hero: {
        title: 'Compre na {low}, venda na {high}.',
        low: 'mínima',
        high: 'máxima',
        lede: 'O gráfico por item do warframe.market só alcança 90 dias atrás. Nós guardamos um histórico diário de preços mais longo, então podemos dizer quando um item está perto da sua mínima histórica — uma compra — ou colado na sua máxima — uma venda. Cada linha recebe uma leitura clara de compra / manter / venda.',
        dealLabel: 'Sinal de compra mais forte',
        dealSub: 'acima da sua mínima de {days}d',
      },
      stats: {
        withSignal: 'itens com sinal',
        buy: 'sinais de compra',
        sell: 'sinais de venda',
        history: 'dias de histórico',
      },
      filters: {
        search: 'Buscar um item',
        signal: 'Sinal',
        count: '{n} item | {n} itens',
      },
      mode: {
        all: 'Todos',
        buy: 'Sinais de compra',
        sell: 'Sinais de venda',
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
      loadError: 'Não foi possível carregar a análise. O serviço de mercado pode estar iniciando — tente atualizar.',
      empty: 'Nenhum item tem histórico de preços suficiente para uma leitura de timing ainda — isso se preenche conforme as capturas diárias se acumulam.',
      table: {
        item: 'Item',
        price: 'Preço',
        vsLow: 'vs Mín.',
        vsHigh: 'vs Máx.',
        signal: 'Sinal',
        trend: 'Tendência',
        history: 'Histórico',
      },
      signal: {
        buy: { label: 'Compra', note: 'perto da mínima' },
        sell: { label: 'Venda', note: 'perto da máxima' },
        hold: { label: 'Manter', note: 'faixa média' },
      },
      row: {
        vaulted: 'VEDADO',
        history: '{days}d de histórico',
      },
      card: {
        priceBands: 'Bandas de preço',
        vsLow: 'vs mín.',
        vsHigh: 'vs máx.',
        historyDays: 'Histórico · {days}d',
      },
      disclaimer:
        'As bandas são construídas a partir da nossa própria série diária de preços (preço médio de comércio, recorrendo à ordem de venda). Um item precisa de pelo menos 7 dias de histórico para receber uma leitura, e "perto da mínima / máxima" significa dentro de 5% do extremo que temos registrado — a cobertura se aprofunda a cada dia que a sincronização roda.',
    },
  },
}
