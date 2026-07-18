// Shared misc UI components, namespaced under `components.*` with one sub-object
// per component: pwa (iOS add-to-home dialog), verdict (market verdict badge),
// trade (WTS/WTB copy buttons), itemCompare (comparison dialog), priceChart
// (sparkline history). Follows the shared glossary: platinum→platino/platina,
// buy/sell→compra/venta·venda, flip→reventa/revenda. Proper nouns kept
// (Warframe, Safari, WTS, WTB). LastTransactionCell has no user-facing strings,
// so it has no sub-object here.
export default {
  en: {
    components: {
      pwa: {
        installApp: 'Install app',
        addToHome: 'Add to Home Screen',
        shareLabel: 'Share',
        addLabel: 'Add',
        step1: "Tap the {share} icon {icon} in Safari's toolbar.",
        step2: 'Choose {add} {icon}.',
        step3: 'Tap {add} — it installs like a native app.',
        gotIt: 'Got it',
      },
      verdict: {
        labels: { buy: 'BUY', sell: 'SELL', fair: 'FAIR' },
        confidence: 'confidence',
        under: '{pct}% under',
        over: '{pct}% over',
        tip: {
          fairValue: 'Fair value: {value}p',
          bestSellBuy: 'Best sell: {sell}p · Best buy: {buy}p',
          flipConfidence: 'Flip margin: {margin}p · Confidence: {conf}%',
        },
      },
      trade: {
        disclaimer:
          'Warframe has no public API for its in-game chat, so nothing can post there automatically - copy a ready-to-paste trade message instead.',
        copyWts: 'Copy WTS message',
        copyWtb: 'Copy WTB message',
        copied: 'Copied!',
      },
      itemCompare: {
        title: 'Item Comparison',
        close: 'Close',
      },
      priceChart: {
        empty: 'Not enough history yet - check back after a couple of days.',
        rangeLabel: '{days}-day avg price trend',
        ariaLabel: 'Average price over the last {days} days, from {from} to {to} platinum',
        title: 'Price history',
        viewAsTable: 'View as table',
        flat: 'Flat (±{pct}%)',
        table: {
          date: 'Date',
          avgPrice: 'Avg Price',
          buy: 'Buy',
          sell: 'Sell',
        },
      },
    },
  },
  es: {
    components: {
      pwa: {
        installApp: 'Instalar app',
        addToHome: 'Añadir a pantalla de inicio',
        shareLabel: 'Compartir',
        addLabel: 'Añadir',
        step1: 'Toca el icono {share} {icon} en la barra de Safari.',
        step2: 'Elige {add} {icon}.',
        step3: 'Toca {add} — se instala como una app nativa.',
        gotIt: 'Entendido',
      },
      verdict: {
        labels: { buy: 'COMPRA', sell: 'VENTA', fair: 'JUSTO' },
        confidence: 'confianza',
        under: '{pct}% por debajo',
        over: '{pct}% por encima',
        tip: {
          fairValue: 'Valor justo: {value}p',
          bestSellBuy: 'Mejor venta: {sell}p · Mejor compra: {buy}p',
          flipConfidence: 'Margen de reventa: {margin}p · Confianza: {conf}%',
        },
      },
      trade: {
        disclaimer:
          'Warframe no tiene una API pública para su chat del juego, así que nada puede publicar ahí automáticamente: copia un mensaje de intercambio listo para pegar.',
        copyWts: 'Copiar mensaje WTS',
        copyWtb: 'Copiar mensaje WTB',
        copied: '¡Copiado!',
      },
      itemCompare: {
        title: 'Comparación de objetos',
        close: 'Cerrar',
      },
      priceChart: {
        empty: 'Aún no hay suficiente historial: vuelve dentro de un par de días.',
        rangeLabel: 'Tendencia del precio prom. de {days} días',
        ariaLabel: 'Precio promedio de los últimos {days} días, de {from} a {to} platino',
        title: 'Historial de precios',
        viewAsTable: 'Ver como tabla',
        flat: 'Estable (±{pct}%)',
        table: {
          date: 'Fecha',
          avgPrice: 'Precio prom.',
          buy: 'Compra',
          sell: 'Venta',
        },
      },
    },
  },
  pt: {
    components: {
      pwa: {
        installApp: 'Instalar app',
        addToHome: 'Adicionar à Tela de Início',
        shareLabel: 'Compartilhar',
        addLabel: 'Adicionar',
        step1: 'Toque no ícone {share} {icon} na barra do Safari.',
        step2: 'Escolha {add} {icon}.',
        step3: 'Toque em {add} — ele instala como um app nativo.',
        gotIt: 'Entendi',
      },
      verdict: {
        labels: { buy: 'COMPRA', sell: 'VENDA', fair: 'JUSTO' },
        confidence: 'confiança',
        under: '{pct}% abaixo',
        over: '{pct}% acima',
        tip: {
          fairValue: 'Valor justo: {value}p',
          bestSellBuy: 'Melhor venda: {sell}p · Melhor compra: {buy}p',
          flipConfidence: 'Margem de revenda: {margin}p · Confiança: {conf}%',
        },
      },
      trade: {
        disclaimer:
          'O Warframe não tem uma API pública para o chat do jogo, então nada pode publicar lá automaticamente: copie uma mensagem de troca pronta para colar.',
        copyWts: 'Copiar mensagem WTS',
        copyWtb: 'Copiar mensagem WTB',
        copied: 'Copiado!',
      },
      itemCompare: {
        title: 'Comparação de itens',
        close: 'Fechar',
      },
      priceChart: {
        empty: 'Ainda não há histórico suficiente: volte daqui a alguns dias.',
        rangeLabel: 'Tendência do preço méd. de {days} dias',
        ariaLabel: 'Preço médio dos últimos {days} dias, de {from} a {to} platina',
        title: 'Histórico de preços',
        viewAsTable: 'Ver como tabela',
        flat: 'Estável (±{pct}%)',
        table: {
          date: 'Data',
          avgPrice: 'Preço méd.',
          buy: 'Compra',
          sell: 'Venda',
        },
      },
    },
  },
  de: {
    components: {
      pwa: {
        installApp: 'App installieren',
        addToHome: 'Zum Home-Bildschirm hinzufügen',
        shareLabel: 'Teilen',
        addLabel: 'Hinzufügen',
        step1: 'Tippe auf das {share}-Symbol {icon} in der Safari-Leiste.',
        step2: 'Wähle {add} {icon}.',
        step3: 'Tippe auf {add} — es wird wie eine native App installiert.',
        gotIt: 'Verstanden',
      },
      verdict: {
        labels: { buy: 'KAUFEN', sell: 'VERKAUFEN', fair: 'FAIR' },
        confidence: 'Sicherheit',
        under: '{pct}% darunter',
        over: '{pct}% darüber',
        tip: {
          fairValue: 'Fairer Wert: {value}p',
          bestSellBuy: 'Bester Verkauf: {sell}p · Bester Kauf: {buy}p',
          flipConfidence: 'Wiederverkaufsmarge: {margin}p · Sicherheit: {conf}%',
        },
      },
      trade: {
        disclaimer:
          'Warframe hat keine öffentliche API für den spielinternen Chat, daher kann dort nichts automatisch gepostet werden — kopiere stattdessen eine fertige Handelsnachricht zum Einfügen.',
        copyWts: 'WTS-Nachricht kopieren',
        copyWtb: 'WTB-Nachricht kopieren',
        copied: 'Kopiert!',
      },
      itemCompare: {
        title: 'Gegenstandsvergleich',
        close: 'Schließen',
      },
      priceChart: {
        empty: 'Noch nicht genug Verlauf — schau in ein paar Tagen wieder vorbei.',
        rangeLabel: 'Preistrend Ø {days} Tage',
        ariaLabel: 'Durchschnittspreis der letzten {days} Tage, von {from} bis {to} Platin',
        title: 'Preisverlauf',
        viewAsTable: 'Als Tabelle anzeigen',
        flat: 'Stabil (±{pct}%)',
        table: {
          date: 'Datum',
          avgPrice: 'Ø Preis',
          buy: 'Kauf',
          sell: 'Verkauf',
        },
      },
    },
  },
  fr: {
    components: {
      pwa: {
        installApp: "Installer l'app",
        addToHome: "Ajouter à l'écran d'accueil",
        shareLabel: 'Partager',
        addLabel: 'Ajouter',
        step1: "Touchez l'icône {share} {icon} dans la barre de Safari.",
        step2: 'Choisissez {add} {icon}.',
        step3: "Touchez {add} — elle s'installe comme une app native.",
        gotIt: 'Compris',
      },
      verdict: {
        labels: { buy: 'ACHETER', sell: 'VENDRE', fair: 'JUSTE' },
        confidence: 'confiance',
        under: '{pct}% en dessous',
        over: '{pct}% au-dessus',
        tip: {
          fairValue: 'Valeur juste : {value}p',
          bestSellBuy: 'Meilleure vente : {sell}p · Meilleur achat : {buy}p',
          flipConfidence: 'Marge de revente : {margin}p · Confiance : {conf}%',
        },
      },
      trade: {
        disclaimer:
          "Warframe n'a pas d'API publique pour son chat en jeu, donc rien ne peut y être publié automatiquement : copiez plutôt un message d'échange prêt à coller.",
        copyWts: 'Copier le message WTS',
        copyWtb: 'Copier le message WTB',
        copied: 'Copié !',
      },
      itemCompare: {
        title: "Comparaison d'objets",
        close: 'Fermer',
      },
      priceChart: {
        empty: "Pas encore assez d'historique : revenez dans quelques jours.",
        rangeLabel: 'Tendance du prix moy. sur {days} jours',
        ariaLabel: 'Prix moyen des {days} derniers jours, de {from} à {to} platine',
        title: 'Historique des prix',
        viewAsTable: 'Voir en tableau',
        flat: 'Stable (±{pct}%)',
        table: {
          date: 'Date',
          avgPrice: 'Prix moy.',
          buy: 'Achat',
          sell: 'Vente',
        },
      },
    },
  },
  ru: {
    components: {
      pwa: {
        installApp: 'Установить приложение',
        addToHome: 'На главный экран',
        shareLabel: 'Поделиться',
        addLabel: 'Добавить',
        step1: 'Нажмите значок {share} {icon} на панели Safari.',
        step2: 'Выберите {add} {icon}.',
        step3: 'Нажмите {add} — оно устанавливается как обычное приложение.',
        gotIt: 'Понятно',
      },
      verdict: {
        labels: { buy: 'ПОКУПКА', sell: 'ПРОДАЖА', fair: 'ЧЕСТНО' },
        confidence: 'уверенность',
        under: 'на {pct}% ниже',
        over: 'на {pct}% выше',
        tip: {
          fairValue: 'Честная цена: {value}p',
          bestSellBuy: 'Лучшая продажа: {sell}p · Лучшая покупка: {buy}p',
          flipConfidence: 'Маржа перепродажи: {margin}p · Уверенность: {conf}%',
        },
      },
      trade: {
        disclaimer:
          'В Warframe нет публичного API для внутриигрового чата, поэтому туда ничего нельзя отправить автоматически — вместо этого скопируйте готовое торговое сообщение для вставки.',
        copyWts: 'Копировать сообщение WTS',
        copyWtb: 'Копировать сообщение WTB',
        copied: 'Скопировано!',
      },
      itemCompare: {
        title: 'Сравнение предметов',
        close: 'Закрыть',
      },
      priceChart: {
        empty: 'Пока недостаточно истории — загляните через пару дней.',
        rangeLabel: 'Тренд средней цены за {days} дн.',
        ariaLabel: 'Средняя цена за последние {days} дней, от {from} до {to} платины',
        title: 'История цен',
        viewAsTable: 'Показать таблицей',
        flat: 'Стабильно (±{pct}%)',
        table: {
          date: 'Дата',
          avgPrice: 'Ср. цена',
          buy: 'Покупка',
          sell: 'Продажа',
        },
      },
    },
  },
  ko: {
    components: {
      pwa: {
        installApp: '앱 설치',
        addToHome: '홈 화면에 추가',
        shareLabel: '공유',
        addLabel: '추가',
        step1: 'Safari 툴바에서 {share} 아이콘 {icon}을 누르세요.',
        step2: '{add} {icon}을 선택하세요.',
        step3: '{add}을 누르면 네이티브 앱처럼 설치됩니다.',
        gotIt: '확인',
      },
      verdict: {
        labels: { buy: '구매', sell: '판매', fair: '적정' },
        confidence: '신뢰도',
        under: '{pct}% 낮음',
        over: '{pct}% 높음',
        tip: {
          fairValue: '적정가: {value}p',
          bestSellBuy: '최고 판매가: {sell}p · 최고 구매가: {buy}p',
          flipConfidence: '되팔기 마진: {margin}p · 신뢰도: {conf}%',
        },
      },
      trade: {
        disclaimer:
          'Warframe에는 게임 내 채팅용 공개 API가 없어 자동으로 게시할 수 없습니다 — 대신 바로 붙여넣을 수 있는 거래 메시지를 복사하세요.',
        copyWts: 'WTS 메시지 복사',
        copyWtb: 'WTB 메시지 복사',
        copied: '복사됨!',
      },
      itemCompare: {
        title: '아이템 비교',
        close: '닫기',
      },
      priceChart: {
        empty: '아직 기록이 충분하지 않습니다 — 며칠 후에 다시 확인하세요.',
        rangeLabel: '{days}일 평균 가격 추세',
        ariaLabel: '지난 {days}일간 평균 가격, {from}에서 {to} 플래티넘까지',
        title: '가격 기록',
        viewAsTable: '표로 보기',
        flat: '보합 (±{pct}%)',
        table: {
          date: '날짜',
          avgPrice: '평균가',
          buy: '구매',
          sell: '판매',
        },
      },
    },
  },
  ja: {
    components: {
      pwa: {
        installApp: 'アプリをインストール',
        addToHome: 'ホーム画面に追加',
        shareLabel: '共有',
        addLabel: '追加',
        step1: 'Safariのツールバーで{share}アイコン{icon}をタップします。',
        step2: '{add} {icon}を選びます。',
        step3: '{add}をタップすると、ネイティブアプリのようにインストールされます。',
        gotIt: 'OK',
      },
      verdict: {
        labels: { buy: '買い', sell: '売り', fair: '適正' },
        confidence: '信頼度',
        under: '{pct}%安い',
        over: '{pct}%高い',
        tip: {
          fairValue: '適正価格: {value}p',
          bestSellBuy: '最高売値: {sell}p · 最高買値: {buy}p',
          flipConfidence: '転売利ざや: {margin}p · 信頼度: {conf}%',
        },
      },
      trade: {
        disclaimer:
          'Warframeにはゲーム内チャット用の公開APIがないため、自動で投稿することはできません — 代わりに貼り付けるだけの取引メッセージをコピーしてください。',
        copyWts: 'WTSメッセージをコピー',
        copyWtb: 'WTBメッセージをコピー',
        copied: 'コピーしました!',
      },
      itemCompare: {
        title: 'アイテム比較',
        close: '閉じる',
      },
      priceChart: {
        empty: 'まだ履歴が足りません — 数日後にもう一度ご確認ください。',
        rangeLabel: '{days}日間の平均価格トレンド',
        ariaLabel: '過去{days}日間の平均価格、{from}から{to}プラチナまで',
        title: '価格履歴',
        viewAsTable: 'テーブルで表示',
        flat: '横ばい (±{pct}%)',
        table: {
          date: '日付',
          avgPrice: '平均価格',
          buy: '買い',
          sell: '売り',
        },
      },
    },
  },
  'zh-hans': {
    components: {
      pwa: {
        installApp: '安装应用',
        addToHome: '添加到主屏幕',
        shareLabel: '分享',
        addLabel: '添加',
        step1: '在 Safari 工具栏中点按 {share} 图标 {icon}。',
        step2: '选择 {add} {icon}。',
        step3: '点按 {add} — 它会像原生应用一样安装。',
        gotIt: '知道了',
      },
      verdict: {
        labels: { buy: '买入', sell: '卖出', fair: '合理' },
        confidence: '置信度',
        under: '低 {pct}%',
        over: '高 {pct}%',
        tip: {
          fairValue: '合理价格：{value}p',
          bestSellBuy: '最佳卖价：{sell}p · 最佳买价：{buy}p',
          flipConfidence: '转卖利润：{margin}p · 置信度：{conf}%',
        },
      },
      trade: {
        disclaimer:
          'Warframe 没有面向游戏内聊天的公开 API，因此无法自动发送到那里 — 请改为复制一条可直接粘贴的交易消息。',
        copyWts: '复制 WTS 消息',
        copyWtb: '复制 WTB 消息',
        copied: '已复制！',
      },
      itemCompare: {
        title: '物品对比',
        close: '关闭',
      },
      priceChart: {
        empty: '历史数据还不够 — 过几天再来看看。',
        rangeLabel: '{days} 天平均价格走势',
        ariaLabel: '最近 {days} 天的平均价格，从 {from} 到 {to} 白金',
        title: '价格历史',
        viewAsTable: '以表格查看',
        flat: '平稳 (±{pct}%)',
        table: {
          date: '日期',
          avgPrice: '平均价',
          buy: '买入',
          sell: '卖出',
        },
      },
    },
  },
  'zh-hant': {
    components: {
      pwa: {
        installApp: '安裝應用程式',
        addToHome: '加入主畫面',
        shareLabel: '分享',
        addLabel: '加入',
        step1: '在 Safari 工具列中點一下 {share} 圖示 {icon}。',
        step2: '選擇 {add} {icon}。',
        step3: '點一下 {add} — 它會像原生應用程式一樣安裝。',
        gotIt: '知道了',
      },
      verdict: {
        labels: { buy: '買入', sell: '賣出', fair: '合理' },
        confidence: '信心度',
        under: '低 {pct}%',
        over: '高 {pct}%',
        tip: {
          fairValue: '合理價格：{value}p',
          bestSellBuy: '最佳賣價：{sell}p · 最佳買價：{buy}p',
          flipConfidence: '轉賣利潤：{margin}p · 信心度：{conf}%',
        },
      },
      trade: {
        disclaimer:
          'Warframe 沒有針對遊戲內聊天的公開 API，因此無法自動發送到那裡 — 請改為複製一則可直接貼上的交易訊息。',
        copyWts: '複製 WTS 訊息',
        copyWtb: '複製 WTB 訊息',
        copied: '已複製！',
      },
      itemCompare: {
        title: '物品比較',
        close: '關閉',
      },
      priceChart: {
        empty: '歷史資料還不夠 — 過幾天再回來看看。',
        rangeLabel: '{days} 天平均價格走勢',
        ariaLabel: '最近 {days} 天的平均價格，從 {from} 到 {to} 白金',
        title: '價格歷史',
        viewAsTable: '以表格檢視',
        flat: '持平 (±{pct}%)',
        table: {
          date: '日期',
          avgPrice: '平均價',
          buy: '買入',
          sell: '賣出',
        },
      },
    },
  },
  pl: {
    components: {
      pwa: {
        installApp: 'Zainstaluj aplikację',
        addToHome: 'Dodaj do ekranu głównego',
        shareLabel: 'Udostępnij',
        addLabel: 'Dodaj',
        step1: 'Dotknij ikony {share} {icon} na pasku Safari.',
        step2: 'Wybierz {add} {icon}.',
        step3: 'Dotknij {add} — zainstaluje się jak natywna aplikacja.',
        gotIt: 'Rozumiem',
      },
      verdict: {
        labels: { buy: 'KUP', sell: 'SPRZEDAJ', fair: 'UCZCIWA' },
        confidence: 'pewność',
        under: '{pct}% poniżej',
        over: '{pct}% powyżej',
        tip: {
          fairValue: 'Uczciwa cena: {value}p',
          bestSellBuy: 'Najlepsza sprzedaż: {sell}p · Najlepszy zakup: {buy}p',
          flipConfidence: 'Marża odsprzedaży: {margin}p · Pewność: {conf}%',
        },
      },
      trade: {
        disclaimer:
          'Warframe nie ma publicznego API do czatu w grze, więc nic nie może zostać tam wysłane automatycznie — zamiast tego skopiuj gotową wiadomość handlową do wklejenia.',
        copyWts: 'Kopiuj wiadomość WTS',
        copyWtb: 'Kopiuj wiadomość WTB',
        copied: 'Skopiowano!',
      },
      itemCompare: {
        title: 'Porównanie przedmiotów',
        close: 'Zamknij',
      },
      priceChart: {
        empty: 'Za mało historii — wróć za kilka dni.',
        rangeLabel: 'Trend śred. ceny z {days} dni',
        ariaLabel: 'Średnia cena z ostatnich {days} dni, od {from} do {to} platyny',
        title: 'Historia cen',
        viewAsTable: 'Pokaż jako tabelę',
        flat: 'Stabilna (±{pct}%)',
        table: {
          date: 'Data',
          avgPrice: 'Śr. cena',
          buy: 'Kupno',
          sell: 'Sprzedaż',
        },
      },
    },
  },
  it: {
    components: {
      pwa: {
        installApp: 'Installa app',
        addToHome: 'Aggiungi alla schermata Home',
        shareLabel: 'Condividi',
        addLabel: 'Aggiungi',
        step1: "Tocca l'icona {share} {icon} nella barra di Safari.",
        step2: 'Scegli {add} {icon}.',
        step3: "Tocca {add} — si installa come un'app nativa.",
        gotIt: 'Ho capito',
      },
      verdict: {
        labels: { buy: 'COMPRA', sell: 'VENDI', fair: 'EQUO' },
        confidence: 'affidabilità',
        under: '{pct}% sotto',
        over: '{pct}% sopra',
        tip: {
          fairValue: 'Valore equo: {value}p',
          bestSellBuy: 'Miglior vendita: {sell}p · Miglior acquisto: {buy}p',
          flipConfidence: 'Margine di rivendita: {margin}p · Affidabilità: {conf}%',
        },
      },
      trade: {
        disclaimer:
          "Warframe non ha un'API pubblica per la chat di gioco, quindi nulla può essere pubblicato lì automaticamente: copia invece un messaggio di scambio pronto da incollare.",
        copyWts: 'Copia messaggio WTS',
        copyWtb: 'Copia messaggio WTB',
        copied: 'Copiato!',
      },
      itemCompare: {
        title: 'Confronto oggetti',
        close: 'Chiudi',
      },
      priceChart: {
        empty: 'Cronologia ancora insufficiente: ricontrolla tra un paio di giorni.',
        rangeLabel: 'Andamento prezzo medio a {days} giorni',
        ariaLabel: 'Prezzo medio degli ultimi {days} giorni, da {from} a {to} platino',
        title: 'Cronologia prezzi',
        viewAsTable: 'Vedi come tabella',
        flat: 'Stabile (±{pct}%)',
        table: {
          date: 'Data',
          avgPrice: 'Prezzo medio',
          buy: 'Acquisto',
          sell: 'Vendita',
        },
      },
    },
  },
  uk: {
    components: {
      pwa: {
        installApp: 'Встановити застосунок',
        addToHome: 'Додати на головний екран',
        shareLabel: 'Поділитися',
        addLabel: 'Додати',
        step1: 'Торкніться значка {share} {icon} на панелі Safari.',
        step2: 'Виберіть {add} {icon}.',
        step3: 'Торкніться {add} — він встановлюється як звичайний застосунок.',
        gotIt: 'Зрозуміло',
      },
      verdict: {
        labels: { buy: 'КУПІВЛЯ', sell: 'ПРОДАЖ', fair: 'СПРАВЕДЛИВО' },
        confidence: 'впевненість',
        under: 'на {pct}% нижче',
        over: 'на {pct}% вище',
        tip: {
          fairValue: 'Справедлива ціна: {value}p',
          bestSellBuy: 'Найкращий продаж: {sell}p · Найкраща купівля: {buy}p',
          flipConfidence: 'Маржа перепродажу: {margin}p · Впевненість: {conf}%',
        },
      },
      trade: {
        disclaimer:
          'У Warframe немає публічного API для внутрішньоігрового чату, тому туди нічого не можна надіслати автоматично — замість цього скопіюйте готове торгове повідомлення для вставки.',
        copyWts: 'Копіювати повідомлення WTS',
        copyWtb: 'Копіювати повідомлення WTB',
        copied: 'Скопійовано!',
      },
      itemCompare: {
        title: 'Порівняння предметів',
        close: 'Закрити',
      },
      priceChart: {
        empty: 'Поки що недостатньо історії — завітайте за кілька днів.',
        rangeLabel: 'Тренд середньої ціни за {days} дн.',
        ariaLabel: 'Середня ціна за останні {days} днів, від {from} до {to} платини',
        title: 'Історія цін',
        viewAsTable: 'Показати таблицею',
        flat: 'Стабільно (±{pct}%)',
        table: {
          date: 'Дата',
          avgPrice: 'Сер. ціна',
          buy: 'Купівля',
          sell: 'Продаж',
        },
      },
    },
  },
}
