// The Warframe FAQ — the questions r/Warframe (and the subreddit wiki FAQ) get
// asked over and over, answered concisely and cross-linked to the deeper guides
// and live tools on this site. Answers are deliberately EVERGREEN (mechanics &
// strategy, not patch-volatile numbers). Rendered by /faq with search + category
// filters and emitted as FAQPage JSON-LD so the answers are eligible for Google
// rich results and AI citations. Answer strings support the renderRich grammar
// (**bold**, `code`, [label](/route)).

export interface FaqItem {
  q: string
  a: string
  cat: string
}

export interface FaqCategory {
  key: string
  title: string
  icon: string
}

export const FAQ_CATEGORIES: FaqCategory[] = [
  { key: 'start', title: 'Getting Started', icon: 'mdi-rocket-launch-outline' },
  { key: 'frames', title: 'Warframes & Progression', icon: 'mdi-account-group-outline' },
  { key: 'plat', title: 'Platinum & Trading', icon: 'mdi-cash-multiple' },
  { key: 'farm', title: 'Farming & Resources', icon: 'mdi-timer-sand' },
  { key: 'power', title: 'Mods & Builds', icon: 'mdi-cog-outline' },
  { key: 'end', title: 'Endgame & Systems', icon: 'mdi-skull-outline' },
]

