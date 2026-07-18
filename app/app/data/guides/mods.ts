// Auto-generated Warframe Knowledge Center guide content.
// Drafted grounded in r/Warframe research (reddit API) + the subreddit wiki FAQ,
// then adversarially fact-checked for evergreen accuracy. Embedded video ids were
// verified live via YouTube oEmbed. Edit freely — this is the single source for
// the /guides/mods page (rendered by <GuideArticle>).
import type { Guide } from './types'

const guide: Guide = {
  "slug": "mods",
  "eyebrow": "Knowledge Center · Mods & Survivability",
  "title": "Essential Mods & Survivability",
  "lede": "Your Warframe and weapons are almost naked out of the box — mods are the other 90% of your power. Master mod capacity, the damage-multiplier model, and shield-gating, and any frame can survive the Steel Path.",
  "category": "systems",
  "readMins": 12,
  "stats": [
    {
      "num": "60",
      "label": "max capacity w/ a potato",
      "tone": "gold"
    },
    {
      "num": "4",
      "label": "warframe ability stats",
      "tone": "alt"
    },
    {
      "num": "6",
      "label": "combined damage elements",
      "tone": "good"
    },
    {
      "num": "2.25s",
      "label": "max shield-gate i-frames",
      "tone": "gold"
    }
  ],
  "sections": [
    {
      "id": "how-modding-works",
      "title": "Mods are your build — everything else is a chassis",
      "blocks": [
        {
          "type": "p",
          "text": "A fresh Warframe or weapon is a shell. **Mods** are the cards you slot into it that add damage, health, abilities, crit, elements, and utility — they are where nearly all of your power comes from. Learning to mod well matters far more than which frame you own."
        },
        {
          "type": "p",
          "text": "Every item has **mod slots** and a **capacity** budget. Each mod has a **drain** cost, and the total drain of your equipped mods can't exceed your capacity. Capacity equals the item's **rank**: a rank-30 Warframe or weapon has **30 capacity**. Rank a mod up (with Endo and credits) and it gets stronger — but also drains more."
        },
        {
          "type": "kv",
          "kv": [
            {
              "k": "Warframe slots",
              "v": "8 mod + 1 Aura + 1 Exilus"
            },
            {
              "k": "Weapon slots",
              "v": "8 mod + 1 Exilus (Stance slot on melee)"
            },
            {
              "k": "Base max capacity",
              "v": "30 at rank 30 (60 with a Reactor/Catalyst)"
            },
            {
              "k": "Rank mods up with",
              "v": "Endo + credits at the mod screen"
            },
            {
              "k": "Where mods drop",
              "v": "Enemies, bosses, syndicates, Transmutation, quests"
            }
          ]
        },
        {
          "type": "info",
          "text": "Don't hoard duplicate mods blindly — but **never sell your only copy** of a core mod like Serration, Vitality, or a Primed mod. When in doubt, keep one and dissolve the rest for [Endo](/guides/endo)."
        }
      ]
    },
    {
      "id": "capacity-potatoes-forma",
      "title": "Capacity, potatoes, polarities & Forma",
      "blocks": [
        {
          "type": "p",
          "text": "Three tools let you fit a bigger build than raw capacity allows: **Orokin Reactors/Catalysts**, **polarities**, and **Forma**. Understanding them is the single biggest 'my build won't fit' fix for new players."
        },
        {
          "type": "p",
          "text": "An **Orokin Reactor** (Warframes, companions, Archwing) or **Orokin Catalyst** (weapons) — nicknamed a **'potato'** — permanently **doubles** an item's capacity from 30 to **60**. Every serious build assumes you've applied one. You get them free from Nightwave, invasions, Baro Ki'Teer, and events, or with platinum."
        },
        {
          "type": "p",
          "text": "**Polarities** are the little symbols on slots (Vazarin `D`, Madurai `V`, Naramon `—`, and others). When a mod's polarity **matches** the slot, its drain is **roughly halved** — that's how endgame builds cram 10 expensive mods into 60 capacity. A **wrong**-polarity slot costs slightly *more*; an empty slot costs full drain."
        },
        {
          "type": "p",
          "text": "**Forma** is a resource you build from a blueprint (Relic reward, or bought) that **adds or changes a polarity** on one slot. The catch: applying Forma **resets the item to rank 0**, so you re-level it. Veterans Forma a good weapon 3–5 times to fit a full build. Variants exist: **Aura Forma** (auto-matches any aura), **Umbral Forma** (for Umbral mods), and Stance/Exilus Forma."
        },
        {
          "type": "tip",
          "text": "The **Aura slot** (Warframes) and **Stance slot** (melee) work in *reverse* — they **add** capacity instead of draining it, and a **matching polarity doubles** that bonus. Always match your aura's polarity: a good aura like Corrosive Projection or Growing Power can hand you back double-digit capacity for free."
        },
        {
          "type": "warn",
          "text": "Don't potato or heavily Forma leveling fodder you'll sell for Mastery. Save Reactors, Catalysts, and Forma for keepers — your main frames and the weapons you'll actually take into [Steel Path](/guides/steel-path)."
        }
      ]
    },
    {
      "id": "damage-model",
      "title": "The damage-multiplier mental model",
      "blocks": [
        {
          "type": "p",
          "text": "Weapon damage isn't one number you pump — it's a **product of separate buckets**. Mods within the same bucket **add** together; different buckets **multiply**. That one rule dictates every good weapon build."
        },
        {
          "type": "p",
          "text": "Roughly: `Base × Multishot × Crit × (Elements + Physical) × Faction`. Piling a second mod into a bucket you've already filled gives diminishing returns; opening a **new** bucket multiplies everything. That's why you don't stack two base-damage mods — you spread into **base damage, multishot, crit, and elements** instead."
        },
        {
          "type": "list",
          "items": [
            "**Base damage** — Serration (rifle), Hornet Strike (pistol), Pressure Point (melee). The foundation, but only one bucket.",
            "**Multishot** — Split Chamber (rifle), Barrel Diffusion (pistol). Fires extra pellets/projectiles: nearly a second damage mod on top of base.",
            "**Critical** — crit *chance* (Point Strike) plus crit *damage* (Vital Sense) multiply together; past 100% chance you get stronger orange/red crits.",
            "**Elements** — the big customizable bucket. Two base elements combine into a stronger one (below), and you pick elements to match what you're shooting."
          ]
        },
        {
          "type": "p",
          "text": "**Elements** let you tune your damage to what you're fighting — mostly through their **status effects** and each faction's weaknesses. The four base elements — **Heat, Cold, Electricity, Toxin** — pair up (in mod-screen order) into six **combined elements**:"
        },
        {
          "type": "table",
          "table": {
            "columns": [
              "Combine",
              "→ Result",
              "What it does / when to use"
            ],
            "rows": [
              [
                "Toxin + Cold",
                "Viral",
                "Status amplifies all Health damage — the default all-purpose DPS pick"
              ],
              [
                "Heat + Toxin",
                "Gas",
                "Spreads a damaging cloud — strong against packed groups"
              ],
              [
                "Cold + Electricity",
                "Magnetic",
                "Status amplifies Shield damage — Corpus and shielded enemies"
              ],
              [
                "Toxin + Electricity",
                "Corrosive",
                "Status strips Armor; also the Grineer faction weakness"
              ],
              [
                "Heat + Electricity",
                "Radiation",
                "Confusion status — makes enemies attack each other (crowd control)"
              ],
              [
                "Heat + Cold",
                "Blast",
                "Explosion + reduced enemy accuracy (defensive)"
              ]
            ],
            "note": "Since the Update 36 (Jade Shadows) damage rework, resistances and bonuses are faction-based — Grineer take extra Corrosive, Corpus take extra Magnetic, and so on — rather than tied to specific health types, but the status effects above still work as described. The current all-purpose Steel Path template is Viral + Heat (Heat also strips armor and adds a burn); Corrosive + Heat stays strong for pure-crit weapons versus Grineer. Order of the two element mods in the slots determines what pairs."
          }
        },
        {
          "type": "info",
          "text": "Status vs crit: some weapons want **status** (dual-stat 60/60 mods, viral procs) and others want **crit**. Check a weapon's crit and status chance before choosing — a high-crit rifle wants Point Strike + Vital Sense; a high-status shotgun wants dual-stat element mods."
        }
      ]
    },
    {
      "id": "warframe-mods",
      "title": "Must-have Warframe mods",
      "blocks": [
        {
          "type": "p",
          "text": "Warframe builds juggle **survivability** and the **four ability stats**: Strength, Duration, Range, Efficiency. You rarely max all four — you tune them to the frame. Learn what each core mod does and you can read any build guide."
        },
        {
          "type": "table",
          "table": {
            "columns": [
              "Mod",
              "What it does",
              "Why it matters"
            ],
            "rows": [
              [
                "Vitality",
                "Large Health boost (~+440% max)",
                "Baseline survivability on almost every frame"
              ],
              [
                "Redirection",
                "Large Shield boost (~+440%)",
                "Feeds shield-gating — or skipped for low-shield builds"
              ],
              [
                "Adaptation",
                "Stacking damage resistance up to 90%",
                "Turns squishy frames Steel-Path-viable as you take hits"
              ],
              [
                "Intensify",
                "+ Ability Strength",
                "Bigger ability numbers (damage, buffs, armor strip)"
              ],
              [
                "Streamline",
                "+ Ability Efficiency",
                "Cast more often, spend less energy"
              ],
              [
                "Stretch",
                "+ Ability Range",
                "Wider auras, CC, and buff bubbles"
              ],
              [
                "(Primed) Continuity",
                "+ Ability Duration",
                "Longer buffs and crowd control"
              ],
              [
                "(Primed) Flow",
                "+ Energy capacity",
                "A bigger pool to spend abilities from"
              ]
            ],
            "note": "Upgrade path: the Umbral set (Umbral Vitality / Intensify / Fiber) replaces the plain versions and adds a set bonus when two or three are equipped — worth the Umbral Forma on your main frames."
          }
        },
        {
          "type": "p",
          "text": "A few more stat mods worth knowing because build guides lean on their trade-offs: **Blind Rage** (big Strength, but costs Efficiency), **Fleeting Expertise** (big Efficiency, but costs Duration), **Overextended** (huge Range, but costs Strength), and **Narrow Minded** (huge Duration, but costs Range). Mixing these 'corrupted' mods is how you push one stat to the extreme."
        },
        {
          "type": "tip",
          "text": "The **Exilus slot** takes utility mods that don't compete with your core build — sprint speed (Rush, Armored Agility), parkour and mobility, or enemy/loot radar. Unlock it with an **Exilus Adapter**. It's free extra value once your core build is locked in."
        }
      ]
    },
    {
      "id": "weapon-mods",
      "title": "Must-have weapon mods, by type",
      "blocks": [
        {
          "type": "p",
          "text": "Every weapon build starts from the same skeleton: fill the four damage buckets, then flex the last slots for elements, status, or utility. Here are the workhorse mods per weapon class."
        },
        {
          "type": "table",
          "table": {
            "columns": [
              "Build role",
              "Primary (rifle)",
              "Secondary (pistol)",
              "Melee"
            ],
            "rows": [
              [
                "Base damage",
                "Serration",
                "Hornet Strike",
                "(Primed) Pressure Point"
              ],
              [
                "Multishot",
                "Split Chamber",
                "Barrel Diffusion / Lethal Torrent",
                "— (use combo instead)"
              ],
              [
                "Crit chance",
                "Point Strike",
                "Pistol Gambit",
                "Blood Rush (scales with combo)"
              ],
              [
                "Crit damage",
                "Vital Sense",
                "Target Cracker",
                "Organ Shatter"
              ],
              [
                "Status / element",
                "+90% element mods, 60/60 duals",
                "+90% element mods",
                "Condition Overload, Weeping Wounds"
              ]
            ],
            "note": "Shotguns swap in Point Blank (base) and Hell's Chamber (multishot). Bows/snipers lean hard on crit. Add dual-stat 60/60 mods when you want status procs over raw crit."
          }
        },
        {
          "type": "p",
          "text": "**Melee plays differently.** Instead of multishot it scales off the **combo counter**: **Blood Rush** turns combo into crit chance and **Weeping Wounds** turns it into status. **Condition Overload** adds damage for every unique status effect on the target — pair it with a status weapon and it becomes one of the biggest melee multipliers in the game. Round out with **Berserker Fury** or **Primed Fury** for attack speed and **Primed Reach** for range."
        },
        {
          "type": "info",
          "text": "Serration maxes around **+165%** base damage and Split Chamber gives a **90%** chance for an extra projectile — but exact values shift with rank and DE tweaks, so confirm the current numbers on the [Warframe wiki](https://wiki.warframe.com/) before you Forma a slot around them. Once you hit endgame, the Galvanized versions (Galvanized Chamber, Galvanized Diffusion, and friends) become the upgrade over the plain base/multishot mods."
        }
      ]
    },
    {
      "id": "shield-gating",
      "title": "Shield-gating: how veterans never die",
      "blocks": [
        {
          "type": "p",
          "text": "The single biggest reason players die in the [Steel Path](/guides/steel-path) isn't 'not enough health' — it's not understanding **shield-gating**. Raw effective health doesn't scale into the late game; **invulnerability windows** do."
        },
        {
          "type": "p",
          "text": "The mechanic: as long as you have **at least 1 shield** when a lethal hit lands, your shields absorb the overkill and break, and breaking them grants a brief **invulnerability window** — the 'gate'. The length **scales with your maximum shields**: a full shield break runs from about **0.33s** on a tiny pool up to roughly **2.25s** on a big one, while re-breaking from a **partially-recharged** shield only gives a short **~0.33s** gate. During that window you can't die."
        },
        {
          "type": "steps",
          "ordered": true,
          "steps": [
            {
              "h": "Keep a shield buffer",
              "p": "You only need 1 shield point to survive a lethal hit. Frames with any shields at all can shield-gate — even Inaros-style tanks benefit from a small pool."
            },
            {
              "h": "Refresh the gate on demand",
              "p": "The gate is useless if it only triggers once. Refill your shields to break them again: cast an ability with Brief Respite (aura) or the Augur set mods, which convert energy spent into instant shields."
            },
            {
              "h": "Go low-shield for consistent re-gating",
              "p": "Catalyzing Shields lowers your max shields so they break and recharge almost instantly, and it guarantees a full ~1.33s gate on every full break no matter how low your shields are — overriding the usual 'low shields = short gate' rule. A Decaying Dragon Key (−shields) sets up a similar 'break fast, recharge fast' loop."
            },
            {
              "h": "Add a panic button",
              "p": "Rolling Guard gives invulnerability and clears status effects on a roll (short cooldown). It resets your shield gate and saves you from status lockouts like Toxin and Slash that bypass shields."
            }
          ]
        },
        {
          "type": "warn",
          "text": "**Toxin damage and Slash bleed procs bypass shields entirely** (and True damage ignores shields and armor alike) — shield-gating won't stop a bleed proc ticking down your health. That's why a status-cleanse (Rolling Guard) and damage resistance (Adaptation) belong on the same build, not shield-gating alone."
        },
        {
          "type": "quote",
          "text": "You don't out-tank endgame Warframe — you become un-hittable. Shield-gate to eat the burst, Rolling Guard to reset it, Adaptation to shave the rest.",
          "cite": "The community shield-gating consensus"
        }
      ]
    },
    {
      "id": "layered-survivability",
      "title": "Layering survivability beyond the gate",
      "blocks": [
        {
          "type": "p",
          "text": "Shield-gating is your burst-protection layer. Stack these on top and even paper-thin frames survive long Steel Path runs. Most builds run two or three of these, not all of them."
        },
        {
          "type": "list",
          "items": [
            "**Adaptation** — stacks up to **90% damage reduction** per damage type as you get hit. The best single survivability mod for frames without built-in defenses.",
            "**Rolling Guard** — invulnerability + full status cleanse on a roll, on a short cooldown. Doubles as a shield-gate reset and a get-out-of-Toxin card.",
            "**Quick Thinking** — when health would hit 0, drains **energy** to keep you alive. A soft second health bar (pair with high energy and shield-gating).",
            "**Primed Sure Footed** — knockdown/stagger immunity (login-reward mod). Being stunlocked is a hidden killer; standing your ground lets you keep casting.",
            "**Arcanes** — [Arcanes](/guides/arcanes) like Arcane Grace, Guardian, or Aegis add health regen, armor, and shield recovery on top of mods for a big survivability spike.",
            "**Aura + Helminth** — a defensive aura (Physique) or a subsumed defensive ability via the [Helminth](/guides/helminth) (e.g., an overguard or damage-reduction skill) can be worth more than any single mod slot."
          ]
        },
        {
          "type": "info",
          "text": "Health-tank vs shield-tank is a real choice. High-armor frames (Rhino, Inaros-style) can favor Vitality + Adaptation + arcanes; low-armor casters lean on shield-gating + Rolling Guard. Match the strategy to the frame, don't copy one build onto everything."
        }
      ]
    },
    {
      "id": "ranking-rivens-next",
      "title": "Ranking mods, Rivens & where to go next",
      "blocks": [
        {
          "type": "p",
          "text": "Mods rank up with **Endo + credits**. Endo comes from Ayatan sculptures, dissolving duplicate mods, and dedicated farms — see the [Endo farming guide](/guides/endo), and use the [Endo / Plat value tool](/endo) to check whether dissolving a mod or riven is worth it. A cheap early move: fully rank your core mods (Serration, Vitality, the four ability stats) before chasing anything exotic."
        },
        {
          "type": "p",
          "text": "**Rivens** are randomized mods with powerful (and sometimes negative) stats, tied to a specific weapon. They're an **endgame min-max layer**, not a beginner tool — a fully-modded weapon comes first, and a good Riven only adds the last 10–30%. Prices swing wildly, so price a roll before you buy or sell with the [Riven value estimator](/riven-value) and read the mechanics in the [Riven guide](/guides/riven)."
        },
        {
          "type": "steps",
          "ordered": true,
          "steps": [
            {
              "h": "Potato and Forma your keepers",
              "p": "Apply a Reactor/Catalyst, then Forma slots to match your build's polarities so everything fits into 60 capacity."
            },
            {
              "h": "Fill the damage buckets",
              "p": "Base + multishot + crit + elements on weapons; survivability + your two priority ability stats on frames."
            },
            {
              "h": "Add a survivability layer",
              "p": "Shield-gating setup or Adaptation + Rolling Guard before you step into Steel Path."
            },
            {
              "h": "Min-max last",
              "p": "Umbral/Primed mods, arcanes, then a Riven only once the base build is complete."
            }
          ]
        },
        {
          "type": "tip",
          "text": "When a build guide lists mods you don't own, slot the closest equivalent (a normal mod instead of its Primed version) and upgrade later. A 90%-complete build clears the entire star chart — you do not need every Primed and Riven to have fun."
        }
      ]
    }
  ],
  "faqs": [
    {
      "q": "What are the best mods for beginners in Warframe?",
      "a": "On weapons: Serration (rifle) / Hornet Strike (pistol) / Pressure Point (melee) for base damage, then a multishot mod (Split Chamber, Barrel Diffusion), then elements. On Warframes: Vitality for health plus the four ability-stat mods — Intensify (Strength), Streamline (Efficiency), Stretch (Range), and Continuity (Duration). Rank them fully with [Endo](/guides/endo) before chasing anything rare."
    },
    {
      "q": "What does an Orokin Reactor or Catalyst (a 'potato') do?",
      "a": "It permanently doubles an item's mod capacity from 30 to 60, which is what lets a full build actually fit. A Reactor goes on Warframes, companions, and Archwing; a Catalyst goes on weapons. You earn them free from Nightwave, invasions, and events (and occasionally from Baro Ki'Teer), or buy them with platinum — save them for gear you'll keep, not Mastery fodder."
    },
    {
      "q": "How do polarities and Forma work?",
      "a": "A mod placed in a slot with a matching polarity symbol costs about half its normal drain, which is how endgame builds fit into 60 capacity. Forma is a resource that adds or changes a polarity on one slot, but it resets the item to rank 0 so you re-level it. Match your Aura and Stance polarities first — those slots add capacity instead of draining it, so a match is doubled free value."
    },
    {
      "q": "What is shield-gating and how do I do it?",
      "a": "When your shields break, you get a brief invulnerability window during which you can't die. Its length scales with your maximum shields — from about 0.33 seconds on a tiny pool up to roughly 2.25 seconds on a big one — while re-breaking from partly-recharged shields gives only ~0.33s. You keep the loop going by refilling and re-breaking shields, usually via Brief Respite or Augur mods (energy spent on abilities becomes shields), plus Rolling Guard as a reset; low-shield builds add Catalyzing Shields to guarantee a full gate every time. It's the main reason experienced players survive the [Steel Path](/guides/steel-path). See a full walkthrough in the shield-gating videos below."
    },
    {
      "q": "Why do I keep dying in Steel Path even with tons of health?",
      "a": "Raw effective health doesn't scale into the late game — enemy damage outpaces it. You need invulnerability layers instead: shield-gating for the burst, Rolling Guard to reset it and cleanse status, and Adaptation for up to 90% damage reduction. Toxin and Slash bypass shields, so a status cleanse is essential, not optional."
    },
    {
      "q": "How do I do more weapon damage — which mod first?",
      "a": "Think in multiplicative buckets: base damage, multishot, crit, and elements each multiply the others, while mods in the same bucket only add. So don't stack two base-damage mods — spread into a base mod, a multishot mod, crit mods, and the right elements (Viral to boost damage to health, Heat or Corrosive for armor). Opening a new bucket beats over-filling an old one."
    },
    {
      "q": "How do I rank up (upgrade) my mods?",
      "a": "Go to the mod screen and fuse the mod using Endo plus credits — each rank increases its effect and its drain. Endo comes from Ayatan sculptures, dissolving duplicate mods, and dedicated farms covered in the [Endo guide](/guides/endo). Use the [Endo / Plat value tool](/endo) to decide whether a mod or riven is worth more dissolved than kept."
    },
    {
      "q": "Are Rivens worth it for a new player?",
      "a": "Not yet. Rivens are an endgame min-max layer that only adds roughly the last 10–30% on top of an already-complete build, and their randomized stats can be tricky. Finish a proper mod loadout first, then price rolls with the [Riven value estimator](/riven-value) and read the mechanics in the [Riven guide](/guides/riven) before spending platinum."
    }
  ],
  "videos": [
    {
      "id": "ct2pfAonGXY",
      "title": "Complete Warframe Modding Guide 2025: Everything You Need to Know!",
      "channel": "Zefā"
    },
    {
      "id": "RQ22Jltn3i0",
      "title": "The Ultimate Shield Gating Guide! 🛡️ STOP DYING IN STEEL PATH [Warframe]",
      "channel": "Hunkpain Gaming "
    },
    {
      "id": "H0sPUBGn2bc",
      "title": "How to NEVER DIE In WARFRAME!",
      "channel": "iFlynn"
    },
    {
      "id": "GPJS7bj6V2E",
      "title": "THE ONLY SURVIVABILITY GUIDE YOU WILL EVER NEED IN WARFRAME",
      "channel": "Alextreme"
    }
  ],
  "sources": [
    {
      "label": "Warframe Wiki — Mods, Polarity & Forma",
      "href": "https://wiki.warframe.com/w/Mods"
    },
    {
      "label": "Warframe Wiki — Damage & Elemental Combinations",
      "href": "https://wiki.warframe.com/w/Damage"
    },
    {
      "label": "Warframe Wiki — Shield & Shield Gating",
      "href": "https://wiki.warframe.com/w/Shield"
    }
  ],
  "related": [
    {
      "label": "Riven Mods Guide",
      "to": "/guides/riven",
      "icon": "diamond-stone",
      "note": "Rolls, dispositions & when to bother"
    },
    {
      "label": "Steel Path Guide",
      "to": "/guides/steel-path",
      "icon": "skull",
      "note": "Where survivability modding pays off"
    },
    {
      "label": "Helminth System",
      "to": "/guides/helminth",
      "icon": "dna",
      "note": "Subsume defensive abilities onto any frame"
    },
    {
      "label": "Arcanes Guide",
      "to": "/guides/arcanes",
      "icon": "shield-star",
      "note": "The survivability layer above mods"
    },
    {
      "label": "Endo Farming",
      "to": "/guides/endo",
      "icon": "chart-line",
      "note": "Fuel to rank your mods up"
    },
    {
      "label": "Riven Value Estimator",
      "to": "/riven-value",
      "icon": "cash",
      "note": "Price a riven before you trade"
    }
  ],
  "updated": "2026-07-18"
}

export default guide
