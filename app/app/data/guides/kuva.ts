// Auto-generated Warframe Knowledge Center guide content.
// Drafted grounded in r/Warframe research (reddit API) + the subreddit wiki FAQ,
// then adversarially fact-checked for evergreen accuracy. Embedded video ids were
// verified live via YouTube oEmbed. Edit freely — this is the single source for
// the /guides/kuva page (rendered by <GuideArticle>).
import type { Guide } from './types'

const guide: Guide = {
  "slug": "kuva",
  "eyebrow": "Knowledge Center · Kuva Farming",
  "title": "Kuva Farming Guide",
  "lede": "Kuva is the red currency that reshuffles your Rivens — and the grind behind it has its own meta. Here's every reliable farm, how to multiply your yield with boosters and the right companion mod, and how to spend it without burning out.",
  "category": "farming",
  "readMins": 8,
  "stats": [
    {
      "num": "~600",
      "label": "Kuva per Siphon",
      "tone": "good"
    },
    {
      "num": "~1,200",
      "label": "Kuva per Flood",
      "tone": "alt"
    },
    {
      "num": "3,500",
      "label": "max Kuva per reroll",
      "tone": "gold"
    },
    {
      "num": "2×",
      "label": "Resource booster",
      "tone": "good"
    }
  ],
  "sections": [
    {
      "id": "what-kuva-is",
      "title": "What Kuva actually is",
      "blocks": [
        {
          "type": "p",
          "text": "**Kuva** is a red, glowing resource harvested from the Grineer's Kuva reserves. Its overwhelming purpose is one thing: **rerolling Riven mods**. Every reroll spends Kuva to reshuffle a Riven's stats — the buffs, the drawback, and the disposition scaling. It's also a crafting ingredient in a scattering of blueprints (a few Warframes, Umbra Forma and some weapons ask for a little), but the vast majority of the reason anyone farms Kuva is Rivens."
        },
        {
          "type": "p",
          "text": "The word \"Kuva\" is stamped on several unrelated systems, which trips up almost every new player. Only the **resource** is what you grind to reroll Rivens — the rest just share the branding."
        },
        {
          "type": "kv",
          "kv": [
            {
              "k": "What it is",
              "v": "An untradeable resource (red)"
            },
            {
              "k": "Main use",
              "v": "Rerolling Riven mod stats"
            },
            {
              "k": "Also used in",
              "v": "A handful of Foundry blueprints"
            },
            {
              "k": "Unlocked by",
              "v": "The War Within quest"
            },
            {
              "k": "Can it be bought/traded?",
              "v": "No — you farm it or you don't have it"
            }
          ]
        },
        {
          "type": "info",
          "text": "**\"Kuva\" is overloaded.** *Kuva* (the resource you reroll with) · *Kuva Siphon/Flood* (the missions that reward it) · *Kuva Lich* (an enemy nemesis) · *Kuva weapons* (what a Lich drops). Only the first one reshuffles Rivens. See the last section on Liches so you don't confuse the two."
        }
      ]
    },
    {
      "id": "unlock",
      "title": "Unlocking Kuva farming",
      "blocks": [
        {
          "type": "p",
          "text": "Kuva farming is gated behind the **The War Within** quest (the second Operator quest, which follows *The Second Dream*). Before you finish it, no Kuva Siphons or Floods appear on your star chart, the Kuva Fortress stays locked, and you can't spawn a Kuva Lich."
        },
        {
          "type": "steps",
          "steps": [
            {
              "h": "Progress the star chart",
              "p": "Push through the planets and the main story until The Second Dream and then The War Within unlock. See the [Quests guide](/guides/quests) for the order."
            },
            {
              "h": "Complete The War Within",
              "p": "This unlocks your Operator's Void powers — you literally need them to crack Kuva Siphons — and switches on the entire Kuva ecosystem."
            },
            {
              "h": "Watch the star chart",
              "p": "Kuva Siphon and Kuva Flood markers now rotate onto nodes across the Origin System, refreshing on a timer."
            },
            {
              "h": "Open the Kuva Fortress",
              "p": "The Fortress and its Kuva Survival node become your home base for bulk farming."
            }
          ]
        }
      ]
    },
    {
      "id": "core-farms",
      "title": "The core Kuva farms",
      "blocks": [
        {
          "type": "p",
          "text": "Three sources carry the load: **Siphons** for quick hits, **Floods** for double rewards, and **Survival** for sustained bulk. They're evergreen — unlike relic eras or a rotating \"best resource node,\" these don't churn every update."
        },
        {
          "type": "table",
          "table": {
            "columns": [
              "Method",
              "Where",
              "Rough yield",
              "Best for"
            ],
            "rows": [
              [
                "Kuva Siphon",
                "Rotating star-chart node (needs TWW)",
                "~600 base",
                "Fast, casual, low-effort runs"
              ],
              [
                "Kuva Flood",
                "One higher-level rotating node",
                "~1,200 base",
                "Double the reward, much higher level"
              ],
              [
                "Kuva Survival",
                "Kuva Fortress Survival node (Taveuni)",
                "Scales with time",
                "Sustained, high-volume farming"
              ],
              [
                "Daily Sortie",
                "Sortie reward table (chance)",
                "A few thousand",
                "Passive Kuva while doing dailies"
              ]
            ],
            "note": "Yields are approximate base amounts before boosters — DE tweaks numbers occasionally, so confirm current values on the live wiki."
          }
        },
        {
          "type": "p",
          "text": "A **Siphon** works like a mini-objective: you reach the Kuva Siphon device, it starts drawing in clouds of Kuva, and you destroy its four Kuva braids by **Void Dashing through (or shooting with your Amp) the incoming clouds in Operator form** — which is exactly why The War Within is a hard requirement. Kuva Guardians spawn to interfere while you work. Destroy all four braids and the siphon bursts, banking a lump of Kuva. A **Flood** is the same drill at a much higher enemy level for roughly double the payout. Chaining Siphons (and grabbing the Flood when it's up) across the map is the most efficient *casual* loop."
        }
      ]
    },
    {
      "id": "survival-fissure",
      "title": "The endurance meta: Kuva Survival + fissures",
      "blocks": [
        {
          "type": "p",
          "text": "For raw **Kuva-per-hour**, Kuva Survival on the Kuva Fortress is king. Instead of chasing markers across the map, you sit in one Survival mission and convert **Life Support Capsules into Kuva Harvesters** — each conversion banks a chunk of Kuva while you defend it, so the longer you last the more you pile up. Bring an AoE-clearing frame and reliable energy sustain so you never stop killing."
        },
        {
          "type": "p",
          "text": "The pro move is the **double-dip**: run Kuva Survival while it's flagged as a **Void Fissure**. You crack relics for platinum-worthy prime parts *and* pile up Kuva in the same run — two grinds, one mission. Endurance farmers stack this into multi-hour sessions for enormous hauls."
        },
        {
          "type": "links",
          "links": [
            {
              "label": "Which relics pay best per run",
              "to": "/relic-farming",
              "icon": "diamond-stone",
              "note": "Pick the fissure relic that funds your Kuva grind"
            },
            {
              "label": "Crack or sell? Relic value",
              "to": "/relics-value",
              "icon": "cash-multiple",
              "note": "Know what your fissure drops are worth"
            }
          ]
        },
        {
          "type": "warn",
          "text": "**Very long endurance runs carry a real risk.** A host migration on a multi-hour public run can drop you from the session, and there's no save-scumming Kuva — a crash or disconnect loses any gains since the last reward. Running solo or with a stable premade squad cuts the odds, and banking rewards steadily beats betting a whole session on one uninterrupted marathon."
        }
      ]
    },
    {
      "id": "boosters",
      "title": "Multiply your Kuva: boosters & companions",
      "blocks": [
        {
          "type": "p",
          "text": "The single most important lesson in Kuva farming: **it's not about the node, it's about your multipliers.** The same Siphon can pay 600 or 2,400+ depending on what's stacked on it."
        },
        {
          "type": "list",
          "items": [
            "**Resource Booster (2×)** — doubles every Kuva pickup for its duration, including the lump reward from a Siphon or Flood. The reliable baseline multiplier.",
            "**Loyal Retriever (companion mod)** — since **Update 37** the resource-doubling that used to live on the Smeeta's Charm is its own mod. It gives a flat **13% chance to double each Credit and Resource pickup — Kuva included** — is always on with no buff to wait for, and slots on any Beast companion (Kubrow, Kavat, etc.), not just a Smeeta.",
            "**Double-resource weekends** — DE's periodic events stack on top of a booster, pushing a Siphon or Flood toward 4×.",
            "**No more \"waiting for the buff\"** — the old trick of hoarding pickups until a Smeeta Charm resource-proc fired is gone as of Update 37. Doubling is now a passive per-pickup roll, so just keep killing and let it ride."
          ]
        },
        {
          "type": "tip",
          "text": "**The companion setup:** slot **Loyal Retriever** on a Beast companion for the 13% double-pickup chance that applies to Kuva. Plenty of farmers still bring a **Smeeta Kavat** on top — its Charm can roll a Rare Resource drop or tripled affinity — but the resource doubling itself no longer requires a Smeeta specifically."
        }
      ]
    },
    {
      "id": "per-hour",
      "title": "Kuva per hour: realistic expectations",
      "blocks": [
        {
          "type": "p",
          "text": "Rates swing hard with your frame, your booster uptime, and your route, so treat these as ballpark rather than gospel. The honest picture:"
        },
        {
          "type": "kv",
          "kv": [
            {
              "k": "Casual Siphon/Flood chaining (no boosters)",
              "v": "~5,000–10,000 Kuva/hr"
            },
            {
              "k": "Kuva Survival + resource booster (+ Loyal Retriever)",
              "v": "~15,000–25,000+ Kuva/hr"
            },
            {
              "k": "One max-cost Riven reroll",
              "v": "3,500 Kuva"
            },
            {
              "k": "So a boosted Survival hour buys roughly",
              "v": "4–7 rerolls"
            }
          ]
        },
        {
          "type": "info",
          "text": "The wild hour-to-hour swings older guides warn about — from waiting on a random Smeeta Charm resource proc — are gone. Loyal Retriever's doubling is a smooth 13% per pickup, so a farm is far more consistent than it used to be; your rate now tracks your frame, route and whether a booster or 2× weekend is running."
        }
      ]
    },
    {
      "id": "spending",
      "title": "Spending Kuva: Riven rerolls",
      "blocks": [
        {
          "type": "p",
          "text": "Rerolling a Riven's stats is done straight from the mod (it costs **only Kuva**). Don't confuse it with ranking the Riven up, which costs Endo + credits — Kuva reshuffles the stats, [Endo](/guides/endo) levels the mod. The reroll price climbs each cycle to a hard cap:"
        },
        {
          "type": "table",
          "table": {
            "columns": [
              "Reroll #",
              "Approx. Kuva cost"
            ],
            "rows": [
              [
                "1st",
                "900"
              ],
              [
                "2nd",
                "1,000"
              ],
              [
                "3rd",
                "1,200"
              ],
              [
                "4th",
                "1,400"
              ],
              [
                "…",
                "climbs each cycle"
              ],
              [
                "~10th and beyond",
                "3,500 (cap)"
              ]
            ],
            "note": "Approximate cost ladder — the exact middle values are best confirmed on the live wiki. Key facts: starts at 900, caps at 3,500."
          }
        },
        {
          "type": "quote",
          "text": "TFW you farm Kuva all day, and have nothing to show for it besides a higher roll count.",
          "cite": "r/Warframe"
        },
        {
          "type": "tip",
          "text": "Rerolls are **pure RNG** — a good Riven can roll into a bad one and back. Set a target before you start and check the [Riven value estimator](/riven-value) so you know when a roll is already worth more than the perfect roll you're chasing. If a Riven is hopeless, dissolving it for Endo via [/endo](/endo) is often smarter than pouring more Kuva in."
        },
        {
          "type": "links",
          "links": [
            {
              "label": "Riven value estimator",
              "to": "/riven-value",
              "icon": "chart-line",
              "note": "Is this roll worth keeping?"
            },
            {
              "label": "Endo / Plat value",
              "to": "/endo",
              "icon": "recycle",
              "note": "Dissolve dud Rivens for Endo"
            }
          ]
        }
      ]
    },
    {
      "id": "liches",
      "title": "Kuva Liches: same name, different system",
      "blocks": [
        {
          "type": "p",
          "text": "A **Kuva Lich** is an enemy nemesis — not the resource. You create one by killing a **Kuva Larvling** with a mercy finisher in a Grineer mission (available after The War Within). The Lich claims territory and drops a **Kuva weapon** with a random bonus (roughly 25–60%) when defeated."
        },
        {
          "type": "p",
          "text": "You don't spend the Kuva *resource* to beat a Lich. You vanquish it with your **Parazon** loaded with three **Requiem mods** in the correct order — and figuring out that order is its own puzzle. Requiem mods come from **Requiem Relics**. This layered RNG (relic → Requiem → correct sequence → weapon → good roll) is exactly what the subreddit loves to complain about."
        },
        {
          "type": "warn",
          "text": "Beginner trap: farming Kuva the resource will **never** get you a Kuva weapon, and hunting Liches won't fill your Kuva reserves for rerolls. They're separate grinds that just share a name."
        }
      ]
    }
  ],
  "videos": [
    {
      "id": "ETo_jzx1m1A",
      "title": "How To Farm Kuva in Warframe 2026 | Best Methods + Vendors",
      "channel": "Tipsy"
    },
    {
      "id": "6Ebs0Ws_GdQ",
      "title": "Kuva Farming Guide - All the ways to get Kuva",
      "channel": "QuadLyStop"
    },
    {
      "id": "9t6f01oAEIM",
      "title": "Best Ways To Farm Kuva In Warframe | Easy Guide (2025)",
      "channel": "ZombiGamEr4562"
    },
    {
      "id": "BQ8fMA0e43o",
      "title": "How to easy farm Kuva Lich Complete Beginner - Veteran Guide | Warframe 2025",
      "channel": "1WEAZEL1"
    }
  ],
  "related": [
    {
      "label": "Riven Mods Guide",
      "to": "/guides/riven",
      "icon": "dice-multiple",
      "note": "What your Kuva rerolls actually change"
    },
    {
      "label": "Riven Value Estimator",
      "to": "/riven-value",
      "icon": "chart-line",
      "note": "Know if a roll is worth the Kuva"
    },
    {
      "label": "Void Relics Guide",
      "to": "/guides/relics",
      "icon": "diamond-stone",
      "note": "Double-dip Kuva Survival fissures"
    },
    {
      "label": "Endo & Plat Value",
      "to": "/endo",
      "icon": "recycle",
      "note": "Dissolve dud Rivens instead of rerolling"
    },
    {
      "label": "Steel Path Guide",
      "to": "/guides/steel-path",
      "icon": "skull",
      "note": "Tougher Kuva Survival, richer runs"
    },
    {
      "label": "Community FAQ",
      "to": "/faq",
      "icon": "help-circle",
      "note": "More quick answers"
    }
  ],
  "faqs": [
    {
      "q": "What is Kuva used for in Warframe?",
      "a": "Kuva's main job is rerolling Riven mod stats — each reroll spends Kuva to reshuffle a Riven's buffs and drawback. It's also a crafting ingredient in a handful of blueprints (a few Warframes, Umbra Forma and some weapons). It has nothing to do with buying, crafting, or ranking up Warframes with plat. See the [Riven guide](/guides/riven) for how rerolling works."
    },
    {
      "q": "What's the best way to farm Kuva fast?",
      "a": "Chain Kuva Siphons and grab the Flood when it's up for quick, low-effort Kuva, or run Kuva Survival on the Kuva Fortress for sustained bulk. Pair either with a resource booster — and slot Loyal Retriever on a Beast companion for a 13% chance to double each Kuva pickup — to multiply the haul. Running Kuva Survival as a Void Fissure lets you crack [relics](/relic-farming) for plat at the same time."
    },
    {
      "q": "How much Kuva does it cost to reroll a Riven?",
      "a": "The first reroll costs about 900 Kuva, and the price climbs each cycle to a permanent cap of roughly 3,500 Kuva after about ten rolls. Rerolls are pure RNG, so check the [Riven value estimator](/riven-value) before you dump Kuva into a roll you might regret."
    },
    {
      "q": "What's the difference between Kuva and a Kuva Lich?",
      "a": "Kuva is a resource you farm to reroll Rivens. A Kuva Lich is an enemy nemesis you create by mercy-killing a Larvling and then hunt for a Kuva weapon. They share the 'Kuva' branding but are totally separate systems — you beat a Lich with Requiem mods and your Parazon, not by spending the Kuva resource."
    },
    {
      "q": "How do I unlock Kuva Siphons?",
      "a": "Complete the The War Within quest. After that, Kuva Siphon and Kuva Flood markers rotate onto star-chart nodes across the Origin System, and the Kuva Fortress with its Survival node opens up. You'll also need your Operator's Void abilities from that quest to actually destroy the siphon's braids. Check the [Quests guide](/guides/quests) for how to reach it."
    },
    {
      "q": "Does the Smeeta Kavat double Kuva?",
      "a": "Not through its Charm anymore. As of Update 37 (October 2024) the resource-doubling was moved off the Smeeta's Charm onto a separate mod, Loyal Retriever, which gives a flat 13% chance to double each resource pickup — Kuva included — and slots on any Beast companion (Kubrow, Kavat, etc.). A Smeeta is still handy for Charm's other buffs, but you no longer need one specifically to double your Kuva."
    },
    {
      "q": "Can you buy or trade Kuva?",
      "a": "No. Kuva is an untradeable resource and can't be purchased with platinum — you have to farm it. You can trade the Rivens you reroll with it, but never the Kuva itself. If you're after plat, see the [Platinum guide](/guides/platinum) instead."
    },
    {
      "q": "Do resource boosters work on Kuva?",
      "a": "Yes — a resource booster doubles all Kuva gains, and double-resource weekend events stack on top (up to about 4× with a booster running). Save your big rerolling sessions for boosted periods to stretch every run further."
    }
  ],
  "sources": [
    {
      "label": "So let me get this straight… RNG relics → Requiems → Kuva Liches → weapon rolls (r/Warframe)",
      "href": "https://reddit.com/r/Warframe/comments/dr46xo/so_let_me_get_this_straight_we_need_to_farm_rng/"
    },
    {
      "label": "TFW you farm Kuva all day and have nothing to show for it besides a higher roll count (r/Warframe)",
      "href": "https://reddit.com/r/Warframe/comments/ci5f0x/tfw_you_farm_kuva_all_day_and_have_nothing_to/"
    },
    {
      "label": "Kuva farming actually felt good during 2x weekend (r/Warframe)",
      "href": "https://reddit.com/r/Warframe/comments/b5a4za/kuva_farming_actually_felt_good_during_2x_weekend/"
    },
    {
      "label": "Warframe Wiki",
      "href": "https://wiki.warframe.com/"
    }
  ],
  "updated": "2026-07-18"
}

export default guide
