// Auto-generated Warframe Knowledge Center guide content.
// Drafted grounded in r/Warframe research (reddit API) + the subreddit wiki FAQ,
// then adversarially fact-checked for evergreen accuracy. Embedded video ids were
// verified live via YouTube oEmbed. Edit freely — this is the single source for
// the /guides/steel-path page (rendered by <GuideArticle>).
import type { Guide } from './types'

const guide: Guide = {
  "slug": "steel-path",
  "eyebrow": "Knowledge Center · Steel Path",
  "title": "Steel Path & Steel Essence",
  "lede": "The Steel Path is Warframe's New Game Plus: the whole star chart replayed with +100 enemy levels and far tougher enemies, paying out Steel Essence you spend on Umbra Forma, Kuva, Rivens, and Incarnon weapons. Here's how to unlock it, survive it, and farm it without wasting runs.",
  "category": "endgame",
  "readMins": 9,
  "stats": [
    {
      "num": "+100",
      "label": "enemy levels added",
      "tone": "gold"
    },
    {
      "num": "+250%",
      "label": "enemy health & shields",
      "tone": "alt"
    },
    {
      "num": "Free",
      "label": "to unlock — just clear the star chart",
      "tone": "good"
    },
    {
      "num": "150",
      "label": "Essence for an Umbra Forma BP",
      "tone": "gold"
    }
  ],
  "sections": [
    {
      "id": "what-it-is",
      "title": "What the Steel Path actually is",
      "blocks": [
        {
          "type": "p",
          "text": "The **Steel Path** is Warframe's hard mode — a New Game Plus toggle that re-skins the *entire* star chart with much stronger enemies. Every node you already cleared on the normal chart is still there, but enemies arrive with **+100 levels** and a heavy boost to health, shields, and armor, so a sleepy starting node becomes a genuine threat. In exchange, missions rain **Steel Essence** and bonus resources, and finishing planets unlocks unique rewards from Teshin."
        },
        {
          "type": "p",
          "text": "It is **100% optional endgame content**. Nothing in the main story requires it, and you should treat it as a reason to keep playing after the star chart — not a wall you have to climb to progress. It is best thought of as the place your fully-built gear finally gets to flex."
        },
        {
          "type": "kv",
          "kv": [
            {
              "k": "Unlocks at",
              "v": "Full normal star chart clear (every node + junction)"
            },
            {
              "k": "Turned on by",
              "v": "Talking to Teshin in any Relay, then a Star Chart toggle"
            },
            {
              "k": "Main currency",
              "v": "Steel Essence → Teshin's Steel Path Honors shop"
            },
            {
              "k": "Difficulty",
              "v": "+100 enemy levels, tougher Eximus, real survivability required"
            },
            {
              "k": "Reward headline",
              "v": "Umbra Forma, Incarnon adapters, Kuva, Riven Slivers, Arcanes"
            }
          ]
        },
        {
          "type": "info",
          "title": "New Game Plus, not a new star chart",
          "text": "You are not unlocking new missions — you are replaying the same nodes at a much higher difficulty with a separate completion track. The layout, enemies, and tilesets are identical; only the numbers and the loot table change."
        }
      ]
    },
    {
      "id": "how-to-unlock",
      "title": "How to unlock the Steel Path",
      "blocks": [
        {
          "type": "steps",
          "ordered": true,
          "steps": [
            {
              "h": "Clear the entire normal star chart",
              "p": "You must complete every mission node on every planet, including all the Junctions that link them. If a single node is unfinished anywhere, Teshin won't offer the Steel Path. Use the star chart's planet view to hunt down any node that isn't lit up."
            },
            {
              "h": "Visit Teshin in a Relay",
              "p": "Once the chart is complete, Teshin appears in any Relay (he's the Conclave master). Talk to him and he'll offer to open the Steel Path for free — no cost, no gate beyond the star-chart requirement."
            },
            {
              "h": "Flip the Star Chart toggle",
              "p": "After unlocking, open your Star Chart and use the Steel Path toggle (top of the navigation screen) to switch any planet between Normal and Steel Path. You can swap back and forth at will."
            },
            {
              "h": "Grind the planets for Teshin's Honors",
              "p": "Clearing each planet's Steel Path nodes grants a one-time reward from Teshin — a lump of Steel Essence plus a decoration and emote. Stacking those Essence payouts across every planet is a solid early goal in its own right, and it funds your first big shop purchases."
            }
          ]
        },
        {
          "type": "tip",
          "title": "Struggling with a Steel Path Junction?",
          "text": "Junctions exist in the Steel Path too and can spike in difficulty. A tanky frame with strong crowd control or self-sustain (Grendel, Rhino, Nidus, Inaros, Frost) trivialises them — bring one specifically for the junction fight if a squishier frame keeps dying."
        },
        {
          "type": "warn",
          "title": "Teshin will keep nagging you",
          "text": "After you've cleared the star chart, Teshin pings you on loading screens to nudge you toward the Steel Path. Unlocking it does not force you to play it — you can open it and simply never toggle it on. There's no penalty for ignoring it until your builds are ready."
        }
      ]
    },
    {
      "id": "the-stat-wall",
      "title": "Why enemies feel completely different",
      "blocks": [
        {
          "type": "p",
          "text": "The Steel Path doesn't add new mechanics so much as multiply the old ones. The same Grineer Lancer you one-tapped on the normal chart now has a wall of armor and enough health to survive a full magazine of an un-optimised weapon. Two things do most of the killing: raw enemy durability, and beefed-up **Eximus** units."
        },
        {
          "type": "table",
          "table": {
            "columns": [
              "What changes",
              "In the Steel Path"
            ],
            "rows": [
              [
                "Enemy level",
                "+100 on top of the node's normal level (a low node lands around level 100–130)"
              ],
              [
                "Health & shields",
                "Both jump roughly +250%, and armor scales hard with the +100 levels — armored Grineer become the single biggest damage wall"
              ],
              [
                "Shield bypass",
                "With shields boosted too, Corpus fights lean on shield-stripping and toxin/slash procs that go straight through shields"
              ],
              [
                "Eximus units",
                "Much deadlier and carry Overguard — a health layer that shrugs off crowd control until it's broken"
              ],
              [
                "Rewards",
                "Steel Essence drops, richer resource yields, and per-planet Teshin Honors"
              ]
            ],
            "note": "Exact multipliers get tuned over time — check the live wiki for the current numbers."
          }
        },
        {
          "type": "info",
          "title": "Overguard breaks the old CC meta",
          "text": "Since the Eximus rework, Eximus units generate Overguard that makes them immune to crowd control (stuns, holds, ragdolls) until you chew through it. Frames that relied purely on locking enemies down now need damage or armor strip to back it up — pure CC alone won't carry Steel Path."
        }
      ]
    },
    {
      "id": "steel-essence",
      "title": "Steel Essence: the endgame currency",
      "blocks": [
        {
          "type": "p",
          "text": "**Steel Essence** is the whole point of the mode. It's a special currency that only drops in the Steel Path and only spends at Teshin's shop. Farming it well is less about stacking generic drop mods and more about hitting the right sources — and layering the specific multipliers that do work on it."
        },
        {
          "type": "p",
          "text": "There are three reliable sources:"
        },
        {
          "type": "list",
          "items": [
            "**Acolytes** — the returning Acolyte assassins spawn periodically in Steel Path missions and each drops a chunk of Steel Essence on death (plus a shot at their Acolyte mods). Long endless runs = more Acolyte spawns.",
            "**Eximus units** — every Eximus you kill has a chance to drop Steel Essence, which is why Eximus-dense endless missions are the classic farm.",
            "**Daily Incursions** — a handful of special Steel Path missions are flagged on the star chart each day (six at the moment), each handing out a fixed lump of Steel Essence. They reset daily and are the most reliable low-effort income."
          ]
        },
        {
          "type": "tip",
          "title": "Multiply your pickups",
          "text": "A **Smeeta Kavat's** Charm buff can double Steel Essence pickups, and **Nekros Desecrate** can roll extra Essence off enemy corpses. Pairing Smeeta + a Desecrate Nekros in an Eximus-heavy endless mission is the backbone of every essence-farm loadout."
        }
      ]
    },
    {
      "id": "teshin-shop",
      "title": "Teshin's Steel Path Honors shop",
      "blocks": [
        {
          "type": "p",
          "text": "Spend Steel Essence at Teshin's **Steel Path Honors** store (accessed through him in a Relay or from the Steel Path star-chart screen). It mixes a permanent catalogue with a **weekly rotating** stock — the rotation is where the Incarnon adapters live, so check it every week."
        },
        {
          "type": "table",
          "table": {
            "columns": [
              "Reward",
              "Why it matters"
            ],
            "rows": [
              [
                "Umbra Forma Blueprint (150 Essence)",
                "One of the only reliable ways to farm Umbra Forma — needed to fit full Umbral mod sets. The marquee long-term goal."
              ],
              [
                "Incarnon Genesis Adapters (weekly rotation)",
                "Turn classic weapons (Braton, Lato, Paris, Kunai and friends) into Incarnon powerhouses that scale into endgame."
              ],
              [
                "Kuva",
                "Buy Kuva bundles to fuel Riven rerolls without grinding Kuva Survival — pairs with the Kuva guide."
              ],
              [
                "Riven Slivers",
                "Combine ten Slivers into a Riven of the weapon type you choose — a steady path to Rivens without pure luck."
              ],
              [
                "Arcane Adapters",
                "Slot weapon arcanes onto primaries, secondaries, and melee for another power layer."
              ],
              [
                "Prestige cosmetics",
                "Emotes, armor, sigils and captura scenes to show you've put in the Steel Path miles."
              ]
            ],
            "note": "Exact Essence prices and the weekly Incarnon group shift — confirm against the live shop before you commit."
          }
        },
        {
          "type": "p",
          "text": "Two of these plug straight into other systems: the Riven Slivers feed [Rivens](/guides/riven) (price them first with the [Riven Value estimator](/riven-value)), and the Kuva feeds [Riven rerolls and Lich weapons](/guides/kuva). The Umbra Forma itself is a straight Essence buy from Teshin — there's no free one for clearing the chart, so budget your Essence toward it."
        }
      ]
    },
    {
      "id": "best-farm",
      "title": "Farming Steel Essence efficiently",
      "blocks": [
        {
          "type": "p",
          "text": "The fastest route to a full Teshin shopping cart layers guaranteed daily income on top of a farmable endless run:"
        },
        {
          "type": "steps",
          "ordered": true,
          "steps": [
            {
              "h": "Do the daily Incursions first",
              "p": "They're quick, fixed rewards and they reset every day — knock out all of the day's Incursions before anything else for the single most efficient Essence-per-minute income."
            },
            {
              "h": "Camp an Eximus-heavy endless mission",
              "p": "Survival, Defense or Interception nodes with dense spawns keep Acolytes and Eximus flowing. Look for a run where enemies funnel to one spot so your loot-multipliers hit everything."
            },
            {
              "h": "Bring the multiplier loadout",
              "p": "A **Smeeta Kavat** (Charm doubles pickups) plus a **Desecrate Nekros** (rolls extra Essence off corpses) is the core. A Khora, Hydroid or other loot/CC frame that herds enemies stacks even more value — this same loadout is also the game's premier Endo farm."
            },
            {
              "h": "Run a resource booster if you have one",
              "p": "Boosters and a resource-drop-chance kavat pump the *other* loot (Endo, mods, materials) you'll vacuum up alongside the Essence, making long runs doubly worth it."
            }
          ]
        },
        {
          "type": "tip",
          "title": "The exact 'best node' keeps moving",
          "text": "DE tunes spawn rates and re-balances nodes regularly, so the single best essence-farm location changes patch to patch. Learn the recipe — Eximus density + Smeeta + Desecrate + a loot/CC frame — and check a recent video or the live wiki for the current top node rather than trusting an old guide's exact map."
        },
        {
          "type": "p",
          "text": "Because Steel Path enemies drop so much loot, it doubles as the community's go-to **Endo** and mod farm. See the [Endo farming guide](/guides/endo) and the [Endo/Plat value tool](/endo) to squeeze value out of everything the Nekros hoovers up."
        }
      ]
    },
    {
      "id": "survivability",
      "title": "Survivability: how to stop getting one-shot",
      "blocks": [
        {
          "type": "p",
          "text": "The number-one reason players bounce off the Steel Path is dying instantly. At +100 levels, an unmodded frame melts. The fix isn't always more health — it's the right defensive *mechanic*. Build for one of these and almost any frame can survive:"
        },
        {
          "type": "list",
          "items": [
            "**Shield gating** — when your shields hit zero you get a brief invulnerability window (a little over a second from full shields). Refill even one shield — via Brief Respite/Augur mods on ability cast, or Decaying Dragon Key tricks — to re-trigger it. This is the great equaliser that lets *any* frame tank Steel Path. See the [mods & survivability guide](/guides/mods).",
            "**Adaptation** — stacks damage resistance up to a huge cap as you take hits, turning fragile frames sturdy over a few seconds.",
            "**Rolling Guard** — dodge for a short burst of invulnerability *and* a full status cleanse; your panic button when shields and gate both fail.",
            "**Armor strip** — corrosive procs or abilities (Pillage, Terrify, Tharros Strike, Fire Blast, and many Helminth subsumes) delete Grineer armor, and stripped enemies die to normal weapons. Often more valuable than raw damage.",
            "**Tank frames & arcanes** — Inaros, Nidus, Valkyr, Kullervo and similar stack health/armor; Arcane Guardian and Arcane Grace add a safety net on top.",
            "**Your Operator** — Void mode resets your shield gate, and Magus Elevate/Repair heal your frame when you dip back in. A basic amp also chunks Eximus Overguard."
          ]
        },
        {
          "type": "warn",
          "title": "Respect Eximus Overguard",
          "text": "Eximus units are the deadliest thing in a Steel Path room and their Overguard ignores crowd control. Don't expect a CC ability to save you from an Eximus — prioritise killing or armor-stripping them, and keep your shield gate / Rolling Guard ready for their burst damage."
        },
        {
          "type": "p",
          "text": "The [Helminth system](/guides/helminth) is your survivability toolbox here — subsuming an armor-strip, an over-shield, or a defensive buff onto your favourite frame closes almost any gap. Pair it with the right [arcanes](/guides/arcanes) and you're Steel-Path ready."
        }
      ]
    },
    {
      "id": "am-i-ready",
      "title": "Am I ready? When to start",
      "blocks": [
        {
          "type": "quote",
          "text": "I don't think I'm ready, do I just shut off my console?",
          "cite": "r/Warframe, on unlocking the Steel Path"
        },
        {
          "type": "p",
          "text": "You're readier than you think — but only if you've built your gear. The gate isn't Mastery Rank or hours played; it's whether you have **one survivability mechanic** and **one weapon (or frame) that actually kills armored enemies**. A single well-modded frame with shield gating or Adaptation, plus a good primary/melee, clears the vast majority of Steel Path."
        },
        {
          "type": "p",
          "text": "A quick readiness check before you toggle it on:"
        },
        {
          "type": "list",
          "items": [
            "Do you have shield gating, Adaptation, or a genuine tank frame set up? (If not, build that first.)",
            "Can your main weapon strip armor or bypass it (corrosive/viral, heavy slash, high crit)?",
            "Do you have a reliable armor-strip or CC option for Eximus-heavy rooms?",
            "Have you fed your frame a Reactor and a few Forma? Under-forma'd builds are the usual culprit for dying."
          ]
        },
        {
          "type": "tip",
          "title": "Ease in — don't start on Steel Path Sedna",
          "text": "Begin on the earliest planets (Earth, Venus) where the +100 still lands at manageable levels, and clear planets in roughly star-chart order. Bring a friend or public squad for your first runs — the mode is far gentler in a group than solo."
        },
        {
          "type": "p",
          "text": "Not sure which frame to commit Forma to for endgame? The [Warframe tier list](/guides/tier-list) flags the frames that hold up best in Steel Path, and [Archon Shards](/guides/archon-shards) are the next power step once your Steel Path builds are humming."
        }
      ]
    },
    {
      "id": "why-bother",
      "title": "Why bother — the payoff",
      "blocks": [
        {
          "type": "p",
          "text": "Beyond the challenge, the Steel Path is one of the best value loops in the game. In a single farming session you're collecting Steel Essence (for Umbra Forma, Incarnon adapters, Kuva, Rivens and Arcanes), a mountain of Endo and mods, and bonus resources on every mission — all at once."
        },
        {
          "type": "list",
          "items": [
            "**Umbra Forma** — one of the few ways to farm the game's strongest Forma, for full Umbral builds.",
            "**Incarnon weapons** — the weekly Incarnon Genesis adapters revive classic weapons into endgame-viable monsters.",
            "**Kuva & Riven Slivers** — steady income for [Riven](/guides/riven) rolling without grinding Kuva Survival, valued with the [Riven Value tool](/riven-value).",
            "**Best-in-slot Endo & resource farm** — the same Nekros/Smeeta loadout that farms Essence is the community's top [Endo farm](/guides/endo).",
            "**A real difficulty ceiling** — the place fully-built frames and weapons finally get tested."
          ]
        },
        {
          "type": "info",
          "title": "Where to go next",
          "text": "Once Steel Path feels comfortable, the natural next steps are Eidolon hunts, Archon Hunts (for Archon Shards), and Netracell/endgame farms. Browse the [community tools directory](/tools) for wikis, build planners, and drop trackers to plan every run."
        }
      ]
    }
  ],
  "faqs": [
    {
      "q": "How do I unlock the Steel Path in Warframe?",
      "a": "Complete the entire normal star chart — every mission node on every planet plus all the Junctions — then talk to Teshin in any Relay. He unlocks the Steel Path for free, after which a toggle appears on your Star Chart to switch any planet between Normal and Steel Path."
    },
    {
      "q": "What level are Steel Path enemies?",
      "a": "Enemies get +100 levels on top of a node's normal level, plus a large boost to durability (health and shields are commonly cited around +250%, and armor scales hard with the higher level). A low starting node lands roughly in the 100–130 range, so even 'easy' missions hit hard until your build is ready."
    },
    {
      "q": "What is Steel Essence used for?",
      "a": "Steel Essence is spent at Teshin's Steel Path Honors shop on Umbra Forma blueprints (150 Essence), weekly Incarnon Genesis adapters, Kuva, Riven Slivers, weapon Arcane Adapters, and cosmetics. It only drops in the Steel Path and only spends at Teshin."
    },
    {
      "q": "What's the best way to farm Steel Essence?",
      "a": "Do all the daily Incursions for guaranteed income, then camp an Eximus-heavy endless mission with a Smeeta Kavat (Charm doubles pickups) and a Desecrate Nekros (rolls extra Essence off corpses). The exact best node shifts with balance patches, so check a recent video for the current meta — the loadout recipe stays the same."
    },
    {
      "q": "How do I stop getting one-shot in Steel Path?",
      "a": "Build one survivability mechanic: shield gating (refill a shield to re-trigger the invulnerability window), the Adaptation mod, Rolling Guard, or a genuine tank frame. Add armor strip so weapons actually kill armored enemies, and respect Eximus Overguard, which ignores crowd control. See the [mods & survivability guide](/guides/mods)."
    },
    {
      "q": "Do I need to play the Steel Path to progress in Warframe?",
      "a": "No — it's fully optional endgame content and nothing in the main story requires it. Teshin will nag you to start it after you clear the star chart, but you can safely ignore it until your builds are ready. Treat it as a reason to keep playing, not a wall."
    },
    {
      "q": "Can I get Incarnon weapons from the Steel Path?",
      "a": "Yes. Teshin's shop sells Incarnon Genesis adapters for Steel Essence on a weekly rotation. These convert classic weapons like the Braton, Lato, and Paris into Incarnon powerhouses that scale into endgame, so check the rotating stock each week."
    },
    {
      "q": "Is the Steel Path good for farming Endo?",
      "a": "It's one of the best in the game. The same Nekros + Smeeta + loot-frame loadout used for Steel Essence also vacuums up mods and Ayatan stars for huge Endo returns. See the [Endo farming guide](/guides/endo) and the [Endo value tool](/endo) to make the most of it."
    }
  ],
  "videos": [
    {
      "id": "NaXYl5rnPJo",
      "title": "How To Unlock The Steel Path in Warframe (Beginner’s Guide 2026)",
      "channel": "Tipsy"
    },
    {
      "id": "tW5C3mM03mg",
      "title": "The Steel Path in Warframe - how to begin and earn rewards with Steel Essence",
      "channel": "scannerbarkly"
    },
    {
      "id": "aXLQ70qUaXM",
      "title": "The ULTIMATE Guide to Steelpath In Warframe",
      "channel": "WarframeFlo"
    },
    {
      "id": "ABsk9vIDD6I",
      "title": "Warframe Beginner's Guide 2025: Episode #12: Unlocking The Steel Path!",
      "channel": "iFlynn"
    }
  ],
  "sources": [
    {
      "label": "The Steel Path — Official Wiki",
      "href": "https://wiki.warframe.com/w/The_Steel_Path",
      "icon": "book-open-page-variant"
    },
    {
      "label": "Steel Essence — Official Wiki",
      "href": "https://wiki.warframe.com/w/Steel_Essence",
      "icon": "book-open-page-variant"
    },
    {
      "label": "r/Warframe: 'I don't think I'm ready, do I just shut off my console?'",
      "href": "https://reddit.com/r/Warframe/comments/1mtzhmg/i_dont_think_im_ready_do_i_just_shut_off_my/",
      "icon": "reddit"
    },
    {
      "label": "r/Warframe: struggling with Steel Path junctions — just take Grendel",
      "href": "https://reddit.com/r/Warframe/comments/olzrye/if_youre_struggling_to_do_steel_path_junctions/",
      "icon": "reddit"
    },
    {
      "label": "r/Warframe: the best Endo farm (Steel Path Nekros/Khora/Nidus)",
      "href": "https://reddit.com/r/Warframe/comments/q0k50m/surprised_at_how_so_many_people_dont_know_about/",
      "icon": "reddit"
    }
  ],
  "related": [
    {
      "label": "Survivability & Shield Gating",
      "to": "/guides/mods",
      "icon": "shield-half-full",
      "note": "Stop getting one-shot"
    },
    {
      "label": "Helminth Subsumes",
      "to": "/guides/helminth",
      "icon": "dna",
      "note": "Armor strip & defense on any frame"
    },
    {
      "label": "Arcanes Guide",
      "to": "/guides/arcanes",
      "icon": "star-four-points",
      "note": "Guardian, Grace & weapon arcanes"
    },
    {
      "label": "Riven Value Estimator",
      "to": "/riven-value",
      "icon": "diamond-stone",
      "note": "Price Slivers into Rivens"
    },
    {
      "label": "Endo Farming",
      "to": "/guides/endo",
      "icon": "hexagon-outline",
      "note": "Steel Path is a top Endo farm"
    },
    {
      "label": "Warframe Tier List",
      "to": "/guides/tier-list",
      "icon": "format-list-numbered",
      "note": "Frames that hold up in Steel Path"
    }
  ],
  "updated": "2026-07-18"
}

export default guide
