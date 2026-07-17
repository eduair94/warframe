# Item & Game-Noun Translation (True i18n) — Design

**Date:** 2026-07-17
**Branch:** `feat/item-translations-i18n`
**Goal:** Localize every Warframe game noun (item names, riven weapons/attributes, lich/sister
weapons/quirks/ephemeras, locations, npcs, missions) into 13 languages by reusing
warframe.market's own translations, expand the site to 13 crawlable URL-locales, and fully
translate the static UI — to make the site genuinely multi-language and gain organic traffic.

## 1. Feasibility (verified with live API probes)

warframe.market v2 returns localized names per entity. Passing HTTP header `Language: <code>`
on any collection endpoint returns `i18n.{en, <code>}` for every entity:

```
GET /v2/items            (header Language: es)  -> i18n.en + i18n.es  { name, icon, thumb }
GET /v2/riven/weapons                            -> i18n.{en,xx} { name, icon, thumb }
GET /v2/riven/attributes                         -> i18n.{en,xx} { name, ... }   (Punch Through -> Pénétration)
GET /v2/lich/weapons | /lich/quirks | /lich/ephemeras
GET /v2/sister/weapons | /sister/quirks | /sister/ephemeras
GET /v2/locations                                -> i18n.{en,xx} { nodeName, systemName, icon, thumb }
GET /v2/npcs                                     -> i18n.{en,xx} { name, ... }
GET /v2/missions                                 -> i18n.{en,xx} { name, ... }
```

- **One list call per language** builds a full dictionary for that scope. No per-entity calls.
- **13 locales with real content:** `en, de, fr, ru, ko, ja, zh-hans, zh-hant, pt, es, pl, it, uk`
  (probed `sv, cs, th` return sparse/empty → excluded).
- Some entities ship **localized icons** (`items/images/ru/…`) — optional bonus, not in scope v1.

## 2. Chosen approach — frontend dictionary layer (English stays canonical)

Three approaches were weighed:

| | A: backend swaps `item_name` per `?lang` | **B: frontend dict-layer (CHOSEN)** | C: full i18n inline on every item doc |
|---|---|---|---|
| Breaks English business logic | **Yes** — `allSets` getter & `createByPartsItem` key off English substrings (`' Set'`, `' by Parts'`) | No — English `item_name`/`url_name` stay the internal key | No |
| Catalogue payload bloat | none | none (dict fetched separately, lazily, per active locale) | +~50% on the ~2 MB SSR catalogue fetch |
| Route surface touched | every aggregate route ×13 cache variants | 2 new endpoints; aggregate routes untouched | large |

**Decision: B.** Localization is a display layer keyed by the stable English `url_name`. This keeps
set detection, "by Parts" logic, cross-reference maps, and all lookups working unchanged, and
extends uniformly to every non-item noun without editing aggregate routes.

## 3. Architecture

### 3.1 Collector — `sync_translations.ts` (new, backend/root)
- For each scope × each non-en language: one `Language`-header list fetch via the existing
  `WarframeUndici`/`UndiciHttpService` (`get(url, { headers: { Language } })` — header merge verified).
  Anti-detection pacing/retries are inherited from the HTTP client.
- Build a flat `{ key -> localizedName }` map per (scope, lang):
  - items/rivens/npcs/missions/quirks/ephemeras/weapons: key = `slug`, value = `i18n[lang].name`.
  - locations: key = `slug`, value = `i18n[lang].nodeName` (plus a parallel `systemName` map).
- Persist to a **new Mongo collection `warframe-translations`**, one document per `(scope, lang)`:
  `{ scope, lang, map: { key: name }, updatedAt }`. ~7 scopes × 12 non-en langs ≈ 84 docs,
  ~80–120 KB each (items). Unique compound index `{ scope: 1, lang: 1 }`.
- Cadence: slow (daily) — dictionaries change only when DE ships new content. Added to
  `ecosystem.config.js` as a scheduled/cron sync, mirroring the existing sync jobs.

