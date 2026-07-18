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
  de: {
    movers: {
      eyebrow: 'Warframe Market · Top-Bewegungen',
      hero: {
        title: 'Was {pumping}, was {dumping}.',
        titlePumping: 'steigt',
        titleDumping: 'fällt',
        lede: 'Die größten Preis- und Volumenbewegungen im gesamten Markt, erstellt aus unserem eigenen täglichen Preisverlauf — etwas, das das 90-Tage-Diagramm pro Objekt von warframe.market nicht zeigen kann. Erwische eine Rally vor dem Höhepunkt oder einen Einbruch vor der Erholung.',
        dealLabel: 'Größter Gewinner · {tf}',
        dealSub: '{price}p · vol {vol}',
      },
      stats: {
        withHistory: 'Objekte mit Verlauf',
        biggestGain: 'größter Anstieg',
        biggestDrop: 'größter Rückgang',
        daysHistory: 'Tage Verlauf',
      },
      filters: {
        search: 'Objekt suchen',
        board: 'Tafel',
        window: 'Zeitfenster',
        count: '{n} Objekt | {n} Objekte',
      },
      boards: {
        gainers: 'Gewinner',
        losers: 'Verlierer',
        volume: 'Volumen',
      },
      categories: {
        All: 'Alle',
        Warframe: 'Warframe',
        Primary: 'Primär',
        Secondary: 'Sekundär',
        Melee: 'Nahkampf',
        Mod: 'Mod',
        Sentinel: 'Wächter',
        Companion: 'Begleiter',
        Arcane: 'Arkana',
        Other: 'Sonstige',
      },
      loadError: 'Analysen konnten nicht geladen werden. Der Marktdienst wacht möglicherweise gerade auf — versuche es mit einer Aktualisierung.',
      empty: {
        volume: 'Keine Objekte entsprechen diesen Filtern.',
        history:
          'Noch keine Objekte mit {tf}-Verlauf. Die Bewegungstafel füllt sich, während sich tägliche Momentaufnahmen ansammeln — schau bald wieder vorbei.',
      },
      table: {
        item: 'Objekt',
        price: 'Preis',
        change: 'Änderung {tf}',
        trend: 'Trend',
        vol: 'Vol',
        history: 'Verlauf',
      },
      row: {
        vaulted: 'IM TRESOR',
        tracked: '{n}d erfasst',
      },
      card: {
        trackedDays: '{tf} · {n} Tage erfasst',
      },
      disclaimer:
        'Die Änderung wird anhand unserer eigenen täglichen Preisreihe gemessen (durchschnittlicher Handelspreis, ersatzweise die Verkaufsorder). Objekte benötigen mindestens das ausgewählte Verlaufsfenster, um auf den Gewinner-/Verlierer-Tafeln zu erscheinen — die Abdeckung wächst mit jedem Tag, an dem die Synchronisierung läuft.',
    },
  },
  fr: {
    movers: {
      eyebrow: 'Warframe Market · Plus gros mouvements',
      hero: {
        title: 'Ce qui {pumping}, ce qui {dumping}.',
        titlePumping: 'grimpe',
        titleDumping: 'dévisse',
        lede: "Les plus gros mouvements de prix et de volume sur tout le marché, construits à partir de notre propre historique de prix quotidien — quelque chose que le graphique de 90 jours par objet de warframe.market ne peut pas vous montrer. Saisissez une hausse avant son pic ou une baisse avant qu'elle ne se redresse.",
        dealLabel: 'Meilleure hausse · {tf}',
        dealSub: '{price}p · vol {vol}',
      },
      stats: {
        withHistory: 'objets avec historique',
        biggestGain: 'plus forte hausse',
        biggestDrop: 'plus forte baisse',
        daysHistory: "jours d'historique",
      },
      filters: {
        search: 'Rechercher un objet',
        board: 'Tableau',
        window: 'Fenêtre',
        count: '{n} objet | {n} objets',
      },
      boards: {
        gainers: 'Hausses',
        losers: 'Baisses',
        volume: 'Volume',
      },
      categories: {
        All: 'Tous',
        Warframe: 'Warframe',
        Primary: 'Primaire',
        Secondary: 'Secondaire',
        Melee: 'Mêlée',
        Mod: 'Mod',
        Sentinel: 'Sentinelle',
        Companion: 'Compagnon',
        Arcane: 'Arcane',
        Other: 'Autre',
      },
      loadError: "Impossible de charger les analyses. Le service de marché est peut-être en train de démarrer — essayez d'actualiser.",
      empty: {
        volume: 'Aucun objet ne correspond à ces filtres.',
        history:
          "Aucun objet n'a encore d'historique {tf}. Le tableau des mouvements se remplit à mesure que les instantanés quotidiens s'accumulent — revenez bientôt.",
      },
      table: {
        item: 'Objet',
        price: 'Prix',
        change: 'Variation {tf}',
        trend: 'Tendance',
        vol: 'Vol',
        history: 'Historique',
      },
      row: {
        vaulted: 'AU COFFRE',
        tracked: '{n}j suivi',
      },
      card: {
        trackedDays: '{tf} · {n} jours suivis',
      },
      disclaimer:
        "La variation est mesurée sur notre propre série de prix quotidienne (prix d'échange moyen, avec repli sur l'ordre de vente). Les objets doivent avoir au moins la fenêtre d'historique sélectionnée pour apparaître sur les tableaux des hausses/baisses — la couverture augmente chaque jour où la synchronisation s'exécute.",
    },
  },
  ru: {
    movers: {
      eyebrow: 'Warframe Market · Лидеры движения',
      hero: {
        title: 'Что {pumping}, что {dumping}.',
        titlePumping: 'растёт',
        titleDumping: 'падает',
        lede: 'Крупнейшие движения цены и объёма по всему рынку, построенные на основе нашей собственной ежедневной истории цен — то, что 90-дневный график по каждому предмету на warframe.market показать не может. Поймайте рост до пика или падение до восстановления.',
        dealLabel: 'Крупнейший рост · {tf}',
        dealSub: '{price}p · vol {vol}',
      },
      stats: {
        withHistory: 'предметов с историей',
        biggestGain: 'крупнейший рост',
        biggestDrop: 'крупнейшее падение',
        daysHistory: 'дней истории',
      },
      filters: {
        search: 'Поиск предмета',
        board: 'Список',
        window: 'Окно',
        count: '{n} предмет | {n} предметов',
      },
      boards: {
        gainers: 'Растущие',
        losers: 'Падающие',
        volume: 'Объём',
      },
      categories: {
        All: 'Все',
        Warframe: 'Warframe',
        Primary: 'Основное',
        Secondary: 'Вторичное',
        Melee: 'Ближний бой',
        Mod: 'Mod',
        Sentinel: 'Страж',
        Companion: 'Спутник',
        Arcane: 'Мистификатор',
        Other: 'Другое',
      },
      loadError: 'Не удалось загрузить аналитику. Возможно, сервис рынка запускается — попробуйте обновить.',
      empty: {
        volume: 'Ни один предмет не соответствует этим фильтрам.',
        history:
          'Пока ни у одного предмета нет истории за {tf}. Доска движений заполняется по мере накопления ежедневных снимков — загляните позже.',
      },
      table: {
        item: 'Предмет',
        price: 'Цена',
        change: 'Изменение {tf}',
        trend: 'Тренд',
        vol: 'Vol',
        history: 'История',
      },
      row: {
        vaulted: 'В ХРАНИЛИЩЕ',
        tracked: '{n}д отслежено',
      },
      card: {
        trackedDays: '{tf} · {n} дней отслежено',
      },
      disclaimer:
        'Изменение измеряется по нашей собственной ежедневной серии цен (средняя цена сделки, с откатом к ордеру на продажу). Чтобы попасть на доски растущих/падающих, предметам нужна как минимум выбранная история за период — охват растёт с каждым днём работы синхронизации.',
    },
  },
  ko: {
    movers: {
      eyebrow: 'Warframe Market · 주요 변동',
      hero: {
        title: '{pumping} 것, {dumping} 것.',
        titlePumping: '오르는',
        titleDumping: '내리는',
        lede: '자체 일일 가격 기록으로 구축한 전체 시장의 가장 큰 가격 및 거래량 변동 — warframe.market의 아이템별 90일 차트로는 볼 수 없는 정보입니다. 정점에 도달하기 전에 상승세를, 회복되기 전에 하락세를 포착하세요.',
        dealLabel: '최대 상승 · {tf}',
        dealSub: '{price}p · vol {vol}',
      },
      stats: {
        withHistory: '기록이 있는 아이템',
        biggestGain: '최대 상승',
        biggestDrop: '최대 하락',
        daysHistory: '기록 일수',
      },
      filters: {
        search: '아이템 검색',
        board: '보드',
        window: '기간',
        count: '아이템 {n}개 | 아이템 {n}개',
      },
      boards: {
        gainers: '상승',
        losers: '하락',
        volume: '거래량',
      },
      categories: {
        All: '전체',
        Warframe: 'Warframe',
        Primary: '주무기',
        Secondary: '보조무기',
        Melee: '근접무기',
        Mod: 'Mod',
        Sentinel: '센티널',
        Companion: '컴패니언',
        Arcane: '아케인',
        Other: '기타',
      },
      loadError: '분석 데이터를 불러올 수 없습니다. 마켓 서비스가 준비 중일 수 있습니다 — 새로고침해 보세요.',
      empty: {
        volume: '이 필터에 맞는 아이템이 없습니다.',
        history:
          '아직 {tf} 기록이 있는 아이템이 없습니다. 변동 보드는 일일 스냅샷이 쌓이면서 채워집니다 — 곧 다시 확인해 주세요.',
      },
      table: {
        item: '아이템',
        price: '가격',
        change: '{tf} 변동',
        trend: '추세',
        vol: 'Vol',
        history: '기록',
      },
      row: {
        vaulted: '볼트',
        tracked: '{n}일 추적',
      },
      card: {
        trackedDays: '{tf} · {n}일 추적',
      },
      disclaimer:
        '변동은 자체 일일 가격 시리즈(평균 거래 가격, 없을 경우 판매 주문 가격)를 기준으로 측정됩니다. 아이템이 상승/하락 보드에 표시되려면 선택한 기간 이상의 기록이 필요합니다 — 동기화가 실행될 때마다 범위가 넓어집니다.',
    },
  },
  ja: {
    movers: {
      eyebrow: 'Warframe Market · 主要な変動',
      hero: {
        title: '{pumping}もの、{dumping}もの。',
        titlePumping: '上がっている',
        titleDumping: '下がっている',
        lede: '独自の日次価格履歴から構築した、市場全体で最も大きな価格と取引量の変動 — warframe.marketのアイテムごとの90日チャートでは見られない情報です。ピークを迎える前の上昇や、回復する前の下落を捉えましょう。',
        dealLabel: '最大の上昇 · {tf}',
        dealSub: '{price}p · vol {vol}',
      },
      stats: {
        withHistory: '履歴のあるアイテム',
        biggestGain: '最大の上昇',
        biggestDrop: '最大の下落',
        daysHistory: '履歴の日数',
      },
      filters: {
        search: 'アイテムを検索',
        board: 'ボード',
        window: '期間',
        count: '{n}件のアイテム | {n}件のアイテム',
      },
      boards: {
        gainers: '上昇',
        losers: '下落',
        volume: '取引量',
      },
      categories: {
        All: 'すべて',
        Warframe: 'Warframe',
        Primary: 'プライマリ',
        Secondary: 'セカンダリ',
        Melee: '近接',
        Mod: 'Mod',
        Sentinel: 'センチネル',
        Companion: 'コンパニオン',
        Arcane: 'アルケイン',
        Other: 'その他',
      },
      loadError: '分析データを読み込めませんでした。マーケットサービスが起動中の可能性があります — 更新してみてください。',
      empty: {
        volume: 'これらのフィルターに一致するアイテムはありません。',
        history:
          'まだ{tf}の履歴があるアイテムはありません。変動ボードは日次スナップショットが蓄積されるにつれて埋まっていきます — またあとで確認してください。',
      },
      table: {
        item: 'アイテム',
        price: '価格',
        change: '{tf}の変動',
        trend: 'トレンド',
        vol: 'Vol',
        history: '履歴',
      },
      row: {
        vaulted: 'ヴォルト入り',
        tracked: '{n}日追跡',
      },
      card: {
        trackedDays: '{tf} · {n}日追跡',
      },
      disclaimer:
        '変動は独自の日次価格シリーズ（平均取引価格、なければ売り注文価格）で測定されます。アイテムが上昇/下落ボードに表示されるには、選択した期間以上の履歴が必要です — 同期が実行されるたびにカバー範囲が広がります。',
    },
  },
  'zh-hans': {
    movers: {
      eyebrow: 'Warframe Market · 涨跌榜',
      hero: {
        title: '什么在{pumping}，什么在{dumping}。',
        titlePumping: '上涨',
        titleDumping: '下跌',
        lede: '基于我们自己的每日价格历史构建的整个市场最大的价格和交易量变动 — 这是 warframe.market 的单件 90 天图表无法向你展示的。在见顶前抓住涨势，在反弹前抓住跌势。',
        dealLabel: '最大涨幅 · {tf}',
        dealSub: '{price}p · vol {vol}',
      },
      stats: {
        withHistory: '有历史记录的物品',
        biggestGain: '最大涨幅',
        biggestDrop: '最大跌幅',
        daysHistory: '历史天数',
      },
      filters: {
        search: '搜索物品',
        board: '榜单',
        window: '时间窗口',
        count: '{n} 件物品 | {n} 件物品',
      },
      boards: {
        gainers: '上涨',
        losers: '下跌',
        volume: '交易量',
      },
      categories: {
        All: '全部',
        Warframe: 'Warframe',
        Primary: '主要武器',
        Secondary: '次要武器',
        Melee: '近战武器',
        Mod: 'Mod',
        Sentinel: '哨兵',
        Companion: '同伴',
        Arcane: '赋能',
        Other: '其他',
      },
      loadError: '无法加载分析数据。市场服务可能正在启动 — 请尝试刷新。',
      empty: {
        volume: '没有物品符合这些筛选条件。',
        history:
          '还没有物品拥有 {tf} 的历史记录。涨跌榜会随着每日快照的积累而填充 — 请稍后再来查看。',
      },
      table: {
        item: '物品',
        price: '价格',
        change: '{tf} 变动',
        trend: '趋势',
        vol: 'Vol',
        history: '历史',
      },
      row: {
        vaulted: '已绝版',
        tracked: '追踪 {n} 天',
      },
      card: {
        trackedDays: '{tf} · 已追踪 {n} 天',
      },
      disclaimer:
        '变动基于我们自己的每日价格序列（平均交易价格，缺失时回退至卖单价格）计算。物品需要至少所选的历史时间窗口才能出现在涨跌榜上 — 每天同步运行时覆盖范围都会增加。',
    },
  },
  'zh-hant': {
    movers: {
      eyebrow: 'Warframe Market · 漲跌榜',
      hero: {
        title: '什麼在{pumping}，什麼在{dumping}。',
        titlePumping: '上漲',
        titleDumping: '下跌',
        lede: '基於我們自己的每日價格歷史建構的整個市場最大的價格和交易量變動 — 這是 warframe.market 的單件 90 天圖表無法向你展示的。在見頂前抓住漲勢，在反彈前抓住跌勢。',
        dealLabel: '最大漲幅 · {tf}',
        dealSub: '{price}p · vol {vol}',
      },
      stats: {
        withHistory: '有歷史記錄的物品',
        biggestGain: '最大漲幅',
        biggestDrop: '最大跌幅',
        daysHistory: '歷史天數',
      },
      filters: {
        search: '搜尋物品',
        board: '榜單',
        window: '時間視窗',
        count: '{n} 件物品 | {n} 件物品',
      },
      boards: {
        gainers: '上漲',
        losers: '下跌',
        volume: '交易量',
      },
      categories: {
        All: '全部',
        Warframe: 'Warframe',
        Primary: '主要武器',
        Secondary: '次要武器',
        Melee: '近戰武器',
        Mod: 'Mod',
        Sentinel: '哨兵',
        Companion: '同伴',
        Arcane: '賦能',
        Other: '其他',
      },
      loadError: '無法載入分析資料。市場服務可能正在啟動 — 請嘗試重新整理。',
      empty: {
        volume: '沒有物品符合這些篩選條件。',
        history:
          '還沒有物品擁有 {tf} 的歷史記錄。漲跌榜會隨著每日快照的累積而填入 — 請稍後再來查看。',
      },
      table: {
        item: '物品',
        price: '價格',
        change: '{tf} 變動',
        trend: '趨勢',
        vol: 'Vol',
        history: '歷史',
      },
      row: {
        vaulted: '已絕版',
        tracked: '追蹤 {n} 天',
      },
      card: {
        trackedDays: '{tf} · 已追蹤 {n} 天',
      },
      disclaimer:
        '變動基於我們自己的每日價格序列（平均交易價格，缺失時回退至賣單價格）計算。物品需要至少所選的歷史時間視窗才能出現在漲跌榜上 — 每天同步執行時涵蓋範圍都會增加。',
    },
  },
  pl: {
    movers: {
      eyebrow: 'Warframe Market · Największe ruchy',
      hero: {
        title: 'Co {pumping}, co {dumping}.',
        titlePumping: 'rośnie',
        titleDumping: 'spada',
        lede: 'Największe ruchy cen i wolumenu na całym rynku, zbudowane na podstawie naszej własnej dziennej historii cen — coś, czego wykres 90-dniowy dla pojedynczego przedmiotu z warframe.market nie pokaże. Złap wzrost przed szczytem albo spadek przed odbiciem.',
        dealLabel: 'Największy wzrost · {tf}',
        dealSub: '{price}p · vol {vol}',
      },
      stats: {
        withHistory: 'przedmiotów z historią',
        biggestGain: 'największy wzrost',
        biggestDrop: 'największy spadek',
        daysHistory: 'dni historii',
      },
      filters: {
        search: 'Szukaj przedmiotu',
        board: 'Tablica',
        window: 'Okno',
        count: '{n} przedmiot | {n} przedmiotów',
      },
      boards: {
        gainers: 'Wzrosty',
        losers: 'Spadki',
        volume: 'Wolumen',
      },
      categories: {
        All: 'Wszystkie',
        Warframe: 'Warframe',
        Primary: 'Główna',
        Secondary: 'Poboczna',
        Melee: 'Wręcz',
        Mod: 'Mod',
        Sentinel: 'Wartownik',
        Companion: 'Towarzysz',
        Arcane: 'Arkana',
        Other: 'Inne',
      },
      loadError: 'Nie udało się załadować analiz. Usługa rynku może się właśnie uruchamiać — spróbuj odświeżyć.',
      empty: {
        volume: 'Żaden przedmiot nie pasuje do tych filtrów.',
        history:
          'Żaden przedmiot nie ma jeszcze historii {tf}. Tablica ruchów wypełnia się w miarę gromadzenia dziennych migawek — zajrzyj wkrótce.',
      },
      table: {
        item: 'Przedmiot',
        price: 'Cena',
        change: 'Zmiana {tf}',
        trend: 'Trend',
        vol: 'Vol',
        history: 'Historia',
      },
      row: {
        vaulted: 'W SKARBCU',
        tracked: '{n}d śledzenia',
      },
      card: {
        trackedDays: '{tf} · {n} dni śledzenia',
      },
      disclaimer:
        'Zmiana jest mierzona na podstawie naszej własnej dziennej serii cen (średnia cena transakcji, z powrotem do zlecenia sprzedaży). Przedmioty potrzebują co najmniej wybranego okna historii, aby pojawić się na tablicach wzrostów/spadków — pokrycie rośnie z każdym dniem działania synchronizacji.',
    },
  },
  it: {
    movers: {
      eyebrow: 'Warframe Market · Maggiori movimenti',
      hero: {
        title: 'Cosa {pumping}, cosa {dumping}.',
        titlePumping: 'sale',
        titleDumping: 'crolla',
        lede: 'I maggiori movimenti di prezzo e volume su tutto il mercato, costruiti a partire dal nostro storico dei prezzi giornaliero — qualcosa che il grafico a 90 giorni per singolo oggetto di warframe.market non può mostrarti. Cogli un rialzo prima del picco o un ribasso prima della ripresa.',
        dealLabel: 'Maggior rialzo · {tf}',
        dealSub: '{price}p · vol {vol}',
      },
      stats: {
        withHistory: 'oggetti con storico',
        biggestGain: 'maggior rialzo',
        biggestDrop: 'maggior ribasso',
        daysHistory: 'giorni di storico',
      },
      filters: {
        search: 'Cerca un oggetto',
        board: 'Tabella',
        window: 'Finestra',
        count: '{n} oggetto | {n} oggetti',
      },
      boards: {
        gainers: 'In rialzo',
        losers: 'In ribasso',
        volume: 'Volume',
      },
      categories: {
        All: 'Tutti',
        Warframe: 'Warframe',
        Primary: 'Primaria',
        Secondary: 'Secondaria',
        Melee: 'Mischia',
        Mod: 'Mod',
        Sentinel: 'Sentinella',
        Companion: 'Compagno',
        Arcane: 'Arcano',
        Other: 'Altro',
      },
      loadError: 'Impossibile caricare le analisi. Il servizio di mercato potrebbe essere in fase di avvio — prova ad aggiornare.',
      empty: {
        volume: 'Nessun oggetto corrisponde a questi filtri.',
        history:
          'Nessun oggetto ha ancora uno storico di {tf}. La tabella dei movimenti si riempie man mano che le istantanee giornaliere si accumulano — torna presto.',
      },
      table: {
        item: 'Oggetto',
        price: 'Prezzo',
        change: 'Variazione {tf}',
        trend: 'Tendenza',
        vol: 'Vol',
        history: 'Storico',
      },
      row: {
        vaulted: 'IN CAVEAU',
        tracked: '{n}g tracciato',
      },
      card: {
        trackedDays: '{tf} · {n} giorni tracciati',
      },
      disclaimer:
        "La variazione è misurata sulla nostra serie di prezzi giornaliera (prezzo medio di scambio, con ripiego sull'ordine di vendita). Gli oggetti devono avere almeno la finestra di storico selezionata per apparire nelle tabelle dei rialzi/ribassi — la copertura cresce ogni giorno in cui viene eseguita la sincronizzazione.",
    },
  },
  uk: {
    movers: {
      eyebrow: 'Warframe Market · Лідери руху',
      hero: {
        title: 'Що {pumping}, що {dumping}.',
        titlePumping: 'зростає',
        titleDumping: 'падає',
        lede: 'Найбільші зміни ціни та обсягу на всьому ринку, побудовані на основі нашої власної щоденної історії цін — те, чого 90-денний графік для кожного предмета на warframe.market показати не може. Спіймайте зростання до піку або падіння до відновлення.',
        dealLabel: 'Найбільше зростання · {tf}',
        dealSub: '{price}p · vol {vol}',
      },
      stats: {
        withHistory: 'предметів з історією',
        biggestGain: 'найбільше зростання',
        biggestDrop: 'найбільше падіння',
        daysHistory: 'днів історії',
      },
      filters: {
        search: 'Пошук предмета',
        board: 'Список',
        window: 'Вікно',
        count: '{n} предмет | {n} предметів',
      },
      boards: {
        gainers: 'Зростання',
        losers: 'Падіння',
        volume: 'Обсяг',
      },
      categories: {
        All: 'Усі',
        Warframe: 'Warframe',
        Primary: 'Основна',
        Secondary: 'Другорядна',
        Melee: 'Ближній бій',
        Mod: 'Mod',
        Sentinel: 'Вартовий',
        Companion: 'Компаньйон',
        Arcane: 'Містифікатор',
        Other: 'Інше',
      },
      loadError: 'Не вдалося завантажити аналітику. Можливо, сервіс ринку запускається — спробуйте оновити.',
      empty: {
        volume: 'Жоден предмет не відповідає цим фільтрам.',
        history:
          'Поки що жоден предмет не має історії за {tf}. Дошка рухів заповнюється в міру накопичення щоденних знімків — завітайте пізніше.',
      },
      table: {
        item: 'Предмет',
        price: 'Ціна',
        change: 'Зміна {tf}',
        trend: 'Тренд',
        vol: 'Vol',
        history: 'Історія',
      },
      row: {
        vaulted: 'У СХОВИЩІ',
        tracked: '{n}д відстежено',
      },
      card: {
        trackedDays: '{tf} · {n} днів відстежено',
      },
      disclaimer:
        'Зміна вимірюється за нашою власною щоденною серією цін (середня ціна угоди, з поверненням до ордера на продаж). Щоб потрапити на дошки зростання/падіння, предметам потрібна щонайменше вибрана історія за період — охоплення зростає з кожним днем роботи синхронізації.',
    },
  },
}
