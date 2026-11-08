// Warframe Knowledge Center guide content.
// English text reviewed against official sources on 2026-11-08.
// Video availability was checked separately; full videos were not reviewed.
// Source for /guides/relics, rendered by <GuideArticle>.
import type { Guide } from './types'

const guide: Guide = {
  "slug": "relics",
  "eyebrow": "Knowledge Center · Relics & Void Traces",
  "title": "Relics & Void Traces Guide",
  "lede": "Learn how to open Prime relics, choose a refinement level, collect Void Traces and share rewards. Check the difference between Common and Uncommon Forma rewards before spending traces, then compare your Prime parts with market and ducat estimates.",
  "category": "farming",
  "readMins": 9,
  "stats": [
    {
      "num": "4",
      "label": "Prime relic eras · Lith→Axi"
    },
    {
      "num": "6",
      "label": "possible Prime relic rewards",
      "tone": "alt"
    },
    {
      "num": "10%",
      "label": "rare chance at Radiant",
      "tone": "gold"
    },
    {
      "num": "6–30",
      "label": "base Traces at 10 Reactant"
    }
  ],
  "sections": [
    {
      "id": "relic-basics",
      "title": "What Void Relics actually are",
      "blocks": [
        {
          "type": "p",
          "text": "This guide covers **Lith, Meso, Neo and Axi** relics, whose rewards include Prime blueprints, Prime components and Forma blueprints. Open them in a matching **Void Fissure**, an **Omnia Fissure** or a Railjack **Void Storm**. The exact relic code determines its reward pool; the era alone does not tell you a reward’s market value. **Requiem Eterna** follows separate rules: it contains eight Requiem Mods and cannot be refined with Void Traces."
        },
        {
          "type": "p",
          "text": "Relics are **tradeable**. You can open them for rewards or trade a relic you own to another player. Tradeable Prime blueprints and components can also be sold separately, subject to finding a buyer and agreeing on a price. See the [Platinum guide](/guides/platinum) for trading basics."
        },
        {
          "type": "table",
          "table": {
            "columns": [
              "Era",
              "Example source",
              "What to check"
            ],
            "rows": [
              [
                "Lith",
                "Hepit, Void — Capture",
                "Check that the exact relic is in the current reward table."
              ],
              [
                "Meso",
                "Ukko, Void — Capture",
                "This mission also has Neo relics and Aya in its table."
              ],
              [
                "Neo",
                "Ukko, Void — Capture",
                "Choose by the exact reward you need, not era alone."
              ],
              [
                "Axi",
                "Apollo, Lua — Disruption",
                "Check the reward rotation and its current relic pool."
              ]
            ],
            "note": "These are examples, not an exhaustive ranking. Search the exact relic code in the official drop tables and check its in-game source information. The Void Fissure list shows where to open relics; it is not a list of where that relic drops."
          }
        },
        {
          "type": "kv",
          "kv": [
            {
              "k": "Prime relic eras",
              "v": "Lith, Meso, Neo, Axi"
            },
            {
              "k": "Rewards inside",
              "v": "6 total — 3 common, 2 uncommon, 1 rare"
            },
            {
              "k": "Reactant to open",
              "v": "10 on your counter for each reward round"
            },
            {
              "k": "Refinement currency",
              "v": "Void Traces (storage cap scales with Mastery Rank)"
            },
            {
              "k": "Where you open them",
              "v": "Void Fissures, Omnia Fissures and Railjack Void Storms"
            }
          ]
        }
      ]
    },
    {
      "id": "reward-pool",
      "title": "The six-slot reward pool",
      "blocks": [
        {
          "type": "p",
          "text": "Each Lith, Meso, Neo or Axi relic offers **six possible rewards**, split across three rarities. You select one reward when you open it:"
        },
        {
          "type": "list",
          "items": [
            "**3 Common** rewards (bronze) — Prime items or a single Forma blueprint, depending on the relic",
            "**2 Uncommon** rewards (silver) — Prime items or two Forma blueprints, depending on the relic",
            "**1 Rare** reward (gold) — its rarity does not guarantee a high trading price"
          ]
        },
        {
          "type": "info",
          "text": "Refinement changes the **probabilities**, not the reward pool: Uncommon and Rare chances rise while Common chances fall. If a relic does not contain your target, refining it cannot add that item. Check both the reward and its rarity slot before spending traces."
        }
      ]
    },
    {
      "id": "cracking",
      "title": "Cracking a relic: the Void Fissure loop",
      "blocks": [
        {
          "type": "steps",
          "steps": [
            {
              "h": "Equip one relic",
              "p": "Choose a fissure that accepts your relic’s era, or an Omnia Fissure for any Lith, Meso, Neo or Axi relic. Select your relic and refinement before launch. You equip one relic for each reward round; endless fissures let you select another between rounds."
            },
            {
              "h": "Find the Corrupted enemies",
              "p": "Let the fissure corrupt enemies, then defeat those Corrupted enemies for Reactant. In Void Storms, look for Corrupted enemies in on-foot areas such as boarding parties, Crewships and mission objectives."
            },
            {
              "h": "Collect 10 Reactant",
              "p": "In ordinary Void Fissures, each player collects their own Reactant. Railjack Void Storms share Reactant pickups across the squad. In either case, check that your HUD reaches **10/10** before extraction or the reward round ends."
            },
            {
              "h": "Open and choose your reward",
              "p": "Complete the mission or endless reward round after charging your equipped relic. You can select one of the rewards from squadmates who also opened a relic, including your own — up to four choices. Several players may choose the same reward."
            }
          ]
        },
        {
          "type": "warn",
          "text": "Check everyone’s Reactant counter before extraction or the next reward round. If you have not charged a relic, you cannot select a relic reward for that round. The unopened relic is retained; this does not erase the mission’s other earned rewards."
        }
      ]
    },
    {
      "id": "refinement",
      "title": "Refinement: Intact → Radiant",
      "blocks": [
        {
          "type": "p",
          "text": "An unrefined relic is **Intact**, with a **2%** chance for its Rare reward. Refinement raises Rare and Uncommon probabilities; **Radiant** gives the Rare a **10%** chance. Some activities award relics already refined, so check the relic’s current state before spending traces."
        },
        {
          "type": "table",
          "table": {
            "columns": [
              "State",
              "Traces to refine",
              "Rare (gold)",
              "Each Uncommon",
              "Each Common"
            ],
            "rows": [
              [
                "Intact",
                "0",
                "2%",
                "11%",
                "25.33%"
              ],
              [
                "Exceptional",
                "25",
                "4%",
                "13%",
                "23.33%"
              ],
              [
                "Flawless",
                "50",
                "6%",
                "17%",
                "20%"
              ],
              [
                "Radiant",
                "100",
                "10%",
                "20%",
                "16.67%"
              ]
            ],
            "note": "Each relic still holds 3 commons / 2 uncommons / 1 rare — refinement only redistributes the odds between them."
          }
        },
        {
          "type": "p",
          "text": "**Choose refinement for the target.** Intact maximizes the chance of a particular Common reward, including a **single Forma blueprint**. Uncommon Forma rewards contain **two blueprints**: their chance rises from **11% Intact** to **20% Radiant**, at a cost of **100 Void Traces** from Intact. For Rare rewards, Radiant raises the chance from 2% to 10%. Balance the extra chance against your trace supply and how many relics you own. The [crack-or-sell value tool](/relics-value) provides market-based estimates, not guaranteed sale proceeds."
        }
      ]
    },
    {
      "id": "void-traces",
      "title": "Farming Void Traces (and the storage cap)",
      "blocks": [
        {
          "type": "p",
          "text": "Reaching **10 Reactant** in a fissure awards **6–30 base Void Traces**, even if you brought **no relic**. A trace-only run therefore does not consume a relic, but it also gives you no relic reward choice. Bringing a relic lets you earn traces and a relic reward in the same round."
        },
        {
          "type": "list",
          "items": [
            "Use a relic you want to open if you also want a Prime or Forma reward. Select no relic if your only goal is collecting traces.",
            "Your Void Trace storage cap is **100 + 50 × Mastery Rank**. Check your available space before farming so you can use traces rather than lose earnings to the cap.",
            "Choose an available fissure you can complete reliably, and watch the Reactant counter before finishing each round."
          ]
        },
        {
          "type": "tip",
          "text": "For a short session, a non-endless fissure lets you stop after one reward. For repeated openings, an endless fissure lets you select a new relic each round. Compare your own completion time, Reactant collection and loading time instead of assuming one mission is always fastest."
        }
      ]
    },
    {
      "id": "shared-radshare",
      "title": "Shared rewards & Radiant shares (\"radshares\")",
      "blocks": [
        {
          "type": "p",
          "text": "When all four players open a relic, each player can choose **one of the four revealed rewards**. Everyone may choose the same item without taking it away from anyone else. A **Radiant share**, or radshare, is a squad agreement to bring the same relic refined to Radiant to increase the number of rolls for a particular Rare reward."
        },
        {
          "type": "info",
          "text": "With four independent **10%** rolls for the same Rare reward, the chance that it appears at least once is **1 − 0.9⁴ ≈ 34%**. That also means about **66%** of such rounds will not reveal it. The calculation assumes all four players successfully open the agreed Radiant relic; it is not a guarantee for any run."
        },
        {
          "type": "steps",
          "steps": [
            {
              "h": "Refine to Radiant first",
              "p": "Agree on the exact relic code and refinement. Each player brings that relic at Radiant; refining one from Intact costs 100 Void Traces. Check the squad’s equipped relics before starting."
            },
            {
              "h": "Find a group in Recruiting",
              "p": "In Recruiting chat, search or advertise the relic’s full code together with \"Rad\" or \"RadShare.\" Confirm the target and how many rounds the group plans to run."
            },
            {
              "h": "Choose a suitable fissure",
              "p": "Pick an available mission that accepts the relic and suits the squad. Complete the objective while ensuring every player charges their relic."
            },
            {
              "h": "Select the reward you need",
              "p": "If the target appears, each player can select it. Otherwise choose from the available rewards and agree whether to continue with another relic."
            }
          ]
        }
      ]
    },
    {
      "id": "fissure-efficiency",
      "title": "Choose a fissure for your session",
      "blocks": [
        {
          "type": "p",
          "text": "Mission choice changes the objectives, waiting time and secondary rewards. These are practical options rather than a fixed speed ranking:"
        },
        {
          "type": "table",
          "table": {
            "columns": [
              "Fissure type",
              "Pace",
              "Useful when"
            ],
            "rows": [
              [
                "Capture",
                "One reward round",
                "You want a short objective, then time to finish collecting Reactant."
              ],
              [
                "Exterminate / Sabotage",
                "One reward round",
                "You prefer the available objective or no suitable Capture fissure is listed."
              ],
              [
                "Survival / Defense / Interception",
                "Endless",
                "You want several reward rounds without returning to the Orbiter."
              ],
              [
                "Disruption",
                "Endless",
                "Your squad is comfortable defending conduits and collecting Reactant each round."
              ]
            ],
            "note": "Endless fissures allow one relic opening per eligible reward round and a new relic selection between rounds. You still need 10 Reactant each round. Omnia changes the eligible relic eras, not the requirement to charge a relic."
          }
        },
        {
          "type": "p",
          "text": "**Plan around your goal:** compare a quick objective with an endless session, including loading time and whether everyone reaches 10 Reactant. Void Storms also offer Railjack rewards; see the [Railjack guide](/guides/railjack). [Relic farming](/relic-farming) compares estimated reward values per opening, not guaranteed platinum earned per run or per minute."
        }
      ]
    },
    {
      "id": "vaulting",
      "title": "Vaulting, Aya & Prime Resurgence",
      "blocks": [
        {
          "type": "p",
          "text": "When a Prime is **vaulted**, its associated relics leave regular acquisition sources. Relics you already own remain usable and tradeable; another player may have the relic or Prime component you need. The [Vaulted Prime tracker](/vaulted) helps you explore status data, but seller availability and current in-game offerings still need checking."
        },
        {
          "type": "info",
          "text": "**Prime Resurgence** rotates Varzia’s offerings. Visit her in **Maroo’s Bazaar on Mars**, or use **Visit Varzia** from the Orbiter’s Relic Segment. **Aya** buys the relics in her current selection; you still need to open them for a chance at the part. **Regal Aya** is a separate premium currency for direct Prime gear and accessories. Confirm Varzia’s current in-game selection before spending: a site’s Resurgence flag is an inference from relic data, not a verified shop inventory."
        },
        {
          "type": "warn",
          "text": "Vaulting does not guarantee a price increase: owned relics and existing parts remain in circulation. Use [Vaulted Prime price trends](/vault-spikes) to compare recorded changes, then check the quote age and actual offers before deciding what to trade."
        }
      ]
    },
    {
      "id": "cash-out",
      "title": "Turn parts into platinum or ducats",
      "blocks": [
        {
          "type": "p",
          "text": "A Prime relic reward may be a Prime blueprint or component, or one or two Forma blueprints. These items have different uses. For eligible Prime items, consider:"
        },
        {
          "type": "list",
          "items": [
            "**Build it** — keep the required blueprints and components to craft the Prime item. Crafted Prime Warframes and weapons cannot be traded.",
            "**Trade it for platinum** — offer a tradeable Prime blueprint or component to another player. A listed price does not guarantee a sale.",
            "**Exchange it for Ducats** — check the Ducat kiosk in a Relay for eligible Prime items and their values before confirming. Ducats are spent on Baro Ki’Teer’s offerings."
          ]
        },
        {
          "type": "links",
          "links": [
            {
              "label": "Relic value: crack or sell",
              "to": "/relics-value",
              "icon": "scale-balance",
              "note": "Estimated reward value per relic"
            },
            {
              "label": "Set vs parts calculator",
              "to": "/comparison",
              "icon": "calculator-variant",
              "note": "Compare set and component quotes"
            },
            {
              "label": "Flip finder",
              "to": "/flip",
              "icon": "swap-horizontal",
              "note": "Compare recorded buy and sell quotes"
            },
            {
              "label": "Ducat value finder",
              "to": "/ducats",
              "icon": "cash-multiple",
              "note": "Compare Prime-item Ducat values"
            }
          ]
        },
        {
          "type": "tip",
          "text": "**Forma blueprints are not tradeable Prime parts and cannot be exchanged for Ducats.** Craft them in the Foundry if you need Forma. Check whether the relic offers one blueprint in a Common slot or two in an Uncommon slot before choosing a refinement level."
        },
        {
          "type": "info",
          "text": "The creator videos below are optional demonstrations. Their availability, titles and channels were checked, but their full contents were not reviewed. Older videos may show outdated Forma quantities, mission timings or farming advice; use the current mechanics and official references in this guide when they differ."
        }
      ]
    }
  ],
  "faqs": [
    {
      "q": "How do I open a Void Relic?",
      "a": "Equip a relic in a fissure that accepts its era, an Omnia Fissure, or an eligible Railjack Void Storm. Reach 10 Reactant on your HUD and complete the mission or endless reward round. Ordinary fissures use personal Reactant pickups; Void Storm pickups are shared. Opening your relic lets you choose one of the available squad relic rewards, up to four."
    },
    {
      "q": "What does refining a relic to Radiant actually do?",
      "a": "For Lith, Meso, Neo and Axi relics, refinement increases Uncommon and Rare probabilities and lowers Common probabilities without changing the six possible rewards. The Rare chance rises from 2% Intact to 10% Radiant. Check the target slot and your trace budget; [crack or sell](/relics-value) provides estimates for comparison. Requiem Eterna cannot be refined."
    },
    {
      "q": "How do I collect Void Traces without using a relic?",
      "a": "You can enter a fissure with no relic and reach 10 Reactant for 6–30 base Void Traces. You will not get a relic reward choice unless you equip and open a relic. Choose a mission you can finish reliably; endless fissures support repeated reward rounds. Your storage cap is 100 + 50 × Mastery Rank, so check your space before farming."
    },
    {
      "q": "What is a Radiant share (radshare)?",
      "a": "A radshare is a squad agreement for all four players to bring the same relic at Radiant. If all four open it, four independent 10% rolls give about a 34% chance of revealing the same Rare reward at least once. Everyone can select that reward if it appears; there is still about a 66% chance it will not appear that round. Search Recruiting chat using the relic code and \"Rad\" or \"RadShare.\""
    },
    {
      "q": "Should I refine every relic to Radiant?",
      "a": "No. Intact gives the highest chance of a particular Common reward, including Common-slot Forma, which awards one blueprint. Uncommon Forma awards two blueprints, and refinement raises its chance from 11% Intact to 20% Radiant. Radiant costs 100 Void Traces from Intact, so choose by the target slot and your trace budget. The [relic value tool](/relics-value) offers estimates to compare."
    },
    {
      "q": "Where do Void Relics drop?",
      "a": "Relics come from specific mission rewards, rotations, bounties and Relic Packs. For example, Hepit in the Void has Lith relics, Ukko has Meso and Neo, and Apollo on Lua has Axi rewards in its later reward tables. Look up the exact relic in the official drop tables and check the relevant rotation. The fissure list tells you where to open a relic, not where to obtain it."
    },
    {
      "q": "Can I still get Prime parts after a Prime is vaulted?",
      "a": "Yes. Owned relics remain usable and tradeable, and players may sell the Prime blueprints or components you need. When Varzia offers a suitable relic in Prime Resurgence, you can buy it with Aya and open it for a chance at the part. Regal Aya instead buys eligible Prime gear directly. Check her current in-game selection; the [Vaulted Prime tracker](/vaulted) is a reference, not a guarantee of current stock."
    },
    {
      "q": "Which fissure mission type is best for cracking relics?",
      "a": "There is no universal fastest choice. Capture can suit a short session, while endless fissures let you open another relic each round without returning to the Orbiter. Choose for your squad’s objective speed, Reactant collection and loading time. Railjack Void Storms are another option when you also want their mission rewards."
    }
  ],
  "videos": [
    {
      "id": "sX-8t0hGvgI",
      "title": "Warframe: How to Refine Void Relics and How to Find Void Traces in Warframe",
      "channel": "CerealOverdrive"
    },
    {
      "id": "6D7mUOO2dCw",
      "title": "[WARFRAME] Ultimate VOID Relic Farming Guide - EASY Platinum Farm!",
      "channel": "KnightmareFrame"
    },
    {
      "id": "5bh4mtiAmHg",
      "title": "[WARFRAME] RAD RELICS FAST! Meta Void Trace Farming Guide 2024 | Whispers In The Wall",
      "channel": "Gaz TTV"
    },
    {
      "id": "RyPtNgTC7C8",
      "title": "The ONLY Void Trace Farm You Need | Warframe",
      "channel": "mothixe"
    }
  ],
  "sources": [
    {
      "label": "Digital Extremes — official PC drop tables",
      "href": "https://www.warframe.com/droptables"
    },
    {
      "label": "Update 36.1 — two Forma blueprints in Uncommon relic rewards",
      "href": "https://www.warframe.com/en/patch-notes/pc/36-1-0"
    },
    {
      "label": "Specters of the Rail: Hotfix 13 — traces without a relic and storage cap",
      "href": "https://www.warframe.com/en/patch-notes/pc/18-16-13"
    },
    {
      "label": "Specters of the Rail — relics and refinement costs",
      "href": "https://forums.warframe.com/topic/687452-xb1-specters-of-the-rail/"
    },
    {
      "label": "Update 19 — a new relic for each endless reward interval",
      "href": "https://www.warframe.com/en/patch-notes/pc/19-0-0"
    },
    {
      "label": "Update 30 — Void Storms and shared Reactant",
      "href": "https://www.warframe.com/en/patch-notes/pc/30-0-0"
    },
    {
      "label": "Update 35.5 — Omnia Fissures accept all four Prime relic eras",
      "href": "https://www.warframe.com/en/patch-notes/pc/35-5-0"
    },
    {
      "label": "Update 42 — Requiem Eterna has separate reward rules",
      "href": "https://www.warframe.com/en/patch-notes/pc/42-0-0"
    },
    {
      "label": "Digital Extremes — Relic Hunting 101",
      "href": "https://www.warframe.com/en/news/guia-de-caca-as-reliquias"
    },
    {
      "label": "Warframe Support — Prime Resurgence FAQ",
      "href": "https://support.warframe.com/hc/en-us/articles/4413725645453-Prime-Resurgence-FAQ"
    },
    {
      "label": "Warframe Support — Trading FAQ",
      "href": "https://support.warframe.com/hc/en-us/articles/37999066923533-Trading-FAQ-Safe-Trading-Tips"
    }
  ],
  "related": [
    {
      "label": "Platinum Guide",
      "to": "/guides/platinum",
      "icon": "cash-multiple",
      "note": "Turn Prime parts into plat"
    },
    {
      "label": "Relic Farming",
      "to": "/relic-farming",
      "icon": "pickaxe",
      "note": "Compare estimated reward values"
    },
    {
      "label": "Relic Value: Crack or Sell",
      "to": "/relics-value",
      "icon": "scale-balance",
      "note": "Estimated reward value per relic"
    },
    {
      "label": "Ducat Value Finder",
      "to": "/ducats",
      "icon": "diamond-stone",
      "note": "Compare Prime-item Ducat values"
    },
    {
      "label": "Vaulted Prime Tracker",
      "to": "/vaulted",
      "icon": "lock",
      "note": "Explore recorded vault status"
    },
    {
      "label": "Full FAQ",
      "to": "/faq",
      "icon": "help-circle",
      "note": "More player questions answered"
    }
  ],
  "updated": "2026-11-08"
}

export default guide
