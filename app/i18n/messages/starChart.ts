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
}
