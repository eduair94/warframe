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
}