export const FAQS: FaqItem[] = [
  // ── Getting Started ──────────────────────────────────────────────────
  {
    cat: 'start',
    q: 'I just started Warframe — what should I do first?',
    a: "Finish the opening quest (**Vor's Prize**), then work through the star chart planet by planet, doing the story quests as they unlock. Don't rush — level a few weapons and a frame, learn one enemy faction at a time, and follow the Junctions (the gateways between planets). Our [New Player Guide](/guides/new-player) lays out the whole first-100-hours path.",
  },
  {
    cat: 'start',
    q: 'Which starter Warframe is best — Excalibur, Mag or Volt?',
    a: "They're all good and none is a mistake. **Excalibur** is the most beginner-friendly all-rounder, **Volt** is fast with strong damage and shields, and **Mag** is a caster that shines against Corpus. Pick the playstyle you like — you can farm the other two later. More detail in [Best Beginner Warframes](/guides/beginner-warframes).",
  },
  {
    cat: 'start',
    q: 'What Warframe should I farm first after my starter?',
    a: 'The near-unanimous community answer is **Rhino** — his Iron Skin makes you nearly unkillable while you learn the game, and his parts drop from the Jackal boss on Venus. He carries you comfortably through most of the star chart. See [Best Beginner Warframes](/guides/beginner-warframes).',
  },
  {
    cat: 'start',
    q: 'Is Warframe pay-to-win?',
    a: "No. Almost everything — Warframes, weapons, mods — is earnable in-game, and the premium currency (**platinum**) can be earned for free by [trading](/guides/platinum) with other players. Paying only saves time or buys cosmetics; it doesn't buy power you can't otherwise farm.",
  },
  {
    cat: 'start',
    q: 'How long is Warframe and does it get better?',
    a: "It's enormous and largely free-form. The early star chart is the slowest part; the game genuinely opens up once you unlock mods properly, get a second frame, and start the story quests. Most players say it clicks somewhere around the first big story quest. Stick with it past the opening grind.",
  },
  {
    cat: 'start',
    q: 'What does Mastery Rank (MR) actually do?',
    a: "MR is your account level, earned by leveling weapons, frames and companions to 30 (each gives mastery once). It raises your **daily standing cap**, unlocks some weapons/mods behind an MR requirement, increases trades per day, and gives small starting mod capacity. It is **not** a power stat. See [Mastery Rank & Fast Leveling](/guides/mastery-rank).",
  },

  // ── Warframes & Progression ─────────────────────────────────────────
  {
    cat: 'frames',
    q: 'How do I get new Warframes?',
    a: 'Two ways: **farm** the three parts (Neuroptics, Chassis, Systems) plus the blueprint and build them in your Foundry, or **buy** the frame with platinum (which also comes with a slot and a reactor). Most frame parts drop from a specific planet boss or from relics/other activities. Check where a part drops on our [Star Chart drop map](/star-chart).',
  },
  {
    cat: 'frames',
    q: "I'm out of Warframe / weapon slots — what do I do?",
    a: "Slots are one of the best uses of your first platinum: Warframe slots and weapon slots are cheap and permanent. Sell duplicate/low-value gear you don't want, and buy slots rather than deleting things you spent time farming. See [How to Make Platinum](/guides/platinum) for how to earn the plat first.",
  },
  {
    cat: 'frames',
    q: 'In what order should I do the story quests?',
    a: "Broadly: do quests as the star chart and Mastery Rank unlock them, starting with **Vor's Prize**, then the early frame quests, then the main saga (The Second Dream → The War Within → … → The New War → 1999). Some are gated behind clearing certain planets. Full ordering in the [Quest & Story Order](/guides/quests) guide.",
  },
  {
    cat: 'frames',
    q: "What's the best Warframe? Is there a tier list?",
    a: "There's no single best — it depends on the content and your build. Tier lists disagree because they weight different activities and patches change things constantly. Almost any frame clears the star chart. For endgame, a handful (survivability + strong damage/utility frames) stand out. Read [how to actually read a tier list](/guides/tier-list) and check reputable [creators](/creators).",
  },
  {
    cat: 'frames',
    q: 'Should I sell a Warframe I already have?',
    a: "Generally no — never sell hard-to-farm frames or ones behind vaulted relics, even duplicates, unless you're truly out of slots and certain. Buy a slot instead. Prime frames you don't want can be worth **ducats** or plat, but the base frame is a pain to re-farm.",
  },

  // ── Platinum & Trading ──────────────────────────────────────────────
  {
    cat: 'plat',
    q: 'How do I make platinum for free?',
    a: "Trade with other players. The reliable earners are **prime parts** (from relics), **mods** (Primed/rare/riven), **arcanes** and **Ayatan sculptures**. List them on warframe.market, sit in trade chat, and meet buyers at a dojo or relay. Our [Platinum guide](/guides/platinum) walks through it, and tools like the [Flip Finder](/flip) and [Set vs Parts](/comparison) help you price.",
  },
  {
    cat: 'plat',
    q: 'How does trading work / what do I need to trade?',
    a: 'You must be **Mastery Rank 2** to trade. Trades cost a credit tax, you get a number of trades per day equal to your MR, and trading happens in person at a Clan Dojo trading post or a Maroo\'s Bazaar relay. Use [warframe.market](https://warframe.market) to find buyers and sellers.',
  },
  {
    cat: 'plat',
    q: 'Can I trade platinum directly to a friend?',
    a: 'Not directly — platinum can only move as part of an item trade. To gift plat, one player lists an item and the other "buys" it for the agreed platinum amount. Discounts on plat purchases (the 50%/75% coupons) are the cheapest way to buy plat if you do spend money.',
  },
  {
    cat: 'plat',
    q: 'What should I spend my first platinum on?',
    a: "**Slots and potatoes.** Warframe/weapon slots (permanent inventory space) and Orokin Reactors/Catalysts (double a frame/weapon's mod capacity) give the biggest quality-of-life boost. Cosmetics are fine too — just avoid spending plat on things you can easily farm.",
  },
  {
    cat: 'plat',
    q: 'Is my prime set worth more as a set or as parts?',
    a: 'Usually the individual parts sell for more in total than the assembled set, but not always, and parts can be slower to sell. Our [Set vs Parts calculator](/comparison) compares live Warframe Market prices so you can see exactly which is better right now.',
  },
  {
    cat: 'plat',
    q: 'What are ducats and how do I get them?',
    a: "Ducats are the currency for **Baro Ki'Teer**, the traveling merchant. You get them by selling prime parts at a relay's Void Trader kiosk. Some low-plat parts give great ducats, so they're worth stockpiling. Our [Ducat Value tool](/ducats) ranks the best ducats-per-platinum parts to hold.",
  },

  // ── Farming & Resources ─────────────────────────────────────────────
  {
    cat: 'farm',
    q: 'How do relics and void traces work?',
    a: 'Relics hold prime parts. You run a **Void Fissure** mission with a relic equipped to crack it and pick one of the rewards; playing with a full squad lets everyone see four reward rolls to choose from. **Void Traces** (earned in fissures) let you refine relics to boost the rare drop chance. Full details in [Relics & Void Traces](/guides/relics).',
  },
  {
    cat: 'farm',
    q: "What's the best way to farm credits?",
    a: 'The classic reliable farm is **The Index** on Neptune (with a credit booster it pays extremely well), plus Profit-Taker bounties later on. Endless missions and daily activities help too. See [Credit Farming](/guides/credits) for the current best routes.',
  },
  {
    cat: 'farm',
    q: 'How do I farm Endo to upgrade my mods?',
    a: "The cheapest Endo-per-platinum route is buying heavily re-rolled 'trash' rivens and dissolving them, since a riven's Endo value is fixed by a formula regardless of its stats. Ayatan sculptures (from Maroo's weekly hunt and drops) are the classic source. See the [Endo guide](/guides/endo) and the live [Endo / Plat tool](/endo).",
  },
  {
    cat: 'farm',
    q: 'How do I farm Kuva?',
    a: 'Kuva powers **riven re-rolls** and Kuva weapons. The staple farms are **Kuva Survival** and **Kuva Siphon/Flood** missions in the Kuva Fortress and across the star chart, boosted by things like a Kuva-Lich influence. See [Kuva Farming](/guides/kuva).',
  },
  {
    cat: 'farm',
    q: 'Where do I farm Orokin Cells, Neurodes and Argon Crystals?',
    a: "**Orokin Cells** drop well on Saturn (Helene) and from certain bosses; **Neurodes** come from Deimos/Lua and Orokin Derelict; **Argon Crystals** only drop in the Void and **decay within 24 hours**, so farm them just before you need them. Full table in the [Resource Farming Reference](/guides/resources).",
  },
  {
    cat: 'farm',
    q: 'How do I get Nitain Extract?',
    a: 'Nitain is mostly bought from the **Nightwave** Cred offerings (the seasonal reward track), and occasionally from resource caches in Sabotage missions and Ghoul bounties. Stock up when it appears in the Nightwave shop. See [Standing & Syndicates](/guides/standing).',
  },
  {
    cat: 'farm',
    q: 'A Smeeta Kavat / resource booster — worth it for farming?',
    a: "Yes. A **Smeeta Kavat**'s Charm buff can double or multiply resource pickups, and a resource/drop-chance booster stacks on top. For any serious resource or Kuva farm, bringing a Smeeta and/or a booster dramatically improves your per-hour rate.",
  },

  // ── Mods & Builds ───────────────────────────────────────────────────
  {
    cat: 'power',
    q: 'How does modding work? Why am I so weak?',
    a: "Mods are where nearly all your power comes from — a fresh weapon with no mods is meant to feel weak. Each item has **mod capacity** (raised by leveling and by an Orokin Reactor/Catalyst), and **polarities** halve a matching mod's cost. Prioritize damage and multishot on weapons, survivability on frames. See [Essential Mods & Survivability](/guides/mods).",
  },
  {
    cat: 'power',
    q: 'What are the must-have mods for a new player?',
    a: 'On guns: **Serration/Hornet Strike** (base damage) and a **multishot** mod (Split Chamber, Barrel Diffusion) roughly triple your damage. On frames: **Vitality** (health) and **Redirection** (shields) for survivability, plus **Streamline/Intensify** for abilities. Grab the elemental damage mods too. Details in the [Mods guide](/guides/mods).',
  },
  {
    cat: 'power',
    q: 'What is shield gating and why does everyone talk about it?',
    a: "Shield gating gives you a brief window of invulnerability when your shields break, so you can survive one-shots in high-level content. Builds that quickly restore shields (Brief Respite, Augur mods, Decaying Dragon Key tricks) chain that window to stay effectively immortal. It's the backbone of Steel Path survivability — see [Essential Mods & Survivability](/guides/mods).",
  },
  {
    cat: 'power',
    q: 'What is Forma and how do I use it?',
    a: "**Forma** adds or changes a polarity on a slot, letting you fit more/stronger mods — at the cost of resetting that item to level 0 to re-level. It's how you finish a serious build. You craft Forma from a blueprint (relics/login/market) using resources. New players don't need Forma until a build is otherwise maxed.",
  },
  {
    cat: 'power',
    q: 'What are Riven mods and are they worth it?',
    a: "Rivens are weapon-specific mods with randomized stats you can re-roll with Kuva. A good riven can massively boost a weapon, but they're an endgame/plat rabbit hole — you need to be **Mastery Rank 8** to use them. Even bad rivens are useful as cheap Endo. See [Riven Mods Explained](/guides/riven) and price yours with the [Riven Value tool](/riven-value).",
  },

  // ── Endgame & Systems ───────────────────────────────────────────────
  {
    cat: 'end',
    q: 'What is the Steel Path and how do I unlock it?',
    a: 'Steel Path is a harder version of the whole star chart (enemies +100 levels with much more health/armor/shields) that you unlock by **clearing the normal star chart**. It gives bonus rewards and **Steel Essence**, which buys incarnon adapters, arcanes, kuva and more from Teshin. Read [Steel Path & Steel Essence](/guides/steel-path).',
  },
  {
    cat: 'end',
    q: 'How do I start hunting Eidolons?',
    a: "Eidolons are the giant sentients on the **Plains of Eidolon at night**. You need a decent **Amp** (operator weapon) and a way to strip their shields (like a Volt/Unairu). Start by soloing the first one (the Teralyst) to learn the mechanics, then progress to the full Tridolon. See [Eidolon Hunting](/guides/eidolon).",
  },
  {
    cat: 'end',
    q: 'What is the Helminth system and subsuming?',
    a: "Helminth (unlocked via the **Heart of Deimos** quest) lets you permanently 'subsume' a Warframe to unlock one of its abilities, then inject that ability onto another frame in place of one of its powers. It's a huge buildcrafting tool — popular subsumes add damage buffs, healing or crowd control to frames that lack them. See [Helminth & Subsumes](/guides/helminth).",
  },
  {
    cat: 'end',
    q: 'What are Archon Shards?',
    a: 'Archon Shards are permanent stat boosts (health, ability strength, energy, etc.) you slot into a Warframe via Helminth. You earn them from the weekly **Archon Hunt**. Tauforged shards give a bigger boost. They\'re a top-end power source — see [Archon Shards](/guides/archon-shards).',
  },
  {
    cat: 'end',
    q: 'What is Duviri and do I need to finish quests to play it?',
    a: 'Duviri is an open landscape plus a roguelike mode (the Duviri Experience / Circuit) that is **accessible from the very start of the game** — no prerequisites. The Circuit rewards Warframes and Incarnon weapon adapters weekly, and its Steel Path version is a great endgame reward loop. See [The Duviri Paradox Guide](/guides/duviri).',
  },
  {
    cat: 'end',
    q: 'How do I cap my daily standing and why is it limited?',
    a: 'Your daily standing (reputation) cap is tied to Mastery Rank — roughly **1,000 + 500 × MR** per day, per syndicate. Raising MR is the only way to raise it. Prioritize the syndicates whose rewards you want. See [Standing & Syndicates](/guides/standing).',
  },
]
