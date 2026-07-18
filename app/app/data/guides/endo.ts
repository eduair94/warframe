// Warframe Knowledge Center guide content — /guides/endo.
// Drafted grounded in r/Warframe research (reddit API) + the Warframe wiki, then
// adversarially fact-checked for mid-2026 accuracy (nerf-checked against patch
// notes; 42/44 researched methods survived verification). Embedded video ids were
// verified live via YouTube oEmbed. This replaces the old bespoke "buy Endo cheap
// with plat" landing page — that buy-with-plat route now lives on the /endo tool,
// linked from `related` below. Rendered by <GuideArticle>; edit freely.
import type { Guide } from './types'

const guide: Guide = {
  "slug": "endo",
  "eyebrow": "Knowledge Center · Endo",
  "title": "Endo Farming Guide",
  "lede": "Endo is the untradeable currency you spend (alongside credits) to rank up mods, and a maxed Primed mod eats ~140k of it — so you will always be short. This is the honest mid-2026 version: every current, un-nerfed way to actually earn Endo — the veteran Arbitration engine, the Ayatan sculpture route, the uncapped 1999/Höllvania and Sedna arena farms, and the \"free Endo you forgot about\" sitting in your mod collection.",
  "category": "farming",
  "readMins": 11,
  "stats": [
    {
      "num": "1,500",
      "label": "Endo per Arbitration Rotation C",
      "tone": "gold"
    },
    {
      "num": "3,450",
      "label": "Endo from a socketed Anasa",
      "tone": "good"
    },
    {
      "num": "~140k",
      "label": "Endo to max one Primed mod",
      "tone": "alt"
    },
    {
      "num": "0",
      "label": "boosters that increase Endo"
    }
  ],
  "sections": [
    {
      "id": "why",
      "title": "What Endo is and where it comes from",
      "blocks": [
        {
          "type": "p",
          "text": "Endo is \"concentrated energy used to Fuse and upgrade Mods.\" You spend Endo plus [credits](/guides/credits) to raise a mod's rank; each rank increases the effect and the drain. It is **untradeable** — you cannot sell it for credits or buy it from another player — so every point is farmed. See the [modding guide](/guides/mods) for how ranking actually consumes it."
        },
        {
          "type": "list",
          "ordered": false,
          "items": [
            "**Endo orbs** — blue-and-gold pickups enemies and containers drop in three sizes: 15 (small), 50 (medium), 80 (large).",
            "**Flat mission/rotation rewards** — star-chart rotations pay ~50 up to ~4,200 Endo at high tiers; Granum Void pays 200 / 400 / 600 (Standard / Extended / Nightmare).",
            "**Arbitrations** — 900 / 1,200 / 1,500 Endo per qualifying rotation, the backbone veteran farm.",
            "**Ayatan Sculptures** — socket them with Ayatan Stars and dissolve at Maroo for 1,425–3,450 Endo each.",
            "**Conversion** — dissolve duplicate mods, scrap Railjack wreckage, or dump a heavily-rerolled [Riven](/guides/riven) for a one-off lump."
          ]
        },
        {
          "type": "warn",
          "title": "No booster touches Endo",
          "text": "There is NO Endo Booster. Resource Boosters, Drop Chance Boosters, the Steel Path Drop Chance Booster and Drop Chance Blessing all do NOTHING for Endo — it isn't a boostable resource, and boosters never apply to end-of-mission rewards. The ONE exception that helps: in-mission Endo pickups count as MOD drops, so a Mod Drop Chance Booster doubles the Endo you sweep off the floor (see the Sedna arena farm)."
        }
      ]
    },
    {
      "id": "best-farms",
      "title": "Best Endo farms by stage and effort",
      "blocks": [
        {
          "type": "p",
          "text": "There is no single \"best\" — it depends on your account stage and how sweaty you want to be. The highest ceiling is still the Sedna arena with a boosted premade, but Arbitrations and 1999 bounties are what the community actually recommends for solo and casual play in 2026."
        },
        {
          "type": "table",
          "table": {
            "columns": [
              "Farm",
              "Where / node",
              "Endo yield",
              "Best for"
            ],
            "rows": [
              [
                "Arbitrations (Survival/Defense)",
                "Rotating hourly node (unlock: full Star Chart)",
                "900 / 1,200 / 1,500 per A/B/C rotation → ~5,000–10,000/hr + sculptures",
                "Veterans, solo-friendly"
              ],
              [
                "Vodyanoi — Rathuum arena (Steel Path)",
                "Sedna › Vodyanoi",
                "~400–1,000 solo per ~3-min run; ~1,000 Endo/min with a full loot squad + Mod Drop Booster",
                "Sweaty premade, highest ceiling"
              ],
              [
                "1999 / Höllvania bounties",
                "Höllvania Central Mall (after The Hex)",
                "3,300 or 4,200 Endo rolls (~14–16% each); realistic avg ~1,000–1,500 per ~3–4 min bounty. Uncapped",
                "Mid/late, fastest no-cap"
              ],
              [
                "Deimos / Cambion Drift T5 bounties",
                "Cambion Drift (L40–60)",
                "~1,000 Endo on stage 1 (~45%); ~8,000–15,000/hr resetting early stages",
                "Pre-Arbitration / pre-Steel-Path"
              ],
              [
                "Zariman bounties (T4/5 Exterminate)",
                "The Chrysalith",
                "~730 Endo avg per bounty (EV of the Endo slot) + minor floor drops",
                "By-product of Zariman gear runs"
              ],
              [
                "Ayatan sculptures (socketed)",
                "Dissolve at Maroo's Bazaar, Mars",
                "1,425–3,450 per fully-socketed sculpture",
                "Passive, all levels"
              ],
              [
                "Railjack wreckage scrap",
                "Dry Dock › Configure",
                "~225 Endo per MK III part; big stockpiles = tens of thousands at once",
                "Needs a built Railjack"
              ],
              [
                "Archon Hunt (weekly)",
                "Teshin's Steel Path console",
                "8,000 Endo at ~12.1%, one roll/week (not guaranteed)",
                "Weekly bonus, run it for the Shard"
              ],
              [
                "Dissolving duplicate mods",
                "Orbiter › Mods segment",
                "5 / 10 / 15 Endo per unranked common/uncommon/rare",
                "Any MR, cleanup not a farm"
              ]
            ],
            "note": "Yields are mid-2026 and reflect real drop-table chances, not best-case ceilings. Sedna's headline numbers require a coordinated squad; solo output sits at the low band."
          }
        },
        {
          "type": "info",
          "title": "The Sedna arena isn't nerfed — it's just niche now",
          "text": "Vodyanoi is still mathematically the best Endo/minute in the game. But since Arbitrations arrived and DE flooded recent reward tables (Narmer through 1999) with Endo, most players treat the arena as effectively obsolete for casual use — it only pays off for a dedicated, boosted premade. The meta loot squad is ONE Nekros (Desecrate) + ONE Khora (Pilfering Strangledome, which also groups) + a grouping/DPS frame (Nidus Larva or Vauban Vortex), on Steel Path, with a Mod Drop Chance Booster. Multiple Nekros do NOT stack Desecrate on the same corpse — only one pilfering effect applies per body."
        },
        {
          "type": "tip",
          "title": "Run bounties on Normal, not Steel Path",
          "text": "1999, Zariman and Sanctum bounties give the SAME Endo on Normal and Steel Path, so run Normal for speed — SP only adds Steel Essence. Steel Path only helps the kill-based Sedna arena, where its +100% mod-drop-chance bonus doubles the floor Endo and stacks multiplicatively with a Mod Drop Chance Booster."
        },
        {
          "type": "video",
          "video": {
            "id": "K6neW7Fp7vM",
            "title": "You're Farming Endo Wrong – Do THIS Instead! (Top 5 Warframe Guide)",
            "channel": "iFlynn"
          }
        }
      ]
    },
    {
      "id": "ayatan",
      "title": "The Ayatan Sculpture route",
      "blocks": [
        {
          "type": "p",
          "text": "Ayatan Sculptures are the reliable, all-level Endo pipeline. You collect sculptures, fill their color-coded sockets with Ayatan Stars, then dissolve them at Maroo's Bazaar (Mars) for a big lump. It is a supplement rather than a fast per-hour farm, but almost everyone should be doing the free weekly and socketing what they find."
        },
        {
          "type": "steps",
          "steps": [
            {
              "h": "Collect sculptures",
              "p": "Each eligible mission has a flat ~1/7 (~14%) chance to hide one sculpture in the tileset. They also drop from Arbitrations, Sorties/Archon Hunts, Simaris and containers. Anasa (the top sculpture) comes from Sorties (28% on the final mission) and Archon Hunts — NOT the weekly hunt."
            },
            {
              "h": "Do Maroo's weekly Ayatan Treasure Hunt",
              "p": "Maroo's Bazaar › Ayatan Treasure Hunt, once per week (resets Monday 00:00 UTC). It's a timed parkour room — Titania or Xaku make it trivial — awarding one rotating sculpture on a fixed 6-week cycle: Sah → Ayr → Orta → Vaya → Piv → Valana. It NEVER gives Anasa."
            },
            {
              "h": "Socket before you dissolve",
              "p": "Slot Cyan Stars into blue sockets and Amber into orange. Once slotted a star is permanent. A socketed sculpture is worth far more than the empty sculpture plus the loose stars — always fill it first."
            },
            {
              "h": "Dissolve at Maroo",
              "p": "Take the socketed sculpture to Maroo and use \"Trade Treasures\" — extraction is free (the old credit cost was removed in 2017). The Endo drops straight into your pool."
            }
          ]
        },
        {
          "type": "table",
          "table": {
            "columns": [
              "Sculpture",
              "Sockets (C+A)",
              "Empty Endo",
              "Fully socketed",
              "Source note"
            ],
            "rows": [
              [
                "Anasa",
                "2C + 2A",
                "2,000",
                "3,450",
                "Sortie (28%) / Archon only — never the weekly"
              ],
              [
                "Kitha",
                "4C + 1A",
                "450",
                "3,000",
                "Vendor (Necraloid); best single-Amber value"
              ],
              [
                "Orta",
                "3C + 1A",
                "650",
                "2,700",
                "Weekly cycle (week 3)"
              ],
              [
                "Zambuka",
                "2C + 1A",
                "450",
                "2,600",
                "Vitus Essence store; best Endo-per-Amber (~1,075)"
              ],
              [
                "Hemakara",
                "2C + 1A",
                "450",
                "2,600",
                "—"
              ],
              [
                "Chattraka",
                "2C + 1A",
                "450",
                "2,600",
                "Nightwave/vendor"
              ],
              [
                "Vaya",
                "2C + 1A",
                "400",
                "1,800",
                "Weekly cycle (week 4)"
              ],
              [
                "Piv",
                "2C + 1A",
                "375",
                "1,725",
                "Weekly cycle (week 5)"
              ],
              [
                "Valana",
                "2C + 1A",
                "325",
                "1,575",
                "Weekly cycle (week 6)"
              ],
              [
                "Sah",
                "2C + 1A",
                "300",
                "1,500",
                "Weekly cycle (week 1)"
              ],
              [
                "Ayr",
                "3C + 0A",
                "325",
                "1,425",
                "Weekly cycle (week 2); no Amber needed"
              ]
            ],
            "note": "Loose star dissolve values: Cyan Star = 50 Endo, Amber Star = 100 Endo. Socketing beats dissolving loose — e.g. a socketed Anasa is 3,450 vs ~2,300 for the empty Anasa plus its 4 stars dissolved separately."
          }
        },
        {
          "type": "warn",
          "title": "Amber Stars are the bottleneck — and stars aren't vacuumed",
          "text": "Cyan Stars are effectively unlimited (~2 per mission from containers/lockers and Kuaka on the Plains). Amber is the gate. Farm it from Deimos / Cambion Drift bounties (~45–56% on early stages), or MANUFACTURE it: the reusable Ayatan Amber Star blueprint from the Arbitration (Arbiters of Hexis) store costs 10 Vitus Essence, then each craft turns 2 Cyan + 1 Vitus + 100,000 credits into 1 Amber. When Amber-starved, spend it on Zambuka/Orta first and fully socket cyan-only Ayr. Note: sculptures AND stars must be picked up by hand — Vacuum/Fetch does not grab them; use a Loot Radar mod or Golden Instinct to spot them."
        },
        {
          "type": "video",
          "video": {
            "id": "-hWq1QPXTQ8",
            "title": "How To Turn Ayatan Sculptures & Stars Into Endo!!! Warframe!",
            "channel": "Sethbest"
          }
        }
      ]
    },
    {
      "id": "arbitrations",
      "title": "Arbitrations — the veteran Endo engine",
      "blocks": [
        {
          "type": "p",
          "text": "Arbitrations (\"Elite Alerts\") are the #1 sustained Endo farm in 2026. One node is active at a time, rotating hourly, and unlocks once you've completed the Eris Junction on Pluto (Focus-Lens access) — the old \"clear every node\" requirement is gone. Each qualifying rotation drops a flat Endo lump plus one guaranteed Vitus Essence, and off-rolls hand out Ayatan Sculptures you dissolve for even more."
        },
        {
          "type": "kv",
          "kv": [
            {
              "k": "Rotation A",
              "v": "900 Endo @ ~44%"
            },
            {
              "k": "Rotation B",
              "v": "1,200 Endo @ ~44.5%"
            },
            {
              "k": "Rotation C",
              "v": "1,500 Endo @ ~35% (buffed from 33% in a 2026 update)"
            },
            {
              "k": "Rotation pattern",
              "v": "AABBCC… then C repeats forever — sit on C for the 1,500 tier"
            },
            {
              "k": "Realistic output",
              "v": "~5,000–10,000 Endo/hr, higher once you socket & sell the sculptures"
            }
          ]
        },
        {
          "type": "p",
          "text": "This was rebalanced, not nerfed. The \"Arbitrations Revisited\" pass lowered Endo's share of the pool but switched to AABBCC and doubled reward frequency (a roll every 5 Defense waves instead of 10), so hourly Endo held or improved. A 2026 tweak even raised Rotation C's chance and Vitus x3 odds."
        },
        {
          "type": "steps",
          "steps": [
            {
              "h": "Pick the active node and mode",
              "p": "Survival is the community \"kill and chill\" favorite (most continuous spawns and floor Endo); Defense is a close, more predictable second (a guaranteed roll every 5 waves); Disruption front-loads high rotations fastest for active players — one roll per conduit defended, up to 4 per round."
            },
            {
              "h": "Bring a tanky, self-sufficient loadout",
              "p": "Arbitration Shield Drones make a nearby enemy damage-immune until the drone dies, and there is no free self-revive — you collect 5 Resurgence Tokens to revive, each stacking a health/shield/energy debuff."
            },
            {
              "h": "Stay through multiple rotations",
              "p": "Push past wave 20 / the AABB block to loop endless Rotation C = repeating 1,500-Endo table rolls. Let your pet vacuum floor Endo and stars between rounds."
            },
            {
              "h": "Cash out",
              "p": "Extract, socket any sculptures that dropped, and dissolve them at Maroo for the bonus."
            }
          ]
        },
        {
          "type": "info",
          "title": "Drones don't drop Endo",
          "text": "Shield Drones only have a 6% chance to drop 1 Vitus Essence (despawns after 5 min) — not Endo. Loose Endo comes from normal enemy drops plus the flat rotation table. Boosters do nothing for that table Endo."
        },
        {
          "type": "video",
          "video": {
            "id": "Oaa3EdSFpiE",
            "title": "Arbitrations: Vitus Essence, Rolling Guard, Aura FORMA - Warframe Guide",
            "channel": "KardinalxSin"
          }
        }
      ]
    },
    {
      "id": "passive",
      "title": "Passive & incidental Endo",
      "blocks": [
        {
          "type": "p",
          "text": "Plenty of Endo accumulates without a dedicated farm — and there's probably a big pile of it sitting in your mod collection right now."
        },
        {
          "type": "list",
          "ordered": false,
          "items": [
            "**Dissolving duplicate mods** — Orbiter › Mods segment. Unranked values are fixed by rarity: Common 5, Uncommon 10, Rare 15, Legendary ~20. The \"Quick Select\" bulk tool (bottom-right, added in Update 38.5) mass-selects unranked mods by rarity with a keep-N field, auto-skips ranked/Legendary/Riven mods, and confirms by typing \"Fusion.\"",
            "**Daily Sortie** — ~4,000 Endo, but only a ~12% roll on the reward table (roughly one payout every ~8 days, not daily).",
            "**Weekly Archon Hunt** — 8,000 Endo at ~12.1%; you run it for the guaranteed Archon Shard.",
            "**Teshin's Steel Path Honors** — a 30,000-Endo bundle for 150 Steel Essence, but it's a rotating slot that surfaces only ~1 week in 8.",
            "**Palladino** — 10 Riven Slivers → 6,000 Endo, once per week.",
            "**Granum Void** — 200 / 400 / 600 Endo by tier."
          ]
        },
        {
          "type": "warn",
          "title": "Never sell mods for credits, and never dissolve the wrong things",
          "text": "Selling mods for CREDITS pays trash — always dissolve for Endo, and farm [credits](/guides/credits) separately (one Index run ≈ 250k). Dissolving a RANKED mod refunds only 75% of the Endo you invested — a net loss — so never rank a mod up just to dissolve it. And never dissolve a tradeable/valuable mod or a [Riven](/guides/riven): a Riven is worth far more as platinum, and even as Endo only pays big if you've already sunk many Kuva rerolls into it (+200 Endo per reroll)."
        },
        {
          "type": "tip",
          "title": "The mod-dissolve yield is overstated everywhere",
          "text": "You'll see \"100k–200k from one cleanup\" — that's inflated 5–15x. A hoarder with thousands of dupes reported only ~10–14k Endo from a full purge. Treat dissolving as free cleanup worth a few thousand Endo, not a headline farm."
        }
      ]
    },
    {
      "id": "spend",
      "title": "Where your Endo goes",
      "blocks": [
        {
          "type": "p",
          "text": "Endo only leaves your pool one way: ranking up mods. Every rank costs Endo + credits and raises both the mod's effect and its drain. The costs scale brutally at the top end, which is why Endo always feels scarce."
        },
        {
          "type": "kv",
          "kv": [
            {
              "k": "Rank-10 Primed mod",
              "v": "~140,000 Endo total (top ranks cost 40k+ each)"
            },
            {
              "k": "Full Primed / Archon / Galvanized collection",
              "v": "hundreds of thousands to over a million Endo"
            },
            {
              "k": "Maxed rank-10 rare",
              "v": "~30,690 Endo to build (dissolves back for ~23k)"
            }
          ]
        },
        {
          "type": "tip",
          "title": "Sometimes a Legendary Core beats farming",
          "text": "A tradeable Legendary Core instantly maxes ANY mod and costs ~60–80 platinum. For a single Primed mod that's often cheaper than farming 40k+ Endo AND the ~2M+ credits the top ranks demand. Buy the Core, save the grind for the rest of your collection."
        },
        {
          "type": "info",
          "title": "Ayatan-to-mod is the cleanest conversion",
          "text": "Because Endo is untradeable, socketed Ayatan Sculptures are effectively a way to bank future mod ranks — hoard sculptures and stars freely (they don't use inventory capacity), then dissolve a stack when you need to max something. There's no practical Endo storage cap."
        },
        {
          "type": "info",
          "title": "Prefer to buy your way past the grind?",
          "text": "You can't buy Endo directly, but you can turn platinum into it cheaply: a heavily-rerolled junk [Riven](/guides/riven) dissolves into thousands of Endo for pocket-change plat, and filled Ayatan sculptures sell on the market. The [Endo Exchange tool](/endo) ranks both routes live by Endo-per-platinum so you can see the cheapest option right now — the flip side of this farming guide."
        }
      ]
    }
  ],
  "faqs": [
    {
      "q": "What is the fastest Endo farm in 2026?",
      "a": "For raw speed with a coordinated premade, the Steel Path Sedna Rathuum arena (Vodyanoi) with a Nekros + Pilfer-Khora + grouping frame and a Mod Drop Chance Booster hits roughly 1,000 Endo/minute — the highest sustained rate. For uncapped solo speed, high-tier 1999/Höllvania bounties (3,300–4,200 Endo rolls, no daily cap) are the community favorite. It's not nerfed, just niche: most casual players use Arbitrations or 1999 instead because the arena is sweaty and needs a premade."
    },
    {
      "q": "What's the best repeatable Endo farm for veterans?",
      "a": "Arbitrations. Each qualifying rotation drops 900/1,200/1,500 Endo (Rot A/B/C), and endless modes let you loop Rotation C for the 1,500 tier indefinitely — roughly 5,000–10,000 Endo/hour, plus Ayatan sculpture off-rolls you dissolve for thousands more, plus guaranteed Vitus Essence. Unlocks after the Eris Junction on Pluto."
    },
    {
      "q": "Best option if I'm solo or don't want a premade?",
      "a": "Arbitrations (Endo + sculptures every rotation), high-tier 1999/Zariman/Sanctum bounties (fast exterminates, up to 3,300–4,200 Endo per reward roll), or Railjack (crate Endo plus scrapping wreckage for ~225 each). All are soloable or pug-friendly."
    },
    {
      "q": "What's the best pre-Steel-Path / early Endo farm?",
      "a": "Deimos/Cambion Drift Tier-5 (L40–60) bounties — run the first ~3 stages for the ~1,000-Endo bundles, then reset. Add 1999 bounties if unlocked and Railjack scrapping, and backfill with dissolving duplicate mods and Maroo's free weekly Ayatan hunt. Arbitrations require the full Star Chart, so they come slightly later."
    },
    {
      "q": "How do Ayatan Sculptures work?",
      "a": "Sculptures have color-coded sockets. You fill Cyan sockets with Cyan Stars and Amber sockets with Amber Stars (permanent once slotted), then dissolve the sculpture at Maroo's Bazaar on Mars for its socketed Endo value — 1,425 (Ayr) up to 3,450 (Anasa). Always socket first: a filled sculpture is worth far more than the empty sculpture plus its loose stars."
    },
    {
      "q": "Should I dissolve Ayatan Stars or socket them?",
      "a": "Socket them. A loose Cyan Star dissolves for only 50 Endo and Amber for 100, but socketing applies the sculpture's multiplier — each Cyan star is worth roughly 350–450 Endo of added dissolve value inside a sculpture. Always fill the sockets before taking it to Maroo."
    },
    {
      "q": "Does Maroo's weekly Ayatan Treasure Hunt give an Anasa?",
      "a": "No. The weekly hunt only gives one of six rotating lesser sculptures on a fixed 6-week cycle (Sah, Ayr, Orta, Vaya, Piv, Valana), topping out at Orta (2,700 socketed). Anasa — the 3,450-Endo flagship — comes from Sorties (28% on the final mission) and Archon Hunts. Still do the weekly every week; it's a few minutes of parkour for a free sculpture."
    },
    {
      "q": "Does a Resource or Drop Chance Booster increase Endo?",
      "a": "No. There is no Endo Booster, and Resource, Drop Chance, Steel Path Drop Chance and Drop Chance Blessing all have zero effect on Endo — it isn't a boostable resource, and boosters never touch end-of-mission rewards. The one exception: in-mission Endo pickups count as MOD drops, so a Mod Drop Chance Booster doubles the Endo you sweep off the floor, which is why the Sedna arena meta stacks it with Steel Path."
    },
    {
      "q": "Do I run bounties on Steel Path for more Endo?",
      "a": "No. 1999, Zariman and Sanctum bounties give the SAME Endo on Normal and Steel Path, so run Normal for speed — SP only adds Steel Essence. The Sedna Rathuum arena is the one farm that specifically wants Steel Path, because its bonus doubles enemy Endo drops."
    },
    {
      "q": "How much Endo do I get from dissolving mods?",
      "a": "Unranked junk mods give tiny fixed amounts — Common 5, Uncommon 10, Rare 15 Endo. It scales with rank because dissolving refunds ~75% of the Endo invested, so a maxed rare or Primed dupe returns hundreds to thousands. The confirm screen shows the exact number. Treat it as free cleanup worth a few thousand Endo, not a farm — and never dissolve tradeable dupes (sell those for platinum) or a Riven."
    },
    {
      "q": "Why do I have tons of Cyan Stars but never enough Amber?",
      "a": "That's by design. Cyan Stars are common (containers, lockers, Kuaka on the Plains); Amber is the bottleneck that limits how many sculptures you can fully socket. Farm Amber from Deimos/Cambion Drift bounties, or manufacture it with the reusable Amber Star blueprint from the Arbitration store (10 Vitus Essence, then 2 Cyan + 1 Vitus + 100k credits each). When Amber-starved, put it into Zambuka/Orta and fully socket cyan-only Ayr."
    },
    {
      "q": "Can I trade or buy Endo?",
      "a": "No — Endo itself is untradeable and can't be sold for credits or bought from other players. It must be earned or converted. But you can spend platinum to get it cheaply: buy a heavily-rerolled junk Riven or a filled Ayatan sculpture and dissolve it. The [Endo Exchange](/endo) ranks those buy routes live by Endo-per-plat."
    }
  ],
  "videos": [
    {
      "id": "wfcARDwh01E",
      "title": "Best ENDO Farms in Warframe 2026 (FAST AND EASY)",
      "channel": "Kryptafy"
    },
    {
      "id": "NyUIIKBlgko",
      "title": "How to Get Endo FAST in Warframe (2026) | Best Farming Spots",
      "channel": "Aethernaut1887"
    },
    {
      "id": "CSSMA_Xhypw",
      "title": "Warframe The BEST Endo Farming Guide for 2026!",
      "channel": "Weazel"
    },
    {
      "id": "O1p72j8qMz4",
      "title": "ALL THE BEST ENDO FARM IN 2026 | UPDATED ENDO FARMING GUIDE",
      "channel": "Grind Hard Squad"
    },
    {
      "id": "ZlkwYJiQjaw",
      "title": "Best Endo Farms 2026 | Max Mods FAST in Warframe",
      "channel": "TrueDripFrame"
    },
    {
      "id": "mPy9vllrNCM",
      "title": "The ULTIMATE Guide to Farming ENDO In Warframe!",
      "channel": "WarframeFlo"
    }
  ],
  "sources": [
    {
      "label": "WARFRAME Wiki — Endo",
      "href": "https://wiki.warframe.com/w/Endo"
    },
    {
      "label": "WARFRAME Wiki — Arbitrations / Rewards",
      "href": "https://wiki.warframe.com/w/Arbitrations/Rewards"
    },
    {
      "label": "WARFRAME Wiki — Ayatan Treasures",
      "href": "https://wiki.warframe.com/w/Ayatan_Treasures"
    },
    {
      "label": "WARFRAME Wiki — Ayatan Treasure Hunt",
      "href": "https://wiki.warframe.com/w/Ayatan_Treasure_Hunt"
    },
    {
      "label": "WARFRAME Wiki — Rathuum (Sedna arena)",
      "href": "https://wiki.warframe.com/w/Rathuum"
    }
  ],
  "related": [
    {
      "label": "Endo Exchange (buy with Platinum)",
      "to": "/endo",
      "icon": "swap-horizontal",
      "note": "Skip the grind — the cheapest Endo-per-plat from rerolled Rivens & Ayatans, ranked live"
    },
    {
      "label": "Modding Guide",
      "to": "/guides/mods",
      "icon": "puzzle",
      "note": "Where all of your Endo actually goes"
    },
    {
      "label": "Riven Mods Explained",
      "to": "/guides/riven",
      "icon": "star-four-points-outline",
      "note": "A junk Riven dissolves into a big Endo lump"
    },
    {
      "label": "Credit Farming",
      "to": "/guides/credits",
      "icon": "circle-multiple-outline",
      "note": "The other half of the modding bill"
    },
    {
      "label": "Steel Path Guide",
      "to": "/guides/steel-path",
      "icon": "fire",
      "note": "Doubles floor Endo in the Sedna Rathuum arena"
    },
    {
      "label": "Archon Shards",
      "to": "/guides/archon-shards",
      "icon": "cards-diamond-outline",
      "note": "The weekly hunt that also pays 8,000 Endo"
    }
  ],
  "updated": "2026-07-18"
}

export default guide
