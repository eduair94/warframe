// Railjack mechanics reviewed against Digital Extremes sources on 2026-11-05.
// English source for /guides/railjack; localized snapshots preserve this structure.
import type { Guide } from './types'

const guide: Guide = {
  "slug": "railjack",
  "eyebrow": "Knowledge Center · Railjack",
  "title": "Railjack Guide",
  "lede": "Build your Railjack through Rising Tide, choose useful Intrinsics, recruit AI crew and prepare your ship for solo missions. This guide also covers Void Storms, Uranus Proxima and Steel Path rewards.",
  "category": "endgame",
  "readMins": 10,
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
      "label": "Steel Essence per completed Steel Path Railjack mission"
    }
  ],
  "sections": [
    {
      "id": "what-is-railjack",
      "title": "What Railjack Actually Is",
      "blocks": [
        {
          "type": "p",
          "text": "Railjack combines **space combat** with missions aboard enemy ships and bases. Up to four players can share the work: piloting, firing turrets, managing repairs and completing on-foot objectives."
        },
        {
          "type": "p",
          "text": "In ordinary Proxima missions, you can move between the ship, Archwing and on-foot objectives. Railjack launched with **Empyrean**; the later Corpus rework introduced **Command** crew and the personal **Plexus**. The Uranus missions described below have their own restrictions."
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
              "v": "Grineer and Corpus Proxima missions, plus the later Uranus Proxima missions"
            },
            {
              "k": "Prerequisite",
              "v": "Complete The Second Dream, then build your ship through Rising Tide"
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
          "text": "Choose a Railjack mission for a specific goal: story progress, equipment, relic opening or a later challenge. Different mission types offer different rewards."
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
                "Earn Affinity through combat and objectives to progress your Intrinsics while playing."
              ],
              [
                "Resources",
                "Collect resources and equipment wreckage for Railjack repairs and upgrades."
              ],
              [
                "Sisters of Parvos",
                "The final confrontation with a Sister takes place in Railjack after the Requiem sequence. See the Kuva & Liches guide."
              ],
              [
                "Void Storms",
                "Open an equipped relic by collecting enough Reactant and completing the mission. Relic rewards are separate from the Void Storm mission reward."
              ],
              [
                "Quests & story",
                "Rising Tide, Call of the Tempestarii, and later story beats all put you in the pilot seat."
              ],
              [
                "Mastery & variety",
                "Rank the Plexus for Mastery and develop your Railjack skills through Intrinsics."
              ]
            ],
            "note": "Compare relic values before opening them, and check any earned Prime parts before trading them or exchanging them for Ducats."
          }
        },
        {
          "type": "p",
          "text": "For **Void Storms**, compare an unopened relic with its possible rewards using [Relic value: crack or sell](/relics-value) and [relic value per opening](/relic-farming). After opening it, use [the ducat value tool](/ducats) and [the set-vs-parts calculator](/comparison) to compare your options. Prices are estimates, not guaranteed sale proceeds."
        }
      ]
    },
    {
      "id": "unlocking",
      "title": "Unlocking Railjack: The Rising Tide Quest",
      "blocks": [
        {
          "type": "p",
          "text": "After completing **The Archwing**, you can join another player’s Railjack crew without owning a ship. To build your own Railjack, follow **Rising Tide** after **The Second Dream**."
        },
        {
          "type": "steps",
          "ordered": true,
          "steps": [
            {
              "h": "Finish The Second Dream",
              "p": "Rising Tide becomes available after The Second Dream. Craft the Railjack Cephalon blueprint delivered to your Inbox, then follow the quest to a Dry Dock."
            },
            {
              "h": "Get access to a Dry Dock",
              "p": "Use a Clan Dojo Dry Dock or a public one at Kronia Relay on Saturn or Orcus Relay on Pluto. You do not need a clan to build your Railjack."
            },
            {
              "h": "Recover and repair the ship sections",
              "p": "Defend the scanning beacons, deal with interference, and return each recovered section to the Dry Dock. Deposit the resources Cephalon Cy requests to repair it."
            },
            {
              "h": "Complete the repairs and power the ship",
              "p": "Rising Tide now uses short repair timers instead of the old multi-day wait. After assembly, follow Cy’s final mission to Lua and install the power source."
            },
            {
              "h": "Launch from the Dry Dock",
              "p": "Once the Railjack is assembled it's parked in your Dry Dock. From there (or from the Proxima regions in Navigation) you can start missions and begin ranking Intrinsics."
            }
          ]
        },
        {
          "type": "warn",
          "text": "**No clan required.** The public Dry Docks at Saturn’s Kronia Relay and Pluto’s Orcus Relay provide an alternative to a Clan Dojo. Use whichever you can access."
        },
        {
          "type": "info",
          "text": "**Trying Railjack before building it:** join another player’s crew after The Archwing. The special ships used in Uranus Proxima are a later option unlocked through Jade Shadows: Constellations."
        }
      ]
    },
    {
      "id": "intrinsics",
      "title": "Intrinsics: The Five Schools",
      "blocks": [
        {
          "type": "p",
          "text": "**Intrinsics** are five personal Railjack skill schools with **10 ranks** each. Earn points from mission Affinity, then spend them to unlock movement, combat, repair and crew abilities."
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
                "Tactical map, fast travel aboard the ship, and Omni recall",
                "Tactical 3 unlocks onboard fast travel; Tactical 4 lets the Omni recall you from outside"
              ],
              [
                "Piloting",
                "Boost, vector bursts, and drift dodges for tight, fast repositioning",
                "A nimble ship you can actually juke flak with and reposition fast"
              ],
              [
                "Gunnery",
                "Turret targeting, heat management and the Archwing Slingshot",
                "Improve turret handling and unlock the Slingshot at Gunnery 3 for missions that allow Archwing"
              ],
              [
                "Engineering",
                "Omni repairs, hazard suppression, and Forge supplies",
                "Survive fires and breaches when nobody's babysitting the hull"
              ],
              [
                "Command",
                "Hire and direct up to 3 AI crew, plus the On Call Crew summon",
                "Useful early for solo play: recruit crew to share ship duties"
              ]
            ]
          }
        },
        {
          "type": "tip",
          "text": "**Suggested solo priorities:** start with **Command** for crew, then pick **Gunnery**, **Piloting** and **Engineering** perks that address the problems you encounter. **Tactical 4** is useful when you regularly leave the ship. This is a starting plan, not a required leveling order."
        }
      ]
    },
    {
      "id": "command-crew",
      "title": "Command Crew: The Solo Player's Secret Weapon",
      "blocks": [
        {
          "type": "p",
          "text": "AI crew can pilot, use turrets, repair the ship and fight boarders. Assign roles for the mission, equip suitable weapons and monitor their condition while you handle the remaining objectives."
        },
        {
          "type": "steps",
          "ordered": true,
          "steps": [
            {
              "h": "Unlock crew slots with Command",
              "p": "Command ranks 1, 3 and 5 unlock your first, second and third active crew slots. AI crew fills places not occupied by other players."
            },
            {
              "h": "Recruit from Ticker in Fortuna",
              "p": "Visit Ticker in Fortuna and check the current recruitment offers. Recruits have five competencies: Piloting, Gunnery, Repair, Combat and Endurance."
            },
            {
              "h": "Assign roles that fit their stats",
              "p": "Choose Pilot, Gunner, Defender or Engineer. Prioritize Gunnery for turret duty, Repair for engineering, and Combat for fighting boarders; Endurance helps a crewmate survive."
            },
            {
              "h": "Build the classic solo trio",
              "p": "For a starting solo setup, try two Gunners and one Engineer while you pilot. Reassign a role through the Tactical Menu when you need someone else at the helm."
            }
          ]
        },
        {
          "type": "tip",
          "text": "**Command 9** unlocks On Call Crew for temporary support in eligible non-Railjack missions. **Command 10** unlocks Elite Crew recruitment."
        },
        {
          "type": "info",
          "text": "After unlocking Pontis Tower, its secret vendor offers **Vena**, **Ryoku**, **Latrox Une** and **Jarka Lar** for your personal crew. Check the Talent currency required by each offer. Recruiting them requires **Command 10**."
        }
      ]
    },
    {
      "id": "solo-build",
      "title": "Building a Solo-Ready Railjack",
      "blocks": [
        {
          "type": "p",
          "text": "Separate ship equipment from your **Plexus**. The ship has a Shield Array, Engines, Plating, a Reactor and armaments; the Plexus is your personal mod setup for ordinary Railjack missions. Compare each component’s stats and traits instead of assuming one manufacturer is best at everything."
        },
        {
          "type": "list",
          "items": [
            "**Reactor:** choose Battle ability Strength, Range or Duration bonuses for the abilities you use. The ship’s Reactor does not set Plexus mod capacity.",
            "**Armaments:** compare damage, heat and handling, then work toward suitable MK III equipment. Test the guns before committing resources to upgrades.",
            "**Forward Artillery:** use the Tunguska cannon against crewships. Keep Dome Charges available and adjust your damage setup if a target survives; a single-shot kill is not guaranteed.",
            "**Plating and Plexus:** Plating supplies hull health and armor. Use your Plexus for compatible Integrated, Battle and Tactical mods; choose abilities you can use reliably.",
            "**Shields and Engines:** review their stats and unique traits alongside the rest of the ship. Update 43 changed several component traits, so old house rankings may no longer fit your build."
          ]
        },
        {
          "type": "warn",
          "text": "**Before hosting a harder node,** check your components, Plexus, crew roles and Forge supplies. Try the setup on a normal mission before taking it into Steel Path."
        }
      ]
    },
    {
      "id": "solo-game-plan",
      "title": "A Solo Mission Game Plan",
      "blocks": [
        {
          "type": "p",
          "text": "For a typical Skirmish, deal with fighters and crewships, complete the marked objectives and keep the Railjack operational. Other mission types have different requirements, so follow the current objective list."
        },
        {
          "type": "steps",
          "ordered": true,
          "steps": [
            {
              "h": "Let the swarm come to your turrets",
              "p": "Use your turrets and chosen Battle abilities to control nearby fighters. Keep moving when needed and check that your Gunners are assigned to their intended roles."
            },
            {
              "h": "Deal with crewships",
              "p": "Use Forward Artillery and keep Dome Charges available. Where Archwing boarding is allowed, entering a crewship and sabotaging its reactor is another option. Do not assume every artillery shot will destroy its target."
            },
            {
              "h": "Board the objective on foot",
              "p": "Follow the marked objectives, which may take you into a capital ship or base. Bring a Warframe and weapons suited to the listed mission type, rather than preparing only for ship combat."
            },
            {
              "h": "Patch and recall as needed",
              "p": "Watch the ship’s condition even with an Engineer assigned. Tactical 4 unlocks Omni recall from outside the ship; allow time for the return rather than treating it as instant."
            },
            {
              "h": "Finish and extract",
              "p": "Complete the required objectives and confirm the mission rewards before starting another run. In a Void Storm, your relic reward requires an equipped relic and enough Reactant."
            }
          ]
        },
        {
          "type": "warn",
          "text": "**Forward Artillery uses a separate station from the helm.** You can operate it solo by leaving the pilot seat. Choose a safe moment, or reassign a crew member to Pilot; crew movement is not a guarantee of safety or a clear shot."
        }
      ]
    },
    {
      "id": "where-next",
      "title": "Where Railjack Fits In Your Endgame",
      "blocks": [
        {
          "type": "p",
          "text": "Use **Void Storms** to open relics, then compare values with [crack-or-sell](/relics-value) and [relic value per opening](/relic-farming). Follow the [Kuva & Liches guide](/guides/kuva) for adversary finales, or explore the rewards covered by the [3D star chart drop map](/star-chart-3d)."
        },
        {
          "type": "p",
          "text": "Continue with [Steel Path](/guides/steel-path), [Duviri](/guides/duviri), [Arcanes](/guides/arcanes) or [Archon Shards](/guides/archon-shards). The [creators directory](/creators) and videos below offer demonstrations, but older videos may show obsolete Avionics, construction timers or pre-Update 43 rules; use the current mechanics in this guide when they differ."
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
              "note": "Explore mapped Proxima rewards"
            },
            {
              "label": "Community tools directory",
              "href": "/tools",
              "icon": "toolbox",
              "note": "Wiki, Overframe & more"
            }
          ]
        },
        {
          "type": "info",
          "text": "**Uranus Proxima:** complete **Jade Shadows: Constellations** to unlock **Scoria’s Angel**, **The Kuva Wytch** and **Pontis Tower**. Squads use Vena or Ryoku’s equipped ships. To use your own ship, set matchmaking to **Solo** before entering Pontis Tower, choose your personal Railjack at the dock console, then begin the mission aboard it. Starting directly from Navigation still selects the special ship. **Archwing is disabled** in these two missions."
        },
        {
          "type": "info",
          "text": "**Steel Path Railjack:** unlock the base Steel Path and complete a Railjack node on normal difficulty to access its Steel Path version. Enemies gain **50 levels**; the usual Steel Path Mod Drop Chance bonus does not apply. Completed missions award **2 Steel Essence**, replacing the original Eximus drops. Completing the required Railjack Steel Path nodes also awards a trophy and **50 Steel Essence**; Free Flight, adversary finales and the two Uranus missions are excluded from that trophy requirement."
        }
      ]
    }
  ],
  "faqs": [
    {
      "q": "How do I unlock Railjack in Warframe?",
      "a": "Complete **The Second Dream**, craft the Railjack Cephalon from your Inbox blueprint, and follow **Rising Tide** at a **Dry Dock**. Public Dry Docks are available at Kronia Relay on Saturn and Orcus Relay on Pluto. You can also join another player’s crew after completing **The Archwing**, without owning a Railjack."
    },
    {
      "q": "Can you play Railjack solo?",
      "a": "Yes. **Command** unlocks up to three AI crew slots, letting crew share piloting, gunnery, repairs and defense. Assign their roles and handle the remaining objectives yourself; a crew does not make every mission automatic."
    },
    {
      "q": "Do I need a clan to get a Railjack?",
      "a": "No. Use the public **Dry Dock** at Kronia Relay on Saturn or Orcus Relay on Pluto to build and configure your Railjack. A Clan Dojo Dry Dock is another option."
    },
    {
      "q": "Which Railjack Intrinsic should I level first?",
      "a": "For a solo starting plan, prioritize **Command** to recruit crew. Then choose **Gunnery**, **Piloting** and **Engineering** perks to address your needs. **Tactical 4** unlocks Omni recall. There is no single required leveling order."
    },
    {
      "q": "How do you get AI crew members in Railjack?",
      "a": "Unlock crew slots at **Command 1, 3 and 5**, then visit **Ticker** in Fortuna to recruit. Assign Pilot, Gunner, Defender or Engineer roles to suit their competencies. For solo play, two Gunners and one Engineer is one starting option while you pilot."
    },
    {
      "q": "How do you kill crewships in Railjack?",
      "a": "Use the **Forward Artillery** station and its Dome Charges, or board and sabotage the reactor where Archwing access is allowed. You can fire artillery solo after leaving the helm. Damage and the target’s defenses matter, so do not rely on a universal one-shot kill."
    },
    {
      "q": "Is Railjack worth doing?",
      "a": "It is useful for story progression, ship upgrades, **Void Storm** relic opening and adversary finales. Later, **Uranus Proxima** adds its own missions and rewards, while completed **Steel Path Railjack** missions award **2 Steel Essence**. Choose the activity that matches what you need."
    },
    {
      "q": "What are the best Railjack components to use?",
      "a": "Compare **MK III** components by their actual stats and traits. A **Reactor** boosts Battle ability stats; it does not increase Plexus capacity. **Plating** supplies hull health and armor. Update 43 changed several component traits, so check the current values instead of relying on an old manufacturer ranking."
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
      "label": "The Second Dream — official quest guide",
      "href": "https://www.warframe.com/en/guides/quests/the-second-dream"
    },
    {
      "label": "Rising Tide — official quest guide",
      "href": "https://www.warframe.com/en/guides/quests/rising-tide"
    },
    {
      "label": "Update 29.10: Corpus Proxima & The New Railjack",
      "href": "https://forums.warframe.com/topic/1253565-update-29100-corpus-proxima-the-new-railjack/"
    },
    {
      "label": "Update 30.9: Rising Tide crafting-time reduction",
      "href": "https://www.warframe.com/en/patch-notes/pc/30-9-0"
    },
    {
      "label": "Warframe: Empyrean — joining a crew",
      "href": "https://www.warframe.com/en/news/warframe-empyrean-2"
    },
    {
      "label": "Update 30: Call of the Tempestarii and Void Storms",
      "href": "https://www.warframe.com/en/patch-notes/pc/30-0-0"
    },
    {
      "label": "Update 30.5: Sisters of Parvos and Elite Crew",
      "href": "https://www.warframe.com/en/patch-notes/pc/30-5-0"
    },
    {
      "label": "Update 43: Jade Shadows: Constellations",
      "href": "https://www.warframe.com/en/patch-notes/pc/43-0-0"
    },
    {
      "label": "Hotfix 43.0.6: Steel Path Railjack rewards",
      "href": "https://www.warframe.com/en/patch-notes/pc/43-0-6"
    },
    {
      "label": "Railjack — official support guide",
      "href": "https://support.warframe.com/hc/en-us/articles/38820115630093-Railjack"
    },
    {
      "label": "Hotfix 30.9.4: Rising Tide timer correction",
      "href": "https://www.warframe.com/en/patch-notes/pc/30-9-4"
    },
    {
      "label": "Update44: Iceblade of Narin — Railjack fixes",
      "href": "https://www.warframe.com/en/patch-notes/pc/44-0-0"
    }
  ],
  "related": [
    {
      "label": "Kuva & Liches",
      "to": "/guides/kuva",
      "icon": "skull",
      "note": "Finish adversary hunts through Railjack"
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
      "note": "Railjack also has Steel Path missions"
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
  "updated": "2026-11-05"
}

export default guide
