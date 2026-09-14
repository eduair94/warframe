# Void Ledger: organic growth and content maintenance

## Objective and operating loop

Grow useful organic traffic and repeat use by solving real Warframe questions with accurate guides
and working market tools. A daily Codex thread review is scheduled for 10:00 America/Montevideo.
The existing quarterly GitHub guide refresh remains enabled; check its recent runs before repeating
its work. Read `CLAUDE.md` and `docs/repo-map.md` before changing the app.

Each run should select and finish a concrete improvement, record its evidence and verify the result.
Always end each iteration with a full production deploy, including API, frontend and live feed,
as explicitly requested by the user. Commit the final documentation before deploying, wait for
the complete workflow to succeed and verify production. Do not finish with an undeployed or
`[skip ci]` commit. Use manual workflow dispatch on `main` when a full redeploy needs no code change.
Prioritize availability, false information and broken indexable pages first. Use official
[Warframe patch notes](https://www.warframe.com/en/patch-notes) and
[news](https://www.warframe.com/en/news) for changing game facts; distinguish announcements from
released changes. Review the actual affected guidance before changing its review date.

When GA4 or Search Console is accessible, compare complete 7-day and 28-day periods using organic
sessions, clicks, impressions, CTR, landing pages, queries, country and language. Also inspect useful
actions (`market_open`, guide-to-tool navigation, watchlists) and retention. Missing access or missing
data is not zero traffic. Do not claim that a deployment caused growth from a short before/after window.
Keep raw private analytics exports under ignored `tmp/`, outside version control.

## 2026-09-14 — first maintenance iteration

### Verified baseline and fixes

- The dynamic sitemap confused `set: true` (membership in a set) with an assembled set. The live
  catalogue contained 1,033 flagged items but only 238 assembled sets. This advertised 795 invalid set
  URLs per locale (10,335 across 13 locales). Require names ending in ` Set` (a substring also matched
  Motus Setup and Grineer Settlement scenes), deduplicate slugs and retain relic and mission URLs.
- Spanish sitemap lacked 53 localized tool detail pages. Explicit dynamic tool URLs now request the
  sitemap module's locale transformation.
- Unknown relics/missions returned HTTP 200. Entity pages now distinguish an authoritative absence
  (404) from a temporary data failure (503), preserving useful page error/retry states.
- Sitemap source reads could outlive the sitemap module's five-second budget and a catalogue failure
  removed mission discovery too. Fetch independently and concurrently, use bounded timeouts and small
  recent URL snapshots, and return 503 on a complete cold outage.
- Live JSON-LD included localhost identifiers on cached pages despite correct canonicals. Structured
  data should use the configured public frontend origin, never the API or an internal render host.
- A live guide emitted 282 speculative script prefetch links. Remove only these internal script hints
  from SSR HTML; retain render-critical preloads/styles and hover/focus navigation prefetching.
- The production build precached 492 files (19,837 KiB) on service-worker installation, including
  unused route and locale chunks. Restrict install-time caching to core icons and cache requested
  hashed assets with bounded runtime storage. Preserve API caching and push notification handling.
  Workbox generation against the same build reduced this from 20,314,873 bytes to 61,870 bytes
  (9 files, about 60 KiB), a 99.7% reduction in precache content. These are uncompressed file sizes,
  not a measurement of every visitor's network transfer or loading time.
- Analytics deferred initialization needed Nuxt context. Preserve early buffered events and replace
  the homemade Core Web Vitals approximation with Google's
  [measurement library](https://github.com/GoogleChrome/web-vitals), including CLS precision,
  metric IDs/deltas and navigation attribution. This improves measurement; it is not evidence of
  measured traffic growth. See `docs/analytics.md`.
- The mastery guide's failed-test cooldown and rank-40 mastery advice were outdated. Review and
  propagate the factual corrections across its localized snapshots; cite the official sources in
  the guide itself. Guide edits must not rewrite publication dates, and internal prose links should
  keep readers in their selected language.
- Quarterly refresh could not parse two valid TypeScript guides, treated video provider failures as
  missing videos and encouraged date-only updates. Parse data safely, validate all outputs before
  writing, reject ungrounded generations, bound external calls and preserve dates on no-op edits.

### Verification and release

All 548 API/technical SEO unit tests passed, as did 10 guide refresh tests, 21 frontend tests
(analytics, resource hints, localized rich text and generated PWA caching), the i18n compile gate and
repo-map check. The initial production build and 12-route built SSR smoke checks passed. The latter
confirmed 200/404/503 semantics, canonical origins, no localhost in JSON-LD and zero speculative script
prefetch tags with required preloads preserved. The final source predicates, translations and PWA
configuration additionally passed focused checks. Full app typecheck reports project-wide errors; no diagnostic
references the new analytics, sitemap, entity-status or resource-hint implementation. It remains
advisory under the repo's established policy. Local diagnostic logs are ignored `*.log` files.
GA4/Search Console baseline access was attempted through Supermetrics. Both discovery calls failed
with an invalid OAuth grant requiring reauthentication, before any property data was retrieved.
The 7/28-day traffic baseline is unavailable, not zero. No login, permission changes or private
analytics export occurred. Continue content/technical work while this access issue remains unresolved.

Release `8dac1a7` passed CI and deployed successfully in
[run 34806486463](https://github.com/eduair94/warframe/actions/runs/34806486463).
Public checks of 11 routes confirmed the expected 200/404 responses, canonical/schema origins,
localized links and zero speculative script prefetch tags. English and Spanish sitemaps each
contained 238 valid set URLs and 54 tool URLs, with the false-positive set names absent. The
Spanish mastery guide displayed the corrected 23-hour rule and September review date, and its
localized link opened the working flip tool without browser console errors.

Production verification caught an additional delivery issue: Cloudflare's ordinary `/sw.js`
response still held the old September 2 worker, while an uncached request returned the deployed
9-entry worker. Disabling Nitro caching had not set an HTTP cache-control header. A follow-up
migrates registration once to `/sw-v2.js`, keeps the existing root scope and push integration,
and sends `Cache-Control: no-store` for both worker paths and the web manifest. Registration is
imported into hashed client JavaScript, avoiding another stable cached registration script.
Focused tests generate the actual Vite registration and Workbox worker to verify these properties.
The follow-up `7ce7d86` passed all blocking checks and deployed successfully in
[run 34807390159](https://github.com/eduair94/warframe/actions/runs/34807390159).
Two ordinary public requests to `/sw-v2.js` returned HTTP 200, `Cache-Control: no-store`
and Cloudflare `BYPASS`; both served the 1,873-byte worker with 9 precache entries and no
`/_nuxt` JavaScript in that list. The production build reported 58.83 KiB of precache content.
The current hashed entry `/_nuxt/Cxyp1hyo.js` registers `/sw-v2.js` with scope `/`.
The manifest also returned HTTP 200 with `no-store` and Cloudflare `DYNAMIC`.
The public Spanish guide loaded correctly again after this deployment. CI reconfirmed
548 API tests, 10 guide tests, 21 frontend tests, i18n compilation and the repo-map check.

### Next priorities

Time-sensitive editorial queue verified against official announcements on 2026-09-14:

- **Plague Star is active:** update `/guides/forma` with participation requirements, contract tiers
  and current rewards. The [2026 announcement](https://www.warframe.com/en/news/operation-plague-star-2026)
  (September 9) lists an end date of September 23 at 10:00 ET and a built Umbra Forma offering.
  Verify current prices and limits before including them. This deserves the next content pass.
- **Citrine Prime is announced for September 23:** the [September 4 announcement](https://www.warframe.com/en/news/citrine-prime-access)
  includes Steflos and Corufell Prime. Prepare relevant relic guidance, but publish actual relic IDs,
  drop locations and probabilities only once official tables support their availability.
- **Riven changes are announced for Iceblade of Narin:** the [September 8 Devstream 197 recap](https://www.warframe.com/en/news/devstream-197-overview)
  discusses combining Rivens and locking stats. Revisit the guide and value estimator when release
  notes establish the final costs/restrictions. The official PC index still showed
  [Hotfix 43.5.4](https://www.warframe.com/en/patch-notes/pc/43-5-4) during this review.

Ongoing priorities:

1. Establish actual GA4/Search Console baselines if the account/property is accessible. Select search
   opportunities from impressions, intent and useful actions; do not invent keyword volumes.
2. Audit the remaining 24 guides against current official updates, starting with progression,
   Duviri/Circuit rotations, resources and platinum/relic farming. Reconcile localized snapshots.
   Known content candidates: `mods.ts` groups Slash with Toxin as bypassing shields and describes
   Rolling Guard as resetting shield gates; `relics.ts` confuses rewards per mission/rotation and
   relic sources with Fissure opening locations. Verify mechanics against authoritative sources
   before correcting all language versions. `builds` and `forma` still lack translated snapshots.
3. Add timely original guidance only when there is a clear player question and verified answer.
   Connect guides to relevant live tools, show data age/limitations and avoid fixed live prices.
4. Check real mobile LCP/INP/CLS after enough post-release samples. Investigate bottlenecks with
   measurements; do not label lab or homemade metrics as CrUX field results.
5. Sample indexable sitemaps, canonicals, hreflang, response status and structured-data origins after
   each routing/content release. Google advises sitemaps list desired canonical URLs and use truthful
   modification dates: [sitemap guidance](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap).
6. Make deployment atomic before increasing deployment frequency: the current SSH workflow builds
   in the active directory, and Nitro clears `.output` before PM2 reloads the old process. Build in
   separate release directories, switch only after validation and retain the previous release.
   Verify old and new HTML asset requests and a failed build; the current HTTP-200 home-page check
   alone cannot catch assets disappearing during a build.

Traffic improvement has not yet been measured in this iteration. Search engines decide crawling,
indexing and ranking; a passing technical check does not guarantee placement or a traffic increase.

## 2026-09-14 — scheduled review at 10:00 America/Montevideo

### Baseline and opportunity

The API reported healthy MongoDB, and public frontend, guide pages and the live-feed handshake
responded successfully. English and Spanish sitemaps each contained 1,414 URLs, including 238 sets
and 54 tools. A temporary difference in mission URLs disappeared on a normal refresh. At 13:03 UTC
the catalogue contained 3,840 items with a median update age of three minutes; the analytics
generation timestamp was less than one minute old. No duplicate guide-refresh workflow was running.

Supermetrics still rejected its OAuth grant. Read-only access through the existing Chrome session
did work for the **Warframe Market Analytics** GA4 property. The acquisition report displayed these
complete periods (Organic Search is the session channel):

| Metric | September 7–13 | August 31–September 6 |
| --- | ---: | ---: |
| Organic sessions | 532 | 561 |
| Engaged organic sessions | 298 | 400 |
| Organic engagement rate | 56.02% | 71.3% |
| Average engagement per organic session | 45 seconds | 46 seconds |
| All sessions | 995 | 7,765 |
| Direct sessions | 191 | 7,055 |

Organic sessions decreased 5.17%; engaged organic sessions decreased 25.5%. The much larger total
session decrease primarily reflects Direct traffic. Its earlier average engagement was one second,
but this alone does not establish bots, tracking faults or another cause. The complete 28-day
period August 17–September 13 showed 1,800 organic sessions, 65% engagement and 46 seconds average
engagement. These periods precede today's changes and cannot measure their effect.
Only aggregate results are recorded here; no raw analytics export was created. The current Search
Console account's property selector had no match for Warframe or digitalshopuy, so search queries,
impressions and indexing data remain unavailable in that account.

### Changes and evidence

- Reviewed the Forma guide against current official announcements, patch notes, drop tables and
  crafting data. Removed claims that a squad gives each player four rewards, that all Forma relics
  should be Intact, and that random rewards or leveling runs are guaranteed. Explain Common versus
  Uncommon slots, one selected reward versus a two-blueprint reward, and standard/Omni/Umbra/Stance
  variants. The [official Plague Star announcement](https://www.warframe.com/en/news/operation-plague-star-2026)
  supports a concise dated event section; unspecified current shop prices/limits are not invented.
  The linked Forma relic finder now gives the same refinement advice. Its remaining interface is
  still shared English copy; full tool localization is separate work.
- Localize guide-hub cards using the existing lightweight SEO metadata rather than downloading
  every guide body. Search now includes visible translated titles/descriptions, keeps English game
  terms discoverable and handles accents. A browser test on `/es/guides` found the Credits guide
  for `creditos`; clearing the search restored the full list. Forma metadata follows the reviewed
  guide rather than repeating the old universal Intact advice.
- Public market responses expose browser `max-age=14400` despite `s-maxage=60`. The shared market
  fetch helper revalidates browser reads while preserving internal SSR requests, retries, query
  options and caller policies. The existing periodic catalogue poll already requested revalidation;
  bootstrap/recovery, analytics, order books and other price readers now behave consistently.
  Chrome confirmed real conditional requests: a second analytics read returned HTTP 304 with
  Cloudflare HIT, avoiding another full payload transfer. The browser still sees the edge's long
  response max-age, so the fix is the explicit request policy, not a claimed Cloudflare setting change.
- Workbox public API caching also revalidates the HTTP cache. Private/account/admin requests bypass
  its caches, and an activation migration deletes only the obsolete API cache that could contain
  private responses. Current public prices, installed icons, hashed assets and push handlers remain
  independent. Generated-worker tests verify route precedence and selective cache cleanup.
- Translation requests now use a shared pacing gate, default concurrency of one and a bounded retry
  for transient provider failures. Daily quota/access errors stop unstarted jobs and preserve completed
  snapshots. The observed provider limits and temporary failures exposed this weakness during the
  Forma refresh; fake-clock and real-SDK/fake-network tests check the behavior without consuming quota.
  Review caught translated gameplay terms that changed the meaning of refinement or Mod drain;
  targeted regeneration and canonical-name normalization correct those fields before publication.
  Metadata reuses the reviewed translated title and opening sentence instead of another model call.

### Validation before deployment

The Forma revision now includes English and all 12 localized snapshots, each with eight sections,
seven FAQs and the same nine source references. Offline checks confirm dates, identifiers, numeric
tables, Markdown destinations and content structure. Independent language spot-checks reviewed the
core gameplay claims and repaired fields; this is not a professional full translation audit.
The complete English guide gate passes for all 25 guides; only the pre-existing `builds` translation
gap remains in its follow-up report.

Local validation passed 548 API unit tests, 32 frontend tests and 20 guide/tooling tests, plus i18n
compilation and the generated repo-map check. Spanish guide rendering and accent-insensitive hub
search were checked in the browser; generated Workbox tests exercise private-route precedence and
legacy-cache cleanup. The full CI workflow will repeat its gates, compile API/frontend and reload
the API, app and live feed. Public health, affected content and deployed assets must be verified
after that workflow succeeds; this section records pre-deployment evidence only.

### Public verification and deployment correction

Commit `947dd54` passed every blocking gate and completed the full production workflow in
[run 34851196570](https://github.com/eduair94/warframe/actions/runs/34851196570). Public Spanish
Forma content and metadata updated correctly, and searching the guide hub for `creditos`
returned the Credits guide. The API/Mongo health check, home asset and live handshake responded.
EN/ES/JA/KO Forma returned the reviewed localized titles/descriptions, index/follow, self-canonicals
and Article `dateModified: 2026-09-14`. Their 26 unique hreflang codes (language/region aliases and
x-default) resolve consistently to the 13 expected locale URLs. Source links remain present, with
no localhost schema origins or script-prefetch tags. The public Movers table also rendered prices
without new browser console errors. The hydrated Forma relic finder displayed the corrected
Common/Uncommon probabilities, one selected reward and mission-choice guidance.

The ordinary public worker response revealed a build-time configuration mismatch: PM2 supplies
the public API origin at runtime, but the frontend build had received no matching value and
compiled both API cache rules for `localhost:3529`. Browser request revalidation works independently,
but those worker rules did not match production API traffic. A follow-up aligns the frontend build
with the existing PM2 public API configuration and checks the generated worker against that actual
origin. The PM2 app's legacy `SITE_URL` is also corrected to the frontend host, matching the
already-correct generated canonicals. Only the public API setting is imported for the worker
build. This follow-up requires another full API/frontend/live deployment and public verification.
The expanded frontend suite passes 34 tests, including the workflow's actual PM2-origin resolver,
runtime override precedence, local fallback and a worker generated with the production configuration.

### Next review

Inspect the organic landing pages behind the engaged-session decline, then measure complete
post-release periods without mixing them with this baseline. Review the event wording after
September 23 at 14:00 UTC. `builds` still needs localized snapshots; the guide-hub chrome also has
poor legacy translations such as Spanish farming rendered as agriculture. Continue the remaining
guide accuracy queue, including Defense rotations and capacity advice against the cited updates.

Deployment isolation remains an availability priority: `npm ci`, `dist` compilation and Nuxt
`.output` generation all mutate directories used by running processes. A failed build cannot be
assumed to preserve the previous service. A future change should use immutable candidate release
directories, preserve operational working directories, verify candidate health before switching,
retain old hashed assets and test rollback. Confirm server paths and disk headroom first. PM2 fork
mode also means reload is not a guarantee of zero downtime. This iteration uses the existing full
API/frontend/live deployment and requires public verification after it completes.
