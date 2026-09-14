// Warframe mastery guide. Editorial corrections are supported by the official
// patch notes and support references in sources below. Localized prose is updated
// selectively through the repository translation tooling.
import type { Guide } from './types'

const guide: Guide = {
  "slug": "mastery-rank",
  "eyebrow": "Knowledge Center · Mastery Rank",
  "title": "Mastery Rank & Fast Leveling",
  "lede": "Mastery Rank is your account's odometer — it unlocks gear, raises your daily standing and trade caps, and quietly rewards you for leveling everything you build. Here's exactly how mastery, affinity, and the tests work, plus the fastest ways to rank up.",
  "category": "start",
  "readMins": 9,
  "stats": [
    {
      "num": "30",
      "label": "max MR, then Legendary Ranks",
      "tone": "gold"
    },
    {
      "num": "3,000",
      "label": "mastery per rank-30 weapon",
      "tone": "good"
    },
    {
      "num": "6,000",
      "label": "mastery per maxed frame",
      "tone": "good"
    },
    {
      "num": "50m",
      "label": "affinity share range",
      "tone": "alt"
    }
  ],
  "sections": [
    {
      "id": "what-is-mr",
      "title": "What Mastery Rank actually is",
      "blocks": [
        {
          "type": "p",
          "text": "**Mastery Rank (MR)** is an account-wide progression level, separate from the level of any individual Warframe or weapon. You raise it by earning **Mastery** — a permanent form of affinity that accumulates on your account every time you level a **new, unique** piece of gear or clear new content for the first time. Unlike gear XP, mastery never resets: once an item has earned its mastery, that progress is banked forever."
        },
        {
          "type": "p",
          "text": "**Mastery is awarded once per unique equipment rank.** Rebuilding a Braton or using Forma to repeat ranks you already mastered adds no mastery. Equipment that can overlevel beyond rank 30 is the exception to watch: its newly unlocked ranks still count. Prime and other distinct equipment variants have their own mastery progress."
        },
        {
          "type": "kv",
          "kv": [
            {
              "k": "Ranks",
              "v": "MR 0 → 30, then Legendary Ranks (LR1, LR2, …) that DE keeps extending over time"
            },
            {
              "k": "Mastery is",
              "v": "Permanent, account-wide, earned once per unique item"
            },
            {
              "k": "MR test",
              "v": "A one-time challenge you pass to lock in each new rank"
            },
            {
              "k": "Do you need everything?",
              "v": "No — there are far more items than MR30 requires"
            }
          ]
        },
        {
          "type": "info",
          "text": "MR30 is the top *numbered* rank. Beyond it you keep earning mastery toward **Legendary Ranks**, which DE adds over time. You do **not** need to own every item in the game to hit MR30 — clearing the Star Chart plus leveling a healthy chunk of gear gets you there."
        }
      ]
    },
    {
      "id": "what-mr-unlocks",
      "title": "What MR unlocks (and what it doesn't)",
      "blocks": [
        {
          "type": "p",
          "text": "MR is not a power level — a fresh MR2 player and a maxed MR30 veteran using the same build hit exactly as hard. What MR buys you is **access and account convenience**: it gates certain gear behind a rank requirement and quietly raises several daily limits that matter a lot as you get deeper into farming and trading."
        },
        {
          "type": "table",
          "table": {
            "columns": [
              "Perk",
              "How it scales with MR"
            ],
            "rows": [
              [
                "Weapon & gear unlocks",
                "Many weapons require a minimum MR to buy or equip (the rank lock on the item card)"
              ],
              [
                "Daily standing cap",
                "Goes up with every Mastery Rank, tracked per syndicate — the higher your MR, the more standing you can bank each day (DE has raised the cap over time, so treat any exact figure as a moving target)"
              ],
              [
                "Daily trades",
                "Equal to your MR (MR10 = 10 trades per day; you need MR2 to trade at all)"
              ],
              [
                "Starting mod capacity",
                "Your MR provides a minimum capacity, limited by the equipment's unlocked maximum rank. A Reactor or Catalyst doubles this capacity."
              ]
            ],
            "note": "Higher standing caps directly speed up Focus, arcane and syndicate farming — see the Standing and Focus guides."
          }
        },
        {
          "type": "p",
          "text": "That standing cap is the sleeper perk. If you grind [syndicate standing](/guides/standing) or [Focus](/guides/focus), every MR you gain lets you bank more per day. More [daily trades](/guides/platinum) also means more platinum flips — pair it with the [Flip finder](/flip) once you're trading actively."
        },
        {
          "type": "warn",
          "text": "Common myth: 'I need to grind MR to survive higher content.' You don't. Survivability comes from **mods, arcanes and shield-gating**, not MR. Chase MR for the gear unlocks and daily caps, not for raw power."
        }
      ]
    },
    {
      "id": "how-mastery-earned",
      "title": "How mastery is earned",
      "blocks": [
        {
          "type": "p",
          "text": "You bank mastery by ranking gear from 0 to 30 for the first time. Different item types are worth different amounts **per rank**, so a maxed Warframe is worth twice a maxed weapon:"
        },
        {
          "type": "table",
          "table": {
            "columns": [
              "Item type",
              "Mastery per rank",
              "Total at max"
            ],
            "rows": [
              [
                "Weapons (primary, secondary, melee, etc.)",
                "100",
                "3,000 at rank 30"
              ],
              [
                "Warframes",
                "200",
                "6,000 at rank 30"
              ],
              [
                "Companions (Sentinels & beast pets)",
                "200",
                "6,000 at rank 30"
              ],
              [
                "Archwing",
                "200",
                "6,000 at rank 30"
              ],
              [
                "Kuva / Tenet / Coda / Paracesis weapons (rank 40)",
                "100",
                "4,000 at rank 40"
              ]
            ],
            "note": "Necramechs, Amps, K-Drives and Railjack Intrinsics grant mastery too. Every Star Chart node, junction, and its Steel Path version also gives a one-time mastery chunk on first clear."
          }
        },
        {
          "type": "tip",
          "text": "First clears of Star Chart nodes and Junctions award mastery, including their [Steel Path](/guides/steel-path) versions. Check your in-game Profile for mastery progress and Navigation for incomplete nodes. Use the [Foundry tracker](/foundry) to plan equipment you still need to build and master."
        },
        {
          "type": "p",
          "text": "**Rank-40 equipment needs an extra step.** Kuva, Tenet and Coda weapons, plus Paracesis, unlock two extra ranks per Forma, up to rank 40 after five Forma. Only ranks you have never mastered add points: a Coda weapon earns 3,000 at rank 30 and another 1,000 across ranks 31–40. [Digital Extremes explains Coda overleveling in Update 38.5](https://www.warframe.com/en/patch-notes/pc/38-5-0)."
        }
      ]
    },
    {
      "id": "affinity-101",
      "title": "Affinity 101: how leveling works",
      "blocks": [
        {
          "type": "p",
          "text": "**Affinity is XP.** It's what levels your gear from 0 to 30, and it's earned two ways: **kills** (and assists) and **mission objectives/completion**. How that affinity is split between your Warframe and your three weapons is the single most important thing to understand for fast leveling."
        },
        {
          "type": "kv",
          "kv": [
            {
              "k": "Your weapon kill",
              "v": "50% to the weapon that got the kill, 50% to your Warframe"
            },
            {
              "k": "Your ability kill",
              "v": "Effectively all of it flows to your Warframe"
            },
            {
              "k": "Squadmate's kill (within range)",
              "v": "You get a share: 25% to your Warframe, 75% split evenly across your equipped weapons — so a gun levels even if you never fire it"
            },
            {
              "k": "Affinity share range",
              "v": "50 meters in normal missions — stay near the action or you get nothing (open-world/Landscape maps use a much larger range)"
            },
            {
              "k": "Affinity Booster",
              "v": "Doubles all affinity you earn (stacks with double-affinity weekends)"
            }
          ]
        },
        {
          "type": "p",
          "text": "**For one weapon**, equip only that weapon when your squad can safely handle the mission: it receives the full weapon portion of shared affinity. With two weapons, that portion is split in half; with three, it is split into thirds. Keep a strong backup when you need it to contribute or survive. **For a Warframe**, use damaging abilities when practical, or bring useful support to a squad. Maxed gear still takes its share and can convert affinity to Focus with a Lens."
        },
        {
          "type": "warn",
          "text": "In Defense and Survival, wandering more than 50m from where enemies die means you earn **zero** shared affinity. On a leveling run, stay glued to the objective or the carry."
        }
      ]
    },
    {
      "id": "fast-leveling",
      "title": "Choose an affinity farm for your goal",
      "blocks": [
        {
          "type": "p",
          "text": "The best leveling missions pack dense enemy spawns into a small area so shared affinity floods every piece of gear you brought. Bring the gear you want to level, join a public squad (or a strong friend), and let the kills roll in."
        },
        {
          "type": "table",
          "table": {
            "columns": [
              "Method",
              "Best for",
              "Notes"
            ],
            "rows": [
              [
                "Sanctuary Onslaught",
                "Leveling a new Warframe",
                "A practical option after The New Strange. Use the normal mode for a new unranked Warframe; check the entry requirements before selecting Elite."
              ],
              [
                "High-density Defense (e.g. Hydron on Sedna, Helene on Saturn)",
                "Steady squad leveling",
                "Stay near the squad, defend the objective and help with kills or support. Choose a node you can contribute to safely."
              ],
              [
                "Void Fissures",
                "Leveling + loot at once",
                "Double-dip XP while cracking relics — see the Relic Farming tool"
              ],
              [
                "Elite Sanctuary Onslaught",
                "Weapons with a prepared Warframe",
                "Equip the weapon you want to level and contribute to squad kills or support. Elite has a Warframe-rank entry requirement, so it is not the default choice for a newly built frame."
              ],
              [
                "Star Chart nodes you have not cleared",
                "Early account progress",
                "Rank equipment while opening Junctions and earning first-clear mastery. Useful before you unlock dedicated affinity farms."
              ]
            ],
            "note": "These are options for different goals, not measured XP-per-minute rankings. Results depend on your loadout, squad, enemy density and boosters."
          }
        },
        {
          "type": "p",
          "text": "An **Affinity Booster** and an active **double-affinity event** multiply together for 4× affinity. Check the in-game event and booster timers before planning a session. [Void Fissures](/relic-farming) can combine leveling with Prime parts, but you still need a useful loadout and enough Reactant; use the [relic value tool](/relics-value) to compare relic rewards."
        },
        {
          "type": "tip",
          "text": "Choose between **one item quickly** and **several items together**. One equipped weapon receives more shared affinity per kill than each weapon in a full loadout. A full loadout distributes that affinity across more items. Stay active, protect the objective and agree on extraction with your squad."
        }
      ]
    },
    {
      "id": "rank-to-30-loop",
      "title": "The rank-to-30 loop",
      "blocks": [
        {
          "type": "p",
          "text": "Start with accessible equipment you have not mastered. Most gear finishes at rank 30; check for rank-40 exceptions before calling an item complete."
        },
        {
          "type": "steps",
          "ordered": true,
          "steps": [
            {
              "h": "Buy the blueprint / build the item",
              "p": "Grab weapon blueprints from the Market for credits; most cost little. Start the Foundry build before you log off (weapons are often around 12 hours; Warframes take longer once you add up their components) so it's ready next session."
            },
            {
              "h": "Claim it and slot it",
              "p": "Claim the item and mod it before entering a mission. Your Mastery Rank gives it a minimum mod capacity, so unranked equipment does not have to be unmodded."
            },
            {
              "h": "Level it to 30 in one sitting",
              "p": "Take it to an affinity farm (Onslaught, a Defense node, or a Fissure). At 30 it banks its full mastery — 3,000 for a weapon, 6,000 for a frame."
            },
            {
              "h": "Bank it, recycle the slot",
              "p": "Mastery stays on your account after selling equipment. Before selling, check whether the item is an ingredient in another blueprint or something you want for a future build. Keep favorites and hard-to-replace gear."
            },
            {
              "h": "Check the rank-40 exception before using Forma",
              "p": "Repeating previously mastered ranks gives no extra mastery. On overleveling equipment, Forma unlocks new ranks above 30 that do count the first time. Budget Forma for those ranks or for builds you plan to use."
            }
          ]
        },
        {
          "type": "info",
          "text": "Want to see exactly what you're missing? Community mastery trackers and checklists (linked from the [community tools directory](/tools)) let you tick off every weapon and frame so you never build a duplicate you've already mastered."
        }
      ]
    },
    {
      "id": "mr-tests",
      "title": "Mastery Rank test cooldown: failing vs passing",
      "blocks": [
        {
          "type": "p",
          "text": "Reach the required mastery, then launch the rank-up test from your profile. Read its rules: some tests restrict weapons or abilities."
        },
        {
          "type": "steps",
          "ordered": true,
          "steps": [
            {
              "h": "Check the requirement",
              "p": "The next test shows the mastery needed to unlock it. Choose a loadout that fits the challenge."
            },
            {
              "h": "Retry after a failure",
              "p": "A failed attempt has **no cooldown**. Adjust your approach and try again."
            },
            {
              "h": "Wait after a success",
              "p": "Passing starts a **23-hour cooldown** before the next rank-up test."
            }
          ]
        },
        {
          "type": "info",
          "text": "[Update 38: Warframe: 1999](https://www.warframe.com/en/patch-notes/pc/38-0-0) removed the failed-test wait on December 13, 2024. Simaris' test prompt is now **Replay**. Older guides that tell you to wait a day after failing describe the previous rules."
        },
        {
          "type": "tip",
          "text": "Match advice to the exact test. Invisibility or mobility abilities only help where that test permits them; do not assume a recommended frame can bypass every challenge."
        }
      ]
    },
    {
      "id": "should-you-chase",
      "title": "Should you chase MR? Smart breakpoints",
      "blocks": [
        {
          "type": "p",
          "text": "You don't need to *grind* MR — it accrues naturally as you build gear and clear the Star Chart on your way through the [progression roadmap](/guides/progression). But leveling everything you craft (instead of dumping it) is almost always worth it, because MR quietly pays out in gear unlocks, standing, trades, and starting capacity."
        },
        {
          "type": "list",
          "items": [
            "**Level what you build.** Master each equipment rank once. Most items stop at 30; equipment with overleveling has additional mastery above that.",
            "**Clear the whole Star Chart, twice.** Normal nodes, junctions, and [Steel Path](/guides/steel-path) nodes are a massive, one-time mastery source most players leave on the table.",
            "**Watch for gear breakpoints.** Some of the strongest weapons carry an MR requirement, so a few extra ranks can unlock a meta pick you actually want.",
            "**Prioritize MR if you farm standing.** If you're deep into Focus, arcanes or syndicates, the higher daily cap makes every rank pay for itself fast."
          ]
        },
        {
          "type": "p",
          "text": "Use MR as a reason to try more of the game. Keep a reliable combat loadout while you build and master new equipment, so leveling does not stall your quest progress."
        },
        {
          "type": "p",
          "text": "One caveat: don't rank up MR *just* to hit a number if it means jamming underpowered weapons into hard content. Build your account naturally, keep your favorites well-modded, and treat MR as the scoreboard it is — a record of how much of Warframe you've experienced."
        }
      ]
    }
  ],
  "faqs": [
    {
      "q": "How do you increase Mastery Rank in Warframe?",
      "a": "Level equipment ranks you have not mastered, clear new Star Chart nodes and Junctions, then pass the next rank-up test. Most weapons give 3,000 mastery at rank 30; Warframes and companions give 6,000. Overleveling equipment can award additional mastery for its new ranks above 30."
    },
    {
      "q": "What does Mastery Rank actually do?",
      "a": "MR gates certain weapons and gear behind a rank requirement, and raises several daily limits: your syndicate standing cap (which climbs with every rank), your number of daily trades (equal to your MR), and the starting mod capacity on unranked gear. It does not make you hit harder — survivability and damage come from mods and arcanes, not MR."
    },
    {
      "q": "What's the fastest way to farm affinity and level up?",
      "a": "Bring the gear you want to level to a dense affinity farm — Sanctuary Onslaught, a high-density Defense node like Hydron or Helene, or a Void Fissure — and stay within 50m of the kills so you soak shared affinity. Run an Affinity Booster and, ideally, a double-affinity weekend for up to 4× gains. Leveling inside [Void Fissures](/relic-farming) lets you rank gear and farm prime parts at the same time."
    },
    {
      "q": "Does adding Forma or re-leveling a weapon give more mastery?",
      "a": "Repeating ranks you already mastered gives no extra mastery. However, Forma unlocks additional ranks on overleveling equipment such as Kuva, Tenet and Coda weapons or Paracesis. Those new ranks award mastery once: a rank-40 weapon totals 4,000 instead of 3,000."
    },
    {
      "q": "How does affinity sharing work in a squad?",
      "a": "When a squadmate kills an enemy within about 50 meters of you, you receive a share of that affinity — 25% to your Warframe and 75% split evenly across your equipped weapons. That's why a gun you never fire still levels up if you tag along with a nuker. Wander outside the 50m range and you get nothing. (Your own weapon kills split differently: 50% to the weapon, 50% to your Warframe.)"
    },
    {
      "q": "What happens if I fail a Mastery Rank test?",
      "a": "You can retry immediately after failing. The cooldown applies after passing: wait 23 hours before the next rank-up test. Digital Extremes changed these rules in Update 38 on December 13, 2024."
    },
    {
      "q": "Is there a maximum Mastery Rank?",
      "a": "MR30 is the top numbered rank. After that you keep earning mastery toward Legendary Ranks (LR1, LR2, and up), which DE extends over time. You don't need to own every item to reach MR30 — there are far more weapons and frames than the rank requires."
    },
    {
      "q": "Should I rush Mastery Rank as a new player?",
      "a": "No need to obsess over it — MR climbs naturally as you build gear and clear the Star Chart. But leveling everything you craft to 30 once is worth it, since higher MR unlocks stronger weapons and raises your daily standing and trade caps. Focus on a solid roster and mods first; the ranks follow."
    }
  ],
  "videos": [
    {
      "id": "5B01ZDPCM_o",
      "title": "Warframe How to get Mastery Rank FAST | Warframe Affinity and Mastery Rank Explained",
      "channel": "CerealOverdrive"
    },
    {
      "id": "J_6wVLRvTpE",
      "title": "HOW TO FARM MASTERY RANK FAST IN 2025! WARFRAME BEST LEVELING AFFINITY SPOTS",
      "channel": "Pupsker"
    },
    {
      "id": "eTI-zSoH6FE",
      "title": "How to Level up fast in Warframe -  Affinity farming Guide for all Players",
      "channel": "QuadLyStop"
    },
    {
      "id": "ecySSBRcCIo",
      "title": "Warframe: FAST MASTERY RANK 2025!...",
      "channel": "MHBlacky"
    }
  ],
  "sources": [
    {
      "label": "Digital Extremes — Update 38: Mastery Rank test changes",
      "href": "https://www.warframe.com/en/patch-notes/pc/38-0-0"
    },
    {
      "label": "Warframe Support — Mastery Basics",
      "href": "https://support.warframe.com/hc/en-us/articles/218718097-Mastery-Basics"
    },
    {
      "label": "Digital Extremes — Update 38.5: Coda overleveling",
      "href": "https://www.warframe.com/en/patch-notes/pc/38-5-0"
    },
    {
      "label": "Digital Extremes — Devstream 110: Sanctuary Onslaught requirements",
      "href": "https://www.warframe.com/en/news/devstream-110-overview"
    },
    {
      "label": "Warframe Wiki — Mastery Rank",
      "href": "https://wiki.warframe.com/w/Mastery_Rank"
    },
    {
      "label": "Warframe Wiki — Affinity",
      "href": "https://wiki.warframe.com/w/Affinity"
    }
  ],
  "related": [
    {
      "label": "Progression Roadmap",
      "to": "/guides/progression",
      "icon": "map-marker-path",
      "note": "Where MR fits in the bigger climb"
    },
    {
      "label": "New Player Guide",
      "to": "/guides/new-player",
      "icon": "rocket-launch",
      "note": "Your first 20 hours, done right"
    },
    {
      "label": "Syndicate Standing",
      "to": "/guides/standing",
      "icon": "handshake",
      "note": "Higher MR = a bigger daily cap"
    },
    {
      "label": "Focus & Operator",
      "to": "/guides/focus",
      "icon": "eye-outline",
      "note": "Leveling gear feeds your Focus"
    },
    {
      "label": "Steel Path",
      "to": "/guides/steel-path",
      "icon": "skull-outline",
      "note": "A second Star Chart of free mastery"
    },
    {
      "label": "Community Tools",
      "to": "/tools",
      "icon": "tools",
      "note": "Mastery trackers & checklists"
    }
  ],
  "updated": "2026-09-14"
}

export default guide
