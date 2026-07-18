// Auto-generated Warframe Knowledge Center guide content.
// Drafted grounded in r/Warframe research (reddit API) + the subreddit wiki FAQ,
// then adversarially fact-checked for evergreen accuracy. Embedded video ids were
// verified live via YouTube oEmbed. Edit freely — this is the single source for
// the /guides/resources page (rendered by <GuideArticle>).
import type { Guide } from './types'

const guide: Guide = {
  "slug": "resources",
  "eyebrow": "Knowledge Center · Resource Farming",
  "title": "Resource Farming Reference",
  "lede": "Every crafting material is planet-locked and every farm follows the same three rules: right planet, densest node, stacked multipliers. Here's where the resources players actually ask about drop — and how to stop wasting hours grinding the wrong thing.",
  "category": "farming",
  "readMins": 8,
  "stats": [
    {
      "num": "10",
      "label": "resources players ask about most",
      "tone": "gold"
    },
    {
      "num": "50%",
      "label": "of your Argon decays every day",
      "tone": "alt"
    },
    {
      "num": "4×",
      "label": "yield with both boosters stacked",
      "tone": "good"
    },
    {
      "num": "0",
      "label": "nodes that drop Nitain Extract"
    }
  ],
  "sections": [
    {
      "id": "how-drops-work",
      "title": "How resource drops actually work",
      "blocks": [
        {
          "type": "p",
          "text": "Almost every resource in Warframe is **planet-locked**. Each planet's enemies, containers, and destructible plants roll from a fixed loot table, so the fastest farm is always the same recipe: **go to the right planet, then pick the node that kills the most enemies per minute.** That's why survivals, defenses, and interceptions dominate resource farming — dense, endless spawns beat a short capture every time."
        },
        {
          "type": "p",
          "text": "Resources come in rarity tiers. **Common** drops (Nano Spores, Ferrite, Salvage) pile up by the thousand just from playing. **Uncommon** (Oxium, Plastids) need a little intent. The **rare** materials — Orokin Cells, Neurodes, Neural Sensors, Argon Crystals, Tellurium — are the real gate on your Foundry, so those are the ones worth optimizing a run for."
        },
        {
          "type": "info",
          "title": "Bosses = burst farming",
          "text": "Assassination bosses reliably drop a helping of their planet's signature rare resource — some at a guaranteed 100% (like Sargas Ruk for Orokin Cells). When you need 5-10 of something *right now* rather than a long grind, a quick boss kill is often faster than an endless mission."
        }
      ]
    },
    {
      "id": "cheat-sheet",
      "title": "The resource cheat-sheet",
      "blocks": [
        {
          "type": "p",
          "text": "The reference table below covers the ten resources that fill the subreddit's daily \"where do I farm...\" threads. Node names change less often than drop rates, but DE does move things around — treat the **go-to farm** column as the reliable starting point and confirm the exact best node with the drop map or the live wiki."
        },
        {
          "type": "table",
          "table": {
            "columns": [
              "Resource",
              "Rarity",
              "Where it comes from",
              "Go-to farm"
            ],
            "rows": [
              [
                "Orokin Cell",
                "Rare",
                "Saturn, Ceres, Deimos enemies & containers",
                "Ceres Dark Sector survival (e.g. Gabii); boss Sargas Ruk on Saturn for a burst"
              ],
              [
                "Neurode",
                "Rare",
                "Infested / organic — Earth, Deimos, Lua, Eris",
                "Deimos survival; boss Lephantis drops a chunk"
              ],
              [
                "Neural Sensor",
                "Rare",
                "Jupiter (Gas City), Kuva Fortress",
                "Jupiter survival/defense; Alad V for a burst"
              ],
              [
                "Argon Crystal",
                "Rare — DECAYS",
                "The Void only — enemies & containers",
                "Short Void capture or 5-min survival, same day you craft"
              ],
              [
                "Tellurium",
                "Rare",
                "Archwing enemies (any); Uranus sealab tiles",
                "Uranus submersible survival, or any Archwing mission"
              ],
              [
                "Oxium",
                "Uncommon",
                "Oxium Ospreys (Corpus drones) only",
                "Io, Jupiter (Defense) — kill Ospreys before they self-destruct"
              ],
              [
                "Nitain Extract",
                "Rare",
                "NOT node-farmable",
                "Nightwave Cred shop; reactor Sabotage caches; Ghoul Purge"
              ],
              [
                "Plastids",
                "Uncommon",
                "Saturn, Uranus, Phobos, Pluto, Eris",
                "Grab alongside other rares; any Dark Sector survival"
              ],
              [
                "Nano Spores",
                "Common",
                "Infested — Saturn, Neptune, Eris, Deimos",
                "One Dark Sector survival (e.g. Piscinas) nets thousands"
              ],
              [
                "Kuva",
                "Special",
                "Kuva Siphon / Flood; Kuva Survival",
                "Kuva Survival on the Kuva Fortress; Siphons/Floods for quick hits"
              ]
            ],
            "note": "Not sure which node? Use the on-site drop maps at /star-chart and /star-chart-3d to see exactly where any material drops, or cross-check the live wiki for the current best-yield node."
          }
        }
      ]
    },
    {
      "id": "multipliers",
      "title": "Stack your multipliers (this beats node-hunting)",
      "blocks": [
        {
          "type": "p",
          "text": "The single biggest lever in resource farming isn't *which* node — it's how many multipliers you stack on it. The two boosters, a companion loot mod, and a loot-frame ability all multiply **together**. Running both boosters alone is already **4× yield**; add a companion running **Loyal Retriever** and a Nekros and you're pulling several times what a bare solo run on the same node gets."
        },
        {
          "type": "table",
          "table": {
            "columns": [
              "Multiplier",
              "What it does",
              "Stacks?"
            ],
            "rows": [
              [
                "Resource Booster",
                "2× resource quantity per drop",
                "Yes"
              ],
              [
                "Resource Drop Chance Booster",
                "2× chance a resource drops at all",
                "Yes"
              ],
              [
                "Loyal Retriever (companion mod)",
                "Passive chance to double each resource/credit pickup — equip on any Beast pet",
                "Yes"
              ],
              [
                "Nekros — Desecrate",
                "Forces dead enemies to roll their loot table again",
                "Yes — but not with other loot-on-death frames"
              ],
              [
                "Khora / Hydroid — Pilfering augments",
                "Extra loot rolls from enemies killed in the ability",
                "Yes — but not with Desecrate"
              ],
              [
                "Dark Sector node",
                "Built-in resource-drop bonus on the node itself",
                "Yes"
              ]
            ],
            "note": "Boosters are buyable with platinum or handed out in Nightwave, Sortie, and login rewards — watch for free ones before spending plat. Heads-up: the loot-on-death abilities (Nekros Desecrate and the Khora/Hydroid Pilfering augments) don't stack with each other, so bring just one loot frame."
          }
        },
        {
          "type": "tip",
          "title": "The dream combo",
          "text": "Resource Booster + Resource Drop Chance Booster + a Beast companion running **Loyal Retriever** + a Nekros or Khora, run in a **Dark Sector survival** on the target planet. That single setup out-farms any amount of node-shopping. If you only own one booster, prioritize the **Drop Chance** booster for rares — doubling the odds of a rare appearing matters more than doubling a stack you didn't get."
        }
      ]
    },
    {
      "id": "argon",
      "title": "Argon Crystals: mind the decay clock",
      "blocks": [
        {
          "type": "warn",
          "title": "Argon is the only resource that rots",
          "text": "The game deletes roughly **half your Argon Crystal stock every day at reset**, and any single crystal is gone within a day or two of pickup. A pile you farm tonight is mostly worthless by tomorrow. This is intentional — never, ever stockpile Argon."
        },
        {
          "type": "p",
          "text": "Argon Crystals drop **only in the Void**, from enemies and containers. The right move is just-in-time: farm Argon the **same session you queue the build** that needs it. A single Void capture, or a 5-minute Void survival, covers most recipes. Bonus — Void missions crack open Relics while you're there, so you farm Argon and platinum in one go. See [Relic value: crack or sell](/relics-value) and [which relics pay best per run](/relic-farming)."
        },
        {
          "type": "info",
          "title": "Stuck with a pile of excess Argon?",
          "text": "It's one of r/Warframe's running jokes (\"how do I use 588 Argon in 1 hour\"). The answer: feed it to your [Helminth](/guides/helminth) before it decays. That's the classic sink for any spare resource you over-farmed."
        }
      ]
    },
    {
      "id": "awkward-ones",
      "title": "The awkward three: Nitain, Oxium, Tellurium",
      "blocks": [
        {
          "type": "p",
          "text": "**Nitain Extract** — you cannot grind this at a node, which trips up every new player who tries. It comes from the **Nightwave** Cred offerings (an always-available 'evergreen' buy, 5 for 15 Cred), reactor **Sabotage** resource caches, and **Ghoul Purge** bounties. Keep a small reserve of Nitain *and* Forma on hand — together they gate Aura Forma (which costs both) and several older frames, and they always seem to run dry at the worst moment."
        },
        {
          "type": "p",
          "text": "**Oxium** — dropped only by **Oxium Ospreys** (the Corpus flying drones), and *only if you destroy them before they self-destruct*. You want a Corpus node that spawns Ospreys in bulk; the long-standing pick is **Io on Jupiter** (Defense), which stacks Oxium and mastery affinity at the same time. Prioritize the Ospreys — a detonated one drops nothing."
        },
        {
          "type": "p",
          "text": "**Tellurium** — a rare drop from **Archwing** enemies (any Archwing mission, any planet) and from **Uranus** submersible/sealab tilesets. For ground farming, a Uranus submersible survival like Ophelia with a loot frame is the reliable pick; if you'd rather fly, any Archwing node works. It's rare everywhere, so bring boosters and a Nekros."
        }
      ]
    },
    {
      "id": "staples",
      "title": "Crafting staples: Cells, Neurodes, Sensors & bulk mats",
      "blocks": [
        {
          "type": "p",
          "text": "These are the rares (plus two commons) you'll burn through building frames, weapons, and companions. Each has a boss for a quick burst and an endless node for grinding stacks:"
        },
        {
          "type": "kv",
          "kv": [
            {
              "k": "Orokin Cells",
              "v": "Saturn & Ceres. Boss Sargas Ruk (Saturn) for a guaranteed burst; a Ceres Dark Sector survival like Gabii for stacks."
            },
            {
              "k": "Neurodes",
              "v": "Infested/organic on Earth, Deimos, Lua. Lephantis (Deimos) drops several on kill; Deimos survival to grind."
            },
            {
              "k": "Neural Sensors",
              "v": "Jupiter Gas City (and Kuva Fortress). Alad V for a burst; a Jupiter survival like Cameria to grind."
            },
            {
              "k": "Plastids",
              "v": "Saturn, Uranus, Phobos, Pluto, Eris — you'll collect these passively while farming other rares on those planets."
            },
            {
              "k": "Nano Spores",
              "v": "Any Infested-heavy planet (Saturn, Neptune, Eris, Deimos). A single Dark Sector survival hands you thousands; you'll rarely farm these on purpose."
            }
          ]
        }
      ]
    },
    {
      "id": "kuva",
      "title": "Kuva: the endgame resource",
      "blocks": [
        {
          "type": "p",
          "text": "Kuva sits outside the normal loot tables. It's the currency for rolling [Rivens](/riven-value) and for converting/vanquishing Kuva Liches, and you earn it from dedicated missions: **Kuva Siphon** and **Kuva Flood** (roaming nodes marked on the star chart) for quick hits, and **Kuva Survival on the Kuva Fortress** for volume, where periodic Kuva Harvesters drop large kuva bricks. Resource boosters and a companion's loot-doubling mod work on it just like any other resource."
        },
        {
          "type": "p",
          "text": "Because Kuva feeds directly into Riven gambling — the deepest platinum sink in the game — it gets its own deep dive. Full method breakdown in the [Kuva farming guide](/guides/kuva), and check what a rolled Riven is actually worth with the [Riven value estimator](/riven-value) before you burn 20,000 Kuva chasing a god-roll."
        }
      ]
    },
    {
      "id": "smart-farming",
      "title": "Passive income & a repeatable routine",
      "blocks": [
        {
          "type": "p",
          "text": "Two force-multipliers most players forget, then a run template you can repeat for any rare:"
        },
        {
          "type": "list",
          "items": [
            "**Extractors** — deploy a **Titan** (common-weighted) or **Distilling** (rare-weighted) extractor on any planet whose nodes you've fully cleared. They quietly collect resources while you're offline. Rotating Distilling extractors across planets is free Neurodes, Orokin Cells, and Tellurium for zero playtime.",
            "**Check before you grind** — a lot of \"I need 25 Orokin Cells\" panic is avoidable. You may be able to just buy the finished Prime part for a few plat instead of farming its resource cost. Compare with [Set vs Parts cost](/comparison) and check [Ducat values](/ducats) before committing to a farm."
          ]
        },
        {
          "type": "steps",
          "steps": [
            {
              "h": "Load your multipliers",
              "p": "Equip a Resource + Resource Drop Chance booster (or at least bring a Beast companion with the Loyal Retriever mod). Free boosters show up constantly in login rewards, Sorties, and Nightwave."
            },
            {
              "h": "Bring a loot frame",
              "p": "Nekros (Desecrate) or Khora (Pilfering Strangledome) — or squad up with someone who has one. Their extra drops stack with your boosters (though the two loot-on-death frames don't stack with each other)."
            },
            {
              "h": "Pick a dense endless node",
              "p": "A Dark Sector survival on the target planet is ideal — endless spawns plus a built-in resource bonus. Confirm the node on [the drop map](/star-chart-3d)."
            },
            {
              "h": "Run in short cycles",
              "p": "5-10 minutes, extract, and only re-queue if you're actually short. Rares roll on a chance, so longer isn't linearly better once your booster window lapses."
            },
            {
              "h": "Argon is the exception",
              "p": "Only farm Argon Crystals the same day you'll craft — it decays, so a pre-emptive stockpile is wasted effort."
            }
          ]
        }
      ]
    }
  ],
  "faqs": [
    {
      "q": "Where's the best place to farm Orokin Cells?",
      "a": "Saturn and Ceres. For a quick burst, assassinate the Saturn boss Sargas Ruk — he drops Orokin Cells on kill (a guaranteed drop). To grind stacks, run a Ceres Dark Sector survival like Gabii with a Nekros and a resource booster. Confirm the exact node on [the drop map](/star-chart-3d)."
    },
    {
      "q": "Why do my Argon Crystals keep disappearing?",
      "a": "Argon Crystals decay by design — the game removes roughly half your stock every day at reset, and any crystal is gone within a day or two of pickup. Only farm Argon (in the Void) right before you craft the item that needs it, and dump any excess into your [Helminth](/guides/helminth) so it isn't wasted."
    },
    {
      "q": "How do I farm Nitain Extract?",
      "a": "You can't grind Nitain at any node — that's the catch. Buy it from the Nightwave Cred shop (it's an always-available 'evergreen' offering, 5 for 15 Cred), and pick it up from reactor Sabotage resource caches and Ghoul Purge bounties. Keep a small reserve since it gates Aura Forma and some older frames."
    },
    {
      "q": "Do resource boosters stack with loot frames and my pet's loot mod?",
      "a": "Yes — they all multiply together. A Resource Booster (2× quantity) and a Resource Drop Chance Booster (2× chance) stack for about 4× on their own, on top of loot-frame abilities like Nekros Desecrate. One heads-up: since the 2024 Companion rework, the old Smeeta Charm 'double resources' proc is gone — resource-doubling now lives on the Loyal Retriever mod, which you can slot on any Beast companion (not just a Smeeta) for a passive chance to double each pickup. Stacking these multipliers matters far more than hunting for the single 'perfect' node."
    },
    {
      "q": "What's the fastest way to farm Oxium?",
      "a": "Oxium only drops from Oxium Ospreys, and only if you destroy them before they self-destruct. The long-standing pick is Io on Jupiter (Defense), which spawns Ospreys in bulk and hands out mastery affinity at the same time. Focus the Ospreys down fast — a detonated one drops nothing."
    },
    {
      "q": "What's the best Kuva farm?",
      "a": "Kuva Survival on the Kuva Fortress for raw volume, plus Kuva Siphons and Floods (roaming nodes on the star chart) for quick hits. Resource boosters and a companion's loot-doubling mod boost it like anything else. See the full [Kuva farming guide](/guides/kuva)."
    },
    {
      "q": "Does Nekros Desecrate actually double my resources?",
      "a": "Not exactly — Desecrate forces dead enemies to roll their loot table a second time, producing extra drops that include resources. It stacks with resource boosters and companion loot mods, so having a Nekros or Khora in the squad meaningfully raises everyone's yield, not just their own. Note that Desecrate and the Khora/Hydroid Pilfering augments are all loot-on-death effects, so they don't stack with each other — one loot frame per squad is enough."
    },
    {
      "q": "What do I do with resources I don't need?",
      "a": "Most raw resources aren't tradeable, so the main sink is your [Helminth](/guides/helminth), which consumes spare materials for Invigorations and ability subsumes. Better still, don't over-farm rares in the first place — check whether you can just buy the finished [Prime part](/comparison) for a little platinum before grinding its resource cost."
    }
  ],
  "videos": [
    {
      "id": "ekBT4xub-oQ",
      "title": "Where To Find: Orokin Cells, Neurodes, Tellurium, and Argon Crystals Fast | Warframe",
      "channel": "LVMIAS"
    },
    {
      "id": "DzdkPJZyW8I",
      "title": "Warframe - Best Way To Farm Resources - Star Chart Edition",
      "channel": "MCGamerCZ"
    },
    {
      "id": "wKLYZWcsnlI",
      "title": "Where to farm materials?! (Orokin,Argon,Tellerum,Plastids,Neurodes & more) [Warframe]",
      "channel": "TheYamiks"
    },
    {
      "id": "OlXa8dap4fI",
      "title": "Best Ways To FARM Every Resources in Warframe 2025",
      "channel": "Tenno Tactics"
    }
  ],
  "sources": [
    {
      "label": "r/Warframe — \"How do I use 588 argon crystals within 1 hour\" (the decay panic)",
      "href": "https://reddit.com/r/Warframe/comments/1sbsb9t/how_do_i_use_588_argon_crystals_within_1_hour/"
    },
    {
      "label": "r/Warframe — \"DE, please don't nerf charm\" (the Smeeta Charm debate; its resource buff has since moved to the Loyal Retriever mod)",
      "href": "https://reddit.com/r/Warframe/comments/1ek4cyi/de_please_dont_nerf_charm/"
    },
    {
      "label": "r/Warframe — \"Petition to farm 1000 oxium\" (the Oxium grind)",
      "href": "https://reddit.com/r/Warframe/comments/98iay8/petition_to_get_rebbecca_and_meg_to_farm_1000/"
    },
    {
      "label": "r/Warframe — farming 15 argon crystals on defense",
      "href": "https://reddit.com/r/Warframe/comments/ef3qbe/this_is_the_story_of_our_main_protagonist_blue/"
    },
    {
      "label": "Warframe Wiki",
      "href": "https://wiki.warframe.com/"
    }
  ],
  "related": [
    {
      "label": "Kuva Farming",
      "to": "/guides/kuva",
      "icon": "diamond-stone",
      "note": "The endgame resource for rolling Rivens"
    },
    {
      "label": "Credit Farming",
      "to": "/guides/credits",
      "icon": "cash-multiple",
      "note": "Fund every Foundry build"
    },
    {
      "label": "Helminth System",
      "to": "/guides/helminth",
      "icon": "dna",
      "note": "Where your spare resources go"
    },
    {
      "label": "Drop-Location Map",
      "to": "/star-chart-3d",
      "icon": "map-marker-radius",
      "note": "Find the exact node for any material"
    },
    {
      "label": "Relic Farming",
      "to": "/guides/relics",
      "icon": "cube-outline",
      "note": "Void runs double as Argon farms"
    },
    {
      "label": "Set vs Parts Calculator",
      "to": "/comparison",
      "icon": "scale-balance",
      "note": "Buy the part, or farm the mats?"
    }
  ],
  "updated": "2026-07-18"
}

export default guide
