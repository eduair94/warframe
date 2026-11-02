// Steel Path mechanics reviewed against Digital Extremes updates on 2026-11-02.
// English source for /guides/steel-path; localized snapshots preserve this structure.
import type { Guide } from './types'

const guide: Guide = {
  "slug": "steel-path",
  "eyebrow": "Knowledge Center · Steel Path",
  "title": "Steel Path & Steel Essence",
  "lede": "The Steel Path replays Warframe's Star Chart with tougher enemies and rewards such as Steel Essence and weapon Arcanes. Learn which missions you must clear to unlock it, how to survive your first runs, and where Essence, Teshin's shop and Circuit rewards fit together.",
  "category": "endgame",
  "readMins": 9,
  "stats": [
    {
      "num": "+100",
      "label": "levels on standard missions",
      "tone": "gold"
    },
    {
      "num": "+150%",
      "label": "standard enemy health & shields",
      "tone": "alt"
    },
    {
      "num": "Free",
      "label": "unlock after required nodes",
      "tone": "good"
    },
    {
      "num": "6",
      "label": "daily Incursions",
      "tone": "gold"
    }
  ],
  "sections": [
    {
      "id": "what-it-is",
      "title": "What the Steel Path actually is",
      "blocks": [
        {
          "type": "p",
          "text": "The **Steel Path** is an optional harder version of the Star Chart with its own completion track. Standard missions add **100 enemy levels** and **150% health and shields** to level-scaled enemies. It no longer adds an armor multiplier. Archwing and Railjack use different modifiers, so check the mission type before comparing difficulty."
        },
        {
          "type": "p",
          "text": "It is **100% optional endgame content**. Nothing in the main story requires it, and you should treat it as a reason to keep playing after the star chart — not a wall you have to climb to progress. It is best thought of as the place your fully-built gear finally gets to flex."
        },
        {
          "type": "kv",
          "kv": [
            {
              "k": "Unlocks at",
              "v": "Required normal Star Chart nodes and Junctions through the pre-New-War chart"
            },
            {
              "k": "Turned on by",
              "v": "Talking to Teshin in any Relay, then a Star Chart toggle"
            },
            {
              "k": "Main currency",
              "v": "Steel Essence → Teshin's Steel Path Honors shop"
            },
            {
              "k": "Difficulty",
              "v": "+100 levels in standard missions; separate Archwing and Railjack rules"
            },
            {
              "k": "Reward headline",
              "v": "Steel Essence, weapon Arcanes, region trophies and Circuit reward tracks"
            }
          ]
        },
        {
          "type": "info",
          "title": "New Game Plus, not a new star chart",
          "text": "Normal and Steel Path node completion are tracked separately. Ordinary missions reuse their locations and objectives, but harder variants can add threats such as Acolytes. Duviri and Railjack have additional access rules and reward systems; they are not identical copies of standard Star Chart missions."
        }
      ]
    },
    {
      "id": "how-to-unlock",
      "title": "How to unlock the Steel Path",
      "blocks": [
        {
          "type": "steps",
          "ordered": true,
          "steps": [
            {
              "h": "Clear the required normal Star Chart nodes",
              "p": "Complete the required normal mission nodes and Junctions through the pre-New-War Star Chart. Since Hotfix 38.5.3, **Zariman Ten Zero, Albrecht's Laboratories and Höllvania are not required** for the base Steel Path unlock. Finish outstanding required nodes before visiting Teshin; newer regions still have their own quest requirements."
            },
            {
              "h": "Visit Teshin in a Relay",
              "p": "When the required nodes are complete, visit Teshin in any Relay and choose the Steel Path dialogue. Unlocking the mode costs no Steel Essence or Platinum."
            },
            {
              "h": "Flip the Star Chart toggle",
              "p": "Open Navigation and use the Steel Path toggle to switch between Normal and Steel Path. You can return to Normal whenever you want; unlocking the harder mode does not replace your original Star Chart."
            },
            {
              "h": "Grind the planets for Teshin's Honors",
              "p": "Clearing each planet's Steel Path nodes grants a one-time reward from Teshin — a lump of Steel Essence plus a decoration and emote. Stacking those Essence payouts across every planet is a solid early goal in its own right, and it funds your first big shop purchases."
            }
          ]
        },
        {
          "type": "tip",
          "title": "Struggling with a Steel Path Junction?",
          "text": "Steel Path Junction Specters are stronger, but you do not need to repeat their normal Junction tasks. Bring a defensive build you understand, test its energy and recovery tools, and adjust your damage setup if the Specter survives your attacks."
        },
        {
          "type": "warn",
          "title": "Base Steel Path and Duviri unlocks are separate",
          "text": "The base unlock does not automatically open every harder activity. The [Duviri guide](/guides/duviri) explains its additional completion requirements and the [Circuit tracker](/circuit) shows the current weekly choices. You can continue using Normal missions while preparing your builds."
        }
      ]
    },
    {
      "id": "the-stat-wall",
      "title": "Why enemies feel completely different",
      "blocks": [
        {
          "type": "p",
          "text": "Higher levels and increased health and shields make a weak damage setup much more noticeable. Armor still reduces damage to armored enemies, but its scaling is capped and partial removal is useful. Eximus add a separate **Overguard** layer, so prepare both a way to survive and a way to damage that layer."
        },
        {
          "type": "table",
          "table": {
            "columns": [
              "What changes",
              "In the Steel Path"
            ],
            "rows": [
              [
                "Enemy level",
                "+100 in standard missions; +50 in Archwing and Railjack"
              ],
              [
                "Health & shields",
                "Standard missions: +150% health and shields (2.5 times the level-scaled values). Archwing does not receive this extra durability multiplier."
              ],
              [
                "Shield bypass",
                "Toxin bypasses ordinary shields; Slash status damages shields rather than bypassing them. Neither is a shortcut through active Overguard."
              ],
              [
                "Eximus units",
                "Much deadlier and carry Overguard — a health layer that shrugs off crowd control until it's broken"
              ],
              [
                "Rewards",
                "Steel Essence drops, richer resource yields, and per-planet Teshin Honors"
              ]
            ],
            "note": "Steel Path no longer adds armor. Enemy armor is capped at 2,700 (90% damage reduction); reducing some armor can still help. Railjack also lacks the standard Steel Path mod-drop bonus."
          }
        },
        {
          "type": "info",
          "title": "Overguard breaks the old CC meta",
          "text": "Active Overguard protects Eximus from most crowd-control effects. Break it with damage before relying on stuns or holds. Magnetic status can increase damage to Overguard; armor removal helps against the armor underneath but does not remove the Overguard layer."
        }
      ]
    },
    {
      "id": "steel-essence",
      "title": "Steel Essence: the endgame currency",
      "blocks": [
        {
          "type": "p",
          "text": "**Steel Essence** is the currency for Teshin's Steel Path Honors. Some sources award it at mission completion; Acolytes drop it as a pickup. That distinction matters because pickup multipliers do not increase fixed mission rewards."
        },
        {
          "type": "p",
          "text": "Start with these sources:"
        },
        {
          "type": "list",
          "items": [
            "**Acolytes** — defeat these minibosses in eligible Steel Path missions for **2 Steel Essence** before pickup bonuses, plus a weapon Arcane. Stay active and collect the drop promptly; the old Acolyte event mods are not this reward.",
            "**Steel Path Void Fissures** — opening a Relic awards **1 extra Steel Essence**. In eligible missions, this can accompany Acolyte pickups while you earn Prime rewards.",
            "**Daily Incursions** — **6** are selected each day, each awarding **5 Steel Essence** on completion. Five use the earlier Star Chart; the sixth is on Zariman or Albrecht's Laboratories and requires access to that region."
          ]
        },
        {
          "type": "tip",
          "title": "Multiply your pickups",
          "text": "A Resource Booster increases eligible Steel Essence pickups. Beast companions can equip **Resourceful Retriever** for a chance to double resources; **Smeeta Charm no longer doubles them**. These effects do not multiply an Incursion's fixed reward. Pick up Essence before it despawns instead of waiting for a pet buff."
        }
      ]
    },
    {
      "id": "teshin-shop",
      "title": "Teshin's Steel Path Honors shop",
      "blocks": [
        {
          "type": "p",
          "text": "Visit Teshin's **Steel Path Honors** in a Relay to spend Steel Essence. His regular offers and weekly rotating item are separate. Check the current stock before saving for a specific reward; **Incarnon Genesis adapters come from the Steel Path Circuit, not this shop**."
        },
        {
          "type": "table",
          "table": {
            "columns": [
              "Reward",
              "Why it matters"
            ],
            "rows": [
              [
                "Umbra Forma Blueprint (rotating stock)",
                "Adds an Umbra polarity for builds that use Umbral mods. Available when its turn appears in the rotating stock."
              ],
              [
                "Riven Mods (rotating stock)",
                "The rotating item can be a Riven Mod. Check which weapon category is offered before spending."
              ],
              [
                "Kuva",
                "Buy Kuva bundles to fuel Riven rerolls without grinding Kuva Survival — pairs with the Kuva guide."
              ],
              [
                "Veiled Riven Cipher",
                "Completes one Veiled Riven challenge. It does not let you choose the weapon or guarantee valuable stats."
              ],
              [
                "Primary and Secondary Arcane Adapters",
                "Unlock the Arcane slot on a compatible primary or secondary. Melee Arcane Adapters use separate sources after Whispers in the Walls."
              ],
              [
                "Prestige cosmetics",
                "Decorations, armor and other cosmetics provide optional goals after your practical upgrades."
              ]
            ],
            "note": "Confirm current prices, weekly stock and purchase limits in-game. Circuit Incarnon choices follow a different reward track."
          }
        },
        {
          "type": "p",
          "text": "Kuva supports [Riven cycling](/guides/riven); compare a roll with the [Riven Value estimator](/riven-value) before investing more. For Incarnon Genesis adapters, use the [Circuit tracker](/circuit) and [Duviri guide](/guides/duviri): your selected adapters are earned at tiers 5 and 10, then installed through Cavalero with the required resources."
        }
      ]
    },
    {
      "id": "best-farm",
      "title": "Farming Steel Essence efficiently",
      "blocks": [
        {
          "type": "p",
          "text": "Choose a run around the reward you need and the time you have. This practical order keeps guaranteed rewards visible without promising one universal fastest farm:"
        },
        {
          "type": "steps",
          "ordered": true,
          "steps": [
            {
              "h": "Do the daily Incursions first",
              "p": "Check the day's Incursions and pick missions your build can complete reliably. Each gives 5 Essence once; finishing more slowly in a difficult mission can erase the advantage of a fixed reward."
            },
            {
              "h": "Combine rewards in an eligible endless mission",
              "p": "An endless Steel Path mission can provide repeated Acolyte encounters. If a suitable Void Fissure is active, bring Relics for its extra Essence and Prime rewards. Keep killing enemies, maintain the objective and extract when your damage or defenses stop being reliable."
            },
            {
              "h": "Build for reliable kills and survival",
              "p": "Choose equipment that handles the objective and Acolytes comfortably. Add a Beast with Resourceful Retriever if you want a chance at extra pickups. Do not build the run around old Eximus Essence or Smeeta Charm farming advice."
            },
            {
              "h": "Run a resource booster if you have one",
              "p": "A Resource Booster can increase Acolyte Essence pickups, but a Resource Drop Chance Booster does not turn a guaranteed Acolyte drop into more Essence. Fixed Incursion and other completion rewards keep their listed amounts."
            }
          ]
        },
        {
          "type": "tip",
          "title": "Keep mission variants separate",
          "text": "Steel Path Railjack awards **2 Steel Essence per completed mission** after Hotfix 43.0.6; its Eximus no longer drop Essence. The Steel Path Circuit awards **25 at tier 9** of the weekly track, rather than per stage. Neither uses the standard endless Acolyte loop."
        },
        {
          "type": "p",
          "text": "If your main goal is Endo, compare dedicated methods in the [Endo farming guide](/guides/endo). A Steel Essence run and an Endo farm optimize different drops; the [Endo/Plat value tool](/endo) helps compare eligible market offers rather than promising an in-mission rate."
        }
      ]
    },
    {
      "id": "survivability",
      "title": "Survivability: how to stop getting one-shot",
      "blocks": [
        {
          "type": "p",
          "text": "If you are dying quickly, check how your defensive tools work together. More health alone may not solve the problem. Choose a defensive mechanic that suits your Warframe, then test how you recover when it fails:"
        },
        {
          "type": "list",
          "items": [
            "**Shield gating** — on shielded Warframes, invulnerability after a shield break scales with the shields restored before that break, normally from 0.33 to 2.5 seconds. Brief Respite or Augur mods can help refill shields through energy spent. Decaying Dragon Key caps the gate at 0.33 seconds; it is not the old shortcut. See the [mods & survivability guide](/guides/mods).",
            "**Adaptation** — builds resistance to damage types as you take hits. It needs time to build up, so pair it with enough survivability to withstand the first attacks.",
            "**Rolling Guard** — dodge for a short burst of invulnerability *and* a full status cleanse; your panic button when shields and gate both fail.",
            "**Armor reduction** — abilities or Corrosive status can reduce armored enemies' protection. Ordinary Corrosive stacks do not fully strip armor by themselves, and Viral increases damage to health rather than removing armor. Keep a separate answer to Overguard.",
            "**Defensive abilities and arcanes** — use the protection your frame actually provides: damage reduction, healing, shields or Overguard. Match your mods and arcanes to that defense instead of assuming that stacking health and armor protects every layer.",
            "**Your Operator** — recovery depends on your unlocked tools. Magus Elevate can heal your frame on returning to it; Magus Repair heals nearby Warframes while you stay in Void Mode. Entering Operator mode is not itself a shield-gate reset."
          ]
        },
        {
          "type": "warn",
          "title": "Respect Eximus Overguard",
          "text": "Do not rely on a stun or armor strip alone to stop an Overguarded Eximus. Focus damage on its Overguard, dodge its attacks and keep a defensive ability or Rolling Guard available for dangerous moments."
        },
        {
          "type": "p",
          "text": "The [Helminth system](/guides/helminth) can add a compatible defensive or armor-reduction ability to a build. Choose it around your available energy and ability stats, then test it alongside your [arcanes](/guides/arcanes) before committing to a long run."
        }
      ]
    },
    {
      "id": "am-i-ready",
      "title": "Am I ready? When to start",
      "blocks": [
        {
          "type": "info",
          "title": "Test one short mission first",
          "text": "Use your first run to find the bottleneck: staying alive, recovering energy, killing priority enemies or protecting the objective. Improve that part of the build before extending the run."
        },
        {
          "type": "p",
          "text": "The unlock is only the entry requirement. A practical starting point is one reliable defensive plan and a weapon or ability setup that kills priority enemies. Test both in a short mission; having a particular Mastery Rank, frame or number of Forma does not guarantee that the build works."
        },
        {
          "type": "p",
          "text": "A quick readiness check before you toggle it on:"
        },
        {
          "type": "list",
          "items": [
            "Do you have shield gating, Adaptation, or a genuine tank frame set up? (If not, build that first.)",
            "Can you defeat an armored enemy and an Overguarded Eximus without exhausting your ammunition or energy?",
            "Do you have a recovery plan when your main defensive ability is unavailable?",
            "Do your equipped mod ranks, capacity and polarities support the intended build? Add a Reactor or Forma where the build needs capacity."
          ]
        },
        {
          "type": "tip",
          "title": "Ease in — don't start on Steel Path Sedna",
          "text": "Start with a familiar early-planet mission and a clear extraction point. A friend or public squad can help you learn the flow, but bring your own recovery tools and pay attention to the mission objective."
        },
        {
          "type": "p",
          "text": "Use the [Warframe tier list](/guides/tier-list) as a starting point for choosing a playstyle, then check the actual build requirements. [Archon Shards](/guides/archon-shards) can refine a build later; they are not required for the base Steel Path unlock."
        }
      ]
    },
    {
      "id": "why-bother",
      "title": "Why bother — the payoff",
      "blocks": [
        {
          "type": "p",
          "text": "Steel Path can combine several goals: Steel Essence for Teshin, weapon Arcanes from Acolytes, Prime rewards from fissures and separate weekly Circuit choices. Pick the activity that matches the reward you want instead of expecting every mission to award all of them."
        },
        {
          "type": "list",
          "items": [
            "**Umbra Forma** — a rotating Teshin reward for builds that benefit from Umbra polarities.",
            "**Incarnon Genesis adapters** — choose weekly rewards in the Steel Path Circuit, then install them on compatible weapons through Cavalero.",
            "**Kuva and Riven rewards** — Teshin offers Kuva and rotating Riven Mods. Use the [Riven guide](/guides/riven) and [Riven Value tool](/riven-value) to decide how much to invest in a roll.",
            "**Targeted farming** — compare the [Endo guide](/guides/endo) before choosing a dedicated Endo farm; its requirements differ from an Essence run.",
            "**A real difficulty ceiling** — the place fully-built frames and weapons finally get tested."
          ]
        },
        {
          "type": "info",
          "title": "Where to go next",
          "text": "Choose your next activity by its own rewards and prerequisites: [Duviri and the Circuit](/guides/duviri), [Archon Hunts](/guides/archon-shards), or other farms in the [community tools directory](/tools). Completing Steel Path is not a universal prerequisite for these activities."
        },
        {
          "type": "info",
          "title": "Use videos alongside the current guide",
          "text": "The walkthroughs below may show older unlock requirements, shop stock or farming methods. Use the written guidance above for current Steel Essence sources, Retriever mods and Circuit rewards."
        }
      ]
    }
  ],
  "faqs": [
    {
      "q": "How do I unlock the Steel Path in Warframe?",
      "a": "Complete the required normal nodes and Junctions through the pre-New-War Star Chart, then speak to Teshin in any Relay. Zariman Ten Zero, Albrecht's Laboratories and Höllvania are excluded from the base unlock. Use the Navigation toggle to choose Normal or Steel Path; newer activities have separate access rules."
    },
    {
      "q": "What level are Steel Path enemies?",
      "a": "Standard Steel Path missions add 100 enemy levels and 150% health and shields, giving 2.5 times the level-scaled health and shields. Archwing and Railjack add 50 levels instead. Steel Path no longer adds an armor multiplier; enemy armor is capped at 2,700."
    },
    {
      "q": "What is Steel Essence used for?",
      "a": "Spend it at Teshin's Steel Path Honors on regular offers and a rotating weekly item, including Kuva, Primary and Secondary Arcane Adapters, cosmetics and rewards such as Umbra Forma blueprints or Riven Mods. Incarnon Genesis adapters are earned through the Circuit, not bought there for Essence."
    },
    {
      "q": "What's the best way to farm Steel Essence?",
      "a": "Start with accessible daily Incursions for 5 Essence each. For longer sessions, choose an eligible mission with Acolytes; a Steel Path fissure can add 1 Essence per Relic opened. Resource Boosters and Retriever mods can help eligible pickups. Advice based on Smeeta Charm doubling resources or ordinary Eximus dropping Essence is outdated."
    },
    {
      "q": "How do I stop getting one-shot in Steel Path?",
      "a": "Build around your frame's actual defenses and a reliable way to recover. Shield gating needs enough restored shields; refilling one point does not give the maximum gate. Adaptation, Rolling Guard or defensive abilities can support the build. Break Eximus Overguard with damage before relying on crowd control. See the [mods & survivability guide](/guides/mods)."
    },
    {
      "q": "Do I need to play the Steel Path to progress in Warframe?",
      "a": "Steel Path is an optional harder mode. Unlocking it does not replace Normal missions, and you can wait until you are comfortable with your builds. Specific rewards such as Circuit Incarnon Genesis adapters require their corresponding Steel Path activity."
    },
    {
      "q": "Can I get Incarnon weapons from the Steel Path?",
      "a": "Yes: the Steel Path Circuit offers Incarnon Genesis adapters on its weekly reward track. Your first selected adapter is earned at tier 5 and your second at tier 10. Install them through Cavalero with the required resources. Teshin does not sell these adapters for Steel Essence; check the [Circuit tracker](/circuit)."
    },
    {
      "q": "Is the Steel Path good for farming Endo?",
      "a": "Some dedicated enemy-drop farms benefit from Steel Path bonuses, but an Essence run is not automatically the best Endo run. Compare mission access, squad requirements and the drop being multiplied in the [Endo farming guide](/guides/endo). Use the [Endo value tool](/endo) for eligible market comparisons."
    }
  ],
  "videos": [
    {
      "id": "NaXYl5rnPJo",
      "title": "How To Unlock The Steel Path in Warframe (Beginner’s Guide 2026)",
      "channel": "Tipsy"
    },
    {
      "id": "tW5C3mM03mg",
      "title": "The Steel Path in Warframe - how to begin and earn rewards with Steel Essence",
      "channel": "scannerbarkly"
    },
    {
      "id": "aXLQ70qUaXM",
      "title": "The ULTIMATE Guide to Steelpath In Warframe",
      "channel": "WarframeFlo"
    },
    {
      "id": "ABsk9vIDD6I",
      "title": "Warframe Beginner's Guide 2025: Episode #12: Unlocking The Steel Path!",
      "channel": "iFlynn"
    }
  ],
  "sources": [
    {
      "label": "Hotfix 38.5.3 — Steel Path access",
      "href": "https://www.warframe.com/en/patch-notes/pc/38-5-3",
      "icon": "book-open-page-variant"
    },
    {
      "label": "Update 28.1 — baseline Steel Path modifiers",
      "href": "https://www.warframe.com/en/patch-notes/pc/28-1-0",
      "icon": "book-open-page-variant"
    },
    {
      "label": "Update 36 — armor and Magnetic rework",
      "href": "https://www.warframe.com/en/patch-notes/pc/36-0-0",
      "icon": "book-open-page-variant"
    },
    {
      "label": "Update 29.5 — Acolytes and Incursions",
      "href": "https://forums.warframe.com/topic/1236257-update-295-deimos-arcana/",
      "icon": "book-open-page-variant"
    },
    {
      "label": "Update 30.5 — Acolyte Arcanes and Incursion rewards",
      "href": "https://www.warframe.com/en/patch-notes/pc/30-5-0",
      "icon": "book-open-page-variant"
    },
    {
      "label": "Update 35.5 — sixth daily Incursion",
      "href": "https://www.warframe.com/en/patch-notes/pc/35-5-0",
      "icon": "book-open-page-variant"
    },
    {
      "label": "Update 37 — Retriever and Charm changes",
      "href": "https://www.warframe.com/en/patch-notes/pc/37-0-0",
      "icon": "book-open-page-variant"
    },
    {
      "label": "Update 34 — shield-gating rework",
      "href": "https://www.warframe.com/en/patch-notes/pc/34-0-0",
      "icon": "book-open-page-variant"
    },
    {
      "label": "Update 27.2 — Toxin, Slash and Corrosive",
      "href": "https://www.warframe.com/en/patch-notes/pc/27-2-0",
      "icon": "book-open-page-variant"
    },
    {
      "label": "Update 31.5 — Eximus Overguard",
      "href": "https://www.warframe.com/en/patch-notes/pc/31-5-0",
      "icon": "book-open-page-variant"
    },
    {
      "label": "Update 33 — Circuit reward tracks",
      "href": "https://www.warframe.com/en/patch-notes/pc/33-0-0",
      "icon": "book-open-page-variant"
    },
    {
      "label": "Update 43 — Steel Path Railjack",
      "href": "https://www.warframe.com/en/patch-notes/pc/43-0-0",
      "icon": "book-open-page-variant"
    },
    {
      "label": "Hotfix 43.0.6 — Railjack Essence revision",
      "href": "https://www.warframe.com/en/patch-notes/pc/43-0-6",
      "icon": "book-open-page-variant"
    },
    {
      "label": "Update 32 — Steel Path fissure rewards",
      "href": "https://www.warframe.com/en/patch-notes/pc/32-0-0",
      "icon": "book-open-page-variant"
    },
    {
      "label": "Update 31.6 — Operator Arcane triggers",
      "href": "https://www.warframe.com/en/patch-notes/pc/31-6-0",
      "icon": "book-open-page-variant"
    },
    {
      "label": "Update 35 — Melee Arcane Adapters",
      "href": "https://www.warframe.com/en/patch-notes/pc/35-0-0",
      "icon": "book-open-page-variant"
    },
    {
      "label": "Update 23.10 — Adaptation and Rolling Guard",
      "href": "https://www.warframe.com/en/patch-notes/pc/23-10-0",
      "icon": "book-open-page-variant"
    }
  ],
  "related": [
    {
      "label": "Survivability & Shield Gating",
      "to": "/guides/mods",
      "icon": "shield-half-full",
      "note": "Stop getting one-shot"
    },
    {
      "label": "Helminth Subsumes",
      "to": "/guides/helminth",
      "icon": "dna",
      "note": "Armor strip & defense on any frame"
    },
    {
      "label": "Arcanes Guide",
      "to": "/guides/arcanes",
      "icon": "star-four-points",
      "note": "Guardian, Grace & weapon arcanes"
    },
    {
      "label": "Riven Value Estimator",
      "to": "/riven-value",
      "icon": "diamond-stone",
      "note": "Compare Riven rolls before investing"
    },
    {
      "label": "Endo Farming",
      "to": "/guides/endo",
      "icon": "hexagon-outline",
      "note": "Compare dedicated Endo methods"
    },
    {
      "label": "Warframe Tier List",
      "to": "/guides/tier-list",
      "icon": "format-list-numbered",
      "note": "Frames that hold up in Steel Path"
    }
  ],
  "updated": "2026-11-02"
}

export default guide
