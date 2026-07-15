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
}
