// Auto-generated Warframe Knowledge Center guide content.
// Drafted grounded in r/Warframe research (reddit API) + the subreddit wiki FAQ,
// then adversarially fact-checked for evergreen accuracy. Embedded video ids were
// verified live via YouTube oEmbed. Edit freely — this is the single source for
// the /guides/standing page (rendered by <GuideArticle>).
import type { Guide } from './types'

const guide: Guide = {
  "slug": "standing",
  "eyebrow": "Knowledge Center · Standing & Syndicates",
  "title": "Standing & Syndicate Guide",
  "lede": "Standing is Warframe's reputation currency — the gate on augment mods, Amp parts, arcanes and Nitain. Learn the daily cap, the six main syndicates, every open-world faction, and how to hit your ceiling in minutes instead of missions.",
  "category": "farming",
  "readMins": 9,
  "stats": [
    {
      "num": "6",
      "label": "main syndicates",
      "tone": "gold"
    },
    {
      "num": "16,000",
      "label": "base daily standing cap",
      "tone": "good"
    },
    {
      "num": "5",
      "label": "ranks to max each",
      "tone": "alt"
    },
    {
      "num": "00:00 UTC",
      "label": "daily standing reset",
      "tone": "good"
    }
  ],
  "sections": [
    {
      "id": "how-it-works",
      "title": "How standing and the daily cap work",
      "blocks": [
        {
          "type": "p",
          "text": "**Standing** (also called **reputation** or **rep**) is the loyalty currency you earn with each faction in Warframe. Spend it and you unlock **Warframe/weapon augment mods**, syndicate weapons and skins, Operator **Amp** parts, **arcanes**, cosmetics and more. Unlike credits or platinum, you can't trade standing — you earn it by playing, and every faction tracks it separately."
        },
        {
          "type": "p",
          "text": "The catch is the **daily standing cap**. Each day you can only bank so much per faction, and the ceiling scales with your **Mastery Rank**: `16,000 + (500 × MR)`. So even a brand-new MR0 player banks 16,000 per syndicate per day, an MR10 caps at 21,000, and an MR30 caps at 31,000. Raising your [Mastery Rank](/guides/mastery-rank) is the single biggest lever on how fast you progress every faction at once."
        },
        {
          "type": "kv",
          "kv": [
            {
              "k": "Daily cap formula",
              "v": "16,000 + (500 × Mastery Rank)"
            },
            {
              "k": "Cap examples",
              "v": "16,000 at MR0 · 21,000 at MR10 · 31,000 at MR30"
            },
            {
              "k": "Resets",
              "v": "Daily at 00:00 UTC (midnight GMT)"
            },
            {
              "k": "Tracked",
              "v": "Separately for every syndicate"
            },
            {
              "k": "To start earning",
              "v": "Pledge to the faction, then equip its Sigil"
            }
          ]
        },
        {
          "type": "tip",
          "text": "The cap is **use-it-or-lose-it** — unspent daily earning does not roll over. Since each faction has its own cap, a few minutes every day across several factions beats a single marathon session. Set a habit around the 00:00 UTC reset."
        }
      ]
    },
    {
      "id": "six-syndicates",
      "title": "The six main syndicates",
      "blocks": [
        {
          "type": "p",
          "text": "Accessed from the **Syndicate console** in your Orbiter (or at any Relay), the six main syndicates are the classic reputation grind. **Pledge** to one (free), then equip its **Sigil** — a cosmetic emblem worn on your Warframe. From then on, a share of the affinity you earn in missions converts into that syndicate's standing automatically."
        },
        {
          "type": "table",
          "table": {
            "columns": [
              "Syndicate",
              "Lore / theme"
            ],
            "rows": [
              [
                "Steel Meridian",
                "Grineer defectors who shield ordinary civilians"
              ],
              [
                "Arbiters of Hexis",
                "Discipline and the Tenno's pursuit of self-mastery"
              ],
              [
                "Cephalon Suda",
                "Preserving knowledge, data and memory"
              ],
              [
                "The Perrin Sequence",
                "Corpus reformists chasing economic balance"
              ],
              [
                "Red Veil",
                "Zealots who purge corruption through blood"
              ],
              [
                "New Loka",
                "Restoring a 'pure' Earth and humanity"
              ]
            ],
            "note": "Every syndicate sells its own set of Warframe/weapon augment mods, syndicate weapons and skins, relic packs, sculptures and Captura scenes. Pick your first faction for the specific augments you want — check the in-game console or the wiki for the current, exact reward list."
          }
        },
        {
          "type": "warn",
          "text": "The six sit in an **allied/opposed web**: earning standing with one slowly **erodes** standing with its rivals. That's why a returning player sometimes sees a faction quietly drop even though they never touched it. It's normal — the console shows the exact +/− ripple of your equipped Sigil. Most players main one or two factions, then swap Sigils to top up the rest."
        }
      ]
    },
    {
      "id": "earning-main",
      "title": "Sigils, medallions and sacrifices",
      "blocks": [
        {
          "type": "p",
          "text": "There are three ways to feed a main syndicate, and stacking them is how veterans blitz ranks:"
        },
        {
          "type": "steps",
          "steps": [
            {
              "h": "Wear the right Sigil",
              "p": "Standing scales with affinity, so any high-kill mission feeds it — including affinity shared from squadmates' kills near you. Equip the Sigil for the faction you want *before* you queue, or that XP is wasted."
            },
            {
              "h": "Hunt Syndicate Medallions",
              "p": "Each faction posts daily missions on the console. Their tilesets hide collectible medallions; grab them, then donate them at the syndicate for a large standing chunk. Crucially, medallion donations can push you past your normal daily cap — the fastest way to rank up."
            },
            {
              "h": "Pay the sacrifice to rank up",
              "p": "Each new rank needs both enough total standing and a one-time 'sacrifice' of items the faction demands. Early ranks want common resources; higher ranks ask for rare mods, resources or a syndicate-specific item. The console lists exactly what's required."
            }
          ]
        },
        {
          "type": "tip",
          "text": "**Hoard your medallions.** Because donations can exceed the daily cap, save a stack and dump them right after you pay a rank sacrifice — you'll leap toward the next tier in one go. A loot-radar or treasure-detector mod makes hidden medallions trivial to find."
        },
        {
          "type": "info",
          "text": "Syndicate **augment mods are tradeable**, which makes maxed factions a steady platinum faucet. Learn the trading loop in the [Platinum guide](/guides/platinum), price your augments on the [market screener](/screener), and catch buy/sell spreads with the [flip finder](/flip)."
        }
      ]
    },
    {
      "id": "open-worlds",
      "title": "Open-world and hub factions",
      "blocks": [
        {
          "type": "p",
          "text": "The open-world factions work differently: instead of Sigils and affinity, you **turn in resources** — fish, cut gems, conservation tags, tokens and bounty rewards — to their vendors. They still obey the same `16,000 + 500 × MR` daily cap, tracked independently, so you can max several in one day."
        },
        {
          "type": "table",
          "table": {
            "columns": [
              "Hub · open world",
              "Faction",
              "You turn in",
              "Standing buys (general)"
            ],
            "rows": [
              [
                "Cetus · Plains of Eidolon",
                "Ostron",
                "Bounties, fish, cut gems",
                "Zaw parts (Hok), fishing & mining gear, masks and scenes"
              ],
              [
                "Fortuna · Orb Vallis",
                "Solaris United",
                "Bounties, fish, gems, debt-bonds",
                "Kitgun parts (Rude Zuud), MOA companions (Legs), gear"
              ],
              [
                "Necralisk · Cambion Drift",
                "Entrati",
                "Bounties, fish, conservation tags, gems, tokens",
                "Mods, arcanes, Necramech gear, cosmetics"
              ],
              [
                "Sanctum Anatomica",
                "Cavia",
                "Netracells and Sanctum bounties",
                "Whispers-in-the-Walls arcanes and mods"
              ],
              [
                "Höllvania (1999)",
                "The Hex",
                "1999 activities and bounties",
                "New arcanes, weapons, mods, cosmetics"
              ]
            ],
            "note": "Reward lists shift with each update — confirm the live offerings on the wiki. For the raw materials themselves, see the Resources guide."
          }
        },
        {
          "type": "tip",
          "text": "When you're near cap, use the **token / wisp system** at these hubs (Deimos and the newer worlds especially). You convert overflow resources into tokens you *hold*, then redeem them on a later day — so a great fishing or mining haul is never wasted. That quality-of-life fix is exactly why the community cheered 'thank you for standing tokens.'"
        },
        {
          "type": "p",
          "text": "Open-world resources also feed the [Resources guide](/guides/resources) crafting economy, and Eidolon/Orb hunts tie directly into the Operator factions below."
        }
      ]
    },
    {
      "id": "other-factions",
      "title": "Other standing vendors worth knowing",
      "blocks": [
        {
          "type": "p",
          "text": "Beyond the big syndicates, several specialist factions run their own standing tracks — this is where Operator **Amps**, **arcanes** and Necramech gear come from."
        },
        {
          "type": "table",
          "table": {
            "columns": [
              "Faction",
              "Where",
              "Earn by",
              "Spend on"
            ],
            "rows": [
              [
                "Cephalon Simaris",
                "Relays (Sanctuary)",
                "Synthesis-scanning targets",
                "Exclusive mods, weapon & utility blueprints, Sanctuary scanner widgets"
              ],
              [
                "The Quills",
                "Cetus (Onkko)",
                "Trading Eidolon shards",
                "Amp parts, arcanes, focus lenses"
              ],
              [
                "Vox Solaris",
                "Fortuna (Little Duck)",
                "Orb-fight and Vallis materials",
                "Amp parts, Operator arcanes"
              ],
              [
                "The Holdfasts",
                "Zariman (Chrysalith)",
                "Zariman missions → Voidplumes",
                "Arcanes, mods, cosmetics"
              ],
              [
                "Necraloid",
                "Necralisk",
                "Necramech and Deimos activities",
                "Necramech mods and parts"
              ],
              [
                "Ventkids",
                "Fortuna",
                "K-Drive tricks and races",
                "K-Drive parts and cosmetics"
              ],
              [
                "Conclave",
                "Relays (Teshin)",
                "PvP matches",
                "PvP mods, cosmetics, Captura"
              ]
            ],
            "note": "Teshin also runs the Steel Path shop, but that spends Steel Essence (a currency), not standing — see the Steel Path guide."
          }
        },
        {
          "type": "info",
          "text": "Building an Amp for Eidolon hunting? The Quills and Vox Solaris are your suppliers, and both connect to your Operator progression. Pair this with the [Focus guide](/guides/focus) and the [Eidolon guide](/guides/eidolon)."
        }
      ]
    },
    {
      "id": "fastest-cap",
      "title": "Fastest ways to cap your standing",
      "blocks": [
        {
          "type": "p",
          "text": "There's no exploit needed — just efficient routing. The reliable, evergreen playbook:"
        },
        {
          "type": "list",
          "items": [
            "**Equip the correct Sigil first.** Standing follows affinity, so a strong high-kill endless (or a fast affinity node) can cap — or nearly cap — a main syndicate in a single run. Never grind Sigil-less.",
            "**Run the syndicate's daily missions for medallions**, then donate them — donations bypass the daily cap, so this is your ceiling-breaker.",
            "**Pre-farm open-world turn-ins.** Bank fish, gems and tags during a relaxed session, then dump them at reset for an instant cap; convert overflow to tokens so nothing spoils.",
            "**Rotate factions daily.** Because each caps independently, a 15-minute loop across two or three factions racks up far more total standing than hammering one.",
            "**Raise Mastery Rank.** Every MR adds 500 to every faction's daily cap — the only permanent way to lift your whole ceiling."
          ]
        },
        {
          "type": "tip",
          "text": "You can set a Sigil's **opacity to near-zero** in the Arsenal so it earns standing without cluttering your fashion. Great for keeping a farming Sigil on at all times."
        }
      ]
    },
    {
      "id": "nightwave",
      "title": "Nightwave: adjacent, but not syndicate standing",
      "blocks": [
        {
          "type": "p",
          "text": "**Nightwave** confusingly also grants 'standing,' but it's a separate, seasonal system — think of it as a rotating challenge track. You complete **Acts** (daily, weekly and elite weekly challenges) to fill a rank ladder, and each rank hands out rewards plus **Nightwave Cred** to spend in its offerings shop."
        },
        {
          "type": "list",
          "items": [
            "**Daily Acts** are small and refresh every day; **weekly and elite weekly Acts** are worth far more standing — prioritize those.",
            "**Cred shop staples** are some of the best value in the game: **Nitain Extract**, **Orokin Reactors/Catalysts** ('potatoes'), **Forma**, **Kuva**, Aura mods and the season's exclusive cosmetics.",
            "You keep ranking past the final tier into repeating **Prestige** ranks that keep paying Cred.",
            "Between seasons, a **Nightwave: Intermission** keeps the shop and your leftover Cred usable, so a hard reset never strands you."
          ]
        },
        {
          "type": "warn",
          "text": "Season-exclusive cosmetics (and occasionally a frame) can vanish for a long time when a season ends, which is why players scramble in the final week. Don't panic-grind everything — you rarely need every Act to reach the top rank — but do spend your Cred on Nitain and potatoes before a season closes."
        }
      ]
    },
    {
      "id": "pitfalls",
      "title": "Common questions and pitfalls",
      "blocks": [
        {
          "type": "info",
          "text": "**\"I mercy-killed a Grineer and my star chart turned red\"** — that's not a syndicate. You created a **Kuva Lich**, an enemy nemesis that taxes the nodes it controls (shown in red). It's a completely separate system; head to the [Kuva & Lich guide](/guides/kuva) to hunt it down."
        },
        {
          "type": "list",
          "items": [
            "**Don't grind without a Sigil.** Affinity earned Sigil-less is standing left on the table.",
            "**Don't fear the opposition drop.** Losing a little with a rival is by design; you can rank every faction eventually by rotating Sigils and topping rivals back up.",
            "**Don't let overflow rot.** Past the cap, convert open-world resources to tokens and save medallions to donate later.",
            "**Don't confuse the currencies.** Syndicate standing, Nightwave Cred, and Steel Essence are three different things — spend each in its own shop."
          ]
        },
        {
          "type": "p",
          "text": "For the wider progression picture — where standing farming fits alongside credits, relics and Mastery — see the [Progression guide](/guides/progression) and the curated [community tools directory](/tools)."
        }
      ]
    }
  ],
  "faqs": [
    {
      "q": "How is the daily standing cap calculated in Warframe?",
      "a": "The cap is `16,000 + (500 × your Mastery Rank)`, applied separately to each faction and reset daily at 00:00 UTC. So even a brand-new MR0 player banks 16,000 per syndicate per day, an MR10 caps at 21,000 and an MR30 caps at 31,000. Raising your [Mastery Rank](/guides/mastery-rank) is the only way to permanently lift the ceiling for every faction at once."
    },
    {
      "q": "What's the fastest way to farm syndicate standing?",
      "a": "Equip that faction's Sigil, run a high-kill affinity mission to hit the cap fast, and hoard Syndicate Medallions from the daily missions. Medallion donations can push you past the daily cap, so saving a stack and dumping it right after a rank sacrifice is the quickest way to a new rank."
    },
    {
      "q": "Can I max out all six main syndicates?",
      "a": "Yes, eventually. The six sit in an allied/opposed web, so earning with one slowly lowers its rivals — but you simply swap Sigils and top the others back up over time. Plan around the opposition and you can reach max rank with every faction."
    },
    {
      "q": "Is Nightwave standing the same as syndicate standing?",
      "a": "No. Nightwave is a separate seasonal challenge track: you complete daily, weekly and elite weekly Acts to earn Nightwave rank and Nightwave Cred. Spend that Cred on Nitain, Orokin Reactors/Catalysts, Forma, Kuva and cosmetics — it has nothing to do with your six-syndicate reputation."
    },
    {
      "q": "Why did my standing drop with a syndicate I didn't play?",
      "a": "Because of syndicate opposition. Gaining reputation with one faction erodes it with its rivals, based on the Sigil you were wearing. It's intended — the Syndicate console shows the exact +/− each Sigil applies, so you can plan which factions to rank together."
    },
    {
      "q": "Where do I get Operator Amp parts and arcanes?",
      "a": "From the specialist standing factions: The Quills in Cetus (trade Eidolon shards) and Vox Solaris in Fortuna (from Orb fights and Vallis materials) sell Amp parts and arcanes. Pair this with the [Focus guide](/guides/focus) and [Eidolon guide](/guides/eidolon) to build a hunting setup."
    },
    {
      "q": "I executed a Grineer and my whole planet turned red — is that a syndicate thing?",
      "a": "No. Mercy-killing a Kuva Larvling spawns a Kuva Lich, an enemy nemesis that seizes nodes and marks them red on your star chart. It's unrelated to syndicate standing — see the [Kuva & Lich guide](/guides/kuva) to defeat it and reclaim your nodes."
    },
    {
      "q": "Are syndicate rewards worth platinum?",
      "a": "Very much — syndicate augment mods are tradeable and stay in steady demand, making maxed factions a reliable plat income. Learn the loop in the [Platinum guide](/guides/platinum) and price your mods with the [market screener](/screener) and [flip finder](/flip)."
    }
  ],
  "videos": [
    {
      "id": "d_q95Xf6Ohs",
      "title": "You Have Been Farming Syndicate Standing In WARFRAME ALL WRONG!",
      "channel": "iFlynn"
    },
    {
      "id": "xfUY8DaZVTw",
      "title": "MAX YOUR STANDINGS NOW! - FASTEST METHODS FOR ALL SYNDICATES [WARFRAME]",
      "channel": "TRiX_VS"
    },
    {
      "id": "whtYsyH3N9I",
      "title": "Warframe | How To Farm Syndicate Standing Quick and Easy - Plumes and Medallions",
      "channel": "1ManArmyYigit"
    },
    {
      "id": "Vt-albA4ZhA",
      "title": "How to Max Out EVERY Syndicate Standing FAST in Warframe (Complete Guide)",
      "channel": "Chapu"
    }
  ],
  "sources": [
    {
      "label": "r/Warframe — new wiki showcase (wiki.warframe.com)",
      "href": "https://reddit.com/r/Warframe/comments/1ios9qf/just_wanted_to_share_how_sexy_the_new_wiki_is/"
    },
    {
      "label": "r/Warframe — Nightwave ended too soon (rank/FOMO)",
      "href": "https://reddit.com/r/Warframe/comments/1kpzgsq/im_sorry_everyone_i_failed_all_of_you/"
    },
    {
      "label": "r/Warframe — final-hour Nightwave Cred grind (Nitain/potatoes)",
      "href": "https://reddit.com/r/Warframe/comments/1sgqki4/i_forgor/"
    },
    {
      "label": "r/Warframe — Nightwave weekly Act discussion (DE replied)",
      "href": "https://reddit.com/r/Warframe/comments/q6fq49/pov_you_have_a_nightwave_act_to_bullet_jump_150/"
    },
    {
      "label": "Official Warframe Wiki",
      "href": "https://wiki.warframe.com/"
    }
  ],
  "related": [
    {
      "label": "Focus & Operator Guide",
      "to": "/guides/focus",
      "icon": "school",
      "note": "Amps, lenses and Quills/Vox Solaris standing"
    },
    {
      "label": "Eidolon Hunting Guide",
      "to": "/guides/eidolon",
      "icon": "weather-night",
      "note": "Shards feed Quills standing for Amps"
    },
    {
      "label": "Kuva & Lich Guide",
      "to": "/guides/kuva",
      "icon": "skull",
      "note": "The red star chart explained"
    },
    {
      "label": "Platinum Guide",
      "to": "/guides/platinum",
      "icon": "diamond-stone",
      "note": "Trade syndicate augments for plat"
    },
    {
      "label": "Resources Guide",
      "to": "/guides/resources",
      "icon": "pickaxe",
      "note": "Open-world turn-in materials"
    },
    {
      "label": "Community Tools",
      "to": "/tools",
      "icon": "tools",
      "note": "Wiki, Overframe and market trackers"
    }
  ],
  "updated": "2026-07-18"
}

export default guide
