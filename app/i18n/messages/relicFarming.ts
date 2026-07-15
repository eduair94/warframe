// /relic-farming page — "Farm the best plat / hour" relic grind ranking board.
// Namespaced under `relicFarming.*`. Shares the /relics-value data + refinement
// mechanic, so overlapping copy matches i18n/messages/relicsValue.ts. Glossary:
// platinum→platino/platina, relic→reliquia/relíquia, vaulted→vedado/a,
// refinement→refinamiento/refinamento, drops kept as "drops". Proper nouns kept:
// Warframe Market, Prime, Radiant/Intact tier values, Lith/Meso/Neo/Axi/Requiem,
// Prime Resurgence, Varzia, Aya, EV, and the "p/hr" unit suffix.
export default {
  en: {
    relicFarming: {
      eyebrow: 'Warframe Market · Relic Farming',
      hero: {
        // {farm}/{platHour} are styled accent spans injected via <i18n-t>.
        title: '{farm} the best {platHour}',
        titleFarm: 'Farm',
        titlePlatHour: 'plat / hour',
        lede: 'EV tells you the average payout of cracking a relic — but not how fast you earn. This ranks relics by platinum per hour: expected {refinement} payout divided by how long a run takes. Set your minutes-per-run and find the best relic to grind right now.',
        dealLabel: 'Best plat / hour',
        dealSub: 'avg {refinement} payout',
      },
      stats: {
        relics: 'relics',
        bestPph: 'best plat / hr',
        avgPph: 'avg plat / hr',
        topPayout: 'top payout',
      },
      filters: {
        search: 'Search a relic',
        refinement: 'Refinement',
        intact: 'Intact',
        radiant: 'Radiant',
        // {mins} is a styled <b> span injected via <i18n-t>.
        minutes: 'Minutes per relic run · {mins}',
        sortBy: 'Sort by',
        allTiers: 'All',
      },
      sort: {
        pph: 'Plat / hour (realizable)',
        ev: 'Payout (realizable EV)',
        demand: 'Demand (liquidity)',
        volume: 'Relic volume',
        name: 'Name (A–Z)',
      },
      toggles: {
        dropping: 'Currently dropping only',
        hideNoDemand: 'Hide no-demand relics',
        fullData: 'Full data only',
      },
      count: '{n} relic match | {n} relics match',
      hidden: {
        vaulted: '· {n} vaulted',
        resurgence: '· {n} resurgence',
        noDemand: '· {n} no demand',
        incomplete: '· {n} incomplete data',
      },
      errors: {
        load: "Couldn't load relic data. The market service may be waking up — try a refresh.",
        empty: 'No relics match these filters. Widen the search or reset the tier.',
      },
      table: {
        relic: 'Relic',
        platHr: 'Plat / hr',
        ev: 'EV ({refinement})',
        demand: 'Demand',
        topDrop: 'Top drop',
        vol: 'Vol',
      },
      tags: {
        top: 'TOP',
        vaultedBadge: 'VAULTED',
        vaulted: 'vaulted',
        vaultedCount: '{n} vaulted',
        resurgence: 'RESURGENCE',
        resurgenceTitle: 'Prime Resurgence — buy from Varzia with Aya (not fissure-farmable)',
      },
      row: {
        drops: '{n} drops',
        vol: 'vol',
        farmTip: 'Where to farm this relic',
        liquidTip: '{pct}% of payout is liquid',
      },
      card: {
        payout: 'Payout ({refinement})',
        realizableEv: 'Realizable EV',
        rawEv: 'Raw EV',
        topDrop: 'Top drop',
        realizablePayout: 'realizable {refinement} payout',
      },
      disclaimer: {
        // {realizable} is bold; {refinement} is the live refinement label.
        text: "Plat/hr = {realizable} {refinement} payout ÷ your minutes-per-run × 60. Realizable payout weights each drop's price by its 48h trade volume, so a part nobody is buying (0 volume) barely counts — the number reflects plat you can actually sell for, not sticker price. Vaulted relics no longer drop and are hidden by default. Radiant costs 100 void traces; actual run time varies by fissure and squad.",
        realizable: 'realizable',
      },
    },
  },
  es: {
    relicFarming: {
      eyebrow: 'Warframe Market · Farmeo de Reliquias',
      hero: {
        title: '{farm} el mejor {platHour}',
        titleFarm: 'Farmea',
        titlePlatHour: 'plat / hora',
        lede: 'El EV te dice el pago promedio de abrir una reliquia, pero no qué tan rápido ganas. Esto clasifica las reliquias por platino por hora: el pago esperado en {refinement} dividido entre lo que tarda una carrera. Ajusta tus minutos por carrera y encuentra la mejor reliquia para farmear ahora mismo.',
        dealLabel: 'Mejor plat / hora',
        dealSub: 'pago promedio {refinement}',
      },
      stats: {
        relics: 'reliquias',
        bestPph: 'mejor plat / h',
        avgPph: 'plat / h prom.',
        topPayout: 'pago máximo',
      },
      filters: {
        search: 'Buscar una reliquia',
        refinement: 'Refinamiento',
        intact: 'Intacta',
        radiant: 'Radiante',
        minutes: 'Minutos por carrera de reliquia · {mins}',
        sortBy: 'Ordenar por',
        allTiers: 'Todas',
      },
      sort: {
        pph: 'Plat / hora (realizable)',
        ev: 'Pago (EV realizable)',
        demand: 'Demanda (liquidez)',
        volume: 'Volumen de reliquia',
        name: 'Nombre (A–Z)',
      },
      toggles: {
        dropping: 'Solo las que dropean actualmente',
        hideNoDemand: 'Ocultar reliquias sin demanda',
        fullData: 'Solo datos completos',
      },
      count: '{n} reliquia coincide | {n} reliquias coinciden',
      hidden: {
        vaulted: '· {n} vedadas',
        resurgence: '· {n} resurgence',
        noDemand: '· {n} sin demanda',
        incomplete: '· {n} datos incompletos',
      },
      errors: {
        load: 'No se pudieron cargar los datos de reliquias. El servicio de mercado puede estar despertando — prueba a recargar.',
        empty: 'Ninguna reliquia coincide con estos filtros. Amplía la búsqueda o restablece el tier.',
      },
      table: {
        relic: 'Reliquia',
        platHr: 'Plat / h',
        ev: 'EV ({refinement})',
        demand: 'Demanda',
        topDrop: 'Mejor drop',
        vol: 'Vol',
      },
      tags: {
        top: 'TOP',
        vaultedBadge: 'VEDADA',
        vaulted: 'vedada',
        vaultedCount: '{n} vedadas',
        resurgence: 'RESURGENCE',
        resurgenceTitle: 'Prime Resurgence — cómprala a Varzia con Aya (no se farmea en fisuras)',
      },
      row: {
        drops: '{n} drops',
        vol: 'vol',
        farmTip: 'Dónde farmear esta reliquia',
        liquidTip: '{pct}% del pago es líquido',
      },
      card: {
        payout: 'Pago ({refinement})',
        realizableEv: 'EV realizable',
        rawEv: 'EV bruto',
        topDrop: 'Mejor drop',
        realizablePayout: 'pago realizable {refinement}',
      },
      disclaimer: {
        text: 'Plat/h = pago {realizable} en {refinement} ÷ tus minutos por carrera × 60. El pago realizable pondera el precio de cada drop por su volumen de intercambio de 48 h, así que una parte que nadie compra (0 de volumen) apenas cuenta — el número refleja el platino que realmente puedes vender, no el precio de lista. Las reliquias vedadas ya no dropean y se ocultan por defecto. Radiant cuesta 100 trazas del Vacío; el tiempo real de carrera varía según la fisura y el escuadrón.',
        realizable: 'realizable',
      },
    },
  },
  pt: {
    relicFarming: {
      eyebrow: 'Warframe Market · Farm de Relíquias',
      hero: {
        title: '{farm} o melhor {platHour}',
        titleFarm: 'Farme',
        titlePlatHour: 'plat / hora',
        lede: 'O EV mostra o pagamento médio de abrir uma relíquia, mas não a rapidez com que você ganha. Isto classifica as relíquias por platina por hora: o pagamento esperado em {refinement} dividido pelo tempo de uma corrida. Defina seus minutos por corrida e encontre a melhor relíquia para farmar agora.',
        dealLabel: 'Melhor plat / hora',
        dealSub: 'pagamento médio {refinement}',
      },
      stats: {
        relics: 'relíquias',
        bestPph: 'melhor plat / h',
        avgPph: 'plat / h méd.',
        topPayout: 'pagamento máximo',
      },
      filters: {
        search: 'Buscar uma relíquia',
        refinement: 'Refinamento',
        intact: 'Intacta',
        radiant: 'Radiante',
        minutes: 'Minutos por corrida de relíquia · {mins}',
        sortBy: 'Ordenar por',
        allTiers: 'Todas',
      },
      sort: {
        pph: 'Plat / hora (realizável)',
        ev: 'Pagamento (EV realizável)',
        demand: 'Demanda (liquidez)',
        volume: 'Volume de relíquia',
        name: 'Nome (A–Z)',
      },
      toggles: {
        dropping: 'Apenas as que dropam atualmente',
        hideNoDemand: 'Ocultar relíquias sem demanda',
        fullData: 'Apenas dados completos',
      },
      count: '{n} relíquia corresponde | {n} relíquias correspondem',
      hidden: {
        vaulted: '· {n} vedadas',
        resurgence: '· {n} resurgence',
        noDemand: '· {n} sem demanda',
        incomplete: '· {n} dados incompletos',
      },
      errors: {
        load: 'Não foi possível carregar os dados das relíquias. O serviço de mercado pode estar acordando — tente recarregar.',
        empty: 'Nenhuma relíquia corresponde a estes filtros. Amplie a busca ou redefina o tier.',
      },
      table: {
        relic: 'Relíquia',
        platHr: 'Plat / h',
        ev: 'EV ({refinement})',
        demand: 'Demanda',
        topDrop: 'Melhor drop',
        vol: 'Vol',
      },
      tags: {
        top: 'TOP',
        vaultedBadge: 'VEDADA',
        vaulted: 'vedada',
        vaultedCount: '{n} vedadas',
        resurgence: 'RESURGENCE',
        resurgenceTitle: 'Prime Resurgence — compre com a Varzia usando Aya (não farmável em fissuras)',
      },
      row: {
        drops: '{n} drops',
        vol: 'vol',
        farmTip: 'Onde farmar esta relíquia',
        liquidTip: '{pct}% do pagamento é líquido',
      },
      card: {
        payout: 'Pagamento ({refinement})',
        realizableEv: 'EV realizável',
        rawEv: 'EV bruto',
        topDrop: 'Melhor drop',
        realizablePayout: 'pagamento realizável {refinement}',
      },
      disclaimer: {
        text: 'Plat/h = pagamento {realizable} em {refinement} ÷ seus minutos por corrida × 60. O pagamento realizável pondera o preço de cada drop pelo seu volume de negociação de 48 h, então uma peça que ninguém compra (0 de volume) mal conta — o número reflete a platina que você realmente pode vender, não o preço de tabela. As relíquias vedadas não dropam mais e ficam ocultas por padrão. Radiant custa 100 traços do Vazio; o tempo real de corrida varia conforme a fissura e o esquadrão.',
        realizable: 'realizável',
      },
    },
  },
}
