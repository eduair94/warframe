// Chrome strings for the Knowledge Center: the shared GuideArticle component,
// the /guides hub, /faq and /creators pages. English is authored here; the app's
// fallbackLocale ('en') covers every other locale, matching how the rest of the
// half-migrated app handles not-yet-translated page copy (the long-form guide
// BODY content is English-only by design — see data/guides/*). Namespaced so it
// deep-merges cleanly with the per-page i18n modules.
export default {
  en: {
    // Shared GuideArticle chrome
    guidesChrome: {
      backToHub: 'Knowledge Center',
      onThisPage: 'On this page',
      minRead: 'min read',
      updated: 'Updated',
      watch: 'Watch: video guides',
      watchSub: 'Hand-picked, verified guides from trusted Warframe creators.',
      faq: 'Frequently asked',
      related: 'Keep going',
      sources: 'Sources',
      disclaimer:
        'Guides focus on evergreen mechanics and strategy. Warframe changes constantly — for exact drop rates and the current "best" node, cross-check the in-game wiki and a recent video.',
    },
    // /guides hub
    guidesHub: {
      eyebrow: 'Warframe Knowledge Center',
      title: 'Everything you need to master Warframe',
      lede: 'Guides, farming routes, build fundamentals and a searchable FAQ — grounded in what r/Warframe actually asks, cross-linked to live market tools, and answerable in a single link.',
      startHere: 'New here?',
      newPlayerCta: 'Start with the New Player Guide',
      newPlayerSub: 'Your first 100 hours, sorted.',
      stats: { guides: 'in-depth guides', faqs: 'answered questions', creators: 'verified creators', free: 'free, no login' },
      faqCard: 'Warframe FAQ',
      faqNote: 'Quick answers to the questions everyone asks',
      creatorsCard: 'Content Creators',
      creatorsNote: 'The YouTubers worth following',
      toolsCard: 'Community Tools',
      toolsNote: 'Every trusted third-party Warframe site',
      searchPlaceholder: 'Search guides…',
      startBadge: 'Start here',
      noResults: 'No guides match that search.',
      disclaimer: 'A free, community-grounded knowledge base for Tenno — built from r/Warframe research and the official wiki.',
      cats: {
        start: { title: 'Getting Started', blurb: 'Your first 100 hours, frames and the star chart.' },
        farming: { title: 'Farming & Resources', blurb: 'Platinum, credits, Endo, Kuva, relics and every grind.' },
        systems: { title: 'Systems & Builds', blurb: 'Mods, Helminth, arcanes and how power actually works.' },
        endgame: { title: 'Endgame', blurb: 'Steel Path, Eidolons and the deep-end content.' },
        reference: { title: 'Reference', blurb: 'Tier lists, the FAQ and the creators worth watching.' },
      },
    },
    // /faq
    faq: {
      eyebrow: 'Warframe FAQ',
      title: 'Frequently Asked Questions',
      lede: 'The questions r/Warframe asks over and over — answered plainly and linked to the deeper guides and live tools. Search it, or browse by topic.',
      searchPlaceholder: 'Search the FAQ… (e.g. "platinum", "Rhino", "Steel Path")',
      all: 'All',
      noResults: 'No questions match that search. Try a different term.',
      cta: 'Browse all guides →',
      disclaimer: 'Answers focus on evergreen mechanics. When in doubt, the in-game wiki has the current numbers.',
    },
    // Homepage promo banner → Knowledge Center
    homePromo: {
      eyebrow: 'New · Knowledge Center',
      title: 'Guides, farming routes & a searchable Warframe FAQ',
      sub: 'From your first Warframe to Steel Path — grounded in r/Warframe, with videos from top creators.',
      cta: 'Explore the guides',
    },
    // /creators
    creators: {
      eyebrow: 'Warframe Content Creators',
      title: 'Creators worth following',
      lede: 'The YouTubers the community learns from — build masters, tier-list makers, farming specialists and beginner guides. Every channel and video here was verified live.',
      stats: { channels: 'creators', featured: 'featured', verified: 'links verified' },
      all: 'All',
      featuredTitle: 'Featured creators',
      moreTitle: 'More creators to follow',
      visit: 'Visit channel',
      disclaimer: 'Independent creators, not affiliated with this site. Channels and signature videos verified via the YouTube API.',
    },
  },
}
