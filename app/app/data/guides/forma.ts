// Warframe Knowledge Center guide content — "How to Farm Forma".
// Drafted from r/Warframe research (reddit API, incl. the exact "cracked all my
// relics, got 0 forma" thread) + the Warframe Wiki, then adversarially
// fact-checked (build recipe, refinement drop-chance math, non-relic sources and
// their exact numbers were all verified). Rendered by the shared <GuideArticle>.
import type { Guide } from './types'

const guide: Guide = {
  slug: 'forma',
  eyebrow: 'Knowledge Center · Forma Farming',
  title: 'How to Farm Forma (Blueprints & Built)',
  lede: "Cracked every Forma relic and got zero? You almost certainly ran them solo or refined them to Radiant — both quietly gut your Forma odds. Forma isn't rare, it's a Common relic reward. Here's how to farm it right, plus every source that doesn't touch a relic at all.",
  category: 'farming',
  readMins: 10,
  updated: '2026-07-19',
  stats: [
    { num: '4×', label: 'Forma per reward round in a full public squad', tone: 'good' },
    { num: '17%', label: 'Forma odds after you Radiant a relic (vs 25% Intact)', tone: 'alt' },
    { num: '23 h', label: 'to build one Forma — so queue one every single day', tone: 'gold' },
    { num: '2.5%', label: 'chance of a free Forma from every daily Sortie' },
  ],
  sections: [
    {
      id: 'why-zero',
      title: 'Why you cracked relics and still got 0 Forma',
      blocks: [
        {
          type: 'p',
          text: "First, the mindset fix: **Forma Blueprint is one of the most *common* rewards in the entire relic pool.** It sits in the **Common** slot of most relics (and the **Uncommon** slot of some), and it is **never** the Rare reward — the Rare slot is reserved for the valuable Prime part. So if you burned relics and saw no Forma, the relics weren't the problem. The way you ran them was.",
        },
        {
          type: 'list',
          items: [
            '**You ran solo.** In a full 4-player fissure, every reward round shows the combined pool of *all four* opened relics, and each player picks one item — so you can pocket Forma that dropped from a teammate\'s relic. Solo, you only ever see your own single roll. This is the number-one fix in every "got 0 forma" thread.',
            '**You refined them to Radiant.** Forma is a *Common* reward, and refining pushes drop chance **out** of the Common slots and **into** the Uncommon and Rare slots. Radiant *lowers* your Forma odds (25.33% → 16.67% per Common slot) and costs 100 Void Traces to do it. For Forma, Intact is both better and free.',
            '**You only farmed relics that "list" Forma.** You don\'t need them. Because Forma fills the Common slot of a huge share of Lith/Meso/Neo/Axi relics, running *any* relics in a public squad rains Forma Blueprints on you while you also farm Prime parts and platinum.',
          ],
        },
        {
          type: 'info',
          title: 'The one-line answer',
          text: "Run **any** relics you\'ve got, **Intact** (unrefined), in a **full public squad**, in an **endless** fissure. Do that and Forma stops being something you farm and becomes something you drown in. The rest of this guide is the detail — and the routes for when you're done with relics entirely.",
        },
      ],
    },
    {
      id: 'relic-method',
      title: 'The relic method, done right',
      blocks: [
        {
          type: 'p',
          text: "Relics are still by far the highest-*volume* Forma source in the game, and you get them essentially for free while chasing Prime parts. Three rules turn a dry relic run into a Forma faucet:",
        },
        {
          type: 'steps',
          steps: [
            {
              h: 'Leave them Intact — do not refine',
              p: "Forma lives in the Common slot, and refinement moves probability away from Common. An Intact relic gives each Common reward a 25.33% chance; a Radiant one drops that to 16.67%. Save your Void Traces for making Prime *rares* Radiant, not for Forma.",
            },
            {
              h: 'Run in a full public squad (4 players)',
              p: 'Every fissure reward screen pools the drops from all opened relics and lets each player keep one. Four squadmates all cracking relics means up to four Forma can appear each round, and you can grab one even if your own relic rolled the Prime part. Matchmaking on Public is the single biggest multiplier here.',
            },
            {
              h: 'Pick an endless fissure, not a Capture',
              p: 'Survival (reward every 5 min), Defense (every 5 waves), Disruption (per round), Interception and Void Cascade all let every player slot a **fresh** relic each interval. One long run cracks many relics per person. Just remember to collect 10 Reactant from the Corrupted enemies before each interval ends, or you forfeit that round\'s relic reward.',
            },
          ],
        },
        {
          type: 'table',
          table: {
            columns: ['Refinement', 'Forma odds (Common slot)', 'Void Trace cost'],
            rows: [
              ['Intact', '25.33% — best', 'Free'],
              ['Exceptional', '23.33%', '25'],
              ['Flawless', '20.00%', '50'],
              ['Radiant', '16.67% — worst', '100'],
            ],
            note: 'These are per-Common-slot odds. The only time refining helps Forma is the handful of relics where Forma is the Uncommon reward — there it climbs 11% (Intact) → 20% (Radiant) and pays 2× Forma per hit — but that\'s rarely worth 100 Traces just for Forma.',
          },
        },
        {
          type: 'warn',
          title: '"4 Forma a round" is a ceiling, not a promise',
          text: 'Each opened relic rolls exactly one reward. A full Forma-relic squad can net up to 4 Forma in a round, but only if all four relics happen to roll their Forma slot. It\'s a strong average over many rounds, not a guarantee every interval.',
        },
        {
          type: 'p',
          text: "Not sure which relics carry Forma right now? Contents rotate as relics get vaulted and unvaulted, so check the live source: **[warframe.com/droptables](https://www.warframe.com/droptables)** (Ctrl+F “Forma Blueprint”), or use the on-site tools — [which relics pay best per run](/relic-farming) and [crack, sell or keep?](/relics-value) — to plan a run. Full relic mechanics live in the [Relics & Void Traces guide](/guides/relics).",
        },
      ],
    },
    {
      id: 'no-relics',
      title: 'Every Forma source that ISN\'T a relic',
      blocks: [
        {
          type: 'p',
          text: "Done with relics? Forma leaks out of half the game's reward systems. None of these match relics for raw volume, but stacked together they keep a steady trickle coming with zero fissure-running — and some hand you **built** Forma, skipping the 23-hour craft entirely.",
        },
        {
          type: 'table',
          table: {
            columns: ['Source', 'What you get', 'Worth knowing'],
            rows: [
              ['In-game Market (plat)', '3 built Forma for 35 platinum', 'Always buy the bundle — a single Forma is 20p. Plat is free-to-play farmable (see below).'],
              ['Daily Sortie', '1 built Forma at 2.5%', 'A free Forma roughly every 40 sorties, on top of the other rewards. Costs nothing extra — just do your daily.'],
              ['Nightwave (rank track)', '3× Forma Bundle, free', 'Sits around Rank 12 in recent seasons. The Nightwave Cred shop does NOT sell Forma — don\'t spend Cred hunting it.'],
              ['Daily Tribute (login)', '"3× Forma" evergreen choice', 'Unlocks at Day 1050 and rotates back around; a Day 650 milestone also caches 3 Forma + a Reactor.'],
              ['Steel Path Circuit', 'Forma Blueprint, ~4.4% in weekly tiers', 'Random drop in Steel Path tiers 1/3/4. Normal Circuit has none — don\'t grind it for Forma.'],
              ['Operation: Plague Star (event)', 'Built Forma from Nakak', '3,000 event standing + 5,000 credits each, repeatable. The best BULK source — but only while the event is live.'],
              ['Deep Archimedea · ESO · Baro', 'Nothing', 'None of these ever drop Forma. Don\'t wait on them.'],
            ],
            note: 'Twitch Drops, DevStreams and Prime Gaming also hand out the occasional single/special Forma — small and intermittent, but zero effort. Rare storage containers and the Lua music puzzle can cough one up too.',
          },
        },
        {
          type: 'tip',
          title: 'The "I hate relics" playbook',
          text: 'Do your daily Sortie for the 2.5% freebie, claim the Nightwave Forma Bundle the moment you hit its rank, take the login Forma choice when it comes up, and cash out a Steel Path Circuit tier each week. That\'s a passive drip with no fissure-running. Need them *now*? Farm a little platinum ([How to Make Platinum, F2P](/guides/platinum)) and buy the 35-plat 3-pack.',
        },
      ],
    },
    {
      id: 'bulk',
      title: 'Never be Forma-poor again (bulk & stockpiling)',
      blocks: [
        {
          type: 'p',
          text: 'If you need Forma by the *dozen* — polarizing a whole arsenal for Steel Path — three approaches actually scale:',
        },
        {
          type: 'list',
          items: [
            '**Operation: Plague Star** (when it runs). Buy built Forma from Nakak for 3,000 Operational Supply standing + 5,000 credits, over and over. This is the community\'s canonical bulk farm — one player banked **725 Forma from 565 runs** in a fortnight. Periodic event, so watch for it.',
            '**Build one every single day.** The blueprint is a 23-hour craft, so if you queue a Forma each time you log in and never let the Foundry slot idle, you passively bank ~1/day (~30 a month) — and you can build the next Forma *while* a weapon is also crafting.',
            '**Buy the plat bundle.** 35 platinum for 3 built Forma is the cash shortcut. Plat is free-to-play farmable by selling the Prime parts you get *while cracking relics for Forma* — the two farms feed each other.',
          ],
        },
        {
          type: 'info',
          title: 'Don\'t forget the Orokin Cells',
          text: 'Every Forma Blueprint costs **1 Orokin Cell** to build (see the recipe below). New players routinely run out of Cells before they run out of relics. Farm them alongside — Saturn (Helene) and Ceres Dark Sectors are the classic spots. Full list in the [Resource Farming reference](/guides/resources#staples).',
        },
      ],
    },
    {
      id: 'build',
      title: 'Building the blueprint & what Forma does',
      blocks: [
        {
          type: 'p',
          text: "The relic-drop **Forma Blueprint is single-use** — it\'s consumed when you craft one Forma, so you need a fresh blueprint for every Forma you build. Recipe and timer:",
        },
        {
          type: 'kv',
          kv: [
            { k: 'Credits', v: '35,000' },
            { k: 'Components', v: '1 Orokin Cell · 1 Neural Sensor · 1 Neurode · 1 Morphics (one of each, all required)' },
            { k: 'Build time', v: '23 hours (deliberately under a day, so you can queue one daily)' },
            { k: 'Rush cost', v: '10 platinum — poor value; just build it overnight' },
            { k: 'Buy built instead', v: '20 platinum for one, or 35 platinum for three' },
          ],
        },
        {
          type: 'p',
          text: "**What Forma actually does:** applying it sets or changes the **polarity** of one mod slot on a Warframe, weapon or companion — and **resets that item to Rank 0**, so you have to re-level it. A mod whose polarity matches its slot costs **half** its normal drain, which is how you cram expensive builds into a limited mod capacity. You can apply many Forma to one item, one slot at a time, including the Aura, Exilus and melee Stance slots.",
        },
        {
          type: 'tip',
          title: 'Re-leveling is part of the cost',
          text: 'Since every Forma wipes the item to unranked, bring a freshly-polarized item straight to a fast affinity spot — Hydron (Sedna), Elite Sanctuary Onslaught, or a Steel Path / Circuit share squad — and it re-levels in a run or two. Match your highest-drain mod\'s polarity first (usually a Riven or a maxed Primed mod) to free the most capacity per Forma.',
        },
      ],
    },
    {
      id: 'variants',
      title: 'The special Forma: Omni, Umbra & Stance',
      blocks: [
        {
          type: 'p',
          text: "Three variants exist for jobs a normal Forma can\'t do. Get each from its own source — **never** burn them (or regular Forma) in the wrong slot:",
        },
        {
          type: 'table',
          table: {
            columns: ['Variant', 'What it does', 'Where to get it'],
            rows: [
              ['Omni Forma', 'Universal polarity that matches ANY mod you slot, on any slot (this is the old "Aura Forma", renamed in Update 38.5). Does NOT give Umbra benefits.', 'Blueprint from Arbitrations; costs 4 regular Forma + 1 Argon + 10 Nitain to build. Community verdict: expensive — use sparingly.'],
              ['Umbra Forma', 'Adds the Umbral polarity for Umbral/Sacrificial mods (Umbral Intensify/Vitality/Fiber). Resets to rank 0 like any Forma.', 'Steel Path Honors (Teshin) for 150 Steel Essence, rotating ~every 8 weeks; Nightwave rank track; and 3 from the MR30 test. Not buyable with platinum.'],
              ['Stance Forma', 'Universal polarity for the melee Stance slot — fit any stance mod regardless of polarity.', 'Blueprint from Steel Path Honors for just 10 Steel Essence; builds with 1 Forma + 1 Argon + 5 Nitain.'],
            ],
            note: 'Steel Path Honors is the shop behind most specialty Forma, so banking Steel Essence keeps you ready. See the [Steel Path & Steel Essence guide](/guides/steel-path).',
          },
        },
      ],
    },
    {
      id: 'how-many',
      title: 'How many Forma do you actually need?',
      blocks: [
        {
          type: 'p',
          text: "The Forma wall hits when you reach endgame: a base frame or weapon has ~60 mod capacity, but Steel Path builds stack Galvanized mods, Primed mods, Arcanes and Rivens that simply don\'t fit without polarizing multiple slots. That\'s why demand jumps from *zero* to several per item almost overnight.",
        },
        {
          type: 'list',
          items: [
            '**Typical optimized build:** 3–6 Forma. Gear with useful innate polarities may only need ~4; an item with none can want the full ~6.',
            '**Don\'t over-Forma early.** Wait until you actually *own* the endgame mods (Galvanized, Primed, a Riven) and know your final layout. Polarizing before you have the mods just wastes re-leveling time on a build you\'ll change.',
            '**Keep a rolling stockpile of 3–5.** With a 23-hour craft, building one a day means you never stall mid-build waiting on Forma.',
          ],
        },
        {
          type: 'p',
          text: 'Before you Forma anything, pressure-test the build so you don\'t polarize for mods you\'ll drop — see the [Builds & build planners guide](/guides/builds) and the [Essential Mods guide](/guides/mods).',
        },
      ],
    },
  ],
  faqs: [
    {
      q: 'I cracked all my Forma relics and got 0 Forma — what went wrong?',
      a: 'Almost always one of two things: you ran the relics solo, or you refined them to Radiant. Forma is a Common relic reward, so (1) run relics in a full 4-player public squad — every reward round pools all four players’ relics and you each pick one, so you catch Forma from teammates too; and (2) leave relics Intact, because refining to Radiant drops each Common slot from 25.33% to 16.67%. Do both and Forma pours in.',
    },
    {
      q: 'Do I need relics that specifically list Forma?',
      a: 'No. Forma Blueprint fills the Common slot of a large share of all Lith/Meso/Neo/Axi relics, so running *any* relics in a public squad reliably drops Forma while you also farm Prime parts. Only bother targeting Forma-listed relics if you want to maximize it — otherwise just crack what you have.',
    },
    {
      q: 'Should I make my relics Radiant to get more Forma?',
      a: 'No — it does the opposite. Refinement shifts drop chance out of the Common slots (where Forma lives) into the Uncommon and Rare slots, and it costs 100 Void Traces to go Radiant. Intact relics give the best Forma odds for free. The one exception is the few relics where Forma is the Uncommon reward: there Radiant helps (and pays 2× Forma), but it’s rarely worth the Traces.',
    },
    {
      q: 'How do I get Forma without running relics at all?',
      a: 'Several ways: buy a 3-Forma bundle for 35 platinum in the Market; take the 2.5% Forma from every daily Sortie; claim the free 3× Forma Bundle on the Nightwave rank track; grab the "3× Forma" login (Daily Tribute) choice; cash out a Steel Path Circuit tier (Forma is a ~4.4% drop there); and buy built Forma in bulk from Nakak during Operation: Plague Star. Deep Archimedea, Sanctuary Onslaught and Baro never drop Forma.',
    },
    {
      q: 'What’s the fastest way to get a LOT of Forma?',
      a: 'Operation: Plague Star when it’s live — buy built Forma from Nakak for 3,000 standing + 5,000 credits each, repeatable (players bank hundreds per event). Otherwise, build one blueprint every day (23-hour craft, ~30/month), and/or farm a little platinum and buy the 35-plat 3-packs. There is no secret instant method — Forma is either time or plat.',
    },
    {
      q: 'What does the Forma Blueprint cost to build?',
      a: '35,000 credits plus 1 Orokin Cell, 1 Neural Sensor, 1 Neurode and 1 Morphics (one of each), with a 23-hour build time. The blueprint is single-use — consumed per Forma — so you need a fresh one each time. New players often run out of Orokin Cells first, so farm those alongside (Saturn/Ceres).',
    },
    {
      q: 'How many Forma does a build actually need?',
      a: 'Most fully optimized frames and weapons want 3–6 Forma; gear with good innate polarities may need only ~4, while items with none can need the full ~6. Don’t over-Forma early — wait until you own the endgame mods and know your final layout, then keep a small stockpile so you’re never stalled.',
    },
    {
      q: 'What are Aura, Umbra and Stance Forma?',
      a: 'Special variants. Omni Forma (the renamed Aura Forma) stamps a Universal polarity that matches any mod on any slot — blueprint from Arbitrations, but it costs 4 regular Forma to build. Umbra Forma adds the Umbral polarity for Umbral mods — from Steel Path Honors (150 Steel Essence), Nightwave, and 3 from the MR30 test. Stance Forma gives the melee stance slot a Universal polarity — only 10 Steel Essence. Get each from its own source rather than burning normal Forma.',
    },
  ],
  related: [
    { label: 'Relics & Void Traces', to: '/guides/relics', icon: 'diamond-stone', note: 'Where Forma Blueprints come from' },
    { label: 'How to Make Platinum', to: '/guides/platinum', icon: 'cash-multiple', note: 'Fund the 35-plat Forma bundle for free' },
    { label: 'Steel Path & Steel Essence', to: '/guides/steel-path', icon: 'fire', note: 'Umbra & Stance Forma live in Teshin’s shop' },
    { label: 'Best Builds & Planners', to: '/guides/builds', icon: 'hammer-screwdriver', note: 'Know the build before you polarize' },
    { label: 'Best relics per run', to: '/relic-farming', icon: 'sort-descending', note: 'Plan a Forma-friendly relic run' },
    { label: 'Resource Farming', to: '/guides/resources', icon: 'cube-scan', note: 'Orokin Cells for every Forma build' },
  ],
  sources: [
    {
      label: 'r/Warframe — "How to farm forma crafted/blueprints" (the exact "used all my relics, got 0" thread)',
      href: 'https://reddit.com/r/Warframe/comments/1v0gz5f/how_to_farm_forma_craftedblueprints/',
    },
    {
      label: 'r/Warframe — "How to farm copious amount of Forma?" (build 1/day, Plague Star, plat bundles)',
      href: 'https://reddit.com/r/Warframe/comments/1hss4m4/how_to_farm_copious_ammount_of_forma/',
    },
    {
      label: 'r/Warframe — "Just ran Plague Star 565 times…" (725 Forma from one event)',
      href: 'https://reddit.com/r/Warframe/comments/1np59ks/just_ran_plague_star_565_times/',
    },
    {
      label: 'r/Warframe — "6 Radiant Axi T13 relics cracked. 6 forma." (refining doesn’t boost Forma)',
      href: 'https://reddit.com/r/Warframe/comments/1s1vaat/6_radiant_axi_t13_relics_cracked_6_forma_is_this/',
    },
    {
      label: 'Warframe Wiki — Void Relic/Math (exact refinement drop-chance tables)',
      href: 'https://wiki.warframe.com/w/Void_Relic/Math',
    },
    {
      label: 'Warframe Wiki — Forma (recipe, Market price, acquisition)',
      href: 'https://wiki.warframe.com/w/Forma',
    },
    {
      label: 'Official Warframe PC Drop Tables (search "Forma Blueprint")',
      href: 'https://www.warframe.com/droptables',
    },
  ],
}

export default guide
