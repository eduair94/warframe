// Cross-page labels computed inside composables (marketFormat.demandTier,
// useFlipScore.flipTier). The composables resolve these by their stable `key`
// via the global i18n `t`, so every consuming page localizes with no per-page
// wiring. Namespaced under `common.*`.
export default {
  en: {
    common: {
      demand: {
        high: 'High demand',
        med: 'Fair demand',
        low: 'Thin demand',
        dead: 'No demand',
      },
      flipTier: {
        strong: 'Strong',
        fair: 'Fair',
        thin: 'Thin',
        spec: 'Speculative',
      },
      dissolveMaxed: 'dissolve maxed (48h avg)',
    },
  },
  es: {
    common: {
      demand: {
        high: 'Alta demanda',
        med: 'Demanda media',
        low: 'Baja demanda',
        dead: 'Sin demanda',
      },
      flipTier: {
        strong: 'Fuerte',
        fair: 'Aceptable',
        thin: 'Débil',
        spec: 'Especulativo',
      },
      dissolveMaxed: 'disolver al máx. (prom. 48h)',
    },
  },
  pt: {
    common: {
      demand: {
        high: 'Alta demanda',
        med: 'Demanda média',
        low: 'Baixa demanda',
        dead: 'Sem demanda',
      },
      flipTier: {
        strong: 'Forte',
        fair: 'Razoável',
        thin: 'Fraco',
        spec: 'Especulativo',
      },
      dissolveMaxed: 'dissolver no máx. (méd. 48h)',
    },
  },
  de: {
    common: {
      demand: {
        high: 'Hohe Nachfrage',
        med: 'Mittlere Nachfrage',
        low: 'Geringe Nachfrage',
        dead: 'Keine Nachfrage',
      },
      flipTier: {
        strong: 'Stark',
        fair: 'Solide',
        thin: 'Dünn',
        spec: 'Spekulativ',
      },
      dissolveMaxed: 'max. auflösen (48h-Schnitt)',
    },
  },
  fr: {
    common: {
      demand: {
        high: 'Forte demande',
        med: 'Demande moyenne',
        low: 'Faible demande',
        dead: 'Aucune demande',
      },
      flipTier: {
        strong: 'Fort',
        fair: 'Correct',
        thin: 'Faible',
        spec: 'Spéculatif',
      },
      dissolveMaxed: 'dissoudre au max. (moy. 48h)',
    },
  },
  ru: {
    common: {
      demand: {
        high: 'Высокий спрос',
        med: 'Средний спрос',
        low: 'Низкий спрос',
        dead: 'Нет спроса',
      },
      flipTier: {
        strong: 'Сильный',
        fair: 'Приемлемый',
        thin: 'Слабый',
        spec: 'Спекулятивный',
      },
      dissolveMaxed: 'растворить на макс. (сред. 48ч)',
    },
  },
  ko: {
    common: {
      demand: {
        high: '높은 수요',
        med: '보통 수요',
        low: '낮은 수요',
        dead: '수요 없음',
      },
      flipTier: {
        strong: '강함',
        fair: '양호',
        thin: '약함',
        spec: '투기성',
      },
      dissolveMaxed: '최대 분해 (48시간 평균)',
    },
  },
  ja: {
    common: {
      demand: {
        high: '需要が高い',
        med: '需要は普通',
        low: '需要が低い',
        dead: '需要なし',
      },
      flipTier: {
        strong: '強い',
        fair: '良好',
        thin: '薄い',
        spec: '投機的',
      },
      dissolveMaxed: '最大まで分解 (48時間平均)',
    },
  },
  'zh-hans': {
    common: {
      demand: {
        high: '需求高',
        med: '需求中等',
        low: '需求低',
        dead: '无需求',
      },
      flipTier: {
        strong: '强',
        fair: '尚可',
        thin: '微薄',
        spec: '投机',
      },
      dissolveMaxed: '满级分解 (48小时均价)',
    },
  },
  'zh-hant': {
    common: {
      demand: {
        high: '需求高',
        med: '需求中等',
        low: '需求低',
        dead: '無需求',
      },
      flipTier: {
        strong: '強',
        fair: '尚可',
        thin: '微薄',
        spec: '投機',
      },
      dissolveMaxed: '滿級分解 (48小時均價)',
    },
  },
  pl: {
    common: {
      demand: {
        high: 'Wysoki popyt',
        med: 'Średni popyt',
        low: 'Niski popyt',
        dead: 'Brak popytu',
      },
      flipTier: {
        strong: 'Silny',
        fair: 'Przyzwoity',
        thin: 'Słaby',
        spec: 'Spekulacyjny',
      },
      dissolveMaxed: 'rozłóż na maks. (śr. 48h)',
    },
  },
  it: {
    common: {
      demand: {
        high: 'Alta domanda',
        med: 'Domanda media',
        low: 'Bassa domanda',
        dead: 'Nessuna domanda',
      },
      flipTier: {
        strong: 'Forte',
        fair: 'Discreto',
        thin: 'Debole',
        spec: 'Speculativo',
      },
      dissolveMaxed: 'dissolvi al max. (media 48h)',
    },
  },
  uk: {
    common: {
      demand: {
        high: 'Високий попит',
        med: 'Середній попит',
        low: 'Низький попит',
        dead: 'Немає попиту',
      },
      flipTier: {
        strong: 'Сильний',
        fair: 'Прийнятний',
        thin: 'Слабкий',
        spec: 'Спекулятивний',
      },
      dissolveMaxed: 'розкласти на макс. (сер. 48 год)',
    },
  },
}
