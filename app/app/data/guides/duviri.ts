// Source-reviewed Duviri guide. See sources below and docs/seo-growth-log.md.
import type { Guide } from './types'

const guide: Guide = {
  "slug": "duviri",
  "eyebrow": "Knowledge Center · Duviri",
  "title": "The Duviri Paradox Guide",
  "lede": "Duviri combines Drifter exploration with the Circuit's weekly reward tracks. Complete the Uranus Junction to unlock the quest, then choose between Warframe blueprints, Kullervo farming and Steel Path Incarnon adapters.",
  "category": "endgame",
  "readMins": 10,
  "stats": [
    {
      "num": "1",
      "label": "Uranus Junction unlocks the quest",
      "tone": "good"
    },
    {
      "num": "5",
      "label": "emotions in the Spiral",
      "tone": "alt"
    },
    {
      "num": "3",
      "label": "original modes; Isleweaver is separate"
    },
    {
      "num": "2",
      "label": "separate weekly Circuit reward tracks",
      "tone": "gold"
    }
  ],
  "sections": [
    {
      "id": "what-is-duviri",
      "title": "What Is the Duviri Paradox?",
      "blocks": [
        {
          "type": "p",
          "text": "Duviri is a fractured dreamscape ruled by **Dominus Thrax**, where each **Spiral** changes the landscape's mood. The quest introduces the **Drifter**, while Undercroft battles use Warframes. It is no longer an alternative starting path for new accounts: complete the **Uranus Junction on Saturn**, then start **The Duviri Paradox** from your Codex."
        },
        {
          "type": "kv",
          "kv": [
            {
              "k": "You play as",
              "v": "Drifter in the Experience/Lone Story landscape; Warframes in Undercroft, Circuit and Isleweaver"
            },
            {
              "k": "Prerequisite",
              "v": "Uranus Junction on Saturn, then The Duviri Paradox quest"
            },
            {
              "k": "Guide NPC",
              "v": "Teshin, at Teshin's Cave"
            },
            {
              "k": "Modes",
              "v": "The Duviri Experience · The Lone Story · The Circuit; Isleweaver after The Hex"
            },
            {
              "k": "Core loop",
              "v": "Roguelike — draft gear, stack Decrees, reset each run"
            }
          ]
        },
        {
          "type": "info",
          "title": "The Spiral of Emotions",
          "text": "Duviri cycles through five moods in a fixed order — **Joy, Anger, Envy, Sorrow, and Fear**. Each mood reshapes the enemies, the environment, and the challenges you'll face, and the Spiral turns on a timer (roughly a couple of hours per mood). If you want a specific mood, check a Duviri cycle tracker via the [community tools directory](/tools)."
        }
      ]
    },
    {
      "id": "how-to-start",
      "title": "Getting In: Teshin's Cave",
      "blocks": [
        {
          "type": "p",
          "text": "After the **Duviri Paradox** quest, select Duviri in **Navigation**, choose a mode, and prepare your offered equipment in **Teshin’s Cave**. This guide focuses on the Experience, Lone Story and Circuit. **Isleweaver**, unlocked after **The Hex**, is a separate Warframe-led adventure with Oraxia rewards."
        },
        {
          "type": "steps",
          "steps": [
            {
              "h": "Start the quest",
              "p": "Complete the Uranus Junction on Saturn, then select The Duviri Paradox in your Codex. Accounts that unlocked the quest before Hotfix 36.0.8 retained access."
            },
            {
              "h": "Finish the quest",
              "p": "Completing it unlocks the Duviri Experience, the Lone Story and the normal Circuit."
            },
            {
              "h": "Choose a mode, then prepare in the Cave",
              "p": "Pick the Experience for exploration and Kullervo, the Lone Story for the main objectives, or the Circuit for its weekly reward track."
            },
            {
              "h": "Check your offered equipment",
              "p": "Inspect the available Warframes and weapons before entering the portal. Borrowed gear has default mods; owned offerings can use your saved configurations."
            }
          ]
        },
        {
          "type": "table",
          "table": {
            "columns": [
              "Aspect",
              "The Duviri Experience",
              "The Circuit"
            ],
            "rows": [
              [
                "You play",
                "Drifter in the open world + Warframe in the Undercroft",
                "Warframe combat in the Undercroft"
              ],
              [
                "Structure",
                "Open landscape, ride the Kaithe, side activities, boss",
                "Endless ladder of Undercroft mission rounds"
              ],
              [
                "Headline reward",
                "Pathos Clamps from the Orowyrm; Kullervo’s Bane only after both boss fights; Intrinsics",
                "Normal: Warframe blueprints · Steel Path: Incarnon Genesis adapters"
              ],
              [
                "Best for",
                "Kullervo, Intrinsics, chill exploration",
                "Farming frames & Incarnon Genesis efficiently"
              ]
            ],
            "note": "The Lone Story follows the Experience’s main objectives without its optional activities. Isleweaver is a separate later unlock, described above."
          }
        }
      ]
    },
    {
      "id": "duviri-experience",
      "title": "The Duviri Experience",
      "blocks": [
        {
          "type": "p",
          "text": "The Experience combines Drifter exploration, optional activities and a Spiral story ending at the **Orowyrm**. Use your flying **Kaithe** to travel, collect Decrees, and switch to a Warframe for Undercroft stages. Choose **The Lone Story** when you want the main objectives without the optional exploration."
        },
        {
          "type": "list",
          "items": [
            "Ride or fly the **Kaithe** to cross the shifting landscape quickly",
            "Clear **story stages** and **side objectives** to earn **Decrees** and loot",
            "Drop into **Undercroft** missions and fight as a rotating Warframe",
            "Beat the **Orowyrm** for **Pathos Clamps**",
            "For **Kullervo’s Bane**, defeat **Kullervo and the Orowyrm in the same session**; spend it with **Acrithis**"
          ]
        },
        {
          "type": "tip",
          "text": "**Kullervo’s Hold** appears during **Anger, Sorrow and Fear**. In the Experience, speak to **The Warden** there to start the fight if it is not a main objective. Defeat Kullervo and the Orowyrm in that session to earn **4–6 Kullervo’s Bane** on Normal or **6–8** on Steel Path. Buy his blueprints from **Acrithis**, build the components, and reserve **10 Pathos Clamps** for the final Warframe recipe."
        }
      ]
    },
    {
      "id": "decrees",
      "title": "Decrees: Your Roguelike Power Spike",
      "blocks": [
        {
          "type": "p",
          "text": "Decrees are temporary upgrades for the current run; compatible effects can stack, but they reset when you leave. Choose bonuses that support the equipment you actually drafted. Your permanent Intrinsic ranks are a separate system and remain between runs."
        },
        {
          "type": "list",
          "items": [
            "Completing **story stages** and **side objectives** in the overworld",
            "Clearing **Undercroft** stages",
            "Finishing rounds in the Circuit (you pick a Decree between rounds)",
            "Collecting all **three Decree Fragments** across a Circuit stage or subsequent stages"
          ]
        },
        {
          "type": "tip",
          "text": "Choose useful synergies, but read every drawback. **Spiteful Decrees** exchange a penalty for a benefit, so they can weaken an unsuitable build. **Opportunity rank 6** unlocks up to three Decree rerolls per visit; save those chances for choices that do not help your run."
        }
      ]
    },
    {
      "id": "the-circuit",
      "title": "The Circuit: Weekly Warframe Blueprints",
      "blocks": [
        {
          "type": "p",
          "text": "The Circuit is an endless sequence of **Undercroft** stages. Your playable equipment comes from the current randomized **Teshin’s Cave** offerings, with more choices unlocked through Opportunity. That equipment selection is separate from the weekly Warframe you choose to earn. Use the [Circuit tracker](/circuit) to plan your reward target."
        },
        {
          "type": "p",
          "text": "Before your first normal Circuit run each week, choose **one of three Warframes** as your reward target; confirmation locks that choice for the week. Its **Neuroptics, Chassis, Systems and main blueprint** arrive at tiers **2, 5, 8 and 10**. You still supply the crafting resources and Credits. Other tiers include mods, Arcanes, Endo and resources."
        },
        {
          "type": "info",
          "text": "Because you pilot frames you may not own, the Circuit doubles as a free test-drive. Not sure how to play a frame you drafted? Our [tier list](/guides/tier-list) and [mods guide](/guides/mods) break down what makes each one tick."
        }
      ]
    },
    {
      "id": "steel-path-circuit",
      "title": "Steel Path Circuit & Incarnon Genesis",
      "blocks": [
        {
          "type": "p",
          "text": "First unlock [Steel Path](/guides/steel-path) through the required pre-New War Star Chart missions and Teshin in a Relay. For **Duviri Steel Path**, also finish **The Duviri Paradox**, complete at least **one normal Circuit stage and extract**, and defeat the **Orowyrm in normal Lone Story and extract**. The quest records completion of the Duviri Experience node; the other two completions must be registered as well."
        },
        {
          "type": "p",
          "text": "Choose two rewards before starting the weekly Steel Path track: your first choice is at **tier 5**, your second at **tier 10**. The adapter pool contains five options. At **Opportunity rank 9**, a Veiled Riven or **20,000 Kuva** can replace an adapter choice. **Tier 9 awards 25 Steel Essence**; individual rounds do not. Check the [Circuit tracker](/circuit) before confirming."
        },
        {
          "type": "warn",
          "text": "Check the offered equipment and choose a usable configuration before entering Steel Path. Build Decree synergies around that loadout, and use the between-stage extraction choice when the squad needs to stop. Our [mods guide](/guides/mods) explains survival and mod priorities."
        }
      ]
    },
    {
      "id": "intrinsics",
      "title": "Duviri Intrinsics",
      "blocks": [
        {
          "type": "p",
          "text": "**Drifter Intrinsics** are permanent upgrades earned through Duviri, separate from Railjack Intrinsics. Spend points in Teshin’s Cave to improve combat, travel, equipment options or survival. For planning runs, **Opportunity rank 4** adds a Warframe option and unlocks the Navigation preview of the Cave’s equipment."
        },
        {
          "type": "table",
          "table": {
            "columns": [
              "Intrinsic",
              "What it broadly improves"
            ],
            "rows": [
              [
                "Combat",
                "Drifter combat bonuses, ability improvements and Transference Surge"
              ],
              [
                "Riding",
                "Kaithe abilities, travel conveniences and mounted mobility"
              ],
              [
                "Opportunity",
                "Equipment and Decree choices, rerolls, Cave preview and vendor options"
              ],
              [
                "Endurance",
                "Survival bonuses, healing, additional revives and protection from fatal damage"
              ]
            ],
            "note": "Choose your next rank by the problem you need to solve: limited equipment choices, travel, damage or survival. Read the in-game perk before spending points."
          }
        }
      ]
    },
    {
      "id": "why-it-matters",
      "title": "Why Duviri Matters — New Player or Veteran",
      "blocks": [
        {
          "type": "list",
          "items": [
            "**Developing your arsenal:** after reaching the Uranus Junction and finishing the quest, use the normal Circuit to try unfamiliar frames and work toward Warframe blueprints without spending platinum.",
            "**Veterans:** Incarnon Genesis adapters, Kullervo and the weekly Steel Path reward track, including its tier-9 Steel Essence reward.",
            "**Everyone:** choose a specific goal before entering: a boss currency, Intrinsic progress or the next Circuit reward tier."
          ]
        },
        {
          "type": "p",
          "text": "Use the [progression guide](/guides/progression) to place Duviri in your quest path, the [Circuit tracker](/circuit) to choose a weekly reward, and the [mods guide](/guides/mods) to prepare owned equipment. If you choose a Riven reward, the [Riven guide](/guides/riven) explains what to do next."
        }
      ]
    },
    {
      "id": "etiquette",
      "title": "Public-Squad Etiquette & Common Mistakes",
      "blocks": [
        {
          "type": "p",
          "text": "Agree on the goal before the squad leaves Teshin’s Cave. Exploration, a Kullervo fight and a quick objective run need different amounts of time."
        },
        {
          "type": "list",
          "items": [
            "Learn to drive and fly the **Kaithe** to objectives — don't stall the run for the whole squad",
            "Choose useful **Decrees**, checking Spiteful drawbacks before committing",
            "Use the Circuit’s between-stage extraction choice and tell teammates when you plan to leave",
            "Everyone picks their **own** rewards — don't demand others rush the tier you happen to want"
          ]
        },
        {
          "type": "warn",
          "text": "If you want time to learn, explore or test unfamiliar gear, solo play or a group with the same goal can help. In public squads, say when you need a moment to configure equipment or understand an objective."
        },
        {
          "type": "info",
          "title": "Video context",
          "text": "The videos below are supplementary visual walkthroughs and may reflect earlier updates. Use the access requirements and reward rules reviewed above when they differ."
        }
      ]
    }
  ],
  "faqs": [
    {
      "q": "Can new players do Duviri in Warframe?",
      "a": "Yes, after completing the **Uranus Junction on Saturn** and completing **The Duviri Paradox**. Duviri is no longer available immediately on a fresh account. Loaner equipment helps you participate even with a small arsenal. Our [progression guide](/guides/progression) helps place it alongside your other goals."
    },
    {
      "q": "Do you use your own Warframe in Duviri?",
      "a": "In the Experience and Lone Story, the landscape uses the **Drifter**, while Undercroft stages and the Circuit use Warframes. Pick from the equipment offered in **Teshin’s Cave**: borrowed gear has default mods, and owned offerings can use your saved configurations. **Opportunity rank 4** unlocks a Navigation preview. **Isleweaver** uses an offered Warframe on the landscape too."
    },
    {
      "q": "How do I get the weekly Warframe from the Circuit?",
      "a": "Select **one Warframe from the three weekly choices before starting** the normal Circuit. Its blueprints unlock at tiers **2, 5, 8 and 10**; crafting still requires resources and Credits. Your weekly reward target is separate from the Warframe you play. Plan with the [Circuit tracker](/circuit)."
    },
    {
      "q": "How do I unlock the Steel Path Circuit for Incarnon adapters?",
      "a": "Unlock the base Steel Path with Teshin, then complete The Duviri Paradox, extract after at least one normal Circuit stage, and defeat the Orowyrm and extract from normal Lone Story. You do not need to finish the whole normal Circuit reward track. The base unlock excludes Zariman, Albrecht's Laboratories and Höllvania missions under Hotfix 38.5.3; installing an adapter with Cavalero separately requires Angels of the Zariman."
    },
    {
      "q": "Do Decrees carry over between Duviri runs?",
      "a": "No. Decrees reset between runs; Intrinsics persist. Pick upgrades that suit your equipment and read **Spiteful Decree** penalties before selecting them."
    },
    {
      "q": "How do I get Kullervo in Warframe?",
      "a": "During **Anger, Sorrow or Fear**, fight Kullervo at **Kullervo’s Hold** and defeat the **Orowyrm in the same session**. Spend the resulting **Kullervo’s Bane** on his blueprints at **Acrithis**, then craft the components and final Warframe. The final recipe also needs **10 Pathos Clamps**."
    },
    {
      "q": "How long does a Duviri run take?",
      "a": "There is no fixed duration: exploration, objectives, loadout and squad pace all matter. The Lone Story limits the run to its main objectives; the Circuit lets you choose extraction between stages. Plan around your next reward tier instead of assuming the whole weekly track fits in one short visit."
    }
  ],
  "videos": [
    {
      "id": "C2T0EMd_XTQ",
      "title": "Warframe - Ultimate Beginner's Guide to The Duviri Paradox",
      "channel": "Warframe Madness"
    },
    {
      "id": "guY28zlbKgw",
      "title": "The Duviri Experience - All You Need to Know | Warframe The Duviri Paradox Guide",
      "channel": "Faceless Beanie"
    },
    {
      "id": "Ww9IndAE9uY",
      "title": "The ULTIMATE Warframe DUVIRI Guide!... (Orowyrm, Decrees, Missions Intrinsics and more)",
      "channel": "MHBlacky"
    },
    {
      "id": "tneMEOi-Lzg",
      "title": "A Complete Guide For The Duviri Paradox - Warframe Guide",
      "channel": "GJ Jerry G"
    }
  ],
  "sources": [
    {
      "label": "Digital Extremes — The Duviri Paradox quest guide",
      "href": "https://www.warframe.com/en/guides/quests/the-duviri-paradox"
    },
    {
      "label": "Digital Extremes — Hotfix 36.0.8: Uranus Junction access",
      "href": "https://www.warframe.com/en/patch-notes/pc/36-0-8"
    },
    {
      "label": "Digital Extremes — Hotfix 38.5.3: Steel Path requirements",
      "href": "https://www.warframe.com/en/patch-notes/pc/38-5-3"
    },
    {
      "label": "Digital Extremes — Hotfix 33.5.6: Duviri completion tracking",
      "href": "https://www.warframe.com/en/patch-notes/pc/33-5-6"
    },
    {
      "label": "Digital Extremes — Update 33: Circuit rewards and Intrinsics",
      "href": "https://www.warframe.com/en/patch-notes/pc/33-0-0"
    },
    {
      "label": "Digital Extremes — Update 33.5: Kullervo and Spiteful Decrees",
      "href": "https://www.warframe.com/en/patch-notes/pc/33-5-0"
    },
    {
      "label": "Digital Extremes — Update 34: Circuit reward alternatives",
      "href": "https://www.warframe.com/en/patch-notes/pc/34-0-0"
    },
    {
      "label": "Digital Extremes — Update 39: Isleweaver",
      "href": "https://www.warframe.com/en/patch-notes/pc/39-0-0"
    },
    {
      "label": "WFCD — current Warframe crafting data",
      "href": "https://raw.githubusercontent.com/WFCD/warframe-items/master/data/json/Warframes.json"
    },
    {
      "label": "WFCD — current resource identifiers",
      "href": "https://raw.githubusercontent.com/WFCD/warframe-items/master/data/json/Resources.json"
    }
  ],
  "related": [
    {
      "label": "Steel Path Guide",
      "to": "/guides/steel-path",
      "icon": "skull",
      "note": "Unlock the SP Circuit for Incarnon adapters"
    },
    {
      "label": "Warframe Tier List",
      "to": "/guides/tier-list",
      "icon": "format-list-numbered",
      "note": "Which Circuit frame is worth farming"
    },
    {
      "label": "Riven Mods Guide",
      "to": "/guides/riven",
      "icon": "cards-playing-outline",
      "note": "Understand the Riven rewards available on Steel Path"
    },
    {
      "label": "New Player Guide",
      "to": "/guides/new-player",
      "icon": "account-star",
      "note": "Where Duviri fits when starting out"
    },
    {
      "label": "Community Tools",
      "to": "/tools",
      "icon": "tools",
      "note": "Duviri cycle trackers & more"
    },
    {
      "label": "Weekly Circuit Tracker",
      "to": "/circuit",
      "icon": "calendar-sync",
      "note": "Compare this week’s Warframe and Incarnon choices"
    }
  ],
  "updated": "2026-10-25"
}

export default guide
