# 3D Star Chart ("Origin System" drop map) — Design

Date: 2026-07-14
Status: approved (autonomous session — user requested build directly)

## Goal

A Helldivers-2-companion-style **3D galactic map** of the Warframe Origin System at
`/star-chart-3d`, opened from a button on the existing 2D `/star-chart`. Planets are
lit by their best mission's liquidity-weighted plat/drop (same valuation as the 2D
chart). Must be responsive, touch-friendly, SEO-indexed ("warframe drop map"), and
degrade gracefully without WebGL.

## Data

- Same API: `GET {apiURL}/drops/map` → `planets[].nodes[].rotations[].rewards[]`
  (reward: itemName, rarity, chance, price, url_name, thumb, tradeable).
- 24 worlds today: 14 junction-chain planets, satellites (Lua, Phobos, Deimos,
  Kuva Fortress), and special zones (Void, Zariman, Duviri, Höllvania, Sanctuary,
  Veil Proxima, "Dark Refractory, Deimos", …). **Unknown names must not break the
  scene** — anything not in the layout config renders on the outer "special" ring.
- Client-side re-weighting identical to 2D chart: reward value = (48h avg price,
  fallback live ask) × vol/(vol+VOL_K), joined from the Pinia items store via
  `utils/marketLookup.ts`. VOL_K imported from `useRelicValue`.

## Architecture

1. **`composables/useDropMap.ts`** — fetch + liquidity weighting extracted from
   `star-chart.vue` (kept byte-compatible in behavior): returns `loading`,
   `planets` (weighted, sorted nodes), `maxValue`, `richest`, `stats`,
   `effectivePlat`, `rewardMeta`. The 2D page is *not* refactored now (risk
   containment); it stays the reference implementation.
2. **`components/StarChartGalaxy.client.vue`** — self-contained Three.js scene,
   client-only. Props: `worlds` (name/value/nodeCount/t), `selected`,
   `highlighted` (item-search hits). Emits `select(name|null)`, `unsupported`.
   - Static geometry: starfield Points, nebula sprites, polar chart grid
     (concentric rings + spokes, faint gold), orbit rings, sun (layered additive
     sprites + point light w/ decay 0), planets (shared SphereGeometry, procedural
     canvas band/speckle textures per world), Saturn ring mesh, satellites near
     parents with teal connector lines, special zones as teal emissive octahedra
     on the outer ring.
   - Value encoding: additive halo sprite scale/opacity ∝ normalized value; label
     sprite shows name + best p/drop.
   - Interaction: OrbitControls (damping, autoRotate until first input, no pan,
     clamped polar+distance); raycast select with 6px drag threshold; hover
     highlight; camera target/distance tween (rAF, cubic ease) on select/deselect;
     intro dolly (skipped under prefers-reduced-motion).
   - Hygiene: DPR capped at 2, ResizeObserver, visibilitychange pause, full
     dispose on unmount, WebGL failure → `unsupported` emit.
3. **`pages/star-chart-3d.vue`** — full-bleed map section (100vw breakout inside
   the layout's v-container, height ≈ 100dvh − chrome), HUD overlays (.an-*/Orokin
   styling): title block, stats, legend, controls hint, search pill, back-to-2D
   link. Right-side detail panel (desktop) / bottom sheet (mobile) with the same
   mission/rotation/reward drilldown as the 2D panel, `DropLocationsDialog` on
   reward click. Reverse item lookup autocomplete built from the map's own reward
   names → highlights the planets that drop the item + lists matching nodes.
   Deep links: `?planet=` and `?item=` query params (router.replace sync).
   SEO: useHead title/description/og. Hides `#spinner-wrapper` on mount.
4. **Entry points** — hero button on `star-chart.vue` ("Open the 3D map"), back
   link on the 3D page, nav drawer entry `3D Drop Map` (Analytics group).
5. **Navigation aids** (user request mid-build) — Helldivers-style control
   legend (rotate / zoom / pan, mouse vs touch copy), OrbitControls pan enabled
   (right-drag / two-finger, target clamped to the chart), and a bottom
   world-hopper dock: prev/next arrows + jump menu listing every world with its
   plat value. Keyboard arrows reuse the same spatial hop order.
6. **Warframe farming guide** (user request mid-build) — shared
   `WarframeGuideDialog.vue` on both maps. Data: WFCD `warframe-items`
   Warframes.json fetched client-side from raw.githubusercontent (CORS-open,
   rebuilt with every game patch → stays current), parsed lean by
   `composables/useWarframeGuide.ts`. Standard frames show boss/mission part
   sources (clicking a planet source jumps the map); primes show per-part relic
   chips with Intact–Radiant chance ranges, vaulted badges (market relic flag),
   set/part prices from the items store, and clicking a relic highlights where
   it drops on the map (falls back to DropLocationsDialog for vaulted relics
   that no longer drop).

## Alternatives considered

- **TresJS / vue wrapper**: less control, version churn against Nuxt 4 — rejected.
- **Babylon.js**: heavier bundle for the same result — rejected.
- **Bloom post-processing**: gorgeous but mobile-hostile; additive sprites give
  90% of the look at ~0 cost — chosen instead.

## Testing

Manual browser verification via Chrome DevTools MCP (desktop + 375px mobile
viewport): console clean, select/deselect, search highlight, panel drilldown,
resize, fallback. `nuxi typecheck` for TS. Adversarial multi-agent review pass
before hand-off.
