// Warframe farming-guide dialog (WarframeGuideDialog.vue). Namespaced under
// `guideDialog.*`. Follows the shared glossary: relic→reliquia/relíquia,
// void→vacío/vazio, platinum→platino/platina, vaulted→vedado/a, parts→partes/peças.
// Proper nouns kept as-is: Warframe, Prime, WFCD, Warframe Market, MR (Mastery Rank),
// Foundry name, planet/relic/part names from the API.
export default {
  en: {
    guideDialog: {
      eyebrow: 'Farming guide',
      title: 'Warframes',
      backAria: 'Back to all warframes',
      closeAria: 'Close guide',
      loading: 'Reading the foundry records…',
      retry: 'Retry',
      tabs: {
        all: 'All',
        prime: 'Prime',
        standard: 'Standard',
      },
      search: 'Search a warframe',
      noMatch: 'No warframe matches "{query}".',
      sourceNote:
        'Sources: WFCD community drop data (auto-updated with game patches) · prices from Warframe Market.',
      badge: {
        vaulted: 'Vaulted',
      },
      detail: {
        wiki: 'wiki',
        setBuyline: 'Skip the farm: full set trades around {price} on Warframe Market.',
        setVsParts: 'Set vs parts — is it cheaper to buy the pieces?',
        mainBlueprint: 'Main blueprint: in-game market, {credits} credits.',
        fullyBuilt: 'Fully built: in-game market, {plat} platinum.',
        standardNote:
          "Standard warframe blueprints and parts can't be traded between players — the sources below are how you earn them yourself.",
        vaultedNote:
          "Vaulted — its relics no longer drop; farm them from other players' void fissures or trade for the relics/parts directly.",
        relicTitle: 'Show where {relic} drops on the map',
        planetTitle: 'Highlight {part} on {planet}',
        chipVaulted: 'vaulted',
        moreSources: '+{n} more sources',
        noDrop: 'No mission drop — check the wiki (quest, dojo research, syndicate or vendor).',
      },
    },
  },
  es: {
    guideDialog: {
      eyebrow: 'Guía de farmeo',
      title: 'Warframes',
      backAria: 'Volver a todos los warframes',
      closeAria: 'Cerrar guía',
      loading: 'Leyendo los registros de la Fundición…',
      retry: 'Reintentar',
      tabs: {
        all: 'Todos',
        prime: 'Prime',
        standard: 'Estándar',
      },
      search: 'Buscar un warframe',
      noMatch: 'Ningún warframe coincide con "{query}".',
      sourceNote:
        'Fuentes: datos de drops de la comunidad WFCD (actualizados automáticamente con los parches del juego) · precios de Warframe Market.',
      badge: {
        vaulted: 'Vedado',
      },
      detail: {
        wiki: 'wiki',
        setBuyline: 'Sáltate el farmeo: el set completo se vende por unos {price} en Warframe Market.',
        setVsParts: 'Set vs partes — ¿es más barato comprar las piezas?',
        mainBlueprint: 'Plano principal: mercado del juego, {credits} créditos.',
        fullyBuilt: 'Ya construido: mercado del juego, {plat} platino.',
        standardNote:
          'Los planos y las partes de warframes estándar no se pueden intercambiar entre jugadores — las fuentes de abajo son la forma de conseguirlos tú mismo.',
        vaultedNote:
          'Vedado — sus reliquias ya no caen; consíguelas en las fisuras del vacío de otros jugadores o intercámbialas por las reliquias/partes directamente.',
        relicTitle: 'Mostrar dónde cae {relic} en el mapa',
        planetTitle: 'Resaltar {part} en {planet}',
        chipVaulted: 'vedado',
        moreSources: '+{n} fuentes más',
        noDrop: 'Sin drop en misiones — consulta la wiki (misión, investigación de dojo, sindicato o vendedor).',
      },
    },
  },
  pt: {
    guideDialog: {
      eyebrow: 'Guia de farm',
      title: 'Warframes',
      backAria: 'Voltar a todos os warframes',
      closeAria: 'Fechar guia',
      loading: 'Lendo os registros da Fundição…',
      retry: 'Tentar novamente',
      tabs: {
        all: 'Todos',
        prime: 'Prime',
        standard: 'Padrão',
      },
      search: 'Buscar um warframe',
      noMatch: 'Nenhum warframe corresponde a "{query}".',
      sourceNote:
        'Fontes: dados de drops da comunidade WFCD (atualizados automaticamente com os patches do jogo) · preços do Warframe Market.',
      badge: {
        vaulted: 'Vedado',
      },
      detail: {
        wiki: 'wiki',
        setBuyline: 'Pule o farm: o set completo é vendido por cerca de {price} no Warframe Market.',
        setVsParts: 'Set vs peças — é mais barato comprar as peças?',
        mainBlueprint: 'Projeto principal: mercado do jogo, {credits} créditos.',
        fullyBuilt: 'Já construído: mercado do jogo, {plat} platina.',
        standardNote:
          'Os projetos e as peças de warframes padrão não podem ser trocados entre jogadores — as fontes abaixo são a forma de consegui-los você mesmo.',
        vaultedNote:
          'Vedado — suas relíquias não caem mais; consiga-as nas fissuras do vazio de outros jogadores ou troque pelas relíquias/peças diretamente.',
        relicTitle: 'Mostrar onde {relic} cai no mapa',
        planetTitle: 'Destacar {part} em {planet}',
        chipVaulted: 'vedado',
        moreSources: '+{n} fontes a mais',
        noDrop: 'Sem drop em missões — consulte a wiki (missão, pesquisa de dojo, sindicato ou vendedor).',
      },
    },
  },
  de: {
    guideDialog: {
      eyebrow: 'Farm-Guide',
      title: 'Warframes',
      backAria: 'Zurück zu allen Warframes',
      closeAria: 'Guide schließen',
      loading: 'Lese die Aufzeichnungen der Schmiede…',
      retry: 'Erneut versuchen',
      tabs: {
        all: 'Alle',
        prime: 'Prime',
        standard: 'Standard',
      },
      search: 'Warframe suchen',
      noMatch: 'Kein Warframe passt zu "{query}".',
      sourceNote:
        'Quellen: Drop-Daten der WFCD-Community (automatisch mit Spiel-Patches aktualisiert) · Preise von Warframe Market.',
      badge: {
        vaulted: 'Archiviert',
      },
      detail: {
        wiki: 'Wiki',
        setBuyline: 'Spar dir das Farmen: Das komplette Set kostet auf Warframe Market rund {price}.',
        setVsParts: 'Set vs. Teile — sind die Einzelteile günstiger?',
        mainBlueprint: 'Hauptbauplan: Ingame-Markt, {credits} Credits.',
        fullyBuilt: 'Fertig gebaut: Ingame-Markt, {plat} Platin.',
        standardNote:
          'Baupläne und Teile von Standard-Warframes können nicht zwischen Spielern gehandelt werden — die Quellen unten zeigen, wie du sie selbst verdienst.',
        vaultedNote:
          'Archiviert — seine Relikte droppen nicht mehr; farme sie in den Void-Rissen anderer Spieler oder tausche direkt die Relikte/Teile.',
        relicTitle: 'Zeigen, wo {relic} auf der Karte droppt',
        planetTitle: '{part} auf {planet} hervorheben',
        chipVaulted: 'archiviert',
        moreSources: '+{n} weitere Quellen',
        noDrop: 'Kein Missions-Drop — sieh im Wiki nach (Quest, Dojo-Forschung, Syndikat oder Händler).',
      },
    },
  },
  fr: {
    guideDialog: {
      eyebrow: 'Guide de farm',
      title: 'Warframes',
      backAria: 'Retour à tous les warframes',
      closeAria: 'Fermer le guide',
      loading: 'Lecture des registres de la Fonderie…',
      retry: 'Réessayer',
      tabs: {
        all: 'Tous',
        prime: 'Prime',
        standard: 'Standard',
      },
      search: 'Rechercher un warframe',
      noMatch: 'Aucun warframe ne correspond à "{query}".',
      sourceNote:
        'Sources : données de drops de la communauté WFCD (mises à jour automatiquement avec les patchs du jeu) · prix de Warframe Market.',
      badge: {
        vaulted: 'Archivé',
      },
      detail: {
        wiki: 'wiki',
        setBuyline: 'Évitez le farm : le set complet se vend autour de {price} sur Warframe Market.',
        setVsParts: "Set vs pièces — est-il moins cher d'acheter les pièces ?",
        mainBlueprint: 'Plan principal : marché du jeu, {credits} crédits.',
        fullyBuilt: 'Déjà construit : marché du jeu, {plat} platine.',
        standardNote:
          "Les plans et les pièces des warframes standard ne peuvent pas s'échanger entre joueurs — les sources ci-dessous permettent de les obtenir soi-même.",
        vaultedNote:
          "Archivé — ses reliques ne tombent plus ; farmez-les dans les failles du Void d'autres joueurs ou échangez directement les reliques/pièces.",
        relicTitle: 'Montrer où {relic} tombe sur la carte',
        planetTitle: 'Mettre {part} en évidence sur {planet}',
        chipVaulted: 'archivé',
        moreSources: '+{n} autres sources',
        noDrop: 'Aucun drop en mission — consultez le wiki (quête, recherche de dojo, syndicat ou marchand).',
      },
    },
  },
  ru: {
    guideDialog: {
      eyebrow: 'Гайд по фарму',
      title: 'Warframes',
      backAria: 'Назад ко всем варфреймам',
      closeAria: 'Закрыть гайд',
      loading: 'Чтение записей Кузницы…',
      retry: 'Повторить',
      tabs: {
        all: 'Все',
        prime: 'Prime',
        standard: 'Стандартные',
      },
      search: 'Поиск варфрейма',
      noMatch: 'Нет варфреймов, соответствующих "{query}".',
      sourceNote:
        'Источники: данные о дропе от сообщества WFCD (обновляются автоматически с патчами игры) · цены с Warframe Market.',
      badge: {
        vaulted: 'В хранилище',
      },
      detail: {
        wiki: 'вики',
        setBuyline: 'Не хочешь фармить: полный набор продаётся примерно за {price} на Warframe Market.',
        setVsParts: 'Набор или части — дешевле ли купить части?',
        mainBlueprint: 'Основной чертёж: внутриигровой рынок, {credits} кредитов.',
        fullyBuilt: 'Уже собран: внутриигровой рынок, {plat} платины.',
        standardNote:
          'Чертежи и части стандартных варфреймов нельзя обменивать между игроками — источники ниже показывают, как получить их самому.',
        vaultedNote:
          'В хранилище — его реликвии больше не выпадают; фарми их в разломах Void других игроков или обменивай напрямую реликвии/части.',
        relicTitle: 'Показать, где на карте выпадает {relic}',
        planetTitle: 'Выделить {part} на {planet}',
        chipVaulted: 'в хранилище',
        moreSources: '+{n} источников',
        noDrop: 'Нет дропа в миссиях — смотри вики (задание, исследование в додзё, синдикат или торговец).',
      },
    },
  },
  ko: {
    guideDialog: {
      eyebrow: '파밍 가이드',
      title: 'Warframes',
      backAria: '모든 워프레임으로 돌아가기',
      closeAria: '가이드 닫기',
      loading: '제작소 기록을 읽는 중…',
      retry: '다시 시도',
      tabs: {
        all: '전체',
        prime: 'Prime',
        standard: '일반',
      },
      search: '워프레임 검색',
      noMatch: '"{query}"과(와) 일치하는 워프레임이 없습니다.',
      sourceNote:
        '출처: WFCD 커뮤니티 드롭 데이터(게임 패치에 맞춰 자동 업데이트) · 가격은 Warframe Market 기준.',
      badge: {
        vaulted: '봉인됨',
      },
      detail: {
        wiki: '위키',
        setBuyline: '파밍 건너뛰기: 전체 세트는 Warframe Market에서 약 {price}에 거래됩니다.',
        setVsParts: '세트 vs 부품 — 부품을 따로 사는 게 더 쌀까요?',
        mainBlueprint: '메인 청사진: 게임 내 마켓, {credits} 크레딧.',
        fullyBuilt: '완성품: 게임 내 마켓, {plat} 플래티넘.',
        standardNote:
          '일반 워프레임의 청사진과 부품은 플레이어 간 거래가 불가능합니다 — 아래 출처는 직접 획득하는 방법입니다.',
        vaultedNote:
          '봉인됨 — 해당 렐릭은 더 이상 드롭되지 않습니다; 다른 플레이어의 Void 균열에서 파밍하거나 렐릭/부품을 직접 거래하세요.',
        relicTitle: '{relic}이(가) 지도에서 어디에 드롭되는지 표시',
        planetTitle: '{planet}에서 {part} 강조',
        chipVaulted: '봉인됨',
        moreSources: '출처 +{n}개 더',
        noDrop: '미션 드롭 없음 — 위키를 확인하세요 (퀘스트, 도장 연구, 신디케이트 또는 상인).',
      },
    },
  },
  ja: {
    guideDialog: {
      eyebrow: 'ファーミングガイド',
      title: 'Warframes',
      backAria: 'すべてのWarframeに戻る',
      closeAria: 'ガイドを閉じる',
      loading: 'ファウンドリーの記録を読み込み中…',
      retry: '再試行',
      tabs: {
        all: 'すべて',
        prime: 'Prime',
        standard: '通常',
      },
      search: 'Warframeを検索',
      noMatch: '"{query}" に一致するWarframeがありません。',
      sourceNote:
        'ソース: WFCDコミュニティのドロップデータ（ゲームのアップデートに合わせて自動更新）· 価格はWarframe Marketより。',
      badge: {
        vaulted: '入手不可',
      },
      detail: {
        wiki: 'Wiki',
        setBuyline: 'ファーム不要: フルセットはWarframe Marketで約{price}で取引されています。',
        setVsParts: 'セット vs パーツ — パーツを買った方が安い？',
        mainBlueprint: 'メイン設計図: ゲーム内マーケット、{credits}クレジット。',
        fullyBuilt: '完成品: ゲーム内マーケット、{plat}プラチナ。',
        standardNote:
          '通常Warframeの設計図とパーツはプレイヤー間で取引できません — 下記のソースが自分で入手する方法です。',
        vaultedNote:
          '入手不可 — このレリックはもうドロップしません。他のプレイヤーのVoid亀裂でファームするか、レリック/パーツを直接取引してください。',
        relicTitle: '{relic}がマップのどこでドロップするか表示',
        planetTitle: '{planet}の{part}をハイライト',
        chipVaulted: '入手不可',
        moreSources: '他{n}件のソース',
        noDrop: 'ミッションドロップなし — Wikiを確認してください（クエスト、ドージョー研究、シンジケート、ベンダー）。',
      },
    },
  },
  'zh-hans': {
    guideDialog: {
      eyebrow: '刷取指南',
      title: 'Warframes',
      backAria: '返回所有 Warframe',
      closeAria: '关闭指南',
      loading: '正在读取锻造厂记录…',
      retry: '重试',
      tabs: {
        all: '全部',
        prime: 'Prime',
        standard: '标准',
      },
      search: '搜索 Warframe',
      noMatch: '没有与 "{query}" 匹配的 Warframe。',
      sourceNote:
        '来源：WFCD 社区掉落数据（随游戏更新自动更新）· 价格来自 Warframe Market。',
      badge: {
        vaulted: '绝版',
      },
      detail: {
        wiki: 'Wiki',
        setBuyline: '跳过刷取：整套在 Warframe Market 上约 {price} 成交。',
        setVsParts: '整套 vs 部件 — 单买部件更便宜吗？',
        mainBlueprint: '主蓝图：游戏内市场，{credits} 现金。',
        fullyBuilt: '已建成：游戏内市场，{plat} 白金。',
        standardNote:
          '标准 Warframe 的蓝图和部件无法在玩家之间交易 — 下方来源是你自己获取它们的途径。',
        vaultedNote:
          '绝版 — 其遗物不再掉落；到其他玩家的 Void 裂缝里刷，或直接交易遗物/部件。',
        relicTitle: '显示 {relic} 在地图上的掉落位置',
        planetTitle: '在 {planet} 上高亮 {part}',
        chipVaulted: '绝版',
        moreSources: '+{n} 个来源',
        noDrop: '任务无掉落 — 请查看 Wiki（任务、道场研究、集团或商人）。',
      },
    },
  },
  'zh-hant': {
    guideDialog: {
      eyebrow: '刷取指南',
      title: 'Warframes',
      backAria: '返回所有 Warframe',
      closeAria: '關閉指南',
      loading: '正在讀取鑄造廠記錄…',
      retry: '重試',
      tabs: {
        all: '全部',
        prime: 'Prime',
        standard: '標準',
      },
      search: '搜尋 Warframe',
      noMatch: '沒有與 "{query}" 相符的 Warframe。',
      sourceNote:
        '來源：WFCD 社群掉落資料（隨遊戲更新自動更新）· 價格來自 Warframe Market。',
      badge: {
        vaulted: '絕版',
      },
      detail: {
        wiki: 'Wiki',
        setBuyline: '跳過刷取：整套在 Warframe Market 上約 {price} 成交。',
        setVsParts: '整套 vs 部件 — 單買部件更便宜嗎？',
        mainBlueprint: '主藍圖：遊戲內市場，{credits} 現金。',
        fullyBuilt: '已建成：遊戲內市場，{plat} 白金。',
        standardNote:
          '標準 Warframe 的藍圖和部件無法在玩家之間交易 — 下方來源是你自己取得它們的途徑。',
        vaultedNote:
          '絕版 — 其遺物不再掉落；到其他玩家的 Void 裂縫裡刷，或直接交易遺物/部件。',
        relicTitle: '顯示 {relic} 在地圖上的掉落位置',
        planetTitle: '在 {planet} 上高亮 {part}',
        chipVaulted: '絕版',
        moreSources: '+{n} 個來源',
        noDrop: '任務無掉落 — 請查看 Wiki（任務、道場研究、集團或商人）。',
      },
    },
  },
  pl: {
    guideDialog: {
      eyebrow: 'Poradnik farmienia',
      title: 'Warframes',
      backAria: "Powrót do wszystkich warframe'ów",
      closeAria: 'Zamknij poradnik',
      loading: 'Odczytywanie zapisów Kuźni…',
      retry: 'Ponów',
      tabs: {
        all: 'Wszystkie',
        prime: 'Prime',
        standard: 'Standardowe',
      },
      search: 'Szukaj warframe',
      noMatch: 'Żaden warframe nie pasuje do "{query}".',
      sourceNote:
        'Źródła: dane o dropach społeczności WFCD (aktualizowane automatycznie wraz z łatkami gry) · ceny z Warframe Market.',
      badge: {
        vaulted: 'W skarbcu',
      },
      detail: {
        wiki: 'wiki',
        setBuyline: 'Pomiń farmienie: pełny zestaw kosztuje na Warframe Market około {price}.',
        setVsParts: 'Zestaw czy części — taniej kupić części?',
        mainBlueprint: 'Główny plan: rynek w grze, {credits} kredytów.',
        fullyBuilt: 'Gotowy: rynek w grze, {plat} platyny.',
        standardNote:
          "Planów i części standardowych warframe'ów nie można wymieniać między graczami — poniższe źródła pokazują, jak zdobyć je samodzielnie.",
        vaultedNote:
          'W skarbcu — jego relikwie już nie wypadają; farm je w szczelinach Void innych graczy lub wymieniaj bezpośrednio relikwie/części.',
        relicTitle: 'Pokaż, gdzie {relic} wypada na mapie',
        planetTitle: 'Podświetl {part} na {planet}',
        chipVaulted: 'w skarbcu',
        moreSources: '+{n} więcej źródeł',
        noDrop: 'Brak dropu w misjach — sprawdź wiki (zadanie, badania w dojo, syndykat lub sprzedawca).',
      },
    },
  },
  it: {
    guideDialog: {
      eyebrow: 'Guida al farming',
      title: 'Warframes',
      backAria: 'Torna a tutti i warframe',
      closeAria: 'Chiudi la guida',
      loading: 'Lettura dei registri della Fonderia…',
      retry: 'Riprova',
      tabs: {
        all: 'Tutti',
        prime: 'Prime',
        standard: 'Standard',
      },
      search: 'Cerca un warframe',
      noMatch: 'Nessun warframe corrisponde a "{query}".',
      sourceNote:
        'Fonti: dati sui drop della community WFCD (aggiornati automaticamente con le patch del gioco) · prezzi da Warframe Market.',
      badge: {
        vaulted: 'Archiviata',
      },
      detail: {
        wiki: 'wiki',
        setBuyline: 'Salta il farming: il set completo si vende a circa {price} su Warframe Market.',
        setVsParts: 'Set o pezzi — conviene comprare i pezzi?',
        mainBlueprint: 'Progetto principale: mercato di gioco, {credits} crediti.',
        fullyBuilt: 'Già costruito: mercato di gioco, {plat} platino.',
        standardNote:
          'I progetti e i pezzi dei warframe standard non possono essere scambiati tra giocatori — le fonti qui sotto sono il modo per ottenerli da soli.',
        vaultedNote:
          'Archiviata — le sue reliquie non cadono più; farmale nelle fessure del Void di altri giocatori o scambia direttamente le reliquie/i pezzi.',
        relicTitle: 'Mostra dove cade {relic} sulla mappa',
        planetTitle: 'Evidenzia {part} su {planet}',
        chipVaulted: 'archiviata',
        moreSources: '+{n} altre fonti',
        noDrop: 'Nessun drop nelle missioni — consulta la wiki (missione, ricerca nel dojo, sindacato o venditore).',
      },
    },
  },
  uk: {
    guideDialog: {
      eyebrow: 'Гайд з фарму',
      title: 'Warframes',
      backAria: 'Назад до всіх варфреймів',
      closeAria: 'Закрити гайд',
      loading: 'Читання записів Кузні…',
      retry: 'Повторити',
      tabs: {
        all: 'Усі',
        prime: 'Prime',
        standard: 'Стандартні',
      },
      search: 'Пошук варфрейма',
      noMatch: 'Немає варфреймів, що відповідають "{query}".',
      sourceNote:
        'Джерела: дані про дроп від спільноти WFCD (оновлюються автоматично з патчами гри) · ціни з Warframe Market.',
      badge: {
        vaulted: 'У сховищі',
      },
      detail: {
        wiki: 'вікі',
        setBuyline: 'Не хочеш фармити: повний набір продається приблизно за {price} на Warframe Market.',
        setVsParts: 'Набір чи частини — дешевше купити частини?',
        mainBlueprint: 'Основне креслення: внутрішньоігровий ринок, {credits} кредитів.',
        fullyBuilt: 'Уже зібрано: внутрішньоігровий ринок, {plat} платини.',
        standardNote:
          'Креслення та частини стандартних варфреймів не можна обмінювати між гравцями — джерела нижче показують, як отримати їх самостійно.',
        vaultedNote:
          'У сховищі — його реліквії більше не випадають; фарми їх у розломах Void інших гравців або обмінюй напряму реліквії/частини.',
        relicTitle: 'Показати, де на карті випадає {relic}',
        planetTitle: 'Виділити {part} на {planet}',
        chipVaulted: 'у сховищі',
        moreSources: '+{n} джерел',
        noDrop: 'Немає дропу в місіях — дивись вікі (завдання, дослідження в додзьо, синдикат або торговець).',
      },
    },
  },
}
