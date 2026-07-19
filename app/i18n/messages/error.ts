// Copy for the standalone error / 404 page (app/app/error.vue). Namespaced under
// `error404.*`. Framed in-world: a dead link is a Void navigation failure — the
// page has "drifted into the Void". Recovery link labels reuse `nav.items.*`.
// NOTE for i18n:check — no literal `@` or `{` (single-brace {code} interpolation
// only), or vue-i18n's compiler throws. See scripts/i18n-check.mts.
export default {
  en: {
    error404: {
      signalLost: 'Void Signal Lost',
      systemFault: 'System Fault',
      errorLabel: 'Error {code}',
      title404: 'These coordinates lead nowhere',
      titleError: 'A rift has destabilized',
      lede404:
        'The page you seek has drifted into the Void — moved, vaulted, or never charted. Set a new waypoint below.',
      ledeError:
        'An unexpected fault interrupted the transmission. Return to the Origin and try again.',
      homeCta: 'Return to Origin',
      chartCta: 'Open Star Chart',
      waypoints: 'Set a new waypoint',
      statusLabel: 'Status',
      statusValue: 'Link severed',
      codeLabel: 'Code',
      sectorLabel: 'Sector',
      sectorValue: 'Uncharted',
    },
  },
  es: {
    error404: {
      signalLost: 'Señal del Vacío perdida',
      systemFault: 'Fallo del sistema',
      errorLabel: 'Error {code}',
      title404: 'Estas coordenadas no llevan a ninguna parte',
      titleError: 'Una fisura se ha desestabilizado',
      lede404:
        'La página que buscas se ha perdido en el Vacío: movida, vedada o nunca trazada. Fija un nuevo rumbo abajo.',
      ledeError:
        'Un fallo inesperado interrumpió la transmisión. Vuelve al inicio e inténtalo de nuevo.',
      homeCta: 'Volver al inicio',
      chartCta: 'Abrir el mapa estelar',
      waypoints: 'Fija un nuevo rumbo',
      statusLabel: 'Estado',
      statusValue: 'Enlace cortado',
      codeLabel: 'Código',
      sectorLabel: 'Sector',
      sectorValue: 'Sin trazar',
    },
  },
  pt: {
    error404: {
      signalLost: 'Sinal do Vazio perdido',
      systemFault: 'Falha no sistema',
      errorLabel: 'Erro {code}',
      title404: 'Estas coordenadas não levam a lugar nenhum',
      titleError: 'Uma fenda se desestabilizou',
      lede404:
        'A página que você procura se perdeu no Vazio: movida, vedada ou nunca mapeada. Defina um novo destino abaixo.',
      ledeError:
        'Uma falha inesperada interrompeu a transmissão. Volte ao início e tente novamente.',
      homeCta: 'Voltar ao início',
      chartCta: 'Abrir o mapa estelar',
      waypoints: 'Defina um novo destino',
      statusLabel: 'Estado',
      statusValue: 'Conexão perdida',
      codeLabel: 'Código',
      sectorLabel: 'Setor',
      sectorValue: 'Não mapeado',
    },
  },
  de: {
    error404: {
      signalLost: 'Void-Signal verloren',
      systemFault: 'Systemfehler',
      errorLabel: 'Fehler {code}',
      title404: 'Diese Koordinaten führen ins Leere',
      titleError: 'Ein Riss wurde destabilisiert',
      lede404:
        'Die gesuchte Seite ist im Void verschwunden – verschoben, verschlossen oder nie verzeichnet. Setze unten einen neuen Wegpunkt.',
      ledeError:
        'Ein unerwarteter Fehler hat die Übertragung unterbrochen. Kehre zum Ursprung zurück und versuche es erneut.',
      homeCta: 'Zurück zum Anfang',
      chartCta: 'Sternenkarte öffnen',
      waypoints: 'Setze einen neuen Wegpunkt',
      statusLabel: 'Status',
      statusValue: 'Verbindung getrennt',
      codeLabel: 'Code',
      sectorLabel: 'Sektor',
      sectorValue: 'Unerforscht',
    },
  },
  fr: {
    error404: {
      signalLost: 'Signal du Vide perdu',
      systemFault: 'Défaillance système',
      errorLabel: 'Erreur {code}',
      title404: 'Ces coordonnées ne mènent nulle part',
      titleError: "Une faille s'est déstabilisée",
      lede404:
        'La page recherchée a dérivé dans le Vide : déplacée, verrouillée ou jamais cartographiée. Définissez un nouveau cap ci-dessous.',
      ledeError:
        "Une erreur inattendue a interrompu la transmission. Revenez à l'origine et réessayez.",
      homeCta: "Retour à l'accueil",
      chartCta: 'Ouvrir la carte stellaire',
      waypoints: 'Définissez un nouveau cap',
      statusLabel: 'État',
      statusValue: 'Liaison rompue',
      codeLabel: 'Code',
      sectorLabel: 'Secteur',
      sectorValue: 'Non cartographié',
    },
  },
  ru: {
    error404: {
      signalLost: 'Сигнал Бездны потерян',
      systemFault: 'Системный сбой',
      errorLabel: 'Ошибка {code}',
      title404: 'Эти координаты ведут в никуда',
      titleError: 'Разлом дестабилизирован',
      lede404:
        'Страница, которую вы ищете, унесена в Бездну — перемещена, скрыта или никогда не существовала. Задайте новый курс ниже.',
      ledeError:
        'Непредвиденный сбой прервал передачу. Вернитесь на главную и повторите попытку.',
      homeCta: 'Вернуться на главную',
      chartCta: 'Открыть звёздную карту',
      waypoints: 'Задайте новый курс',
      statusLabel: 'Статус',
      statusValue: 'Связь потеряна',
      codeLabel: 'Код',
      sectorLabel: 'Сектор',
      sectorValue: 'Не нанесён на карту',
    },
  },
  ko: {
    error404: {
      signalLost: '보이드 신호 소실',
      systemFault: '시스템 오류',
      errorLabel: '오류 {code}',
      title404: '이 좌표는 어디에도 이어지지 않습니다',
      titleError: '균열이 불안정해졌습니다',
      lede404:
        '찾으시는 페이지가 보이드로 사라졌습니다 — 이동되었거나, 봉인되었거나, 존재한 적이 없습니다. 아래에서 새 경로를 설정하세요.',
      ledeError:
        '예기치 않은 오류로 전송이 중단되었습니다. 처음으로 돌아가 다시 시도하세요.',
      homeCta: '처음으로 돌아가기',
      chartCta: '성계 지도 열기',
      waypoints: '새 경로 설정',
      statusLabel: '상태',
      statusValue: '연결 끊김',
      codeLabel: '코드',
      sectorLabel: '섹터',
      sectorValue: '미탐사',
    },
  },
  ja: {
    error404: {
      signalLost: 'ボイド信号消失',
      systemFault: 'システム障害',
      errorLabel: 'エラー {code}',
      title404: 'この座標はどこにも通じていません',
      titleError: '亀裂が不安定になりました',
      lede404:
        'お探しのページはボイドへ消えました — 移動、封印、あるいは最初から存在しません。下から新しい目的地を設定してください。',
      ledeError:
        '予期しない障害により通信が中断されました。ホームに戻ってやり直してください。',
      homeCta: 'ホームに戻る',
      chartCta: 'スターチャートを開く',
      waypoints: '新しい目的地を設定',
      statusLabel: 'ステータス',
      statusValue: '接続切断',
      codeLabel: 'コード',
      sectorLabel: 'セクター',
      sectorValue: '未探査',
    },
  },
  'zh-hans': {
    error404: {
      signalLost: '虚空信号丢失',
      systemFault: '系统故障',
      errorLabel: '错误 {code}',
      title404: '这些坐标通向虚无',
      titleError: '裂隙已失稳',
      lede404:
        '你要找的页面已漂入虚空——被移动、被封存，或从未存在。请在下方设定新的航点。',
      ledeError: '意外故障中断了传输。请返回首页后重试。',
      homeCta: '返回首页',
      chartCta: '打开星图',
      waypoints: '设定新的航点',
      statusLabel: '状态',
      statusValue: '连接中断',
      codeLabel: '代码',
      sectorLabel: '星区',
      sectorValue: '未测绘',
    },
  },
  'zh-hant': {
    error404: {
      signalLost: '虛空訊號遺失',
      systemFault: '系統故障',
      errorLabel: '錯誤 {code}',
      title404: '這些座標通往虛無',
      titleError: '裂隙已失穩',
      lede404:
        '你要找的頁面已漂入虛空——被移動、被封存，或從未存在。請在下方設定新的航點。',
      ledeError: '意外故障中斷了傳輸。請返回首頁後重試。',
      homeCta: '返回首頁',
      chartCta: '開啟星圖',
      waypoints: '設定新的航點',
      statusLabel: '狀態',
      statusValue: '連線中斷',
      codeLabel: '代碼',
      sectorLabel: '星區',
      sectorValue: '未測繪',
    },
  },
  pl: {
    error404: {
      signalLost: 'Utracono sygnał Otchłani',
      systemFault: 'Awaria systemu',
      errorLabel: 'Błąd {code}',
      title404: 'Te współrzędne prowadzą donikąd',
      titleError: 'Szczelina uległa destabilizacji',
      lede404:
        'Strona, której szukasz, zniknęła w Otchłani — przeniesiona, zamknięta lub nigdy nie istniała. Wyznacz nowy punkt trasy poniżej.',
      ledeError:
        'Nieoczekiwany błąd przerwał transmisję. Wróć na stronę główną i spróbuj ponownie.',
      homeCta: 'Wróć na stronę główną',
      chartCta: 'Otwórz mapę gwiezdną',
      waypoints: 'Wyznacz nowy punkt trasy',
      statusLabel: 'Status',
      statusValue: 'Połączenie zerwane',
      codeLabel: 'Kod',
      sectorLabel: 'Sektor',
      sectorValue: 'Niezbadany',
    },
  },
  it: {
    error404: {
      signalLost: 'Segnale del Vuoto perso',
      systemFault: 'Guasto di sistema',
      errorLabel: 'Errore {code}',
      title404: 'Queste coordinate non portano da nessuna parte',
      titleError: 'Una faglia si è destabilizzata',
      lede404:
        'La pagina che cerchi si è dispersa nel Vuoto: spostata, sigillata o mai tracciata. Imposta una nuova rotta qui sotto.',
      ledeError:
        'Un guasto imprevisto ha interrotto la trasmissione. Torna alla home e riprova.',
      homeCta: 'Torna alla home',
      chartCta: 'Apri la mappa stellare',
      waypoints: 'Imposta una nuova rotta',
      statusLabel: 'Stato',
      statusValue: 'Collegamento interrotto',
      codeLabel: 'Codice',
      sectorLabel: 'Settore',
      sectorValue: 'Non tracciato',
    },
  },
  uk: {
    error404: {
      signalLost: 'Сигнал Порожнечі втрачено',
      systemFault: 'Збій системи',
      errorLabel: 'Помилка {code}',
      title404: 'Ці координати ведуть у нікуди',
      titleError: 'Розлом дестабілізовано',
      lede404:
        'Сторінка, яку ви шукаєте, зникла в Порожнечі — переміщена, закрита або ніколи не існувала. Задайте новий курс нижче.',
      ledeError:
        'Неочікуваний збій перервав передачу. Поверніться на головну та спробуйте ще раз.',
      homeCta: 'Повернутися на головну',
      chartCta: 'Відкрити зоряну карту',
      waypoints: 'Задайте новий курс',
      statusLabel: 'Статус',
      statusValue: 'Зв’язок втрачено',
      codeLabel: 'Код',
      sectorLabel: 'Сектор',
      sectorValue: 'Не нанесено на карту',
    },
  },
}
