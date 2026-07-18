// Auto-generated Warframe Knowledge Center guide content.
// Drafted grounded in r/Warframe research (reddit API) + the subreddit wiki FAQ,
// then adversarially fact-checked for evergreen accuracy. Embedded video ids were
// verified live via YouTube oEmbed. Edit freely — this is the single source for
// the /guides/tier-list page (rendered by <GuideArticle>).
import type { Guide } from './types'

const guide: Guide = {
  "slug": "tier-list",
  "eyebrow": "Knowledge Center · Tier Lists",
  "title": "Warframe Tier List — How to Read It",
  "lede": "There is no single \"best Warframe\" — only the best frame for a given activity, build, and account. This guide teaches you to read any tier list critically instead of chasing one.",
  "category": "reference",
  "readMins": 9,
  "stats": [
    {
      "num": "50+",
      "label": "warframes in the roster",
      "tone": "gold"
    },
    {
      "num": "Any",
      "label": "frame clears the whole star chart",
      "tone": "good"
    },
    {
      "num": "3",
      "label": "build levers that matter more than the frame",
      "tone": "alt"
    },
    {
      "num": "0",
      "label": "tier lists that fully agree with each other"
    }
  ],
  "sections": [
    {
      "id": "why-they-disagree",
      "title": "Why every tier list disagrees",
      "blocks": [
        {
          "type": "p",
          "text": "Search \"Warframe tier list\" and you'll find a dozen S-through-F charts that flatly contradict each other. That's not because the creators are wrong — it's because a tier list compresses a hugely contextual question (\"how strong is this frame?\") into one letter. Strip out the context and the ranking stops meaning anything."
        },
        {
          "type": "p",
          "text": "Three forces pull rankings apart: **what content you're judging for** (a nuke that melts a defense map is useless on a solo boss), **how deep the build goes** (mods, Helminth, arcanes and shards can triple a frame's ceiling), and **patch churn** (DE reworks frames constantly, so a list made six months ago may rank a frame by a kit it no longer has)."
        },
        {
          "type": "info",
          "text": "The single most important takeaway: **almost every Warframe in the game clears the entire star chart comfortably.** Tier lists only start to matter at the endgame edges — Steel Path, deep endless runs, speed-farming, and Eidolons. For everything else, play what's fun."
        }
      ]
    },
    {
      "id": "what-good-means",
      "title": "What \"good\" actually means (per activity)",
      "blocks": [
        {
          "type": "p",
          "text": "\"Best\" is meaningless until you name the job. A frame that's S-tier for one activity can be a C for another — and that's the whole reason lists fight. Match the frame to the work in front of you:"
        },
        {
          "type": "table",
          "table": {
            "columns": [
              "Activity",
              "What actually wins",
              "Frame traits that shine"
            ],
            "rows": [
              [
                "Star chart & story",
                "Just clear the room — anything works",
                "Whatever you enjoy; damage + mobility"
              ],
              [
                "Steel Path",
                "Staying alive while dealing sustained damage",
                "Damage reduction, overguard, armor strip, healing"
              ],
              [
                "Deep endless (Survival, Circuit)",
                "Damage that scales + not dying",
                "Nukes, status priming, immortality, energy economy"
              ],
              [
                "Farming loot & resources",
                "Loot multipliers, not raw power",
                "Desecrate-style loot abilities, wide AoE"
              ],
              [
                "Eidolon hunts",
                "Void damage, buffs, speed",
                "Damage amp, energy support, mobility"
              ],
              [
                "Bosses & single-target",
                "Burst DPS with a survivability floor",
                "Damage buffs, weak-point uptime"
              ]
            ],
            "note": "No node names on purpose — the activities are evergreen even as the exact \"best node\" shifts each patch. Check a recent video or the wiki for current hotspots."
          }
        },
        {
          "type": "p",
          "text": "This is why a serious creator will publish separate charts for \"general,\" \"Steel Path,\" and \"endurance\" — the same frame lands in different tiers depending on the column. If a list doesn't tell you what it's ranking for, treat its letters with suspicion."
        }
      ]
    },
    {
      "id": "overframe-problem",
      "title": "The Overframe problem — how to read any list",
      "blocks": [
        {
          "type": "p",
          "text": "The community's favorite cautionary tale is [Overframe](/tools)'s community tier list. It's a genuinely useful tool, but its rankings are built from **community votes aggregated over time** — so a frame that was strong years ago keeps its old score, while a reworked or buffed frame is dragged down by votes cast when it was weak. Rankings calcify; recent reworks barely move the needle."
        },
        {
          "type": "quote",
          "text": "A vote-aggregated list will cheerfully rank a flashy old nuke above a frame like Valkyr — who barely dies in Hysteria and tears through almost anything in melee — just because she banked fewer votes back when she was less fashionable. That lag is the whole problem in one picture.",
          "cite": "The recurring r/Warframe critique of Overframe's vote-based rankings"
        },
        {
          "type": "p",
          "text": "You don't have to agree with that specific take to see the point: a chart built on years of accumulated votes tells you what the crowd *used* to think, not what a frame does today. Use crowd-sourced lists as a rough map, never as scripture."
        },
        {
          "type": "steps",
          "ordered": true,
          "steps": [
            {
              "h": "Check the date",
              "p": "A tier list is a snapshot. If it predates a major update or a frame's rework, its rankings for that frame are stale."
            },
            {
              "h": "Check the methodology",
              "p": "Is it one buildcrafter's judgment, or aggregated community votes? Aggregate votes lag behind reworks badly — that's the Overframe flaw."
            },
            {
              "h": "Check the scope",
              "p": "\"Best for what?\" General vs Steel Path vs endurance vs farming are different charts. A list that doesn't say is only telling half the story."
            },
            {
              "h": "Cross-reference two or three sources",
              "p": "Where multiple recent, reputable creators agree, you can trust it. Where they split, it's a preference call — pick what you like."
            }
          ]
        }
      ]
    },
    {
      "id": "build-levers",
      "title": "The three levers that outrank the frame",
      "blocks": [
        {
          "type": "p",
          "text": "A frame is a chassis. What you bolt onto it decides most of its power — which is why an \"A-tier\" frame with a bad build loses to a \"C-tier\" frame that's built properly. Before you chase a meta pick, learn the three levers that lift *any* frame:"
        },
        {
          "type": "list",
          "items": [
            "**Mods & buildcraft** — the biggest lever by far. Ability strength, range, duration, efficiency, plus survivability tech like shield-gating turn a squishy frame into a Steel-Path machine. See the [mods guide](/guides/mods).",
            "**Helminth subsume** — the great equalizer. Grafting a strong ability (a damage buff like Roar, a heal, or an armor strip) onto almost any frame patches its weakness. The [Helminth guide](/guides/helminth) covers the best subsumes.",
            "**Arcanes & Archon Shards** — the endgame multiplier: passive stat and effect boosts that stack on top of mods. See [arcanes](/guides/arcanes) and [archon shards](/guides/archon-shards)."
          ]
        },
        {
          "type": "warn",
          "text": "A tier list ranks a frame at its build ceiling — fully modded, subsumed, arcaned. If your account is young, a top-tier frame won't feel top-tier yet. That gap is your build, not the frame."
        }
      ]
    },
    {
      "id": "archetypes",
      "title": "Archetypes: the roles frames fill",
      "blocks": [
        {
          "type": "p",
          "text": "A more useful mental model than a ranking: sort frames by the **job they do**. Warframe wants a team (or a self-sufficient solo build) that covers damage, survival, and utility. Once you think in roles, \"what's best\" turns into \"what's missing from my loadout.\""
        },
        {
          "type": "table",
          "table": {
            "columns": [
              "Role",
              "What it does",
              "Example frames"
            ],
            "rows": [
              [
                "Nuke / map clear",
                "Delete whole rooms at once",
                "Saryn, Mesa, Volt, Ember"
              ],
              [
                "Immortal / brawler",
                "Effectively can't die; brute-forces content",
                "Revenant, Valkyr, Inaros"
              ],
              [
                "Support / buffer",
                "Multiplies the squad's damage & survival",
                "Wisp, Rhino, Harrow, Trinity"
              ],
              [
                "Crowd control",
                "Locks enemies down so nothing hits you",
                "Nova, Vauban, Gara, Frost"
              ],
              [
                "Farming / loot",
                "Boosts drops and resources per run",
                "Nekros, Khora, Hydroid"
              ],
              [
                "Speed / mobility",
                "Blitz objectives and open worlds",
                "Gauss, Titania, Volt"
              ]
            ],
            "note": "Frames overlap roles — Volt buffs, nukes, and speeds. These are enduring role fits, not a ranking; exact picks shift as DE reworks kits."
          }
        },
        {
          "type": "p",
          "text": "Notice that some abilities are so good they escape their frame entirely: Rhino's Roar and various armor-strips and heals are among the most-subsumed abilities in the game via [Helminth](/guides/helminth). Read tier lists with that in mind — a \"low-tier\" frame can still own a best-in-class ability worth farming for."
        }
      ]
    },
    {
      "id": "safe-picks",
      "title": "A few frames almost everyone rates highly",
      "blocks": [
        {
          "type": "p",
          "text": "With every caveat above stated, some frames land near the top of nearly every recent list because they're forgiving, flexible, and strong across many activities. Treat these as reliable defaults, not a mandate:"
        },
        {
          "type": "list",
          "items": [
            "**Revenant** — Mesmer Skin makes him nearly unkillable, which is why he's the classic \"just let me play\" carry.",
            "**Saryn** — the benchmark AoE nuke for endless Survival and Defense.",
            "**Wisp** — a top-tier support whose buffs help the whole squad, and herself.",
            "**Octavia** — enormous survivability and damage with a low-input, AFK-friendly kit.",
            "**Rhino** — the beloved beginner tank; his Roar buff doubles as one of the best Helminth subsumes.",
            "**Nekros / Khora** — the farming staples for extra loot and resources per run."
          ]
        },
        {
          "type": "tip",
          "text": "These are examples, not gospel — DE reworks and releases frames constantly. Before you commit Forma, sanity-check against a current creator tier list (see [creators](/creators)) rather than trusting any static list, including this one."
        },
        {
          "type": "quote",
          "text": "RINO HAVE IRON SKIN. BULLET BECOME FOOD. WHEN RINO CONFUSE, HE STOMP FOOT. EVERYBODY STOP UNTIL HE FIGURE IT OUT. FEED RINO MODS.",
          "cite": "A well-worn r/Warframe meme about Rhino, the near-unanimous first craft"
        }
      ]
    },
    {
      "id": "weapons-vs-frames",
      "title": "Your weapon (and damage type) often matters more",
      "blocks": [
        {
          "type": "p",
          "text": "Here's the twist tier lists rarely mention: for raw clear speed, **your weapon and its damage type frequently outweigh your frame.** A well-modded gun with the right elemental combo will shred content on a \"C-tier\" frame, while a top-tier frame with a bare weapon stalls. This is also why the subreddit's damage-type tier lists spark as much debate as the frame ones."
        },
        {
          "type": "table",
          "table": {
            "columns": [
              "Damage type",
              "Great against",
              "Why it endures"
            ],
            "rows": [
              [
                "Viral",
                "Flesh / health (most enemies)",
                "Amplifies damage taken to health — near-universal"
              ],
              [
                "Heat",
                "Armored Grineer",
                "Strips some armor, adds a burn DoT, panics enemies"
              ],
              [
                "Corrosive",
                "Heavily armored units",
                "Stacks up to strip armor"
              ],
              [
                "Magnetic",
                "Shields (Corpus)",
                "Amplifies damage taken to shields"
              ],
              [
                "Radiation",
                "Alloy-armored heavies & robotics",
                "Bonus vs alloy armor and robotic health; procs make enemies fight each other"
              ]
            ],
            "note": "DE periodically reworks armor and status — verify current numbers on the wiki. The pairings (e.g. Viral + Heat, plus Slash procs) are what stay stable, not the exact percentages."
          }
        },
        {
          "type": "p",
          "text": "Weapons carry their own market and [riven](/guides/riven) economy too. If you're weighing a weapon investment, the [riven value estimator](/riven-value) and [market screener](/screener) show what a weapon's rivens and parts are actually worth before you Forma it."
        }
      ]
    },
    {
      "id": "how-to-pick",
      "title": "How to actually pick your next frame",
      "blocks": [
        {
          "type": "p",
          "text": "Skip the paralysis. Instead of hunting the #1 slot on someone's chart, run this loop:"
        },
        {
          "type": "steps",
          "ordered": true,
          "steps": [
            {
              "h": "Name the goal",
              "p": "Steel Path? Eidolons? Faster farming? A frame you'll enjoy for 100 hours? The answer changes the whole recommendation."
            },
            {
              "h": "Fill your loadout's gap",
              "p": "Look at the archetype table — what does your current roster lack? A buffer, a nuke, a loot frame? Farm to cover the hole."
            },
            {
              "h": "Check what you can get now",
              "p": "The best frame is one you can actually farm this week. Don't sell frames to make room — grab cheap slots and keep them (see the FAQ below)."
            },
            {
              "h": "Cross-check two recent creators",
              "p": "Watch a couple of up-to-date tier lists (linked below). Where reputable creators agree, invest with confidence; where they split, pick on playstyle."
            },
            {
              "h": "Then build it properly",
              "p": "Mods, then a Helminth subsume, then arcanes and shards. The build is where the tier comes from."
            }
          ]
        },
        {
          "type": "p",
          "text": "New to the roster entirely? Start with the [beginner Warframes guide](/guides/beginner-warframes) and follow the [progression guide](/guides/progression) — both point you at forgiving, easy-to-farm frames long before any tier list becomes relevant."
        }
      ]
    }
  ],
  "faqs": [
    {
      "q": "What is the best Warframe in 2025 / 2026?",
      "a": "There isn't one — \"best\" depends entirely on the activity, your build, and your playstyle. Frames like Revenant, Saryn, Wisp and Octavia land near the top of most recent lists because they're strong and forgiving, but almost every frame clears the whole star chart. Match the frame to the job (see the archetype table above) rather than chasing a single S-tier pick."
    },
    {
      "q": "Can I trust the Overframe tier list?",
      "a": "Use it as a rough starting point, not gospel. Overframe is community-voted and aggregates those votes over time, so frames that were strong years ago can stay ranked high while recently reworked or buffed frames lag behind what they actually do today — a durable, low-input frame can end up underrated simply because it banked fewer votes. Cross-reference a couple of recent creator tier lists before you invest."
    },
    {
      "q": "Does my Warframe choice even matter?",
      "a": "For the star chart and story, barely — play whatever you enjoy. Your choice starts to matter at the endgame edges (Steel Path, deep endless, Eidolons, speed-farming), and even there your build usually matters more than the frame. Mods, a Helminth subsume, and arcanes/shards decide most of a frame's real power — see the [mods guide](/guides/mods)."
    },
    {
      "q": "Why do Warframe tier lists disagree so much?",
      "a": "Because a single letter can't capture a contextual question. Lists split on what content they're ranking for, how deep the build goes, when they were made (frames get reworked constantly), and the methodology — one expert's opinion versus aggregated community votes. When creators agree, trust it; when they split, it's a preference call."
    },
    {
      "q": "What are the strongest Warframes for Steel Path?",
      "a": "Steel Path rewards survivability plus sustained damage, so frames with damage reduction, overguard, armor strip, or self-healing shine — immortality-style picks (Revenant, Valkyr, Inaros) and strong buffers/nukes all do well. Just as important is a shield-gating or damage-reduction build on top. See the [Steel Path guide](/guides/steel-path) for the full approach."
    },
    {
      "q": "Should I sell a Warframe that's low-tier or that I don't like?",
      "a": "Don't sell hard-to-farm frames to free up slots — the subreddit is full of players who regret it. Warframe slots are cheap, frames get reworked and buffed over time, and re-farming a boss frame is a pain. Buy slots and keep everything; a \"low-tier\" frame may hold a best-in-class ability you'll want for [Helminth](/guides/helminth) later."
    },
    {
      "q": "Do weapons or Warframes matter more?",
      "a": "For raw clear speed, your weapon and its damage type often matter more than the frame — a well-modded gun with the right elemental combo shreds content on almost any frame. Learn damage types and modding first ([mods guide](/guides/mods)), and check a weapon's worth with the [riven value estimator](/riven-value) before you commit Forma."
    },
    {
      "q": "What Warframe should a beginner main?",
      "a": "Pick a starter you enjoy — Excalibur, Mag and Volt are all equally viable — and the community's near-unanimous first craft is Rhino for his Iron Skin tankiness. Beyond that, main whatever's fun; you'll collect dozens of frames over time. The [beginner Warframes guide](/guides/beginner-warframes) walks through the easiest strong picks to farm early."
    }
  ],
  "videos": [
    {
      "id": "J_4SMeNx-DQ",
      "title": "FULL ROSTER ALL WARFRAME 2026 TIERLIST",
      "channel": "Brozime"
    },
    {
      "id": "4weC5xRI_jg",
      "title": "Warframe Tier List | 2025 (Mid-Year)",
      "channel": "kyaii"
    },
    {
      "id": "YNafIWOUBhU",
      "title": "BEST Warframes 2026 TIER LIST",
      "channel": "MHBlacky"
    },
    {
      "id": "FKTBWssvtJE",
      "title": "Warframe 2025 Tier List For The Best Warframes!",
      "channel": "Pupsker"
    }
  ],
  "sources": [
    {
      "label": "r/Warframe — Why the Overframe tier list is not to be trusted",
      "href": "https://reddit.com/r/Warframe/comments/1qotd7o/one_of_many_reasons_why_the_overframe_tier_list/"
    },
    {
      "label": "r/Warframe — Made a tier list for the game's damage types",
      "href": "https://reddit.com/r/Warframe/comments/oxgzjz/made_a_tier_list_for_the_games_damage_types/"
    },
    {
      "label": "r/Warframe — Don't sell your hard-to-farm Warframes",
      "href": "https://reddit.com/r/Warframe/comments/1htjkxv/dont_sell_your_hard_to_farm_warframes/"
    },
    {
      "label": "Warframe Wiki",
      "href": "https://wiki.warframe.com/"
    }
  ],
  "related": [
    {
      "label": "Beginner Warframes",
      "to": "/guides/beginner-warframes",
      "icon": "star-four-points",
      "note": "Which frames to farm first"
    },
    {
      "label": "Helminth",
      "to": "/guides/helminth",
      "icon": "dna",
      "note": "Subsume the best abilities onto any frame"
    },
    {
      "label": "Steel Path",
      "to": "/guides/steel-path",
      "icon": "shield-star",
      "note": "Where tier lists finally matter"
    },
    {
      "label": "Mods & Buildcraft",
      "to": "/guides/mods",
      "icon": "puzzle",
      "note": "The lever that outranks the frame"
    },
    {
      "label": "Content Creators",
      "to": "/creators",
      "icon": "youtube",
      "note": "Recent tier lists to cross-check"
    },
    {
      "label": "Community Tools",
      "to": "/tools",
      "icon": "toolbox",
      "note": "Overframe, wiki, buildcrafters"
    }
  ],
  "updated": "2026-07-18"
}

export default guide
