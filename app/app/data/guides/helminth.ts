// Auto-generated Warframe Knowledge Center guide content.
// Drafted grounded in r/Warframe research (reddit API) + the subreddit wiki FAQ,
// then adversarially fact-checked for evergreen accuracy. Embedded video ids were
// verified live via YouTube oEmbed. Edit freely — this is the single source for
// the /guides/helminth page (rendered by <GuideArticle>).
import type { Guide } from './types'

const guide: Guide = {
  "slug": "helminth",
  "eyebrow": "Knowledge Center · Helminth & Subsume",
  "title": "Helminth & Subsume Guide",
  "lede": "Feed a spare Warframe to the Helminth, keep one of its abilities forever, then graft that ability onto a frame that actually needs it. This is how a decent frame becomes a monster — here are all the rules, the best abilities to chase, and the mistake that costs people an entire Warframe.",
  "category": "systems",
  "readMins": 9,
  "stats": [
    {
      "num": "8",
      "label": "Mastery Rank to buy the segment",
      "tone": "gold"
    },
    {
      "num": "6",
      "label": "secretion types you feed it",
      "tone": "good"
    },
    {
      "num": "1",
      "label": "subsumed slot per frame",
      "tone": "alt"
    },
    {
      "num": "7 days",
      "label": "an Invigoration lasts",
      "tone": "good"
    }
  ],
  "sections": [
    {
      "id": "what-is-helminth",
      "title": "What the Helminth actually is",
      "blocks": [
        {
          "type": "p",
          "text": "The **Helminth** is Warframe's ability-transplant system, and it's one of the biggest power spikes in the whole game. You permanently sacrifice a spare Warframe to it (\"subsuming\") to unlock **one** of that frame's abilities into a personal library. From then on you can **infuse** that ability onto any other frame — overwriting one of its four abilities — as many times as you like, paying a little resource each time. On top of that it hands out weekly stat buffs called **Invigorations**."
        },
        {
          "type": "p",
          "text": "In practice, this is how players fix a frame's weakness (bolt on healing, energy, armor strip, or a damage buff) or push a strong frame into overdrive. It's not early-game essential, but once you have a stable of frames it changes how you build almost everything — pair it with a smart [modding setup](/guides/mods) and [Archon Shards](/guides/archon-shards) and even a mid-tier frame becomes endgame-ready."
        },
        {
          "type": "kv",
          "kv": [
            {
              "k": "Where it lives",
              "v": "The Helminth Infirmary, the segment room at the aft of your Orbiter"
            },
            {
              "k": "Unlocked by",
              "v": "Heart of Deimos for access, then Mastery Rank 8 + Entrati standing to buy the Segment"
            },
            {
              "k": "Two features",
              "v": "Subsume/Infuse abilities + weekly Invigorations"
            },
            {
              "k": "The catch",
              "v": "Subsuming permanently destroys the donor Warframe"
            }
          ]
        }
      ]
    },
    {
      "id": "unlock",
      "title": "Unlocking the Helminth",
      "blocks": [
        {
          "type": "steps",
          "ordered": true,
          "steps": [
            {
              "h": "Complete Heart of Deimos",
              "p": "This story quest — available once you've finished the intro (Vor's Prize) and have your Orbiter — opens the Cambion Drift and the Necralisk on Deimos and lets you start earning standing with the Entrati syndicate. Finishing the quest does NOT hand you the Helminth; it unlocks the place you buy it."
            },
            {
              "h": "Reach the real gate: MR 8 + Entrati Associate",
              "p": "The Helminth Segment blueprint is sold by Son in the Necralisk, and he won't deal until you're Mastery Rank 8 and at least Rank 3 (Associate) with the Entrati. Rank up your Mastery and cap Entrati standing to get there."
            },
            {
              "h": "Buy, build and install the Segment",
              "p": "Purchase the blueprint for Entrati standing, craft it in your Foundry (Credits plus Deimos resources, roughly a day to build), then install it. The Helminth Infirmary at the aft of your Orbiter becomes usable — walk in and interact with the wall organism to open its menu."
            },
            {
              "h": "Feed it to raise its rank",
              "p": "The Helminth levels up as you feed it resources and subsume frames. Its first rank unlocks subsuming; higher ranks increase resource storage and open later features. Early on, just feed it whatever spare materials it asks for."
            }
          ]
        },
        {
          "type": "info",
          "text": "You do **not** need Helminth to enjoy the game — it's a mid-game upgrade. If you're still building your first few frames, prioritize that (see the [beginner warframes guide](/guides/beginner-warframes) and [progression path](/guides/progression)) and come back to Helminth once you have frames to spare."
        }
      ]
    },
    {
      "id": "subsuming",
      "title": "How subsuming works",
      "blocks": [
        {
          "type": "p",
          "text": "**Subsuming** means placing a spare Warframe into the Helminth to consume it — and you don't need to level it first: a freshly built, Rank 0 frame works just as well as a maxed one. In exchange you permanently unlock **one specific ability** from that frame into your library. You choose *which frame* to feed, but **DE decides which of its four abilities is the donatable one** — for example, Rhino always donates Roar, never Iron Skin. One important limit: you can only subsume **base** Warframes — Prime and Umbra variants can't be fed to the Helminth at all. Always look up a frame's subsumable ability (on the [wiki](https://wiki.warframe.com/) or its in-game codex) before you feed it, so you're not surprised."
        },
        {
          "type": "warn",
          "title": "Subsuming is permanent and destroys the frame",
          "text": "The donor Warframe is **gone forever** the moment you subsume it. If it's your only copy, you'll have to re-farm or re-build it from scratch. Feed a duplicate, a frame you genuinely never use, or a base version you're replacing with its Prime — never your only copy of something you still play."
        },
        {
          "type": "p",
          "text": "You only need to subsume a frame **once**. After the ability is in your library it's yours forever and can be infused onto unlimited frames — subsuming a second copy of the same frame gives you nothing new."
        }
      ]
    },
    {
      "id": "infusing",
      "title": "Grafting an ability onto a frame (infusing)",
      "blocks": [
        {
          "type": "steps",
          "ordered": true,
          "steps": [
            {
              "h": "Pick the recipient frame",
              "p": "Open the Helminth's Infuse Ability menu and choose the frame you want to modify. Any built frame works — including Primes and Umbra — and there's no rank requirement on the recipient."
            },
            {
              "h": "Choose which ability to overwrite",
              "p": "You select one of the frame's four abilities to replace. The subsumed ability takes that slot on the ability bar. Think about which native ability you use least."
            },
            {
              "h": "Pay the resource cost",
              "p": "Each infusion consumes a mix of the Helminth's resource categories (see below). Confirm and the ability is grafted on."
            }
          ]
        },
        {
          "type": "info",
          "title": "The rules that trip people up",
          "text": "**One subsumed ability per frame** — you can't stack two. You can change it later by infusing a different ability over it, but that costs resources again. The subsumed ability scales with **that frame's mods** (Strength, Duration, Range, Efficiency), so a Roar on a high-Strength frame hits harder. A handful of abilities are capped lower when subsumed than on their native frame, and many **can't use their augment mod** (though a growing list can) — check the wiki entry for the exact behavior of any ability you rely on."
        }
      ]
    },
    {
      "id": "best-subsumes",
      "title": "The most popular subsumes, by role",
      "blocks": [
        {
          "type": "p",
          "text": "You don't need all of these — pick the one that patches your build's weakness. The staples below have stayed near the top for years because they solve universal problems: damage, energy, survivability, armor strip, and grouping. Exact numbers shift with patches, so treat these as roles and confirm current values on the [wiki](https://wiki.warframe.com/) or a recent guide."
        },
        {
          "type": "table",
          "table": {
            "columns": [
              "Subsume",
              "From frame",
              "Why it's a staple"
            ],
            "rows": [
              [
                "Roar",
                "Rhino",
                "A near-universal damage multiplier that boosts almost all of your damage. The default 'make everything hit harder' pick."
              ],
              [
                "Nourish",
                "Grendel",
                "Energy generation, added Viral damage, and toughness in one button — fixes energy-hungry builds instantly."
              ],
              [
                "Eclipse",
                "Mirage",
                "Large weapon-damage buff in light (or heavy damage reduction in shadow). Great on gun platforms."
              ],
              [
                "Gloom",
                "Sevagoth",
                "Slows nearby enemies to a crawl and lifesteals on kills — survivability plus soft crowd control."
              ],
              [
                "Pillage",
                "Hildryn",
                "Strips armor and shields in a radius and refills your own shields. Enables shield-gating and shreds tanky enemies."
              ],
              [
                "Dispensary",
                "Protea",
                "Drops energy/health/ammo pickups on a timer — a passive energy economy for any frame."
              ],
              [
                "Nourish / Gloom / Pillage combo",
                "—",
                "Many endgame builds pick one of these three as the 'do everything' slot."
              ],
              [
                "Xata's Whisper",
                "Xaku",
                "Adds Void damage to your weapons — a universal added element that shines against Sentients and for Eidolon hunting."
              ],
              [
                "Larva / Ensnare",
                "Nidus / Khora",
                "Group enemies into a tight clump so AoE weapons and abilities delete them at once."
              ],
              [
                "Terrify",
                "Nekros",
                "Fears enemies and strips their armor — control plus damage amplification."
              ]
            ],
            "note": "Roles, not fixed numbers — DE tweaks values regularly. Confirm the current subsumed stats before committing resources."
          }
        },
        {
          "type": "p",
          "text": "Which frames are worth building specifically to subsume depends on what you already own — cross-reference the [tier list](/guides/tier-list) to see which strong frames double as good ability donors, and the [Steel Path guide](/guides/steel-path) for where these buffs matter most."
        }
      ]
    },
    {
      "id": "resources",
      "title": "Feeding the Helminth",
      "blocks": [
        {
          "type": "p",
          "text": "Both subsuming and infusing cost **secretions** — resources you feed the Helminth, sorted into six categories: **Oxides, Calx, Biotics, Synthetics, Pheromones and Bile**. Different actions draw from different categories, so you keep a small stockpile of each. Feeding common materials you're already swimming in is the cheapest way to top up."
        },
        {
          "type": "tip",
          "title": "Two quirks worth knowing",
          "text": "First, the Helminth has an **appetite** — feed the same resource category repeatedly and its cost climbs, then resets over time, so it discourages spamming one material. Second, **Bile** is the classic bottleneck: it's fed by a narrower set of items, so keep an eye on it. If you're short on feed materials, the [resources farming guide](/guides/resources) covers where to stock up efficiently."
        }
      ]
    },
    {
      "id": "invigorations",
      "title": "Invigorations: weekly super-buffs",
      "blocks": [
        {
          "type": "p",
          "text": "Once you've unlocked the separate **Invigoration Segment** — a second segment bought from the Entrati and installed alongside the first — the Helminth starts offering **Invigorations**, the second half of the system and a huge, temporary power boost. Each week it presents **randomized buff pairings**: an offensive buff (for example a big Ability Strength boost) paired with a second stat like Duration, Efficiency, or Armor, which you apply to one Warframe."
        },
        {
          "type": "kv",
          "kv": [
            {
              "k": "How long it lasts",
              "v": "7 days, and only on the single frame you applied it to"
            },
            {
              "k": "What you apply",
              "v": "An offensive buff (like Ability Strength) paired with a random utility stat"
            },
            {
              "k": "Cost & rerolls",
              "v": "Each invigoration costs Helminth resources; you can reroll the offered buffs for more resources"
            },
            {
              "k": "Refreshes",
              "v": "The offer rotates weekly, so you're not locked into this week's options forever"
            }
          ]
        },
        {
          "type": "p",
          "text": "Use it on a frame you're playing that week, or to patch a specific weakness — an Efficiency or Duration buff on an ability-hungry frame, or a survivability buff on a squishy one. Because the effect is temporary, don't build your whole loadout around it; treat it as a bonus rather than a permanent stat."
        }
      ]
    },
    {
      "id": "mistakes",
      "title": "Mistakes to avoid",
      "blocks": [
        {
          "type": "list",
          "items": [
            "**Don't subsume your only copy of a frame** — it's destroyed permanently. Build or buy a spare first if you still play it.",
            "**Check the donatable ability before feeding.** DE picks which of the four abilities you get; farming a frame for the wrong ability is a wasted grind.",
            "**Keep base frames after getting the Prime.** You can't subsume a Prime or Umbra at all — only the base version — so the base is your one and only Helminth donor for that ability. Never sell it assuming it's useless.",
            "**Don't overwrite an ability you actually use.** You only get one subsume slot; replace the ability you press least, not your bread-and-butter.",
            "**Remember many augments don't carry over.** If a subsumed ability is only good with its augment, verify it still works when infused before relying on it.",
            "**Watch your Bile.** It's the usual resource bottleneck — infuse deliberately rather than re-swapping abilities on a whim."
          ]
        },
        {
          "type": "warn",
          "text": "If you already sold a base frame and now want to subsume it, you'll have to re-acquire it — for Prime-only frames that means relics and rebuilding. Check the [vaulted tracker](/vaulted) to see whether a Prime is currently farmable before you plan around it, and the [relic value tool](/relics-value) if you're farming parts to rebuild."
        }
      ]
    }
  ],
  "faqs": [
    {
      "q": "How do I unlock the Helminth in Warframe?",
      "a": "First complete the Heart of Deimos quest (available once you've finished the intro and have your Orbiter) to reach the Necralisk and start earning Entrati standing. Completing the quest doesn't hand you the Helminth — once you're Mastery Rank 8 and Rank 3 (Associate) with the Entrati, buy the Helminth Segment blueprint from Son, craft it in your Foundry, and install it. The Helminth Infirmary at the back of your Orbiter then becomes usable, and you feed it resources to rank it up."
    },
    {
      "q": "Does subsuming a Warframe destroy it?",
      "a": "Yes — subsuming permanently consumes the donor frame in exchange for one of its abilities. If it's your only copy you'll have to re-farm or rebuild it. Always feed a duplicate, a frame you never use, or a base version you're replacing with its Prime — and note you can only subsume base frames, never Primes or Umbra."
    },
    {
      "q": "Should I subsume my Prime or the base Warframe?",
      "a": "You can only subsume the base version — Prime and Umbra frames can't be fed to the Helminth at all. Since the base donates the exact same ability, keep the Prime to play and feed the base. This is also why you shouldn't sell base frames after getting their Prime — they're your free Helminth fodder."
    },
    {
      "q": "Can a Warframe have more than one subsumed ability?",
      "a": "No — each frame has a single subsume slot and can hold only one infused ability at a time. You can change it later by infusing a different ability over the old one, but that costs Helminth resources each time and overwrites the previous choice."
    },
    {
      "q": "Do I need to level my Warframe to Rank 30 before subsuming it?",
      "a": "No — that's a common myth. A Warframe can be subsumed at any level, even freshly built at Rank 0, and there's no rank requirement on the frame you infuse the ability onto either. The real gates are on your account: Mastery Rank 8 and Entrati standing to unlock the Helminth in the first place."
    },
    {
      "q": "What are Helminth Invigorations and are they worth it?",
      "a": "Invigorations are weekly stat buffs unlocked by installing the separate Invigoration Segment (bought from the Entrati). Each week the Helminth offers a randomized pair of buffs — a big offensive stat like Ability Strength plus a utility stat — which you apply to one frame for seven days. They're genuinely powerful and worth using on a frame you're playing that week, but because they're temporary, don't build your whole loadout around them."
    },
    {
      "q": "Do subsumed abilities keep their augment mods and full strength?",
      "a": "Not always. Subsumed abilities scale with the recipient frame's mods (Strength, Duration, Range, Efficiency), but a handful are capped lower than on their native frame, and many can't use their augment mod (though a growing list can). Check the wiki entry for any ability you plan to rely on before committing resources."
    }
  ],
  "videos": [
    {
      "id": "eMJlOIpaki0",
      "title": "Helminth Guide - The Systems of Warframe - Subsuming, Invigoration & other functions",
      "channel": "QuadLyStop"
    },
    {
      "id": "3Ij4OLxXyKk",
      "title": "The MOST POWERFUL system in Warframe - Helminth Invigoration, Subsuming, Abilities & Archon Shards",
      "channel": "QuadLyStop"
    },
    {
      "id": "BmHOYP6Osks",
      "title": "Top 10 Warframe Helminth Abilities YOU NEED In 2025!",
      "channel": "iFlynn"
    },
    {
      "id": "ui1GTJSLBMk",
      "title": "Warframe: Top 5 SUBSUMED Helminth Abilities!",
      "channel": "iFlynn"
    }
  ],
  "sources": [
    {
      "label": "Warframe Wiki — Helminth",
      "href": "https://wiki.warframe.com/",
      "icon": "book-open-page-variant"
    },
    {
      "label": "r/Warframe — A little reminder before subsuming a frame",
      "href": "https://reddit.com/r/Warframe/comments/1irgcfd/a_little_reminder_before_subsuming_a_frame/",
      "icon": "reddit"
    },
    {
      "label": "r/Warframe — Reminder: Do NOT sell base frames after getting their prime",
      "href": "https://reddit.com/r/Warframe/comments/1muncct/reminder_do_not_sell_base_frames_after_getting/",
      "icon": "reddit"
    }
  ],
  "related": [
    {
      "label": "Archon Shards Guide",
      "to": "/guides/archon-shards",
      "icon": "hexagon-multiple",
      "note": "Stack permanent stat boosts on top of subsumes"
    },
    {
      "label": "Warframe Tier List",
      "to": "/guides/tier-list",
      "icon": "format-list-numbered",
      "note": "Which frames are worth building — and subsuming"
    },
    {
      "label": "Modding Guide",
      "to": "/guides/mods",
      "icon": "puzzle",
      "note": "Subsumed abilities scale with your mods"
    },
    {
      "label": "Steel Path Guide",
      "to": "/guides/steel-path",
      "icon": "skull",
      "note": "Where Helminth buffs matter most"
    },
    {
      "label": "Resources Farming",
      "to": "/guides/resources",
      "icon": "pickaxe",
      "note": "Stock the materials the Helminth eats"
    },
    {
      "label": "Community Tools Directory",
      "to": "/tools",
      "icon": "toolbox",
      "note": "Ability lookups, build planners and wikis"
    }
  ],
  "updated": "2026-07-18"
}

export default guide
