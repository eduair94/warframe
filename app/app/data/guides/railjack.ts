// Auto-generated Warframe Knowledge Center guide content.
// Drafted grounded in r/Warframe research (reddit API) + the subreddit wiki FAQ,
// then adversarially fact-checked for evergreen accuracy. Embedded video ids were
// verified live via YouTube oEmbed. Edit freely — this is the single source for
// the /guides/railjack page (rendered by <GuideArticle>).
import type { Guide } from './types'

const guide: Guide = {
  "slug": "railjack",
  "eyebrow": "Knowledge Center · Railjack",
  "title": "Railjack Guide",
  "lede": "Railjack is Warframe's capital-ship sandbox: pilot a warship through open space, board enemy vessels mid-fight, and command a crew that can be entirely AI. Here's how to unlock it, rank your Intrinsics, and run it solo without being the host everyone dreads.",
  "category": "endgame",
  "readMins": 11,
  "stats": [
    {
      "num": "5",
      "label": "Intrinsic schools",
      "tone": "gold"
    },
    {
      "num": "3",
      "label": "AI crew you can command",
      "tone": "good"
    },
    {
      "num": "10",
      "label": "ranks per Intrinsic",
      "tone": "alt"
    },
    {
      "num": "2",
      "label": "Proxima factions (Grineer + Corpus)"
    }
  ],
  "sections": [
    {
      "id": "what-is-railjack",
      "title": "What Railjack Actually Is",
      "blocks": [
        {
          "type": "p",
          "text": "Railjack is Warframe's **space-combat game mode**, built around a large warship — *your* Railjack — that you and up to three squadmates crew together. You fly it through the **Proxima** regions (open zones of space that orbit familiar planets), shredding enemy fighter swarms, deleting heavily-armored **crewships**, and boarding enemy capital ships and bases to finish objectives on foot."
        },
        {
          "type": "p",
          "text": "The magic is the seamless transitions: one moment you're in the pilot seat weaving through flak, the next you've launched out of an **Archwing slingshot** into an enemy crewship to blow its reactor from the inside, then you're back aboard patching a hull breach with your `Omni` tool. It debuted in the **Empyrean** update and was heavily streamlined in a later Corpus rework, which added the **Command** Intrinsic and the personal **Plexus** mod board — the two systems that make modern solo Railjack genuinely comfortable."
        },
        {
          "type": "kv",
          "kv": [
            {
              "k": "Game mode",
              "v": "Space combat + seamless on-foot boarding"
            },
            {
              "k": "Your ship",
              "v": "The Railjack — pilot it, gun it, or launch from it"
            },
            {
              "k": "Squad size",
              "v": "Up to 4 players, or you + up to 3 AI crew solo"
            },
            {
              "k": "Regions",
              "v": "Grineer Proxima and Corpus Proxima (culminating in the Veil)"
            },
            {
              "k": "Prerequisite",
              "v": "Complete The War Within, then the Rising Tide quest"
            }
          ]
        }
      ]
    },
    {
      "id": "why-bother",
      "title": "Why Bother With Railjack",
      "blocks": [
        {
          "type": "p",
          "text": "Railjack sat in a rough spot for years, but the rework turned it into a real reward engine. It's not just a novelty flight sim — several progression systems route straight through it."
        },
        {
          "type": "table",
          "table": {
            "columns": [
              "Reason",
              "What you get out of it"
            ],
            "rows": [
              [
                "Affinity / leveling",
                "Missions pour shared affinity across your whole loadout, so it's a solid way to rank weapons and frames while doing something other than Hydron."
              ],
              [
                "Resources",
                "Titanium, Asterite, and Grineer/Corpus Proxima drops feed Railjack upgrades and a surprising number of later Foundry recipes."
              ],
              [
                "Sisters of Parvos",
                "The Corpus lich hunt is Railjack-gated — you confront and board the Sister's capital ship to finish her. See the Kuva & Liches guide."
              ],
              [
                "Void Storms",
                "The Railjack flavor of Void Fissures: crack relics and bank extra Void Traces while you fly. Free prime parts on top of the mission."
              ],
              [
                "Quests & story",
                "Rising Tide, Call of the Tempestarii, and later story beats all put you in the pilot seat."
              ],
              [
                "Mastery & variety",
                "Intrinsics, components, and a combat sandbox that plays like nothing else in the game."
              ]
            ],
            "note": "Void Storm rewards stack with the mission's own loot — check the crack-or-sell math on your drops before you dissolve them."
          }
        },
        {
          "type": "p",
          "text": "Two of those are worth planning around: **Void Storms** turn Railjack into a relic farm — run the numbers on your haul with [Relic value: crack or sell](/relics-value) and [which relics pay best per run](/relic-farming). And once you're cracking primes, [the ducat value tool](/ducats) and [set-vs-parts calculator](/comparison) tell you what to keep for Baro and what to flip."
        }
      ]
    },
    {
      "id": "unlocking",
      "title": "Unlocking Railjack: The Rising Tide Quest",
      "blocks": [
        {
          "type": "p",
          "text": "There are two ways into the mode. You can **crew on someone else's ship** immediately — just join a public Railjack squad, and you'll earn Intrinsics and rewards without owning anything. But to build *your own* Railjack, you run the **Rising Tide** quest."
        },
        {
          "type": "steps",
          "ordered": true,
          "steps": [
            {
              "h": "Finish The War Within",
              "p": "Rising Tide is gated behind the cinematic quest The War Within (which follows The Second Dream in the story). If you're not there yet, push through the main story quests first — see the Quests guide for the order."
            },
            {
              "h": "Get access to a Dry Dock",
              "p": "Rising Tide is built at a Dry Dock. You can't build the ship from your orbiter — but a Dry Dock isn't clan-only: build one in a Clan Dojo, or use the public Dry Dock found in several of the larger Relays (such as Saturn and Pluto)."
            },
            {
              "h": "Gather and build the six wreckage components",
              "p": "The quest sends you around the star chart to gather resources, then build the ship's six salvaged sections one at a time at the Dry Dock."
            },
            {
              "h": "Wait out the build timers",
              "p": "Each component and the final assembly carry real-time Foundry-style timers that add up to multiple days. Start the builds as early as you can and let them cook while you play other content."
            },
            {
              "h": "Launch from the Dry Dock",
              "p": "Once the Railjack is assembled it's parked in your Dry Dock. From there (or from the Proxima regions in Navigation) you can start missions and begin ranking Intrinsics."
            }
          ]
        },
        {
          "type": "warn",
          "text": "**No clan? You still have options.** Several of the larger **Relays** (Saturn and Pluto among them) have a public **Dry Dock** you can use with no clan at all. Prefer your own? Founding a one-person clan is free from any Relay's clan console — build the Dry Dock in your dojo (that also unlocks the clan-only Sigma component research), or borrow a friend's / alliance dojo. Don't let \"I'm not in a clan\" stop you."
        },
        {
          "type": "info",
          "text": "New to the mode and unsure it's for you? Several **story missions and public squads hand you a pre-built loaner Railjack**, so you can try flying and gunning before you ever finish Rising Tide. It's a great way to decide whether to invest the build time."
        }
      ]
    },
    {
      "id": "intrinsics",
      "title": "Intrinsics: The Five Schools",
      "blocks": [
        {
          "type": "p",
          "text": "**Intrinsics** are Railjack's personal skill trees — five schools, each ranked **1 to 10**. You earn Intrinsic points automatically from mission affinity, then spend them where you want. Higher ranks are transformative, not incremental: they unlock new maneuvers, faster repairs, and — critically — your AI crew."
        },
        {
          "type": "table",
          "table": {
            "columns": [
              "School",
              "What it governs",
              "Why it matters solo"
            ],
            "rows": [
              [
                "Tactical",
                "The tactical map, teleporting to crew/objectives, and Omni recall back to the ship",
                "Snap instantly back to the pilot seat or to a hull breach instead of running the length of the ship"
              ],
              [
                "Piloting",
                "Boost, vector bursts, and drift dodges for tight, fast repositioning",
                "A nimble ship you can actually juke flak with and reposition fast"
              ],
              [
                "Gunnery",
                "Turret handling — heat management, aim zoom, an aim-snap onto the lead indicator, and the Archwing slingshot",
                "Kill fighters faster, land Forward Artillery shots on crewships, and slingshot aboard them to board"
              ],
              [
                "Engineering",
                "Ship hull health, faster Omni repairs, forge output, and hazard suppression",
                "Survive fires and breaches when nobody's babysitting the hull"
              ],
              [
                "Command",
                "Hire and direct up to 3 AI crew, plus the On Call Crew summon",
                "The single most important school for solo play — your crew flies and fights for you"
              ]
            ]
          }
        },
        {
          "type": "tip",
          "text": "**Solo leveling order:** push **Command** early for crew, then a few ranks of **Gunnery** and **Piloting** to make the ship feel good, and **Engineering** for survivability. Tactical's Omni recall is a huge quality-of-life pickup once you're boarding regularly. You don't need everything at 10 to be effective — the first few ranks of each carry the most weight."
        }
      ]
    },
    {
      "id": "command-crew",
      "title": "Command Crew: The Solo Player's Secret Weapon",
      "blocks": [
        {
          "type": "p",
          "text": "If you take one thing from this page: **rank Command and hire AI crew.** A well-built crew turns a four-person ship into a one-person ship. They pilot, they gun, they repair breaches and fires, and they defend against boarders — all while you focus on whatever you enjoy."
        },
        {
          "type": "steps",
          "ordered": true,
          "steps": [
            {
              "h": "Unlock crew slots with Command",
              "p": "The first rank of Command lets you hire and field a crew member, with more slots and better competence as you climb — the second slot opens a couple of ranks in and the third a couple after that, up to three active AI crew."
            },
            {
              "h": "Recruit from Ticker in Fortuna",
              "p": "Ticker (down in Fortuna, on Venus) sells rotating crew members for resources and Solaris debt-bonds. Each recruit has competency points spread across combat, gunnery, piloting, engineering, repair, and endurance."
            },
            {
              "h": "Assign roles that fit their stats",
              "p": "Every crew member takes a role — Pilot, Gunner, Defender, or Engineer. Match the role to their high stats: a Gunner wants Gunnery + Combat, an Engineer wants Repair + Endurance."
            },
            {
              "h": "Build the classic solo trio",
              "p": "Two Gunners to shred the fighter swarm and one Engineer to keep the ship alive is the reliable default. Swap one Gunner for a Pilot if you'd rather leave the seat and board."
            }
          ]
        },
        {
          "type": "tip",
          "text": "An upper rank of Command unlocks the **On Call Crew** gear item, which lets you summon one of your crew into *regular* (non-Railjack) missions as a temporary ally. A strong reason to keep ranking Command even after your ship runs itself."
        }
      ]
    },
    {
      "id": "solo-build",
      "title": "Building a Solo-Ready Railjack",
      "blocks": [
        {
          "type": "p",
          "text": "Your ship's power comes from two places: the **components** bolted onto the hull (Reactor, Shield, Engines, and armaments) and the **Plexus** — your personal mod board that you carry onto *any* Railjack, including loaners. Components come from three houses — **Zetki** (highest raw stats, but with drawbacks like turret overheat), **Vidar** (balanced, strong bonus perks), and **Lavan** (durable, great handling) — in ascending **MK I–III** tiers."
        },
        {
          "type": "list",
          "items": [
            "**Reactor first.** It sets your Plexus capacity — how many and how strong your mods can be — and scales your Battle abilities. A high-capacity reactor is the single biggest upgrade you can chase.",
            "**Turrets (armaments) next.** Grab MK III guns from a house you like; Zetki hits hardest but overheats, while Vidar and Lavan trade some damage for handling and uptime.",
            "**Forward Artillery is your crewship deleter.** The nose cannon (`Tunguska`) one-shots crewships that would otherwise take forever to chew down — slot the **Forward Artillery** mod so it keeps one-shotting the tankier crewships in the Veil.",
            "**Plexus loadout.** Max turret damage (e.g. Hyperstrike), add a survivability mod for hull health, and slot one **Battle ability that clears fighter swarms** — the crowd-clumping Tether and the homing-missile Seeker Volley are the long-standing favorites.",
            "**Engines and Shields are lower priority.** Handling and shield recharge are nice, but they come after a solid reactor, guns, and Forward Artillery."
          ]
        },
        {
          "type": "warn",
          "text": "**Don't be the host everyone dreads.** The most common complaint about pub Railjack is people who never built or modded their ship, then host on high-level nodes. If you're going to host, spend an hour on your Plexus and Forward Artillery first — a modded ship is night and day, and your squad will notice."
        }
      ]
    },
    {
      "id": "solo-game-plan",
      "title": "A Solo Mission Game Plan",
      "blocks": [
        {
          "type": "p",
          "text": "With a crew aboard and Forward Artillery ready, a solo Railjack mission has a clean rhythm. The loop is: thin the swarm, delete the crewships, do the objective, extract."
        },
        {
          "type": "steps",
          "ordered": true,
          "steps": [
            {
              "h": "Let the swarm come to your turrets",
              "p": "Fighters cluster when they chase you. Let your Gunners and turrets work, and drop a Battle ability like Tether to bunch and delete a pack at once."
            },
            {
              "h": "Delete crewships with Forward Artillery",
              "p": "Line up the nose cannon and one-shot each crewship. Alternatively, board it via Archwing or the slingshot and blow its reactor from inside — either removes the biggest threat to your hull."
            },
            {
              "h": "Board the objective on foot",
              "p": "Most missions require you to enter an enemy capital ship or base — destroy radiators, hack a console, or defend a point. This is normal Warframe combat; bring a frame and weapons you trust."
            },
            {
              "h": "Patch and recall as needed",
              "p": "If the ship takes a breach or fire while you're away, your Engineer usually handles it — but Tactical's Omni recall snaps you home instantly if things get spicy."
            },
            {
              "h": "Finish and extract",
              "p": "Once the objective completes, mop up any stragglers and leave. Void Storm runs also crack your equipped relic here — pick your reward before you go."
            }
          ]
        },
        {
          "type": "warn",
          "text": "**Forward Artillery is clunky solo — by design.** The pilot can't fire the nose cannon; you have to leave the seat, and the ship stops maneuvering while you aim it. This is the number-one thing veterans wish new solo pilots knew. **Assign a crew member as Pilot** so the ship keeps dodging while you fire, or clear the immediate area first so you're not sitting still under flak."
        }
      ]
    },
    {
      "id": "where-next",
      "title": "Where Railjack Fits In Your Endgame",
      "blocks": [
        {
          "type": "p",
          "text": "Once your ship runs itself, Railjack becomes a tool rather than a chore. Use **Void Storms** as a relic farm and price your haul with [crack-or-sell](/relics-value) and [relic farming per run](/relic-farming). Hunt **Sisters of Parvos** through the [Kuva & Liches guide](/guides/kuva). And when you want to see exactly where a Proxima drop or resource comes from, the [3D star chart drop map](/star-chart-3d) plots it for you."
        },
        {
          "type": "p",
          "text": "For the rest of the endgame web — [Steel Path](/guides/steel-path), [Duviri](/guides/duviri) (which has its own Intrinsics to compare), [Arcanes](/guides/arcanes), and [Archon Shards](/guides/archon-shards) — the sibling guides pick up where this one leaves off. And if you'd rather watch a build come together, the [creators directory](/creators) and the videos below are the best next click."
        },
        {
          "type": "links",
          "links": [
            {
              "label": "Relic value: crack or sell",
              "href": "/relics-value",
              "icon": "diamond-stone",
              "note": "Price your Void Storm haul"
            },
            {
              "label": "Kuva & Liches guide",
              "href": "/guides/kuva",
              "icon": "skull",
              "note": "Sisters of Parvos are Railjack-gated"
            },
            {
              "label": "3D drop-location map",
              "href": "/star-chart-3d",
              "icon": "map-marker-path",
              "note": "Find any Proxima drop"
            },
            {
              "label": "Community tools directory",
              "href": "/tools",
              "icon": "toolbox",
              "note": "Wiki, Overframe & more"
            }
          ]
        }
      ]
    }
  ],
  "faqs": [
    {
      "q": "How do I unlock Railjack in Warframe?",
      "a": "Build your own by completing the **Rising Tide** quest, which requires you to have finished **The War Within** (the cinematic quest after The Second Dream) and to have access to a **Dry Dock**. Dry Docks aren't clan-only — several of the larger **Relays** (such as Saturn and Pluto) have a public one, or you can found a free solo clan and build your own. If you'd rather not build a ship at all, join a public Railjack squad and crew on someone else's ship immediately — you'll still earn Intrinsics and rewards."
    },
    {
      "q": "Can you play Railjack solo?",
      "a": "Yes, and it's genuinely comfortable once you rank the **Command** Intrinsic and hire AI crew. Three competent crew members will pilot, gun, and repair the ship for you while you focus on flying or boarding. It's the difference between Railjack feeling like a four-person job and a one-person job."
    },
    {
      "q": "Do I need a clan to get a Railjack?",
      "a": "Not necessarily. You build and service the Railjack at a **Dry Dock**, and while you can't do it from your orbiter, Dry Docks aren't clan-only: several of the larger **Relays** (such as Saturn and Pluto) have a public Dry Dock any solo player can use. If you'd rather have your own, founding a one-person clan is free from any Relay's clan console and lets you build a Dry Dock in your dojo — which also unlocks the clan-only Sigma component research."
    },
    {
      "q": "Which Railjack Intrinsic should I level first?",
      "a": "**Command**, for AI crew — it does the most to make the mode playable solo. After that, a few ranks of **Gunnery** and **Piloting** to make the ship feel responsive, and **Engineering** for survivability. You don't need any school maxed to 10 to be effective; the early ranks carry the most value."
    },
    {
      "q": "How do you get AI crew members in Railjack?",
      "a": "Rank the **Command** Intrinsic to unlock crew slots, then recruit crew from **Ticker** in Fortuna (on Venus) using resources and Solaris debt-bonds. Assign each one a role — Pilot, Gunner, Defender, or Engineer — that matches their competency stats. A common solo setup is two Gunners and one Engineer."
    },
    {
      "q": "How do you kill crewships in Railjack?",
      "a": "Use **Forward Artillery** — the ship's nose cannon (Tunguska), which one-shots crewships; slot the **Forward Artillery** mod to keep punching through the tankier crewships in the Veil. Alternatively, board the crewship via Archwing or the slingshot and destroy its reactor from the inside. Note that the pilot can't fire the artillery solo, so assign a crew member as Pilot or park the ship to aim."
    },
    {
      "q": "Is Railjack worth doing?",
      "a": "For most players, yes. It's a strong affinity and resource source, it's the **only** way to hunt Sisters of Parvos, and its **Void Storm** missions crack relics for extra prime parts and Void Traces. Several quests also require it. Once your ship and crew are built, it becomes a fast, mostly automated way to farm."
    },
    {
      "q": "What are the best Railjack components to use?",
      "a": "Aim for **MK III** components and prioritize a **high-capacity Reactor**, since it determines how strong your Plexus mods can be. For turrets, **Zetki** hits hardest (but overheats), while **Vidar** and **Lavan** trade damage for handling and durability — pick to taste. Exact meta rolls shift with patches, so check a recent build video or the [wiki](https://wiki.warframe.com/) before grinding for a specific god-roll."
    }
  ],
  "videos": [
    {
      "id": "MLyf9D2GcpI",
      "title": "Warframe Beginner's Guide 2025: Episode #5: The Second Dream Quest & Unlocking RailJack!",
      "channel": "iFlynn"
    },
    {
      "id": "G_ou9naTX50",
      "title": "The ULTIMATE Warframe RAILJACK Guide 2026!",
      "channel": "MHBlacky"
    },
    {
      "id": "xnLTTLJn5iw",
      "title": "Warframe: Solo Railjack Build Guide",
      "channel": "Jacsonitos"
    },
    {
      "id": "AMKACvK4ZXQ",
      "title": "The Ultimate Railjack Build Guide (Warframe)",
      "channel": "Hunkpain Gaming "
    }
  ],
  "sources": [
    {
      "label": "Current state of Railjack: fast guide (r/Warframe)",
      "href": "https://reddit.com/r/Warframe/comments/ea2af8/current_state_of_railjack_fast_guide_for_people/"
    },
    {
      "label": "9 Days: Railjack — the Journey, the Meta, a FAQ (r/Warframe)",
      "href": "https://reddit.com/r/Warframe/comments/eed3eu/9_days_railjack_the_journey_the_meta_a_faq/"
    },
    {
      "label": "Watch a guide before you host your Railjack (r/Warframe)",
      "href": "https://reddit.com/r/Warframe/comments/1u94eva/i_dont_usually_like_to_flame_people_in_warframe/"
    },
    {
      "label": "Warframe Wiki",
      "href": "https://wiki.warframe.com/"
    }
  ],
  "related": [
    {
      "label": "Kuva & Liches",
      "to": "/guides/kuva",
      "icon": "skull",
      "note": "Sisters of Parvos are hunted through Railjack"
    },
    {
      "label": "Relics & Void Fissures",
      "to": "/guides/relics",
      "icon": "diamond-stone",
      "note": "Void Storms are the Railjack way to crack relics"
    },
    {
      "label": "Steel Path",
      "to": "/guides/steel-path",
      "icon": "chevron-triple-up",
      "note": "The other endgame grind"
    },
    {
      "label": "Duviri",
      "to": "/guides/duviri",
      "icon": "sword-cross",
      "note": "Has its own Intrinsics system"
    },
    {
      "label": "Relic value tool",
      "to": "/relics-value",
      "icon": "cash-multiple",
      "note": "Crack or sell your Void Storm drops"
    },
    {
      "label": "Community tools",
      "to": "/tools",
      "icon": "toolbox",
      "note": "Wiki, Overframe & DE tools"
    }
  ],
  "updated": "2026-07-18"
}

export default guide
