// Auto-generated Warframe Knowledge Center guide content.
// Drafted grounded in r/Warframe research (reddit API) + the subreddit wiki FAQ,
// then adversarially fact-checked for evergreen accuracy. Embedded video ids were
// verified live via YouTube oEmbed. Edit freely — this is the single source for
// the /guides/relics page (rendered by <GuideArticle>).
import type { Guide } from './types'

const guide: Guide = {
  "slug": "relics",
  "eyebrow": "Knowledge Center · Relics & Void Traces",
  "title": "Relics & Void Traces Guide",
  "lede": "Void Relics are Warframe's slot machine for Prime gear — and once you understand refinement, Void Traces, and shared rewards, the odds tilt hard in your favor. Here's how to crack relics efficiently and turn the loot into platinum.",
  "category": "farming",
  "readMins": 9,
  "stats": [
    {
      "num": "4",
      "label": "relic eras · Lith→Axi"
    },
    {
      "num": "6",
      "label": "rewards per relic",
      "tone": "alt"
    },
    {
      "num": "10%",
      "label": "rare chance at Radiant",
      "tone": "gold"
    },
    {
      "num": "6–30",
      "label": "Void Traces per crack"
    }
  ],
  "sections": [
    {
      "id": "relic-basics",
      "title": "What Void Relics actually are",
      "blocks": [
        {
          "type": "p",
          "text": "A **Void Relic** is a sealed container of **Prime gear** — Warframe parts, weapon parts, and Forma blueprints. You can't just crack one open in your Foundry; you have to take it into a special mission called a **Void Fissure** and \"open\" it there. Every relic belongs to one of four **eras**, and the era only tells you *which pool of Prime parts* the relic can contain and *roughly where it drops* — it says nothing about how good the loot is."
        },
        {
          "type": "p",
          "text": "Relics are also **tradeable**, which is the whole reason a Prime farm turns into platinum: you crack relics for parts, sell the spares to other players, and buy the exact relic you're missing from someone else. See the [Platinum guide](/guides/platinum) for the full economy loop."
        },
        {
          "type": "table",
          "table": {
            "columns": [
              "Era",
              "Tier",
              "Where it tends to drop"
            ],
            "rows": [
              [
                "Lith",
                "Entry",
                "Early Origin System nodes and low-tier bounties"
              ],
              [
                "Meso",
                "Mid",
                "Mid star-chart missions and bounties"
              ],
              [
                "Neo",
                "High",
                "Later planets, endless rotations, higher-tier bounties"
              ],
              [
                "Axi",
                "Endgame",
                "Late star chart, long endless rotations, Steel Path, high-tier bounties"
              ]
            ],
            "note": "Drop sources shift with updates. For the current best node for a specific relic, check the in-game Void Fissure list or the drop tables on the wiki."
          }
        },
        {
          "type": "kv",
          "kv": [
            {
              "k": "Relic eras",
              "v": "Lith, Meso, Neo, Axi"
            },
            {
              "k": "Rewards inside",
              "v": "6 total — 3 common, 2 uncommon, 1 rare"
            },
            {
              "k": "Reactant to open",
              "v": "10 per player, per relic"
            },
            {
              "k": "Refinement currency",
              "v": "Void Traces (storage cap scales with Mastery Rank)"
            },
            {
              "k": "Where you open them",
              "v": "Void Fissure missions only"
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
          "text": "Every relic holds exactly **six possible rewards**, split across three rarities:"
        },
        {
          "type": "list",
          "items": [
            "**3 Common** rewards (bronze) — usually cheap parts and Forma blueprints",
            "**2 Uncommon** rewards (silver) — mid-value parts",
            "**1 Rare** reward (gold) — the sought-after part, and the reason you refine"
          ]
        },
        {
          "type": "info",
          "text": "Refinement never changes *which* six parts are inside a relic — it only changes the **odds** of landing the rare vs. a common. A relic that doesn't contain the part you want will never drop it, no matter how much you refine it. Always check a relic's contents before you invest traces."
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
              "p": "Open the Void Fissures tab on the star chart and pick a mission whose era matches a relic you own. Before you launch, select the relic and its refinement level. You can only bring one relic per mission."
            },
            {
              "h": "Find the Corrupted enemies",
              "p": "Once inside, the fissure corrupts nearby enemies — they glow with Void energy. These Corrupted enemies are the only thing that drops Reactant."
            },
            {
              "h": "Collect 10 Reactant",
              "p": "Every squad member must personally grab 10 Reactant before the mission (or rotation) ends. Watch the counter on your HUD; Reactant pickups are shared visually but you each collect your own 10."
            },
            {
              "h": "Open and choose your reward",
              "p": "When the mission ends — or at the end of each rotation in an endless mission — you'll see up to four rewards: yours plus your squadmates'. Pick the single best one to keep."
            }
          ]
        },
        {
          "type": "warn",
          "text": "Don't sprint to extraction before you've collected all 10 Reactant. If your relic isn't charged when the mission ends, it stays sealed and pays out nothing — you *do* keep the relic (an uncharged relic isn't consumed), but the entire run is wasted, so always finish charging before you extract."
        }
      ]
    },
    {
      "id": "refinement",
      "title": "Refinement: Intact → Radiant",
      "blocks": [
        {
          "type": "p",
          "text": "A fresh relic is **Intact** and gives the rare only a **2%** shot. Spending **Void Traces** to refine it bumps the rare (and uncommon) odds up in three steps, topping out at **Radiant**, where the rare hits **10%** — a 5× improvement. This is the single most important lever you control."
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
          "text": "**Should you Radiant everything?** No. Radiant costs a full 100 traces, so save it for relics whose *rare* part is actually valuable or one you need. If you're just cracking relics to feed the [Ducat](/ducats) machine or hunting a common part, run them **Intact** — you'll open far more relics per trace budget. Use the [crack-or-sell value tool](/relics-value) to see whether a relic is worth refining or worth more sold whole."
        }
      ]
    },
    {
      "id": "void-traces",
      "title": "Farming Void Traces (and the storage cap)",
      "blocks": [
        {
          "type": "p",
          "text": "Void Traces come **almost entirely** from cracking relics in fissures — a few niche sources exist (the Granum Void, some Isolation Vault caches), but for practical purposes traces and relics are the same farm. Every relic you open pays a small random amount of traces (a base **6–30**), and — worth knowing — a **Resource Booster doubles** that amount. So \"farming traces\" and \"farming relics\" are literally the same activity."
        },
        {
          "type": "list",
          "items": [
            "Crack junk relics you'd never sell — every open still pays traces, and usually a Forma BP or a ducat-fodder part on top.",
            "Your trace storage is **capped, and the cap scales with Mastery Rank** — 100 for a brand-new player, climbing +50 per rank into the thousands at high MR. Anything you earn while sitting at your personal cap is lost, so spend before you overflow.",
            "Run fast fissures (see the next section) so you're cracking relics one after another instead of waiting on slow missions."
          ]
        },
        {
          "type": "tip",
          "text": "There is no dedicated \"trace node.\" The fastest trace stockpile comes from chaining quick Capture or reward-dense Disruption fissures with relics you were going to open anyway."
        }
      ]
    },
    {
      "id": "shared-radshare",
      "title": "Shared rewards & Radiant shares (\"radshares\")",
      "blocks": [
        {
          "type": "p",
          "text": "Here's the mechanic that changes everything: in a full squad, **all four players see all four rolls** at the reward screen, and each of you keeps *one* of them. Your own relic rolled a common? If a squadmate's relic rolled the rare, you can take the rare instead. That's the foundation of the **Radiant share** — the community's standard way to farm expensive rare parts."
        },
        {
          "type": "info",
          "text": "Four Radiant relics of the *same type* each roll the rare independently at 10%. The chance the rare appears at least once for the whole squad to grab is 1 − 0.9⁴ ≈ **34%** — versus 10% running solo. Run a few back-to-back radshare rounds and rares stop feeling rare."
        },
        {
          "type": "steps",
          "steps": [
            {
              "h": "Refine to Radiant first",
              "p": "Everyone must arrive with the exact same relic refined to Radiant (100 traces). By convention, an Intact relic or the wrong relic gets you kicked from a radshare group."
            },
            {
              "h": "Find a group in Recruiting",
              "p": "Open Recruiting chat / the Recruit tab and search the relic's code, e.g. \"Axi A15 Rad\" or \"Meso G1 RadShare.\" \"H\" usually means someone is hosting/looking."
            },
            {
              "h": "Run a fast Capture fissure",
              "p": "Radshares almost always use the quickest available fissure so everyone can crack, grab the rare, and reset for another round."
            },
            {
              "h": "Take the rare when it appears",
              "p": "At the reward screen, if any of the four rolled the rare, everyone picks it. Rinse and repeat."
            }
          ]
        }
      ]
    },
    {
      "id": "fissure-efficiency",
      "title": "Which fissure type is most efficient",
      "blocks": [
        {
          "type": "p",
          "text": "All fissures crack relics the same way, but they differ wildly in *how fast* you cycle through relics. Match the mission type to your goal:"
        },
        {
          "type": "table",
          "table": {
            "columns": [
              "Fissure type",
              "Pace",
              "Best for"
            ],
            "rows": [
              [
                "Capture",
                "Fastest one-and-done",
                "Bulk-cracking, trace farming, radshares"
              ],
              [
                "Exterminate / Sabotage",
                "Fast",
                "Quick single cracks when no Capture is up"
              ],
              [
                "Survival / Defense / Interception",
                "Endless",
                "One relic per rotation, no reloads, steady traces"
              ],
              [
                "Disruption",
                "Endless, reward-dense",
                "Fast rounds = many cracks + traces per sitting"
              ]
            ],
            "note": "In endless fissures you open one relic per rotation and can swap to a fresh relic between rotations — no returning to your ship."
          }
        },
        {
          "type": "p",
          "text": "**Rule of thumb:** use **Capture** when you want to open a big pile of different relics quickly or run a radshare, and use an **endless** type (Survival or Disruption) when you want to sit down and grind traces or crack many relics without loading screens. Not sure which relics are even worth your time? [Relic farming](/relic-farming) ranks which relics pay the most platinum per run."
        }
      ]
    },
    {
      "id": "vaulting",
      "title": "Vaulting, Aya & Prime Resurgence",
      "blocks": [
        {
          "type": "p",
          "text": "Digital Extremes periodically **vaults** older Primes — their relics stop dropping from the live drop tables to make room for new ones. Relics already sitting in your inventory still work forever, and vaulted relics stay **tradeable**, so you can always buy the exact one you need from another player. Track what's in and out with the [Vaulted Prime tracker](/vaulted)."
        },
        {
          "type": "info",
          "text": "**Prime Resurgence** brings vaulted relics back on a rotation: visit Varzia in **Maroo's Bazaar** and buy unvaulted relics with **Aya** (earned free across the star chart, often dropping in place of relics) or premium **Regal Aya**. It's the safety net if a Prime you want is currently vaulted."
        },
        {
          "type": "warn",
          "text": "When a Prime gets vaulted, demand for its parts often spikes because the supply dries up. If you're sitting on spares, [Vaulted Primes spiking now](/vault-spikes) shows which ones are climbing so you can sell into the surge."
        }
      ]
    },
    {
      "id": "cash-out",
      "title": "Turn parts into platinum or ducats",
      "blocks": [
        {
          "type": "p",
          "text": "A cracked relic hands you a Prime part (or a Forma blueprint). You have three moves with any part you pull:"
        },
        {
          "type": "list",
          "items": [
            "**Build it** — assemble the Prime Warframe or weapon for yourself.",
            "**Sell it for platinum** — trade duplicates and unwanted parts to other players.",
            "**Turn it into Ducats** — dump parts nobody buys into the Ducat kiosk at any relay, then spend the Ducats on Baro Ki'Teer's rotating stock."
          ]
        },
        {
          "type": "links",
          "links": [
            {
              "label": "Relic value: crack or sell",
              "to": "/relics-value",
              "icon": "scale-balance",
              "note": "Expected platinum per relic"
            },
            {
              "label": "Set vs parts calculator",
              "to": "/comparison",
              "icon": "calculator-variant",
              "note": "Price a full set vs. selling parts"
            },
            {
              "label": "Flip finder",
              "to": "/flip",
              "icon": "swap-horizontal",
              "note": "Live buy/sell spreads on parts"
            },
            {
              "label": "Ducat value finder",
              "to": "/ducats",
              "icon": "cash-multiple",
              "note": "Best parts to feed Baro"
            }
          ]
        },
        {
          "type": "tip",
          "text": "Forma blueprints are one of the most common relic rewards, so steady fissure-running doubles as a free source of the Forma you'll burn polarizing builds — you rarely need to buy them."
        }
      ]
    }
  ],
  "faqs": [
    {
      "q": "How do I open a Void Relic?",
      "a": "You can't open relics from your inventory — you have to run a Void Fissure mission. Equip one relic before launching, kill the glowing Corrupted enemies to collect 10 Reactant, and your relic opens at the end of the mission (or each rotation in endless). At the reward screen you pick one reward from up to four."
    },
    {
      "q": "What does refining a relic to Radiant actually do?",
      "a": "Refining spends Void Traces to improve the odds of the rare and uncommon rewards. An Intact relic gives the rare a 2% chance; a Radiant relic raises it to 10%. It never changes which six parts are inside — only the odds between them. Check [crack or sell](/relics-value) to see whether refining is worth it for a given relic."
    },
    {
      "q": "How do I farm Void Traces fast?",
      "a": "Traces come almost entirely from cracking relics in fissures — each open pays a base 6–30, and a Resource Booster doubles that. The fastest method is chaining quick Capture fissures or reward-dense Disruption fissures with relics you were going to open anyway. Your storage cap scales with Mastery Rank (100 at the very start, climbing +50 per rank), so spend before you hit your cap and overflow."
    },
    {
      "q": "What is a Radiant share (radshare)?",
      "a": "It's a full squad where all four players bring the same relic refined to Radiant. Because everyone can pick from all four rolls at the reward screen, four independent 10% rare rolls give the squad about a 34% chance the rare shows up each run — far better than 10% solo. Find groups in Recruiting chat by searching the relic's code plus \"Rad\" or \"RadShare.\""
    },
    {
      "q": "Should I refine every relic to Radiant?",
      "a": "No. Radiant costs a full 100 traces, so reserve it for relics whose rare part is valuable or one you actually need. For farming commons, Forma, or ducat fodder, run relics Intact so you open far more of them per trace budget. The [relic value tool](/relics-value) helps you decide per relic."
    },
    {
      "q": "Where do Void Relics drop?",
      "a": "Relics drop across the star chart — from mission rewards, endless-mission rotations, and open-world bounties. Lith relics come from early nodes, and Neo/Axi from later, harder content and longer endless runs. Which specific node is best changes with updates, so check the in-game drop tables or the wiki for the current spot."
    },
    {
      "q": "Can I still get Prime parts after a Prime is vaulted?",
      "a": "Yes. Any relics already in your inventory still work forever, and vaulted relics stay tradeable, so you can buy the exact relic from another player. You can also grab unvaulted relics through Prime Resurgence from Varzia in Maroo's Bazaar using Aya. Track availability with the [Vaulted Prime tracker](/vaulted)."
    },
    {
      "q": "Which fissure mission type is best for cracking relics?",
      "a": "Capture is the fastest one-and-done, ideal for bulk-cracking, trace farming, and radshares. Endless types like Survival and Disruption let you open a relic per rotation without loading screens, which is better for long grinding sessions. Match the type to whether you want speed or volume."
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
      "label": "r/Warframe — If you want to farm relics, here is where to do it",
      "href": "https://reddit.com/r/Warframe/comments/7poeao/if_you_want_to_farm_relics_here_is_where_to_do_it/"
    },
    {
      "label": "r/Warframe — RNG relics, rewards & the grind (discussion)",
      "href": "https://reddit.com/r/Warframe/comments/dr46xo/so_let_me_get_this_straight_we_need_to_farm_rng/"
    },
    {
      "label": "r/Warframe — Platinum farms ranked",
      "href": "https://reddit.com/r/Warframe/comments/1f77ohc/platinum_farms_ranked_by_how_insane_the_people/"
    },
    {
      "label": "Warframe Wiki — Void Relic",
      "href": "https://wiki.warframe.com/w/Void_Relic"
    },
    {
      "label": "Warframe Wiki — Void Traces",
      "href": "https://wiki.warframe.com/w/Void_Traces"
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
      "note": "Which relics pay best per run"
    },
    {
      "label": "Relic Value: Crack or Sell",
      "to": "/relics-value",
      "icon": "scale-balance",
      "note": "Expected plat per relic"
    },
    {
      "label": "Ducat Value Finder",
      "to": "/ducats",
      "icon": "diamond-stone",
      "note": "Best parts for Baro"
    },
    {
      "label": "Vaulted Prime Tracker",
      "to": "/vaulted",
      "icon": "lock",
      "note": "What's in and out of the vault"
    },
    {
      "label": "Full FAQ",
      "to": "/faq",
      "icon": "help-circle",
      "note": "More player questions answered"
    }
  ],
  "updated": "2026-07-18"
}

export default guide
