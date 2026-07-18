// Warframe Knowledge Center — "Best Builds & Build Planners" guide.
// Companion to /guides/mods: mods.ts teaches the mechanics, this teaches HOW to
// find, copy, theorycraft and vet a finished build using the community planners
// (Overframe + Underframe). Rendered by the shared <GuideArticle>. Tool feature
// claims mirror data/tools.research.json + i18n/messages/communityTools.ts so the
// guide and the /tools directory never disagree. Evergreen-leaning on purpose —
// specific meta mods shift, but the WORKFLOW of using a planner does not.
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
    { num: '8', label: 'mod slots to fill', tone: 'alt' },
    { num: '3–5', label: 'Forma on an endgame build', tone: 'good' },
    { num: 'Free', label: 'to plan on both tools', tone: 'gold' },
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
          text: "That's also why copying a build blindly backfires. A top-voted build might assume a **Riven**, three **arcanes**, a **Helminth** subsume and five **Forma** you don't have yet. Read it as a *destination*, adapt it to what you own today, and Forma toward it over time. This guide is about doing that quickly and safely with the two build tools the community actually uses.",
        },
        {
          type: 'info',
          text: "This is the applied half of the [Essential Mods guide](/guides/mods). If mod capacity, polarities, Forma or the damage buckets are still fuzzy, read that first — everything below assumes you know what Serration, a potato and a matching polarity do.",
        },
      ],
    },
    {
      id: 'build-skeleton',
      title: 'The universal build skeleton (before you open any tool)',
      blocks: [
        {
          type: 'p',
          text: "Almost every good build is a variation on the same skeleton. Learn it once and you can read — and sanity-check — any build a tool hands you.",
        },
        {
          type: 'table',
          table: {
            columns: ['Item', 'Non-negotiable core', 'Flex slots'],
            rows: [
              ['Warframe', 'Vitality/shield-gating survivability + your **two priority ability stats** (of Strength / Duration / Range / Efficiency)', 'Adaptation, Rolling Guard, an Exilus utility mod, an Aura, a Helminth subsume'],
              ['Guns', 'Base damage → multishot → crit chance + crit damage', 'Two elements tuned to the faction, status/dual-stat mods, Galvanized mods, a Riven'],
              ['Melee', 'Base damage (Pressure Point) → crit (Blood Rush) → Condition Overload', 'Weeping Wounds, attack speed, Primed Reach, a Stance, an element'],
            ],
            note: 'The rule underneath it all: mods in the same damage bucket ADD, different buckets MULTIPLY — so you spread across base/multishot/crit/elements instead of stacking one. Full breakdown lives in the [Mods guide](/guides/mods).',
          },
        },
        {
          type: 'p',
          text: "A build tool's job is to help you fill the **flex slots** intelligently — pick the elements for tonight's mission, decide crit vs status, and see the DPS math without doing it by hand. It does **not** replace knowing the skeleton; it's a faster way to finish it.",
        },
      ],
    },
    {
      id: 'the-two-planners',
      title: 'The two build planners worth using: Overframe & Underframe',
      blocks: [
        {
          type: 'p',
          text: "You do not need to buildcraft from a blank arsenal. Two free web tools cover the whole workflow: **[Overframe](/tools/overframe)** to *browse and copy* what the community already made, and **[Underframe](/tools/underframe)** to *simulate and optimise* when you want to min-max. They complement each other — most players use Overframe to start and Underframe to refine.",
        },
        {
          type: 'table',
          table: {
            columns: ['', 'Overframe (overframe.gg)', 'Underframe (underframe.site)'],
            rows: [
              ['What it is', 'The largest community build **database** + in-browser arsenal builder', 'A deep DPS **simulator** + auto-build optimiser'],
              ['Best for', 'Finding a ready-made build for any frame/weapon/companion fast', 'Theorycrafting, comparing weapons, squeezing out the last 10%'],
              ['Killer feature', 'Community builds with votes, tier lists, and Player Sync (imports your arsenal)', 'Combat sim vs scaled target dummies + an ML auto-build that mods for you'],
              ['Also has', 'Item/mod reference, build guides, optional Overwolf overlay app', 'Riven creation & auto-roll, AoE layout editor, buff-partner linking, share links'],
              ['Watch out for', 'Vote-aggregated rankings lag behind reworks — read builds critically', 'Sim numbers are a model, not the live game; small community, verify claims'],
            ],
            note: 'Both are browser-based, free, need no game login, and read no game memory — they are safe by DE\'s standards (see the write-ups on [Overframe](/tools/overframe) and [Underframe](/tools/underframe) in the tool directory).',
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
              h: 'Import your arsenal with Player Sync (optional)',
              p: "Overframe\'s optional Overwolf desktop app can auto-import your real arsenal via your public Warframe profile, so the builder greys out mods you don\'t own. It reads profile data, not game memory — it\'s the DE-sanctioned overlay route, not an injector.",
            },
            {
              h: 'Adapt, don\'t copy blindly',
              p: "Swap any mod you don\'t have for the closest equivalent (a normal mod for its Primed version, a spare element for the exact meta one). A 90%-complete version of a great build still clears the star chart — fill the gaps as you farm.",
            },
            {
              h: 'Copy the polarities, then Forma toward it',
              p: "Note the build\'s polarities and Forma your keeper item to match, so the full loadout fits into 60 capacity. Do this last — Forma resets the item to rank 0. See the Forma section of the [Mods guide](/guides/mods).",
            },
          ],
        },
        {
          type: 'warn',
          text: "Overframe\'s community **tier lists** and some top builds are ranked by **votes accumulated over years**, so a frame or weapon that was strong long ago keeps a high score while a recent rework lags behind what it actually does today. Treat the ranking as a rough starting point, not gospel — the [Tier List guide](/guides/tier-list) explains exactly how this vote-lag distorts the list.",
        },
      ],
    },
    {
      id: 'using-underframe',
      title: 'How to use Underframe well',
      blocks: [
        {
          type: 'p',
          text: "Underframe is the theorycrafting bench. Where Overframe shows you *a* build, Underframe lets you **prove which build is actually better** by simulating damage against a customisable enemy — then it can even mod the weapon for you.",
        },
        {
          type: 'list',
          items: [
            "**DPS combat simulation** — fire your build at a target dummy with adjustable faction, level scaling, armour, headshots and status, and read the real time-to-kill instead of a raw stat sheet. This is how you settle 'is this weapon actually good on Steel Path?'.",
            "**Auto-build optimiser** — hand it a weapon and it searches mod combinations for the highest score, with toggles to weight what you care about (crit vs status, sustained vs burst). A fast way to get a strong baseline you then hand-tune.",
            "**Riven tooling** — create and auto-roll Riven stats to see whether a Riven is worth chasing for a given weapon before you spend Kuva. Pair it with our [Riven Value estimator](/riven-value) for the trade side.",
            "**Buff-partner linking & AoE editor** — model a squad buff (a linked Warframe\'s ability) applying to your weapon, or lay out area-of-effect coverage for explosive weapons.",
            "**Share & import** — export any build as a snapshot link to send to a friend or import one they send you.",
          ],
        },
        {
          type: 'info',
          text: "Underframe is deliberately deeper than a plain build sharer, which makes it best for **min-maxers** comparing options. It has a small community and little public review footprint, so treat a surprising sim result as a hypothesis to confirm in-game or against the [wiki](https://wiki.warframe.com/), not a final verdict — a simulator is a model of the game, not the game.",
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
            { h: '5 · Cross-check a recent source', p: "Confirm anything surprising against a current creator video or the [wiki](https://wiki.warframe.com/) — the game gets balance passes, and tools lag patches. See vetted creators on our [Creators page](/creators)." },
            { h: '6 · Potato, Forma and go', p: "Apply a Reactor/Catalyst, Forma the polarities to fit, re-level, and take it out. Forma is always the last step because it resets rank." },
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
            "**Stale date.** A build from several major updates ago may pre-date a rework, a mod nerf/buff, or the current damage model. Prefer recent builds; verify old ones.",
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
          text: "Planners are the fastest route, but they aren\'t the only good source. Round out your buildcrafting with:",
        },
        {
          type: 'links',
          links: [
            { label: 'The full tool directory', to: '/tools', icon: 'toolbox', note: 'Overframe, Underframe, the wiki, market & riven tools — all vetted' },
            { label: 'WARFRAME Wiki', href: 'https://wiki.warframe.com/', icon: 'book-open-page-variant-outline', note: 'Exact mod values, build math and mechanics — the source of truth' },
            { label: 'Creators worth following', to: '/creators', icon: 'youtube', note: 'Buildcrafters and tier-list makers who explain the why' },
            { label: 'r/Warframe', href: 'https://reddit.com/r/Warframe/', icon: 'reddit', note: 'Ask for a build, get current community consensus' },
          ],
        },
        {
          type: 'info',
          text: "Buildcrafting also depends on the systems that feed it: [Helminth](/guides/helminth) subsumes, [Arcanes](/guides/arcanes), [Rivens](/guides/riven) and [Archon Shards](/guides/archon-shards) are the flex layers that separate a good build from a great one. Learn the mods first — then the tools make the rest fast.",
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
      a: "Overframe (overframe.gg) is the largest community build database — you can search any frame, weapon or companion, browse community builds with votes, and use its in-browser arsenal builder. It's a great starting point, but its tier lists and some rankings are vote-aggregated over years, so recently reworked gear can be ranked below what it actually does today. Use it as a rough guide and cross-check dates and requirements. See the [tier list guide](/guides/tier-list) for the full caveat.",
    },
    {
      q: 'Overframe vs Underframe — which should I use?',
      a: "Use both for different jobs. Overframe is a build database — best for quickly finding and copying a community build. Underframe (underframe.site) is a DPS simulator with an auto-build optimiser and Riven tooling — best for theorycrafting, comparing two weapons, and min-maxing the last 10%. The common workflow is: find a template on Overframe, then simulate and refine it on Underframe.",
    },
    {
      q: 'How do I import my own arsenal into a build planner?',
      a: "Overframe's optional Overwolf desktop app has a Player Sync feature that auto-imports your arsenal from your public Warframe profile, so the builder can grey out mods you don't own. It reads public profile data through DE's sanctioned overlay framework, not game memory, so it doesn't put your account at risk the way injection cheats would. Underframe lets you build and import/export via share links rather than syncing your account.",
    },
    {
      q: 'Do I need Forma, Rivens and arcanes to use these builds?',
      a: "Not to start. Most top builds assume several Forma plus Rivens, arcanes, Umbral/Primed mods and a Helminth subsume — that's the finished destination, not the entry price. Build the version with what you own, swap in equivalents for anything missing, and a 90%-complete build still clears the entire star chart. Forma and Rivens are the last min-max layer, not the first step.",
    },
    {
      q: 'Can I trust an auto-build optimiser?',
      a: "Underframe's auto-build gives you a strong, math-backed baseline fast, which is genuinely useful. But it optimises for a score in a simulation, so it can over-value stats that matter less in live play (or ignore quality-of-life and survivability). Use its output as a starting draft, then hand-tune for how you actually play and confirm anything surprising in-game or on the [wiki](https://wiki.warframe.com/).",
    },
  ],
  videos: [
    { id: 'ct2pfAonGXY', title: 'Complete Warframe Modding Guide 2025: Everything You Need to Know!', channel: 'Zefā' },
  ],
  sources: [
    { label: 'Overframe — community builds & arsenal builder', href: 'https://overframe.gg/' },
    { label: 'Underframe — DPS simulator & auto-build', href: 'https://www.underframe.site/' },
    { label: 'Warframe Wiki — Mods, Damage & Forma', href: 'https://wiki.warframe.com/w/Mods' },
  ],
  related: [
    { label: 'Essential Mods & Survivability', to: '/guides/mods', icon: 'cog-outline', note: 'The mechanics every build is built on' },
    { label: 'Tier List — How to Read It', to: '/guides/tier-list', icon: 'format-list-numbered', note: "Why Overframe's rankings lag reworks" },
    { label: 'Helminth & Subsumes', to: '/guides/helminth', icon: 'dna', note: 'The flex ability layer on top of mods' },
    { label: 'Arcanes Guide', to: '/guides/arcanes', icon: 'shimmer', note: 'The survivability/damage layer above mods' },
    { label: 'Tool Vault', to: '/tools', icon: 'toolbox', note: 'Overframe, Underframe & every vetted tool' },
    { label: 'Riven Value Estimator', to: '/riven-value', icon: 'cash', note: 'Price a Riven before you build around it' },
  ],
  updated: '2026-07-18',
}

export default guide
