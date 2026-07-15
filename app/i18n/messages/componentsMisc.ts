// Shared misc UI components, namespaced under `components.*` with one sub-object
// per component: pwa (iOS add-to-home dialog), verdict (market verdict badge),
// trade (WTS/WTB copy buttons), itemCompare (comparison dialog), priceChart
// (sparkline history). Follows the shared glossary: platinum→platino/platina,
// buy/sell→compra/venta·venda, flip→reventa/revenda. Proper nouns kept
// (Warframe, Safari, WTS, WTB). LastTransactionCell has no user-facing strings,
// so it has no sub-object here.
export default {
  en: {
    components: {
      pwa: {
        installApp: 'Install app',
        addToHome: 'Add to Home Screen',
        shareLabel: 'Share',
        addLabel: 'Add',
        step1: "Tap the {share} icon {icon} in Safari's toolbar.",
        step2: 'Choose {add} {icon}.',
        step3: 'Tap {add} — it installs like a native app.',
        gotIt: 'Got it',
      },
      verdict: {
        labels: { buy: 'BUY', sell: 'SELL', fair: 'FAIR' },
        confidence: 'confidence',
        under: '{pct}% under',
        over: '{pct}% over',
        tip: {
          fairValue: 'Fair value: {value}p',
          bestSellBuy: 'Best sell: {sell}p · Best buy: {buy}p',
          flipConfidence: 'Flip margin: {margin}p · Confidence: {conf}%',
        },
      },
      trade: {
        disclaimer:
          'Warframe has no public API for its in-game chat, so nothing can post there automatically - copy a ready-to-paste trade message instead.',
        copyWts: 'Copy WTS message',
        copyWtb: 'Copy WTB message',
        copied: 'Copied!',
      },
      itemCompare: {
        title: 'Item Comparison',
        close: 'Close',
      },
      priceChart: {
        empty: 'Not enough history yet - check back after a couple of days.',
        rangeLabel: '{days}-day avg price trend',
        ariaLabel: 'Average price over the last {days} days, from {from} to {to} platinum',
        title: 'Price history',
        viewAsTable: 'View as table',
        flat: 'Flat (±{pct}%)',
        table: {
          date: 'Date',
          avgPrice: 'Avg Price',
          buy: 'Buy',
          sell: 'Sell',
        },
      },
    },
  },
  es: {
    components: {
      pwa: {
        installApp: 'Instalar app',
        addToHome: 'Añadir a pantalla de inicio',
        shareLabel: 'Compartir',
        addLabel: 'Añadir',
        step1: 'Toca el icono {share} {icon} en la barra de Safari.',
        step2: 'Elige {add} {icon}.',
        step3: 'Toca {add} — se instala como una app nativa.',
        gotIt: 'Entendido',
      },
      verdict: {
        labels: { buy: 'COMPRA', sell: 'VENTA', fair: 'JUSTO' },
        confidence: 'confianza',
        under: '{pct}% por debajo',
        over: '{pct}% por encima',
        tip: {
          fairValue: 'Valor justo: {value}p',
          bestSellBuy: 'Mejor venta: {sell}p · Mejor compra: {buy}p',
          flipConfidence: 'Margen de reventa: {margin}p · Confianza: {conf}%',
        },
      },
      trade: {
        disclaimer:
          'Warframe no tiene una API pública para su chat del juego, así que nada puede publicar ahí automáticamente: copia un mensaje de intercambio listo para pegar.',
        copyWts: 'Copiar mensaje WTS',
        copyWtb: 'Copiar mensaje WTB',
        copied: '¡Copiado!',
      },
      itemCompare: {
        title: 'Comparación de objetos',
        close: 'Cerrar',
      },
      priceChart: {
        empty: 'Aún no hay suficiente historial: vuelve dentro de un par de días.',
        rangeLabel: 'Tendencia del precio prom. de {days} días',
        ariaLabel: 'Precio promedio de los últimos {days} días, de {from} a {to} platino',
        title: 'Historial de precios',
        viewAsTable: 'Ver como tabla',
        flat: 'Estable (±{pct}%)',
        table: {
          date: 'Fecha',
          avgPrice: 'Precio prom.',
          buy: 'Compra',
          sell: 'Venta',
        },
      },
    },
  },
  pt: {
    components: {
      pwa: {
        installApp: 'Instalar app',
        addToHome: 'Adicionar à Tela de Início',
        shareLabel: 'Compartilhar',
        addLabel: 'Adicionar',
        step1: 'Toque no ícone {share} {icon} na barra do Safari.',
        step2: 'Escolha {add} {icon}.',
        step3: 'Toque em {add} — ele instala como um app nativo.',
        gotIt: 'Entendi',
      },
      verdict: {
        labels: { buy: 'COMPRA', sell: 'VENDA', fair: 'JUSTO' },
        confidence: 'confiança',
        under: '{pct}% abaixo',
        over: '{pct}% acima',
        tip: {
          fairValue: 'Valor justo: {value}p',
          bestSellBuy: 'Melhor venda: {sell}p · Melhor compra: {buy}p',
          flipConfidence: 'Margem de revenda: {margin}p · Confiança: {conf}%',
        },
      },
      trade: {
        disclaimer:
          'O Warframe não tem uma API pública para o chat do jogo, então nada pode publicar lá automaticamente: copie uma mensagem de troca pronta para colar.',
        copyWts: 'Copiar mensagem WTS',
        copyWtb: 'Copiar mensagem WTB',
        copied: 'Copiado!',
      },
      itemCompare: {
        title: 'Comparação de itens',
        close: 'Fechar',
      },
      priceChart: {
        empty: 'Ainda não há histórico suficiente: volte daqui a alguns dias.',
        rangeLabel: 'Tendência do preço méd. de {days} dias',
        ariaLabel: 'Preço médio dos últimos {days} dias, de {from} a {to} platina',
        title: 'Histórico de preços',
        viewAsTable: 'Ver como tabela',
        flat: 'Estável (±{pct}%)',
        table: {
          date: 'Data',
          avgPrice: 'Preço méd.',
          buy: 'Compra',
          sell: 'Venda',
        },
      },
    },
  },
}
