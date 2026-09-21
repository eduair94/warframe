// Warframe Knowledge Center guide content.
// Mechanics reviewed against official patch notes and Support on 2026-09-21.
// This is the single source for /guides/mods (rendered by <GuideArticle>).
import type { Guide } from './types'

const guide: Guide = {
  "slug": "mods",
  "eyebrow": "Knowledge Center · Mods & Survivability",
  "title": "Essential Mods & Survivability",
  "lede": "Choose Warframe mods, plan capacity and Forma, and build reliable defenses. Learn current shield-gating rules, damage types and survivability trade-offs.",
  "category": "systems",
  "readMins": 12,
  "stats": [
    {
      "num": "60",
      "label": "rank-30 base capacity with a Reactor/Catalyst",
      "tone": "gold"
    },
    {
      "num": "4",
      "label": "warframe ability stats",
      "tone": "alt"
    },
    {
      "num": "6",
      "label": "combined damage elements",
      "tone": "good"
    },
    {
      "num": "2.5s",
      "label": "standard shield-gate cap; exceptions apply",
      "tone": "gold"
    }
  ],
  "sections": [
    {
      "id": "how-modding-works",
      "title": "Mods are your build — everything else is a chassis",
      "blocks": [
        {
          "type": "p",
          "text": "**Mods** change your equipment's damage, defenses, abilities and utility. Start with the problem your loadout needs to solve: surviving a mission, sustaining energy or defeating a particular enemy. The right combination matters more than filling every slot."
        },
        {
          "type": "p",
          "text": "Each equipped mod uses **drain** from the item's **capacity** budget. For ordinary rank-30 equipment, base capacity follows item rank or your Mastery Rank, whichever is higher, up to the item's cap. A Reactor/Catalyst doubles that base amount; Aura and Stance bonuses are added separately. Rank-40 equipment can exceed the usual 30/60 base capacity."
        },
        {
          "type": "kv",
          "kv": [
            {
              "k": "Warframe slots",
              "v": "8 mod + 1 Aura + 1 Exilus"
            },
            {
              "k": "Weapon slots",
              "v": "Most regular weapons: 8 standard slots; compatible equipment has Exilus and/or Stance slots"
            },
            {
              "k": "Ordinary rank-30 base capacity",
              "v": "30, or 60 with a Reactor/Catalyst; Aura/Stance bonuses are separate"
            },
            {
              "k": "Rank mods up with",
              "v": "Endo + credits at the mod screen"
            },
            {
              "k": "Where mods drop",
              "v": "Enemies, bosses, syndicates, Transmutation, quests"
            }
          ]
        },
        {
          "type": "info",
          "text": "Keep useful core mods such as Serration and Vitality. Before dissolving duplicates for [Endo](/guides/endo), check whether you need a lower-rank copy for a tight capacity budget or whether a rare duplicate has trade value."
        }
      ]
    },
    {
      "id": "capacity-potatoes-forma",
      "title": "Capacity, potatoes, polarities & Forma",
      "blocks": [
        {
          "type": "p",
          "text": "Three tools let you fit a bigger build than raw capacity allows: **Orokin Reactors/Catalysts**, **polarities**, and **Forma**. Understanding them is the single biggest 'my build won't fit' fix for new players."
        },
        {
          "type": "p",
          "text": "An **Orokin Reactor** upgrades equipment such as Warframes and companions; an **Orokin Catalyst** upgrades weapons. Both permanently double base mod capacity: 30 becomes **60** on ordinary rank-30 gear. Check current Nightwave offerings and reward alerts before spending Platinum, and prioritize equipment you plan to keep."
        },
        {
          "type": "p",
          "text": "**Polarities** are the symbols on mod slots. A matching polarity halves a mod's drain, rounded up; a mismatched polarity increases it. A slot without a polarity uses the listed drain. Plan the whole loadout before changing a slot, because a polarity that helps one configuration may restrict another."
        },
        {
          "type": "p",
          "text": "Standard **Forma** changes a slot's polarity and resets equipment rank, so you re-level afterward. **Omni Forma**, formerly Aura Forma, provides a universal polarity except for Umbra. **Umbra Forma** applies Umbra polarity; **Stance Forma** works on melee Stance slots. An **Exilus Adapter** unlocks an Exilus slot and is a different item. See the [Forma guide](/guides/forma) before committing resources."
        },
        {
          "type": "tip",
          "text": "An **Aura** on a Warframe or a **Stance** on a compatible melee weapon adds capacity. Matching its polarity doubles that bonus. Choose an effect that serves the build, then compare the capacity gained before deciding whether to Forma the slot."
        },
        {
          "type": "warn",
          "text": "Don't potato or heavily Forma leveling fodder you'll sell for Mastery. Save Reactors, Catalysts, and Forma for keepers — your main frames and the weapons you'll actually take into [Steel Path](/guides/steel-path)."
        }
      ]
    },
    {
      "id": "damage-model",
      "title": "The damage-multiplier mental model",
      "blocks": [
        {
          "type": "p",
          "text": "Think of weapon damage as several interacting contributions: base damage, multishot, critical hits, elemental damage and status effects. Many bonuses of the same kind add together, while separate multipliers can strengthen each other. This is a planning aid, not a complete formula for every weapon or ability."
        },
        {
          "type": "p",
          "text": "Compare what the next slot adds to your existing build. If an arcane or ability already supplies substantial base damage, multishot or a suitable element may add more than another base-damage mod. Stacking base damage is still valid when it gives the better result; test with the buffs and conditions you can actually maintain."
        },
        {
          "type": "list",
          "items": [
            "**Base damage** — Serration (rifle), Hornet Strike (pistol), Pressure Point (melee). The foundation, but only one bucket.",
            "**Multishot** — Split Chamber (rifle), Barrel Diffusion (pistol). Fires extra pellets/projectiles: nearly a second damage mod on top of base.",
            "**Critical** — combine crit chance, such as Point Strike, with crit damage, such as Vital Sense, when the weapon supports it. Chance above 100% permits higher critical tiers.",
            "**Elements** — choose damage types and status effects for the enemy. Combining two base elements changes their effect; it is not automatically an upgrade in every situation."
          ]
        },
        {
          "type": "p",
          "text": "**Elements** let you tune your damage to what you're fighting — mostly through their **status effects** and each faction's weaknesses. The four base elements — **Heat, Cold, Electricity, Toxin** — pair up (in mod-screen order) into six **combined elements**:"
        },
        {
          "type": "table",
          "table": {
            "columns": [
              "Combine",
              "→ Result",
              "What it does / when to use"
            ],
            "rows": [
              [
                "Toxin + Cold",
                "Viral",
                "Status increases damage to Health when the target can receive it"
              ],
              [
                "Heat + Toxin",
                "Gas",
                "Spreads a damaging cloud — strong against packed groups"
              ],
              [
                "Cold + Electricity",
                "Magnetic",
                "Status increases damage to Shields and Overguard"
              ],
              [
                "Toxin + Electricity",
                "Corrosive",
                "Status strips Armor; also the Grineer faction weakness"
              ],
              [
                "Heat + Electricity",
                "Radiation",
                "Confusion status — makes enemies attack each other (crowd control)"
              ],
              [
                "Heat + Cold",
                "Blast",
                "Status causes delayed detonations; stacks can produce an area explosion"
              ]
            ],
            "note": "Update 36 moved weaknesses and resistances to faction categories and replaced Blast's accuracy penalty with detonations. Check the enemy faction in Navigation or the Codex. Element order matters, and innate weapon elements can affect combinations; inspect the final damage types in the Arsenal."
          }
        },
        {
          "type": "info",
          "text": "Status vs crit: some weapons want **status** (dual-stat 60/60 mods, viral procs) and others want **crit**. Check a weapon's crit and status chance before choosing — a high-crit rifle wants Point Strike + Vital Sense; a high-status shotgun wants dual-stat element mods."
        }
      ]
    },
    {
      "id": "warframe-mods",
      "title": "Must-have Warframe mods",
      "blocks": [
        {
          "type": "p",
          "text": "Warframe builds juggle **survivability** and the **four ability stats**: Strength, Duration, Range, Efficiency. You rarely max all four — you tune them to the frame. Learn what each core mod does and you can read any build guide."
        },
        {
          "type": "table",
          "table": {
            "columns": [
              "Mod",
              "What it does",
              "Why it matters"
            ],
            "rows": [
              [
                "Vitality",
                "+100% Health at max rank",
                "For builds that rely on Health"
              ],
              [
                "Redirection",
                "+100% Shield Capacity at max rank",
                "Feeds shield-gating — or skipped for low-shield builds"
              ],
              [
                "Adaptation",
                "Stacking damage resistance up to 90%",
                "Builds resistance through incoming hits; does not start at full strength"
              ],
              [
                "Intensify",
                "+ Ability Strength",
                "Bigger ability numbers (damage, buffs, armor strip)"
              ],
              [
                "Streamline",
                "+ Ability Efficiency",
                "Cast more often, spend less energy"
              ],
              [
                "Stretch",
                "+ Ability Range",
                "Wider auras, CC, and buff bubbles"
              ],
              [
                "(Primed) Continuity",
                "+ Ability Duration",
                "Longer buffs and crowd control"
              ],
              [
                "(Primed) Flow",
                "+ Energy capacity",
                "A bigger pool to spend abilities from"
              ]
            ],
            "note": "Umbral Vitality, Umbral Intensify and Umbral Fiber gain set bonuses together, but cost substantial capacity. Compare their benefit with the slots your build needs before spending Umbra Forma."
          }
        },
        {
          "type": "p",
          "text": "A few more stat mods worth knowing because build guides lean on their trade-offs: **Blind Rage** (big Strength, but costs Efficiency), **Fleeting Expertise** (big Efficiency, but costs Duration), **Overextended** (huge Range, but costs Strength), and **Narrow Minded** (huge Duration, but costs Range). Mixing these 'corrupted' mods is how you push one stat to the extreme."
        },
        {
          "type": "tip",
          "text": "The **Exilus slot** accepts compatible utility mods such as Rush, Handspring and radar mods. Unlock it with an **Exilus Adapter**. It provides another slot, not free capacity: the installed mod still uses drain from your build's budget. Check the Exilus symbol on the mod."
        }
      ]
    },
    {
      "id": "weapon-mods",
      "title": "Must-have weapon mods, by type",
      "blocks": [
        {
          "type": "p",
          "text": "These are common starting options, not mandatory slots for every weapon. Match them to the weapon's stats, firing mode and the buffs available to your loadout."
        },
        {
          "type": "table",
          "table": {
            "columns": [
              "Build role",
              "Primary (rifle)",
              "Secondary (pistol)",
              "Melee"
            ],
            "rows": [
              [
                "Base damage",
                "Serration",
                "Hornet Strike",
                "(Primed) Pressure Point"
              ],
              [
                "Multishot",
                "Split Chamber",
                "Barrel Diffusion / Lethal Torrent",
                "— (use combo instead)"
              ],
              [
                "Crit chance",
                "Point Strike",
                "Pistol Gambit",
                "Blood Rush (scales with combo)"
              ],
              [
                "Crit damage",
                "Vital Sense",
                "Target Cracker",
                "Organ Shatter"
              ],
              [
                "Status / element",
                "+90% element mods, 60/60 duals",
                "+90% element mods",
                "Condition Overload, Weeping Wounds"
              ]
            ],
            "note": "Shotguns swap in Point Blank (base) and Hell's Chamber (multishot). Bows/snipers lean hard on crit. Add dual-stat 60/60 mods when you want status procs over raw crit."
          }
        },
        {
          "type": "p",
          "text": "**Melee has several build styles.** Combo-focused setups can use **Blood Rush** for critical chance and **Weeping Wounds** for status chance. **Condition Overload** rewards applying different status types to the target. Heavy-attack setups may need different choices. Compare attack speed, range and combo requirements as well as damage."
        },
        {
          "type": "info",
          "text": "Read the mod's rank and activation conditions before comparing builds. Galvanized Chamber and Galvanized Diffusion can provide stronger multishot after their on-kill effects build up, but their peak bonus is not permanently active. Check whether your chosen mission lets you maintain it."
        }
      ]
    },
    {
      "id": "shield-gating",
      "title": "Shield-gating: a recovery window, not permanent protection",
      "blocks": [
        {
          "type": "p",
          "text": "**Shield-gating** can give a shield-bearing Warframe time to recover after its shields break. It is one option for [Steel Path](/guides/steel-path) survival; health, armor, abilities, movement and enemy control also matter. Build around the defenses your frame actually has."
        },
        {
          "type": "p",
          "text": "The standard gate scales from **0.33 to 2.5 seconds**, reaching its cap at **1,150 shields**. It depends on shields restored before the break, not maximum capacity alone. Partially restored shields use the same scaling. Special mechanics, including Hildryn's passive, can change the duration."
        },
        {
          "type": "steps",
          "ordered": true,
          "steps": [
            {
              "h": "Keep a shield buffer",
              "p": "Check your frame first. Inaros has no innate shields; this setup does not apply to his normal defenses."
            },
            {
              "h": "Refresh the gate on demand",
              "p": "Plan how to recover shields and sustain the required energy. Brief Respite and Augur set effects can turn energy spent on abilities into shields; inspect the actual amount restored by your build."
            },
            {
              "h": "Understand Catalyzing Shields",
              "p": "At max rank, Catalyzing Shields cuts maximum shields by 80%. Its gate reaches **1.33 seconds** from a fully restored pool; partial recovery gives less. A **Decaying Dragon Key caps gates at 0.33 seconds** and is not a substitute."
            },
            {
              "h": "Add a panic button",
              "p": "At max rank, Rolling Guard grants 3 seconds of invulnerability and clears status effects when you dodge, with a 7-second cooldown. Use that interval to recover or reposition. It does not itself refill shields or reset their gate."
            }
          ]
        },
        {
          "type": "warn",
          "text": "**Toxin damage bypasses shields. Slash status damage bypasses armor, but not shields.** Do not treat them as the same threat. A status cleanse can remove an existing Toxin effect, but does not provide permanent protection from new damage."
        },
        {
          "type": "tip",
          "text": "Practice recovery before a difficult mission: watch your shields, energy and cooldowns after taking a hit. If the sequence is unreliable, adjust the build or use a defensive approach that better fits the frame."
        }
      ]
    },
    {
      "id": "layered-survivability",
      "title": "Layering survivability beyond the gate",
      "blocks": [
        {
          "type": "p",
          "text": "Choose complementary defenses instead of equipping every defensive mod. Consider how the build handles the first hit, repeated damage, status effects and recovery when energy or cooldowns are unavailable."
        },
        {
          "type": "list",
          "items": [
            "**Adaptation** — builds resistance from incoming damage, up to **90%** for covered damage types. It needs time to build and is not an unconditional 90% reduction against every hit.",
            "**Rolling Guard** — a brief invulnerability window and status cleanse on dodge. Plan around its cooldown; it supplies recovery time, not shield restoration.",
            "**Quick Thinking** — uses energy to absorb otherwise lethal health damage while sufficient energy remains. Account for the energy your abilities also need.",
            "**Primed Sure Footed** — knockdown/stagger immunity (login-reward mod). Being stunlocked is a hidden killer; standing your ground lets you keep casting.",
            "**Arcanes** — [Arcanes](/guides/arcanes) like Arcane Grace, Guardian, or Aegis add health regen, armor, and shield recovery on top of mods for a big survivability spike.",
            "**Abilities + Helminth** — consider the frame's own defensive abilities before replacing one through [Helminth](/guides/helminth). Check the subsumed version's restrictions, duration and energy cost."
          ]
        },
        {
          "type": "info",
          "text": "Health-based builds need a way to recover health as well as withstand damage. Shield-based builds need reliable recovery between breaks. Test the complete loop in the mission you intend to play, rather than copying a single defensive mod onto every frame."
        }
      ]
    },
    {
      "id": "ranking-rivens-next",
      "title": "Ranking mods, Rivens & where to go next",
      "blocks": [
        {
          "type": "p",
          "text": "Mods rank up with **Endo and credits**. Compare the next rank's cost, benefit and extra drain before upgrading. The last ranks of a ten-rank mod can be expensive, so improve the core loadout gradually. See the [Endo farming guide](/guides/endo) and [Endo / Plat value tool](/endo) when budgeting upgrades or deciding what to dissolve."
        },
        {
          "type": "p",
          "text": "**Rivens** have randomized stats and weapon-specific restrictions. Their benefit depends on the weapon, roll, disposition and mod they replace. Establish a useful basic build first, then compare an actual roll with your alternatives. Consult the [Riven value estimator](/riven-value) and [Riven guide](/guides/riven) before a trade; there is no fixed damage gain or guaranteed resale price."
        },
        {
          "type": "steps",
          "ordered": true,
          "steps": [
            {
              "h": "Potato and Forma your keepers",
              "p": "Plan the complete loadout, check its capacity, then add a Reactor/Catalyst or matching polarities where needed. Leave room for alternative configurations."
            },
            {
              "h": "Fill the damage buckets",
              "p": "Base + multishot + crit + elements on weapons; survivability + your two priority ability stats on frames."
            },
            {
              "h": "Add a survivability layer",
              "p": "Choose defenses and a recovery method that fit your frame, then test them before a difficult Steel Path mission."
            },
            {
              "h": "Min-max last",
              "p": "Umbral/Primed mods, arcanes, then a Riven only once the base build is complete."
            }
          ]
        },
        {
          "type": "tip",
          "text": "When a build lists mods you do not own, try an appropriate basic version and check the resulting stats. Upgrade expensive ranks gradually; improving several essential mods can be more useful than spending all your Endo on one final rank."
        }
      ]
    },
    {
      "id": "build-planners",
      "title": "Copy & theorycraft faster with build planners",
      "blocks": [
        {
          "type": "p",
          "text": "**[Overframe](/tools/overframe)** offers community builds, while **[Underframe](/tools/underframe)** offers damage calculations and automatic build suggestions. Use them to compare options, then validate the result in-game with the enemy, buffs and conditions that matter to you."
        },
        {
          "type": "kv",
          "kv": [
            {
              "k": "Overframe (overframe.gg)",
              "v": "Community builds, an arsenal builder, rankings and Player Sync"
            },
            {
              "k": "Underframe (underframe.site)",
              "v": "Damage and time-to-kill calculations, Auto Build and Riven comparison tools; simulations do not roll Rivens in-game"
            }
          ]
        },
        {
          "type": "steps",
          "ordered": true,
          "steps": [
            {
              "h": "Search and read — don't just copy the top vote",
              "p": "Open a few builds for your item and read the author's notes on what it's for (Steel Path, Eidolon, farming). Prefer recent builds — see the warning below."
            },
            {
              "h": "Check the true cost",
              "p": "Count the Forma and flag every Riven, arcane, Umbral/Primed mod and Helminth subsume the build assumes. Build the version with what you own and slot equivalents for the rest."
            },
            {
              "h": "Check your available mods",
              "p": "Compare the proposed loadout with your inventory and mod ranks. Optional import tools can help, but verify what they actually imported before relying on their output."
            },
            {
              "h": "Simulate before you Forma",
              "p": "Drop the adapted build into Underframe, sim it against the enemy you'll actually fight, and compare two options before committing Forma to one."
            }
          ]
        },
        {
          "type": "warn",
          "text": "Overframe's **tier lists and some rankings are vote-aggregated over years**, so reworked gear can sit below what it actually does today. Read builds critically and check the date — the [Tier List guide](/guides/tier-list) explains the vote-lag trap."
        },
        {
          "type": "info",
          "text": "Want the full loop — goal → template → adapt → simulate → Forma — plus a red-flag checklist for shared builds? See the dedicated [Best Builds & Build Planners guide](/guides/builds)."
        }
      ]
    }
  ],
  "faqs": [
    {
      "q": "What are the best mods for beginners in Warframe?",
      "a": "Start with suitable base-damage, multishot and elemental mods for your weapon. For a Warframe, choose defenses and the ability stats its kit needs: Intensify, Streamline, Stretch and Continuity are useful options, not a mandatory set. Spend [Endo](/guides/endo) across essential mods before committing everything to an expensive final rank."
    },
    {
      "q": "What does an Orokin Reactor or Catalyst (a 'potato') do?",
      "a": "It doubles base mod capacity, so ordinary rank-30 equipment goes from 30 to 60 before Aura or Stance bonuses. A Reactor upgrades equipment such as Warframes and companions; a Catalyst upgrades weapons. Higher-rank equipment can have more capacity. Prioritize gear you intend to keep."
    },
    {
      "q": "How do polarities and Forma work?",
      "a": "Matching a slot polarity halves mod drain, rounded up. Standard Forma changes a polarity and resets equipment rank; it does not directly add ordinary base capacity. Aura and Stance mods add capacity instead, with a doubled bonus when matched. Plan alternate builds before choosing a permanent polarity."
    },
    {
      "q": "What is shield-gating and how do I do it?",
      "a": "It is a brief protection window after shields break. The standard duration depends on shields recovered before that break, including partial recovery. Plan a reliable refill method and enough energy to use it. Rolling Guard provides separate invulnerability and status cleansing; it does not restore shields. See the shield-gating section for modifiers and exceptions."
    },
    {
      "q": "Why do I keep dying in Steel Path even with tons of health?",
      "a": "Check what is failing: the first hit, sustained damage, a status effect, or running out of energy. Health needs recovery and suitable damage reduction; shields need a reliable refill plan. Toxin bypasses shields, while Slash status does not. Mobility, enemy control and defensive abilities can help alongside mods."
    },
    {
      "q": "How do I do more weapon damage — which mod first?",
      "a": "Start from the weapon's strengths and the enemy you are fighting. Compare base damage, multishot, critical stats and useful elements against the bonuses already supplied by abilities or arcanes. The next slot's benefit depends on the whole loadout; another base-damage mod is neither always right nor always wrong."
    },
    {
      "q": "How do I rank up (upgrade) my mods?",
      "a": "Go to the mod screen and fuse the mod using Endo plus credits — each rank increases its effect and its drain. Endo comes from Ayatan sculptures, dissolving duplicate mods, and dedicated farms covered in the [Endo guide](/guides/endo). Use the [Endo / Plat value tool](/endo) to decide whether a mod or riven is worth more dissolved than kept."
    },
    {
      "q": "Are Rivens worth it for a new player?",
      "a": "Usually, finish a functional basic loadout first. A Riven's value depends on its weapon, stats, disposition and the mod it replaces; there is no fixed percentage gain. Use the [Riven value estimator](/riven-value) as a pricing aid and read the [Riven guide](/guides/riven) before spending Platinum."
    },
    {
      "q": "Where do I find good Warframe builds instead of modding from scratch?",
      "a": "Browse community builds on [Overframe](/tools/overframe) and compare damage setups with [Underframe](/tools/underframe). Read the author's assumptions, check the update date and adapt the build to your inventory. The [Best Builds & Build Planners guide](/guides/builds) explains the workflow."
    }
  ],
  "videos": [
    {
      "id": "ct2pfAonGXY",
      "title": "Complete Warframe Modding Guide 2025: Everything You Need to Know!",
      "channel": "Zefā"
    },
    {
      "id": "RQ22Jltn3i0",
      "title": "The Ultimate Shield Gating Guide! 🛡️ STOP DYING IN STEEL PATH [Warframe]",
      "channel": "Hunkpain Gaming "
    },
    {
      "id": "H0sPUBGn2bc",
      "title": "How to NEVER DIE In WARFRAME!",
      "channel": "iFlynn"
    },
    {
      "id": "GPJS7bj6V2E",
      "title": "THE ONLY SURVIVABILITY GUIDE YOU WILL EVER NEED IN WARFRAME",
      "channel": "Alextreme"
    }
  ],
  "sources": [
    {
      "label": "Warframe — Update 34: shield gating, Catalyzing Shields and stat mods",
      "href": "https://www.warframe.com/en/patch-notes/pc/34-0-0"
    },
    {
      "label": "Warframe — Update 27.2: Slash and Toxin shield interactions",
      "href": "https://www.warframe.com/en/patch-notes/pc/27-2-0"
    },
    {
      "label": "Warframe — Update 23.10: Rolling Guard and Adaptation",
      "href": "https://www.warframe.com/en/patch-notes/pc/23-10-0"
    },
    {
      "label": "Warframe — Update 30.5: melee and Galvanized mod conditions",
      "href": "https://www.warframe.com/en/patch-notes/pc/30-5-0"
    },
    {
      "label": "Warframe — Update 36: Blast, Magnetic and faction resistances",
      "href": "https://www.warframe.com/en/patch-notes/pc/36-0-0"
    },
    {
      "label": "Warframe — Hotfix 18.13.2: Mastery Rank and starting capacity",
      "href": "https://www.warframe.com/en/patch-notes/pc/18-13-2"
    },
    {
      "label": "Warframe — Update 38.5: Omni Forma",
      "href": "https://www.warframe.com/en/patch-notes/pc/38-5-0"
    },
    {
      "label": "Warframe — Update 17: Exilus utility slots",
      "href": "https://www.warframe.com/en/patch-notes/pc/17-0-0"
    },
    {
      "label": "Warframe Support — Polarization and Forma FAQ",
      "href": "https://support.warframe.com/hc/en-us/articles/200240380-Polarization-and-Forma-FAQ"
    },
    {
      "label": "Warframe Support — Mod Guide",
      "href": "https://support.warframe.com/hc/en-us/articles/200500194-Mod-Guide-Use-Fusion-Transmutation-Sale"
    },
    {
      "label": "Warframe Wiki — Mods, Polarity & Forma",
      "href": "https://wiki.warframe.com/w/Mods"
    },
    {
      "label": "Warframe Wiki — Damage & Elemental Combinations",
      "href": "https://wiki.warframe.com/w/Damage"
    },
    {
      "label": "Warframe Wiki — Shield & Shield Gating",
      "href": "https://wiki.warframe.com/w/Shield"
    },
    {
      "label": "Overframe — community builds & arsenal builder",
      "href": "https://overframe.gg/"
    },
    {
      "label": "Underframe — DPS simulator & auto-build",
      "href": "https://www.underframe.site/"
    }
  ],
  "related": [
    {
      "label": "Best Builds & Build Planners",
      "to": "/guides/builds",
      "icon": "hammer-screwdriver",
      "note": "Copy & theorycraft with Overframe & Underframe"
    },
    {
      "label": "Riven Mods Guide",
      "to": "/guides/riven",
      "icon": "diamond-stone",
      "note": "Rolls, dispositions & when to bother"
    },
    {
      "label": "Steel Path Guide",
      "to": "/guides/steel-path",
      "icon": "skull",
      "note": "Where survivability modding pays off"
    },
    {
      "label": "Helminth System",
      "to": "/guides/helminth",
      "icon": "dna",
      "note": "Subsume defensive abilities onto any frame"
    },
    {
      "label": "Arcanes Guide",
      "to": "/guides/arcanes",
      "icon": "shield-star",
      "note": "The survivability layer above mods"
    },
    {
      "label": "Endo Farming",
      "to": "/guides/endo",
      "icon": "chart-line",
      "note": "Fuel to rank your mods up"
    },
    {
      "label": "Riven Value Estimator",
      "to": "/riven-value",
      "icon": "cash",
      "note": "Price a riven before you trade"
    }
  ],
  "updated": "2026-09-21"
}

export default guide
