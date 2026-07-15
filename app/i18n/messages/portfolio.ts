// My Portfolio page (/portfolio). Namespaced under `portfolio.*`. Follows the
// shared glossary: portfolio→portafolio/portfólio, watchlist→lista de
// seguimiento/lista de acompanhamento, platinum→platino/platina. Item names,
// the "p" plat suffix, routes and proper nouns (Warframe, warframe.market) stay
// as-is. Still on the old plain (non-Orokin) design.
export default {
  en: {
    portfolio: {
      title: 'My Portfolio',
      intro: {
        text: "Track items you own or want to watch, and get a browser notification when their sell price crosses a threshold you set — or when an item hits its {atl} in our long price history (something warframe.market's 90-day chart can't tell you). This is stored only in this browser (no account needed) - clearing your browser data clears your list.",
        atl: 'all-time low',
      },
      addLabel: 'Add an item to your portfolio',
      add: 'Add',
      enableAlerts: 'Enable price alerts',
      alertsEnabled: 'Alerts enabled - checked whenever this page is open',
      unsupported: "Your browser doesn't support notifications. Thresholds are still saved and shown here.",
      empty: 'Your portfolio is empty. Search for an item above to start tracking it.',
      table: {
        item: 'Item',
        ownedQty: 'Owned Qty',
        sellPrice: 'Sell Price',
        value: 'Value',
        alertBelow: 'Alert Below',
        alertAbove: 'Alert Above',
        atAtl: 'At All-Time Low',
      },
      none: 'none',
      atLow: 'at low!',
      totalValue: 'Total portfolio value:',
    },
  },
  es: {
    portfolio: {
      title: 'Mi Portafolio',
      intro: {
        text: 'Rastrea los objetos que posees o quieres vigilar, y recibe una notificación del navegador cuando su precio de venta cruce un umbral que definas — o cuando un objeto alcance su {atl} en nuestro largo historial de precios (algo que el gráfico de 90 días de warframe.market no puede decirte). Esto se guarda solo en este navegador (sin necesidad de cuenta) - borrar los datos de tu navegador borra tu lista.',
        atl: 'mínimo histórico',
      },
      addLabel: 'Añade un objeto a tu portafolio',
      add: 'Añadir',
      enableAlerts: 'Activar alertas de precio',
      alertsEnabled: 'Alertas activadas - se revisan mientras esta página esté abierta',
      unsupported: 'Tu navegador no admite notificaciones. Los umbrales igual se guardan y se muestran aquí.',
      empty: 'Tu portafolio está vacío. Busca un objeto arriba para empezar a rastrearlo.',
      table: {
        item: 'Objeto',
        ownedQty: 'Cant. en posesión',
        sellPrice: 'Precio de venta',
        value: 'Valor',
        alertBelow: 'Alerta por debajo',
        alertAbove: 'Alerta por encima',
        atAtl: 'En mínimo histórico',
      },
      none: 'ninguno',
      atLow: '¡en mínimo!',
      totalValue: 'Valor total del portafolio:',
    },
  },
  pt: {
    portfolio: {
      title: 'Meu Portfólio',
      intro: {
        text: 'Acompanhe os itens que você possui ou quer vigiar, e receba uma notificação do navegador quando o preço de venda cruzar um limite que você definir — ou quando um item atingir sua {atl} no nosso longo histórico de preços (algo que o gráfico de 90 dias do warframe.market não consegue mostrar). Isso fica salvo apenas neste navegador (sem precisar de conta) - limpar os dados do navegador limpa sua lista.',
        atl: 'mínima histórica',
      },
      addLabel: 'Adicione um item ao seu portfólio',
      add: 'Adicionar',
      enableAlerts: 'Ativar alertas de preço',
      alertsEnabled: 'Alertas ativados - verificados enquanto esta página estiver aberta',
      unsupported: 'Seu navegador não suporta notificações. Os limites continuam salvos e exibidos aqui.',
      empty: 'Seu portfólio está vazio. Busque um item acima para começar a acompanhá-lo.',
      table: {
        item: 'Item',
        ownedQty: 'Qtd. em posse',
        sellPrice: 'Preço de venda',
        value: 'Valor',
        alertBelow: 'Alerta abaixo',
        alertAbove: 'Alerta acima',
        atAtl: 'Na mínima histórica',
      },
      none: 'nenhum',
      atLow: 'na mínima!',
      totalValue: 'Valor total do portfólio:',
    },
  },
}
