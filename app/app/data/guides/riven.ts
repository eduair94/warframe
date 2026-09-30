// Riven guide content; gameplay changes are reviewed against the primary sources below.
import type { Guide } from './types'

const guide: Guide = {
  "slug": "riven",
  "eyebrow": "Knowledge Center · Riven Mods",
  "title": "Riven Mods: Trait Locking, Kuva Costs & Trading",
  "lede": "Learn how Riven Mods work, preserve one existing stat with Trait Locking, compare Kuva costs and assess a roll before trading. Includes the Update 44 rules and the announced status of Riven Splicing.",
  "category": "systems",
  "readMins": 10,
  "stats": [
    {
      "num": "2–4",
      "label": "stats per riven",
      "tone": "good"
    },
    {
      "num": "1–5",
      "label": "disposition dots",
      "tone": "alt"
    },
    {
      "num": "8",
      "label": "max riven rank",
      "tone": "gold"
    },
    {
      "num": "2×",
      "label": "Kuva cost when cycling with a locked trait",
      "tone": "gold"
    }
  ],
  "sections": [
    {
      "id": "what-is-a-riven",
      "title": "What a Riven mod actually is",
      "blocks": [
        {
          "type": "p",
          "text": "A **Riven Mod** has randomized stats and fits a specific weapon family. For example, a Braton Riven works on the Braton and its variants, but not on an unrelated rifle. An unveiled Riven has **2–3 positive traits**, with or without one negative trait. Compare the actual numbers on your intended weapon before replacing a regular Mod."
        },
        {
          "type": "p",
          "text": "A Riven can combine several useful bonuses in one Mod slot, but a random roll is not automatically an upgrade. The weapon, stat combination, negative trait, rank and weapon Disposition all matter. The sections below cover ordinary cycling and the optional Trait Locking introduced in Update 44."
        },
        {
          "type": "kv",
          "kv": [
            {
              "k": "What it is",
              "v": "A weapon-specific mod with randomized stats"
            },
            {
              "k": "Fits",
              "v": "One weapon and its variants — a \"Braton\" riven works on the Braton, Braton Prime, Vandal and MK1"
            },
            {
              "k": "Stats",
              "v": "2–4 randomized — 2–3 buffs plus an optional curse"
            },
            {
              "k": "Max rank",
              "v": "Rank 8, upgraded with Endo (very expensive)"
            },
            {
              "k": "MR to equip",
              "v": "A random Mastery Rank requirement (8–16) is set when unveiled"
            },
            {
              "k": "Quest reward",
              "v": "Completing The War Within rewards a Riven Mod"
            }
          ]
        }
      ]
    },
    {
      "id": "disposition",
      "title": "Riven Disposition and weapon variants",
      "blocks": [
        {
          "type": "p",
          "text": "**Riven Disposition** is a weapon-specific multiplier represented by **1 to 5 dots**. Higher Disposition gives larger bonuses for an equivalent Riven roll. Different variants of the same weapon can use different multipliers, so preview the Riven on the exact variant you intend to equip. Cycling a Riven does not reroll the weapon’s Disposition."
        },
        {
          "type": "table",
          "table": {
            "columns": [
              "Dots",
              "Roughly means",
              "What to check"
            ],
            "rows": [
              [
                "5 (highest)",
                "Larger bonuses for an equivalent roll",
                "The exact weapon variant and stat combination"
              ],
              [
                "3 (middle)",
                "Intermediate Disposition band",
                "Whether the Riven improves your existing build"
              ],
              [
                "1 (lowest)",
                "Smaller bonuses for an equivalent roll",
                "Whether several useful traits justify the Mod slot"
              ]
            ],
            "note": "Dots summarize a multiplier; they do not establish a trading price. Consult the current in-game preview and the latest official Disposition list."
          }
        },
        {
          "type": "info",
          "text": "The [September 2026 Disposition announcement](https://forums.warframe.com/topic/1523355-september-2026-riven-dispositions/) documents the latest changes. Demand, new weapon options and individual rolls also affect listings. A Disposition change alone does not guarantee that your Riven will sell for more or less Platinum."
        }
      ]
    },
    {
      "id": "reading-a-riven",
      "title": "Reading a riven: buffs, curses, and \"god rolls\"",
      "blocks": [
        {
          "type": "p",
          "text": "An unveiled Riven has positive traits and may also have a negative trait, often called a **curse**. A negative can increase the positive values, but it may also damage the build. Reduced zoom or reduced Impact can be acceptable for some weapons and uses; inspect the consequence rather than assuming any negative is harmless."
        },
        {
          "type": "table",
          "table": {
            "columns": [
              "Layout",
              "What it means",
              "Value note"
            ],
            "rows": [
              [
                "2 buffs",
                "Two positives, no curse",
                "Judge the two actual bonuses, not just the line count"
              ],
              [
                "3 buffs",
                "Three positives, no curse",
                "Useful when all three bonuses fit the build"
              ],
              [
                "2 buffs + 1 curse",
                "Two positives plus a curse; buffs are boosted",
                "Great when the curse is harmless"
              ],
              [
                "3 buffs + 1 curse",
                "Three positives plus one negative",
                "Not automatically better than two positives and a harmless negative"
              ]
            ]
          }
        },
        {
          "type": "p",
          "text": "What counts as a *good* buff depends on the weapon. On a crit gun you want things like **critical chance, critical damage, multishot, and base damage**, ideally with the right elemental or faction stat. On a status weapon you'd weight status chance and multishot instead. There's no universal best roll — the ideal riven is the one that fills the gaps your normal mods can't, stacking on top of your regular build like any other mod."
        },
        {
          "type": "tip",
          "text": "The riven's made-up name (that `critacan`/`visitox` gibberish) is purely cosmetic — it's generated from the stats and doesn't affect power. Judge a riven by its actual stat lines, disposition, and MR requirement, never by its name."
        },
        {
          "type": "info",
          "text": "**Shotgun Rivens can now roll Zoom**, following [Hotfix 44.0.2](https://www.warframe.com/en/patch-notes/pc/44-0-2). The same hotfix repaired invalid duplicate traits and extra negatives caused by a launch bug; its affected-roll Kuva refund script is marked complete. Check the current Mod and notes when an older screenshot or trait list disagrees."
        }
      ]
    },
    {
      "id": "veiled-and-unveiling",
      "title": "Veiled rivens and how to unlock them",
      "blocks": [
        {
          "type": "p",
          "text": "A veiled Riven conceals its weapon and stats. Reveal its challenge, then **equip the challenged Riven on a compatible weapon** and follow the exact conditions. Bringing a weapon of the matching category without the Riven equipped is not enough. Completing the challenge unveils its weapon and traits."
        },
        {
          "type": "p",
          "text": "Sources include **Sorties**, the **Steel Path Circuit** reward path and **Palladino** in Iron Wake, who exchanges Riven Slivers for weekly Riven offers. Check the current reward path or vendor offer before farming. **The War Within** also rewards a Riven. Kuva Siphon and Flood missions provide the resource used for cycling; they are not direct Riven Mod rewards."
        },
        {
          "type": "steps",
          "steps": [
            {
              "h": "Get a veiled riven",
              "p": "Complete a Sortie, claim one from the Steel Path Circuit's weekly reward path in Duviri, or farm ten Riven Slivers and trade them to Palladino in Iron Wake."
            },
            {
              "h": "Check the challenge",
              "p": "Open the riven in your Mods menu to see its unveil challenge and which weapon category it requires."
            },
            {
              "h": "Equip the challenged Riven",
              "p": "Install the Riven on a compatible weapon, bring that weapon into the mission, and satisfy the challenge’s exact conditions."
            },
            {
              "h": "Complete the challenge",
              "p": "Do the task in any suitable mission. Once it's done the riven unveils its weapon and random stats on the spot."
            }
          ]
        },
        {
          "type": "tip",
          "text": "Some challenges are fiddly (\"no shields,\" \"no alarms,\" specific mission types). Look the exact wording up on the [wiki](https://wiki.warframe.com/) first — a two-minute read saves you a dozen failed attempts, and many can be knocked out fast in a low-level solo mission."
        }
      ]
    },
    {
      "id": "rolling-with-kuva",
      "title": "Cycling with Kuva: ordinary rolls and Trait Locking",
      "blocks": [
        {
          "type": "p",
          "text": "**Cycling** spends Kuva to generate another roll for the same weapon. Without a locked trait, the stat types, values and layout can change. The standard cost rises from **900 Kuva** to **3500 Kuva** as its cycle count rises. With one trait locked, the displayed cycling cost is doubled: **1800** for the first cycle or **7000** at the standard cap. Check the cost before confirming."
        },
        {
          "type": "kv",
          "kv": [
            {
              "k": "Ordinary cycling",
              "v": "No locked trait: 900 Kuva initially, up to 3500 per cycle"
            },
            {
              "k": "Cycling with a lock",
              "v": "Double the ordinary cost: 1800 initially, up to 7000 per cycle"
            },
            {
              "k": "What stays",
              "v": "The weapon; with Trait Locking, the selected trait and positive/negative layout also stay"
            },
            {
              "k": "What is random",
              "v": "The other traits; a lock does not select a missing stat for you"
            }
          ]
        },
        {
          "type": "warn",
          "text": "Set a Kuva budget and a usable target before cycling. A lock protects one existing trait but does not guarantee a useful combination elsewhere. Compare the new roll with the old one and check the selection before accepting. The [Kuva farming guide](/guides/kuva) helps compare sources and plan how many cycles your budget buys."
        }
      ]
    },
    {
      "id": "trait-locking",
      "title": "How to lock a Riven trait in Update 44",
      "blocks": [
        {
          "type": "p",
          "text": "[Update 44](https://www.warframe.com/en/patch-notes/pc/44-0-0) introduced **Trait Locking**. You can retain one existing trait while cycling the others. Adding or removing the lock is free and needs no special item; the extra Kuva is charged when you cycle with that lock active."
        },
        {
          "type": "steps",
          "steps": [
            {
              "h": "Open the cycling screen",
              "p": "Select the Riven in the Mod Segment and choose Cycle Riven."
            },
            {
              "h": "Choose the existing trait",
              "p": "Select Lock Trait, then the trait you want to preserve. Check the lock icon and the doubled Kuva cost."
            },
            {
              "h": "Check the layout before spending",
              "p": "The number of positive and negative traits stays fixed while locked. A roll with 3 positives and 1 negative remains in that layout; unlock it before cycling if you want a different layout."
            },
            {
              "h": "Reapply the lock next session",
              "p": "Closing the cycling menu removes the lock. Check and reapply it each time you reopen the menu."
            }
          ]
        },
        {
          "type": "tip",
          "text": "**Budget example:** 35000 Kuva buys 10 ordinary cycles at 3500 each, or 5 cycles with a locked trait at 7000 each. This is cost arithmetic, not a prediction of the number of useful rolls. Consider a lock when you already have a trait worth preserving."
        },
        {
          "type": "info",
          "title": "Riven Splicing is a separate, upcoming feature",
          "text": "As checked on September 30, 2026, **Riven Splicing is still upcoming**. Digital Extremes announced **October 7, 2026** for Glacial Defiance, the release that is due to include Splicing. Trait Locking is already available. Recheck the launch notes before planning around Riven Splicers or combined traits."
        }
      ]
    },
    {
      "id": "ranking-and-endo",
      "title": "Ranking up rivens — and why bad ones are just Endo",
      "blocks": [
        {
          "type": "p",
          "text": "Like other mods, rivens are leveled with **Endo and credits**, from **rank 0 up to rank 8**. Each rank raises the stat values *and* the drain, which can reach around 18 — making a maxed riven one of the most capacity-hungry mods in the game. A weapon running a rank-8 riven almost always needs an extra Forma or two to fit everything. If you need Endo, the [Endo farming guide](/guides/endo) covers the fastest sources."
        },
        {
          "type": "tip",
          "text": "Before dissolving an unwanted Riven, inspect its in-game Endo return and compare current listings for that weapon and roll. Dissolving consumes the Mod. The [Endo / Plat value tool](/endo) can help compare Endo sources, but it cannot guarantee a buyer or a sale price for your individual Riven."
        }
      ]
    },
    {
      "id": "trading-and-pricing",
      "title": "Trading and pricing rivens",
      "blocks": [
        {
          "type": "p",
          "text": "Riven listings vary with weapon demand, useful traits, negative effects and the actual stat values. Low Disposition alone does not make a roll worthless, and high Disposition does not guarantee demand. Compare several listings for the same weapon and a similar roll; an asking price is not proof of a completed sale. Check available Riven capacity and the trade confirmation before buying."
        },
        {
          "type": "table",
          "table": {
            "columns": [
              "Factor",
              "What to compare"
            ],
            "rows": [
              [
                "Weapon",
                "Demand for that weapon and the variant buyers intend to use"
              ],
              [
                "Disposition",
                "Actual values on that variant, not dots alone"
              ],
              [
                "Stat combo",
                "Useful positives and the effect of the negative on the intended build"
              ],
              [
                "MR & rolls",
                "Equip requirement and the Kuva cost of further cycling"
              ]
            ]
          }
        },
        {
          "type": "p",
          "text": "Don't guess in the dark. Estimate a fair number before you buy or list, then sanity-check the wider market for the same weapon:"
        },
        {
          "type": "links",
          "links": [
            {
              "label": "Riven value estimator",
              "to": "/riven-value",
              "icon": "calculator-variant",
              "note": "Estimate what a specific roll is worth"
            },
            {
              "label": "Endo / Plat value",
              "to": "/endo",
              "icon": "diamond-stone",
              "note": "Dissolve-for-Endo vs sell math"
            },
            {
              "label": "Flip finder",
              "to": "/flip",
              "icon": "swap-horizontal",
              "note": "Buy-bid / sell-ask spreads"
            },
            {
              "label": "Community tools",
              "to": "/tools",
              "icon": "tools",
              "note": "Riven markets, wikis and DE tools"
            }
          ]
        }
      ]
    },
    {
      "id": "do-you-need-one",
      "title": "Do you even need a riven?",
      "blocks": [
        {
          "type": "info",
          "text": "Rivens are **endgame min-maxing, not a requirement.** A properly modded weapon clears the entire star chart — and most of the Steel Path — with no riven at all. They're for squeezing extra power out of a gun you already love or pushing into deep endurance runs, not something a new player needs to chase."
        },
        {
          "type": "p",
          "text": "If you are newer, prioritize **core Mods, damage types and survivability**. Once you have a working build, compare an affordable ready-made roll with the time and Kuva you would spend cycling your own. Decide whether to keep, trade or dissolve an unwanted Riven after checking its market and [Endo](/guides/endo) value."
        }
      ]
    }
  ],
  "videos": [
    {
      "id": "mDWzPgDUH1k",
      "title": "What you MUST KNOW about RIVENS in Warframe 2026!",
      "channel": "MHBlacky"
    },
    {
      "id": "t66oSX1BkLc",
      "title": "How to Get Riven Mods and What They Do | Beginner's Guide",
      "channel": "Tipsy"
    },
    {
      "id": "CwcTyXalWrs",
      "title": "Rings Of Riven Hell | Warframe Riven Mod & Platinum Farming",
      "channel": "turbomonk"
    },
    {
      "id": "U9-2UbALrQw",
      "title": "ULTIMATE Riven Mod Guide!",
      "channel": "Jacsonitos"
    }
  ],
  "faqs": [
    {
      "q": "How do I get riven mods in Warframe?",
      "a": "Check Sortie rewards, the Steel Path Circuit reward path and Palladino’s weekly Riven Sliver exchanges in Iron Wake. Completing The War Within also rewards a Riven Mod. Each source has its own access and reward conditions; Siphons and Floods provide Kuva for cycling rather than Riven Mods themselves."
    },
    {
      "q": "How do I unveil a veiled riven?",
      "a": "Reveal the challenge, equip the challenged Riven on a compatible weapon, and complete the stated conditions. A matching weapon without that Riven installed is not enough. Read any mission, equipment or failure restrictions before entering the mission."
    },
    {
      "q": "How do I re-roll a riven and what does it cost?",
      "a": "Choose Cycle Riven in the Mod Segment. Without a lock, the cost begins at 900 Kuva and reaches a cap of 3500 as its cycle count rises. Trait Locking doubles that cycle’s cost, up to 7000 at the standard cap, while preserving one existing trait and the positive/negative layout. Read the [Kuva guide](/guides/kuva) to plan a budget."
    },
    {
      "q": "What is riven disposition?",
      "a": "Disposition is a weapon-specific multiplier represented by 1 to 5 dots. It affects the strength of Riven stats and can differ between weapon variants. Cycling does not change that multiplier. Preview the exact variant and consult the latest official Disposition announcement."
    },
    {
      "q": "What is a 'god roll' riven?",
      "a": "Players use this term for a roll that fits a particular weapon and build especially well. It is not a fixed recipe or a guaranteed trading value. Compare the useful positives, actual values and effect of the negative; more stat lines alone do not make a better roll. The [Riven value estimator](/riven-value) is a starting point for comparing listings."
    },
    {
      "q": "Are rivens worth it for new players?",
      "a": "Build a working loadout with core Mods first. A Riven is an optional way to improve a weapon you already use, and a random roll may be worse than the Mod it replaces. Set a budget before buying or cycling one."
    },
    {
      "q": "Can I dissolve a riven for Endo?",
      "a": "Yes. Check the in-game Endo return and current comparable Riven listings before confirming, because dissolving consumes the Mod. The [Endo value tool](/endo) helps compare sources; it does not establish a guaranteed sale price for your roll."
    },
    {
      "q": "Why do riven prices swing so much?",
      "a": "Prices reflect weapon demand, the exact trait combination, stat values and current listings. New systems and weapon changes can affect what players want. Compare similar rolls and treat the [Riven value estimator](/riven-value) as guidance, not proof of a completed sale or a guaranteed future price."
    },
    {
      "q": "Can I lock a Riven stat while rerolling?",
      "a": "Yes. Trait Locking lets you preserve one existing trait, but cycling with it costs twice as much Kuva. The positive/negative layout also stays fixed. Adding or removing the lock is free, and closing the cycling menu removes it."
    },
    {
      "q": "Is Riven Splicing available yet?",
      "a": "As checked on September 30, 2026, Splicing is still upcoming with Glacial Defiance, announced for October 7, 2026. Trait Locking is already live. Check the release notes when the update launches before planning around Riven Splicers or combined traits."
    }
  ],
  "sources": [
    {
      "label": "Warframe — Update 44: Iceblade of Narin (September 23, 2026)",
      "href": "https://www.warframe.com/en/patch-notes/pc/44-0-0"
    },
    {
      "label": "Warframe — Hotfix 44.0.2: Riven trait and cycling fixes",
      "href": "https://www.warframe.com/en/patch-notes/pc/44-0-2"
    },
    {
      "label": "Warframe — Riven Expansion developer workshop",
      "href": "https://forums.warframe.com/topic/1523869-riven-expansion-trait-locking-riven-splicing/"
    },
    {
      "label": "Warframe — September 2026 Riven Dispositions",
      "href": "https://forums.warframe.com/topic/1523355-september-2026-riven-dispositions/"
    },
    {
      "label": "Warframe — Glacial Defiance date announcement (PSA updated September 29, 2026)",
      "href": "https://forums.warframe.com/topic/1523427-psa-glacial-defiance-release-window-outdated/"
    },
    {
      "label": "Warframe — Riven cycling cost cap (Update 19.4)",
      "href": "https://www.warframe.com/en/patch-notes/pc/19-4-1"
    },
    {
      "label": "Warframe — Cycling cost and roll selection (Hotfix 19.0.6)",
      "href": "https://www.warframe.com/en/patch-notes/pc/19-0-6"
    },
    {
      "label": "Warframe Wiki — Riven Mods",
      "href": "https://wiki.warframe.com/w/Riven_Mods"
    },
    {
      "label": "Warframe Wiki — Riven Sliver",
      "href": "https://wiki.warframe.com/w/Riven_Sliver"
    },
    {
      "label": "r/Warframe — I love riven challenges",
      "href": "https://reddit.com/r/Warframe/comments/1toi7ph/i_love_riven_challanges/"
    },
    {
      "label": "r/Warframe — Every time Sortie gives me a Riven mod",
      "href": "https://reddit.com/r/Warframe/comments/h0jktp/every_time_sortie_gives_me_a_riven_mod/"
    },
    {
      "label": "r/Warframe — the RNG requiem/Kuva/riven casino rant",
      "href": "https://reddit.com/r/Warframe/comments/dr46xo/so_let_me_get_this_straight_we_need_to_farm_rng/"
    }
  ],
  "related": [
    {
      "label": "Endo Farming",
      "to": "/guides/endo",
      "icon": "diamond-stone",
      "note": "Rank rivens up — or cash bad ones in"
    },
    {
      "label": "Riven Value Estimator",
      "to": "/riven-value",
      "icon": "calculator-variant",
      "note": "Price a roll before you trade"
    },
    {
      "label": "Endo / Plat Value",
      "to": "/endo",
      "icon": "scale-balance",
      "note": "Dissolve-for-Endo vs sell math"
    },
    {
      "label": "Flip Finder",
      "to": "/flip",
      "icon": "swap-horizontal",
      "note": "Buy-bid / sell-ask spreads"
    },
    {
      "label": "Community Tools",
      "to": "/tools",
      "icon": "tools",
      "note": "Riven markets, wikis and DE tools"
    }
  ],
  "updated": "2026-09-30"
}

export default guide