### 3.2 Serve — `TranslationService` + route
- `TranslationService.getMap(scope, lang)` reads the `warframe-translations` doc; returns `{}` for
  `en` or unknown pairs (English needs no dict — it's already `item_name`).
- New route (server.ts): `GET /i18n/:scope/:lang` → `{ map }`, wrapped in `getJsonCache`
  (long-lived; edge-cacheable). Whitelisted `scope`/`lang` to avoid cache-key explosion.

### 3.3 Frontend translation layer (app/)
- **Pinia `useTranslationsStore`**: `{ [scope]: Record<key, name> }` for the active locale, plus
  `loadedLocale`. Action `ensureScope(scope, locale)` fetches `/i18n/:scope/:locale` once.
- **`composables/useLocalizedName.ts`**: `localName(scope, key, fallback)` → `map[key] ?? fallback`.
  Convenience: `localItemName(item)` = `localName('items', item.url_name, item.item_name)`.
- **SSR wiring**: `app.vue` — when `locale !== 'en'`, `useAsyncData` fetches the `items` dict for
  the active locale during SSR so localized names are in the server-rendered HTML (required for
  indexing). Other scopes lazy-load on the pages that render them (riven-value, drop dialog).
- **Fallback**: any missing key renders the English `item_name` — no blank strings ever.

### 3.4 Display swaps
Replace `item.item_name` **at display sites** with `localItemName(item)` (cards, tables, dialog
titles, detail-page `<title>`); tables sort/filter on the localized value for correct UX. Internal
logic (set detection, lookups, url building) keeps using English `item_name`/`url_name`. Non-item
nouns localized where they render: riven weapon picker + attributes (riven-value), drop dialog
(location/mission/npc names), star chart node/system names.

### 3.5 Locale expansion (`nuxt.config.ts`)
- `i18n.locales`: 3 → 13, each with a BCP-47 `language` (e.g. `de-DE`, `zh-Hans-CN`, `zh-Hant-TW`).
- Vuetify locale packs for the 10 new locales (`vuetify/locale` ships `de,fr,ru,ko,ja,zhHans,zhHant,pl,it,uk`)
  wired into both `vuetifyOptions.locale.messages` and `i18n.config.ts` `$vuetify`.
- `nitro.routeRules`: extend the per-locale `cache:false` rules for `/set/**` and `/relic/**` to all
  new locale prefixes.

### 3.6 Full UI translation
Augment `i18n/translations.ts`, all `i18n/messages/*.ts` (~26 namespaces), and `utils/seo.ts`
page-meta with the 10 new locales. Generated by **LLM subagents** (one per locale), using the
existing es/pt blocks as the parity template and the `messages/README` glossary
(platinum→platino/platina, relic→reliquia/relíquia, etc.). Higher quality than machine translation;
keeps `{en,es,pt,…}` inline shape so `i18n.config.ts` deep-merge picks them up unchanged.

### 3.7 SEO
- hreflang alternates + per-locale sitemap auto-emit via `@nuxtjs/i18n` + `@nuxtjs/sitemap` once
  locales are registered.
- Localized `<title>` / meta description / OG (via `utils/seo.ts` map + the central head).
- JSON-LD `inLanguage` set to the active locale in `app.vue`.

## 4. Delivery phases
1. **Core traffic driver:** items collector → `/i18n` endpoint → frontend layer + item display swaps
   → 13 locales → full UI translation → SEO. Ships the ranking win (~95% of visited pages).
2. **Remaining nouns:** rivens/lich/sister/locations/npcs/missions — additive, reuse the same layer.

## 5. Risks & mitigations
- **Thin/duplicate localized pages** → localized names + UI + meta make each locale genuinely
  distinct; hreflang prevents duplicate-content penalties.
- **wf.market rate limits / ToS** → user-sanctioned reuse; collector is batched with the client's
  built-in pacing, runs at sync time only (~12 requests/scope), slow cadence — never per user request.
- **Weapon names identical across languages** (e.g. "Kulstar") → dict carries them anyway; English
  fallback covers any gap.
- **SSR correctness** → active-locale dict fetched during SSR; English fallback guarantees no
  missing strings.
- **Cache-key explosion** → `/i18n/:scope/:lang` whitelists scope+lang; per-locale route rules are
  the same shape already used for /es, /pt.

## 6. Out of scope (v1)
- Localized icons/thumbnails (English images used for all locales).
- Localized item **descriptions** and wiki links (names + UI + meta only).
- Machine-translating user-generated content (there is none).
