// Riven Fair Value page (/riven-value). Namespaced under `rivenValue.*`. Follows
// the shared glossary: platinum→platino/platina, "plat"/"p" kept, buy→compra.
// Proper nouns kept untranslated: Warframe, Riven, MR (mastery rank), Endo,
// "god roll" (community term). Weapon/stat attribute names come from the API and
// are formatted client-side (attrLabel) — never translated. Grade letters
// (S/A/B/C/D/F), owner status values, numbers and the "×" disposition symbol
// are data/symbols, not copy.
export default {
  en: {
    rivenValue: {
      eyebrow: 'Warframe Market · Riven Fair Value',
      hero: {
        title: "What's {myRoll} {worth}?",
        titleMyRoll: 'my roll',
        titleWorth: 'worth',
        lede: 'Rivens are random, so warframe.market gives you raw listings and no price. Pick a weapon, tick the stats your riven rolled, and we estimate a fair plat range from the live auction corpus — then grade every listing against the field so you can spot a god roll or a deal.',
        dealLabel: 'Estimated fair value',
        range: '{low}–{high}p range',
        comparables: '{n} comparable | {n} comparables',
        approxSuffix: ' · approx',
      },
      filters: {
        chooseWeapon: 'Choose a weapon',
      },
      meta: {
        disposition: 'Disposition',
        auctions: 'Auctions',
      },
      states: {
        loadError: "Couldn't load riven weapons. The market service may be waking up — try a refresh.",
        pickWeapon: "Pick a weapon above to estimate a riven's value and grade the live listings.",
        loading: 'Loading auctions…',
        noAuctions: 'No live direct-sale auctions stored for this weapon right now. Try another weapon.',
      },
      estimator: {
        title: 'Tick the stats your riven rolled',
        positives: 'Positives',
        negativeOptional: 'Negative (optional)',
        anyNone: 'Any / none',
      },
      estimate: {
        fairValueRange: 'fair value · range {low}–{high}p',
        fromComparables: 'from {n} comparable | from {n} comparables',
        approxNote: ' (few exact matches — approximate)',
        cheapest: 'Cheapest listed: {price}',
        belowFair: '↓ below fair value',
        emptyNoMatch: 'No comparable auctions with those exact stats — untick one to widen the match.',
        emptySelect: 'Select at least one positive stat to get an estimate.',
      },
      list: {
        title: 'Live listings, graded',
        count: '{n} auction · sorted by price | {n} auctions · sorted by price',
      },
      table: {
        stats: 'Stats',
        grade: 'Grade',
        rolls: 'Rolls',
        buyout: 'Buyout',
        seller: 'Seller',
      },
      badge: {
        deal: 'DEAL',
      },
      card: {
        sub: '{rolls} rolls · MR{mr} · {status}',
      },
      disclaimer: {
        text: "Estimates come from stored direct-sale auctions (rolled rivens, 50+ re-rolls). The grade is each roll's positive-stat percentile {within} (A = top of the field) — a relative read, not an absolute god-roll score, since base stat ranges aren't modelled. Higher disposition ({disp}) means bigger stat numbers overall.",
        within: "within this weapon's current listings",
        shownAbove: 'shown above',
      },
    },
  },
  es: {
    rivenValue: {
      eyebrow: 'Warframe Market · Valor Justo del Riven',
      hero: {
        title: '¿Cuánto {worth} {myRoll}?',
        titleMyRoll: 'mi tirada',
        titleWorth: 'vale',
        lede: 'Los Rivens son aleatorios, así que warframe.market te da listados en bruto y ningún precio. Elige un arma, marca las estadísticas que sacó tu riven y estimamos un rango justo de plat a partir del corpus de subastas en vivo — luego calificamos cada listado frente al conjunto para que detectes un god roll o una oferta.',
        dealLabel: 'Valor justo estimado',
        range: 'rango {low}–{high}p',
        comparables: '{n} comparable | {n} comparables',
        approxSuffix: ' · aprox.',
      },
      filters: {
        chooseWeapon: 'Elige un arma',
      },
      meta: {
        disposition: 'Disposición',
        auctions: 'Subastas',
      },
      states: {
        loadError: 'No se pudieron cargar las armas con riven. El servicio de mercado puede estar despertando — prueba a recargar.',
        pickWeapon: 'Elige un arma arriba para estimar el valor de un riven y calificar los listados en vivo.',
        loading: 'Cargando subastas…',
        noAuctions: 'No hay subastas de venta directa en vivo guardadas para esta arma ahora mismo. Prueba con otra arma.',
      },
      estimator: {
        title: 'Marca las estadísticas que sacó tu riven',
        positives: 'Positivas',
        negativeOptional: 'Negativa (opcional)',
        anyNone: 'Cualquiera / ninguna',
      },
      estimate: {
        fairValueRange: 'valor justo · rango {low}–{high}p',
        fromComparables: 'de {n} comparable | de {n} comparables',
        approxNote: ' (pocas coincidencias exactas — aproximado)',
        cheapest: 'Más barato listado: {price}',
        belowFair: '↓ bajo el valor justo',
        emptyNoMatch: 'No hay subastas comparables con esas estadísticas exactas — desmarca una para ampliar la coincidencia.',
        emptySelect: 'Selecciona al menos una estadística positiva para obtener una estimación.',
      },
      list: {
        title: 'Listados en vivo, calificados',
        count: '{n} subasta · ordenadas por precio | {n} subastas · ordenadas por precio',
      },
      table: {
        stats: 'Estadísticas',
        grade: 'Nota',
        rolls: 'Tiradas',
        buyout: 'Compra directa',
        seller: 'Vendedor',
      },
      badge: {
        deal: 'OFERTA',
      },
      card: {
        sub: '{rolls} tiradas · MR{mr} · {status}',
      },
      disclaimer: {
        text: 'Las estimaciones provienen de subastas de venta directa guardadas (rivens ya tirados, más de 50 re-tiradas). La nota es el percentil de estadísticas positivas de cada tirada {within} (A = lo mejor del conjunto) — una lectura relativa, no una puntuación absoluta de god roll, ya que no se modelan los rangos de estadísticas base. Una disposición más alta ({disp}) implica números de estadísticas más grandes en general.',
        within: 'dentro de los listados actuales de esta arma',
        shownAbove: 'mostrada arriba',
      },
    },
  },
  pt: {
    rivenValue: {
      eyebrow: 'Warframe Market · Valor Justo do Riven',
      hero: {
        title: 'Quanto {worth} {myRoll}?',
        titleMyRoll: 'minha rolagem',
        titleWorth: 'vale',
        lede: 'Rivens são aleatórios, então o warframe.market te dá listagens cruas e nenhum preço. Escolha uma arma, marque os atributos que seu riven tirou e estimamos uma faixa justa de plat a partir do corpus de leilões ao vivo — depois avaliamos cada listagem frente ao conjunto para você achar um god roll ou uma oferta.',
        dealLabel: 'Valor justo estimado',
        range: 'faixa {low}–{high}p',
        comparables: '{n} comparável | {n} comparáveis',
        approxSuffix: ' · aprox.',
      },
      filters: {
        chooseWeapon: 'Escolha uma arma',
      },
      meta: {
        disposition: 'Disposição',
        auctions: 'Leilões',
      },
      states: {
        loadError: 'Não foi possível carregar as armas com riven. O serviço de mercado pode estar acordando — tente atualizar.',
        pickWeapon: 'Escolha uma arma acima para estimar o valor de um riven e avaliar as listagens ao vivo.',
        loading: 'Carregando leilões…',
        noAuctions: 'Nenhum leilão de venda direta ao vivo armazenado para esta arma no momento. Tente outra arma.',
      },
      estimator: {
        title: 'Marque os atributos que seu riven tirou',
        positives: 'Positivos',
        negativeOptional: 'Negativo (opcional)',
        anyNone: 'Qualquer / nenhum',
      },
      estimate: {
        fairValueRange: 'valor justo · faixa {low}–{high}p',
        fromComparables: 'de {n} comparável | de {n} comparáveis',
        approxNote: ' (poucas correspondências exatas — aproximado)',
        cheapest: 'Mais barato listado: {price}',
        belowFair: '↓ abaixo do valor justo',
        emptyNoMatch: 'Nenhum leilão comparável com esses atributos exatos — desmarque um para ampliar a correspondência.',
        emptySelect: 'Selecione ao menos um atributo positivo para obter uma estimativa.',
      },
      list: {
        title: 'Listagens ao vivo, avaliadas',
        count: '{n} leilão · ordenados por preço | {n} leilões · ordenados por preço',
      },
      table: {
        stats: 'Atributos',
        grade: 'Nota',
        rolls: 'Rolagens',
        buyout: 'Compra direta',
        seller: 'Vendedor',
      },
      badge: {
        deal: 'OFERTA',
      },
      card: {
        sub: '{rolls} rolagens · MR{mr} · {status}',
      },
      disclaimer: {
        text: 'As estimativas vêm de leilões de venda direta armazenados (rivens já tirados, mais de 50 re-rolagens). A nota é o percentil de atributos positivos de cada rolagem {within} (A = o topo do conjunto) — uma leitura relativa, não uma pontuação absoluta de god roll, já que as faixas de atributos base não são modeladas. Uma disposição mais alta ({disp}) significa números de atributos maiores no geral.',
        within: 'dentro das listagens atuais desta arma',
        shownAbove: 'mostrada acima',
      },
    },
  },
  de: {
    rivenValue: {
      eyebrow: 'Warframe Market · Fairer Riven-Wert',
      hero: {
        title: 'Was ist {myRoll} {worth}?',
        titleMyRoll: 'mein Wurf',
        titleWorth: 'wert',
        lede: 'Rivens sind zufällig, daher gibt dir warframe.market nur rohe Angebote und keinen Preis. Wähle eine Waffe, hake die Werte an, die dein Riven gewürfelt hat, und wir schätzen aus dem Korpus der Live-Auktionen eine faire Platin-Spanne — dann bewerten wir jedes Angebot gegen das Feld, damit du einen God Roll oder ein Schnäppchen erkennst.',
        dealLabel: 'Geschätzter fairer Wert',
        range: 'Spanne {low}–{high}p',
        comparables: '{n} Vergleichswert | {n} Vergleichswerte',
        approxSuffix: ' · ca.',
      },
      filters: {
        chooseWeapon: 'Wähle eine Waffe',
      },
      meta: {
        disposition: 'Disposition',
        auctions: 'Auktionen',
      },
      states: {
        loadError: 'Die Riven-Waffen konnten nicht geladen werden. Der Markt-Dienst wacht vielleicht gerade auf — versuche es neu zu laden.',
        pickWeapon: 'Wähle oben eine Waffe, um den Wert eines Rivens zu schätzen und die Live-Angebote zu bewerten.',
        loading: 'Auktionen werden geladen…',
        noAuctions: 'Derzeit sind für diese Waffe keine Live-Direktverkaufs-Auktionen gespeichert. Versuche eine andere Waffe.',
      },
      estimator: {
        title: 'Hake die Werte an, die dein Riven gewürfelt hat',
        positives: 'Positive',
        negativeOptional: 'Negativ (optional)',
        anyNone: 'Beliebig / keiner',
      },
      estimate: {
        fairValueRange: 'fairer Wert · Spanne {low}–{high}p',
        fromComparables: 'aus {n} Vergleichswert | aus {n} Vergleichswerten',
        approxNote: ' (wenige exakte Treffer — ungefähr)',
        cheapest: 'Günstigstes Angebot: {price}',
        belowFair: '↓ unter dem fairen Wert',
        emptyNoMatch: 'Keine vergleichbaren Auktionen mit genau diesen Werten — hake einen ab, um die Übereinstimmung zu erweitern.',
        emptySelect: 'Wähle mindestens einen positiven Wert für eine Schätzung.',
      },
      list: {
        title: 'Live-Angebote, bewertet',
        count: '{n} Auktion · nach Preis sortiert | {n} Auktionen · nach Preis sortiert',
      },
      table: {
        stats: 'Werte',
        grade: 'Note',
        rolls: 'Würfe',
        buyout: 'Sofortkauf',
        seller: 'Verkäufer',
      },
      badge: {
        deal: 'ANGEBOT',
      },
      card: {
        sub: '{rolls} Würfe · MR{mr} · {status}',
      },
      disclaimer: {
        text: 'Die Schätzungen stammen aus gespeicherten Direktverkaufs-Auktionen (gewürfelte Rivens, mehr als 50 Neuwürfe). Die Note ist das Perzentil der positiven Werte jedes Wurfs {within} (A = Spitze des Feldes) — eine relative Einordnung, keine absolute God-Roll-Wertung, da die Basis-Wertebereiche nicht modelliert werden. Eine höhere Disposition ({disp}) bedeutet insgesamt größere Wertzahlen.',
        within: 'innerhalb der aktuellen Angebote dieser Waffe',
        shownAbove: 'oben gezeigt',
      },
    },
  },
  fr: {
    rivenValue: {
      eyebrow: 'Warframe Market · Valeur juste du Riven',
      hero: {
        title: 'Combien {worth} {myRoll} ?',
        titleMyRoll: 'mon tirage',
        titleWorth: 'vaut',
        lede: "Les Rivens sont aléatoires, donc warframe.market ne vous donne que des annonces brutes et aucun prix. Choisissez une arme, cochez les stats qu'a tirées votre riven, et nous estimons une fourchette de platine juste à partir du corpus d'enchères en direct — puis nous notons chaque annonce face au champ pour que vous repériez un god roll ou une bonne affaire.",
        dealLabel: 'Valeur juste estimée',
        range: 'fourchette {low}–{high}p',
        comparables: '{n} comparable | {n} comparables',
        approxSuffix: ' · env.',
      },
      filters: {
        chooseWeapon: 'Choisissez une arme',
      },
      meta: {
        disposition: 'Disposition',
        auctions: 'Enchères',
      },
      states: {
        loadError: "Impossible de charger les armes à riven. Le service de marché est peut-être en train de démarrer — essayez d'actualiser.",
        pickWeapon: "Choisissez une arme ci-dessus pour estimer la valeur d'un riven et noter les annonces en direct.",
        loading: 'Chargement des enchères…',
        noAuctions: 'Aucune enchère de vente directe en direct enregistrée pour cette arme pour le moment. Essayez une autre arme.',
      },
      estimator: {
        title: "Cochez les stats qu'a tirées votre riven",
        positives: 'Positives',
        negativeOptional: 'Négative (optionnel)',
        anyNone: 'Toutes / aucune',
      },
      estimate: {
        fairValueRange: 'valeur juste · fourchette {low}–{high}p',
        fromComparables: 'sur {n} comparable | sur {n} comparables',
        approxNote: ' (peu de correspondances exactes — approximatif)',
        cheapest: 'Le moins cher listé : {price}',
        belowFair: '↓ sous la valeur juste',
        emptyNoMatch: 'Aucune enchère comparable avec ces stats exactes — décochez-en une pour élargir la correspondance.',
        emptySelect: 'Sélectionnez au moins une stat positive pour obtenir une estimation.',
      },
      list: {
        title: 'Annonces en direct, notées',
        count: '{n} enchère · triées par prix | {n} enchères · triées par prix',
      },
      table: {
        stats: 'Stats',
        grade: 'Note',
        rolls: 'Tirages',
        buyout: 'Achat immédiat',
        seller: 'Vendeur',
      },
      badge: {
        deal: 'AFFAIRE',
      },
      card: {
        sub: '{rolls} tirages · MR{mr} · {status}',
      },
      disclaimer: {
        text: "Les estimations proviennent d'enchères de vente directe enregistrées (rivens déjà tirés, plus de 50 re-tirages). La note est le centile des stats positives de chaque tirage {within} (A = le sommet du champ) — une lecture relative, pas un score absolu de god roll, car les plages de stats de base ne sont pas modélisées. Une disposition plus élevée ({disp}) implique des chiffres de stats plus grands dans l'ensemble.",
        within: 'parmi les annonces actuelles de cette arme',
        shownAbove: 'affichée ci-dessus',
      },
    },
  },
  ru: {
    rivenValue: {
      eyebrow: 'Warframe Market · Справедливая цена Riven',
      hero: {
        title: 'Сколько {worth} {myRoll}?',
        titleMyRoll: 'мой ролл',
        titleWorth: 'стоит',
        lede: 'Rivens случайны, поэтому warframe.market даёт лишь сырые объявления и никакой цены. Выберите оружие, отметьте статы, которые выпали на вашем Riven, и мы оценим справедливый диапазон платины по корпусу активных аукционов — а затем оценим каждое объявление на фоне остальных, чтобы вы заметили god roll или выгодную сделку.',
        dealLabel: 'Оценочная справедливая цена',
        range: 'диапазон {low}–{high}p',
        comparables: '{n} аналог | {n} аналогов',
        approxSuffix: ' · прибл.',
      },
      filters: {
        chooseWeapon: 'Выберите оружие',
      },
      meta: {
        disposition: 'Диспозиция',
        auctions: 'Аукционы',
      },
      states: {
        loadError: 'Не удалось загрузить оружие с Riven. Сервис рынка, возможно, просыпается — попробуйте обновить.',
        pickWeapon: 'Выберите оружие выше, чтобы оценить стоимость Riven и оценить активные объявления.',
        loading: 'Загрузка аукционов…',
        noAuctions: 'Сейчас для этого оружия нет сохранённых активных аукционов прямой продажи. Попробуйте другое оружие.',
      },
      estimator: {
        title: 'Отметьте статы, которые выпали на вашем Riven',
        positives: 'Положительные',
        negativeOptional: 'Отрицательный (необязательно)',
        anyNone: 'Любой / нет',
      },
      estimate: {
        fairValueRange: 'справедливая цена · диапазон {low}–{high}p',
        fromComparables: 'из {n} аналога | из {n} аналогов',
        approxNote: ' (мало точных совпадений — приблизительно)',
        cheapest: 'Самое дешёвое: {price}',
        belowFair: '↓ ниже справедливой цены',
        emptyNoMatch: 'Нет сопоставимых аукционов с точно такими статами — снимите одну отметку, чтобы расширить поиск.',
        emptySelect: 'Выберите хотя бы один положительный стат для оценки.',
      },
      list: {
        title: 'Активные объявления, с оценкой',
        count: '{n} аукцион · сортировка по цене | {n} аукционов · сортировка по цене',
      },
      table: {
        stats: 'Статы',
        grade: 'Оценка',
        rolls: 'Роллы',
        buyout: 'Выкуп',
        seller: 'Продавец',
      },
      badge: {
        deal: 'ВЫГОДА',
      },
      card: {
        sub: '{rolls} роллов · MR{mr} · {status}',
      },
      disclaimer: {
        text: 'Оценки основаны на сохранённых аукционах прямой продажи (роллнутые Riven, более 50 рероллов). Оценка — это процентиль положительных статов каждого ролла {within} (A = вершина поля) — относительная оценка, а не абсолютный god-roll-балл, так как диапазоны базовых статов не моделируются. Более высокая диспозиция ({disp}) означает в целом более крупные значения статов.',
        within: 'среди текущих объявлений этого оружия',
        shownAbove: 'показана выше',
      },
    },
  },
  ko: {
    rivenValue: {
      eyebrow: 'Warframe Market · Riven 적정가',
      hero: {
        title: '{myRoll}은 {worth}',
        titleMyRoll: '내 롤',
        titleWorth: '얼마일까?',
        lede: 'Riven은 무작위라서 warframe.market은 가공되지 않은 매물만 보여주고 가격은 알려주지 않습니다. 무기를 고르고 당신의 riven이 굴린 스탯을 체크하면, 실시간 경매 데이터를 바탕으로 적정 플래티넘 범위를 추정합니다 — 그런 다음 각 매물을 전체와 비교해 등급을 매겨 god roll이나 좋은 거래를 찾을 수 있게 해줍니다.',
        dealLabel: '추정 적정가',
        range: '{low}–{high}p 범위',
        comparables: '비교 매물 {n}개 | 비교 매물 {n}개',
        approxSuffix: ' · 근사치',
      },
      filters: {
        chooseWeapon: '무기 선택',
      },
      meta: {
        disposition: '디스포지션',
        auctions: '경매',
      },
      states: {
        loadError: 'Riven 무기를 불러오지 못했습니다. 마켓 서비스가 깨어나는 중일 수 있습니다 — 새로고침해 보세요.',
        pickWeapon: '위에서 무기를 선택하면 riven의 가치를 추정하고 실시간 매물의 등급을 매깁니다.',
        loading: '경매 불러오는 중…',
        noAuctions: '지금 이 무기에 대해 저장된 실시간 직거래 경매가 없습니다. 다른 무기를 시도해 보세요.',
      },
      estimator: {
        title: '당신의 riven이 굴린 스탯을 체크하세요',
        positives: '긍정 스탯',
        negativeOptional: '부정 스탯 (선택)',
        anyNone: '아무거나 / 없음',
      },
      estimate: {
        fairValueRange: '적정가 · {low}–{high}p 범위',
        fromComparables: '비교 매물 {n}개 기준 | 비교 매물 {n}개 기준',
        approxNote: ' (정확히 일치하는 매물이 적음 — 근사치)',
        cheapest: '최저 매물: {price}',
        belowFair: '↓ 적정가 이하',
        emptyNoMatch: '그 스탯과 정확히 일치하는 비교 경매가 없습니다 — 하나를 해제해 범위를 넓히세요.',
        emptySelect: '추정하려면 긍정 스탯을 하나 이상 선택하세요.',
      },
      list: {
        title: '실시간 매물, 등급 매김',
        count: '경매 {n}건 · 가격순 정렬 | 경매 {n}건 · 가격순 정렬',
      },
      table: {
        stats: '스탯',
        grade: '등급',
        rolls: '리롤',
        buyout: '즉시 구매',
        seller: '판매자',
      },
      badge: {
        deal: '특가',
      },
      card: {
        sub: '{rolls}회 리롤 · MR{mr} · {status}',
      },
      disclaimer: {
        text: '추정치는 저장된 직거래 경매(굴린 riven, 리롤 50회 이상)에서 나옵니다. 등급은 각 롤의 긍정 스탯 백분위입니다 {within} (A = 최상위) — 기본 스탯 범위는 반영하지 않으므로 절대적인 god roll 점수가 아니라 상대적인 지표입니다. 디스포지션이 높을수록({disp}) 전반적으로 스탯 수치가 커집니다.',
        within: '이 무기의 현재 매물 내에서',
        shownAbove: '위에 표시됨',
      },
    },
  },
  ja: {
    rivenValue: {
      eyebrow: 'Warframe Market · Riven 適正価格',
      hero: {
        title: '{myRoll}の{worth}',
        titleMyRoll: '私のロール',
        titleWorth: '価値は？',
        lede: 'Riven はランダムなので、warframe.market は生のリストだけで価格は表示しません。武器を選び、あなたの riven が引いたステータスにチェックを入れると、ライブオークションのデータから適正なプラチナの範囲を推定します — さらに各リストを全体と比較して評価し、god roll やお買い得を見つけられます。',
        dealLabel: '推定適正価格',
        range: '{low}–{high}p の範囲',
        comparables: '比較対象 {n} 件 | 比較対象 {n} 件',
        approxSuffix: ' · 概算',
      },
      filters: {
        chooseWeapon: '武器を選択',
      },
      meta: {
        disposition: 'ディスポジション',
        auctions: 'オークション',
      },
      states: {
        loadError: 'Riven 武器を読み込めませんでした。マーケットサービスが起動中かもしれません — 再読み込みしてください。',
        pickWeapon: '上で武器を選ぶと、riven の価値を推定し、ライブのリストを評価します。',
        loading: 'オークションを読み込み中…',
        noAuctions: '現在この武器の保存済みライブ直接販売オークションはありません。別の武器をお試しください。',
      },
      estimator: {
        title: 'あなたの riven が引いたステータスにチェックを入れてください',
        positives: 'プラス',
        negativeOptional: 'マイナス（任意）',
        anyNone: 'どれでも / なし',
      },
      estimate: {
        fairValueRange: '適正価格 · {low}–{high}p の範囲',
        fromComparables: '比較対象 {n} 件から | 比較対象 {n} 件から',
        approxNote: '（完全一致が少ない — 概算）',
        cheapest: '最安のリスト: {price}',
        belowFair: '↓ 適正価格を下回る',
        emptyNoMatch: 'そのステータスと完全に一致する比較オークションはありません — 一つ外して条件を広げてください。',
        emptySelect: '推定するにはプラスのステータスを少なくとも一つ選択してください。',
      },
      list: {
        title: 'ライブのリスト、評価済み',
        count: 'オークション {n} 件 · 価格順 | オークション {n} 件 · 価格順',
      },
      table: {
        stats: 'ステータス',
        grade: '評価',
        rolls: 'リロール',
        buyout: '即決価格',
        seller: '出品者',
      },
      badge: {
        deal: 'お買い得',
      },
      card: {
        sub: '{rolls} 回リロール · MR{mr} · {status}',
      },
      disclaimer: {
        text: '推定値は保存済みの直接販売オークション（引き直した riven、リロール50回以上）に基づきます。評価は各ロールのプラスステータスのパーセンタイルです {within}（A = 全体の最上位）— 基礎ステータスの範囲はモデル化していないため、絶対的な god roll スコアではなく相対的な指標です。ディスポジションが高いほど（{disp}）全体的にステータスの数値が大きくなります。',
        within: 'この武器の現在のリスト内で',
        shownAbove: '上に表示',
      },
    },
  },
  'zh-hans': {
    rivenValue: {
      eyebrow: 'Warframe Market · Riven 合理价值',
      hero: {
        title: '{myRoll} {worth}',
        titleMyRoll: '我的 roll',
        titleWorth: '值多少？',
        lede: 'Riven 是随机的，所以 warframe.market 只给你原始的挂单而没有价格。选择一把武器，勾选你的 riven 洗出的属性，我们会根据实时拍卖数据估算一个合理的白金区间 — 然后把每个挂单与整体对比评级，让你发现 god roll 或划算的交易。',
        dealLabel: '估算合理价值',
        range: '{low}–{high}p 区间',
        comparables: '{n} 个可比项 | {n} 个可比项',
        approxSuffix: ' · 约',
      },
      filters: {
        chooseWeapon: '选择武器',
      },
      meta: {
        disposition: '倾向',
        auctions: '拍卖',
      },
      states: {
        loadError: '无法加载 Riven 武器。市场服务可能正在唤醒 — 请尝试刷新。',
        pickWeapon: '在上方选择一把武器，即可估算 riven 的价值并为实时挂单评级。',
        loading: '正在加载拍卖…',
        noAuctions: '目前没有为这把武器存储的实时直售拍卖。请尝试其他武器。',
      },
      estimator: {
        title: '勾选你的 riven 洗出的属性',
        positives: '正面属性',
        negativeOptional: '负面属性（可选）',
        anyNone: '任意 / 无',
      },
      estimate: {
        fairValueRange: '合理价值 · {low}–{high}p 区间',
        fromComparables: '来自 {n} 个可比项 | 来自 {n} 个可比项',
        approxNote: '（精确匹配较少 — 约值）',
        cheapest: '最低挂单：{price}',
        belowFair: '↓ 低于合理价值',
        emptyNoMatch: '没有与这些精确属性匹配的可比拍卖 — 取消勾选一项以扩大匹配范围。',
        emptySelect: '至少选择一个正面属性以获得估算。',
      },
      list: {
        title: '实时挂单，已评级',
        count: '{n} 个拍卖 · 按价格排序 | {n} 个拍卖 · 按价格排序',
      },
      table: {
        stats: '属性',
        grade: '评级',
        rolls: '洗卡次数',
        buyout: '一口价',
        seller: '卖家',
      },
      badge: {
        deal: '划算',
      },
      card: {
        sub: '{rolls} 次洗卡 · MR{mr} · {status}',
      },
      disclaimer: {
        text: '估算来自已存储的直售拍卖（已洗过的 riven，50 次以上重洗）。评级是每次 roll 的正面属性百分位 {within}（A = 全场最高）— 这是相对读数，而非绝对的 god roll 评分，因为基础属性范围未纳入模型。倾向越高（{disp}），整体属性数值越大。',
        within: '在这把武器当前的挂单范围内',
        shownAbove: '如上所示',
      },
    },
  },
  'zh-hant': {
    rivenValue: {
      eyebrow: 'Warframe Market · Riven 合理價值',
      hero: {
        title: '{myRoll} {worth}',
        titleMyRoll: '我的 roll',
        titleWorth: '值多少？',
        lede: 'Riven 是隨機的，所以 warframe.market 只給你原始的掛單而沒有價格。選擇一把武器，勾選你的 riven 洗出的屬性，我們會根據即時拍賣資料估算一個合理的白金區間 — 然後把每個掛單與整體對比評級，讓你發現 god roll 或划算的交易。',
        dealLabel: '估算合理價值',
        range: '{low}–{high}p 區間',
        comparables: '{n} 個可比項 | {n} 個可比項',
        approxSuffix: ' · 約',
      },
      filters: {
        chooseWeapon: '選擇武器',
      },
      meta: {
        disposition: '傾向',
        auctions: '拍賣',
      },
      states: {
        loadError: '無法載入 Riven 武器。市場服務可能正在喚醒 — 請嘗試重新整理。',
        pickWeapon: '在上方選擇一把武器，即可估算 riven 的價值並為即時掛單評級。',
        loading: '正在載入拍賣…',
        noAuctions: '目前沒有為這把武器儲存的即時直售拍賣。請嘗試其他武器。',
      },
      estimator: {
        title: '勾選你的 riven 洗出的屬性',
        positives: '正面屬性',
        negativeOptional: '負面屬性（選填）',
        anyNone: '任意 / 無',
      },
      estimate: {
        fairValueRange: '合理價值 · {low}–{high}p 區間',
        fromComparables: '來自 {n} 個可比項 | 來自 {n} 個可比項',
        approxNote: '（精確匹配較少 — 約值）',
        cheapest: '最低掛單：{price}',
        belowFair: '↓ 低於合理價值',
        emptyNoMatch: '沒有與這些精確屬性匹配的可比拍賣 — 取消勾選一項以擴大匹配範圍。',
        emptySelect: '至少選擇一個正面屬性以取得估算。',
      },
      list: {
        title: '即時掛單，已評級',
        count: '{n} 個拍賣 · 依價格排序 | {n} 個拍賣 · 依價格排序',
      },
      table: {
        stats: '屬性',
        grade: '評級',
        rolls: '洗卡次數',
        buyout: '一口價',
        seller: '賣家',
      },
      badge: {
        deal: '划算',
      },
      card: {
        sub: '{rolls} 次洗卡 · MR{mr} · {status}',
      },
      disclaimer: {
        text: '估算來自已儲存的直售拍賣（已洗過的 riven，50 次以上重洗）。評級是每次 roll 的正面屬性百分位 {within}（A = 全場最高）— 這是相對讀數，而非絕對的 god roll 評分，因為基礎屬性範圍未納入模型。傾向越高（{disp}），整體屬性數值越大。',
        within: '在這把武器目前的掛單範圍內',
        shownAbove: '如上所示',
      },
    },
  },
  pl: {
    rivenValue: {
      eyebrow: 'Warframe Market · Uczciwa wartość Rivena',
      hero: {
        title: 'Ile {worth} {myRoll}?',
        titleMyRoll: 'mój roll',
        titleWorth: 'jest wart',
        lede: 'Riveny są losowe, więc warframe.market daje ci tylko surowe oferty i żadnej ceny. Wybierz broń, zaznacz statystyki, które wyrzucił twój riven, a oszacujemy uczciwy zakres platyny na podstawie zbioru aktywnych aukcji — a potem ocenimy każdą ofertę na tle reszty, żebyś wypatrzył god rolla lub okazję.',
        dealLabel: 'Szacowana uczciwa wartość',
        range: 'zakres {low}–{high}p',
        comparables: '{n} porównanie | {n} porównań',
        approxSuffix: ' · ok.',
      },
      filters: {
        chooseWeapon: 'Wybierz broń',
      },
      meta: {
        disposition: 'Dyspozycja',
        auctions: 'Aukcje',
      },
      states: {
        loadError: 'Nie udało się wczytać broni z rivenami. Usługa rynku może się właśnie budzić — spróbuj odświeżyć.',
        pickWeapon: 'Wybierz broń powyżej, aby oszacować wartość rivena i ocenić aktywne oferty.',
        loading: 'Wczytywanie aukcji…',
        noAuctions: 'Brak zapisanych aktywnych aukcji sprzedaży bezpośredniej dla tej broni w tej chwili. Spróbuj innej broni.',
      },
      estimator: {
        title: 'Zaznacz statystyki, które wyrzucił twój riven',
        positives: 'Pozytywne',
        negativeOptional: 'Negatywna (opcjonalnie)',
        anyNone: 'Dowolna / brak',
      },
      estimate: {
        fairValueRange: 'uczciwa wartość · zakres {low}–{high}p',
        fromComparables: 'z {n} porównania | z {n} porównań',
        approxNote: ' (mało dokładnych dopasowań — orientacyjnie)',
        cheapest: 'Najtańsza oferta: {price}',
        belowFair: '↓ poniżej uczciwej wartości',
        emptyNoMatch: 'Brak porównywalnych aukcji z dokładnie tymi statystykami — odznacz jedną, aby poszerzyć dopasowanie.',
        emptySelect: 'Zaznacz co najmniej jedną statystykę pozytywną, aby uzyskać wycenę.',
      },
      list: {
        title: 'Aktywne oferty, ocenione',
        count: '{n} aukcja · sortowane wg ceny | {n} aukcji · sortowane wg ceny',
      },
      table: {
        stats: 'Statystyki',
        grade: 'Ocena',
        rolls: 'Rolle',
        buyout: 'Kup teraz',
        seller: 'Sprzedawca',
      },
      badge: {
        deal: 'OKAZJA',
      },
      card: {
        sub: '{rolls} rolli · MR{mr} · {status}',
      },
      disclaimer: {
        text: 'Szacunki pochodzą z zapisanych aukcji sprzedaży bezpośredniej (rollowane riveny, ponad 50 rerollów). Ocena to percentyl pozytywnych statystyk każdego rolla {within} (A = szczyt stawki) — odczyt względny, a nie bezwzględny wynik god rolla, ponieważ zakresy bazowych statystyk nie są modelowane. Wyższa dyspozycja ({disp}) oznacza ogólnie większe wartości statystyk.',
        within: 'wśród aktualnych ofert tej broni',
        shownAbove: 'pokazana powyżej',
      },
    },
  },
  it: {
    rivenValue: {
      eyebrow: 'Warframe Market · Valore equo del Riven',
      hero: {
        title: 'Quanto {worth} {myRoll}?',
        titleMyRoll: 'la mia tirata',
        titleWorth: 'vale',
        lede: "I Riven sono casuali, quindi warframe.market ti dà solo annunci grezzi e nessun prezzo. Scegli un'arma, spunta le statistiche che ha tirato il tuo riven e stimiamo un intervallo equo di platino dal corpus delle aste dal vivo — poi valutiamo ogni annuncio rispetto al campo così individui un god roll o un affare.",
        dealLabel: 'Valore equo stimato',
        range: 'intervallo {low}–{high}p',
        comparables: '{n} comparabile | {n} comparabili',
        approxSuffix: ' · circa',
      },
      filters: {
        chooseWeapon: "Scegli un'arma",
      },
      meta: {
        disposition: 'Disposizione',
        auctions: 'Aste',
      },
      states: {
        loadError: 'Impossibile caricare le armi con riven. Il servizio di mercato potrebbe essersi appena avviato — prova ad aggiornare.',
        pickWeapon: "Scegli un'arma qui sopra per stimare il valore di un riven e valutare gli annunci dal vivo.",
        loading: 'Caricamento aste…',
        noAuctions: "Al momento non ci sono aste di vendita diretta dal vivo salvate per questa arma. Prova con un'altra arma.",
      },
      estimator: {
        title: 'Spunta le statistiche che ha tirato il tuo riven',
        positives: 'Positive',
        negativeOptional: 'Negativa (opzionale)',
        anyNone: 'Qualsiasi / nessuna',
      },
      estimate: {
        fairValueRange: 'valore equo · intervallo {low}–{high}p',
        fromComparables: 'da {n} comparabile | da {n} comparabili',
        approxNote: ' (poche corrispondenze esatte — approssimativo)',
        cheapest: 'Il più economico in vendita: {price}',
        belowFair: '↓ sotto il valore equo',
        emptyNoMatch: "Nessun'asta comparabile con quelle statistiche esatte — deseleziona una per ampliare la corrispondenza.",
        emptySelect: 'Seleziona almeno una statistica positiva per ottenere una stima.',
      },
      list: {
        title: 'Annunci dal vivo, valutati',
        count: '{n} asta · ordinate per prezzo | {n} aste · ordinate per prezzo',
      },
      table: {
        stats: 'Statistiche',
        grade: 'Voto',
        rolls: 'Tirate',
        buyout: 'Acquisto immediato',
        seller: 'Venditore',
      },
      badge: {
        deal: 'AFFARE',
      },
      card: {
        sub: '{rolls} tirate · MR{mr} · {status}',
      },
      disclaimer: {
        text: 'Le stime provengono da aste di vendita diretta salvate (riven già tirati, più di 50 re-tirate). Il voto è il percentile delle statistiche positive di ogni tirata {within} (A = il vertice del campo) — una lettura relativa, non un punteggio assoluto di god roll, poiché gli intervalli delle statistiche base non sono modellati. Una disposizione più alta ({disp}) implica numeri di statistiche più grandi in generale.',
        within: "tra gli annunci attuali di quest'arma",
        shownAbove: 'mostrato sopra',
      },
    },
  },
  uk: {
    rivenValue: {
      eyebrow: 'Warframe Market · Справедлива ціна Riven',
      hero: {
        title: 'Скільки {worth} {myRoll}?',
        titleMyRoll: 'мій ролл',
        titleWorth: 'коштує',
        lede: 'Rivens випадкові, тому warframe.market дає лише сирі оголошення й жодної ціни. Оберіть зброю, позначте стати, які випали на вашому Riven, і ми оцінимо справедливий діапазон платини за корпусом активних аукціонів — а потім оцінимо кожне оголошення на тлі інших, щоб ви помітили god roll або вигідну угоду.',
        dealLabel: 'Орієнтовна справедлива ціна',
        range: 'діапазон {low}–{high}p',
        comparables: '{n} аналог | {n} аналогів',
        approxSuffix: ' · прибл.',
      },
      filters: {
        chooseWeapon: 'Оберіть зброю',
      },
      meta: {
        disposition: 'Диспозиція',
        auctions: 'Аукціони',
      },
      states: {
        loadError: 'Не вдалося завантажити зброю з Riven. Сервіс ринку, можливо, прокидається — спробуйте оновити.',
        pickWeapon: 'Оберіть зброю вгорі, щоб оцінити вартість Riven і оцінити активні оголошення.',
        loading: 'Завантаження аукціонів…',
        noAuctions: 'Наразі для цієї зброї немає збережених активних аукціонів прямого продажу. Спробуйте іншу зброю.',
      },
      estimator: {
        title: 'Позначте стати, які випали на вашому Riven',
        positives: 'Позитивні',
        negativeOptional: "Негативний (необов'язково)",
        anyNone: 'Будь-який / немає',
      },
      estimate: {
        fairValueRange: 'справедлива ціна · діапазон {low}–{high}p',
        fromComparables: 'з {n} аналога | з {n} аналогів',
        approxNote: ' (мало точних збігів — приблизно)',
        cheapest: 'Найдешевше: {price}',
        belowFair: '↓ нижче справедливої ціни',
        emptyNoMatch: 'Немає порівнянних аукціонів із точно такими статами — зніміть одну позначку, щоб розширити пошук.',
        emptySelect: 'Виберіть щонайменше один позитивний стат для оцінки.',
      },
      list: {
        title: 'Активні оголошення, з оцінкою',
        count: '{n} аукціон · сортування за ціною | {n} аукціонів · сортування за ціною',
      },
      table: {
        stats: 'Стати',
        grade: 'Оцінка',
        rolls: 'Ролли',
        buyout: 'Викуп',
        seller: 'Продавець',
      },
      badge: {
        deal: 'ВИГОДА',
      },
      card: {
        sub: '{rolls} ролів · MR{mr} · {status}',
      },
      disclaimer: {
        text: 'Оцінки базуються на збережених аукціонах прямого продажу (роллнуті Riven, понад 50 реролів). Оцінка — це процентиль позитивних статів кожного ролла {within} (A = вершина поля) — відносна оцінка, а не абсолютний god-roll-бал, оскільки діапазони базових статів не моделюються. Вища диспозиція ({disp}) означає загалом більші значення статів.',
        within: 'серед поточних оголошень цієї зброї',
        shownAbove: 'показано вище',
      },
    },
  },
}
