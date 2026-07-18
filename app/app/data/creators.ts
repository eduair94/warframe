// Warframe content creators worth following. Every channel URL here was
// verified live (YouTube oEmbed author_url or a 200 on the @handle) so no link
// is broken; the signature `video` ids were confirmed via oEmbed. Names/handles
// are exact. Blurbs describe each creator's content lane. Data-driven so the
// /creators page (and any future embeds) stays a single source of truth.

export interface Creator {
  name: string
  handle: string
  url: string
  blurb: string
  tags: string[]
  featured?: boolean
  /** A verified signature video to embed on featured cards. */
  video?: { id: string; title: string }
}

export const CREATOR_TAGS = [
  'Beginner', 'Guides', 'Builds', 'Tier Lists', 'Farming', 'Meta', 'Endgame', 'Eidolons', 'News', 'Mechanics', 'Trading',
] as const

export const CREATORS: Creator[] = [
  {
    name: 'iFlynn', handle: '@xiFlynn', url: 'https://www.youtube.com/@xiFlynn', featured: true,
    blurb: 'Fast, upbeat guides on basically everything — a rolling beginner series plus farming, systems and tips. One of the friendliest on-ramps for new Tenno.',
    tags: ['Beginner', 'Guides', 'Farming'],
    video: { id: 'yeGZqhDrRvw', title: "Warframe Beginner's Guide 2025: Episode #1" },
  },
  {
    name: 'Brozime', handle: '@Brozime', url: 'https://www.youtube.com/@Brozime', featured: true,
    blurb: 'Long-form, opinionated roster reviews, full tier lists and build refreshes. The reference point when you want a considered take on where a frame really sits.',
    tags: ['Tier Lists', 'Builds', 'Meta'],
    video: { id: '3ymgp9B-xVY', title: 'RANKING EVERY WARFRAME — FULL ROSTER 2025' },
  },
  {
    name: 'KnightmareFrame', handle: '@KnightmareFrame', url: 'https://www.youtube.com/@KnightmareFrame', featured: true,
    blurb: 'Clean, well-researched deep-dives into mechanics and builds. Great when you want to actually understand why a setup works, not just copy it.',
    tags: ['Mechanics', 'Builds', 'Guides'],
    video: { id: '_Hq2VdgM6kw', title: 'Advanced Focus Guide! Eidolon Hunting' },
  },
  {
    name: 'Grind Hard Squad', handle: '@thegrindshack', url: 'https://www.youtube.com/@thegrindshack', featured: true,
    blurb: 'Build showcases and "break the game" loadouts with a sense of humour, plus practical farming spot rundowns.',
    tags: ['Builds', 'Endgame', 'Farming'],
    video: { id: 'KNi5Lzpaf-Y', title: 'The Only Warframe Farming Spots You Need' },
  },
  {
    name: 'MHBlacky', handle: '@MHBlacky_ENG', url: 'https://www.youtube.com/@MHBlacky_ENG', featured: true,
    blurb: 'Comprehensive guides, tier lists and system explainers with a steady, thorough style covering the whole game.',
    tags: ['Guides', 'Tier Lists', 'Meta'],
    video: { id: 'YNafIWOUBhU', title: 'BEST Warframes 2026 Tier List' },
  },
  {
    name: 'Tipsy', handle: '@TipsyContent', url: 'https://www.youtube.com/@TipsyContent', featured: true,
    blurb: 'A structured, up-to-date beginner walkthrough series that takes you from the tutorial through the mid-game, episode by episode.',
    tags: ['Beginner', 'Guides'],
    video: { id: 'fwI6RW6mrgM', title: 'Warframe Beginner Guide: Start Here!' },
  },
  {
    name: 'Pupsker', handle: '@Pupsker', url: 'https://www.youtube.com/@Pupsker', featured: true,
    blurb: 'Tips, farming routes and tier lists aimed squarely at players who want to get more efficient without a two-hour video.',
    tags: ['Guides', 'Farming', 'Tier Lists'],
    video: { id: 'j8HBB7aArdg', title: 'Warframe New Player Tips & Tricks' },
  },
  {
    name: 'Joe Hammer Gaming', handle: '@JoeHammerGaming', url: 'https://www.youtube.com/@JoeHammerGaming', featured: true,
    blurb: 'Focused farming guides — credits, Kuva, Railjack, arcanes — with clear, repeatable methods and locations.',
    tags: ['Farming', 'Guides'],
    video: { id: 'i_QW_ZHj56g', title: 'All BEST Warframe Credit Farm Locations' },
  },
  {
    name: 'WarframeFlo', handle: '@WarframeFlo', url: 'https://www.youtube.com/@WarframeFlo', featured: true,
    blurb: 'Farming and meta guides that keep pace with the current update — arcanes, Steel Path, Eidolons and more.',
    tags: ['Farming', 'Meta', 'Endgame'],
    video: { id: '25s9w7ktVHI', title: 'How To Get Started In Warframe (Beginners)' },
  },
  {
    name: 'ForsakenIdol', handle: '@ForsakenIdol', url: 'https://www.youtube.com/@ForsakenIdol',
    blurb: 'The community authority on Eidolon hunting — thousands of captures deep. If you want to learn Tridolons properly, start here.',
    tags: ['Eidolons', 'Endgame'],
  },
  {
    name: 'TheKengineer', handle: '@TheKengineer', url: 'https://www.youtube.com/@TheKengineer',
    blurb: 'Analytical, effectiveness-first breakdowns of frames, weapons and mechanics — the "let\'s test what actually works" channel.',
    tags: ['Mechanics', 'Builds', 'Guides'],
  },
  {
    name: 'Leyzar', handle: '@LeyzarGamingViews', url: 'https://www.youtube.com/@LeyzarGamingViews',
    blurb: 'A huge library of build guides and how-tos covering nearly every frame and weapon, updated across the years.',
    tags: ['Builds', 'Guides'],
  },
  {
    name: 'Mogamu', handle: '@Mogamu', url: 'https://www.youtube.com/@Mogamu',
    blurb: 'One of the longest-running Warframe voices — news, opinion and veteran perspective on where the game is heading.',
    tags: ['News', 'Meta'],
  },
  {
    name: 'Tactical Potato', handle: '@TacticalPotato', url: 'https://www.youtube.com/@TacticalPotato',
    blurb: 'Approachable walkthroughs and beginner-friendly guides delivered at a relaxed pace — good for following along.',
    tags: ['Beginner', 'Guides'],
  },
  {
    name: 'AGayGuyPlays', handle: '@AGayGuyPlays', url: 'https://www.youtube.com/@AGayGuyPlays',
    blurb: 'Weekly Warframe news, update breakdowns and builds — a reliable way to keep up with what just changed.',
    tags: ['News', 'Builds'],
  },
  {
    name: 'Quite Shallow', handle: '@QuiteShallow', url: 'https://www.youtube.com/@QuiteShallow',
    blurb: 'Build and meta content with an eye for optimization and the current strongest setups.',
    tags: ['Builds', 'Meta'],
  },
  {
    name: 'Aznvasions', handle: '@Aznvasions', url: 'https://www.youtube.com/@Aznvasions',
    blurb: 'Loadout and build videos plus practical earning/farming content for players chasing efficiency.',
    tags: ['Builds', 'Farming'],
  },
  {
    name: 'VOIDsup', handle: '@VoiDsUp', url: 'https://www.youtube.com/@VoiDsUp',
    blurb: 'Build guides and frame showcases focused on getting the most out of each Warframe.',
    tags: ['Builds', 'Guides'],
  },
  {
    name: 'QuadLyStop', handle: '@QuadLyStop', url: 'https://www.youtube.com/@QuadLyStop',
    blurb: 'Farming and systems guides — Kuva, Helminth, mastery and more — with straightforward, current methods.',
    tags: ['Farming', 'Guides'],
    video: { id: '6Ebs0Ws_GdQ', title: 'Kuva Farming Guide — All The Ways' },
  },
  {
    name: 'D-Soul', handle: '@Jambo_D-Soul', url: 'https://www.youtube.com/@Jambo_D-Soul',
    blurb: 'Fast, focused "how to farm X" guides for relics, Helminth and Eidolons.',
    tags: ['Farming', 'Guides'],
    video: { id: 'vtWVJ9DKmRU', title: 'How To Farm Void Traces FAST' },
  },
  {
    name: 'CerealOverdrive', handle: '@CerealOverdrive', url: 'https://www.youtube.com/@CerealOverdrive',
    blurb: 'Clear explainers on core systems like relics and refinement, plus mastery progression.',
    tags: ['Guides', 'Mechanics'],
    video: { id: 'sX-8t0hGvgI', title: 'How to Refine Void Relics & Find Void Traces' },
  },
  {
    name: 'Hunkpain Gaming', handle: '@HunkpainGaming', url: 'https://www.youtube.com/@HunkpainGaming',
    blurb: 'Survivability and build guides — the shield-gating and "stop dying" side of modding.',
    tags: ['Mechanics', 'Builds'],
    video: { id: 'RQ22Jltn3i0', title: 'The Ultimate Shield Gating Guide' },
  },
  {
    name: 'Gaz TTV', handle: '@GazTTV', url: 'https://www.youtube.com/@GazTTV',
    blurb: 'Meta farming guides with current builds — Kuva, relics and the efficient routes.',
    tags: ['Farming', 'Meta'],
    video: { id: 'jWmJP_0M1Es', title: 'BEST Kuva Farm! Meta Arbitration Guide' },
  },
  {
    name: 'DrybearGamers', handle: '@DrybearGamers', url: 'https://www.youtube.com/@DrybearGamers',
    blurb: 'New-player oriented tips and getting-started content to smooth out the early hours.',
    tags: ['Beginner', 'Guides'],
  },
]
