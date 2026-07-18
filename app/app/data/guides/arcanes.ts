// Auto-generated Warframe Knowledge Center guide content.
// Drafted grounded in r/Warframe research (reddit API) + the subreddit wiki FAQ,
// then adversarially fact-checked for evergreen accuracy. Embedded video ids were
// verified live via YouTube oEmbed. Edit freely — this is the single source for
// the /guides/arcanes page (rendered by <GuideArticle>).
import type { Guide } from './types'

const guide: Guide = {
  "slug": "arcanes",
  "eyebrow": "Knowledge Center · Arcanes",
  "title": "Arcanes Guide",
  "lede": "Arcanes are the trigger-based passives that turn a solid build into a Steel Path monster. Here's what they do, how to rank them, where they drop, and how to fund the grind by selling your duplicates.",
  "category": "systems",
  "readMins": 10,
  "stats": [
    {
      "num": "21",
      "label": "copies to max an arcane (Rank 5)",
      "tone": "gold"
    },
    {
      "num": "2",
      "label": "arcane slots per Warframe",
      "tone": "good"
    },
    {
      "num": "6",
      "label": "rank tiers, R0 to R5",
      "tone": "alt"
    },
    {
      "num": "3",
      "label": "flagship Eidolon arcanes",
      "tone": "gold"
    }
  ],
  "sections": [
    {
      "id": "what-are-arcanes",
      "title": "What arcanes actually are",
      "blocks": [
        {
          "type": "p",
          "text": "An **arcane** is a passive enhancement that lives in its own dedicated slot and fires on a **trigger** — often with a chance to activate. Think \"on energy pickup, chance to restore energy\" or \"on damage taken, chance to gain armor.\" Unlike mods, arcanes **do not use mod capacity**, so they stack on top of your existing build for free power."
        },
        {
          "type": "p",
          "text": "Arcanes are slot-specific — an arcane made for a Warframe can't go on a weapon, and vice versa. The main families are:"
        },
        {
          "type": "list",
          "items": [
            "**Warframe arcanes** — survivability, energy, and offense passives (Grace, Guardian, Energize, Avenger, the Molt line).",
            "**Weapon arcanes** — Primary, Secondary, and Melee arcanes that ramp damage on kills or reward headshots (Merciless and Deadhead lines).",
            "**Operator arcanes (Magus line)** — healing, crowd control, and utility for your Operator/Drifter.",
            "**Amp arcanes (Virtuos line)** — crit and damage boosts for your Amp, the backbone of Eidolon hunting.",
            "**Modular-gear arcanes** — Exodia (for Zaws) and Pax (for Kitguns) tune your crafted melee and secondary weapons."
          ]
        },
        {
          "type": "info",
          "text": "Arcanes are **reusable, permanent inventory items**. Equipping one on a frame doesn't consume it — you can freely swap it to another frame or weapon anytime. There's no distiller needed and nothing gets destroyed."
        }
      ]
    },
    {
      "id": "slots",
      "title": "Arcane slots: where they go",
      "blocks": [
        {
          "type": "p",
          "text": "Each piece of gear has a fixed number of arcane slots, found on the **Arcanes** tab of the Upgrade screen (next to your mods)."
        },
        {
          "type": "kv",
          "kv": [
            {
              "k": "Warframe",
              "v": "2 arcane slots"
            },
            {
              "k": "Primary / Secondary / Melee weapon",
              "v": "1 arcane slot each"
            },
            {
              "k": "Operator / Drifter",
              "v": "Arcane slots for Magus-line arcanes"
            },
            {
              "k": "Amp",
              "v": "Arcane slots for Virtuos-line arcanes"
            }
          ]
        },
        {
          "type": "p",
          "text": "Warframe slots are ready to use out of the box. **Weapon** arcane slots must be unlocked first with an **Arcane Adapter** — one per weapon type (Primary, Secondary, and Melee each take their own). The earned source is Teshin's **Steel Path Honors**, bought with Steel Essence in any relay; you can also grab adapters from **Acrithis** in Duviri for Pathos Clamps, or buy them outright from the in-game Market for platinum."
        },
        {
          "type": "warn",
          "text": "Adapter sources and Honors rotations get tweaked between updates. If you can't find where to buy an adapter this season, check the live [wiki.warframe.com](https://wiki.warframe.com/) or a recent video before grinding the wrong activity."
        }
      ]
    },
    {
      "id": "ranking",
      "title": "Ranking & maxing: the \"21 rule\"",
      "blocks": [
        {
          "type": "p",
          "text": "Arcanes rank from **Rank 0 to Rank 5**, and you rank them up by stacking **duplicate copies of the same arcane** — not with Endo or Kuva. Every arcane follows the same ramp: each higher rank costs a few more copies than the last."
        },
        {
          "type": "table",
          "table": {
            "columns": [
              "Rank",
              "Copies to reach this rank",
              "Total copies owned"
            ],
            "rows": [
              [
                "Rank 0 (equip)",
                "1",
                "1"
              ],
              [
                "Rank 1",
                "+2",
                "3"
              ],
              [
                "Rank 2",
                "+3",
                "6"
              ],
              [
                "Rank 3",
                "+4",
                "10"
              ],
              [
                "Rank 4",
                "+5",
                "15"
              ],
              [
                "Rank 5 (max)",
                "+6",
                "21"
              ]
            ],
            "note": "Fully maxing one arcane to Rank 5 costs 21 copies of that exact arcane."
          }
        },
        {
          "type": "tip",
          "text": "You do **not** need to max an arcane to use it. A single copy (Rank 0) already works — it just has a lower proc chance or smaller value. Slot what you have now and rank it up over time; even a Rank 3 Energize or Grace is a huge quality-of-life jump."
        },
        {
          "type": "p",
          "text": "Because 21 copies is a long haul, prioritize the one or two arcanes you actually run on your main frames rather than trying to max everything at once. Maxing your entire collection is a genuine flex — the r/Warframe post [\"finally maxed all Arcanes (100% self farmed)\"](https://reddit.com/r/Warframe/comments/1iz2rw4/as_of_today_i_have_finally_maxed_all_arcanes_100/) took serious dedication."
        }
      ]
    },
    {
      "id": "sources",
      "title": "Where arcanes come from",
      "blocks": [
        {
          "type": "p",
          "text": "There's no single arcane vendor — they're spread across endgame activities, each tied to its own currency. This is the reference map. Exact drop rates and \"best farm right now\" shift with patches, so treat this as the durable overview and confirm specifics on the wiki."
        },
        {
          "type": "table",
          "table": {
            "columns": [
              "Source",
              "What you get",
              "How you get it"
            ],
            "rows": [
              [
                "Eidolons — Plains of Eidolon (night)",
                "Classic frame arcanes: Energize, Grace, Guardian, Aegis, Avenger, and more",
                "Capture drops (RNG)"
              ],
              [
                "Acrithis — Duviri",
                "Buy many of those same frame arcanes directly, no RNG",
                "Pathos Clamps (from the Orowyrm)"
              ],
              [
                "Vox Solaris / Little Duck — Fortuna",
                "Operator (Magus) and Amp (Virtuos) arcanes",
                "Vox Solaris standing"
              ],
              [
                "The Holdfasts — Zariman",
                "Weapon arcanes + Molt utility arcanes",
                "Holdfasts standing"
              ],
              [
                "Cavia — Sanctum Anatomica",
                "Melee arcanes & Melee Arcane Adapters",
                "Cavia standing"
              ],
              [
                "Arcana Isolation Vaults — Deimos",
                "Theorem & Residual arcanes (niche synergy passives)",
                "Bounty reward rotations (RNG)"
              ],
              [
                "Events & Operations",
                "Rotating arcanes; Exodia arcanes (Zaws)",
                "Event tokens / caches"
              ],
              [
                "Höllvania / 1999 (Techrot Encore)",
                "Arcanes from caches + The Hex standing",
                "Caches & standing"
              ],
              [
                "Other players",
                "Any tradeable arcane",
                "Platinum (warframe.market)"
              ]
            ],
            "note": "Duviri's Acrithis is the great equalizer: she sells many Eidolon arcanes for Pathos Clamps, so solo players can skip the 4-player Tridolon meta entirely."
          }
        },
        {
          "type": "p",
          "text": "Operator and Amp arcanes are one of the steeper sinks — the Vox Solaris standing wall is real (players have done the math at millions of standing to buy the full [Little Duck lineup](https://reddit.com/r/Warframe/comments/1s0jdek/de_is_fixing_the_early_game_grind_but_forgot/)). Meanwhile newer content like **1999/Techrot Encore** hands out arcanes generously through caches (and lets you buy them from Eleanor with The Hex standing), which is why the community treats it as one of the friendlier modern farms. See the [Eidolon guide](/guides/eidolon) and [standing guide](/guides/standing) for the farming loops behind these sources."
        }
      ]
    },
    {
      "id": "staples",
      "title": "The staple arcanes worth knowing",
      "blocks": [
        {
          "type": "p",
          "text": "You'll accumulate dozens over time, but a handful of archetypes carry most builds. Exact values change with balance passes — check the wiki for current numbers — but these roles are evergreen:"
        },
        {
          "type": "table",
          "table": {
            "columns": [
              "Role",
              "Go-to arcanes",
              "What it does"
            ],
            "rows": [
              [
                "Energy economy",
                "Arcane Energize",
                "On energy pickup, a chance to restore a big chunk of energy to you and nearby allies — the king of energy sustain"
              ],
              [
                "Tank / self-heal",
                "Arcane Grace, Arcane Guardian, Arcane Aegis",
                "When hit: health regen, a large armor buff, or fast shield regen"
              ],
              [
                "Offense",
                "Arcane Avenger, Arcane Fury, Arcane Strike",
                "Trigger crit chance, melee damage, or attack speed on the right condition"
              ],
              [
                "Ability power (Zariman)",
                "Molt Augmented",
                "Ramps ability strength as you rack up kills — a set-and-forget caster buff"
              ],
              [
                "Status & sustain (Zariman)",
                "Molt Efficiency, Molt Reconstruct",
                "Molt Efficiency cuts incoming status duration; Molt Reconstruct converts energy spent on abilities into healing for you and allies"
              ],
              [
                "Weapon damage",
                "Primary / Secondary Merciless",
                "Stack rising damage the more enemies you kill"
              ],
              [
                "Headshot payoff",
                "Primary / Secondary Deadhead",
                "Reward headshot kills with bonus damage and reloads"
              ],
              [
                "Operator / Amp",
                "Magus Elevate, Magus Lockdown, Virtuos line",
                "Operator healing & CC; Amp crit for Eidolons"
              ]
            ]
          }
        },
        {
          "type": "tip",
          "text": "If you only chase three, make them the classic Eidolon trio — **Energize** (never run dry), plus **Grace** and **Guardian** (survive Steel Path). That combo alone transforms how nearly every frame feels. Pair them with the [mods guide](/guides/mods) survivability tech and the [Helminth guide](/guides/helminth) for a complete power spike."
        }
      ]
    },
    {
      "id": "selling",
      "title": "Turning arcanes into platinum",
      "blocks": [
        {
          "type": "p",
          "text": "Because maxing takes 21 copies, you'll pull tons of **duplicates** you don't need — and most Warframe arcanes are tradeable. Farming a source you've already maxed is one of the steadier platinum incomes in the game, with popular arcanes like Energize and Grace holding real value."
        },
        {
          "type": "list",
          "items": [
            "**Price-check before you farm.** Use the [market screener](/screener) to see which arcanes actually sell for plat versus the ones worth a couple of ducats-worth of nothing.",
            "**Spot spreads and demand** with the [flip finder](/flip) and [top movers](/movers) — arcane values swing when a new frame or update makes an old passive meta again.",
            "**Sell duplicates, keep singles.** One copy of every arcane is free build flexibility; everything beyond your target rank is inventory you can liquidate."
          ]
        },
        {
          "type": "p",
          "text": "Trading arcanes is one of the classic ways to fund your account. If you're new to the whole plat economy, start with the [platinum guide](/guides/platinum) for the trade-chat and warframe.market basics, then come back and list your extras."
        }
      ]
    },
    {
      "id": "gameplan",
      "title": "A step-by-step game plan",
      "blocks": [
        {
          "type": "steps",
          "steps": [
            {
              "h": "Don't rush it — arcanes are mid-game power",
              "p": "New players should focus on frames, weapons, and mods first. You unlock the arcane ecosystem naturally as you reach the Plains of Eidolon, build an Amp, and start Steel Path. There's no point maxing arcanes before your core build works."
            },
            {
              "h": "Grab energy + survivability first",
              "p": "Your first targets are the Energize / Grace / Guardian archetypes. Buy a cheap copy or two on the market, or farm Eidolons — or skip the RNG and buy them from Acrithis in Duviri with Pathos Clamps. Even unranked copies help immediately."
            },
            {
              "h": "Unlock your weapon arcane slots",
              "p": "Bank Steel Path Honors for Arcane Adapters (one per Primary, Secondary, and Melee weapon), then slot kill-stacking damage arcanes like the Merciless line on your workhorse guns."
            },
            {
              "h": "Commit to maxing your mains",
              "p": "Pick the one or two arcanes you run most and grind toward 21 copies. Partial ranks still pay off the whole way up, so it's never wasted progress."
            },
            {
              "h": "Fund the grind with duplicates",
              "p": "List every extra arcane for plat via the [screener](/screener) and [flip finder](/flip), then reinvest into the copies you still need. The farm pays for itself."
            }
          ]
        }
      ]
    },
    {
      "id": "mistakes",
      "title": "Common mistakes & quick tips",
      "blocks": [
        {
          "type": "list",
          "items": [
            "**Confusing arcanes with mods.** Arcanes go in the Arcanes tab, cost no capacity, and fire on triggers — they don't replace your mod loadout, they add to it.",
            "**Thinking you need Rank 5 to start.** One copy already works. Slot it and rank up as duplicates roll in.",
            "**Overlooking Duviri.** Acrithis sells many Eidolon arcanes for Pathos Clamps — a solo, low-stress alternative to Tridolon hunting.",
            "**Selling singles.** Keep at least one of every tradeable arcane; sell only the surplus beyond your target rank.",
            "**Forgetting weapon adapters.** Weapon arcanes do nothing until you unlock the slot with the matching Arcane Adapter."
          ]
        },
        {
          "type": "info",
          "text": "Arcane values, drop rates, and \"best farm\" nodes are the kind of detail DE tweaks often. For anything numeric — a specific proc chance or the current top farm — cross-check [wiki.warframe.com](https://wiki.warframe.com/) or a recent guide video before committing hours to it."
        }
      ]
    }
  ],
  "faqs": [
    {
      "q": "How many arcanes do you need to max an arcane in Warframe?",
      "a": "21 copies of the same arcane fully maxes it to Rank 5. The cost ramps each tier — 1 to equip, then +2, +3, +4, +5, +6 for a cumulative total of 21. You don't have to max it to use it, though; a single copy works at Rank 0."
    },
    {
      "q": "What's the best first arcane to farm?",
      "a": "Start with the energy and survivability staples — Arcane Energize, Arcane Grace, and Arcane Guardian. They improve nearly every frame in the game. You can farm them from Eidolons at night on the Plains of Eidolon, or buy them from Acrithis in Duviri for Pathos Clamps to skip the RNG. See the [Eidolon guide](/guides/eidolon)."
    },
    {
      "q": "Do arcanes get used up when you unequip them?",
      "a": "No. Arcanes are permanent inventory items — equipping one doesn't consume it, and you can freely swap it between frames and weapons anytime. Nothing gets destroyed and you don't need any kind of distiller."
    },
    {
      "q": "Can you trade arcanes for platinum?",
      "a": "Yes — most Warframe arcanes are tradeable, and selling your duplicates is a reliable platinum income once you've maxed the arcanes you use. Price-check first with the [market screener](/screener) and watch demand on [top movers](/movers), since values swing with the meta. The [platinum guide](/guides/platinum) covers the trading basics."
    },
    {
      "q": "How do you unlock arcane slots on weapons?",
      "a": "Each weapon needs its own Arcane Adapter — a Primary, Secondary, or Melee Arcane Adapter — to enable its single arcane slot. You earn adapters mainly from Teshin's Steel Path Honors (for Steel Essence), and you can also buy them from Acrithis in Duviri for Pathos Clamps or from the in-game Market. Warframe arcane slots, by contrast, are available by default — no adapter required."
    },
    {
      "q": "Where do Operator and Amp arcanes come from?",
      "a": "Operator arcanes (the Magus line) and Amp arcanes (the Virtuos line) are bought with Vox Solaris standing from Little Duck in Fortuna. You earn that standing mainly by turning in Toroids and spare gilded Amps from the Orb Vallis, and buying the whole lineup is a hefty standing grind — so plan accordingly."
    },
    {
      "q": "Are arcanes worth it for new players?",
      "a": "They're a mid-to-late-game power multiplier, not an early priority. Get your frames, weapons, and mods sorted first — you'll unlock the arcane ecosystem naturally as you reach the Plains of Eidolon and start Steel Path. Once you're there, a couple of energy and survivability arcanes are a massive upgrade."
    }
  ],
  "videos": [
    {
      "id": "DOnp7Nih0YE",
      "title": "The ONLY Arcane Guide You'll Ever Need (Warframe 2026)",
      "channel": "WarframeFlo"
    },
    {
      "id": "8-0t4RRSSZw",
      "title": "How To Farm Arcanes & Best Warframe Arcane Farm to Do First!",
      "channel": "Joe Hammer Gaming"
    },
    {
      "id": "TfuqGjCf5ws",
      "title": "18 Must-Have ARCANES after the TECHROT ENCORE Update",
      "channel": "Grind Hard Squad"
    },
    {
      "id": "WSEBKRYSoC8",
      "title": "Farming Arcanes is Now EASIER Than Ever! | Warframe",
      "channel": "Vanterrize Umbra"
    }
  ],
  "sources": [
    {
      "label": "r/Warframe: As of today I have finally maxed all Arcanes (100% self farmed)",
      "href": "https://reddit.com/r/Warframe/comments/1iz2rw4/as_of_today_i_have_finally_maxed_all_arcanes_100/"
    },
    {
      "label": "r/Warframe: DE forgot about the standing sink for Vox Solaris arcanes",
      "href": "https://reddit.com/r/Warframe/comments/1s0jdek/de_is_fixing_the_early_game_grind_but_forgot/"
    },
    {
      "label": "r/Warframe: Getting Stronger in Warframe, 2026 (progression guide)",
      "href": "https://reddit.com/r/Warframe/comments/1u00jua/getting_stronger_in_warframe_2026/"
    },
    {
      "label": "Official Warframe Wiki",
      "href": "https://wiki.warframe.com/"
    }
  ],
  "related": [
    {
      "label": "Eidolon Hunting Guide",
      "to": "/guides/eidolon",
      "icon": "weather-night",
      "note": "The classic source for Energize, Grace & Guardian"
    },
    {
      "label": "Steel Path Guide",
      "to": "/guides/steel-path",
      "icon": "skull",
      "note": "Where Weapon Arcane Adapters come from"
    },
    {
      "label": "Standing Guide",
      "to": "/guides/standing",
      "icon": "handshake",
      "note": "Vox Solaris, Holdfasts & Cavia arcane standing"
    },
    {
      "label": "Platinum Guide",
      "to": "/guides/platinum",
      "icon": "cash-multiple",
      "note": "Sell your duplicate arcanes for plat"
    },
    {
      "label": "Market Screener",
      "to": "/screener",
      "icon": "table-search",
      "note": "Price-check every arcane before you farm"
    },
    {
      "label": "Helminth Guide",
      "to": "/guides/helminth",
      "icon": "dna",
      "note": "Pair arcanes with subsumed abilities for the full power spike"
    }
  ],
  "updated": "2026-07-18"
}

export default guide
