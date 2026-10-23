// Warframe Knowledge Center: Kuva farming and Riven spending.
// Substantively reviewed against official release notes on 2026-10-23.
// See the sources list for current mechanics and the historical cost changes.
// Single content source for /guides/kuva (rendered by <GuideArticle>).
import type { Guide } from './types'

const guide: Guide = {
  "slug": "kuva",
  "eyebrow": "Knowledge Center · Kuva Farming",
  "title": "Kuva Farming Guide: Sources, Boosters & Riven Costs",
  "lede": "Plan your Kuva farming around the Riven rolls you can afford. Claim the one-time 100,000 Kuva login gift, compare vendor offers and mission rewards, and budget ordinary Trait Locking separately from protected spliced traits.",
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
      "label": "max Kuva without ordinary Trait Locking",
      "tone": "gold"
    },
    {
      "num": "7,000",
      "label": "max Kuva with ordinary Trait Locking",
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
          "text": "**Kuva** is a resource used to cycle the randomized stats on **Riven mods** and craft items from certain Foundry blueprints, including Umbra Forma. Ordinary Trait Locking preserves one existing trait at double the usual cycling cost. A protected spliced trait alone has no Kuva surcharge."
        },
        {
          "type": "p",
          "text": "Several systems share the Kuva name. For Riven cycling, you need the regular red **Kuva resource**. **Entropic Kuva**, introduced in Update 44, is a separate resource used for exchanges with Cephalon Melica."
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
              "k": "Siphon access",
              "v": "The War Within completed and Mastery Rank 5"
            },
            {
              "k": "Can it be traded?",
              "v": "No player-to-player resource trading; vendor exchanges are available"
            }
          ]
        },
        {
          "type": "info",
          "text": "**Match the resource to the goal.** Regular Kuva pays for Riven cycles. Entropic Kuva pays for Melica’s wares. Kuva Siphons and Floods are missions; Kuva Liches are nemesis enemies; Kuva weapons are their weapon rewards."
        }
      ]
    },
    {
      "id": "arsenal-retuning",
      "title": "Hotfix 44.1.3: claim the 100,000 Kuva login gift",
      "blocks": [
        {
          "type": "p",
          "text": "**Log in after Hotfix 44.1.3 to receive 2 built Forma and 100,000 Kuva.** The [Arsenal Retuning inbox](https://www.warframe.com/en/patch-notes/pc/44-1-3) is available to all players until **December 31, 2026 at 11:59 p.m. ET**. Check your inbox after logging in; this is a one-time reward."
        },
        {
          "type": "info",
          "text": "Players who installed a Riven Splicer in a Riven Mod before Hotfix 44.1.3 also qualify for a **separate 1 Riven Splicer and 100,000 Kuva inbox**. The patch notes specify a delivery script for that compensation. Owning an unused Splicer is not the stated eligibility condition. Use the [Riven guide](/guides/riven) to check the current Splicing rules before spending."
        }
      ]
    },
    {
      "id": "unlock",
      "title": "Unlocking Kuva farming",
      "blocks": [
        {
          "type": "p",
          "text": "**Kuva Siphon missions require The War Within and Mastery Rank 5.** The quest also opens the Kuva Fortress. Other sources, including vendors and Zariman content, have their own access requirements; completing one quest does not unlock every Kuva source."
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
              "p": "Finish the quest and reach Mastery Rank 5 to access Kuva Siphon missions. Your Operator’s Void abilities are part of handling the Siphon objective."
            },
            {
              "h": "Watch the star chart",
              "p": "Kuva Siphon and Kuva Flood markers now rotate onto nodes across the Origin System, refreshing on a timer."
            },
            {
              "h": "Open the Kuva Fortress",
              "p": "Reach Taveuni on the Kuva Fortress to try Kuva Survival. Choose a loadout that can both defend Harvesters and sustain life support."
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
          "text": "**Siphons and Floods** offer a Kuva objective within a regular mission. **Kuva Survival** lets you repeat Harvester defenses in one session. Compare these with vendor exchanges you have unlocked before committing to a long run."
        },
        {
          "type": "table",
          "table": {
            "columns": [
              "Method",
              "Where",
              "Rough yield",
              "What to consider"
            ],
            "rows": [
              [
                "Kuva Siphon",
                "Rotating star-chart node; The War Within and MR 5",
                "~600 base",
                "Complete the Siphon objective and the mission"
              ],
              [
                "Kuva Flood",
                "Higher-level rotating Siphon mission",
                "~1,200 base",
                "Roughly double the Siphon yield with tougher enemies"
              ],
              [
                "Kuva Survival",
                "Taveuni, Kuva Fortress",
                "200 base per completed Harvester",
                "Defend Harvesters while maintaining life support"
              ],
              [
                "Vendor exchanges",
                "Unlocked vendors, including Cephalon Melica",
                "Check each offer and purchase limit",
                "Spend the required currency instead of repeating Siphons"
              ]
            ],
            "note": "Siphon and Flood amounts are approximate base yields. A Harvester must finish its defense to award Kuva. Vendor quantities and eligible mission rewards follow different booster rules."
          }
        },
        {
          "type": "p",
          "text": "At a **Kuva Siphon**, intercept the incoming Kuva clouds with your Operator’s Void abilities or Amp to destroy its four braids. Defend yourself from the accompanying enemies and finish the mission. A **Kuva Flood** uses the same objective with higher-level enemies and a larger Kuva reward."
        }
      ]
    },
    {
      "id": "melica-entropic-kuva",
      "title": "Update 44: Melica’s weekly Kuva exchange",
      "blocks": [
        {
          "type": "p",
          "text": "**Entropic Eximus** in Zariman missions drop **Entropic Kuva**, a separate resource. Take it to **Cephalon Melica** at **Yuvan’s Peak** or the **Chrysalith** and open **Classroom Supplies**. The Chrysalith offers a Fast Travel option for her shop."
        },
        {
          "type": "kv",
          "kv": [
            {
              "k": "Regular Kuva per purchase",
              "v": "10,500"
            },
            {
              "k": "Purchase limit",
              "v": "4 per week"
            },
            {
              "k": "Total if you buy all four",
              "v": "42,000 regular Kuva per week"
            },
            {
              "k": "Currency to bring",
              "v": "Entropic Kuva; check the shop for the current price"
            }
          ]
        },
        {
          "type": "p",
          "text": "Yuvan’s Peak requires both **Angels of the Zariman** and **Whispers in the Walls**. Melica also sells Narin and weapon blueprints, so decide how much Entropic Kuva to reserve for those before buying regular Kuva."
        },
        {
          "type": "info",
          "text": "**Entropic Kuva does not directly pay for Riven cycles.** The exchange gives you regular Kuva, which you can then spend on cycling. The 42,000 total is calculated as 10,500 × 4, subject to having the shop currency and remaining weekly purchases."
        },
        {
          "type": "tip",
          "text": "**Prepare for Entropic Eximus resistance.** [Hotfix 44.0.1](https://www.warframe.com/en/patch-notes/pc/44-0-1) explains that they heavily resist non-melee damage. Fight inside the bubble with a suitable melee weapon; breaking the bubble does not remove that resistance. [Hotfix 44.0.2](https://www.warframe.com/en/patch-notes/pc/44-0-2) fixed resistance applying twice and missing Entropic Kuva drops from Mirage clone kills."
        }
      ]
    },
    {
      "id": "vendor-exchanges",
      "title": "Update 44.1: compare Kuva vendor offers",
      "blocks": [
        {
          "type": "p",
          "text": "[Update 44.1](https://www.warframe.com/en/patch-notes/pc/44-1-0) improved several Kuva exchanges. Check the vendors you have unlocked and the currencies already in your inventory before choosing another mission farm. These offers give regular Kuva; Melica’s Entropic Kuva exchange remains a separate option."
        },
        {
          "type": "table",
          "table": {
            "columns": ["Vendor offer", "Cost per purchase", "Regular Kuva", "Weekly purchase limit"],
            "rows": [
              ["Acrithis’ Wares", "10 Pathos Clamps", "10,000", "Not specified in the update; check the shop"],
              ["Acrithis: Exchange Scuttler Husks", "25 Scuttler Husks", "14,000", "3"],
              ["Flare’s Memorabilia", "100 Heartstrings", "14,000", "3"],
              ["Nightcap’s Wares", "75 Fergolyte", "14,000", "3"],
              ["Hunhow’s Keepsakes", "35 Emerald Talents AND 35 Crimson Talents", "17,000", "3"]
            ],
            "note": "Quantities and stated limits follow Update 44.1. The Pathos Clamp offer has no purchase limit stated in those notes; that is not confirmation of unlimited purchases. Vendor bundles are not doubled by Resource Boosters."
          }
        },
        {
          "type": "tip",
          "text": "**Compare the currency cost, not just the bundle size.** Three 14,000-Kuva purchases give 42,000 Kuva: enough for 12 cycles at the 3,500 base cap, or 6 with ordinary Trait Locking at 7,000. Reserve currencies needed for other rewards first. A larger Kuva bundle is not automatically faster to earn."
        }
      ]
    },
    {
      "id": "survival-fissure",
      "title": "Kuva Survival and Requiem Fissures",
      "blocks": [
        {
          "type": "p",
          "text": "On **Taveuni**, marked enemies carry **Kuva Catalysts**. Bring one to an unused Life Support Tower to convert it into a Harvester, then protect it for **1 minute**. A completed defense awards **200 base Kuva** to the squad and a small amount of life support. If the Harvester is destroyed, you lose that Harvester’s Kuva reward and the tower."
        },
        {
          "type": "p",
          "text": "When Kuva Survival is available as a **Requiem Fissure**, bring **Requiem Relics** to open alongside the Harvester objectives. Their rewards include Requiem Mods, Kuva, Riven Slivers and Exilus Weapon Adapter Blueprints. These are not Lith, Meso, Neo or Axi relics, so this route does not open those relics for Prime parts. Check the active mission type before choosing your relic."
        },
        {
          "type": "links",
          "links": [
            {
              "label": "Understand relic types",
              "to": "/guides/relics",
              "icon": "diamond-stone",
              "note": "Distinguish Requiem rewards from Prime relic rewards"
            },
            {
              "label": "Crack or sell? Relic value",
              "to": "/relics-value",
              "icon": "cash-multiple",
              "note": "Compare the Prime relics used in separate farming runs"
            }
          ]
        },
        {
          "type": "warn",
          "text": "**Keep the run sustainable.** Converting every available tower can leave too little life support. Watch the mission meter, protect each Harvester, and extract when your squad can no longer maintain both objectives. A longer session is not automatically a better use of your time."
        }
      ]
    },
    {
      "id": "boosters",
      "title": "Boosters and companion mods: what they affect",
      "blocks": [
        {
          "type": "p",
          "text": "A **Resource Booster** can double eligible Kuva rewards from Siphons, Floods and completed Survival Harvesters. This does not mean every source of Kuva is doubled: vendor purchases and fixed reward-table bundles are not resource pickups."
        },
        {
          "type": "list",
          "items": [
            "**Resource Booster (2×)** — increases eligible resource amounts. A Resource Drop Chance Booster affects drop chances instead; it is not another automatic doubling of a Siphon or Harvester reward.",
            "**Resourceful Retriever** — at maximum rank, gives a passive **18% chance** to double a resource pickup. It is the resource-focused variant for Beast companions.",
            "**Loyal Retriever** — at maximum rank, gives a passive **13% chance** to double a resource or Credit pickup. Both Retriever options exclude **Venari**.",
            "**Smeeta Charm changed in Update 37** — its old resource-doubling buff was removed. Use the relevant Retriever mod for pickup doubling; do not wait for the old Charm resource buff."
          ]
        },
        {
          "type": "tip",
          "text": "**Plan with eligible rewards.** Retriever chances are random per pickup, not a guaranteed increase on every mission reward. Check the source before applying a multiplier, and count Melica’s listed Kuva bundle at its stated quantity."
        }
      ]
    },
    {
      "id": "per-hour",
      "title": "Turn a Kuva budget into a reroll limit",
      "blocks": [
        {
          "type": "p",
          "text": "Your yield depends on mission duration, completed objectives, boosters and squad performance. A spending budget is easier to check than a promised hourly farming rate. For a Riven already at the maximum base cycle cost, a **35,000 Kuva** budget buys:"
        },
        {
          "type": "kv",
          "kv": [
            {
              "k": "Example budget",
              "v": "35,000 Kuva"
            },
            {
              "k": "Without ordinary Trait Locking",
              "v": "3,500 per cycle → 10 cycles"
            },
            {
              "k": "With ordinary Trait Locking",
              "v": "7,000 per cycle → 5 cycles"
            },
            {
              "k": "Earlier cycles",
              "v": "Lower base costs; check the price shown before cycling"
            }
          ]
        },
        {
          "type": "info",
          "text": "This is arithmetic, not a farming-rate estimate: 35,000 ÷ 3,500 = 10 and 35,000 ÷ 7,000 = 5. A protected spliced trait alone uses the normal price; adding ordinary Trait Locking doubles it. Set your stopping point before cycling, and reserve any Kuva you need for crafting."
        }
      ]
    },
    {
      "id": "spending",
      "title": "Spending Kuva: Riven rerolls",
      "blocks": [
        {
          "type": "p",
          "text": "Use **Cycle Riven** in the Mod Segment to reroll with Kuva. Ranking the mod up instead uses [Endo](/guides/endo) and Credits. Without ordinary Trait Locking, cycling starts at **900 Kuva** and rises to a **3,500 Kuva** cap, including when a spliced trait is protected. Ordinary Trait Locking doubles the displayed base price."
        },
        {
          "type": "table",
          "table": {
            "columns": [
              "Cycle",
              "Without ordinary Trait Locking",
              "With ordinary Trait Locking"
            ],
            "rows": [
              [
                "1st",
                "900",
                "1,800"
              ],
              [
                "2nd",
                "1,000",
                "2,000"
              ],
              [
                "3rd",
                "1,200",
                "2,400"
              ],
              [
                "4th",
                "1,400",
                "2,800"
              ],
              [
                "Later cycles",
                "Base cost increases toward the cap",
                "Twice the displayed base cost"
              ],
              [
                "At the base cost cap",
                "3,500",
                "7,000"
              ]
            ],
            "note": "Costs are Kuva per cycle. Applying or removing ordinary Trait Locking is free; cycling with it doubles the price. A protected spliced trait alone does not double the cost."
          }
        },
        {
          "type": "info",
          "text": "**Two protections, different costs.** Ordinary Trait Locking preserves one existing trait and is cleared when you close the Cycling menu. Riven Splicing protects a spliced trait separately without a surcharge; both can be used together. Either system fixes the positive/negative layout. Clear the ordinary lock and remove any spliced trait by unlocking and cycling it off before trying for a different layout. See the [Riven guide](/guides/riven) for the full process."
        },
        {
          "type": "tip",
          "text": "After cycling, you can keep the previous result or accept the new one. Keeping the old result does not refund the Kuva or undo the cycle count. A lock preserves one trait; it does not let you choose the remaining random traits. Use the [Riven value estimator](/riven-value) as a market reference and stop when the result meets your build and budget."
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
          "text": "A **Kuva Lich** is a nemesis enemy associated with **Kuva weapons**. The Kuva resource used for cycling Rivens is a different part of the game. If your goal is a weapon, follow the Lich system rather than spending your session on Siphon farming."
        },
        {
          "type": "p",
          "text": "Lich progression uses **Requiem mods** and the **Parazon**. Requiem Relics provide those mods, which is why Requiem Fissures can fit into a Lich hunt. Rerolling a weapon’s Riven is a separate decision that uses your regular Kuva reserve."
        },
        {
          "type": "warn",
          "text": "**Choose the goal first:** hunting a Kuva weapon, opening Requiem Relics and collecting Kuva for Rivens are related activities with different rewards. A stockpile of the resource does not itself buy a Lich’s weapon."
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
      "note": "Understand Requiem and Prime relic rewards"
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
      "note": "Prepare for higher-level missions and their rewards"
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
      "a": "Kuva is used to cycle Riven mod stats and craft items from some Foundry blueprints. Ordinary Trait Locking doubles the cycle cost; a protected spliced trait alone does not. See the [Riven guide](/guides/riven) for the full rules."
    },
    {
      "q": "What's the best way to farm Kuva fast?",
      "a": "Choose a source that fits your unlocks and session: Siphons or Floods for individual missions, Taveuni Survival for repeated Harvester defenses, or available vendor exchanges. Compare Melica’s 10,500-Kuva exchange with Update 44.1 offers from Acrithis, Flare, Nightcap and Hunhow. Check the currency cost and remaining purchases; there is no single fastest option for every account."
    },
    {
      "q": "How much Kuva does it cost to reroll a Riven?",
      "a": "Without ordinary Trait Locking, the first cycle costs 900 Kuva and later cycles rise to a 3,500 cap. A protected spliced trait alone keeps those prices. Ordinary Trait Locking doubles them to 1,800 initially and 7,000 at the cap. Applying or removing that lock is free. You can keep your previous result after cycling, but the Kuva remains spent."
    },
    {
      "q": "What's the difference between Kuva and a Kuva Lich?",
      "a": "Kuva is a resource used for Riven cycling and crafting. A Kuva Lich is a nemesis enemy hunted for a Kuva weapon. Lich progression uses Requiem mods and the Parazon; having regular Kuva does not replace that process."
    },
    {
      "q": "How do I unlock Kuva Siphons?",
      "a": "Complete The War Within and reach Mastery Rank 5. Kuva Siphon and Flood missions then appear on rotating star-chart nodes. Use your Operator’s Void abilities or Amp to intercept the clouds during the Siphon objective. See the [Quests guide](/guides/quests) for story progression."
    },
    {
      "q": "Does the Smeeta Kavat double Kuva?",
      "a": "Smeeta’s Charm no longer provides its old resource-doubling buff. Update 37 moved pickup doubling to Retriever mods for Beast companions, excluding Venari. At maximum rank, Resourceful Retriever gives an 18% resource-pickup doubling chance; Loyal Retriever gives 13% for resource or Credit pickups. Neither guarantees that every Kuva reward is doubled."
    },
    {
      "q": "Can you buy or trade Kuva?",
      "a": "Regular Kuva cannot be traded directly between players, but vendors exchange other currencies for it. Melica accepts Entropic Kuva; Update 44.1 also improved offers from Acrithis, Flare, Nightcap and Hunhow. The vendor comparison above lists quantities, currencies and stated weekly limits."
    },
    {
      "q": "Do resource boosters work on Kuva?",
      "a": "Resource Boosters affect eligible Kuva gains such as Siphon, Flood and completed Harvester rewards. They do not double every source: vendor purchases and fixed reward-table bundles are not resource pickups. A Resource Drop Chance Booster changes drop chances, not the amount of every Kuva reward."
    }
  ],
  "sources": [
    {
      "label": "Warframe — Hotfix 44.1.3: Arsenal Retuning login reward and Splicer compensation (October 22, 2026)",
      "href": "https://www.warframe.com/en/patch-notes/pc/44-1-3"
    },
    {
      "label": "Update 44.1: The Icebind — Kuva vendor offers and Riven Splicing",
      "href": "https://www.warframe.com/en/patch-notes/pc/44-1-0"
    },
    {
      "label": "Warframe — Hotfix 44.1.1: corrected Spliced Riven cycling cost",
      "href": "https://www.warframe.com/en/patch-notes/pc/44-1-1"
    },
    {
      "label": "Update 44: Iceblade of Narin — Melica, Entropic Kuva and Trait Locking",
      "href": "https://www.warframe.com/en/patch-notes/pc/44-0-0"
    },
    {
      "label": "Warframe — Hotfix 44.0.1: Entropic Eximus resistance",
      "href": "https://www.warframe.com/en/patch-notes/pc/44-0-1"
    },
    {
      "label": "Warframe — Hotfix 44.0.2: Entropic Eximus fixes",
      "href": "https://www.warframe.com/en/patch-notes/pc/44-0-2"
    },
    {
      "label": "Riven Expansion — official Trait Locking workshop",
      "href": "https://forums.warframe.com/topic/1523869-riven-expansion-trait-locking-riven-splicing/"
    },
    {
      "label": "Update 37 — Retriever mods and Smeeta Charm changes",
      "href": "https://www.warframe.com/en/patch-notes/pc/37-0-0"
    },
    {
      "label": "Update 35 — Kuva Siphon access requirements",
      "href": "https://www.warframe.com/en/patch-notes/pc/35-0-0"
    },
    {
      "label": "Update 22.17.0 — Kuva Survival mechanics and booster eligibility",
      "href": "https://www.warframe.com/en/patch-notes/pc/22-17-0"
    },
    {
      "label": "Relic Hunting 101 — official Requiem Relic rewards guide",
      "href": "https://www.warframe.com/en/news/relic-hunting-101"
    },
    {
      "label": "Update 19.0.6 — cycle costs and choosing the previous result",
      "href": "https://www.warframe.com/en/patch-notes/pc/19-0-6"
    },
    {
      "label": "Update 19.4 — base Kuva cycle cost capped at 3,500",
      "href": "https://www.warframe.com/en/patch-notes/pc/19-4-1"
    },
    {
      "label": "Warframe Wiki — Kuva Siphon base reward ranges",
      "href": "https://warframe.fandom.com/wiki/Kuva_Siphon"
    }
  ],
  "updated": "2026-10-23"
}

export default guide
