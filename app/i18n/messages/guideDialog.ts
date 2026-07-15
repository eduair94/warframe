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
}
