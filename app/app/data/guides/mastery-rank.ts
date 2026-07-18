// Auto-generated Warframe Knowledge Center guide content.
// Drafted grounded in r/Warframe research (reddit API) + the subreddit wiki FAQ,
// then adversarially fact-checked for evergreen accuracy. Embedded video ids were
// verified live via YouTube oEmbed. Edit freely — this is the single source for
// the /guides/mastery-rank page (rendered by <GuideArticle>).
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
      "label": "mastery per maxed weapon",
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
          "text": "The golden rule: **each unique item's mastery only counts once.** Ranking your Braton to 30 gives its mastery a single time. Selling it, rebuilding it, or adding Forma and re-leveling it gives you nothing extra. That single rule shapes every efficient leveling strategy on this page."
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
                "Unranked gear starts with mod capacity equal to your MR, capped at 30 (doubled by a Reactor/Catalyst)"
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
          "text": "The **Star Chart itself is huge free mastery.** Clearing every node once (normal and [Steel Path](/guides/steel-path)) plus all junctions is worth a big pile of mastery that many players overlook. Use the [drop-location map](/star-chart-3d) to see what you still have left to touch."
        },
        {
          "type": "p",
          "text": "Because mastery is one-and-done per item, veterans build cheap 'mastery fodder' weapons purely to rank them to 30 and move on. There are hundreds of weapons and dozens of frames in the game — you'll pass MR30 long before you own them all."
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
          "text": "Two practical takeaways fall out of that table. **To level a weapon**, either shoot with it, or ride shared affinity from a squadmate who nukes the room while you stay within 50m. **To level a Warframe fast**, get **ability kills** — they pour 100% of that affinity straight into your frame, versus only 25% from a squadmate's shared kill. And **don't haul around already-maxed weapons** on a leveling run: affinity that lands on maxed gear is wasted, so fill those slots with unranked weapons you also want to rank up."
        },
        {
          "type": "warn",
          "text": "In Defense and Survival, wandering more than 50m from where enemies die means you earn **zero** shared affinity. On a leveling run, stay glued to the objective or the carry."
        }
      ]
    },
    {
      "id": "fast-leveling",
      "title": "Fastest ways to level (affinity farms)",
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
                "Sanctuary Onslaught / Elite SO",
                "Fast, dense XP",
                "Via Cephalon Simaris; ESO for gear that's already partly built out"
              ],
              [
                "High-density Defense (e.g. Hydron on Sedna, Helene on Saturn)",
                "Relaxed, AFK-friendly leveling",
                "Long-standing community favorites — bring or join a nuker frame"
              ],
              [
                "Void Fissures",
                "Leveling + loot at once",
                "Double-dip XP while cracking relics — see the Relic Farming tool"
              ],
              [
                "Duviri Circuit",
                "Leveling + rewards",
                "Modern option; the Steel Path Circuit scales for veterans"
              ],
              [
                "Cheap Exterminate / Capture",
                "MR fodder",
                "Rush freshly built throwaway weapons to 30 and recycle"
              ]
            ],
            "note": "The single 'best node' shifts with balance patches and events. Check the live wiki or a recent video for the current meta pick."
          }
        },
        {
          "type": "p",
          "text": "Two multipliers make everything faster: run an **Affinity Booster** (from the Market or Nightwave/login rewards) and time your grind to a **double-affinity weekend** — those stack for 4× affinity. Leveling inside [Void Fissures](/relic-farming) is the efficiency king because you rank gear *and* farm prime parts in the same runs; use the [relic value tool](/relics-value) to decide what's worth cracking."
        },
        {
          "type": "tip",
          "text": "Bring a full set of leveling gear (frame + 3 weapons) into a group carry and you can take **four items** from 0 to 30 in a single session. Just make sure you're the one holding still near the kills, not chasing."
        }
      ]
    },
    {
      "id": "rank-to-30-loop",
      "title": "The rank-to-30 loop",
      "blocks": [
        {
          "type": "p",
          "text": "Efficient mastery grinding is a simple, repeatable loop. The goal is to touch every unique item exactly once, get it to 30, and never look back."
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
              "p": "A fresh item is rank 0. It already starts with mod capacity equal to your MR, so even unranked gear is usable for a leveling run."
            },
            {
              "h": "Level it to 30 in one sitting",
              "p": "Take it to an affinity farm (Onslaught, a Defense node, or a Fissure). At 30 it banks its full mastery — 3,000 for a weapon, 6,000 for a frame."
            },
            {
              "h": "Bank it, recycle the slot",
              "p": "Once maxed, the mastery is yours permanently. Sell mastery-fodder weapons to free the slot and build the next one. Keep anything you actually like."
            },
            {
              "h": "Don't re-level for mastery",
              "p": "Adding Forma resets an item to rank 0 for polarity slots — great for builds, but it gives zero extra mastery. Only re-level gear you're customizing, not for MR."
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
      "title": "MR tests & how to prep",
      "blocks": [
        {
          "type": "p",
          "text": "Earning enough mastery makes the next rank *available*, but you have to **pass a Mastery Rank test** to actually claim it. Each rank has its own unique test — timed parkour, stealth kills, hacking consoles under pressure, killing waves without taking damage, and so on. The difficulty ramps as your rank climbs."
        },
        {
          "type": "steps",
          "ordered": true,
          "steps": [
            {
              "h": "Practice for free at Cephalon Simaris",
              "p": "Every Relay has Cephalon Simaris, who lets you **rehearse the exact test** as many times as you want with no cooldown and no penalty. Always practice first."
            },
            {
              "h": "Take the real test when ready",
              "p": "When you've banked enough mastery, the rank-up prompt appears (in your Orbiter / profile). Attempt it once you're comfortable from practice."
            },
            {
              "h": "If you fail, wait about a day",
              "p": "There's no penalty for failing beyond a roughly **24-hour cooldown** before you can attempt the real test again. Practice runs stay unlimited during the wait."
            }
          ]
        },
        {
          "type": "warn",
          "text": "That 24-hour lockout is the only sting — so **never attempt a test blind.** Rehearse it at Simaris until you can pass it consistently, then take the real one. Many tests also become trivial with a mobility frame (Volt, Titania, Wisp, Zephyr) or a good movement build."
        },
        {
          "type": "tip",
          "text": "Stuck on a movement or 'no-damage' test? Bring a frame with speed, invisibility, or damage immunity and it often turns a frustrating test into a formality. Check a recent test-specific video if a particular rank is giving you trouble."
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
            "**Level what you build.** Every frame, weapon and companion is free mastery — take each to 30 once before you sell or Forma it.",
            "**Clear the whole Star Chart, twice.** Normal nodes, junctions, and [Steel Path](/guides/steel-path) nodes are a massive, one-time mastery source most players leave on the table.",
            "**Watch for gear breakpoints.** Some of the strongest weapons carry an MR requirement, so a few extra ranks can unlock a meta pick you actually want.",
            "**Prioritize MR if you farm standing.** If you're deep into Focus, arcanes or syndicates, the higher daily cap makes every rank pay for itself fast."
          ]
        },
        {
          "type": "quote",
          "text": "MR is the reward for exploring the whole game, not a wall to climb. Play broadly, level everything once, and you'll wake up at MR20 without ever 'grinding mastery'.",
          "cite": "Common r/Warframe veteran advice"
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
      "a": "Earn mastery by ranking new gear from 0 to 30 for the first time (weapons give 3,000, frames and companions give 6,000), and by clearing Star Chart nodes and junctions. Once you've banked enough, pass that rank's Mastery Rank test to lock it in. Each unique item only counts once — re-leveling with Forma gives no extra mastery."
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
      "a": "No. Each item grants its mastery a single time, the first time it reaches rank 30. Forma resets the item to rank 0 so you can add polarity slots for a better build, but you earn zero additional mastery from re-leveling it. Only re-level gear when you're customizing it, never for MR."
    },
    {
      "q": "How does affinity sharing work in a squad?",
      "a": "When a squadmate kills an enemy within about 50 meters of you, you receive a share of that affinity — 25% to your Warframe and 75% split evenly across your equipped weapons. That's why a gun you never fire still levels up if you tag along with a nuker. Wander outside the 50m range and you get nothing. (Your own weapon kills split differently: 50% to the weapon, 50% to your Warframe.)"
    },
    {
      "q": "What happens if I fail a Mastery Rank test?",
      "a": "Nothing except a roughly 24-hour wait before you can attempt the real test again — there's no XP loss or other penalty. Practice the exact test for free and unlimited times at Cephalon Simaris in any Relay first, so you only take the real one when you can pass it consistently."
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
      "label": "r/Warframe — My Journey ends at MR25",
      "href": "https://reddit.com/r/Warframe/comments/1uockj8/my_journey_ends_at_mr25/"
    },
    {
      "label": "r/Warframe — Mastery Rank & Helminth motivation thread",
      "href": "https://reddit.com/r/Warframe/comments/idu92w/i_like_the_idea_that_way_people_could_become/"
    },
    {
      "label": "r/Warframe — Affinity farming discussion (Gian Point)",
      "href": "https://reddit.com/r/Warframe/comments/m4fvff/gian_point_should_become_a_graveyard/"
    },
    {
      "label": "Official Warframe Wiki",
      "href": "https://wiki.warframe.com/"
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
  "updated": "2026-07-18"
}

export default guide
