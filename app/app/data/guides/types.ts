// Content model for the Warframe Knowledge Center guides. Each guide is a plain
// data object (see app/app/data/guides/*.ts) rendered by the shared
// <GuideArticle> component in the Orokin "Void Ledger" design system. Keeping
// guides as data (not bespoke Vue) means the look changes in ONE place and new
// guides are just another object — the same philosophy as data/tools.ts.

/** A verified YouTube video (id checked live via oEmbed at bake time). */
export interface GuideVideo {
  /** 11-char YouTube video id. */
  id: string
  title: string
  /** Channel / creator name. */
  channel: string
}

/** A cross-link — either an internal tool/guide route (`to`) or external (`href`). */
export interface GuideLink {
  label: string
  to?: string
  href?: string
  /** Optional one-line note shown under the link. */
  note?: string
  /** mdi icon name (without the leading `mdi-`) for card links. */
  icon?: string
}

export interface GuideTable {
  columns: string[]
  rows: Array<Array<string | number>>
  note?: string
}

/** A numbered step in a walkthrough. */
export interface GuideStep {
  h: string
  p: string
}

/** Content blocks a section is built from. Discriminated by `type`. */
export type GuideBlock =
  | { type: 'p'; text: string }
  | { type: 'list'; items: string[]; ordered?: boolean }
  | { type: 'steps'; steps: GuideStep[]; ordered?: boolean }
  | { type: 'tip'; text: string; title?: string }
  | { type: 'warn'; text: string; title?: string }
  | { type: 'info'; text: string; title?: string }
  | { type: 'table'; table: GuideTable }
  | { type: 'video'; video: GuideVideo }
  | { type: 'links'; title?: string; links: GuideLink[] }
  | { type: 'kv'; kv: Array<{ k: string; v: string }> }
  | { type: 'quote'; text: string; cite?: string }

export interface GuideSection {
  /** Anchor id (kebab-case) — used by the table of contents. */
  id: string
  title: string
  blocks: GuideBlock[]
}

export interface GuideStat {
  num: string
  label: string
  /** Colour accent for the number. */
  tone?: 'good' | 'alt' | 'gold'
}

export interface GuideFaq {
  q: string
  a: string
}

export interface Guide {
  /** URL slug — the page lives at /guides/<slug>. */
  slug: string
  eyebrow: string
  title: string
  /** Short marketing sub-title under the H1. */
  lede: string
  /** ISO date the content was last reviewed. */
  updated?: string
  readMins?: number
  /** Category key — must match a KNOWLEDGE_CATEGORY key. */
  category: string
  stats?: GuideStat[]
  sections: GuideSection[]
  /** Featured creator videos shown in a grid near the end. */
  videos?: GuideVideo[]
  /** Related guides / tools shown as link cards. */
  related?: GuideLink[]
  /** Short Q&A pairs — rendered as an accordion AND emitted as FAQPage JSON-LD. */
  faqs?: GuideFaq[]
  /** Attribution — reddit threads / wiki pages the guide draws on. */
  sources?: GuideLink[]
}

/** Categories used to group guides on the /guides hub and in nav. */
export interface KnowledgeCategory {
  key: string
  title: string
  blurb: string
  icon: string
}

export const KNOWLEDGE_CATEGORIES: KnowledgeCategory[] = [
  { key: 'start', title: 'Getting Started', blurb: 'Your first 100 hours, frames and the star chart.', icon: 'mdi-rocket-launch-outline' },
  { key: 'farming', title: 'Farming & Resources', blurb: 'Platinum, credits, Endo, Kuva, relics and every grind.', icon: 'mdi-timer-sand' },
  { key: 'systems', title: 'Systems & Builds', blurb: 'Mods, Helminth, arcanes and how power actually works.', icon: 'mdi-cog-outline' },
  { key: 'endgame', title: 'Endgame', blurb: 'Steel Path, Eidolons and the deep-end content.', icon: 'mdi-skull-outline' },
  { key: 'reference', title: 'Reference', blurb: 'Tier lists, the FAQ and the creators worth watching.', icon: 'mdi-book-open-page-variant-outline' },
]
