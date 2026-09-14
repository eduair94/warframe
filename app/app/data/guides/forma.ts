// Reviewed against official announcements, patch notes and drop tables.
// Rendered by the shared <GuideArticle> component.
import type { Guide } from './types'

const guide: Guide = {
  slug: 'forma',
  eyebrow: 'Knowledge Center · Forma Farming',
  title: 'How to Farm Forma: Relics, Crafting & Plague Star',
  lede: 'Farm Forma Blueprints from relics that contain them, choose the right refinement for their reward slot, and keep the Foundry running. Compare blueprint farming with built Forma, including the September 2026 Plague Star event, before spending your time or Platinum.',
  category: 'farming',
  readMins: 9,
  updated: '2026-09-14',
  stats: [
    { num: '1', label: 'reward selection per player per opened relic', tone: 'good' },
    { num: '2×', label: 'blueprints in an Uncommon Forma reward', tone: 'alt' },
    { num: '23 h', label: 'Foundry build time for standard Forma', tone: 'gold' },
    { num: '3', label: 'Plague Star bounty tiers to compare' },
  ],
  sections: [
    {
      id: 'why-zero',
      title: 'Why can you open relics and get no Forma?',
      blocks: [
        { type: 'p', text: 'A Forma reward is random. Several unsuccessful openings can happen even when you choose a suitable relic and squad. Check the actual reward list: **not every relic contains Forma**, and a blueprint is not the same as a built Forma.' },
        { type: 'list', items: [
          '**Check the slot and quantity.** Forma Blueprints appear in Common and Uncommon relic reward slots. Uncommon Forma rewards give two blueprints, following [Update 36.1](https://www.warframe.com/en/patch-notes/pc/36-1-0). Read the quantity on the particular relic you are opening.',
          '**Match refinement to the slot.** Intact favors a Common reward; refining increases the chance of an Uncommon reward. Check the reward slot before spending Void Traces.',
          '**Use a squad when you want more choices.** Eligible players can choose from the rewards revealed by teammates. Those extra rolls help only when a teammate opens a relic with a reward you want; public matchmaking cannot guarantee Forma.',
        ] },
        { type: 'info', title: 'A practical starting point', text: 'Use the [Forma relic finder](/forma-relics) to find a suitable relic and its farming locations. Keep a Common-slot Forma relic Intact, join a fissure you can finish reliably, and start crafting when you have a blueprint.' },
      ],
    },
    {
      id: 'plague-star-2026',
      title: 'Plague Star 2026: deadline, requirements and rewards',
      blocks: [
        { type: 'p', text: '**Reviewed September 14, 2026:** [Operation: Plague Star](https://www.warframe.com/en/news/operation-plague-star-2026) is available on all platforms until **September 23, 2026 at 10 a.m. ET (14:00 UTC)**. Start Konzu’s bounty in Cetus to earn Operational Supply Standing.' },
        { type: 'table', table: {
          columns: ['Tier', 'Requirements', 'Base Standing + completion bonus'],
          rows: [
            ['1', 'No prerequisites', '1025 + 25'],
            ['2', '1 Eidolon Phylaxis + 1 Infested Catalyst', '3200 + 75'],
            ['3', 'Tier 2 consumables + Steel Path eligibility', '3800 + 100'],
          ],
          note: 'The completion bonus is separate from the base reward. Choose a tier your squad can complete consistently.',
        } },
        { type: 'p', text: 'Nakak’s announced additions include **built Umbra Forma**, three Sigils and the Two-Handed Nikana Maligna Skin. Check her current offerings for the Forma variant you need, its price, rank requirement and purchase limit before grinding. The announcement does not specify those shop details; older event prices do not establish the 2026 cost.' },
      ],
    },
    {
      id: 'relic-method',
      title: 'How to farm Forma Blueprints from relics',
      blocks: [
        { type: 'steps', steps: [
          { h: 'Choose a relic and its refinement', p: 'Inspect its Forma reward slot first. Keep Common-slot relics Intact if Forma is your main target. For an Uncommon slot, weigh the improved chance against the Void Traces you could use for another reward. Vaulted relics already in your inventory can still be opened.' },
          { h: 'Open your relic and qualify for a reward', p: 'Select a matching Void Fissure and equip a relic. Collect **10 Reactant** before completing the mission or the reward interval. Bring your own relic and finish its opening requirements to choose from the squad’s revealed rewards.' },
          { h: 'Choose one reward, then repeat', p: 'Each eligible player chooses **one reward** from the revealed choices. If that reward is a two-blueprint Forma bundle, you receive two blueprints. You do not receive all four squad rewards, even if every relic reveals Forma.' },
          { h: 'Compare missions by completed openings', p: 'A quick Capture or Exterminate fissure can suit short sessions. Endless fissures let you open more relics without returning to the Orbiter; equip a fresh relic for each interval. Choose an available mission your squad clears reliably while collecting Reactant. Endless is not automatically faster.' },
        ] },
        { type: 'table', table: {
          columns: ['Refinement', 'One Common slot', 'One Uncommon slot', 'Void Traces'],
          rows: [
            ['Intact', '25.33%', '11%', '0'],
            ['Exceptional', '23.33%', '13%', '25'],
            ['Flawless', '20%', '17%', '50'],
            ['Radiant', '16.67%', '20%', '100'],
          ],
          note: 'Per-slot probabilities, not a squad guarantee. If a relic lists Forma in multiple slots, consider every listed Forma reward and its quantity.',
        } },
        { type: 'p', text: 'The [official PC drop tables](https://www.warframe.com/droptables) list individual relic rewards and probabilities. The [Forma relic finder](/forma-relics) helps locate farming nodes; check the in-game reward preview before consuming a relic. For refinement and fissure basics, see [Relics & Void Traces](/guides/relics).' },
      ],
    },
    {
      id: 'no-relics',
      title: 'Getting Forma without opening relics',
      blocks: [
        { type: 'p', text: 'Separate **built Forma** from **Forma Blueprints** when comparing rewards. Built Forma is ready to use; a blueprint still needs resources and Foundry time. Also check the exact variant: standard, Omni, Umbra and Stance Forma serve different purposes.' },
        { type: 'table', table: {
          columns: ['Route', 'What to check', 'When it helps'],
          rows: [
            ['In-game Market', 'The standard 3 Forma Bundle is listed at 35 Platinum; check the final price before purchase.', 'You need built Forma immediately and have budgeted the Platinum.'],
            ['Nightwave', 'Inspect the current reward track for a Forma Bundle and its actual rank.', 'You are already completing challenges; a past season’s reward rank may differ.'],
            ['Sorties and other reward pools', 'Read the current reward list and distinguish a random chance from a guaranteed reward.', 'You also want the other rewards. Do not plan a fixed number of runs around a lucky drop.'],
            ['Event offerings', 'Read the dated Plague Star section above, then inspect Nakak’s shop.', 'You can earn event Standing during its limited availability.'],
          ],
          note: 'The Market bundle was introduced in Specters of the Rail. Seasonal rewards and event inventories need a current in-game check.',
        } },
        { type: 'tip', title: 'Plan the cost before buying', text: 'If you trade for Platinum, compare the time needed to earn it with opening relics and waiting for the Foundry. Keep enough for other priorities, such as inventory slots. Our [Platinum guide](/guides/platinum) covers trading options.' },
      ],
    },
    {
      id: 'bulk',
      title: 'How to build a useful Forma reserve',
      blocks: [
        { type: 'list', items: [
          '**Keep the Foundry active when you need stock.** Standard Forma takes 23 hours. Claiming the completed item and starting the next craft at your usual login time makes a roughly daily supply practical; it does not start itself.',
          '**Keep blueprints and resources ahead of your next build.** A large blueprint inventory alone does not produce usable Forma. Check your supply of all four crafting resources before a long relic session.',
          '**Finish one planned loadout first.** Budget the polarities it actually needs, then build a reserve for the next item. Spending Forma on every newly acquired weapon can leave your main loadout unfinished.',
          '**Compare built rewards with crafting.** An event or Market purchase can bypass Foundry time, but check its current cost and conditions. Inspect the shop before calculating how many Forma you could obtain with your Standing.',
        ] },
      ],
    },
    {
      id: 'build',
      title: 'Forma crafting recipe and how to apply it',
      blocks: [
        { type: 'p', text: 'Each standard Forma craft consumes **one Forma Blueprint** plus the resources below. The [Warframe Community Developers item data](https://github.com/WFCD/warframe-items/blob/master/data/json/Misc.json) records this recipe; [Update 27.3](https://www.warframe.com/en/patch-notes/pc/27-3-0) established the 23-hour build time.' },
        { type: 'table', table: {
          columns: ['Ingredient or cost', 'For one Forma'],
          rows: [
            ['Credits', '35,000'],
            ['Morphics', '1'],
            ['Neural Sensors', '1'],
            ['Neurodes', '1'],
            ['Orokin Cell', '1'],
            ['Build time', '23 hours'],
          ],
          note: 'Two Forma Blueprints require two separate crafts and twice these resources. The blueprint is consumed when crafting.',
        } },
        { type: 'p', text: 'To polarize eligible equipment, open **Arsenal → Upgrade → Actions → Polarize**. Choose the slot and intended polarity carefully, then review the confirmation. Standard Forma can add, change or remove a polarity and resets the item’s rank. A matching polarity reduces the drain of a normal Mod; Aura and Stance slots affect capacity differently.' },
        { type: 'warn', title: 'Confirm the polarity before spending Forma', text: 'Applying Forma consumes it. If you choose a polarity by mistake, [Warframe Support’s Polarization FAQ](https://support.warframe.com/hc/en-us/articles/200240380-Polarization-and-Forma-FAQ) describes a one-time correction service per account: report the error immediately and avoid polarizing that item again while awaiting Support. Relevel in suitable missions afterward; the number of runs depends on your setup.' },
      ],
    },
    {
      id: 'variants',
      title: 'Standard, Omni, Umbra and Stance Forma',
      blocks: [
        { type: 'table', table: {
          columns: ['Variant', 'Main purpose', 'Before you spend it'],
          rows: [
            ['Standard Forma', 'Choose a normal polarity for a slot on eligible equipment.', 'Plan the Mod you will put there and the other configurations you use.'],
            ['Omni Forma', 'Apply a Universal Polarity to a Mod slot, except for Umbra polarity matching.', 'Formerly Aura Forma; Update 38.5 expanded it beyond Aura slots.'],
            ['Umbra Forma', 'Apply the Umbra polarity for compatible Umbral or Sacrificial Mods.', 'Reserve it for a build that benefits from those Mods.'],
            ['Stance Forma', 'Give the melee Stance slot a Universal Polarity.', 'Useful when swapping Stances with different polarities.'],
          ],
        } },
        { type: 'p', text: '[Techrot Encore’s patch notes](https://www.warframe.com/en/patch-notes/pc/38-5-0) explain the Omni Forma change and list Omni Forma Blueprints in Temporal Archimedea reward pools. Check the exact item name and reward pool when looking for a variant.' },
      ],
    },
    {
      id: 'how-many',
      title: 'How many Forma does your build need?',
      blocks: [
        { type: 'p', text: 'There is no universal Forma count for a weapon or Warframe. It depends on the equipment’s existing polarities, the Mods and ranks you intend to use, its capacity upgrades and whether you need several configurations. Arcanes do not consume Mod capacity.' },
        { type: 'steps', steps: [
          { h: 'Plan the complete Mod setup', p: 'Use the Mod ranks you intend to reach. Check whether a Reactor or Catalyst and any required slot unlocks are already installed; Forma does not replace them.' },
          { h: 'Choose the polarity that solves a real capacity shortage', p: 'Prioritize a high-drain Mod you expect to keep. Check your other configurations before changing the slot: a polarity that helps one build may restrict another.' },
          { h: 'Apply, relevel and test before adding more', p: 'Stop when the build fits and performs as intended. Some equipment has special rank progression after Forma; check that item’s rules separately from its immediate Mod capacity needs.' },
        ] },
        { type: 'p', text: 'For the larger build plan, continue with [How to Build a Warframe or Weapon](/guides/builds). For crafting-material shortages, use the [resource farming guide](/guides/resources).' },
      ],
    },
  ],
  faqs: [
    { q: 'Why did I open several relics and get no Forma?', a: 'Relic rewards are random, so a dry streak can happen. Check that your relic contains Forma, inspect its reward slot, and meet the opening requirements. A squad provides more possible choices but cannot guarantee Forma.' },
    { q: 'Should I make Forma relics Radiant?', a: 'Check the slot first. Intact favors a Common Forma reward; refining improves an Uncommon reward’s chance. Uncommon Forma rewards contain two blueprints. Compare the benefit with the Void Traces required.' },
    { q: 'Does a full squad give me four Forma per round?', a: 'No. Each eligible player chooses one of the revealed rewards. A two-blueprint reward gives you two blueprints, but you cannot take all four squad rewards.' },
    { q: 'Can I get built Forma without waiting for the Foundry?', a: 'Yes. The in-game Market has built Forma, and some rewards or event offerings can provide built variants. Read the exact item name, cost and availability. The dated Plague Star section explains the currently announced event reward.' },
    { q: 'How long does Forma take to craft?', a: 'Standard Forma takes 23 hours. Each craft consumes one blueprint, 35,000 Credits, one Morphics, one Neural Sensors, one Neurodes and one Orokin Cell. Claim the finished Forma before starting another craft.' },
    { q: 'Is Omni Forma the same as Umbra Forma?', a: 'No. Omni Forma, previously called Aura Forma, provides a Universal Polarity that excludes Umbra matching. Umbra Forma applies the dedicated Umbra polarity. Choose the variant for the Mods you actually intend to equip.' },
    { q: 'How many Forma should I put into a build?', a: 'Use the number needed for your chosen Mods and configurations. Plan capacity and polarities first, then relevel and test after each application. There is no fixed count that every build needs.' },
  ],
  related: [
    { label: 'Which relics drop Forma?', to: '/forma-relics', note: 'Find Forma rewards and their relic farming locations.', icon: 'cube-outline' },
    { label: 'Relics & Void Traces', to: '/guides/relics', note: 'Opening relics, refining them and choosing rewards.', icon: 'cube-scan' },
    { label: 'How to Make Platinum', to: '/guides/platinum', note: 'Trading options when budgeting for built Forma.', icon: 'currency-usd' },
    { label: 'Steel Path', to: '/guides/steel-path', note: 'Unlock requirements and preparation for harder missions.', icon: 'skull-outline' },
    { label: 'How to Build a Warframe or Weapon', to: '/guides/builds', note: 'Plan Mods and capacity before spending Forma.', icon: 'wrench-outline' },
    { label: 'Relic Farming', to: '/relic-farming', note: 'Locate the relics needed for your next opening session.', icon: 'map-marker-outline' },
    { label: 'Resource Farming', to: '/guides/resources', note: 'Prepare the materials for your next Foundry craft.', icon: 'database-outline' },
  ],
  sources: [
    { label: 'Warframe — Operation: Plague Star 2026 (September 9, 2026)', href: 'https://www.warframe.com/en/news/operation-plague-star-2026' },
    { label: 'Warframe — Official PC Drop Tables', href: 'https://www.warframe.com/droptables' },
    { label: 'Warframe — Relic Hunting 101', href: 'https://www.warframe.com/en/news/relic-hunting-101' },
    { label: 'Warframe — Update 36.1: Uncommon Forma Blueprint quantity', href: 'https://www.warframe.com/en/patch-notes/pc/36-1-0' },
    { label: 'Warframe — Update 27.3: Foundry crafting time', href: 'https://www.warframe.com/en/patch-notes/pc/27-3-0' },
    { label: 'Warframe — Update 38.5: Omni Forma changes', href: 'https://www.warframe.com/en/patch-notes/pc/38-5-0' },
    { label: 'Warframe — Specters of the Rail: Market Forma Bundle', href: 'https://www.warframe.com/en/patch-notes/pc/18-16-0' },
    { label: 'Warframe Support — Polarization and Forma FAQ', href: 'https://support.warframe.com/hc/en-us/articles/200240380-Polarization-and-Forma-FAQ' },
    { label: 'Warframe Community Developers — Forma item and crafting data', href: 'https://github.com/WFCD/warframe-items/blob/master/data/json/Misc.json' },
  ],
}

export default guide
