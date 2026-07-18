import type { PageSeo } from './seo'

// Localized SEO copy overlay: PAGE_SEO_I18N[locale][path] = { title, description }.
// English lives in PAGE_SEO (seo.ts) and is the fallback for any locale/path not
// present here. Keys are the SAME normalized paths PAGE_SEO uses ('/', '/comparison',
// '/set', …). Titles/descriptions are translated for search: keyword-rich, concise,
// with Warframe brand/proper nouns (Warframe, Warframe Market, Prime, Baro Ki'Teer,
// Riven, Tenno, Ayatan, Endo, relic tiers, Intact/Radiant) kept per the glossary and
// platinum/ducats/vaulted rendered in each locale's Warframe-community term.
export const PAGE_SEO_I18N: Record<string, Record<string, PageSeo>> = {
  es: {
    '/': {
      title: 'Warframe Market Analytics — Precios Prime en vivo y herramientas de platino',
      description:
        'Sigue precios de Warframe Market en vivo, valores de sets prime, eficiencia de ducados, valor de Riven y señales de trading. Analíticas y herramientas de platino en tiempo real, gratis para los Tenno.'
    },
    '/comparison': {
      title: 'Calculadora set vs piezas — Sets Prime de Warframe',
      description:
        '¿Sale más barato un set prime de Warframe montado o comprado pieza por pieza? Compara precios en vivo de Warframe Market y descubre cuánto platino ahorras.'
    },
    '/ducats': {
      title: 'Calculadora de ducados — Mejores piezas prime por ducados',
      description:
        "Encuentra las piezas prime con mejor relación ducados por platino para acumular de cara a Baro Ki'Teer. Ranking de eficiencia de ducados de Warframe Market, actualizado sin parar."
    },
    '/endo': {
      title: 'Valor de Endo y platino — Calculadora de esculturas Ayatan',
      description:
        'Compara el valor en Endo frente a platino de las esculturas Ayatan y los mods de Warframe. Decide qué disolver por Endo y qué vender por platino.'
    },
    '/flip': {
      title: 'Buscador de flips — Mejores spreads de trading de Warframe',
      description:
        'Detecta los spreads compra/venta más amplios y líquidos de Warframe Market. Compra a la puja, revende al precio de venta y gana platino revendiendo piezas prime.'
    },
    '/live': {
      title: 'Señales de mercado en vivo — Trades de Warframe en tiempo real',
      description:
        'Feed de órdenes de Warframe Market en tiempo real con señales de compra, venta y flip más veredictos de rentabilidad. No te pierdas ninguna pieza prime o Riven infravalorada.'
    },
    '/movers': {
      title: 'Top movimientos — Precios de Warframe al alza y a la baja',
      description:
        'Mira qué artículos de Warframe Market suben o se hunden en 24 h y 7 d. Anticípate a las tendencias de precio en platino antes que el resto del mercado.'
    },
    '/portfolio': {
      title: 'Rastreador de cartera — Tu platino en Warframe',
      description:
        'Sigue el valor en platino de tu inventario prime y Riven de Warframe a lo largo del tiempo, con lista de seguimiento y alertas de precio. Conoce tu patrimonio en plat.'
    },
    '/relic-farming': {
      title: 'Valor de farmeo de reliquias — Mejores reliquias de Warframe',
      description:
        'Clasifica las reliquias de Warframe por valor real en platino por partida, ponderado según la liquidez del mercado. Farmea las reliquias que de verdad pagan en plat.'
    },
    '/relics-value': {
      title: 'Calculadora de reliquias — ¿Abrir o vender?',
      description:
        'Retorno esperado en platino de cada reliquia de Warframe, Intacta y Radiante. Decide si abrir una reliquia por sus piezas o venderla directamente.'
    },
    '/riven-value': {
      title: 'Estimador de valor de Riven — Precios de Riven en Warframe',
      description:
        'Estima cuánto vale un mod Riven de Warframe en platino según la disposición del arma y la tirada. Valora tus Riven antes de comerciar o pujar.'
    },
    '/screener': {
      title: 'Screener de mercado — Filtra precios prime de Warframe',
      description:
        'Filtra cada artículo de Warframe Market por precio, volumen, spread y etiquetas. Crea filtros a medida para encontrar tu próxima jugada de platino.'
    },
    '/star-chart': {
      title: 'Mapa de drops del sistema — Drops de reliquias y piezas de Warframe',
      description:
        'Mapa estelar interactivo de Warframe que muestra dónde caen cada pieza prime y reliquia. Planifica la ruta de farmeo más rápida por nodo de misión.'
    },
    '/star-chart-3d': {
      title: 'Mapa de drops 3D — Explorador de drops de reliquias de Warframe',
      description:
        'Explora las ubicaciones de drops prime y de reliquias de Warframe en un mapa estelar 3D interactivo. Encuentra el mejor nodo para la pieza o reliquia que necesitas.'
    },
    '/timing': {
      title: 'Momento de compra y venta — Cuándo comerciar en Warframe',
      description:
        'Descubre las mejores horas para comprar y vender cada artículo de Warframe Market, según patrones históricos de precio y volumen. Cronometra tus trades en plat.'
    },
    '/vault-spikes': {
      title: 'Picos de bóveda — Subidas de precio de primes de Warframe',
      description:
        'Sigue los primes vaulted de Warframe cuyos precios se disparan ahora mismo. Detecta qué sets vaulted están subiendo y aprovecha la escasez.'
    },
    '/vaulted': {
      title: 'Primes vaulted — Sigue los precios de Warframe al alza',
      description:
        'Todos los primes vaulted de Warframe que ya no puedes farmear, ordenados por tendencia de precio. Vigila qué se revaloriza en platino y vende con cabeza.'
    },
    '/volatility': {
      title: 'Volatilidad de precios — Artículos más volátiles de Warframe',
      description:
        'Clasifica los artículos de Warframe Market por volatilidad de precio. Encuentra reservas estables de platino o artículos de gran oscilación para flipping agresivo.'
    },
    '/set': {
      title: 'Precios de sets — Valores de sets prime de Warframe',
      description:
        'Consulta precios en platino en vivo de cada set prime de Warframe. Compara set frente a piezas y encuentra las mejores ofertas de Warframe Market.'
    },
    '/relic': {
      title: 'Precios de reliquias — Valores de reliquias de Warframe',
      description:
        'Precios en platino en vivo y retornos esperados de las reliquias de Warframe. Descubre qué reliquias vale la pena abrir, guardar o comerciar.'
    },
    '/guides/endo': {
      title: 'Guía de farmeo de Endo — Warframe',
      description:
        'Guía completa para farmear Endo de forma eficiente en Warframe, además de cómo valorar esculturas Ayatan y mods frente al platino.'
    }
  },
  pt: {
    '/': {
      title: 'Warframe Market Analytics — Preços Prime ao vivo e ferramentas de platina',
      description:
        'Acompanhe preços do Warframe Market ao vivo, valores de sets prime, eficiência de ducados, valor de Riven e sinais de trade. Análises e ferramentas de platina em tempo real, grátis para os Tenno.'
    },
    '/comparison': {
      title: 'Calculadora set vs peças — Sets Prime do Warframe',
      description:
        'Um set prime do Warframe sai mais barato montado ou comprado peça por peça? Compare preços ao vivo do Warframe Market e veja quanta platina você economiza.'
    },
    '/ducats': {
      title: 'Calculadora de ducados — Melhores peças prime por ducados',
      description:
        "Descubra as peças prime com a melhor relação ducados por platina para estocar para o Baro Ki'Teer. Ranking de eficiência de ducados do Warframe Market, atualizado sem parar."
    },
    '/endo': {
      title: 'Valor de Endo e platina — Calculadora de esculturas Ayatan',
      description:
        'Compare o valor em Endo e em platina das esculturas Ayatan e dos mods do Warframe. Decida o que dissolver por Endo e o que vender por platina.'
    },
    '/flip': {
      title: 'Localizador de flips — Melhores spreads de trade do Warframe',
      description:
        'Encontre os spreads de compra/venda mais amplos e líquidos do Warframe Market. Compre no lance, revenda no preço de venda e ganhe platina revendendo peças prime.'
    },
    '/live': {
      title: 'Sinais de mercado ao vivo — Trades do Warframe em tempo real',
      description:
        'Feed de ordens do Warframe Market em tempo real com sinais de compra, venda e flip e veredictos de vale a pena. Nunca perca uma peça prime ou Riven abaixo do preço.'
    },
    '/movers': {
      title: 'Top movimentações — Preços do Warframe subindo e caindo',
      description:
        'Veja quais itens do Warframe Market estão disparando ou despencando em 24h e 7d. Antecipe as tendências de preço em platina antes do resto do mercado.'
    },
    '/portfolio': {
      title: 'Rastreador de portfólio — Sua platina no Warframe',
      description:
        'Acompanhe o valor em platina do seu inventário prime e Riven do Warframe ao longo do tempo, com watchlist e alertas de preço. Saiba quanto vale seu patrimônio em plat.'
    },
    '/relic-farming': {
      title: 'Valor de farm de relíquias — Melhores relíquias do Warframe',
      description:
        'Ranqueie as relíquias do Warframe pelo valor real em platina por run, ponderado pela liquidez do mercado. Farme as relíquias que realmente pagam em plat.'
    },
    '/relics-value': {
      title: 'Calculadora de relíquias — Abrir ou vender?',
      description:
        'Retorno esperado em platina de cada relíquia do Warframe, Intacta e Radiante. Decida se abre uma relíquia pelas peças ou se a vende direto.'
    },
    '/riven-value': {
      title: 'Estimador de valor de Riven — Preços de Riven no Warframe',
      description:
        'Estime quanto vale um mod Riven do Warframe em platina pela disposição da arma e pelo roll. Avalie seus Riven antes de negociar ou dar lance.'
    },
    '/screener': {
      title: 'Screener de mercado — Filtre preços prime do Warframe',
      description:
        'Filtre cada item do Warframe Market por preço, volume, spread e tags. Crie filtros personalizados para achar sua próxima jogada de platina.'
    },
    '/star-chart': {
      title: 'Mapa de drops do sistema — Drops de relíquias e peças do Warframe',
      description:
        'Mapa estelar interativo do Warframe mostrando onde cada peça prime e relíquia dropa. Planeje a rota de farm mais rápida por nó de missão.'
    },
    '/star-chart-3d': {
      title: 'Mapa de drops 3D — Explorador de drops de relíquias do Warframe',
      description:
        'Explore os locais de drop de primes e relíquias do Warframe num mapa estelar 3D interativo. Encontre o melhor nó para a peça ou relíquia que você precisa.'
    },
    '/timing': {
      title: 'Hora de comprar e vender — Quando negociar no Warframe',
      description:
        'Descubra os melhores horários para comprar e vender cada item do Warframe Market, com base em padrões históricos de preço e volume. Cronometre seus trades em plat.'
    },
    '/vault-spikes': {
      title: 'Picos de vault — Altas de preço de primes do Warframe',
      description:
        'Acompanhe os primes vaulted do Warframe cujos preços estão disparando agora. Descubra quais sets vaulted estão subindo e lucre com a escassez.'
    },
    '/vaulted': {
      title: 'Primes vaulted — Acompanhe os preços do Warframe em alta',
      description:
        'Todos os primes vaulted do Warframe que você não pode mais farmar, ordenados por tendência de preço. Veja o que valoriza em platina e venda com esperteza.'
    },
    '/volatility': {
      title: 'Volatilidade de preços — Itens mais voláteis do Warframe',
      description:
        'Ranqueie os itens do Warframe Market por volatilidade de preço. Encontre reservas estáveis de platina ou itens de grande oscilação para flipping agressivo.'
    },
    '/set': {
      title: 'Preços de sets — Valores de sets prime do Warframe',
      description:
        'Veja preços em platina ao vivo de cada set prime do Warframe. Compare set vs peças e encontre as melhores ofertas do Warframe Market.'
    },
    '/relic': {
      title: 'Preços de relíquias — Valores de relíquias do Warframe',
      description:
        'Preços em platina ao vivo e retornos esperados das relíquias do Warframe. Descubra quais relíquias valem a pena abrir, guardar ou negociar.'
    },
    '/guides/endo': {
      title: 'Guia de farm de Endo — Warframe',
      description:
        'Um guia completo para farmar Endo com eficiência no Warframe, além de como avaliar esculturas Ayatan e mods em relação à platina.'
    }
  },
  de: {
    '/': {
      title: 'Warframe Market Analytics — Live-Prime-Preise und Platin-Tools',
      description:
        'Verfolge Live-Preise auf Warframe Market, Prime-Set-Werte, Dukaten-Effizienz, Riven-Wert und Trading-Signale. Kostenlose Echtzeit-Platin-Analysen und Tools für Tenno.'
    },
    '/comparison': {
      title: 'Set-vs-Teile-Rechner — Warframe Prime-Sets',
      description:
        'Ist ein Warframe Prime-Set zusammengebaut oder Teil für Teil günstiger? Vergleiche Live-Preise auf Warframe Market und sieh genau, wie viel Platin du sparst.'
    },
    '/ducats': {
      title: 'Dukaten-Wert-Rechner — Beste Prime-Teile für Dukaten',
      description:
        "Finde die Prime-Teile mit dem besten Dukaten-pro-Platin-Verhältnis zum Horten für Baro Ki'Teer. Live-Ranking der Dukaten-Effizienz von Warframe Market, laufend aktualisiert."
    },
    '/endo': {
      title: 'Endo- und Platin-Wert — Ayatan-Skulpturen-Rechner',
      description:
        'Vergleiche den Endo- und Platin-Wert von Ayatan-Skulpturen und Mods in Warframe. Entscheide, was du für Endo auflöst und was du für Platin verkaufst.'
    },
    '/flip': {
      title: 'Flip-Finder — Beste Warframe-Handelsspannen',
      description:
        'Finde die größten, liquidesten Kauf-/Verkaufsspannen auf Warframe Market. Kaufe zum Gebot, verkaufe zum Briefkurs und verdiene Platin mit Prime-Teilen.'
    },
    '/live': {
      title: 'Live-Marktsignale — Warframe-Trades in Echtzeit',
      description:
        'Echtzeit-Orderfeed von Warframe Market mit Kauf-, Verkaufs- und Flip-Signalen plus Lohnt-sich-Urteilen. Verpasse nie ein unterbewertetes Prime-Teil oder Riven.'
    },
    '/movers': {
      title: 'Top-Bewegungen — Warframe-Preise im Auf und Ab',
      description:
        'Sieh, welche Warframe-Market-Items in 24 h und 7 d steigen oder abstürzen. Erkenne Platin-Preistrends, bevor es der Rest des Marktes tut.'
    },
    '/portfolio': {
      title: 'Portfolio-Tracker — Deine Warframe-Platin-Bestände',
      description:
        'Verfolge den Platin-Wert deines Prime- und Riven-Inventars in Warframe über die Zeit, mit Watchlist und Preisalarmen. Kenne dein Vermögen in Platin.'
    },
    '/relic-farming': {
      title: 'Relic-Farm-Wert — Beste Warframe-Relics zum Farmen',
      description:
        'Ordne Warframe-Relics nach realisierbarem Platin-Wert pro Run, gewichtet nach Marktliquidität. Farme die Relics, die sich in Platin wirklich auszahlen.'
    },
    '/relics-value': {
      title: 'Relic-Wert-Rechner — Öffnen oder verkaufen?',
      description:
        'Erwarteter Platin-Ertrag jedes Warframe-Relics, Intakt und Strahlend. Entscheide, ob du ein Relic für Teile öffnest oder direkt verkaufst.'
    },
    '/riven-value': {
      title: 'Riven-Wert-Schätzer — Warframe-Riven-Preise',
      description:
        'Schätze, was ein Warframe-Riven-Mod in Platin wert ist, nach Waffen-Disposition und Roll. Bewerte deine Riven, bevor du handelst oder bietest.'
    },
    '/screener': {
      title: 'Markt-Screener — Warframe-Prime-Preise filtern',
      description:
        'Filtere jedes Warframe-Market-Item nach Preis, Volumen, Spanne und Tags. Baue eigene Filter, um deinen nächsten Platin-Deal zu finden.'
    },
    '/star-chart': {
      title: 'Sternenkarten-Drop-Map — Warframe-Relic- und Teile-Drops',
      description:
        'Interaktive Warframe-Sternenkarte, die zeigt, wo jedes Prime-Teil und Relic dropt. Plane die schnellste Farm-Route nach Missionsknoten.'
    },
    '/star-chart-3d': {
      title: '3D-Drop-Map — Warframe-Relic-Drop-Explorer',
      description:
        'Erkunde Prime- und Relic-Drop-Orte in Warframe auf einer interaktiven 3D-Sternenkarte. Finde den besten Knoten für das Teil oder Relic, das du brauchst.'
    },
    '/timing': {
      title: 'Kauf- und Verkaufs-Timing — Bester Zeitpunkt zum Handeln in Warframe',
      description:
        'Finde die besten Stunden, um jedes Warframe-Market-Item zu kaufen und zu verkaufen, basierend auf historischen Preis- und Volumenmustern. Time deine Trades in Platin.'
    },
    '/vault-spikes': {
      title: 'Vault-Spikes — Preissprünge bei Warframe-Primes',
      description:
        'Verfolge gevaultete Warframe-Primes, deren Preise gerade in die Höhe schießen. Erkenne, welche gevaulteten Sets steigen, und profitiere von der Knappheit.'
    },
    '/vaulted': {
      title: 'Gevaultete Primes — Steigende Warframe-Preise verfolgen',
      description:
        'Alle gevaulteten Warframe-Primes, die du nicht mehr farmen kannst, nach Preistrend sortiert. Beobachte, was in Platin an Wert gewinnt, und verkaufe clever.'
    },
    '/volatility': {
      title: 'Preisvolatilität — Volatilste Warframe-Items',
      description:
        'Ordne Warframe-Market-Items nach Preisvolatilität. Finde stabile Platin-Wertspeicher oder stark schwankende Items für aggressives Flipping.'
    },
    '/set': {
      title: 'Set-Preise — Warframe-Prime-Set-Werte',
      description:
        'Durchstöbere Live-Platin-Preise für jedes Warframe-Prime-Set. Vergleiche Set gegen Teile und finde die besten Deals auf Warframe Market.'
    },
    '/relic': {
      title: 'Relic-Preise — Warframe-Relic-Werte',
      description:
        'Live-Platin-Preise und erwartete Erträge für Warframe-Relics. Finde heraus, welche Relics sich zum Öffnen, Behalten oder Handeln lohnen.'
    },
    '/guides/endo': {
      title: 'Endo-Farm-Guide — Warframe',
      description:
        'Ein kompletter Guide zum effizienten Endo-Farmen in Warframe, plus wie du Ayatan-Skulpturen und Mods gegen Platin bewertest.'
    }
  },
  fr: {
    '/': {
      title: "Warframe Market Analytics — Prix Prime en direct et outils platine",
      description:
        "Suivez les prix Warframe Market en direct, la valeur des sets prime, le rendement en ducats, la valeur des Riven et les signaux de trading. Analyses et outils platine en temps réel, gratuits pour les Tenno."
    },
    '/comparison': {
      title: "Calculateur set vs pièces — Sets Prime Warframe",
      description:
        "Un set prime Warframe revient-il moins cher assemblé ou pièce par pièce ? Comparez les prix Warframe Market en direct et voyez combien de platine vous économisez."
    },
    '/ducats': {
      title: "Calculateur de ducats — Meilleures pièces prime en ducats",
      description:
        "Trouvez les pièces prime au meilleur rapport ducats/platine à stocker pour Baro Ki'Teer. Classement du rendement en ducats de Warframe Market, mis à jour en continu."
    },
    '/endo': {
      title: "Valeur Endo et platine — Calculateur de sculptures Ayatan",
      description:
        "Comparez la valeur en Endo et en platine des sculptures Ayatan et des mods Warframe. Décidez quoi dissoudre pour de l'Endo et quoi vendre pour de la platine."
    },
    '/flip': {
      title: "Chercheur de flips — Meilleurs écarts de trading Warframe",
      description:
        "Repérez les écarts achat/vente les plus larges et liquides sur Warframe Market. Achetez à l'offre, revendez au prix demandé et gagnez de la platine en revendant des pièces prime."
    },
    '/live': {
      title: "Signaux de marché en direct — Trades Warframe en temps réel",
      description:
        "Flux d'ordres Warframe Market en temps réel avec signaux d'achat, de vente et de flip, plus verdicts de rentabilité. Ne manquez plus une pièce prime ou un Riven sous-évalué."
    },
    '/movers': {
      title: "Top mouvements — Prix Warframe en hausse et en baisse",
      description:
        "Voyez quels objets Warframe Market flambent ou s'effondrent sur 24 h et 7 j. Anticipez les tendances de prix en platine avant le reste du marché."
    },
    '/portfolio': {
      title: "Suivi de portefeuille — Votre platine Warframe",
      description:
        "Suivez dans le temps la valeur en platine de votre inventaire prime et Riven Warframe, avec liste de suivi et alertes de prix. Connaissez votre patrimoine en platine."
    },
    '/relic-farming': {
      title: "Valeur de farm des reliques — Meilleures reliques Warframe",
      description:
        "Classez les reliques Warframe selon leur valeur réelle en platine par run, pondérée par la liquidité du marché. Farmez les reliques qui rapportent vraiment de la platine."
    },
    '/relics-value': {
      title: "Calculateur de reliques — Ouvrir ou vendre ?",
      description:
        "Gain attendu en platine de chaque relique Warframe, Intacte et Radiante. Décidez d'ouvrir une relique pour ses pièces ou de la vendre directement."
    },
    '/riven-value': {
      title: "Estimateur de valeur Riven — Prix des Riven Warframe",
      description:
        "Estimez la valeur en platine d'un mod Riven Warframe selon la disposition de l'arme et le roll. Évaluez vos Riven avant de trader ou d'enchérir."
    },
    '/screener': {
      title: "Screener de marché — Filtrez les prix prime Warframe",
      description:
        "Filtrez chaque objet Warframe Market par prix, volume, écart et tags. Créez des filtres sur mesure pour trouver votre prochain coup en platine."
    },
    '/star-chart': {
      title: "Carte des drops — Drops de reliques et pièces Warframe",
      description:
        "Carte stellaire Warframe interactive montrant où chaque pièce prime et relique drop. Planifiez l'itinéraire de farm le plus rapide par nœud de mission."
    },
    '/star-chart-3d': {
      title: "Carte des drops 3D — Explorateur de drops de reliques Warframe",
      description:
        "Explorez les emplacements de drop prime et de reliques Warframe sur une carte stellaire 3D interactive. Trouvez le meilleur nœud pour la pièce ou la relique qu'il vous faut."
    },
    '/timing': {
      title: "Timing d'achat et de vente — Quand trader dans Warframe",
      description:
        "Trouvez les meilleures heures pour acheter et vendre chaque objet Warframe Market, selon les tendances historiques de prix et de volume. Chronométrez vos trades en platine."
    },
    '/vault-spikes': {
      title: "Pics de coffre — Bonds de prix des primes Warframe",
      description:
        "Suivez les primes Warframe vaulted dont les prix flambent en ce moment. Repérez quels sets vaulted grimpent et profitez de la rareté."
    },
    '/vaulted': {
      title: "Primes vaulted — Suivez la hausse des prix Warframe",
      description:
        "Tous les primes Warframe vaulted que vous ne pouvez plus farmer, classés par tendance de prix. Surveillez ce qui prend de la valeur en platine et vendez malin."
    },
    '/volatility': {
      title: "Volatilité des prix — Objets Warframe les plus volatils",
      description:
        "Classez les objets Warframe Market par volatilité des prix. Trouvez des réserves de platine stables ou des objets très fluctuants pour du flipping agressif."
    },
    '/set': {
      title: "Prix des sets — Valeur des sets prime Warframe",
      description:
        "Parcourez les prix en platine en direct de chaque set prime Warframe. Comparez set et pièces et trouvez les meilleures offres sur Warframe Market."
    },
    '/relic': {
      title: "Prix des reliques — Valeur des reliques Warframe",
      description:
        "Prix en platine en direct et gains attendus des reliques Warframe. Découvrez quelles reliques valent la peine d'être ouvertes, gardées ou échangées."
    },
    '/guides/endo': {
      title: "Guide de farm d'Endo — Warframe",
      description:
        "Un guide complet pour farmer l'Endo efficacement dans Warframe, et pour évaluer les sculptures Ayatan et les mods face à la platine."
    }
  },
  ru: {
    '/': {
      title: 'Warframe Market Analytics — цены на Prime в реальном времени и инструменты для платины',
      description:
        'Отслеживайте цены Warframe Market в реальном времени, стоимость сетов prime, эффективность дукатов, цену Riven и торговые сигналы. Бесплатная аналитика платины и инструменты для Tenno.'
    },
    '/comparison': {
      title: 'Калькулятор сет или части — сеты Prime в Warframe',
      description:
        'Что дешевле — собрать сет prime в Warframe или купить по частям? Сравните актуальные цены Warframe Market и узнайте, сколько платины вы сэкономите.'
    },
    '/ducats': {
      title: 'Калькулятор дукатов — лучшие части prime за дукаты',
      description:
        "Найдите части prime с лучшим соотношением дукаты/платина, чтобы копить к приезду Baro Ki'Teer. Рейтинг эффективности дукатов Warframe Market, обновляется постоянно."
    },
    '/endo': {
      title: 'Ценность Endo и платины — калькулятор скульптур Ayatan',
      description:
        'Сравните ценность в Endo и в платине для скульптур Ayatan и модов в Warframe. Решите, что растворить ради Endo, а что продать за платину.'
    },
    '/flip': {
      title: 'Поиск флипов — лучшие торговые спреды Warframe',
      description:
        'Находите самые широкие и ликвидные спреды покупки/продажи на Warframe Market. Покупайте по биду, перепродавайте по аску и зарабатывайте платину на частях prime.'
    },
    '/live': {
      title: 'Сигналы рынка в реальном времени — сделки Warframe онлайн',
      description:
        'Лента ордеров Warframe Market в реальном времени с сигналами покупки, продажи и флипа и вердиктами о выгоде. Не упустите недооценённую часть prime или Riven.'
    },
    '/movers': {
      title: 'Лидеры движения — цены Warframe растут и падают',
      description:
        'Смотрите, какие предметы Warframe Market взлетают или обваливаются за 24 ч и 7 дней. Ловите тренды цен в платине раньше остального рынка.'
    },
    '/portfolio': {
      title: 'Трекер портфеля — ваша платина в Warframe',
      description:
        'Отслеживайте стоимость вашего инвентаря prime и Riven в Warframe в платине во времени, со списком отслеживания и оповещениями о ценах. Знайте своё состояние в платине.'
    },
    '/relic-farming': {
      title: 'Ценность фарма реликвий — лучшие реликвии Warframe',
      description:
        'Ранжируйте реликвии Warframe по реальной ценности в платине за забег с учётом ликвидности рынка. Фармите реликвии, которые действительно приносят платину.'
    },
    '/relics-value': {
      title: 'Калькулятор реликвий — вскрыть или продать?',
      description:
        'Ожидаемая отдача в платине от каждой реликвии Warframe, Intact и Radiant. Решите, вскрывать реликвию ради частей или продать целиком.'
    },
    '/riven-value': {
      title: 'Оценщик стоимости Riven — цены на Riven в Warframe',
      description:
        'Оцените, сколько стоит мод Riven в Warframe в платине по диспозиции оружия и роллу. Оцените свои Riven перед торговлей или ставкой.'
    },
    '/screener': {
      title: 'Скринер рынка — фильтр цен prime в Warframe',
      description:
        'Фильтруйте любой предмет Warframe Market по цене, объёму, спреду и тегам. Стройте свои фильтры, чтобы найти следующую сделку на платину.'
    },
    '/star-chart': {
      title: 'Карта дропа звёздной карты — дроп реликвий и частей Warframe',
      description:
        'Интерактивная звёздная карта Warframe показывает, откуда падают все части prime и реликвии. Спланируйте самый быстрый маршрут фарма по узлам миссий.'
    },
    '/star-chart-3d': {
      title: '3D-карта дропа — исследователь дропа реликвий Warframe',
      description:
        'Исследуйте места дропа prime и реликвий Warframe на интерактивной 3D звёздной карте. Найдите лучший узел для нужной части или реликвии.'
    },
    '/timing': {
      title: 'Время покупки и продажи — когда торговать в Warframe',
      description:
        'Найдите лучшие часы для покупки и продажи каждого предмета Warframe Market по историческим паттернам цены и объёма торгов. Рассчитайте время сделок в платине.'
    },
    '/vault-spikes': {
      title: 'Скачки волта — рост цен на primes в Warframe',
      description:
        'Отслеживайте vaulted-праймы Warframe, цены на которые взлетают прямо сейчас. Замечайте, какие vaulted-сеты растут, и зарабатывайте на дефиците.'
    },
    '/vaulted': {
      title: 'Vaulted-праймы — следите за ростом цен Warframe',
      description:
        'Все vaulted-праймы Warframe, которые уже нельзя нафармить, отсортированы по тренду цены. Следите, что дорожает в платине, и продавайте с умом.'
    },
    '/volatility': {
      title: 'Волатильность цен — самые волатильные предметы Warframe',
      description:
        'Ранжируйте предметы Warframe Market по волатильности цены. Найдите стабильные хранилища платины или предметы с большими колебаниями для агрессивного флипа.'
    },
    '/set': {
      title: 'Цены на сеты — стоимость сетов prime в Warframe',
      description:
        'Смотрите актуальные цены в платине на каждый сет prime в Warframe. Сравнивайте сет и части и находите лучшие предложения на Warframe Market.'
    },
    '/relic': {
      title: 'Цены на реликвии — стоимость реликвий Warframe',
      description:
        'Актуальные цены в платине и ожидаемая отдача от реликвий Warframe. Узнайте, какие реликвии стоит вскрывать, хранить или продавать.'
    },
    '/guides/endo': {
      title: 'Гайд по фарму Endo — Warframe',
      description:
        'Полный гайд по эффективному фарму Endo в Warframe, а также как оценивать скульптуры Ayatan и моды относительно платины.'
    }
  },
  ko: {
    '/': {
      title: 'Warframe Market Analytics — 실시간 Prime 시세 및 플래티넘 도구',
      description:
        'Warframe Market 실시간 시세, prime 세트 가치, 두캇 효율, Riven 가치, 거래 신호를 추적하세요. Tenno를 위한 무료 실시간 플래티넘 분석 도구입니다.'
    },
    '/comparison': {
      title: '세트 vs 부품 계산기 — Warframe Prime 세트',
      description:
        'Warframe prime 세트는 완성품으로 사는 게 쌀까, 부품별로 사는 게 쌀까? Warframe Market 실시간 시세를 비교해 플래티넘을 얼마나 아끼는지 확인하세요.'
    },
    '/ducats': {
      title: '두캇 가치 계산기 — 두캇 효율 최고 Prime 부품',
      description:
        "Baro Ki'Teer를 대비해 쌓아둘, 플래티넘당 두캇 효율이 가장 좋은 prime 부품을 찾으세요. Warframe Market 두캇 효율 랭킹, 실시간 갱신."
    },
    '/endo': {
      title: 'Endo·플래티넘 가치 — Ayatan 조각상 계산기',
      description:
        'Warframe의 Ayatan 조각상과 모드에 대해 Endo 가치와 플래티넘 가치를 비교하세요. 무엇을 Endo로 분해하고 무엇을 플래티넘으로 팔지 결정하세요.'
    },
    '/flip': {
      title: '플립 파인더 — 최고의 Warframe 거래 스프레드',
      description:
        'Warframe Market에서 가장 넓고 유동성 높은 매수/매도 스프레드를 찾으세요. 매수 호가에 사서 매도 호가에 되팔아 prime 부품으로 플래티넘을 버세요.'
    },
    '/live': {
      title: '실시간 시장 신호 — 실시간 Warframe 거래',
      description:
        '매수·매도·플립 신호와 이익 판정을 담은 Warframe Market 실시간 주문 피드. 저평가된 prime 부품이나 Riven을 놓치지 마세요.'
    },
    '/movers': {
      title: '급등락 순위 — 오르고 내리는 Warframe 시세',
      description:
        '24시간·7일 동안 급등하거나 급락하는 Warframe Market 아이템을 확인하세요. 시장의 다른 사람들보다 먼저 플래티넘 시세 흐름을 잡으세요.'
    },
    '/portfolio': {
      title: '포트폴리오 트래커 — 내 Warframe 플래티넘 자산',
      description:
        'Warframe prime·Riven 인벤토리의 플래티넘 가치를 시간에 따라 추적하고, 관심목록과 시세 알림도 함께 이용하세요. 플래티넘 순자산을 파악하세요.'
    },
    '/relic-farming': {
      title: '유물 파밍 가치 — 파밍하기 좋은 Warframe 유물',
      description:
        '시장 유동성을 반영해 런당 실현 가능한 플래티넘 가치로 Warframe 유물 순위를 매기세요. 실제로 플래티넘을 벌어주는 유물을 파밍하세요.'
    },
    '/relics-value': {
      title: '유물 가치 계산기 — 개봉? 판매?',
      description:
        'Intact와 Radiant를 포함한 모든 Warframe 유물의 예상 플래티넘 수익. 부품을 위해 유물을 열지, 그대로 팔지 결정하세요.'
    },
    '/riven-value': {
      title: 'Riven 가치 추정기 — Warframe Riven 시세',
      description:
        '무기 디스포지션과 롤에 따라 Warframe Riven 모드의 플래티넘 가치를 추정하세요. 거래하거나 입찰하기 전에 Riven 가격을 매기세요.'
    },
    '/screener': {
      title: '마켓 스크리너 — Warframe Prime 시세 필터',
      description:
        '모든 Warframe Market 아이템을 가격·거래량·스프레드·태그로 필터링하세요. 맞춤 필터로 다음 플래티넘 기회를 찾으세요.'
    },
    '/star-chart': {
      title: '성계도 드랍 맵 — Warframe 유물·부품 드랍',
      description:
        '모든 prime 부품과 유물이 어디서 드랍되는지 보여주는 인터랙티브 Warframe 성계도. 미션 노드별로 가장 빠른 파밍 경로를 짜세요.'
    },
    '/star-chart-3d': {
      title: '3D 드랍 맵 — Warframe 유물 드랍 탐색기',
      description:
        '인터랙티브 3D 성계도에서 Warframe prime과 유물 드랍 위치를 탐색하세요. 필요한 부품이나 유물에 가장 좋은 노드를 찾으세요.'
    },
    '/timing': {
      title: '매수·매도 타이밍 — Warframe 최적 거래 시점',
      description:
        '과거 시세와 거래량 패턴을 바탕으로 각 Warframe Market 아이템을 사고팔기 좋은 시간대를 찾으세요. 플래티넘 거래 타이밍을 잡으세요.'
    },
    '/vault-spikes': {
      title: 'Vault 급등 — Warframe Prime 시세 급등',
      description:
        '지금 시세가 급등 중인 볼팅된 Warframe prime을 추적하세요. 어떤 볼팅된 세트가 오르는지 포착해 희소성으로 수익을 내세요.'
    },
    '/vaulted': {
      title: '볼팅된 Prime — 오르는 Warframe 시세 추적',
      description:
        '더 이상 파밍할 수 없는 모든 볼팅된 Warframe prime을 시세 흐름순으로 정리했습니다. 무엇이 플래티넘으로 오르는지 지켜보고 현명하게 파세요.'
    },
    '/volatility': {
      title: '시세 변동성 — 가장 변동성 큰 Warframe 아이템',
      description:
        'Warframe Market 아이템을 시세 변동성으로 순위 매기세요. 안정적인 플래티넘 저장 수단이나 공격적 플립용 변동 큰 아이템을 찾으세요.'
    },
    '/set': {
      title: '세트 시세 — Warframe Prime 세트 가치',
      description:
        '모든 Warframe prime 세트의 실시간 플래티넘 시세를 둘러보세요. 세트와 부품을 비교하고 Warframe Market 최고의 딜을 찾으세요.'
    },
    '/relic': {
      title: '유물 시세 — Warframe 유물 가치',
      description:
        'Warframe 유물의 실시간 플래티넘 시세와 예상 수익. 어떤 유물을 개봉·보관·거래할 가치가 있는지 찾으세요.'
    },
    '/guides/endo': {
      title: 'Endo 파밍 가이드 — Warframe',
      description:
        'Warframe에서 Endo를 효율적으로 파밍하는 완벽 가이드와 Ayatan 조각상·모드를 플래티넘과 비교해 평가하는 법.'
    }
  },
  ja: {
    '/': {
      title: 'Warframe Market Analytics — Prime価格をリアルタイム表示、プラチナ分析ツール',
      description:
        'Warframe Marketのリアルタイム価格、primeセット価値、ダカット効率、Riven価値、取引シグナルを追跡。Tenno向けの無料リアルタイム・プラチナ分析ツール。'
    },
    '/comparison': {
      title: 'セット vs パーツ計算機 — Warframe Primeセット',
      description:
        'Warframeのprimeセットは完成品とパーツ買い、どちらが安い？Warframe Marketのリアルタイム価格を比較し、節約できるプラチナを確認しよう。'
    },
    '/ducats': {
      title: 'ダカット価値計算機 — ダカット効率が高いPrimeパーツ',
      description:
        "Baro Ki'Teerに備えて備蓄すべき、プラチナ当たりダカット効率が最も高いprimeパーツを見つけよう。Warframe Marketのダカット効率ランキングを随時更新。"
    },
    '/endo': {
      title: 'Endo・プラチナ価値 — Ayatan彫像計算機',
      description:
        'WarframeのAyatan彫像とMODについて、Endo価値とプラチナ価値を比較。Endo用に分解するか、プラチナで売るかを判断しよう。'
    },
    '/flip': {
      title: 'フリップ検索 — Warframe最良の売買スプレッド',
      description:
        'Warframe Marketで最も広く流動性の高い売買スプレッドを発見。買い注文で買い、売り注文で転売して、primeパーツでプラチナを稼ごう。'
    },
    '/live': {
      title: 'ライブ市場シグナル — リアルタイムWarframe取引',
      description:
        '買い・売り・フリップのシグナルとお得判定を備えた、Warframe Marketのリアルタイム注文フィード。割安なprimeパーツやRivenを見逃さない。'
    },
    '/movers': {
      title: '値動きランキング — 上昇・下落するWarframe価格',
      description:
        '24時間・7日で急騰または急落しているWarframe Marketアイテムをチェック。他のプレイヤーより先にプラチナ価格のトレンドをつかもう。'
    },
    '/portfolio': {
      title: 'ポートフォリオ追跡 — あなたのWarframeプラチナ資産',
      description:
        'Warframeのprime・Rivenインベントリのプラチナ価値を時系列で追跡。ウォッチリストと価格アラート付き。プラチナ換算の純資産を把握しよう。'
    },
    '/relic-farming': {
      title: 'Relic周回価値 — 周回に最適なWarframe Relic',
      description:
        '市場の流動性で重み付けした、周回あたりの実現可能なプラチナ価値でWarframe Relicをランク付け。実際にプラチナを稼げるRelicを周回しよう。'
    },
    '/relics-value': {
      title: 'Relic価値計算機 — 開封する？売る？',
      description:
        'IntactとRadiantを含む、すべてのWarframe Relicの期待プラチナ収益。パーツ目当てに開封するか、そのまま売るかを判断しよう。'
    },
    '/riven-value': {
      title: 'Riven価値推定 — WarframeのRiven価格',
      description:
        '武器のディスポジションとロールから、WarframeのRiven MODのプラチナ価値を推定。取引や入札の前にRivenを値付けしよう。'
    },
    '/screener': {
      title: 'マーケットスクリーナー — Warframe Prime価格を絞り込み',
      description:
        'すべてのWarframe Marketアイテムを価格・出来高・スプレッド・タグで絞り込み。独自フィルターで次のプラチナの好機を見つけよう。'
    },
    '/star-chart': {
      title: 'スターチャート・ドロップマップ — WarframeのRelic・パーツドロップ',
      description:
        'すべてのprimeパーツとRelicのドロップ場所を示すインタラクティブなWarframeスターチャート。ミッションノード別に最速の周回ルートを計画しよう。'
    },
    '/star-chart-3d': {
      title: '3Dドロップマップ — Warframe Relicドロップ探索',
      description:
        'インタラクティブな3Dスターチャートで、WarframeのprimeとRelicのドロップ場所を探索。必要なパーツやRelicに最適なノードを見つけよう。'
    },
    '/timing': {
      title: '売買タイミング — Warframeで取引する最適な時間',
      description:
        '過去の価格と出来高のパターンから、各Warframe Marketアイテムの売買に最適な時間帯を発見。プラチナ取引のタイミングを計ろう。'
    },
    '/vault-spikes': {
      title: 'ヴォルト急騰 — WarframeのPrime価格上昇',
      description:
        '今まさに価格が急騰しているヴォルト入りWarframe primeを追跡。どのヴォルト入りセットが上昇しているか見極め、希少性で稼ごう。'
    },
    '/vaulted': {
      title: 'ヴォルト入りPrime — 上昇するWarframe価格を追跡',
      description:
        'もう入手できないすべてのヴォルト入りWarframe primeを、価格トレンド順に一覧。プラチナで値上がりするものを見極め、賢く売ろう。'
    },
    '/volatility': {
      title: '価格変動率 — 最も変動が大きいWarframeアイテム',
      description:
        'Warframe Marketアイテムを価格変動率でランク付け。安定したプラチナの保存先や、積極的フリップ向けの変動が大きいアイテムを見つけよう。'
    },
    '/set': {
      title: 'セット価格 — Warframe Primeセット価値',
      description:
        'すべてのWarframe primeセットのリアルタイムなプラチナ価格を閲覧。セットとパーツを比較し、Warframe Marketで最良の掘り出し物を見つけよう。'
    },
    '/relic': {
      title: 'Relic価格 — Warframe Relic価値',
      description:
        'Warframe Relicのリアルタイムなプラチナ価格と期待収益。開封・保管・取引する価値のあるRelicを見つけよう。'
    },
    '/guides/endo': {
      title: 'Endo周回ガイド — Warframe',
      description:
        'WarframeでEndoを効率的に周回する完全ガイドと、Ayatan彫像やMODをプラチナと比較して評価する方法。'
    }
  },
  'zh-hans': {
    '/': {
      title: 'Warframe Market Analytics — Prime 实时价格与白金工具',
      description:
        '追踪 Warframe Market 实时价格、prime 套装价值、杜卡德效率、Riven 价值与交易信号。为 Tenno 打造的免费实时白金分析工具。'
    },
    '/comparison': {
      title: '套装 vs 部件计算器 — Warframe Prime 套装',
      description:
        'Warframe prime 套装是整套买划算，还是逐件买更省？对比 Warframe Market 实时价格，看清你能省下多少白金。'
    },
    '/ducats': {
      title: '杜卡德价值计算器 — 杜卡德效率最高的 Prime 部件',
      description:
        "找出杜卡德/白金效率最高的 prime 部件，为 Baro Ki'Teer 囤货。Warframe Market 杜卡德效率排行，持续更新。"
    },
    '/endo': {
      title: 'Endo 与白金价值 — Ayatan 雕像计算器',
      description:
        '对比 Warframe 中 Ayatan 雕像与 MOD 的 Endo 价值和白金价值。决定哪些分解换 Endo，哪些出售换白金。'
    },
    '/flip': {
      title: '搬砖查找器 — Warframe 最佳买卖价差',
      description:
        '发现 Warframe Market 上最大、流动性最强的买卖价差。低价买入、挂单卖出，靠 prime 部件赚白金。'
    },
    '/live': {
      title: '实时市场信号 — Warframe 实时交易',
      description:
        'Warframe Market 实时订单流，带买入、卖出与搬砖信号以及是否划算的判定。绝不错过任何被低估的 prime 部件或 Riven。'
    },
    '/movers': {
      title: '涨跌榜 — Warframe 价格涨跌一览',
      description:
        '查看哪些 Warframe Market 物品在 24 小时和 7 天内暴涨或暴跌。抢在市场其他人之前捕捉白金价格趋势。'
    },
    '/portfolio': {
      title: '资产追踪 — 你的 Warframe 白金持仓',
      description:
        '按时间追踪你的 Warframe prime 与 Riven 库存的白金价值，附关注列表和价格提醒。掌握你的白金净资产。'
    },
    '/relic-farming': {
      title: '遗物刷取价值 — 最值得刷的 Warframe 遗物',
      description:
        '按每轮可变现白金价值为 Warframe 遗物排名，并结合市场流动性加权。刷那些真正能换白金的遗物。'
    },
    '/relics-value': {
      title: '遗物价值计算器 — 开还是卖？',
      description:
        '每个 Warframe 遗物（Intact 与 Radiant）的预期白金收益。决定是开遗物拿部件，还是直接出售。'
    },
    '/riven-value': {
      title: 'Riven 价值估算 — Warframe Riven 价格',
      description:
        '根据武器倾向与词条，估算 Warframe Riven MOD 的白金价值。交易或竞价前先给你的 Riven 定价。'
    },
    '/screener': {
      title: '市场筛选器 — 筛选 Warframe Prime 价格',
      description:
        '按价格、成交量、价差和标签筛选每一件 Warframe Market 物品。自定义筛选，找到你的下一笔白金机会。'
    },
    '/star-chart': {
      title: '星图掉落地图 — Warframe 遗物与部件掉落',
      description:
        '交互式 Warframe 星图，展示每个 prime 部件和遗物的掉落位置。按任务节点规划最快的刷取路线。'
    },
    '/star-chart-3d': {
      title: '3D 掉落地图 — Warframe 遗物掉落浏览器',
      description:
        '在交互式 3D 星图上浏览 Warframe prime 与遗物的掉落位置。为你需要的部件或遗物找到最佳节点。'
    },
    '/timing': {
      title: '买卖时机 — Warframe 最佳交易时段',
      description:
        '基于历史价格与成交量规律，找出买卖每件 Warframe Market 物品的最佳时段。把握你的白金交易时机。'
    },
    '/vault-spikes': {
      title: '绝版飙升 — Warframe Prime 价格跳涨',
      description:
        '追踪当前价格正在飙升的绝版 Warframe prime。发现哪些绝版套装在上涨，趁稀缺获利。'
    },
    '/vaulted': {
      title: '绝版 Prime — 追踪上涨的 Warframe 价格',
      description:
        '所有已无法刷取的绝版 Warframe prime，按价格趋势排序。盯紧哪些在白金上升值，聪明出手。'
    },
    '/volatility': {
      title: '价格波动 — 波动最大的 Warframe 物品',
      description:
        '按价格波动性为 Warframe Market 物品排名。找到稳定的白金保值品，或适合激进搬砖的高波动物品。'
    },
    '/set': {
      title: '套装价格 — Warframe Prime 套装价值',
      description:
        '浏览每个 Warframe prime 套装的实时白金价格。对比整套与部件，在 Warframe Market 找到最划算的交易。'
    },
    '/relic': {
      title: '遗物价格 — Warframe 遗物价值',
      description:
        'Warframe 遗物的实时白金价格与预期收益。找出哪些遗物值得开、值得留或值得交易。'
    },
    '/guides/endo': {
      title: 'Endo 刷取指南 — Warframe',
      description:
        '在 Warframe 中高效刷取 Endo 的完整指南，以及如何用白金衡量 Ayatan 雕像与 MOD 的价值。'
    }
  },
  'zh-hant': {
    '/': {
      title: 'Warframe Market Analytics — Prime 即時價格與白金工具',
      description:
        '追蹤 Warframe Market 即時價格、prime 套裝價值、杜卡德效率、Riven 價值與交易訊號。為 Tenno 打造的免費即時白金分析工具。'
    },
    '/comparison': {
      title: '套裝 vs 零件計算機 — Warframe Prime 套裝',
      description:
        'Warframe prime 套裝整套買比較便宜，還是逐件買更省？比較 Warframe Market 即時價格，看清你能省下多少白金。'
    },
    '/ducats': {
      title: '杜卡德價值計算機 — 杜卡德效率最高的 Prime 零件',
      description:
        "找出杜卡德/白金效率最高的 prime 零件，為 Baro Ki'Teer 囤貨。Warframe Market 杜卡德效率排行，持續更新。"
    },
    '/endo': {
      title: 'Endo 與白金價值 — Ayatan 雕像計算機',
      description:
        '比較 Warframe 中 Ayatan 雕像與 MOD 的 Endo 價值和白金價值。決定哪些分解換 Endo，哪些出售換白金。'
    },
    '/flip': {
      title: '搬磚搜尋器 — Warframe 最佳買賣價差',
      description:
        '找出 Warframe Market 上最大、流動性最強的買賣價差。低價買入、掛單賣出，靠 prime 零件賺白金。'
    },
    '/live': {
      title: '即時市場訊號 — Warframe 即時交易',
      description:
        'Warframe Market 即時訂單流，附買入、賣出與搬磚訊號以及是否划算的判定。絕不錯過任何被低估的 prime 零件或 Riven。'
    },
    '/movers': {
      title: '漲跌榜 — Warframe 價格漲跌一覽',
      description:
        '查看哪些 Warframe Market 物品在 24 小時與 7 天內暴漲或暴跌。搶在市場其他人之前捕捉白金價格趨勢。'
    },
    '/portfolio': {
      title: '資產追蹤 — 你的 Warframe 白金持倉',
      description:
        '依時間追蹤你的 Warframe prime 與 Riven 庫存的白金價值，附關注清單與價格提醒。掌握你的白金淨資產。'
    },
    '/relic-farming': {
      title: '遺物刷取價值 — 最值得刷的 Warframe 遺物',
      description:
        '依每輪可變現白金價值為 Warframe 遺物排名，並結合市場流動性加權。刷那些真正能換白金的遺物。'
    },
    '/relics-value': {
      title: '遺物價值計算機 — 開還是賣？',
      description:
        '每個 Warframe 遺物（Intact 與 Radiant）的預期白金收益。決定是開遺物拿零件，還是直接出售。'
    },
    '/riven-value': {
      title: 'Riven 價值估算 — Warframe Riven 價格',
      description:
        '根據武器傾向與詞條，估算 Warframe Riven MOD 的白金價值。交易或競標前先為你的 Riven 定價。'
    },
    '/screener': {
      title: '市場篩選器 — 篩選 Warframe Prime 價格',
      description:
        '依價格、成交量、價差與標籤篩選每一件 Warframe Market 物品。自訂篩選，找到你的下一筆白金機會。'
    },
    '/star-chart': {
      title: '星圖掉落地圖 — Warframe 遺物與零件掉落',
      description:
        '互動式 Warframe 星圖，顯示每個 prime 零件與遺物的掉落位置。依任務節點規劃最快的刷取路線。'
    },
    '/star-chart-3d': {
      title: '3D 掉落地圖 — Warframe 遺物掉落瀏覽器',
      description:
        '在互動式 3D 星圖上瀏覽 Warframe prime 與遺物的掉落位置。為你需要的零件或遺物找到最佳節點。'
    },
    '/timing': {
      title: '買賣時機 — Warframe 最佳交易時段',
      description:
        '根據歷史價格與成交量規律，找出買賣每件 Warframe Market 物品的最佳時段。把握你的白金交易時機。'
    },
    '/vault-spikes': {
      title: '絕版飆升 — Warframe Prime 價格跳漲',
      description:
        '追蹤目前價格正在飆升的絕版 Warframe prime。發現哪些絕版套裝在上漲，趁稀缺獲利。'
    },
    '/vaulted': {
      title: '絕版 Prime — 追蹤上漲的 Warframe 價格',
      description:
        '所有已無法刷取的絕版 Warframe prime，依價格趨勢排序。盯緊哪些在白金上升值，聰明出手。'
    },
    '/volatility': {
      title: '價格波動 — 波動最大的 Warframe 物品',
      description:
        '依價格波動性為 Warframe Market 物品排名。找到穩定的白金保值品，或適合積極搬磚的高波動物品。'
    },
    '/set': {
      title: '套裝價格 — Warframe Prime 套裝價值',
      description:
        '瀏覽每個 Warframe prime 套裝的即時白金價格。比較整套與零件，在 Warframe Market 找到最划算的交易。'
    },
    '/relic': {
      title: '遺物價格 — Warframe 遺物價值',
      description:
        'Warframe 遺物的即時白金價格與預期收益。找出哪些遺物值得開、值得留或值得交易。'
    },
    '/guides/endo': {
      title: 'Endo 刷取指南 — Warframe',
      description:
        '在 Warframe 中高效刷取 Endo 的完整指南，以及如何用白金衡量 Ayatan 雕像與 MOD 的價值。'
    }
  },
  pl: {
    '/': {
      title: 'Warframe Market Analytics — Ceny Prime na żywo i narzędzia do platyny',
      description:
        'Śledź ceny Warframe Market na żywo, wartość zestawów prime, wydajność dukatów, wartość Riven i sygnały handlowe. Darmowa analiza platyny i narzędzia w czasie rzeczywistym dla Tenno.'
    },
    '/comparison': {
      title: 'Kalkulator zestaw vs części — Zestawy Prime Warframe',
      description:
        'Czy zestaw prime w Warframe jest tańszy w całości, czy kupowany po częściach? Porównaj ceny Warframe Market na żywo i zobacz, ile platyny oszczędzasz.'
    },
    '/ducats': {
      title: 'Kalkulator dukatów — Najlepsze części prime za dukaty',
      description:
        "Znajdź części prime o najlepszym stosunku dukatów do platyny, które warto gromadzić na Baro Ki'Teer. Ranking wydajności dukatów Warframe Market, aktualizowany na bieżąco."
    },
    '/endo': {
      title: 'Wartość Endo i platyny — Kalkulator rzeźb Ayatan',
      description:
        'Porównaj wartość w Endo i w platynie dla rzeźb Ayatan i modów w Warframe. Zdecyduj, co rozłożyć na Endo, a co sprzedać za platynę.'
    },
    '/flip': {
      title: 'Wyszukiwarka flipów — Najlepsze spready handlowe Warframe',
      description:
        'Wykryj najszersze i najbardziej płynne spready kupna/sprzedaży na Warframe Market. Kupuj po cenie kupna, odsprzedawaj po cenie sprzedaży i zarabiaj platynę na częściach prime.'
    },
    '/live': {
      title: 'Sygnały rynku na żywo — Transakcje Warframe w czasie rzeczywistym',
      description:
        'Kanał zleceń Warframe Market w czasie rzeczywistym z sygnałami kupna, sprzedaży i flipa oraz werdyktami opłacalności. Nie przegap zaniżonej części prime ani Riven.'
    },
    '/movers': {
      title: 'Największe ruchy — Ceny Warframe w górę i w dół',
      description:
        'Zobacz, które przedmioty Warframe Market rosną lub spadają w 24 h i 7 dni. Wyłap trendy cen platyny, zanim zrobi to reszta rynku.'
    },
    '/portfolio': {
      title: 'Śledzenie portfela — Twoja platyna w Warframe',
      description:
        'Śledź w czasie wartość swojego ekwipunku prime i Riven w Warframe w platynie, z listą obserwowanych i alertami cen. Poznaj swój majątek w platynie.'
    },
    '/relic-farming': {
      title: 'Wartość farmienia reliktów — Najlepsze relikty Warframe',
      description:
        'Uszereguj relikty Warframe według realnej wartości w platynie za przebieg, ważonej płynnością rynku. Farm relikty, które naprawdę dają platynę.'
    },
    '/relics-value': {
      title: 'Kalkulator reliktów — Otworzyć czy sprzedać?',
      description:
        'Oczekiwany zysk w platynie z każdego reliktu Warframe, Intact i Radiant. Zdecyduj, czy otworzyć relikt dla części, czy sprzedać go w całości.'
    },
    '/riven-value': {
      title: 'Kalkulator wartości Riven — Ceny Riven w Warframe',
      description:
        'Oszacuj, ile wart jest mod Riven w Warframe w platynie według dyspozycji broni i rzutu. Wyceń swoje Riven przed handlem lub licytacją.'
    },
    '/screener': {
      title: 'Skaner rynku — Filtruj ceny prime w Warframe',
      description:
        'Filtruj każdy przedmiot Warframe Market według ceny, wolumenu, spreadu i tagów. Twórz własne filtry, aby znaleźć następną okazję na platynę.'
    },
    '/star-chart': {
      title: 'Mapa dropów gwiezdnej mapy — Dropy reliktów i części Warframe',
      description:
        'Interaktywna gwiezdna mapa Warframe pokazująca, gdzie wypada każda część prime i relikt. Zaplanuj najszybszą trasę farmienia według węzłów misji.'
    },
    '/star-chart-3d': {
      title: 'Mapa dropów 3D — Eksplorator dropów reliktów Warframe',
      description:
        'Odkrywaj miejsca dropu prime i reliktów Warframe na interaktywnej gwiezdnej mapie 3D. Znajdź najlepszy węzeł dla potrzebnej części lub reliktu.'
    },
    '/timing': {
      title: 'Timing kupna i sprzedaży — Kiedy handlować w Warframe',
      description:
        'Znajdź najlepsze godziny na kupno i sprzedaż każdego przedmiotu Warframe Market na podstawie historycznych wzorców cen i wolumenu. Zaplanuj transakcje w platynie.'
    },
    '/vault-spikes': {
      title: 'Skoki skarbca — Skoki cen prime w Warframe',
      description:
        'Śledź vaulted prime w Warframe, których ceny właśnie gwałtownie rosną. Wyłap, które vaulted zestawy idą w górę, i zarób na niedoborze.'
    },
    '/vaulted': {
      title: 'Vaulted prime — Śledź rosnące ceny Warframe',
      description:
        'Wszystkie vaulted prime w Warframe, których nie można już farmić, uszeregowane według trendu cen. Obserwuj, co zyskuje na wartości w platynie, i sprzedawaj sprytnie.'
    },
    '/volatility': {
      title: 'Zmienność cen — Najbardziej zmienne przedmioty Warframe',
      description:
        'Uszereguj przedmioty Warframe Market według zmienności cen. Znajdź stabilne magazyny platyny lub mocno wahające się przedmioty do agresywnego flipowania.'
    },
    '/set': {
      title: 'Ceny zestawów — Wartość zestawów prime Warframe',
      description:
        'Przeglądaj ceny w platynie na żywo dla każdego zestawu prime Warframe. Porównaj zestaw z częściami i znajdź najlepsze oferty na Warframe Market.'
    },
    '/relic': {
      title: 'Ceny reliktów — Wartość reliktów Warframe',
      description:
        'Ceny w platynie na żywo i oczekiwane zyski z reliktów Warframe. Sprawdź, które relikty warto otworzyć, zatrzymać lub sprzedać.'
    },
    '/guides/endo': {
      title: 'Poradnik farmienia Endo — Warframe',
      description:
        'Kompletny poradnik do wydajnego farmienia Endo w Warframe oraz jak wyceniać rzeźby Ayatan i mody względem platyny.'
    }
  },
  it: {
    '/': {
      title: "Warframe Market Analytics — Prezzi Prime in tempo reale e strumenti platino",
      description:
        "Monitora i prezzi di Warframe Market in tempo reale, il valore dei set prime, l'efficienza dei ducati, il valore dei Riven e i segnali di trading. Analisi platino e strumenti gratuiti in tempo reale per i Tenno."
    },
    '/comparison': {
      title: "Calcolatore set vs parti — Set Prime di Warframe",
      description:
        "Un set prime di Warframe conviene assemblato o comprato pezzo per pezzo? Confronta i prezzi di Warframe Market in tempo reale e scopri quanto platino risparmi."
    },
    '/ducats': {
      title: "Calcolatore di ducati — Migliori parti prime per ducati",
      description:
        "Trova le parti prime col miglior rapporto ducati/platino da accumulare per Baro Ki'Teer. Classifica dell'efficienza dei ducati di Warframe Market, aggiornata di continuo."
    },
    '/endo': {
      title: "Valore Endo e platino — Calcolatore sculture Ayatan",
      description:
        "Confronta il valore in Endo e in platino di sculture Ayatan e mod in Warframe. Decidi cosa dissolvere per l'Endo e cosa vendere per il platino."
    },
    '/flip': {
      title: "Trova flip — Migliori spread di trading di Warframe",
      description:
        "Individua gli spread compra/vendi più ampi e liquidi su Warframe Market. Compra al prezzo di offerta, rivendi al prezzo richiesto e guadagna platino con le parti prime."
    },
    '/live': {
      title: "Segnali di mercato dal vivo — Scambi Warframe in tempo reale",
      description:
        "Feed degli ordini di Warframe Market in tempo reale con segnali di acquisto, vendita e flip più verdetti di convenienza. Non perdere mai una parte prime o un Riven sottovalutato."
    },
    '/movers': {
      title: "Top movimenti — Prezzi Warframe in salita e in discesa",
      description:
        "Guarda quali oggetti di Warframe Market schizzano o crollano in 24 h e 7 g. Anticipa i trend dei prezzi in platino prima del resto del mercato."
    },
    '/portfolio': {
      title: "Tracker del portafoglio — Il tuo platino in Warframe",
      description:
        "Monitora nel tempo il valore in platino del tuo inventario prime e Riven di Warframe, con watchlist e avvisi di prezzo. Conosci il tuo patrimonio in platino."
    },
    '/relic-farming': {
      title: "Valore farming reliquie — Migliori reliquie di Warframe",
      description:
        "Classifica le reliquie di Warframe per valore reale in platino a run, ponderato sulla liquidità di mercato. Farma le reliquie che rendono davvero in platino."
    },
    '/relics-value': {
      title: "Calcolatore reliquie — Aprire o vendere?",
      description:
        "Rendimento atteso in platino di ogni reliquia di Warframe, Intatta e Radiosa. Decidi se aprire una reliquia per le parti o venderla direttamente."
    },
    '/riven-value': {
      title: "Stima valore Riven — Prezzi dei Riven in Warframe",
      description:
        "Stima quanto vale un mod Riven di Warframe in platino in base alla disposizione dell'arma e al roll. Valuta i tuoi Riven prima di scambiare o fare offerte."
    },
    '/screener': {
      title: "Screener di mercato — Filtra i prezzi prime di Warframe",
      description:
        "Filtra ogni oggetto di Warframe Market per prezzo, volume, spread e tag. Crea filtri su misura per trovare la tua prossima mossa in platino."
    },
    '/star-chart': {
      title: "Mappa dei drop — Drop di reliquie e parti di Warframe",
      description:
        "Mappa stellare interattiva di Warframe che mostra dove cade ogni parte prime e reliquia. Pianifica il percorso di farming più rapido per nodo missione."
    },
    '/star-chart-3d': {
      title: "Mappa dei drop 3D — Esploratore dei drop reliquie di Warframe",
      description:
        "Esplora le posizioni di drop di prime e reliquie di Warframe su una mappa stellare 3D interattiva. Trova il nodo migliore per la parte o la reliquia che ti serve."
    },
    '/timing': {
      title: "Timing di acquisto e vendita — Quando fare trading in Warframe",
      description:
        "Trova le ore migliori per comprare e vendere ogni oggetto di Warframe Market, in base ai pattern storici di prezzo e volume. Cronometra i tuoi scambi in platino."
    },
    '/vault-spikes': {
      title: "Picchi da vault — Balzi di prezzo dei prime di Warframe",
      description:
        "Segui i prime Warframe vaulted i cui prezzi stanno schizzando ora. Individua quali set vaulted salgono e sfrutta la scarsità."
    },
    '/vaulted': {
      title: "Prime vaulted — Segui i prezzi Warframe in salita",
      description:
        "Tutti i prime Warframe vaulted che non puoi più farmare, ordinati per trend di prezzo. Osserva cosa si rivaluta in platino e vendi con astuzia."
    },
    '/volatility': {
      title: "Volatilità dei prezzi — Oggetti Warframe più volatili",
      description:
        "Classifica gli oggetti di Warframe Market per volatilità dei prezzi. Trova riserve stabili di platino o oggetti a forte oscillazione per il flipping aggressivo."
    },
    '/set': {
      title: "Prezzi dei set — Valore dei set prime di Warframe",
      description:
        "Sfoglia i prezzi in platino in tempo reale di ogni set prime di Warframe. Confronta set e parti e trova le offerte migliori su Warframe Market."
    },
    '/relic': {
      title: "Prezzi delle reliquie — Valore delle reliquie di Warframe",
      description:
        "Prezzi in platino in tempo reale e rendimenti attesi delle reliquie di Warframe. Scopri quali reliquie vale la pena aprire, tenere o scambiare."
    },
    '/guides/endo': {
      title: "Guida al farming di Endo — Warframe",
      description:
        "Una guida completa per farmare Endo in modo efficiente in Warframe, e per valutare sculture Ayatan e mod rispetto al platino."
    }
  },
  uk: {
    '/': {
      title: 'Warframe Market Analytics — ціни на Prime у реальному часі та інструменти для платини',
      description:
        'Відстежуйте ціни Warframe Market у реальному часі, вартість сетів prime, ефективність дукатів, ціну Riven і торгові сигнали. Безкоштовна аналітика платини та інструменти для Tenno.'
    },
    '/comparison': {
      title: 'Калькулятор сет чи частини — сети Prime у Warframe',
      description:
        'Що дешевше — зібрати сет prime у Warframe чи купувати частинами? Порівняйте актуальні ціни Warframe Market і дізнайтеся, скільки платини заощадите.'
    },
    '/ducats': {
      title: 'Калькулятор дукатів — найкращі частини prime за дукати',
      description:
        "Знайдіть частини prime з найкращим співвідношенням дукати/платина, щоб накопичити до приїзду Baro Ki'Teer. Рейтинг ефективності дукатів Warframe Market, оновлюється постійно."
    },
    '/endo': {
      title: 'Цінність Endo та платини — калькулятор скульптур Ayatan',
      description:
        'Порівняйте цінність в Endo і в платині для скульптур Ayatan та модів у Warframe. Вирішіть, що розчинити заради Endo, а що продати за платину.'
    },
    '/flip': {
      title: 'Пошук флипів — найкращі торгові спреди Warframe',
      description:
        'Знаходьте найширші та найліквідніші спреди купівлі/продажу на Warframe Market. Купуйте за бідом, перепродавайте за аском і заробляйте платину на частинах prime.'
    },
    '/live': {
      title: 'Сигнали ринку в реальному часі — угоди Warframe онлайн',
      description:
        'Стрічка ордерів Warframe Market у реальному часі із сигналами купівлі, продажу та флипу і вердиктами щодо вигоди. Не пропустіть недооцінену частину prime чи Riven.'
    },
    '/movers': {
      title: 'Лідери руху — ціни Warframe зростають і падають',
      description:
        'Дивіться, які предмети Warframe Market злітають чи обвалюються за 24 год і 7 днів. Ловіть тренди цін у платині раніше за решту ринку.'
    },
    '/portfolio': {
      title: 'Трекер портфеля — ваша платина у Warframe',
      description:
        'Відстежуйте вартість вашого інвентарю prime і Riven у Warframe в платині з часом, зі списком стеження та сповіщеннями про ціни. Знайте свій статок у платині.'
    },
    '/relic-farming': {
      title: 'Цінність фарму реліквій — найкращі реліквії Warframe',
      description:
        'Ранжуйте реліквії Warframe за реальною цінністю в платині за забіг з урахуванням ліквідності ринку. Фарміть реліквії, які справді приносять платину.'
    },
    '/relics-value': {
      title: 'Калькулятор реліквій — розкрити чи продати?',
      description:
        'Очікувана віддача в платині від кожної реліквії Warframe, Intact і Radiant. Вирішіть, розкривати реліквію заради частин чи продати цілком.'
    },
    '/riven-value': {
      title: 'Оцінювач вартості Riven — ціни на Riven у Warframe',
      description:
        'Оцініть, скільки коштує мод Riven у Warframe в платині за диспозицією зброї та роллом. Оцініть свої Riven перед торгівлею чи ставкою.'
    },
    '/screener': {
      title: 'Скринер ринку — фільтр цін prime у Warframe',
      description:
        'Фільтруйте будь-який предмет Warframe Market за ціною, обсягом, спредом і тегами. Створюйте власні фільтри, щоб знайти наступну угоду на платину.'
    },
    '/star-chart': {
      title: 'Карта дропу зоряної карти — дроп реліквій і частин Warframe',
      description:
        'Інтерактивна зоряна карта Warframe показує, звідки падають усі частини prime і реліквії. Сплануйте найшвидший маршрут фарму за вузлами місій.'
    },
    '/star-chart-3d': {
      title: '3D-карта дропу — дослідник дропу реліквій Warframe',
      description:
        'Досліджуйте місця дропу prime і реліквій Warframe на інтерактивній 3D зоряній карті. Знайдіть найкращий вузол для потрібної частини чи реліквії.'
    },
    '/timing': {
      title: 'Час купівлі та продажу — коли торгувати у Warframe',
      description:
        'Знайдіть найкращі години для купівлі та продажу кожного предмета Warframe Market за історичними патернами ціни й обсягу торгів. Розрахуйте час угод у платині.'
    },
    '/vault-spikes': {
      title: 'Стрибки волта — зростання цін на primes у Warframe',
      description:
        'Відстежуйте vaulted-прайми Warframe, ціни на які злітають просто зараз. Помічайте, які vaulted-сети зростають, і заробляйте на дефіциті.'
    },
    '/vaulted': {
      title: 'Vaulted-прайми — стежте за зростанням цін Warframe',
      description:
        'Усі vaulted-прайми Warframe, які вже не нафармити, відсортовані за трендом ціни. Стежте, що дорожчає в платині, і продавайте з розумом.'
    },
    '/volatility': {
      title: 'Волатильність цін — найволатильніші предмети Warframe',
      description:
        'Ранжуйте предмети Warframe Market за волатильністю ціни. Знайдіть стабільні сховища платини або предмети з великими коливаннями для агресивного флипу.'
    },
    '/set': {
      title: 'Ціни на сети — вартість сетів prime у Warframe',
      description:
        'Переглядайте актуальні ціни в платині на кожен сет prime у Warframe. Порівнюйте сет і частини та знаходьте найкращі пропозиції на Warframe Market.'
    },
    '/relic': {
      title: 'Ціни на реліквії — вартість реліквій Warframe',
      description:
        'Актуальні ціни в платині та очікувана віддача від реліквій Warframe. Дізнайтеся, які реліквії варто розкривати, зберігати чи продавати.'
    },
    '/guides/endo': {
      title: 'Гайд із фарму Endo — Warframe',
      description:
        'Повний гайд з ефективного фарму Endo у Warframe, а також як оцінювати скульптури Ayatan і моди відносно платини.'
    }
  }
}
