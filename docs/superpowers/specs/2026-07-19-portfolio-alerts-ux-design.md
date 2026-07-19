# Spec A — Portfolio Alerts UX Redesign

Date: 2026-07-19
Status: Approved (decomposition + shape auto-approved by user)
Scope: `/portfolio` frontend only. Client-side, no backend, no new endpoint.

## Problem

Alert creation today lives inside `app/app/pages/portfolio.vue` as an 8-column
`white-space: nowrap` `v-table`. It is:

- **Not mobile-friendly** — the nowrap 8-col grid forces horizontal scroll (a
  documented mobile anti-pattern).
- **Not discoverable** — items are added only via a flat name `v-combobox`; no
  category browsing.
- **Un-guided** — no first-run tour for the alert flow (the app already has a
  site-wide nav tour, but nothing for alerts).
- Raw `type="number"` threshold fields — the #1 documented mobile complaint for
  price-alert products ("requires multiple tries").

A separate, larger **Spec B** covers real background Web Push (service worker +
VAPID + server-side subscription storage + threshold evaluation in the price
pipeline). This spec (A) is the fast, fully client-side UX win and ships first;
it defines the alert data shape B later persists server-side.

## Rejected: treemap category picker

Per NNGroup research, a treemap is the **wrong** control for picking one of ~9
roughly-equal, flat (non-hierarchical) categories: area is not a preattentive
attribute (bad for precise pick-one), it's explicitly poor for "balanced trees"
and non-hierarchical data, degrades to unlabelable tiny cells, and relies on
hover/tiny touch targets that break on mobile. Rejected as the picker; only ever
defensible as a decorative "market heat" viz elsewhere.

## Design

### Category selection — two-step funnel (chips → scoped search)

Reuse the app-wide `categoryOf(tags)` taxonomy already duplicated across ~9
analytics pages (Warframe, Primary, Secondary, Melee, Mod, Sentinel, Companion,
Arcane, Other). Extract it once into a shared composable.

- **Step 1 — category chips:** `v-chip-group ... mandatory column` (the existing
  `movers.vue` pattern; `column` wraps all chips to multiple rows so none are
  hidden — matches the "wrap to 2 rows" guidance). Default `All`. Single-select.
- **Step 2 — scoped typeahead:** a `v-autocomplete` over items filtered by the
  selected category, matching English + localized name, showing thumb + name,
  capped at ~7 suggestions. Selecting an item adds it to the watchlist **and**
  opens the edit sheet (contextual — item pre-selected).

### Alert card (replaces the nowrap table)

One `AlertCard.vue` per watched item, stacked single-column on mobile
(`v-row`/`v-col` 12 / sm 6 / md 4). Card shows: thumb, localized name (links to
`/set/:url_name`), live sell price, computed value, and summary chips for the
armed conditions (below N / above N / ATL) plus an "at low!" state. Actions:
Edit (opens sheet), Delete. Owned-qty stays editable (drives total value).

### AlertEditSheet.vue (bottom-sheet)

Opened for one entry. `v-bottom-sheet` on mobile (`useDisplay().mobile`),
`v-dialog` (centered, `max-width`) on desktop — explicit close button, single
column, ≥44px targets. Contents:

1. **Price context first:** current sell price + a small sparkline built from the
   `/market_analytics` feed's per-item `spark[]` (already fetched by portfolio;
   no new endpoint) + the ATL value. Prevents unrealistic targets.
2. **Direction:** an above / below segmented control (`v-btn-toggle`), with live
   emphasis on the active side.
3. **Target price:** `v-number-input` (stepper + numeric keypad), **pre-filled**
   from the current price, plus preset chips (−10% / −20% / at current) that set
   the field. Minimizes typing.
4. **ATL toggle:** `v-switch` for the all-time-low alert (existing feature).
5. **CTA:** one specific button — "Save alert" — in thumb reach; Delete secondary.

Thresholds persist through the existing `services/portfolio.ts` (`updateEntry`,
which already re-arms `notified*` flags on change). No service change needed.

### Guided tour — reuse existing driver.js infra

The app already loads driver.js on demand in `layouts/default.vue` with an Orokin
`.driverjs-theme` popover style. A new `useAlertTour()` composable mirrors that
lazy-import pattern (import `driver.js` + `driver.js/dist/driver.css` client-side,
`popoverClass: 'driverjs-theme'` to inherit the theme).

- **Anchors:** page-level `[data-tour="alerts-*"]` elements only (category chips,
  search box, enable-notifications button) — never the sheet (avoids open-state
  coupling).
- **Steps:** desktop 4 (category → search → thresholds hint → notify), mobile 3
  (merge). Each ≤ ~12 words, `showProgress`, fully skippable (`allowClose`).
- **Trigger:** first visit to `/portfolio`, gated by localStorage flag
  `seen_alert_tour_v1` (written on finish OR close so it never re-shows). A small
  "Replay tour" button re-runs it on demand.
- **i18n:** all copy under `portfolio.tour.*` across all 13 locales.

### Honesty banner (until Spec B)

A caption near the enable-notifications control states alerts run only while the
tab is open, with a PWA-install hint. Removed when Spec B lands background push.
The existing `portfolio.alertsEnabled` / `intro.text` strings already say this;
keep them honest.

### Deep-link seam for future contextual entry

`portfolio.vue` reads `?alert=<url_name>` on mount: if present and valid, add the
item and open its sheet. Lets other pages (screener/movers) later drop a "bell"
that deep-links here — cheap, no work now.

## Files

New:
- `app/app/composables/useItemCategory.ts` — `categoryOf`, ordered list, options
  builder. (Seed for later dedup of the ~9 copies; only portfolio adopts it now.)
- `app/app/composables/useAlertTour.ts` — driver.js tour + first-visit gating.
- `app/app/components/AlertCard.vue`
- `app/app/components/AlertEditSheet.vue`

Changed:
- `app/app/pages/portfolio.vue` — new template; script keeps watchlist / live
  feed / `checkAlerts` logic, maps `sell`+`spark` from analytics for the sheet.
- `app/i18n/messages/portfolio.ts` — new keys (`categories.*`, `tour.*`, sheet /
  card / add-panel labels) across all 13 locales.

Unchanged: `services/portfolio.ts` (alert model + `checkAlerts` reused as-is).

## Non-goals (this spec)

- Background Web Push / service worker / VAPID / accounts → **Spec B**.
- Email fallback channel (no accounts / no mail infra).
- Contextual bells on other pages (only the deep-link seam is added).
- Full Orokin re-theme of `/portfolio` (use Vuetify + theme colors; keep focused).
- Refactoring the ~9 other `categoryOf` copies (composable is created but only
  portfolio adopts it here).

## Verification

No frontend test harness exists in `app/` (only the API has jest). Verify via the
app's real gates:

- `npm run typecheck` (in `app/`) — clean.
- `npm run i18n:check` — passes (blocking CI gate; all 13 locales have the new
  keys, same shape).
- `npm run build` — succeeds.
- `npm run lint` — clean (advisory).
- Manual: mobile viewport (no horizontal scroll; cards stack; sheet is a bottom
  sheet); add item via chip+search; set threshold via preset/stepper; tour shows
  once, replays on demand.
