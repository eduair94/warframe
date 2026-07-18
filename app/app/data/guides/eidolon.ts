// Auto-generated Warframe Knowledge Center guide content.
// Drafted grounded in r/Warframe research (reddit API) + the subreddit wiki FAQ,
// then adversarially fact-checked for evergreen accuracy. Embedded video ids were
// verified live via YouTube oEmbed. Edit freely — this is the single source for
// the /guides/eidolon page (rendered by <GuideArticle>).
import type { Guide } from './types'

const guide: Guide = {
  "slug": "eidolon",
  "eyebrow": "Knowledge Center · Eidolon Hunting",
  "title": "Eidolon Hunting Guide",
  "lede": "The Tridolon is Warframe's original endgame ritual: three towering Sentient bosses, one 50-minute window of night, and a farm that still prints Focus, arcanes and Operator power. Here's how to go from Mote-Amp meme to confident capturer.",
  "category": "endgame",
  "readMins": 11,
  "stats": [
    {
      "num": "3",
      "label": "Eidolons in a Tridolon",
      "tone": "gold"
    },
    {
      "num": "50",
      "label": "minutes of night per cycle",
      "tone": "alt"
    },
    {
      "num": "4–6",
      "label": "limbs to break per Eidolon",
      "tone": "good"
    },
    {
      "num": "2–3",
      "label": "charged lures to capture"
    }
  ],
  "sections": [
    {
      "id": "what-is-a-tridolon",
      "title": "What is the Tridolon?",
      "blocks": [
        {
          "type": "p",
          "text": "On the **Plains of Eidolon** outside Cetus, three colossal Sentient bosses spawn only at night: the **Teralyst**, the **Gantulyst**, and the **Hydrolyst**. Downing all three in a single night is called a **Tridolon** — the original Warframe endgame test that blends gear, Operator play and teamwork under a hard time limit."
        },
        {
          "type": "p",
          "text": "You don't just shoot these things. Each Eidolon is wrapped in a **Sentient energy shield** that ordinary weapons can't touch — you strip it with your **Operator's Amp**, then burst the exposed limb with a heavy-hitting weapon. Get the rhythm right and the Tridolon becomes one of the game's fastest [Focus](/guides/focus) farms and a reliable source of [arcanes](/guides/arcanes) and Operator upgrades."
        },
        {
          "type": "kv",
          "kv": [
            {
              "k": "Where",
              "v": "Plains of Eidolon (Cetus, Earth) — an open-world zone"
            },
            {
              "k": "When",
              "v": "Night only. A full night lasts 50 minutes; day lasts 100"
            },
            {
              "k": "The three",
              "v": "Teralyst (easiest) → Gantulyst → Hydrolyst (hardest)"
            },
            {
              "k": "Why hunt",
              "v": "Focus, Warframe arcanes, Sentient Cores for Amp/Operator gear"
            }
          ]
        }
      ]
    },
    {
      "id": "before-you-go",
      "title": "Before you go: prerequisites",
      "blocks": [
        {
          "type": "p",
          "text": "Eidolon hunting sits behind a few story gates. You don't need to be a veteran, but you do need an Operator and a real Amp — this is not a fight you can brute-force with your favorite gun."
        },
        {
          "type": "list",
          "items": [
            "**Plains access** — complete the *Saya's Vigil* quest to unlock Cetus and the Plains (see the [quest guide](/guides/quests)).",
            "**An Operator** — complete *The Second Dream* to unlock your Operator, the being that actually damages Eidolon shields.",
            "**Full Operator power** — complete *The War Within*. It unlocks full Transference and access to **the Quills** — and since that's where you build your Amp, it's effectively required before your first real hunt.",
            "**The Quills** — enter this Cetus syndicate's cave as your Operator; it sells Amp parts, Operator arcanes and Focus lenses in exchange for standing you earn by turning in the **Sentient Cores** the hunt itself drops."
          ]
        },
        {
          "type": "warn",
          "text": "Do **not** show up to a squad with the free **Mote Amp**. It's the number-one new-hunter mistake and the source of a long-running r/Warframe meme — it simply can't strip Sentient shields fast enough to keep the run on schedule."
        }
      ]
    },
    {
      "id": "your-amp",
      "title": "Your Amp is everything",
      "blocks": [
        {
          "type": "p",
          "text": "An **Amp** is your Operator's gun, and it's the single most important piece of Eidolon gear. Amps are built from three parts — a **Prism**, a **Scaffold**, and a **Brace** — and the community names builds by three numbers (like `1-2-3`) that map to those parts. The starter **Mote Amp** you get for free is far too weak; your first real goal is replacing it."
        },
        {
          "type": "p",
          "text": "You buy your first Amp parts with **Quills** standing in Cetus, earned by turning in the **Sentient Cores** the hunt itself drops — so your very first captures literally pay for the Amp that makes the *next* hunts fast. Higher-tier Corpus Amp parts come from **Little Duck** (Vox Solaris, in Fortuna), whose standing you earn separately, mostly from **Toroids** farmed on the Orb Vallis. The exact 'best' amp shifts with balance patches, so build a solid mid-tier Amp early and check a current amp guide or the [wiki](https://wiki.warframe.com/) before chasing the meta pick."
        },
        {
          "type": "tip",
          "text": "Pair your Amp with the **Madurai** focus school. Its passives boost Amp and Void damage — exactly what you need to strip shields quickly. Level it up using the [Focus](/guides/focus) system and slot Operator arcanes (Magus/Virtuos) as you earn standing."
        }
      ]
    },
    {
      "id": "meta-comp",
      "title": "The meta squad comp",
      "blocks": [
        {
          "type": "p",
          "text": "A classic 4-player Tridolon squad is built around **roles**, not specific frames. You want a damage carry, a buff that multiplies that damage, and support that keeps energy and Operators alive. The traditional archetypes:"
        },
        {
          "type": "table",
          "table": {
            "columns": [
              "Role",
              "Frame archetype",
              "What it brings"
            ],
            "rows": [
              [
                "Damage carry",
                "Chroma",
                "Vex Armor multiplies weapon damage massively — holds the crit sniper and does the killing"
              ],
              [
                "Crit / damage buff",
                "Volt or Harrow",
                "Volt's Electric Shield amps shots fired through it; Harrow's Covenant grants the whole team crit chance"
              ],
              [
                "Energy & survival",
                "Trinity",
                "Energy Vampire + Blessing keep the squad's energy topped and Operators alive; often the lure caddy"
              ],
              [
                "Flex / utility",
                "Rhino or Wisp",
                "Rhino's Roar or Wisp's motes add extra damage, speed and buffs to round out the squad"
              ]
            ],
            "note": "Roles matter more than exact frames. Any comp that stacks a damage carry, a damage/crit buff, energy and a lure-tank works — see the [tier list](/guides/tier-list) for frame strengths."
          }
        },
        {
          "type": "kv",
          "kv": [
            {
              "k": "Weapon",
              "v": "A high-crit sniper (e.g. Rubico Prime, Lanka) built for Radiation + critical damage"
            },
            {
              "k": "Operator",
              "v": "A real Amp (never the Mote Amp) plus the Madurai focus school"
            },
            {
              "k": "Arcanes",
              "v": "Operator arcanes like Magus Lockdown and Virtuos Shadow sharpen the strip-and-shoot loop"
            }
          ]
        }
      ]
    },
    {
      "id": "the-kill-loop",
      "title": "The kill loop: shields, limbs, capture",
      "blocks": [
        {
          "type": "p",
          "text": "Every Eidolon dies the same way. Learn this loop once and it scales from a solo Teralyst to a full Hydrolyst:"
        },
        {
          "type": "steps",
          "ordered": true,
          "steps": [
            {
              "h": "Strip the shield",
              "p": "Swap to your Operator and hit an Eidolon limb with your Amp until its blue Sentient shield breaks. Normal weapons barely scratch it — this is exactly what the Amp is for."
            },
            {
              "h": "Break the limb",
              "p": "Transference back into your Warframe and burst the exposed limb with your sniper before the shield regenerates. The Teralyst has 4 limbs; the larger Gantulyst and Hydrolyst have 6 each — repeat strip-then-shoot on every one."
            },
            {
              "h": "Drop it to its knees",
              "p": "With every limb destroyed the Eidolon kneels and exposes its core. Now you decide: capture or kill."
            },
            {
              "h": "Capture with lures",
              "p": "If you have enough charged lures linked — 2 for the Teralyst, 3 for the Gantulyst and Hydrolyst — capture it for the full reward. Grab the Eidolon Shard it drops and take it to a Shrine on the Plains to summon the next tier."
            },
            {
              "h": "Climb the ladder",
              "p": "Teralyst → Gantulyst → Hydrolyst, all inside the 50-minute night. Finishing all three is a Tridolon."
            }
          ]
        },
        {
          "type": "info",
          "text": "Eidolons punish careless play: they can **adapt and resist** a damage type you overuse, and each limb-break releases a **magnetic burst** that saps energy and shields. Transference to your Operator and **void dash** to cleanse it, and keep your damage consistent but managed. Full damage-type details live on the [wiki](https://wiki.warframe.com/)."
        }
      ]
    },
    {
      "id": "lures-and-vomvalysts",
      "title": "Lures & Vomvalysts: how capturing works",
      "blocks": [
        {
          "type": "p",
          "text": "**Lures** are the drone cages that spawn on the Plains at night. Activate one and it follows you; **charge** it by killing **Vomvalysts** — the floating Sentient spirits — nearby, until the lure glows blue instead of red. You have to kill Vomvalysts in their energy form with your **Amp**, since weapons pass right through them. Charged lures brought to a kneeling Eidolon are what let you capture instead of merely kill."
        },
        {
          "type": "tip",
          "text": "**Always capture, never just kill.** A capture — 2 charged lures for the Teralyst, 3 for the Gantulyst and Hydrolyst — grants an extra Sentient Core and better odds at high-tier cores and arcanes. Bring spare charged lures so one dying to Vomvalyst fire doesn't cost you the whole capture."
        }
      ]
    },
    {
      "id": "rewards",
      "title": "What you actually farm",
      "blocks": [
        {
          "type": "p",
          "text": "The Tridolon is one of the best **Focus** farms in the game and the classic source of Warframe arcanes and Operator gear. Here's where each reward goes:"
        },
        {
          "type": "table",
          "table": {
            "columns": [
              "Reward",
              "What it does",
              "Where it goes"
            ],
            "rows": [
              [
                "Eidolon Shards (Brilliant / Radiant)",
                "Convert into large lumps of Focus — tens of thousands each",
                "Feed your [Focus](/guides/focus) school; a top-tier focus farm"
              ],
              [
                "Warframe Arcanes",
                "Build-defining power and tradeable platinum",
                "Equip them or sell — price-check on the [screener](/screener)"
              ],
              [
                "Sentient Cores (Intact → Radiant)",
                "Quills standing (Little Duck uses Toroids)",
                "Buy Amp parts, Operator arcanes and Focus lenses"
              ],
              [
                "Capture bonus",
                "Extra core + better drop odds",
                "Only earned if you capture with charged lures"
              ]
            ]
          }
        },
        {
          "type": "info",
          "text": "Heads up on the arcane market: after DE added former Eidolon-exclusive arcanes (like Arcane Energize) to other sources, their [platinum](/guides/platinum) values dropped well below the old boom-era prices. Check live numbers on the [screener](/screener) or [movers](/movers) before you sell — but remember the Focus and Sentient Cores alone make the run worth doing."
        }
      ]
    },
    {
      "id": "beginner-path",
      "title": "Beginner path: solo the Teralyst first",
      "blocks": [
        {
          "type": "p",
          "text": "Jumping straight into a public 3x3 Tridolon with a Mote Amp is how new hunters get frustrated. Build up in order instead:"
        },
        {
          "type": "steps",
          "ordered": true,
          "steps": [
            {
              "h": "Clear the prerequisites",
              "p": "Finish [Saya's Vigil](/guides/quests) for Plains access and The Second Dream for your Operator; The War Within unlocks full Operator power and Quills standing."
            },
            {
              "h": "Build a real Amp",
              "p": "Grind Quills standing (turn in Sentient Cores) and buy proper Amp parts. Retire the Mote Amp the moment you can — it can't strip shields fast enough to matter."
            },
            {
              "h": "Solo a Teralyst",
              "p": "The Teralyst is the weakest Eidolon and safe to learn on alone. Practice the strip-shoot-repeat loop with no squad pressure and no timer stress."
            },
            {
              "h": "Bring and charge lures",
              "p": "Capture your solo Teralyst for full rewards — it also teaches lure and Vomvalyst management before you attempt Gantulyst and Hydrolyst."
            },
            {
              "h": "Graduate to the Tridolon",
              "p": "Once solo Teralysts feel routine, use Recruiting chat or public matchmaking for full Chroma/Volt/Trinity/Harrow Tridolon runs."
            }
          ]
        }
      ]
    },
    {
      "id": "timing-and-squads",
      "title": "Timing the night & finding a squad",
      "blocks": [
        {
          "type": "p",
          "text": "Eidolons only appear during the Plains' **50-minute night**. Stage in Cetus *before* dusk so you don't burn the window travelling out — a full Tridolon takes practiced squads well under a night, but a first run eats most of it. Not sure when night falls? Community cycle trackers (linked from our [tools directory](/tools)) show the exact countdown."
        },
        {
          "type": "p",
          "text": "Finding a group is genuinely harder than it used to be — as returning players note, the hunting scene thinned out after the arcane market crash. Your best bets are **Recruiting chat**, relay hubs and dedicated Discord servers; search for 'Tricap' or 'Tridolon' runs, or simply solo the Teralyst until you find a crew. It's a niche endgame now, but a rewarding one — and one of the few farms that meaningfully powers up your Operator."
        }
      ]
    }
  ],
  "faqs": [
    {
      "q": "What do I need before I can hunt Eidolons?",
      "a": "You need Plains access from [Saya's Vigil](/guides/quests) and an Operator from The Second Dream; completing The War Within unlocks full Operator power and Quills standing. Most importantly, build a real Amp from Quills standing before you go — the free Mote Amp can't strip Eidolon shields fast enough to be useful."
    },
    {
      "q": "Why does everyone laugh at the Mote Amp?",
      "a": "The Mote Amp is the free starter Amp, and it's far too weak to strip Sentient shields at a useful speed, so bringing it to a hunt slows the whole squad down. It's a rite-of-passage meme on r/Warframe — grind Quills standing and build a proper Amp (builds are named by three numbers like 1-2-3) before joining runs."
    },
    {
      "q": "How do I capture an Eidolon instead of killing it?",
      "a": "Bring charged lures — **2 for the Teralyst, 3 for the Gantulyst and Hydrolyst**. Activate lures on the Plains and charge them by killing Vomvalysts nearby with your Amp until they glow blue. When the Eidolon kneels after all its limbs are broken, charged lures let you capture it for an extra Sentient Core plus better arcane and refined-shard odds — with no charged lures you can only kill it for reduced rewards (and no arcanes)."
    },
    {
      "q": "What's the best Warframe for Eidolon hunting?",
      "a": "**Chroma** is the classic damage carry because Vex Armor multiplies weapon damage, but roles matter more than any single frame. A strong squad stacks a damage carry, a crit/damage buffer (Volt or Harrow), and energy/survival support (Trinity). See the [tier list](/guides/tier-list) for frame strengths."
    },
    {
      "q": "Can I solo Eidolons as a beginner?",
      "a": "Yes — solo the **Teralyst** first. It's the weakest of the three and the safest way to learn the strip-shield, break-limb, capture loop without squad or timer pressure. Once solo Teralysts feel routine, work up to the Gantulyst, Hydrolyst and full Tridolons."
    },
    {
      "q": "Is Eidolon hunting still worth it after the arcane market crashed?",
      "a": "Yes. Even though arcanes like Arcane Energize dropped in [platinum](/guides/platinum) value once DE added other sources, Tridolons remain one of the fastest [Focus](/guides/focus) farms and the main way to earn Sentient Cores for Amp and Operator upgrades. Price-check arcanes on the [screener](/screener) before you sell any."
    },
    {
      "q": "What focus school should my Operator use for Eidolons?",
      "a": "**Madurai** is the standard Eidolon school — its passives boost Amp and Void damage, which is exactly what you need to strip shields quickly. Pair it with Operator arcanes and a proper Amp; the [focus guide](/guides/focus) covers how to unlock and level schools."
    }
  ],
  "videos": [
    {
      "id": "n47NF2XieIM",
      "title": "HOW TO HUNT EIDOLONS: TERALYST (Warframe)",
      "channel": "StarColyte"
    },
    {
      "id": "yw732IQ4kDY",
      "title": "THE ULTIMATE BEGINNERS guide for EIDOLONS in Warframe 2023 (Part 1)",
      "channel": "WarframeFlo"
    },
    {
      "id": "sHdSVf2kYcs",
      "title": "Warframe Eidolon Guide (2025) - How to Lure Handle",
      "channel": "ForsakenIdol"
    },
    {
      "id": "25LlzizpO3I",
      "title": "Solo Eidolon Hunting 2025 Build",
      "channel": "Jacsonitos"
    }
  ],
  "sources": [
    {
      "label": "Eidolon Info for Dummies like me (r/Warframe)",
      "href": "https://reddit.com/r/Warframe/comments/10qk7g4/eidolon_info_for_dummies_like_me/",
      "icon": "reddit"
    },
    {
      "label": "When you join your first eidolon hunt with the mote amp (r/Warframe)",
      "href": "https://reddit.com/r/Warframe/comments/acb96b/when_you_join_your_first_eidolon_hunt_with_the/",
      "icon": "reddit"
    },
    {
      "label": "Eidolon Hunters are becoming a rare specimen now? (r/Warframe)",
      "href": "https://reddit.com/r/Warframe/comments/1njsdr6/eidolon_hunters_are_becoming_a_rare_specimen_now/",
      "icon": "reddit"
    },
    {
      "label": "Warframe Wiki",
      "href": "https://wiki.warframe.com/",
      "icon": "book-open-variant"
    }
  ],
  "related": [
    {
      "label": "Focus Farming Guide",
      "to": "/guides/focus",
      "icon": "meditation",
      "note": "Turn Eidolon Shards into Focus"
    },
    {
      "label": "Arcanes Guide",
      "to": "/guides/arcanes",
      "icon": "cards",
      "note": "What Eidolons drop and how to use it"
    },
    {
      "label": "Syndicate Standing Guide",
      "to": "/guides/standing",
      "icon": "handshake",
      "note": "Quills & Little Duck for Amp parts"
    },
    {
      "label": "Market Screener",
      "to": "/screener",
      "icon": "table-search",
      "note": "Price-check arcanes before selling"
    },
    {
      "label": "Steel Path Guide",
      "to": "/guides/steel-path",
      "icon": "skull",
      "note": "Sibling endgame challenge"
    }
  ],
  "updated": "2026-07-18"
}

export default guide
