// /mission page UI strings. Body copy is English across all locales (page-body
// strings have no i18n parity gate — only PAGE_SEO is gated). Real translations
// can be layered later without touching the page.
const en = {
  mission: {
    eyebrow: 'Mission Insight',
    hubTitle: 'Warframe Mission Drop Guide',
    hubLede: 'Every drop source in Warframe, ranked by platinum per run — with enemy levels, faction, and how to get there.',
    searchPlaceholder: 'Search a node, planet or mission type…',
    col: {
      node: 'Node', planet: 'Planet', type: 'Mission', faction: 'Faction',
      level: 'Enemy level', value: 'Plat / run',
    },
    steelPath: 'Steel Path',
    faction: 'Faction',
    missionType: 'Mission type',
    enemyLevel: 'Enemy level',
    activity: 'Activity — no fixed star-chart node',
    rewards: 'Rewards',
    rotation: 'Rotation {r}',
    bestValue: 'Best plat / run',
    howToGet: 'How to get here',
    relatedLinks: 'Related',
    wiki: 'Open on the Warframe Wiki',
    notFound: 'No mission data for “{slug}”.',
    browseAll: 'Browse all missions',
    noRewards: 'No tradeable rewards at this source.',
  },
}

export default { en, es: en, fr: en, de: en, it: en, pt: en, pl: en, ru: en, uk: en, ja: en, ko: en, 'zh-hans': en, 'zh-hant': en }
