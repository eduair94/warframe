// Warframe Knowledge Center guide content — /guides/endo.
// Reward tables and mechanics reviewed against the linked sources on 2026-10-23.
// Rendered by <GuideArticle>; the comparison tool lives at /endo.
import type { Guide } from './types'

const guide: Guide = {
  "slug": "endo",
  "eyebrow": "Knowledge Center · Endo",
  "title": "Endo Farming Guide",
  "lede": "Compare Endo farms for your progression: weekly Ayatan hunts, duplicate mods, bounties, Arbitrations and the Sedna arena. A rank-10 Primed mod costs 40,920 Endo from unranked. Learn which rewards are random, which boosters help, and when buying a filled sculpture is worth considering.",
  "category": "farming",
  "readMins": 11,
  "stats": [
    {
      "num": "1,500",
      "label": "Endo when Arbitration Rotation C rolls Endo",
      "tone": "gold"
    },
    {
      "num": "3,450",
      "label": "Endo from a socketed Anasa",
      "tone": "good"
    },
    {
      "num": "40,920",
      "label": "Endo to max a rank-10 Primed mod from unranked",
      "tone": "alt"
    },
    {
      "num": "2×",
      "label": "enemy Endo drop chance with a Mod Drop Chance Booster"
    }
  ],
  "sections": [
    {
      "id": "why",
      "title": "What Endo is and where it comes from",
      "blocks": [
        {
          "type": "p",
          "text": "Endo is the currency used to upgrade mods through Fusion. You spend Endo plus [credits](/guides/credits) to raise a mod’s rank. Endo itself is **untradeable** between players, but tradeable Ayatan Sculptures and mods can be converted into it. See the [modding guide](/guides/mods) for how ranking works."
        },
        {
          "type": "list",
          "ordered": false,
          "items": [
            "**Endo orbs** — blue-and-gold pickups enemies and containers drop in three sizes: 15 (small), 50 (medium), 80 (large).",
            "**Mission and bounty rewards** — some reward tables include Endo bundles. The listed quantity is what you receive if that reward is selected, not a guaranteed payout on every run.",
            "**Arbitrations** — reward tables offer 900 / 1,200 / 1,500 Endo in rotations A / B / C, alongside sculptures and other rewards.",
            "**Ayatan Sculptures** — socket them with Ayatan Stars and dissolve at Maroo for 1,425–3,450 Endo each.",
            "**Conversion** — dissolve duplicate mods, scrap Railjack wreckage, or dump a heavily-rerolled [Riven](/guides/riven) for a one-off lump."
          ]
        },
        {
          "type": "warn",
          "title": "Mod Drop Chance helps enemy drops, not reward tables",
          "text": "A **Mod Drop Chance Booster doubles the chance that enemies drop Endo**; it does not double the value of each pickup. Resource Boosters, Resource Drop Chance Boosters and resource drop blessings do not boost Endo. The Steel Path’s mod-drop-chance bonus also helps eligible enemy drops. None of these bonuses increase Endo awarded by a mission or bounty reward table, or the value of a dissolved mod or sculpture."
        }
      ]
    },
    {
      "id": "best-farms",
      "title": "Best Endo farms by stage and effort",
      "blocks": [
        {
          "type": "p",
          "text": "Start with the farms your account can complete reliably. Maroo and duplicate mods are accessible supplements; bounties work well when you also need their other rewards. Arbitrations suit longer sessions, while a coordinated Vodyanoi squad can focus on enemy Endo drops. Compare your own completed runs, including loading and extraction time, before choosing a farm."
        },
        {
          "type": "table",
          "table": {
            "columns": [
              "Farm",
              "Where / node",
              "Endo yield",
              "Best for"
            ],
            "rows": [
              [
                "Arbitrations (Survival/Defense)",
                "Hourly alert; complete the Eris Junction Focus Lens task on Pluto",
                "900 / 1,200 / 1,500 Endo if the A / B / C Endo reward rolls; sculptures are separate outcomes",
                "Veterans, solo-friendly"
              ],
              [
                "Vodyanoi — Rathuum arena (Steel Path)",
                "Sedna › Vodyanoi",
                "Enemy drops; results depend on kill speed, loot abilities and Mod Drop Chance bonuses",
                "Coordinated squads with suitable builds"
              ],
              [
                "1999 / Höllvania bounties",
                "Höllvania Central Mall (after The Hex)",
                "Level 95–100 bounty: 3,300 Endo at 13.73% or 4,200 at 15.69%; other tiers differ",
                "Repeatable bounties after The Hex"
              ],
              [
                "Deimos / Cambion Drift bounties",
                "Cambion Drift (L40–60)",
                "1,000 Endo at 45.45% on stage 1; 28.57% on stages 2–3; 22.22% on stage 4",
                "Pre-Arbitration / pre-Steel-Path"
              ],
              [
                "Zariman bounties (T4/5 Exterminate)",
                "The Chrysalith",
                "Level 90–95 and 110–115: 3,000 Endo at 11.36% or 4,000 at 9.74%",
                "By-product of Zariman gear runs"
              ],
              [
                "Ayatan sculptures (socketed)",
                "Dissolve at Maroo's Bazaar, Mars",
                "1,425–3,450 per fully-socketed sculpture",
                "Passive, all levels"
              ],
              [
                "Railjack wreckage scrap",
                "Dry Dock › Configure",
                "225 Endo per unwanted MK III wreckage part; check the scrap preview",
                "Players collecting Railjack wreckage"
              ],
              [
                "Archon Hunt (weekly)",
                "Navigation › Archon Hunt (after Veilbreaker)",
                "8,000 Endo is one possible weekly completion reward; it is not guaranteed",
                "Weekly bonus, run it for the Shard"
              ],
              [
                "Dissolving duplicate mods",
                "Orbiter › Mods segment",
                "5 / 10 / 15 Endo per unranked common/uncommon/rare",
                "Any MR, cleanup not a farm"
              ]
            ],
            "note": "Reward quantities and chances were checked against the official PC drop tables on October 23, 2026. These are per reward roll, not measured hourly farming rates. Sculpture values assume all required stars are installed."
          }
        },
        {
          "type": "info",
          "title": "Build a loot squad for Vodyanoi",
          "text": "Vodyanoi on Sedna is an enemy-drop farm. A squad can combine Nekros’s Desecrate with Khora’s Pilfering Strangledome, plus grouping and damage support. They act at different loot stages; multiple Nekros cannot repeatedly Desecrate the same corpse. A Mod Drop Chance Booster and the Steel Path’s mod-drop bonus help this route, but a slower clear can offset the benefit. Agree on roles before joining a dedicated squad; no fixed Endo-per-minute rate is guaranteed."
        },
        {
          "type": "tip",
          "title": "Compare Normal and Steel Path bounty completion time",
          "text": "Steel Path’s drop bonuses do not multiply a bounty’s listed Endo reward. Check the active bounty’s reward pool and choose the difficulty you can complete efficiently; extra standing, currencies or Steel Essence may matter for your other goals. For enemy-drop farms such as Vodyanoi, the mod-drop bonus is relevant, so compare clear speed as well as difficulty."
        },
        {
          "type": "video",
          "video": {
            "id": "K6neW7Fp7vM",
            "title": "You're Farming Endo Wrong – Do THIS Instead! (Top 5 Warframe Guide)",
            "channel": "iFlynn"
          }
        }
      ]
    },
    {
      "id": "ayatan",
      "title": "The Ayatan Sculpture route",
      "blocks": [
        {
          "type": "p",
          "text": "Ayatan Sculptures are the reliable, all-level Endo pipeline. You collect sculptures, fill their color-coded sockets with Ayatan Stars, then dissolve them at Maroo's Bazaar (Mars) for a big lump. It is a supplement rather than a fast per-hour farm, but almost everyone should be doing the free weekly and socketing what they find."
        },
        {
          "type": "steps",
          "steps": [
            {
              "h": "Collect sculptures",
              "p": "Look for sculptures hidden in eligible missions, collect them from reward tables such as Arbitrations and Sorties, or buy specific sculptures from their vendors. Anasa is a possible Sortie reward (28%) and Archon Hunt reward; Maroo’s weekly hunt does not award it. Stars found in containers are separate pickups."
            },
            {
              "h": "Do Maroo's weekly Ayatan Treasure Hunt",
              "p": "After Stolen Dreams, speak to Maroo at her Bazaar on Mars for a weekly Ayatan Treasure Hunt. Complete the timed treasure room and extract with the sculpture. The reward is one of six sculptures: Sah, Ayr, Orta, Vaya, Piv or Valana; it does not include Anasa. The weekly reset is Monday at 00:00 UTC."
            },
            {
              "h": "Socket before you dissolve",
              "p": "Slot Cyan Stars into blue sockets and Amber into orange. Once slotted a star is permanent. A socketed sculpture is worth far more than the empty sculpture plus the loose stars — always fill it first."
            },
            {
              "h": "Dissolve at Maroo",
              "p": "Take the socketed sculpture to Maroo and use \"Trade Treasures\" — extraction is free (the old credit cost was removed in 2017). The Endo drops straight into your pool."
            }
          ]
        },
        {
          "type": "table",
          "table": {
            "columns": [
              "Sculpture",
              "Sockets (C+A)",
              "Empty Endo",
              "Fully socketed",
              "Source note"
            ],
            "rows": [
              [
                "Anasa",
                "2C + 2A",
                "2,000",
                "3,450",
                "Sortie (28%) / Archon only — never the weekly"
              ],
              [
                "Kitha",
                "4C + 1A",
                "450",
                "3,000",
                "Loid’s Necraloid offerings"
              ],
              [
                "Orta",
                "3C + 1A",
                "650",
                "2,700",
                "Maroo’s weekly hunt and mission rewards"
              ],
              [
                "Zambuka",
                "2C + 1A",
                "450",
                "2,600",
                "Arbitration Honors; bought with Vitus Essence"
              ],
              [
                "Hemakara",
                "2C + 1A",
                "450",
                "2,600",
                "Past Operation: Orphix Venom and Nightwave rewards"
              ],
              [
                "Chattraka",
                "2C + 1A",
                "450",
                "2,600",
                "Nightcap, Rank 3: Seeker; one purchase per week"
              ],
              [
                "Vaya",
                "2C + 1A",
                "400",
                "1,800",
                "Maroo’s weekly hunt and hidden mission sculptures"
              ],
              [
                "Piv",
                "2C + 1A",
                "375",
                "1,725",
                "Maroo’s weekly hunt and hidden mission sculptures"
              ],
              [
                "Valana",
                "2C + 1A",
                "325",
                "1,575",
                "Maroo’s weekly hunt and hidden mission sculptures"
              ],
              [
                "Sah",
                "2C + 1A",
                "300",
                "1,500",
                "Maroo’s weekly hunt and hidden mission sculptures"
              ],
              [
                "Ayr",
                "3C + 0A",
                "325",
                "1,425",
                "Maroo’s weekly hunt; no Amber needed"
              ]
            ],
            "note": "Loose star dissolve values: Cyan Star = 50 Endo, Amber Star = 100 Endo. Socketing beats dissolving loose — e.g. a socketed Anasa is 3,450 vs ~2,300 for the empty Anasa plus its 4 stars dissolved separately."
          }
        },
        {
          "type": "warn",
          "title": "Check your star supply before filling sculptures",
          "text": "Both Cyan and Amber Stars can come from containers and lockers; neither is guaranteed per mission. Cambion Drift bounties offer Amber Stars in selected reward pools. The reusable Amber Star blueprint costs 10 Vitus Essence at Arbitration Honors; each craft uses 2 Cyan Stars, 1 Vitus Essence and 100,000 credits. Compare that cost with farming more stars. Ayr needs only Cyan Stars. Sculptures and stars require manual pickup: Vacuum and Fetch do not collect them. Loot Radar helps you find them."
        },
        {
          "type": "video",
          "video": {
            "id": "-hWq1QPXTQ8",
            "title": "How To Turn Ayatan Sculptures & Stars Into Endo!!! Warframe!",
            "channel": "Sethbest"
          }
        }
      ]
    },
    {
      "id": "arbitrations",
      "title": "Arbitrations — the veteran Endo engine",
      "blocks": [
        {
          "type": "p",
          "text": "Arbitrations are hourly rotating endless alerts. Unlock them through the **Equip a Focus Lens** task in the Eris Junction on Pluto; clearing every Star Chart node is no longer required. Each completed reward rotation grants 1 Vitus Essence plus a roll on the reward table. That roll may be Endo, a sculpture, a mod or another listed reward — Endo is not guaranteed."
        },
        {
          "type": "kv",
          "kv": [
            {
              "k": "Rotation A",
              "v": "900 Endo at 44%"
            },
            {
              "k": "Rotation B",
              "v": "1,200 Endo at 44.5%"
            },
            {
              "k": "Rotation C",
              "v": "1,500 Endo at 35%"
            },
            {
              "k": "Rotation pattern",
              "v": "AABBCCCC… in most modes; Disruption uses its own round-and-conduit reward tiers"
            },
            {
              "k": "What determines your return",
              "v": "Rotation completion time, random reward rolls, survival and stars available for sculptures"
            }
          ]
        },
        {
          "type": "p",
          "text": "The official drop tables list the chances above. Update 41.1 raised Rotation C’s 1,500-Endo reward chance from 33% to 35% and its 3-Vitus-Essence bundle from 7% to 10%. These are alternative reward-table outcomes; the bundle is separate from the Vitus Essence granted for completing a rotation."
        },
        {
          "type": "steps",
          "steps": [
            {
              "h": "Pick the active node and mode",
              "p": "Choose a mode your loadout can sustain. Survival rewards arrive every 5 minutes and Defense rewards every 5 waves. Disruption gives one reward per completed round; the round and number of conduits defended determine the reward tier, not one reward per conduit."
            },
            {
              "h": "Bring a tanky, self-sufficient loadout",
              "p": "Destroy Arbitration Shield Drones to remove their protection from nearby enemies. Ordinary self-revives are disabled. Surviving squadmates can collect 5 Resurgence Tokens and bring them to a fallen ally’s revive tower; carrying tokens reduces health and shields and drains energy. Avoid relying on a revive in solo play."
            },
            {
              "h": "Stay through multiple rotations",
              "p": "In Survival and Defense, the first four rewards follow AABB; later rewards use Rotation C. That means a chance at 1,500 Endo, not a guaranteed payout. Collect loose Endo between rounds and manually pick up any Ayatan Stars you find."
            },
            {
              "h": "Cash out",
              "p": "Extract, socket any sculptures that dropped, and dissolve them at Maroo for the bonus."
            }
          ]
        },
        {
          "type": "info",
          "title": "Drone drops and rotation rewards are separate",
          "text": "Arbitration Shield Drones can drop both Endo and Vitus Essence from separate drop tables. These enemy drops are separate from the rewards granted for completing a rotation. A booster that affects a drone’s drops still does not increase the Endo amount in the rotation reward table."
        },
        {
          "type": "video",
          "video": {
            "id": "Oaa3EdSFpiE",
            "title": "Arbitrations: Vitus Essence, Rolling Guard, Aura FORMA - Warframe Guide",
            "channel": "KardinalxSin"
          }
        }
      ]
    },
    {
      "id": "passive",
      "title": "Passive & incidental Endo",
      "blocks": [
        {
          "type": "p",
          "text": "Plenty of Endo accumulates without a dedicated farm — and there's probably a big pile of it sitting in your mod collection right now."
        },
        {
          "type": "list",
          "ordered": false,
          "items": [
            "**Dissolving duplicate mods** — use the Orbiter’s Mods segment. Unranked Common / Uncommon / Rare mods return 5 / 10 / 15 Endo. Quick Select lets you retain extra copies and skip chosen mods; it excludes ranked, Legendary and Riven mods. Review the selection and the displayed Endo total before confirming.",
            "**Daily Sortie** — 4,000 Endo has a 12% reward chance. It is a possible daily reward, not guaranteed income.",
            "**Weekly Archon Hunt** — 8,000 Endo is one possible completion reward alongside the guaranteed Archon Shard.",
            "**Teshin's Steel Path Honors** — a 30,000-Endo bundle for 150 Steel Essence, but it's a rotating slot that surfaces only ~1 week in 8.",
            "**Palladino** — 10 Riven Slivers → 6,000 Endo, once per week.",
            "**Granum Void** — Rotation B can award 200 / 400 / 600 Endo in Standard / Extended / Nightmare, each at 33.33%."
          ]
        },
        {
          "type": "warn",
          "title": "Review valuable mods before dissolving",
          "text": "Dissolve surplus mods when Endo is your goal, and use dedicated [credit farms](/guides/credits) for the other half of the Fusion cost. Ranking a mod solely to dissolve it loses Endo: the refund is only part of the Fusion investment. Keep useful copies and check trade value before destroying a rare mod or [Riven](/guides/riven). A rerolled Riven can have a substantial dissolve value, but its build or sale value may be higher."
        },
        {
          "type": "tip",
          "title": "Use the dissolve preview, not a promised cleanup total",
          "text": "Your return depends on the number, rarity and ranks of the mods selected. There is no fixed cleanup payout. Keep the copies you need, inspect valuable duplicates separately, and use the confirmation screen’s total to decide whether the cleanup covers your next upgrade."
        }
      ]
    },
    {
      "id": "spend",
      "title": "Where your Endo goes",
      "blocks": [
        {
          "type": "p",
          "text": "Fusion is the main use for Endo. Each additional rank costs more Endo and credits, so check the remaining cost before committing. A useful mod at a partial rank can fit your current budget while you build up the rest of your loadout."
        },
        {
          "type": "kv",
          "kv": [
            {
              "k": "Rank-10 Primed mod",
              "v": "40,920 Endo from rank 0 to 10; the final rank alone costs 20,480"
            },
            {
              "k": "Rank-10 Primed mod credit cost",
              "v": "1,976,436 credits from rank 0 to 10"
            },
            {
              "k": "Maxed rank-10 rare",
              "v": "30,690 Endo from rank 0 to 10; rarity and maximum rank both matter"
            }
          ]
        },
        {
          "type": "tip",
          "title": "Sometimes a Legendary Core beats farming",
          "text": "A Legendary Core maxes one eligible mod without charging its remaining Endo and Fusion credit costs. Using it on an unranked rank-10 Primed mod saves 40,920 Endo and 1,976,436 credits. Check current offers before buying one: the receiving player also pays a 1,000,000-credit trading tax. A partly ranked mod saves less, and there is no fixed Platinum price."
        },
        {
          "type": "info",
          "title": "Ayatan-to-mod is the cleanest conversion",
          "text": "Ayatan Sculptures let you hold a future Endo supply without dissolving them immediately. Keep the sculpture and stars until you need the Endo, then socket and convert them at Maroo. A fully socketed Anasa yields 3,450 Endo; buying one trades Platinum for that future conversion, not for a directly tradeable Endo balance."
        },
        {
          "type": "info",
          "title": "Prefer to buy your way past the grind?",
          "text": "You cannot trade Endo itself with another player. You can buy a filled Ayatan Sculpture or a mod, then dissolve it. Compare the quoted price with its exact Endo value, including socket state or Riven rank and rerolls. The [Endo Exchange tool](/endo) compares tracked offers by Endo per Platinum; check the data’s age and confirm the item and price with the seller before trading."
        }
      ]
    }
  ],
  "faqs": [
    {
      "q": "What is the fastest Endo farm in 2026?",
      "a": "There is no universal fastest farm. Coordinated Vodyanoi squads use loot abilities and Mod Drop Chance bonuses to focus on enemy drops. Solo players can compare Arbitrations with bounties they clear quickly. Use several completed runs, including loading and extraction, to measure your own return; reward-table Endo is random."
    },
    {
      "q": "What's the best repeatable Endo farm for veterans?",
      "a": "Arbitrations are a repeatable option: A / B / C can award 900 / 1,200 / 1,500 Endo at 44% / 44.5% / 35%. Other rolls can award sculptures or other items, so not every rotation gives Endo. Most modes follow AABBCCCC…; Disruption uses its own reward tiers. Access comes from the Equip a Focus Lens task in the Eris Junction on Pluto."
    },
    {
      "q": "Best option if I'm solo or don't want a premade?",
      "a": "Choose a bounty or Arbitration mode your loadout completes reliably. High-tier Höllvania bounties can award 3,300 or 4,200 Endo; high-tier Zariman and Sanctum bounties offer 3,000 or 4,000. These are random reward rolls. Unwanted Railjack wreckage and weekly Ayatan hunts are useful supplements."
    },
    {
      "q": "What's the best pre-Steel-Path / early Endo farm?",
      "a": "Start with surplus mods and Maroo’s weekly Ayatan hunt after Stolen Dreams. If your build can handle level 40–60 Cambion Drift bounties, their first stage has a 45.45% chance at 1,000 Endo. Arbitrations become available through the Eris Junction Focus Lens task on Pluto; they do not require the full Star Chart."
    },
    {
      "q": "How do Ayatan Sculptures work?",
      "a": "Sculptures have color-coded sockets. You fill Cyan sockets with Cyan Stars and Amber sockets with Amber Stars (permanent once slotted), then dissolve the sculpture at Maroo's Bazaar on Mars for its socketed Endo value — 1,425 (Ayr) up to 3,450 (Anasa). Always socket first: a filled sculpture is worth far more than the empty sculpture plus its loose stars."
    },
    {
      "q": "Should I dissolve Ayatan Stars or socket them?",
      "a": "Usually socket them first. Loose Cyan and Amber Stars yield 50 and 100 Endo respectively, while filling a sculpture increases its conversion value. The gain depends on the sculpture and sockets already filled, not a fixed amount per star. If one color is scarce, compare the preview before allocating your stars."
    },
    {
      "q": "Does Maroo's weekly Ayatan Treasure Hunt give an Anasa?",
      "a": "No. Maroo’s weekly hunt awards Sah, Ayr, Orta, Vaya, Piv or Valana. Fully socketed, these yield 1,425–2,700 Endo. Anasa yields 3,450 Endo when filled and is a possible Sortie reward (28%) or Archon Hunt reward. Complete the weekly treasure room and extract to keep its sculpture."
    },
    {
      "q": "Which boosters increase Endo?",
      "a": "A Mod Drop Chance Booster doubles the chance that enemies drop Endo, not the amount in each pickup. The Steel Path’s mod-drop-chance bonus also helps eligible enemy drops. Resource Boosters, Resource Drop Chance Boosters and resource drop blessings do not boost Endo. None of these increases mission or bounty reward-table Endo, or mod and sculpture dissolve values."
    },
    {
      "q": "Do I run bounties on Steel Path for more Endo?",
      "a": "Steel Path’s drop bonuses do not multiply the Endo shown in a bounty reward table. Compare the active reward pool and your completion time. Steel Path may still be useful for other rewards, and its mod-drop bonus helps enemy-drop farms such as Vodyanoi."
    },
    {
      "q": "How much Endo do I get from dissolving mods?",
      "a": "Unranked Common / Uncommon / Rare mods yield 5 / 10 / 15 Endo. Ranked mods return part of the Endo invested, so ranking a mod just to dissolve it loses Endo. The confirmation screen shows the exact return. Keep useful copies and compare trade value before dissolving valuable duplicates or a Riven."
    },
    {
      "q": "Why do I have tons of Cyan Stars but never enough Amber?",
      "a": "Both colors are random container or locker drops, and sculpture sockets consume them in different proportions. Cambion Drift bounties can award Amber Stars. Arbitration Honors sells a reusable Amber Star blueprint for 10 Vitus Essence; each craft costs 2 Cyan Stars, 1 Vitus Essence and 100,000 credits. Ayr needs only Cyan Stars. Compare your supplies and the conversion preview before crafting or socketing."
    },
    {
      "q": "Can I trade or buy Endo?",
      "a": "Endo itself cannot be traded between players. You can buy an Ayatan Sculpture or a mod from another player and dissolve it for Endo. Compare current offers, the exact item’s dissolve value and any credit tax before trading. The [Endo Exchange](/endo) compares these indirect routes; a listed offer is not a guaranteed transaction."
    }
  ],
  "videos": [
    {
      "id": "wfcARDwh01E",
      "title": "Best ENDO Farms in Warframe 2026 (FAST AND EASY)",
      "channel": "Kryptafy"
    },
    {
      "id": "NyUIIKBlgko",
      "title": "How to Get Endo FAST in Warframe (2026) | Best Farming Spots",
      "channel": "Aethernaut1887"
    },
    {
      "id": "CSSMA_Xhypw",
      "title": "Warframe The BEST Endo Farming Guide for 2026!",
      "channel": "Weazel"
    },
    {
      "id": "O1p72j8qMz4",
      "title": "ALL THE BEST ENDO FARM IN 2026 | UPDATED ENDO FARMING GUIDE",
      "channel": "Grind Hard Squad"
    },
    {
      "id": "ZlkwYJiQjaw",
      "title": "Best Endo Farms 2026 | Max Mods FAST in Warframe",
      "channel": "TrueDripFrame"
    },
    {
      "id": "mPy9vllrNCM",
      "title": "The ULTIMATE Guide to Farming ENDO In Warframe!",
      "channel": "WarframeFlo"
    }
  ],
  "sources": [
    {
      "label": "Digital Extremes — Official PC drop tables",
      "href": "https://www.warframe.com/droptables"
    },
    {
      "label": "Update 35.5 — Mod Drop Chance Booster description",
      "href": "https://www.warframe.com/en/patch-notes/pc/35-5-0"
    },
    {
      "label": "Update 39 — Eris Junction and Arbitration access",
      "href": "https://www.warframe.com/en/patch-notes/pc/39-0-0"
    },
    {
      "label": "Update 41.1 — Arbitration Rotation C changes",
      "href": "https://www.warframe.com/en/patch-notes/pc/41-1-0"
    },
    {
      "label": "Arbitrations Revisited — reward cadence",
      "href": "https://www.warframe.com/en/patch-notes/pc/25-7-6"
    },
    {
      "label": "Update 40 — Nightcap and Ayatan Chattraka",
      "href": "https://www.warframe.com/en/patch-notes/pc/40-0-0"
    },
    {
      "label": "Warframe — Intro to Archon Hunts",
      "href": "https://www.warframe.com/en/news/intro-to-archon-hunts"
    },
    {
      "label": "WARFRAME Wiki — Fusion costs",
      "href": "https://wiki.warframe.com/w/Fusion"
    },
    {
      "label": "WARFRAME Wiki — Legendary Core",
      "href": "https://wiki.warframe.com/w/Legendary_Core"
    },
    {
      "label": "WARFRAME Wiki — Endo",
      "href": "https://wiki.warframe.com/w/Endo"
    },
    {
      "label": "WARFRAME Wiki — Arbitrations / Rewards",
      "href": "https://wiki.warframe.com/w/Arbitrations/Rewards"
    },
    {
      "label": "WARFRAME Wiki — Ayatan Treasures",
      "href": "https://wiki.warframe.com/w/Ayatan_Treasures"
    },
    {
      "label": "WARFRAME Wiki — Ayatan Treasure Hunt",
      "href": "https://wiki.warframe.com/w/Ayatan_Treasure_Hunt"
    },
    {
      "label": "WARFRAME Wiki — Rathuum (Sedna arena)",
      "href": "https://wiki.warframe.com/w/Rathuum"
    }
  ],
  "related": [
    {
      "label": "Endo Exchange (buy with Platinum)",
      "to": "/endo",
      "icon": "swap-horizontal",
      "note": "Compare tracked Ayatan and Riven offers by Endo per Platinum"
    },
    {
      "label": "Modding Guide",
      "to": "/guides/mods",
      "icon": "puzzle",
      "note": "Where all of your Endo actually goes"
    },
    {
      "label": "Riven Mods Explained",
      "to": "/guides/riven",
      "icon": "star-four-points-outline",
      "note": "Compare a Riven’s use, trade and dissolve value"
    },
    {
      "label": "Credit Farming",
      "to": "/guides/credits",
      "icon": "circle-multiple-outline",
      "note": "The other half of the modding bill"
    },
    {
      "label": "Steel Path Guide",
      "to": "/guides/steel-path",
      "icon": "fire",
      "note": "How mod-drop bonuses help enemy-based Endo farms"
    },
    {
      "label": "Archon Shards",
      "to": "/guides/archon-shards",
      "icon": "cards-diamond-outline",
      "note": "The weekly hunt with a chance at an 8,000-Endo reward"
    }
  ],
  "updated": "2026-10-23"
}

export default guide
