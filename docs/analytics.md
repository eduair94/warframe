# Analytics (GA4)

Property: **G-HD4PTPEGPP** (replaced `G-F97PNVRMRF` on 2026-07-19).
Google Ads tag `AW-972399920` is unchanged and still fires its own page view on load.

Wiring lives in three places:

| File | Role |
| --- | --- |
| `app/nuxt.config.ts` (`gtag` block) | tag ids. GA4 is configured with `send_page_view: false` on purpose — see below. |
| `app/app/composables/useAnalytics.ts` | the only place event names and parameter shapes are defined. |
| `app/app/plugins/analytics.client.ts` | everything global: page views, outbound clicks, scroll depth, exceptions, web vitals, user properties. |

## Why page_view is sent manually

`nuxt-gtag` v3 has **no router integration**. The gtag tag's automatic page view only fires on the hard
page load, so before this setup every client-side navigation in this SPA — i.e. almost all of the traffic
across 30+ tool pages — never reached GA4. The plugin now emits `page_view` on `app:mounted` and on every
`page:finish`, with `send_to` pinned to the GA4 property, and the tag's own automatic view is disabled so
the landing page is not double-counted.

## Global events (no per-page code)

| Event | Params | Fires when |
| --- | --- | --- |
| `page_view` | `page_path`, `page_location`, `page_title`, `page_referrer`, `tool`, `locale` | first render + every route change |
| `outbound_click` | `link_url`, `link_domain`, `link_target`, `link_text`, `page_path`, `tool` | any click on an external `<a>` (delegated, capture phase) |
| `scroll_depth` | `percent_scrolled` (25/50/75/90), `page_path`, `tool` | per route, pages taller than 400px only |
| `exception` | `description`, `fatal`, `page_path` | Vue errors, app errors, unhandled rejections |
| `web_vitals` | `metric_name` (LCP/CLS/INP), `metric_value`, `metric_rating`, `page_path`, `tool` | once per page, on hide/pagehide |

`link_target` buckets the destination: `warframe_market`, `wiki`, `drop_tables`, `youtube`, `github`,
`reddit`, `donation`, `social`, `external_tool`.

User properties (user-scoped, set once per session): `app_locale`, `display_mode`
(`standalone` = installed PWA vs `browser`), `viewport_class` (`mobile`/`tablet`/`desktop`).

## Interaction events

Every event carries `tool` — the first path segment with the locale prefix stripped (`/es/flip` → `flip`,
`/set/ash-prime-set` → `set`, `/` → `home`). That is what makes a single parameterized event usable across
all 30+ pages instead of one event name per page.

| Event | Key params | Meaning |
| --- | --- | --- |
| `search` | `search_term`, `results_count`, `has_results` | any item/guide/tool search. `has_results:false` = content gap |
| `select_item` | `item_name`, `source` | an item was picked from a list/picker |
| `view_item` | `item_name`, plus page context | an item's detail rendered (set ledger, relic EV) |
| `filter_apply` | `filter_name`, `filter_value` | every filter, toggle, chip, switch, basis and refinement change |
| `sort_change` | `sort_by`, `sort_dir` | table/list sorting |
| `calc_run` | `calc_kind`, context | a calculator produced a result from a user change |
| `tool_action` | `action`, context | page-specific actions (nav clicks, refresh, expand, retry, …) |
| `dialog_open` | `dialog`, `item_name` | drop locations, order book, relic details, price history, guide |
| **`market_open`** | `item_name`, `source`, `position` | **primary conversion** — user leaves for warframe.market |
| **`trade_message_copy`** | `item_name`, `side`, `price` | in-game whisper copied = intent to trade |
| `watchlist_add` / `watchlist_remove` | `item_name`, `category` | portfolio retention |
| `alert_create` / `alert_update` / `alert_delete` / `alert_fire` | `target`, `direction`, `item_name` | price-alert funnel |
| `push_subscribe` / `push_unsubscribe` / `push_denied` / `push_error` | `result` | Web Push opt-in funnel |
| `pwa_prompt` / `pwa_accepted` / `pwa_dismissed` / `pwa_ios_hint` | `platform` | install funnel |
| `tour_start` / `tour_complete` / `tour_skip` | `tour`, `trigger` | driver.js onboarding |
| `share` | `method` | social/share links |
| `locale_change` | `locale_from`, `locale_to` | which translations actually get used |
| `content_engage` | `action`, `content_id` | guides, FAQ, videos, creators, tool directory |

Note: `market_open` and `outbound_click` both fire for a warframe.market link. That is deliberate —
`outbound_click` gives site-wide outbound volume, `market_open` adds the item/source/position context the
delegated listener cannot know.

## GA4 setup still required in the UI

Custom parameters are **not** reportable until registered as custom dimensions
(Admin → Custom definitions → Create custom dimension, scope = Event):

`tool`, `item_name`, `source`, `filter_name`, `filter_value`, `sort_by`, `action`, `dialog`, `calc_kind`,
`position`, `side`, `result`, `metric_name`, `metric_rating`, `link_target`, `content_id`, `locale_to`.

User-scoped dimensions: `app_locale`, `display_mode`, `viewport_class`.

Suggested key events (conversions): `market_open`, `trade_message_copy`, `watchlist_add`, `alert_create`,
`push_subscribe`, `pwa_accepted`, `tool_action` filtered to `donate_click`.

GA4 limits enforced in `useAnalytics.ts`: event name ≤40 chars, param name ≤40, param value ≤100 chars,
≤25 params per event; empty/NaN values are dropped, numbers rounded to 2 decimals.

## Adding an event

Add a helper to `useAnalytics.ts` (or use `track(name, params)` for a one-off), then call it from the
component. Rules: never emit inside a computed/watcher that re-runs on the 2-minute catalogue poll, debounce
text inputs (≥600 ms), keep parameters low-cardinality, and never send user-supplied text other than
`search_term`.
