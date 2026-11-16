// Warframe Knowledge Center — "Best Builds & Build Planners" guide.
// Companion to /guides/mods: mods.ts teaches the mechanics, this teaches HOW to
// find, copy, theorycraft and vet a finished build using the community planners
// (Overframe + Underframe). Rendered by the shared <GuideArticle>. Tool features
// are checked against the planners' public pages. Evergreen-leaning on purpose —
// specific meta mods shift, so current mechanics and model limits are explicit.
// English text reviewed 2026-11-16; video availability checked, not watched.
import type { Guide } from './types'

const guide: Guide = {
  slug: 'builds',
  eyebrow: 'Knowledge Center · Systems & Builds',
  title: 'Best Builds & Build Planners',
  lede: "The 'best build' isn't a secret list — it's the loadout that clears what you're doing with the mods you actually own. Learn to read, copy and pressure-test builds with the community planners (Overframe & Underframe) instead of guessing.",
  category: 'systems',
  readMins: 12,
  stats: [
    { num: '2', label: 'featured build planners', tone: 'gold' },
    { num: '8', label: "standard Warframe Mod slots", tone: 'alt' },
  ],
  sections: [
    {
      id: 'what-best-means',
      title: "There is no single 'best build' — only the right one for the job",
      blocks: [
        {
          type: 'p',
          text: "New players hunt for *the* best build for a frame the way they'd look up a cheat code. It doesn't exist. A build is **best relative to a goal**: a Steel Path survival build, an Eidolon damage build, a fast-farming speed build and a spy-mission stealth build for the *same* Warframe look nothing alike. Decide what you're doing first, then find the build that serves it.",
        },
        {
          type: 'p',
          text: "That's also why copying a build blindly backfires. A shared build might assume a **Riven**, specific **arcanes**, a **Helminth** subsume and several **Forma** you don't have yet. Read it as a *destination*, adapt it to what you own today, and Forma toward it over time. The planners below can help you compare those choices before investing.",
        },
        {
          type: 'info',
          text: "This is the applied half of the [Essential Mods guide](/guides/mods). If mod capacity, polarities, Forma or the damage buckets are still fuzzy, read that first — everything below assumes you know what Serration, a potato and a matching polarity do.",
        },
      ],
    },
    {
      id: 'build-skeleton',
      title: "A build checklist (before you open any tool)",
      blocks: [
        {
          type: 'p',
          text: "Start with the equipment’s strengths and the mission you want to complete. These checks help you read a shared build; they are not mandatory Mod combinations.",
        },
        {
          type: 'table',
          table: {
            columns: ['Item', "What to check first", "Options to evaluate"],
            rows: [
              ['Warframe', "Choose survivability that fits the Warframe, then prioritize the ability stats its kit needs.", 'Adaptation, Rolling Guard, an Exilus utility mod, an Aura, a Helminth subsume'],
              ['Guns', "Check damage, multishot, crit and status against the weapon’s stats and firing mode.", 'Two elements tuned to the faction, status/dual-stat mods, Galvanized mods, a Riven'],
              ['Melee', "Check attack speed, range, crit and status for the attacks you plan to use.", 'Weeping Wounds, attack speed, Primed Reach, a Stance, an element'],
            ],
            note: "Check which bonuses affect the same stat and which require a trigger. Compare the complete setup, including abilities and Arcanes, rather than treating every listed bonus as an independent multiplier. The [Mods guide](/guides/mods) covers the underlying systems.",
          },
        },
        {
          type: 'p',
          text: "A build tool helps you compare Mod choices and check capacity. Use it to explore elements, crit, status and utility, then test the result in the mission you intend to play.",
        },
      ],
    },
    {
      id: 'the-two-planners',
      title: "Two build planners: Overframe & Underframe",
      blocks: [
        {
          type: 'p',
          text: "You do not need to buildcraft from a blank arsenal. **[Overframe](/tools/overframe)** helps you *browse and copy* community builds, while **[Underframe](/tools/underframe)** adds *simulation and optimisation*. One useful workflow is to find a reference, adapt it, then compare the result before spending resources.",
        },
        {
          type: 'table',
          table: {
            columns: ['', 'Overframe (overframe.gg)', 'Underframe (underframe.site)'],
            rows: [
              ['What it is', "Community build **database** + in-browser arsenal builder", 'A deep DPS **simulator** + auto-build optimiser'],
              ['Best for', "Finding a community reference build for your item", "Theorycrafting and comparing modeled performance"],
              ['Killer feature', "Community builds, tier lists and optional Player Sync build imports", "Configurable target simulation + Auto Build settings"],
              ['Also has', 'Item/mod reference, build guides, optional Overwolf overlay app', 'Riven creation & auto-roll, AoE layout editor, buff-partner linking, share links'],
              ['Watch out for', 'Vote-aggregated rankings lag behind reworks — read builds critically', "Sim results depend on assumptions; confirm them in-game"],
            ],
            note: "You can plan builds in a browser. Optional desktop companion apps are a separate choice: [DE’s third-party-software policy](https://forums.warframe.com/topic/1383123-third-party-software-usage/) also applies to Overwolf and associated apps, and does not guarantee risk-free use.",
          },
        },
      ],
    },
    {
      id: 'using-overframe',
      title: 'How to use Overframe well',
      blocks: [
        {
          type: 'p',
          text: "Overframe is where you go for a **starting point**. Search a frame or weapon, browse what people have already built, and copy the one that fits your goal and your inventory. The trick is filtering the good from the outdated.",
        },
        {
          type: 'steps',
          ordered: true,
          steps: [
            {
              h: 'Search the item, then read the top builds',
              p: "Type the frame, primary, secondary, melee or companion name. Open a few of the highest-rated builds and read the author's notes — a good build says what it\'s *for* (Steel Path, Eidolon, farming) and what it needs.",
            },
            {
              h: 'Check the date and the requirements before you trust the votes',
              p: "Sort or filter by recent, not just all-time score. Then scan the build for things you may not own yet: a **Riven**, **arcanes**, a **Helminth** subsume, **Umbral/Primed** mods, and the **Forma count**. Those are the cost of the build, not free.",
            },
            {
              h: "Check Player Sync before importing (optional)",
              p: "Player Sync currently uses the Overframe app on Overwolf while you play, signed in to your Overframe account. It imports loadouts with their equipped Mods; verify them against your Arsenal. Looking up other players by name is no longer available. You can plan manually in the browser without syncing; do not assume a loadout import includes your complete inventory or detects every missing Mod.",
            },
            {
              h: 'Adapt, don\'t copy blindly',
              p: "Use an available alternative, such as a normal Mod in place of its Primed version, then recheck capacity and the role of that slot. A missing Mod may break an interaction the build depends on, so test each substitution rather than assuming a percentage-complete build will clear every mission.",
            },
            {
              h: "Check capacity before choosing polarities",
              p: "Check the item’s actual capacity in the Arsenal, including its rank, Reactor/Catalyst and applicable Aura or Stance. Forma only the slots needed for your planned Mods, and check your other configurations first. Forma resets rank; the [Forma guide](/guides/forma) explains crafting and polarity planning.",
            },
          ],
        },
        {
          type: 'warn',
          text: "Community votes show popularity, not whether a build still works after the latest patch. An older high-scoring build can miss a rework or balance change. Check the author’s date, requirements and explanation, and use the [Tier List guide](/guides/tier-list) for more on interpreting rankings.",
        },
      ],
    },
    {
      id: 'using-underframe',
      title: 'How to use Underframe well',
      blocks: [
        {
          type: 'p',
          text: "Underframe lets you **compare modeled performance** against a configurable target. Keep the target and buffs the same when comparing two builds; confirm the result in actual missions.",
        },
        {
          type: 'list',
          items: [
            "**DPS combat simulation** — configure the target, level, defenses and headshot assumptions, then compare estimated DPS and time-to-kill. These are model outputs, not measured mission results.",
            "**Auto-build optimiser** — set the objective, allowed Mods and Forma budget before generating a candidate. Check its assumptions and test it in-game.",
            "**Riven tooling** — model candidate stats before spending Kuva. Check current in-game values because planner controls can lag patches. Our [Riven Value estimator](/riven-value) offers a separate market estimate.",
            "**Buff-partner linking & AoE editor** — model a squad buff (a linked Warframe\'s ability) applying to your weapon, or lay out area-of-effect coverage for explosive weapons.",
            "**Share & import** — export any build as a snapshot link to send to a friend or import one they send you.",
          ],
        },
        {
          type: 'info',
          text: "Treat a surprising simulation result as a hypothesis to confirm in-game or against current patch notes and the [wiki](https://wiki.warframe.com/). A simulator is a model of the game, not the game.",
        },
      ],
    },
    {
      id: 'repeatable-workflow',
      title: 'A repeatable workflow to build anything',
      blocks: [
        {
          type: 'p',
          text: "Put the two tools together and you have a reliable loop for turning any frame or weapon into a finished, mission-ready build:",
        },
        {
          type: 'steps',
          ordered: true,
          steps: [
            { h: '1 · Define the goal', p: "Name the activity: Steel Path survival, Eidolon burst, fast farming, a specific boss. The goal decides survivability vs damage and which elements you want." },
            { h: '2 · Find a reference on Overframe', p: "Grab a recent, well-explained build for your item as the template. Note its mods, arcanes, Helminth and Forma count." },
            { h: '3 · Sanity-check against your inventory', p: "Cross out what you don\'t own and slot equivalents. If the build leans on a Riven or arcanes you lack, build the version without them first." },
            { h: '4 · Simulate or optimise on Underframe', p: "Drop your adapted build into Underframe, sim it against the enemy you\'ll actually fight, and let the auto-build suggest tweaks. Compare two weapons here before committing Forma to one." },
            { h: '5 · Cross-check a recent source', p: "Confirm surprising mechanics against [official patch notes](https://www.warframe.com/en/patch-notes), then compare the setup in-game. Community guides and the [wiki](https://wiki.warframe.com/) can help explain interactions, but check their dates too. Our [Creators page](/creators) lists video sources." },
            { h: '6 · Potato, Forma and go', p: "Install the capacity upgrades you need, then add only the polarities required for the planned setup. Re-level and test after Forma; stop when the build fits and performs as intended." },
          ],
        },
        {
          type: 'tip',
          text: "Don\'t Forma or potato leveling fodder you\'ll sell for Mastery — run this full loop only for **keepers**: your main frames and the weapons you\'ll actually take into the [Steel Path](/guides/steel-path).",
        },
      ],
    },
    {
      id: 'reading-builds-critically',
      title: 'Red flags: how to read a shared build critically',
      blocks: [
        {
          type: 'p',
          text: "Any tool that lets strangers post builds will surface some bad ones. Before you sink Forma into a copied loadout, run this checklist.",
        },
        {
          type: 'list',
          items: [
            "**Stale mechanics.** Check the current patch, not only the posting date. [Hotfix 44.1.3](https://www.warframe.com/en/patch-notes/pc/44-1-3) removed weapon-specific Riven Dispositions and capped Ammo Efficiency at 75%; effects explicitly granting Infinite Ammo are separate. Retest builds that depend on the old rules.",
            "**Hidden requirements.** Count the **Forma**, and flag every **Riven, arcane, Umbral/Primed mod and Helminth subsume**. That's the true cost — a '5 Forma + Riven' build isn\'t a beginner build.",
            "**Vote-farmed ranking.** A high score can mean 'popular for years', not 'best now'. This is the classic [Overframe tier-list](/guides/tier-list) trap.",
            "**Meme / one-shot builds.** Some top builds are showcase gimmicks (huge single-target burst, zero survivability) that fall apart in a real endless run. Match the build to how you actually play.",
            "**Off-goal builds.** A gorgeous Eidolon build is wrong for Steel Path survival. Re-read the author\'s stated purpose against yours.",
            "**Unownable-first.** If step one is 'get a god-roll Riven', it\'s an endgame min-max target, not a plan for tonight. Build the base version and use the [Endo](/guides/endo) and [Riven Value](/riven-value) tools to decide what\'s worth chasing.",
          ],
        },
        {
          type: 'quote',
          text: "A shared build is someone else\'s answer to a question you might not be asking. Read the question first, then borrow the answer.",
          cite: 'The buildcrafting mindset',
        },
      ],
    },
    {
      id: 'where-else',
      title: 'Where else builds come from',
      blocks: [
        {
          type: 'p',
          text: "Planners are one way to find a starting point. You can also compare explanations from:",
        },
        {
          type: 'links',
          links: [
            { label: 'The full tool directory', to: '/tools', icon: 'toolbox', note: "Compare build planners, reference sites and market tools" },
            { label: 'WARFRAME Wiki', href: 'https://wiki.warframe.com/', icon: 'book-open-page-variant-outline', note: "Community reference for Mod values and mechanics; check current patch notes" },
            { label: 'Creators worth following', to: '/creators', icon: 'youtube', note: 'Buildcrafters and tier-list makers who explain the why' },
            { label: 'r/Warframe', href: 'https://reddit.com/r/Warframe/', icon: 'reddit', note: "Discuss a specific build and compare the reasoning in replies" },
          ],
        },
        {
          type: 'info',
          text: "Buildcrafting also depends on the systems that feed it: [Helminth](/guides/helminth) subsumes, [Arcanes](/guides/arcanes), [Rivens](/guides/riven) and [Archon Shards](/guides/archon-shards) are the flex layers that separate a good build from a great one. Learn the mods first — then the tools make the rest fast.",
        },
        {
          type: 'info',
          title: 'About the video below',
          text: 'The 2025 video is a general modding reference and predates later balance changes. Check current patch notes before copying its values or loadouts; the written guide covers the changes noted above.',
        },
      ],
    },
  ],
  faqs: [
    {
      q: 'What is the best build in Warframe?',
      a: "There isn't one universal best build — the best build depends on the activity. A Steel Path survival build, an Eidolon damage build and a fast-farming build for the same frame are completely different. Decide your goal first, then find a build that serves it (browse [Overframe](/tools/overframe) for a starting point) and adapt it to the mods you own. The mechanics behind every build are in the [Mods guide](/guides/mods).",
    },
    {
      q: 'What is Overframe and is it reliable?',
      a: "Overframe is a community build database and browser planner. It can provide a starting point, but votes do not verify that a build matches the current patch or your inventory. Check its date, requirements and explanation, then test the adapted setup. See the [tier list guide](/guides/tier-list) for more on interpreting rankings.",
    },
    {
      q: 'Overframe vs Underframe — which should I use?',
      a: "Use Overframe to find a community reference and Underframe to compare modeled options. You can use either independently. A useful workflow is to adapt a build to your inventory, compare it under consistent assumptions, then test it in-game.",
    },
    {
      q: 'How do I import my own arsenal into a build planner?',
      a: "Overframe’s [Player Sync](https://overframe.gg/players/) currently requires its Overwolf app running while you play, signed in to your Overframe account. It syncs loadouts and their equipped Mods; verify the result in your Arsenal. You can plan manually in the browser without installing the companion app. [DE’s third-party-software policy](https://forums.warframe.com/topic/1383123-third-party-software-usage/) applies to Overwolf and associated apps, and does not guarantee risk-free use.",
    },
    {
      q: 'Do I need Forma, Rivens and arcanes to use these builds?',
      a: "You can plan with the Mods you already own. Rivens, Arcanes and Helminth may be part of a particular build, but are not universal entry requirements. The Forma count depends on capacity, Mod ranks, existing polarities and the configurations you want to keep. Test substitutions; a missing interaction can matter more than how many slots are filled.",
    },
    {
      q: 'Can I trust an auto-build optimiser?',
      a: "Use an optimiser’s result as a candidate, not a guarantee. Its score depends on the target, buffs, allowed Mods and objective you selected. Compare those assumptions with your mission, check current mechanics, and test handling, survivability and performance in-game.",
    },
  ],
  videos: [
    { id: 'ct2pfAonGXY', title: 'Complete Warframe Modding Guide 2025: Everything You Need to Know!', channel: 'Zefā' },
  ],
  sources: [
    { label: 'Overframe — community builds & arsenal builder', href: 'https://overframe.gg/' },
    { label: 'Underframe — DPS simulator & auto-build', href: 'https://www.underframe.site/' },
    { label: 'Overframe — Player Sync', href: 'https://overframe.gg/players/' },
    { label: 'Digital Extremes — third-party software policy', href: 'https://forums.warframe.com/topic/1383123-third-party-software-usage/' },
    { label: 'Digital Extremes — Mod capacity and polarization', href: 'https://www.warframe.com/en/news/guia-de-mods' },
    { label: 'Update 38.5 — capacity and Omni Forma changes', href: 'https://www.warframe.com/en/patch-notes/pc/38-5-0' },
    { label: 'Hotfix 44.1.3 — Riven and Ammo Efficiency changes', href: 'https://www.warframe.com/en/patch-notes/pc/44-1-3' },
    { label: 'Warframe Support — Polarization and Forma FAQ', href: 'https://support.warframe.com/hc/en-us/articles/200240380-Polarization-and-Forma-FAQ' },
    { label: 'Community reference — Warframe Wiki Mods', href: 'https://wiki.warframe.com/w/Mods' },
  ],
  related: [
    { label: 'Essential Mods & Survivability', to: '/guides/mods', icon: 'cog-outline', note: 'The mechanics every build is built on' },
    { label: 'Tier List — How to Read It', to: '/guides/tier-list', icon: 'format-list-numbered', note: "Why Overframe's rankings lag reworks" },
    { label: 'Helminth & Subsumes', to: '/guides/helminth', icon: 'dna', note: 'The flex ability layer on top of mods' },
    { label: 'Arcanes Guide', to: '/guides/arcanes', icon: 'shimmer', note: 'The survivability/damage layer above mods' },
    { label: 'Tool Vault', to: '/tools', icon: 'toolbox', note: "Compare Overframe, Underframe and other community tools" },
    { label: 'Riven Value Estimator', to: '/riven-value', icon: 'cash', note: "Compare a market estimate before investing in a Riven" },
  ],
  updated: '2026-11-16',
}

export default guide
