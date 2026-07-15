// 3D star chart page (/star-chart-3d). Namespaced under `starChart3d.*`. Follows the
// shared glossary: platinum→platino/platina, relic→reliquia/relíquia, drops→drops,
// vaulted→vedado. Proper nouns (Warframe, Prime, Void, Forma) and data-driven values
// (planet/node/relic names, numbers, game modes) are kept; "p/drop" is a compact unit
// left literal like the "p" suffix. "star chart"→mapa estelar for consistency.
export default {
  en: {
    starChart3d: {
      mapAria:
        '3D interactive Warframe drop map. Arrow keys cycle worlds and open their missions, Escape clears the selection.',
      eyebrow: 'Warframe · 3D drop map',
      title: 'Origin System',
      view2d: '◂ 2D chart view',
      guide: 'Warframe guide',
      stats: {
        worlds: 'worlds',
        missions: 'missions',
        bestDrop: 'best drop',
      },
      searchLabel: 'Where do I farm…?',
      legend: {
        glow: 'glow = plat / drop',
        voidZone: 'void zone',
      },
      controls: {
        rotate: 'rotate',
        zoom: 'zoom',
        pan: 'pan',
        oneFinger: '1 finger',
        drag: 'drag',
        pinch: 'pinch',
        scroll: 'scroll',
        twoFingers: '2 fingers',
        rightDrag: 'right-drag',
      },
      dock: {
        jump: 'Jump between worlds',
        prev: 'Previous world',
        next: 'Next world',
        select: 'Select a world',
      },
      loading: 'Charting the Origin System…',
      empty: {
        title: "Star chart data isn't loaded yet.",
        hint: 'Run the drop sync to populate the map, then reload.',
      },
      panel: {
        missionsCount: '{n} mission | {n} missions',
        showingSources: 'showing sources of {item}',
        wiki: 'wiki',
        interactiveMap: '{title} interactive map',
        bestPerDrop: 'p/drop best',
        backToResults: 'Back to item results',
        close: 'Close panel',
        event: 'event',
        dropSources: '{n} drop source | {n} drop sources',
        fullDropData: 'Full drop data',
        openHitTitle: 'Open {location} on {planet} with this item highlighted',
        vol: 'vol',
      },
      fallback: {
        text: "Your browser can't render the 3D map (WebGL unavailable).",
        link: 'Open the 2D star chart instead →',
      },
      about: {
        eyebrow: 'About this map',
        title: 'The Warframe drop map, in three dimensions',
        body: "Every world of the Origin System — planets, moons and void zones — rendered as an interactive 3D star chart. Each world glows by what its best mission actually pays: drop chances from the community drop tables, priced against live Warframe Market sell orders and discounted by real 48-hour trade volume, so a mission full of items nobody buys doesn't pretend to be a gold mine. Select a world to break its missions down by rotation, reward, drop chance and realizable platinum — or search any prime part, relic or item to light up exactly where it drops.",
        flatView: 'Prefer a flat view? The classic {link} ranks the same worlds and missions on a single screen.',
        flatViewLink: '2D star chart',
        disclaimer:
          "Expected p/drop = Σ (drop chance × realizable value) across a mission's reward table. Realizable value uses each drop's 48h average sell price, weighted by its 48h trade volume (liquidity) — so overpriced drops nobody actually buys don't inflate a mission's worth. Drop chances come from community drop data; prices and volume are from Warframe Market. Untradeable rewards (Forma, resources, credits) count as zero.",
      },
      sr: {
        world: '{planet}: {count} missions, best {plat} platinum per drop.',
        item: '{item}: {count} drop sources highlighted on the map.',
      },
    },
  },
  es: {
    starChart3d: {
      mapAria:
        'Mapa de drops 3D interactivo de Warframe. Las flechas recorren los mundos y abren sus misiones; Escape borra la selección.',
      eyebrow: 'Warframe · Mapa de drops 3D',
      title: 'Sistema de Origen',
      view2d: '◂ Vista de mapa 2D',
      guide: 'Guía de Warframe',
      stats: {
        worlds: 'mundos',
        missions: 'misiones',
        bestDrop: 'mejor drop',
      },
      searchLabel: '¿Dónde farmeo…?',
      legend: {
        glow: 'brillo = plat / drop',
        voidZone: 'zona del Vacío',
      },
      controls: {
        rotate: 'rotar',
        zoom: 'zoom',
        pan: 'desplazar',
        oneFinger: '1 dedo',
        drag: 'arrastrar',
        pinch: 'pellizcar',
        scroll: 'rueda',
        twoFingers: '2 dedos',
        rightDrag: 'clic der.',
      },
      dock: {
        jump: 'Saltar entre mundos',
        prev: 'Mundo anterior',
        next: 'Mundo siguiente',
        select: 'Selecciona un mundo',
      },
      loading: 'Cartografiando el Sistema de Origen…',
      empty: {
        title: 'Los datos del mapa estelar aún no están cargados.',
        hint: 'Ejecuta la sincronización de drops para llenar el mapa y luego recarga.',
      },
      panel: {
        missionsCount: '{n} misión | {n} misiones',
        showingSources: 'mostrando fuentes de {item}',
        wiki: 'wiki',
        interactiveMap: 'mapa interactivo de {title}',
        bestPerDrop: 'p/drop máx.',
        backToResults: 'Volver a los resultados',
        close: 'Cerrar panel',
        event: 'evento',
        dropSources: '{n} fuente de drop | {n} fuentes de drop',
        fullDropData: 'Datos completos de drops',
        openHitTitle: 'Abrir {location} en {planet} con este objeto resaltado',
        vol: 'vol',
      },
      fallback: {
        text: 'Tu navegador no puede renderizar el mapa 3D (WebGL no disponible).',
        link: 'Abre el mapa estelar 2D en su lugar →',
      },
      about: {
        eyebrow: 'Sobre este mapa',
        title: 'El mapa de drops de Warframe, en tres dimensiones',
        body: 'Cada mundo del Sistema de Origen — planetas, lunas y zonas del Vacío — renderizado como un mapa estelar 3D interactivo. Cada mundo brilla según lo que realmente paga su mejor misión: probabilidades de drop de las tablas comunitarias, valoradas con las órdenes de venta en vivo de Warframe Market y descontadas por el volumen real de comercio de 48 horas, para que una misión llena de objetos que nadie compra no aparente ser una mina de oro. Selecciona un mundo para desglosar sus misiones por rotación, recompensa, probabilidad de drop y platino realizable — o busca cualquier parte prime, reliquia u objeto para iluminar exactamente dónde cae.',
        flatView: '¿Prefieres una vista plana? El clásico {link} ordena los mismos mundos y misiones en una sola pantalla.',
        flatViewLink: 'mapa estelar 2D',
        disclaimer:
          'p/drop esperado = Σ (probabilidad de drop × valor realizable) en la tabla de recompensas de una misión. El valor realizable usa el precio de venta promedio de 48h de cada drop, ponderado por su volumen de comercio de 48h (liquidez) — así los drops sobrevalorados que nadie compra no inflan el valor de una misión. Las probabilidades de drop provienen de datos comunitarios; los precios y el volumen son de Warframe Market. Las recompensas no comerciables (Forma, recursos, créditos) cuentan como cero.',
      },
      sr: {
        world: '{planet}: {count} misiones, mejor {plat} platino por drop.',
        item: '{item}: {count} fuentes de drop resaltadas en el mapa.',
      },
    },
  },
  pt: {
    starChart3d: {
      mapAria:
        'Mapa de drops 3D interativo de Warframe. As setas percorrem os mundos e abrem suas missões; Escape limpa a seleção.',
      eyebrow: 'Warframe · Mapa de drops 3D',
      title: 'Sistema de Origem',
      view2d: '◂ Vista de mapa 2D',
      guide: 'Guia de Warframe',
      stats: {
        worlds: 'mundos',
        missions: 'missões',
        bestDrop: 'melhor drop',
      },
      searchLabel: 'Onde eu farmo…?',
      legend: {
        glow: 'brilho = plat / drop',
        voidZone: 'zona do Vazio',
      },
      controls: {
        rotate: 'girar',
        zoom: 'zoom',
        pan: 'deslocar',
        oneFinger: '1 dedo',
        drag: 'arrastar',
        pinch: 'pinçar',
        scroll: 'rolar',
        twoFingers: '2 dedos',
        rightDrag: 'arraste dir.',
      },
      dock: {
        jump: 'Pular entre mundos',
        prev: 'Mundo anterior',
        next: 'Próximo mundo',
        select: 'Selecione um mundo',
      },
      loading: 'Mapeando o Sistema de Origem…',
      empty: {
        title: 'Os dados do mapa estelar ainda não foram carregados.',
        hint: 'Execute a sincronização de drops para preencher o mapa e recarregue.',
      },
      panel: {
        missionsCount: '{n} missão | {n} missões',
        showingSources: 'mostrando fontes de {item}',
        wiki: 'wiki',
        interactiveMap: 'mapa interativo de {title}',
        bestPerDrop: 'p/drop máx.',
        backToResults: 'Voltar aos resultados',
        close: 'Fechar painel',
        event: 'evento',
        dropSources: '{n} fonte de drop | {n} fontes de drop',
        fullDropData: 'Dados completos de drops',
        openHitTitle: 'Abrir {location} em {planet} com este item destacado',
        vol: 'vol',
      },
      fallback: {
        text: 'Seu navegador não consegue renderizar o mapa 3D (WebGL indisponível).',
        link: 'Abra o mapa estelar 2D em vez disso →',
      },
      about: {
        eyebrow: 'Sobre este mapa',
        title: 'O mapa de drops de Warframe, em três dimensões',
        body: 'Cada mundo do Sistema de Origem — planetas, luas e zonas do Vazio — renderizado como um mapa estelar 3D interativo. Cada mundo brilha conforme o que sua melhor missão realmente paga: chances de drop das tabelas da comunidade, precificadas com as ordens de venda ao vivo do Warframe Market e descontadas pelo volume real de comércio de 48 horas, para que uma missão cheia de itens que ninguém compra não finja ser uma mina de ouro. Selecione um mundo para detalhar suas missões por rotação, recompensa, chance de drop e platina realizável — ou busque qualquer peça prime, relíquia ou item para iluminar exatamente onde ele cai.',
        flatView: 'Prefere uma vista plana? O clássico {link} classifica os mesmos mundos e missões em uma única tela.',
        flatViewLink: 'mapa estelar 2D',
        disclaimer:
          'p/drop esperado = Σ (chance de drop × valor realizável) na tabela de recompensas de uma missão. O valor realizável usa o preço de venda médio de 48h de cada drop, ponderado pelo seu volume de comércio de 48h (liquidez) — assim os drops supervalorizados que ninguém compra não inflam o valor de uma missão. As chances de drop vêm de dados da comunidade; os preços e o volume são do Warframe Market. Recompensas não comercializáveis (Forma, recursos, créditos) contam como zero.',
      },
      sr: {
        world: '{planet}: {count} missões, melhor {plat} platina por drop.',
        item: '{item}: {count} fontes de drop destacadas no mapa.',
      },
    },
  },
}
