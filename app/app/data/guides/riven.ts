// Auto-generated Warframe Knowledge Center guide content.
// Drafted grounded in r/Warframe research (reddit API) + the subreddit wiki FAQ,
// then adversarially fact-checked for evergreen accuracy. Embedded video ids were
// verified live via YouTube oEmbed. Edit freely — this is the single source for
// the /guides/riven page (rendered by <GuideArticle>).
import type { Guide } from './types'

const guide: Guide = {
  "slug": "riven",
  "eyebrow": "Knowledge Center · Riven Mods",
  "title": "Riven Mods Explained",
  "lede": "Rivens are Warframe's slot-machine mods: weapon-locked, randomly rolled, and capable of turning a forgotten gun into a monster. Here's how they work, what makes one valuable, and when they're actually worth your Kuva.",
  "category": "systems",
  "readMins": 9,
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
      "num": "~3,500",
      "label": "Kuva per re-roll cap",
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
          "text": "A **Riven Mod** is a special mod with **randomized stats that is locked to one weapon** (and that weapon's variants). A Braton riven fits the Braton — and its Prime, Vandal and MK1 versions — but nothing else; a Kronen riven only fits Kronen. When a riven reveals itself it rolls **2–4 stats** — a mix of powerful buffs and, sometimes, a single downside (a *curse*). No two rivens are identical, which is exactly why they can be both the best mod on your gun and a chaotic trading economy of their own."
        },
        {
          "type": "p",
          "text": "Rivens exist for the main weapon families — **rifle, shotgun, pistol, melee, and archgun** (plus kitgun and zaw types). The upside is huge: a good riven can add more raw power than any single normal mod. The catch is that everything about it — the stats, their values, even *which* weapon it's for — is RNG until you unveil it, and it's one of the most capacity-hungry mods in the game."
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
              "k": "Prerequisite",
              "v": "Finish The War Within quest — it grants your first riven and unlocks the main sources"
            }
          ]
        }
      ]
    },
    {
      "id": "disposition",
      "title": "Disposition: why the same idea is godly on one gun and junk on another",
      "blocks": [
        {
          "type": "p",
          "text": "**Riven Disposition** is a per-weapon multiplier shown as **1 to 5 dots**. It scales how strong a riven's stats are on that weapon. Crucially, disposition is *inverse to popularity*: weak, rarely-used weapons get **high** disposition (bigger riven bonuses), while popular meta weapons get **low** disposition (smaller bonuses) — and even different variants of the same weapon can carry slightly different dispositions. It's DE's balancing lever so rivens can't just make the best guns permanently better."
        },
        {
          "type": "table",
          "table": {
            "columns": [
              "Dots",
              "Roughly means",
              "Typical weapon"
            ],
            "rows": [
              [
                "5 (highest)",
                "Strongest rolls (around ×1.5 at the top)",
                "Rarely-used / underpowered weapons"
              ],
              [
                "3 (middle)",
                "Solid, mid-range bonuses",
                "Decent but non-meta picks"
              ],
              [
                "1 (lowest)",
                "Weakest rolls (around ×0.5)",
                "Very popular / meta weapons"
              ]
            ],
            "note": "Exact multipliers are approximate and DE re-tunes them periodically based on how much each weapon is used — always check the live wiki for a weapon's current dots."
          }
        },
        {
          "type": "info",
          "text": "Because dispositions shift, a riven you buy can gain or lose value overnight when DE adjusts a weapon. A weapon that gets a disposition *nerf* makes its rivens weaker (and cheaper); a *buff* makes them stronger (and pricier). This is the single biggest reason riven prices swing."
        }
      ]
    },
    {
      "id": "reading-a-riven",
      "title": "Reading a riven: buffs, curses, and \"god rolls\"",
      "blocks": [
        {
          "type": "p",
          "text": "Every revealed riven has a randomized layout of positive stats and, optionally, one negative. A **curse** isn't automatically bad — a riven *with* a curse gets a boost to its positive values. The trick is landing a curse you don't care about (like `-zoom`, `-recoil`, or `-impact` on a build that ignores those) so you keep the boosted buffs for free."
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
                "Safe but modest — cheap and fine for casual play"
              ],
              [
                "3 buffs",
                "Three positives, no curse",
                "A strong, no-downside all-rounder"
              ],
              [
                "2 buffs + 1 curse",
                "Two positives plus a curse; buffs are boosted",
                "Great when the curse is harmless"
              ],
              [
                "3 buffs + 1 curse",
                "Three positives plus a curse; highest stat values",
                "The classic 'god roll' shape"
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
        }
      ]
    },
    {
      "id": "veiled-and-unveiling",
      "title": "Veiled rivens and how to unlock them",
      "blocks": [
        {
          "type": "p",
          "text": "Rivens usually arrive **veiled** — you can't see the weapon or stats yet, only the category (Rifle, Shotgun, Pistol, Melee, etc.). To reveal it you complete a **randomized challenge** while using a weapon of the matching type, such as killing enemies with headshots mid-air, finishing a mission without being detected, or killing a string of enemies while sliding. Finish the challenge and the riven rolls its weapon and stats."
        },
        {
          "type": "p",
          "text": "The main sources of veiled rivens are **Sorties** — the daily three-mission challenge, which rewards a riven roughly a quarter of the time — and the **Steel Path Circuit** in Duviri, whose weekly reward path can hand out a veiled riven. You can also farm **Riven Slivers** (Eximus enemies drop them, especially on the Steel Path) and take **ten to Palladino** in Iron Wake on Earth, who transmutes them into a veiled riven on a weekly limit. Completing **The War Within** quest also grants your very first riven. Note that Kuva Siphon and Kuva Flood missions give you the *Kuva* you'll spend re-rolling — they don't drop the rivens themselves."
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
              "h": "Equip the right weapon type",
              "p": "Bring a weapon of that category (rifle, pistol, melee, etc.) — the challenge only counts with the matching type equipped."
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
      "title": "Rolling with Kuva",
      "blocks": [
        {
          "type": "p",
          "text": "Don't like your roll? You can **re-roll** (cycle) a riven to completely re-randomize it — the stats, how many there are, and their values all change. Each re-roll costs **Kuva**, and the price ramps up with every roll on that riven: it starts around 900 and climbs to a **cap of about 3,500 Kuva per roll**, where it stays. Kuva comes from Kuva Siphon and Kuva Flood missions and the endless Kuva Survival on the Kuva Fortress."
        },
        {
          "type": "kv",
          "kv": [
            {
              "k": "Cost",
              "v": "Kuva, per re-roll"
            },
            {
              "k": "Ramp",
              "v": "~900 Kuva, climbing to a ~3,500 cap"
            },
            {
              "k": "Effect",
              "v": "Re-randomizes stat count, stats, and values"
            },
            {
              "k": "Odds",
              "v": "Pure RNG — no pity system, no way to target a specific stat"
            }
          ]
        },
        {
          "type": "warn",
          "text": "Re-rolling is a bottomless Kuva sink. Because it's pure RNG, chasing a perfect roll can eat *millions* of Kuva — one well-known player was filmed re-rolling a single riven thousands of times. Before you grind, decide what \"good enough\" looks like and stop there. Often it's cheaper to buy a solid roll from another player than to gamble for a god roll yourself."
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
          "text": "Got a riven you'll never use? **Dissolve it for Endo.** The amount scales with how many times it's been re-rolled (plus its rank and MR), so heavily-cycled junk rivens can be a tidy Endo lump. Because the market is flooded with mediocre rolls, most bad rivens are worth more to you as Endo than as a 1–2 plat sale — run the numbers on the [Endo / Plat value tool](/endo) before you decide to dissolve, keep, or list one."
        }
      ]
    },
    {
      "id": "trading-and-pricing",
      "title": "Trading and pricing rivens",
      "blocks": [
        {
          "type": "p",
          "text": "Rivens are traded player-to-player, and because every one is unique, pricing is more art than science. A great roll on a beloved weapon can be worth hundreds of platinum; the same stats on a low-disposition meta gun might be near-worthless. You can also trade **veiled** rivens — cheaper, blind gambles where the buyer completes the unveil themselves. Note that rivens carry a **heavier credit trade tax** than normal mods, and you hold a **capped number of riven slots** that you can expand with platinum."
        },
        {
          "type": "table",
          "table": {
            "columns": [
              "Factor",
              "Pushes the price UP when…"
            ],
            "rows": [
              [
                "Weapon",
                "It's a popular / meta weapon that many players build for"
              ],
              [
                "Disposition",
                "The weapon has high dots (4–5), so stats hit harder"
              ],
              [
                "Stat combo",
                "The buffs match the ideal build and any curse is harmless"
              ],
              [
                "MR & rolls",
                "Low MR requirement, plus a clean roll a buyer won't feel the need to re-roll"
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
          "text": "If you're newer, prioritize your **core mods, damage types, and survivability** first — those matter far more than any riven. When you do want one, buying a decent roll for a weapon you main is almost always smarter than gambling your Kuva for a god roll. And if a riven falls in your lap that you'll never use, treat it as [Endo](/guides/endo) or a bit of trade platinum and move on."
        }
      ]
    }
  ],
  "videos": [
    { "id": "mDWzPgDUH1k", "title": "What you MUST KNOW about RIVENS in Warframe 2026!", "channel": "MHBlacky" },
    { "id": "t66oSX1BkLc", "title": "How to Get Riven Mods and What They Do | Beginner's Guide", "channel": "Tipsy" },
    { "id": "CwcTyXalWrs", "title": "Rings Of Riven Hell | Warframe Riven Mod & Platinum Farming", "channel": "turbomonk" },
    { "id": "U9-2UbALrQw", "title": "ULTIMATE Riven Mod Guide!", "channel": "Jacsonitos" }
  ],
  "faqs": [
    {
      "q": "How do I get riven mods in Warframe?",
      "a": "The main sources are Sorties (the daily three-mission challenge, which rewards a riven about a quarter of the time), the Steel Path Circuit in Duviri, and Riven Slivers — farm ten (Eximus enemies drop them, especially on the Steel Path) and trade them to Palladino in Iron Wake for a veiled riven. You must finish The War Within quest first, and completing it also gives you your very first riven. Kuva Siphon and Kuva Flood missions give you the Kuva used to re-roll rivens, not the rivens themselves."
    },
    {
      "q": "How do I unveil a veiled riven?",
      "a": "Open the veiled riven in your Mods menu to see its challenge and required weapon category, then complete that challenge with a matching weapon equipped (a rifle for a rifle riven, and so on). Once you finish it, the riven reveals its weapon and random stats. Look the exact challenge wording up on the wiki first — some have tricky conditions like no shields or no alarms."
    },
    {
      "q": "How do I re-roll a riven and what does it cost?",
      "a": "You re-roll (cycle) a riven from the Mods menu using Kuva, which completely re-randomizes its stats. The cost ramps up per roll on that mod, starting around 900 Kuva and capping near 3,500. It's pure RNG with no pity system, so set a 'good enough' target before you start burning Kuva. Farm the Kuva itself from Kuva Siphon and Kuva Flood missions and the Kuva Fortress."
    },
    {
      "q": "What is riven disposition?",
      "a": "Disposition is a per-weapon multiplier shown as 1 to 5 dots that scales how strong a riven's stats are on that weapon. It's inverse to popularity: weak or rarely-used weapons get high disposition (stronger rivens), while meta weapons get low disposition. DE re-tunes dispositions periodically, which is why riven prices rise and fall — check the live wiki for a weapon's current dots."
    },
    {
      "q": "What is a 'god roll' riven?",
      "a": "A god roll is a riven whose randomized stats line up perfectly with your build — usually three strong buffs (like crit chance, crit damage, and multishot or damage) plus a curse you don't care about, such as -zoom or -recoil. There's no universal best roll; the ideal riven fills the gaps your normal mods can't. Use our /riven-value estimator to gauge what a specific roll is worth."
    },
    {
      "q": "Are rivens worth it for new players?",
      "a": "Not really — rivens are endgame min-maxing, and a well-modded weapon clears the star chart and most of the Steel Path without one. Focus on your core mods, damage types, and survivability first. When you do want a riven, buying a decent roll for a weapon you main is usually smarter than gambling Kuva for a god roll."
    },
    {
      "q": "Can I dissolve a riven for Endo?",
      "a": "Yes. Unwanted rivens can be dissolved for Endo, and the amount scales with how many times the riven has been re-rolled (plus its rank and mastery requirement), so heavily-cycled junk rivens give a decent Endo lump. Since the market is flooded with mediocre rolls, a bad riven is often worth more as Endo than as a 1–2 platinum sale — run it through the /endo tool before deciding."
    },
    {
      "q": "Why do riven prices swing so much?",
      "a": "Because each riven is unique, its value depends on the weapon's popularity, its disposition, the exact stat combo, and its MR requirement. When DE adjusts a weapon's disposition, every riven for that gun instantly gets stronger or weaker, moving prices with it. Always estimate a fair number with /riven-value and check the current market before buying or listing."
    }
  ],
  "sources": [
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
  "updated": "2026-07-18"
}

export default guide
