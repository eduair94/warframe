// Star Chart page (/star-chart). Namespaced under `starChart.*`. Follows the
// shared glossary: platinum→platino/platina, relic→reliquia/relíquia,
// drops→drops, plat/"p"→kept. Planet, node, game-mode, item and reward names
// come from the API/drop data and are NOT translated. Proper nouns kept:
// Warframe, Warframe Market, Prime, Forma, Void, Solar Rail. Only English
// chrome (hero/stats/legend/panel/find/disclaimer/a11y) is localized.
export default {
  en: {
    starChart: {
      eyebrow: 'Warframe · Origin System',
      forma: {
        toggle: 'Forma relics',
        note: 'Highlighting {n} worlds that drop a Forma relic. Dimmed worlds have none.',
        listLink: 'List every Forma relic',
        nodeTip: 'Drops a relic that contains a Forma Blueprint',
      },
      hero: {
        title: 'Where the {plat} actually is.',
        titlePlat: 'plat',
        lede: "Every planet on the Star Chart, lit by what its best mission is worth right now — drop chances from the Void, priced against today's Warframe Market. The brighter a world burns, the more platinum a single reward returns. Pick one to see the missions worth your time.",
        button3d: 'Open the 3D map',
        dealLabel: 'Richest world',
      },
      units: {
        perDrop: 'p/drop',
        perDropBest: 'p/drop best',
        vol: 'vol',
      },
      stats: {
        worldsCharted: 'worlds charted',
        bestDrop: 'best drop (p)',
        missionsPriced: 'missions priced',
        topFarmNode: 'top farm node',
      },
      loading: 'Charting the Origin System…',
      empty: {
        title: "Star chart data isn't loaded yet.",
        sub: 'Run the drop sync to populate the map, then reload.',
      },
      legend: {
        sparse: 'sparse',
        rich: 'rich (plat / run)',
        hint: 'glow = best mission value · lines = Solar Rail junctions',
      },
      a11y: {
        chart: 'Interactive star chart',
        planet: '{planet}: best run {value} platinum. {count} missions.',
      },
      panel: {
        idle: "Select a world to see what's worth farming.",
        missions: '{count} mission | {count} missions',
        wiki: 'wiki',
        interactiveMap: '{title} interactive map',
      },
      node: {
        event: 'event',
      },
      find: {
        eyebrow: 'Reverse lookup',
        title: 'Where do I farm…?',
        searchLabel: 'Search any prime part, relic or item',
        guideButton: 'Warframe farming guide',
      },
      disclaimer:
        "Expected p/drop = Σ (drop chance × realizable value) across a mission's reward table. Realizable value uses each drop's 48h average sell price, weighted by its 48h trade volume (liquidity) — so overpriced drops nobody actually buys don't inflate a mission's worth. Drop chances come from community drop data; prices and volume are from Warframe Market. Untradeable rewards (Forma, resources, credits) count as zero.",
    },
  },
  es: {
    starChart: {
      eyebrow: 'Warframe · Sistema de Origen',
      hero: {
        title: 'Dónde está realmente el {plat}.',
        titlePlat: 'plat',
        lede: 'Cada planeta del mapa estelar, iluminado por lo que vale su mejor misión ahora mismo — probabilidades de drop del Void, valoradas contra el Warframe Market de hoy. Cuanto más brilla un mundo, más platino devuelve una sola recompensa. Elige uno para ver las misiones que valen tu tiempo.',
        button3d: 'Abrir el mapa 3D',
        dealLabel: 'Mundo más rico',
      },
      units: {
        perDrop: 'p/drop',
        perDropBest: 'mejor p/drop',
        vol: 'vol',
      },
      stats: {
        worldsCharted: 'mundos trazados',
        bestDrop: 'mejor drop (p)',
        missionsPriced: 'misiones valoradas',
        topFarmNode: 'mejor nodo de farmeo',
      },
      loading: 'Trazando el Sistema de Origen…',
      empty: {
        title: 'Los datos del mapa estelar aún no están cargados.',
        sub: 'Ejecuta la sincronización de drops para poblar el mapa y luego recarga.',
      },
      legend: {
        sparse: 'escaso',
        rich: 'rico (plat / misión)',
        hint: 'brillo = mejor valor de misión · líneas = uniones del Riel Solar',
      },
      a11y: {
        chart: 'Mapa estelar interactivo',
        planet: '{planet}: mejor misión {value} platino. {count} misiones.',
      },
      panel: {
        idle: 'Selecciona un mundo para ver qué vale la pena farmear.',
        missions: '{count} misión | {count} misiones',
        wiki: 'wiki',
        interactiveMap: 'mapa interactivo de {title}',
      },
      node: {
        event: 'evento',
      },
      find: {
        eyebrow: 'Búsqueda inversa',
        title: '¿Dónde farmeo…?',
        searchLabel: 'Busca cualquier parte Prime, reliquia u objeto',
        guideButton: 'Guía de farmeo de Warframe',
      },
      disclaimer:
        'p/drop esperado = Σ (probabilidad de drop × valor realizable) en toda la tabla de recompensas de una misión. El valor realizable usa el precio de venta promedio de 48h de cada drop, ponderado por su volumen de comercio de 48h (liquidez) — así los drops sobrevalorados que nadie compra no inflan el valor de una misión. Las probabilidades de drop provienen de datos de la comunidad; los precios y el volumen son del Warframe Market. Las recompensas no comerciables (Forma, recursos, créditos) cuentan como cero.',
    },
  },
  pt: {
    starChart: {
      eyebrow: 'Warframe · Sistema de Origem',
      hero: {
        title: 'Onde a {plat} realmente está.',
        titlePlat: 'plat',
        lede: 'Cada planeta do mapa estelar, iluminado pelo que sua melhor missão vale agora — chances de drop do Void, precificadas com o Warframe Market de hoje. Quanto mais brilha um mundo, mais platina uma única recompensa retorna. Escolha um para ver as missões que valem seu tempo.',
        button3d: 'Abrir o mapa 3D',
        dealLabel: 'Mundo mais rico',
      },
      units: {
        perDrop: 'p/drop',
        perDropBest: 'melhor p/drop',
        vol: 'vol',
      },
      stats: {
        worldsCharted: 'mundos mapeados',
        bestDrop: 'melhor drop (p)',
        missionsPriced: 'missões precificadas',
        topFarmNode: 'melhor nó de farm',
      },
      loading: 'Mapeando o Sistema de Origem…',
      empty: {
        title: 'Os dados do mapa estelar ainda não foram carregados.',
        sub: 'Rode a sincronização de drops para preencher o mapa e recarregue.',
      },
      legend: {
        sparse: 'escasso',
        rich: 'rico (plat / missão)',
        hint: 'brilho = melhor valor de missão · linhas = junções do Trilho Solar',
      },
      a11y: {
        chart: 'Mapa estelar interativo',
        planet: '{planet}: melhor missão {value} platina. {count} missões.',
      },
      panel: {
        idle: 'Selecione um mundo para ver o que vale a pena farmar.',
        missions: '{count} missão | {count} missões',
        wiki: 'wiki',
        interactiveMap: 'mapa interativo de {title}',
      },
      node: {
        event: 'evento',
      },
      find: {
        eyebrow: 'Busca reversa',
        title: 'Onde eu farmo…?',
        searchLabel: 'Busque qualquer peça Prime, relíquia ou item',
        guideButton: 'Guia de farm de Warframe',
      },
      disclaimer:
        'p/drop esperado = Σ (chance de drop × valor realizável) em toda a tabela de recompensas de uma missão. O valor realizável usa o preço médio de venda de 48h de cada drop, ponderado pelo seu volume de comércio de 48h (liquidez) — assim os drops supervalorizados que ninguém compra não inflam o valor de uma missão. As chances de drop vêm de dados da comunidade; os preços e o volume são do Warframe Market. As recompensas não comercializáveis (Forma, recursos, créditos) contam como zero.',
    },
  },
  de: {
    starChart: {
      eyebrow: 'Warframe · Ursprungssystem',
      hero: {
        title: 'Wo das {plat} wirklich ist.',
        titlePlat: 'Platin',
        lede: 'Jeder Planet der Sternenkarte, erleuchtet von dem, was seine beste Mission gerade wert ist — Drop-Chancen aus dem Void, bewertet am heutigen Warframe Market. Je heller eine Welt brennt, desto mehr Platin bringt eine einzige Belohnung. Wähle eine aus, um die Missionen zu sehen, die deine Zeit wert sind.',
        button3d: 'Die 3D-Karte öffnen',
        dealLabel: 'Reichste Welt',
      },
      units: {
        perDrop: 'p/drop',
        perDropBest: 'bester p/drop',
        vol: 'vol',
      },
      stats: {
        worldsCharted: 'kartierte Welten',
        bestDrop: 'bester Drop (p)',
        missionsPriced: 'bewertete Missionen',
        topFarmNode: 'bester Farm-Knoten',
      },
      loading: 'Das Ursprungssystem wird kartiert…',
      empty: {
        title: 'Die Sternenkarten-Daten sind noch nicht geladen.',
        sub: 'Führe die Drop-Synchronisierung aus, um die Karte zu füllen, und lade dann neu.',
      },
      legend: {
        sparse: 'spärlich',
        rich: 'reich (Platin / Runde)',
        hint: 'Leuchten = bester Missionswert · Linien = Solarschienen-Verbindungen',
      },
      a11y: {
        chart: 'Interaktive Sternenkarte',
        planet: '{planet}: beste Runde {value} Platin. {count} Missionen.',
      },
      panel: {
        idle: 'Wähle eine Welt, um zu sehen, was sich zu farmen lohnt.',
        missions: '{count} Mission | {count} Missionen',
        wiki: 'wiki',
        interactiveMap: 'interaktive Karte von {title}',
      },
      node: {
        event: 'Event',
      },
      find: {
        eyebrow: 'Rückwärtssuche',
        title: 'Wo farme ich…?',
        searchLabel: 'Suche ein beliebiges Prime-Teil, ein Relikt oder einen Gegenstand',
        guideButton: 'Warframe-Farm-Guide',
      },
      disclaimer:
        'Erwarteter p/drop = Σ (Drop-Chance × realisierbarer Wert) über die gesamte Belohnungstabelle einer Mission. Der realisierbare Wert nutzt den 48-Stunden-Durchschnittsverkaufspreis jedes Drops, gewichtet nach seinem 48-Stunden-Handelsvolumen (Liquidität) — so blähen überteuerte Drops, die niemand tatsächlich kauft, den Wert einer Mission nicht auf. Die Drop-Chancen stammen aus Community-Drop-Daten; Preise und Volumen kommen vom Warframe Market. Nicht handelbare Belohnungen (Forma, Ressourcen, Credits) zählen als null.',
    },
  },
  fr: {
    starChart: {
      eyebrow: "Warframe · Système d'Origine",
      hero: {
        title: 'Où est vraiment le {plat}.',
        titlePlat: 'platine',
        lede: "Chaque planète de la carte stellaire, illuminée par ce que vaut sa meilleure mission en ce moment — les chances de drop du Void, évaluées face au Warframe Market d'aujourd'hui. Plus un monde brille, plus une seule récompense rapporte de platine. Choisissez-en un pour voir les missions qui valent votre temps.",
        button3d: 'Ouvrir la carte 3D',
        dealLabel: 'Monde le plus riche',
      },
      units: {
        perDrop: 'p/drop',
        perDropBest: 'meilleur p/drop',
        vol: 'vol',
      },
      stats: {
        worldsCharted: 'mondes cartographiés',
        bestDrop: 'meilleur drop (p)',
        missionsPriced: 'missions évaluées',
        topFarmNode: 'meilleur nœud de farm',
      },
      loading: "Cartographie du Système d'Origine…",
      empty: {
        title: 'Les données de la carte stellaire ne sont pas encore chargées.',
        sub: 'Lancez la synchronisation des drops pour remplir la carte, puis rechargez.',
      },
      legend: {
        sparse: 'pauvre',
        rich: 'riche (platine / partie)',
        hint: 'lueur = meilleure valeur de mission · lignes = jonctions du Rail Solaire',
      },
      a11y: {
        chart: 'Carte stellaire interactive',
        planet: '{planet} : meilleure partie {value} platine. {count} missions.',
      },
      panel: {
        idle: "Sélectionnez un monde pour voir ce qui vaut la peine d'être farmé.",
        missions: '{count} mission | {count} missions',
        wiki: 'wiki',
        interactiveMap: 'carte interactive de {title}',
      },
      node: {
        event: 'événement',
      },
      find: {
        eyebrow: 'Recherche inversée',
        title: 'Où farmer…?',
        searchLabel: 'Cherchez une pièce Prime, une relique ou un objet',
        guideButton: 'Guide de farm Warframe',
      },
      disclaimer:
        "p/drop attendu = Σ (chance de drop × valeur réalisable) sur toute la table de récompenses d'une mission. La valeur réalisable utilise le prix de vente moyen sur 48 h de chaque drop, pondéré par son volume d'échange sur 48 h (liquidité) — ainsi les drops surévalués que personne n'achète vraiment ne gonflent pas la valeur d'une mission. Les chances de drop proviennent des données de la communauté ; les prix et le volume viennent du Warframe Market. Les récompenses non échangeables (Forma, ressources, crédits) comptent pour zéro.",
    },
  },
  ru: {
    starChart: {
      eyebrow: 'Warframe · Система Происхождения',
      hero: {
        title: 'Где на самом деле {plat}.',
        titlePlat: 'платина',
        lede: 'Каждая планета звёздной карты, освещённая тем, сколько стоит её лучшая миссия прямо сейчас — шансы дропа из Void, оценённые по актуальному Warframe Market. Чем ярче горит мир, тем больше платины приносит одна награда. Выберите планету, чтобы увидеть миссии, достойные вашего времени.',
        button3d: 'Открыть 3D-карту',
        dealLabel: 'Богатейший мир',
      },
      units: {
        perDrop: 'p/drop',
        perDropBest: 'лучший p/drop',
        vol: 'vol',
      },
      stats: {
        worldsCharted: 'миров нанесено',
        bestDrop: 'лучший дроп (p)',
        missionsPriced: 'миссий оценено',
        topFarmNode: 'лучший узел для фарма',
      },
      loading: 'Картографирование Системы Происхождения…',
      empty: {
        title: 'Данные звёздной карты ещё не загружены.',
        sub: 'Запустите синхронизацию дропа, чтобы заполнить карту, затем перезагрузите.',
      },
      legend: {
        sparse: 'скудно',
        rich: 'богато (платина / забег)',
        hint: 'свечение = лучшая ценность миссии · линии = переходы Солнечного рельса',
      },
      a11y: {
        chart: 'Интерактивная звёздная карта',
        planet: '{planet}: лучший забег {value} платины. {count} миссий.',
      },
      panel: {
        idle: 'Выберите мир, чтобы увидеть, что стоит фармить.',
        missions: '{count} миссия | {count} миссий',
        wiki: 'wiki',
        interactiveMap: 'интерактивная карта: {title}',
      },
      node: {
        event: 'событие',
      },
      find: {
        eyebrow: 'Обратный поиск',
        title: 'Где мне фармить…?',
        searchLabel: 'Ищите любую часть Prime, реликвию или предмет',
        guideButton: 'Гайд по фарму Warframe',
      },
      disclaimer:
        'Ожидаемый p/drop = Σ (шанс дропа × реализуемая ценность) по всей таблице наград миссии. Реализуемая ценность использует среднюю цену продажи каждого дропа за 48 ч, взвешенную по его торговому объёму за 48 ч (ликвидность) — так переоценённые дропы, которые никто на самом деле не покупает, не раздувают ценность миссии. Шансы дропа берутся из данных сообщества; цены и объём — из Warframe Market. Непродаваемые награды (Forma, ресурсы, кредиты) считаются как ноль.',
    },
  },
  ko: {
    starChart: {
      eyebrow: 'Warframe · 기원 시스템',
      hero: {
        title: '{plat}이 진짜 모이는 곳.',
        titlePlat: '플래티넘',
        lede: '스타 차트의 모든 행성을, 지금 가장 값진 임무의 가치로 밝힙니다 — Void의 드랍 확률을 오늘의 Warframe Market 시세로 환산했습니다. 행성이 밝게 빛날수록 하나의 보상이 더 많은 플래티넘을 돌려줍니다. 하나를 골라 시간을 들일 만한 임무를 확인하세요.',
        button3d: '3D 지도 열기',
        dealLabel: '가장 부유한 행성',
      },
      units: {
        perDrop: 'p/drop',
        perDropBest: '최고 p/drop',
        vol: 'vol',
      },
      stats: {
        worldsCharted: '기록된 행성',
        bestDrop: '최고 드랍 (p)',
        missionsPriced: '가치 산정된 임무',
        topFarmNode: '최고 파밍 노드',
      },
      loading: '기원 시스템을 기록하는 중…',
      empty: {
        title: '스타 차트 데이터가 아직 로드되지 않았습니다.',
        sub: '드랍 동기화를 실행해 지도를 채운 뒤 다시 로드하세요.',
      },
      legend: {
        sparse: '희박',
        rich: '풍부 (플래티넘 / 판)',
        hint: '광채 = 최고 임무 가치 · 선 = Solar Rail 정션',
      },
      a11y: {
        chart: '인터랙티브 스타 차트',
        planet: '{planet}: 최고 판 {value} 플래티넘. 임무 {count}개.',
      },
      panel: {
        idle: '파밍할 가치가 있는 것을 보려면 행성을 선택하세요.',
        missions: '{count}개 임무 | {count}개 임무',
        wiki: 'wiki',
        interactiveMap: '{title} 인터랙티브 지도',
      },
      node: {
        event: '이벤트',
      },
      find: {
        eyebrow: '역방향 검색',
        title: '어디서 파밍하지…?',
        searchLabel: 'Prime 부품, 렐릭 또는 아이템 검색',
        guideButton: 'Warframe 파밍 가이드',
      },
      disclaimer:
        '예상 p/drop = Σ (드랍 확률 × 실현 가능 가치), 임무의 전체 보상 테이블 기준. 실현 가능 가치는 각 드랍의 48시간 평균 판매가를 48시간 거래량(유동성)으로 가중한 값입니다 — 그래서 아무도 실제로 사지 않는 고평가 드랍이 임무 가치를 부풀리지 않습니다. 드랍 확률은 커뮤니티 드랍 데이터에서, 가격과 거래량은 Warframe Market에서 가져옵니다. 거래 불가 보상(Forma, 자원, 크레딧)은 0으로 계산합니다.',
    },
  },
  ja: {
    starChart: {
      eyebrow: 'Warframe · 起源系',
      hero: {
        title: '{plat}が本当にある場所。',
        titlePlat: 'プラチナ',
        lede: 'スターチャートのすべての惑星を、今もっとも価値のあるミッションの価値で照らします — Voidのドロップ確率を、今日のWarframe Marketの相場で換算しています。惑星が明るく輝くほど、ひとつの報酬で得られるプラチナは多くなります。ひとつ選んで、時間をかける価値のあるミッションを確認しましょう。',
        button3d: '3Dマップを開く',
        dealLabel: '最も豊かな惑星',
      },
      units: {
        perDrop: 'p/drop',
        perDropBest: '最高 p/drop',
        vol: 'vol',
      },
      stats: {
        worldsCharted: '記録された惑星',
        bestDrop: '最高ドロップ (p)',
        missionsPriced: '価格算定済みミッション',
        topFarmNode: '最高の周回ノード',
      },
      loading: '起源系を記録中…',
      empty: {
        title: 'スターチャートのデータがまだ読み込まれていません。',
        sub: 'ドロップ同期を実行してマップを生成し、再読み込みしてください。',
      },
      legend: {
        sparse: '希薄',
        rich: '豊富 (プラチナ / 周回)',
        hint: '輝き = 最高のミッション価値 · 線 = Solar Railのジャンクション',
      },
      a11y: {
        chart: 'インタラクティブなスターチャート',
        planet: '{planet}: 最高周回 {value} プラチナ。ミッション{count}件。',
      },
      panel: {
        idle: '周回する価値があるものを見るには惑星を選択してください。',
        missions: '{count}ミッション | {count}ミッション',
        wiki: 'wiki',
        interactiveMap: '{title}のインタラクティブマップ',
      },
      node: {
        event: 'イベント',
      },
      find: {
        eyebrow: '逆引き検索',
        title: 'どこで周回する…？',
        searchLabel: 'Prime パーツ、レリック、アイテムを検索',
        guideButton: 'Warframe 周回ガイド',
      },
      disclaimer:
        '期待 p/drop = Σ (ドロップ確率 × 実現可能価値)、ミッションの報酬テーブル全体で算出。実現可能価値は各ドロップの48時間平均販売価格を、48時間の取引量(流動性)で加重した値です — そのため、誰も実際には買わない過大評価のドロップがミッションの価値を水増しすることはありません。ドロップ確率はコミュニティのドロップデータから、価格と取引量はWarframe Marketから取得しています。取引不可の報酬(Forma、リソース、クレジット)はゼロとして計算します。',
    },
  },
  'zh-hans': {
    starChart: {
      eyebrow: 'Warframe · 起源星系',
      hero: {
        title: '{plat}究竟在哪里。',
        titlePlat: '白金',
        lede: '星图上的每一颗行星，都由它当前最有价值的任务点亮 — Void 的掉落几率，按今日 Warframe Market 的行情计价。世界燃烧得越亮，单次奖励返还的白金就越多。选择一颗，查看值得你花时间的任务。',
        button3d: '打开 3D 地图',
        dealLabel: '最富有的世界',
      },
      units: {
        perDrop: 'p/drop',
        perDropBest: '最佳 p/drop',
        vol: 'vol',
      },
      stats: {
        worldsCharted: '已绘制世界',
        bestDrop: '最佳掉落 (p)',
        missionsPriced: '已计价任务',
        topFarmNode: '最佳刷取节点',
      },
      loading: '正在绘制起源星系…',
      empty: {
        title: '星图数据尚未加载。',
        sub: '运行掉落同步以填充地图，然后重新加载。',
      },
      legend: {
        sparse: '稀疏',
        rich: '丰富 (白金 / 场)',
        hint: '辉光 = 最佳任务价值 · 连线 = Solar Rail 星际航道',
      },
      a11y: {
        chart: '交互式星图',
        planet: '{planet}：最佳单场 {value} 白金。{count} 个任务。',
      },
      panel: {
        idle: '选择一个世界，查看有什么值得刷取。',
        missions: '{count} 个任务 | {count} 个任务',
        wiki: 'wiki',
        interactiveMap: '{title} 交互式地图',
      },
      node: {
        event: '活动',
      },
      find: {
        eyebrow: '反向查找',
        title: '我该去哪刷…？',
        searchLabel: '搜索任意 Prime 部件、遗物或物品',
        guideButton: 'Warframe 刷取指南',
      },
      disclaimer:
        '预期 p/drop = Σ (掉落几率 × 可变现价值)，覆盖任务的整个奖励表。可变现价值采用每个掉落的 48 小时平均售价，并按其 48 小时交易量(流动性)加权 — 这样一来，没人真正购买的高价掉落不会虚增任务价值。掉落几率来自社区掉落数据；价格和交易量来自 Warframe Market。不可交易的奖励(Forma、资源、现金)按零计算。',
    },
  },
  'zh-hant': {
    starChart: {
      eyebrow: 'Warframe · 起源星系',
      hero: {
        title: '{plat}究竟在哪裡。',
        titlePlat: '白金',
        lede: '星圖上的每一顆行星，都由它當前最有價值的任務點亮 — Void 的掉落機率，按今日 Warframe Market 的行情計價。世界燃燒得越亮，單次獎勵返還的白金就越多。選擇一顆，查看值得你花時間的任務。',
        button3d: '開啟 3D 地圖',
        dealLabel: '最富有的世界',
      },
      units: {
        perDrop: 'p/drop',
        perDropBest: '最佳 p/drop',
        vol: 'vol',
      },
      stats: {
        worldsCharted: '已繪製世界',
        bestDrop: '最佳掉落 (p)',
        missionsPriced: '已計價任務',
        topFarmNode: '最佳刷取節點',
      },
      loading: '正在繪製起源星系…',
      empty: {
        title: '星圖資料尚未載入。',
        sub: '執行掉落同步以填充地圖，然後重新載入。',
      },
      legend: {
        sparse: '稀疏',
        rich: '豐富 (白金 / 場)',
        hint: '輝光 = 最佳任務價值 · 連線 = Solar Rail 星際航道',
      },
      a11y: {
        chart: '互動式星圖',
        planet: '{planet}：最佳單場 {value} 白金。{count} 個任務。',
      },
      panel: {
        idle: '選擇一個世界，查看有什麼值得刷取。',
        missions: '{count} 個任務 | {count} 個任務',
        wiki: 'wiki',
        interactiveMap: '{title} 互動式地圖',
      },
      node: {
        event: '活動',
      },
      find: {
        eyebrow: '反向查找',
        title: '我該去哪刷…？',
        searchLabel: '搜尋任意 Prime 部件、遺物或物品',
        guideButton: 'Warframe 刷取指南',
      },
      disclaimer:
        '預期 p/drop = Σ (掉落機率 × 可變現價值)，涵蓋任務的整個獎勵表。可變現價值採用每個掉落的 48 小時平均售價，並按其 48 小時交易量(流動性)加權 — 這樣一來，沒人真正購買的高價掉落不會虛增任務價值。掉落機率來自社群掉落資料；價格和交易量來自 Warframe Market。不可交易的獎勵(Forma、資源、現金)按零計算。',
    },
  },
  pl: {
    starChart: {
      eyebrow: 'Warframe · Układ Pochodzenia',
      hero: {
        title: 'Gdzie naprawdę jest {plat}.',
        titlePlat: 'platyna',
        lede: 'Każda planeta na mapie gwiezdnej, rozświetlona wartością swojej najlepszej misji w tej chwili — szanse na drop z Void, wycenione według dzisiejszego Warframe Market. Im jaśniej płonie świat, tym więcej platyny zwraca pojedyncza nagroda. Wybierz jedną, by zobaczyć misje warte twojego czasu.',
        button3d: 'Otwórz mapę 3D',
        dealLabel: 'Najbogatszy świat',
      },
      units: {
        perDrop: 'p/drop',
        perDropBest: 'najlepszy p/drop',
        vol: 'vol',
      },
      stats: {
        worldsCharted: 'zmapowane światy',
        bestDrop: 'najlepszy drop (p)',
        missionsPriced: 'wycenione misje',
        topFarmNode: 'najlepszy węzeł do farmienia',
      },
      loading: 'Mapowanie Układu Pochodzenia…',
      empty: {
        title: 'Dane mapy gwiezdnej nie zostały jeszcze wczytane.',
        sub: 'Uruchom synchronizację dropów, aby wypełnić mapę, a następnie odśwież.',
      },
      legend: {
        sparse: 'ubogi',
        rich: 'bogaty (platyna / bieg)',
        hint: 'poświata = najlepsza wartość misji · linie = połączenia Kolei Słonecznej',
      },
      a11y: {
        chart: 'Interaktywna mapa gwiezdna',
        planet: '{planet}: najlepszy bieg {value} platyny. {count} misji.',
      },
      panel: {
        idle: 'Wybierz świat, aby zobaczyć, co warto farmić.',
        missions: '{count} misja | {count} misji',
        wiki: 'wiki',
        interactiveMap: 'interaktywna mapa: {title}',
      },
      node: {
        event: 'wydarzenie',
      },
      find: {
        eyebrow: 'Wyszukiwanie odwrotne',
        title: 'Gdzie farmić…?',
        searchLabel: 'Wyszukaj dowolną część Prime, relikt lub przedmiot',
        guideButton: 'Poradnik farmienia Warframe',
      },
      disclaimer:
        'Oczekiwany p/drop = Σ (szansa na drop × wartość możliwa do zrealizowania) w całej tabeli nagród misji. Wartość możliwa do zrealizowania korzysta ze średniej ceny sprzedaży każdego dropu z 48 h, ważonej jego wolumenem handlu z 48 h (płynność) — dzięki temu zawyżone dropy, których nikt naprawdę nie kupuje, nie zawyżają wartości misji. Szanse na drop pochodzą z danych społeczności; ceny i wolumen są z Warframe Market. Nagrody niehandlowe (Forma, surowce, kredyty) liczą się jako zero.',
    },
  },
  it: {
    starChart: {
      eyebrow: 'Warframe · Sistema Origine',
      hero: {
        title: 'Dove si trova davvero il {plat}.',
        titlePlat: 'platino',
        lede: 'Ogni pianeta della mappa stellare, illuminato da quanto vale la sua missione migliore in questo momento — probabilità di drop dal Void, valutate sul Warframe Market di oggi. Più un mondo brilla, più platino restituisce una singola ricompensa. Scegline uno per vedere le missioni che valgono il tuo tempo.',
        button3d: 'Apri la mappa 3D',
        dealLabel: 'Mondo più ricco',
      },
      units: {
        perDrop: 'p/drop',
        perDropBest: 'miglior p/drop',
        vol: 'vol',
      },
      stats: {
        worldsCharted: 'mondi mappati',
        bestDrop: 'miglior drop (p)',
        missionsPriced: 'missioni valutate',
        topFarmNode: 'miglior nodo di farming',
      },
      loading: 'Mappatura del Sistema Origine…',
      empty: {
        title: 'I dati della mappa stellare non sono ancora caricati.',
        sub: 'Esegui la sincronizzazione dei drop per popolare la mappa, poi ricarica.',
      },
      legend: {
        sparse: 'scarso',
        rich: 'ricco (platino / run)',
        hint: 'bagliore = miglior valore missione · linee = giunzioni della Rotaia Solare',
      },
      a11y: {
        chart: 'Mappa stellare interattiva',
        planet: '{planet}: miglior run {value} platino. {count} missioni.',
      },
      panel: {
        idle: 'Seleziona un mondo per vedere cosa vale la pena farmare.',
        missions: '{count} missione | {count} missioni',
        wiki: 'wiki',
        interactiveMap: 'mappa interattiva di {title}',
      },
      node: {
        event: 'evento',
      },
      find: {
        eyebrow: 'Ricerca inversa',
        title: 'Dove faccio farming…?',
        searchLabel: 'Cerca qualsiasi parte Prime, reliquia od oggetto',
        guideButton: 'Guida al farming di Warframe',
      },
      disclaimer:
        "p/drop atteso = Σ (probabilità di drop × valore realizzabile) sull'intera tabella delle ricompense di una missione. Il valore realizzabile usa il prezzo medio di vendita a 48h di ciascun drop, ponderato per il suo volume di scambi a 48h (liquidità) — così i drop sopravvalutati che nessuno compra davvero non gonfiano il valore di una missione. Le probabilità di drop provengono dai dati della community; i prezzi e il volume sono dal Warframe Market. Le ricompense non scambiabili (Forma, risorse, crediti) contano come zero.",
    },
  },
  uk: {
    starChart: {
      eyebrow: 'Warframe · Система Походження',
      hero: {
        title: 'Де насправді {plat}.',
        titlePlat: 'платина',
        lede: 'Кожна планета зоряної карти, освітлена тим, скільки коштує її найкраща місія просто зараз — шанси дропу з Void, оцінені за сьогоднішнім Warframe Market. Що яскравіше палає світ, то більше платини приносить одна нагорода. Оберіть планету, щоб побачити місії, варті вашого часу.',
        button3d: 'Відкрити 3D-карту',
        dealLabel: 'Найбагатший світ',
      },
      units: {
        perDrop: 'p/drop',
        perDropBest: 'найкращий p/drop',
        vol: 'vol',
      },
      stats: {
        worldsCharted: 'світів нанесено',
        bestDrop: 'найкращий дроп (p)',
        missionsPriced: 'місій оцінено',
        topFarmNode: 'найкращий вузол для фарму',
      },
      loading: 'Картографування Системи Походження…',
      empty: {
        title: 'Дані зоряної карти ще не завантажені.',
        sub: 'Запустіть синхронізацію дропу, щоб заповнити карту, потім перезавантажте.',
      },
      legend: {
        sparse: 'мізерно',
        rich: 'багато (платина / забіг)',
        hint: 'сяйво = найкраща цінність місії · лінії = переходи Сонячної рейки',
      },
      a11y: {
        chart: 'Інтерактивна зоряна карта',
        planet: '{planet}: найкращий забіг {value} платини. {count} місій.',
      },
      panel: {
        idle: 'Оберіть світ, щоб побачити, що варто фармити.',
        missions: '{count} місія | {count} місій',
        wiki: 'wiki',
        interactiveMap: 'інтерактивна карта: {title}',
      },
      node: {
        event: 'подія',
      },
      find: {
        eyebrow: 'Зворотний пошук',
        title: 'Де мені фармити…?',
        searchLabel: 'Шукайте будь-яку частину Prime, реліквію чи предмет',
        guideButton: 'Гайд із фарму Warframe',
      },
      disclaimer:
        'Очікуваний p/drop = Σ (шанс дропу × реалізовувана цінність) по всій таблиці нагород місії. Реалізовувана цінність використовує середню ціну продажу кожного дропу за 48 год, зважену за його торговим обсягом за 48 год (ліквідність) — тож переоцінені дропи, які насправді ніхто не купує, не роздувають цінність місії. Шанси дропу беруться з даних спільноти; ціни та обсяг — з Warframe Market. Непродавані нагороди (Forma, ресурси, кредити) рахуються як нуль.',
    },
  },
}
