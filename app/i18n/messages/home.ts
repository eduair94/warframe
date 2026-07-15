// Home / market table page (/). Namespaced under `home.*`. Follows the shared
// glossary (see i18n/messages/README): platinum→platino/platina, relic→
// reliquia/relíquia, ducats→ducados, tags→etiquetas (es) / tags (pt) to match
// col_tags. Item/category proper nouns (Warframe, Mod, Prime, Riven) are kept.
// Generic column/common strings (Name, Diff, Volume, Tags, Drops, Close, the
// disclaimer, the open-source card, the donation CTA) reuse the existing keys in
// translations.ts / nav.ts — only still-hardcoded English lives here.
export default {
  en: {
    home: {
      h1: 'Warframe Market Analytics — live prime prices, ducat, relic & riven values',
      a11y: {
        selectAll: 'Select all rows',
        selectRow: 'Select row',
        resetFilters: 'Reset filters',
        clearSelection: 'Clear selection',
      },
      filters: {
        minVolume: 'Min Volume',
        select: 'Select',
        search: 'Search',
        categories: {
          All: 'All',
          Warframe: 'Warframe',
          Arcane: 'Arcane',
          Weapon: 'Weapon',
          Sentinel: 'Sentinel',
          Imprint: 'Imprint',
          Mod: 'Mod',
          Relic: 'Relic',
        },
      },
      advanced: {
        title: 'Advanced Filters (Tags & Logic)',
        includeTags: 'Include Tags',
        excludeTags: 'Exclude Tags (NOT)',
        and: 'AND',
        or: 'OR',
        clearTags: 'Clear Tags',
      },
      compare: {
        selected: '{n} item selected | {n} items selected',
        compareBtn: 'Compare Selected',
      },
      options: {
        avgPrices: 'Average Prices (top 5 orders)',
        multiSort: 'Multi-Sort (click several column headers)',
      },
      row: {
        relicCalculator: 'Relic calculator',
      },
      headers: {
        buyLive: 'Buy (live listing)',
        sellLive: 'Sell (live listing)',
        avgSold: 'Avg Sold (48h)',
        latestTrades: 'Latest 48h Trades',
        updated: 'Updated',
        buyAvg: 'Buy (live avg)',
        sellAvg: 'Sell (live avg)',
      },
      txDialog: {
        title: 'Latest 48h Trade Data',
        date: 'Date',
        volume: 'Volume',
        avgPrice: 'Avg Price',
        minPrice: 'Min Price',
        maxPrice: 'Max Price',
        openPrice: 'Open Price',
        closedPrice: 'Closed Price',
      },
      donate: {
        paypalAria: 'Donate with PayPal',
        mercadopagoAria: 'Donate with Mercado Pago',
      },
      feedback: {
        title: 'We need your feedback!',
        body: 'Help us improve by sharing your thoughts and reviews on our Reddit thread. That will help us a lot!',
        join: 'Join Discussion',
      },
    },
  },
  es: {
    home: {
      h1: 'Analíticas de Warframe Market — precios prime en vivo, valores de ducados, reliquias y riven',
      a11y: {
        selectAll: 'Seleccionar todas las filas',
        selectRow: 'Seleccionar fila',
        resetFilters: 'Restablecer filtros',
        clearSelection: 'Limpiar selección',
      },
      filters: {
        minVolume: 'Volumen mín.',
        select: 'Seleccionar',
        search: 'Buscar',
        categories: {
          All: 'Todos',
          Warframe: 'Warframe',
          Arcane: 'Arcano',
          Weapon: 'Arma',
          Sentinel: 'Centinela',
          Imprint: 'Impronta',
          Mod: 'Mod',
          Relic: 'Reliquia',
        },
      },
      advanced: {
        title: 'Filtros avanzados (Etiquetas y lógica)',
        includeTags: 'Incluir etiquetas',
        excludeTags: 'Excluir etiquetas (NO)',
        and: 'Y',
        or: 'O',
        clearTags: 'Limpiar etiquetas',
      },
      compare: {
        selected: '{n} objeto seleccionado | {n} objetos seleccionados',
        compareBtn: 'Comparar seleccionados',
      },
      options: {
        avgPrices: 'Precios promedio (top 5 órdenes)',
        multiSort: 'Orden múltiple (clic en varias columnas)',
      },
      row: {
        relicCalculator: 'Calculadora de reliquias',
      },
      headers: {
        buyLive: 'Compra (orden en vivo)',
        sellLive: 'Venta (orden en vivo)',
        avgSold: 'Prom. vendido (48h)',
        latestTrades: 'Últimas operaciones 48h',
        updated: 'Actualizado',
        buyAvg: 'Compra (prom. en vivo)',
        sellAvg: 'Venta (prom. en vivo)',
      },
      txDialog: {
        title: 'Datos de operaciones (últimas 48h)',
        date: 'Fecha',
        volume: 'Volumen',
        avgPrice: 'Precio prom.',
        minPrice: 'Precio mín.',
        maxPrice: 'Precio máx.',
        openPrice: 'Precio de apertura',
        closedPrice: 'Precio de cierre',
      },
      donate: {
        paypalAria: 'Donar con PayPal',
        mercadopagoAria: 'Donar con Mercado Pago',
      },
      feedback: {
        title: '¡Necesitamos tu opinión!',
        body: 'Ayúdanos a mejorar compartiendo tus opiniones y reseñas en nuestro hilo de Reddit. ¡Eso nos ayudará muchísimo!',
        join: 'Unirse a la discusión',
      },
    },
  },
  pt: {
    home: {
      h1: 'Análises do Warframe Market — preços prime ao vivo, valores de ducados, relíquias e riven',
      a11y: {
        selectAll: 'Selecionar todas as linhas',
        selectRow: 'Selecionar linha',
        resetFilters: 'Redefinir filtros',
        clearSelection: 'Limpar seleção',
      },
      filters: {
        minVolume: 'Volume mín.',
        select: 'Selecionar',
        search: 'Buscar',
        categories: {
          All: 'Todos',
          Warframe: 'Warframe',
          Arcane: 'Arcano',
          Weapon: 'Arma',
          Sentinel: 'Sentinela',
          Imprint: 'Impressão',
          Mod: 'Mod',
          Relic: 'Relíquia',
        },
      },
      advanced: {
        title: 'Filtros avançados (Tags e lógica)',
        includeTags: 'Incluir tags',
        excludeTags: 'Excluir tags (NÃO)',
        and: 'E',
        or: 'OU',
        clearTags: 'Limpar tags',
      },
      compare: {
        selected: '{n} item selecionado | {n} itens selecionados',
        compareBtn: 'Comparar selecionados',
      },
      options: {
        avgPrices: 'Preços médios (top 5 ordens)',
        multiSort: 'Ordenação múltipla (clique em vários cabeçalhos)',
      },
      row: {
        relicCalculator: 'Calculadora de relíquias',
      },
      headers: {
        buyLive: 'Compra (ordem ao vivo)',
        sellLive: 'Venda (ordem ao vivo)',
        avgSold: 'Méd. vendido (48h)',
        latestTrades: 'Últimas negociações 48h',
        updated: 'Atualizado',
        buyAvg: 'Compra (méd. ao vivo)',
        sellAvg: 'Venda (méd. ao vivo)',
      },
      txDialog: {
        title: 'Dados de negociação (últimas 48h)',
        date: 'Data',
        volume: 'Volume',
        avgPrice: 'Preço méd.',
        minPrice: 'Preço mín.',
        maxPrice: 'Preço máx.',
        openPrice: 'Preço de abertura',
        closedPrice: 'Preço de fechamento',
      },
      donate: {
        paypalAria: 'Doar com PayPal',
        mercadopagoAria: 'Doar com Mercado Pago',
      },
      feedback: {
        title: 'Precisamos da sua opinião!',
        body: 'Ajude-nos a melhorar compartilhando suas opiniões e avaliações em nosso tópico do Reddit. Isso vai nos ajudar muito!',
        join: 'Participar da discussão',
      },
    },
  },
}
