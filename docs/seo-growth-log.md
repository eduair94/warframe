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

## 2026-09-21 — scheduled review

### Production and measurement baseline

The working tree started clean at `4dd75f5`; its complete production deployment
[run 34852578564](https://github.com/eduair94/warframe/actions/runs/34852578564) succeeded.
No deployment or guide-refresh workflow was running at the start of this review.
Ordinary public requests on September 21 at 15:53–15:56 UTC confirmed:

- API HTTP 200, `ok: true`, MongoDB up; frontend, its current JavaScript asset and live
  Engine.IO handshake also responded successfully.
- All 3,840 catalogue timestamps were valid. Median item age was 136.8 seconds, 3,564 items
  were under ten minutes old and none exceeded one day. The 3,840-item analytics document
  was generated at 15:52:54 UTC, less than a minute before its check.
- The ordinary worker response uses the public API origin, includes the private-request
  exclusion and cache migration, and returns `no-store`. This verifies served configuration;
  it is not a new browser offline-cache behavior test.
- English and Spanish Forma pages return localized titles/body, self-canonicals and
  `index/follow`. Their 26 hreflang aliases map to 13 locale URLs. The English and Spanish
  sitemaps each list 1,436 URLs and include Forma; the index has all 13 locale maps.

GA4 and Search Console connector discovery both returned `oauth_token_invalid_grant`.
Chrome was unavailable to this session; the available in-app browser redirected GA4 property
546208759 to Google's sign-in page. Consequently the complete seven-day comparison
(September 14–20 versus September 7–13) and 28-day comparison (August 24–September 20 versus
July 27–August 23) could not be obtained. Traffic and organic landing-page data are unavailable,
not zero. The September 14 figures above remain historical; no new growth or causal claim is made.

### Editorial priority

The next correction addresses demonstrably inaccurate mods/survivability instructions, including
shield-gate recovery, the Decaying Dragon Key, shieldless frames, Slash versus Toxin, and Rolling
Guard. The hypothesis is that reliable answers and consistent localized explanations better serve
players arriving for these mechanics. Analytics access is needed to measure any retention effect.
Changes, sources and final validation for this revision are recorded below before deployment.

The public Spanish builds guide still has an English H1/body despite Spanish metadata and a
self-canonical Spanish URL. Its missing localized snapshots remain a concrete next content task.

### Changes and evidence

The mods guide was fact-checked against official Update 34, 27.2, 23.10, 30.5, 36, 38.5 and
the Support mod/Forma documentation, linked directly in the guide. The revision preserves its
nine section anchors and nine FAQs and includes ten official sources alongside existing references.
It corrects shield-gate scaling and partial restoration, Catalyzing Shields, the Dragon Key cap,
Rolling Guard, Inaros, Slash versus Toxin, current Vitality/Redirection values, polarity versus
capacity, Blast and Magnetic. Unsupported invincibility guarantees and invented Riven percentage
gains were removed. The reviewed English date is September 21; unrelated guides retain their dates.

All twelve old mods locale snapshots shared the English review date but lacked the build-planners
section, ninth FAQ and newer related/source links. Full regeneration was required: an index-based
translation delta would have reused mismatched fields. Review also caught complete English echoes
from the provider for Japanese and Italian, invalid Chinese stat descriptions and a Ukrainian
shield-gating mistranslation. These responses were repaired through the existing SDK and checked
again before release, including independent review of the critical translated mechanics.
The committed translator now rejects batches that overwhelmingly echo substantial English prose
before they can overwrite an existing locale. Its regression test exercises the actual translation
function and verifies that a previous snapshot survives rejection. This is a conservative echo
guard, not a general language or factual-accuracy detector.

Translation follow-up now compares section/FAQ structure, invariant metadata and link destinations
as well as review dates. It ignores localized prose and harmless link reordering within the same
text field, while retaining duplicate counts. Prose-only source changes still need an honest review
date update. This closes the equal-date structural gap without automatically rewriting dates.

Every guide now displays its existing review date as a localized day, month and year in a semantic
time element. Explicit UTC formatting prevents negative browser time zones from showing the
previous day or month. Focused tests cover actual UTC/Montevideo/Los Angeles processes, calendar
boundaries, leap days, localized output and invalid-date fallbacks. The mods hub card's summary and
reading time are aligned with the reviewed article; localized search summaries reuse reviewed copy.

The official news check found no new gameplay patch since the prior iteration: the newest PC
entry remained [43.5.4](https://www.warframe.com/en/patch-notes/pc/43-5-4). The September 16 news
item concerned merchandise. Plague Star still ends September 23 at 14:00 UTC, and Citrine Prime
remains announced for September 23. No unreleased mechanics or speculative relic IDs were added.

### Validation and release

The final local suites passed: 548 API tests, 26 guide/translation tests and 37 frontend tests
(611 total). All i18n messages compile without duplicate keys; the repository map is current;
the edited Vue template compiles and whitespace checks pass. The guide checker validates all
25 guides with zero errors. Every mods locale now has nine sections, nine FAQs, fifteen sources
and the September 21 reviewed date; the structural follow-up queue no longer includes mods.
The remaining queue is builds (all twelve locales), archon-shards (ru), focus (zh-hans), resources
(zh-hans), riven (pl/uk) and standing (pl). These warnings remain visible and are not hidden by
artificial date changes.

All source, locale, metadata and documentation changes belong to one release commit. Its push
must run the full existing API/frontend/live workflow and pass public verification; this log
records pre-deploy evidence and does not claim a deployment that has not yet completed. Final
workflow status and public checks are reported in the task so no trailing documentation commit
is left undeployed. The browser-control service timed out during preparation; server responses,
generated content and automated UI tests remain available for verification.

### Public verification and final editorial follow-up

The complete deployment of `8bb5d7f` succeeded in
[run 35626395395](https://github.com/eduair94/warframe/actions/runs/35626395395). All thirteen
public mods pages returned HTTP 200, the reviewed descriptions, self-canonicals, 26 hreflang
aliases, index/follow, and September 21 visible/schema review dates. API/Mongo, frontend, its
new main JavaScript asset and live handshake were healthy. At 16:42:50 UTC, all 3,840 catalogue
timestamps were valid; median age was 222 seconds, 3,536 items were under ten minutes old and
none exceeded a day. Analytics were approximately 70 seconds old. Worker headers/configuration
remained correct. These checks do not establish actual browser offline-cache behavior.

All twelve unique internal destinations referenced by the guide returned HTTP 200 with correct
self-canonicals and expected titles, including both build planners. None includes a fragment.
The Endo/Riven tools intentionally render their H1 on the client and provide an SSR fallback
table; assessing their search landing-page structure is a future task, not a new broken link.

The public pass also exposed an English German H1 that the conservative long-prose echo guard
does not cover. It and the German eyebrow are corrected using existing German SEO/guide wording,
without another generated translation or a manufactured review date. A bounded audit of all twelve
localized titles, eyebrows and 108 section headings found no other descriptive English echoes.
The translation prompt explicitly requires descriptive
headings to be translated as well. This follow-up includes its documentation before another full
API/frontend/live deployment; final status and verification are reported in the task.

### Next content queue

Recheck the event wording after September 23 at 14:00 UTC and verify the release against official
notes before adding new item/relic information. Translate the builds guide's English-only locale
fallbacks. Review the relics guide's source-finding versus fissure-opening advice, endless rotation
rewards, Void Traces and Aya/Regal Aya distinctions. Address the remaining structural locale drift
reported by the improved checker; preserve valid existing translations until their replacements
pass factual and structural review. Restore analytics access to measure complete traffic windows.

## 2026-09-24 — expired event, current Forma reward and searchable landing content

### Baseline and measurement

Started clean and synchronized with `origin/main` at `64a2183`. Its full deployment,
[run 35627727363](https://github.com/eduair94/warframe/actions/runs/35627727363), succeeded;
no deployment or guide-refresh workflow was active. Ordinary public requests at 12:11–12:12 UTC
confirmed API/Mongo, frontend, current JavaScript and live feed HTTP 200. The 3,873-item catalogue
had valid timestamps, a median age of 223 seconds, 3,657 items under ten minutes old and none
older than a day or dated in the future. Citrine, Steflos and Corufell Prime already appear in the
catalogue. Analytics contained 3,873 items and were generated at 12:09:52 UTC, approximately
75 seconds before their check. Worker configuration/headers remain correct; this is not a new
offline browser-cache behavior test.

Forma EN/ES had correct canonical/indexability/hreflang but still described Plague Star as
available despite its September 23 deadline. The relic board's initial HTML contained its
fallback table, but no H1 or contextual links to the guide/map. Its existing Spanish board text
is also English, a separate localization backlog item. The sitemap index has thirteen maps;
ordinary EN/ES rereads each contained 1,425 URLs, including both Forma routes and builds.
Minor rotating mission differences and differing generation times do not establish a sitemap bug.

Supermetrics date/source discovery returned UNAUTHORIZED and required reconnection. No account
timezone, traffic or query data were available. Pending complete-window comparisons are September
17–23 versus September 10–16, and August 27–September 23 versus July 30–August 26. These are
requested periods, not measured results; unavailable is not zero and old figures are not reused.
The browser fallback timed out before reaching Analytics. No login, paid upgrade or external
message was attempted.

### Evidence and changes

[Update 44](https://www.warframe.com/en/patch-notes/pc/44-0-0) and the
[Banshee announcement](https://www.warframe.com/en/news/get-banshee-as-a-free-login-reward-to-celebrate-her-evolution)
confirm a single built Forma login gift. The revised guide states the exact promotional dates,
the separate later eligibility rule, and the distinction between a built item and a blueprint.
[Plague Star's announcement](https://www.warframe.com/en/news/operation-plague-star-2026) establishes
its September 23 end. That section now identifies its table as historical, preserves its existing
anchor, and makes no promise about post-event shop access or a future event date. The current
headline, summary, statistics and FAQ direct readers toward available methods. The September 24
review date reflects these checked substantive changes; unrelated guide dates remain unchanged.

The hypothesis is that accurate availability and an immediately usable reward better serve
Forma search visitors than expired farming instructions. Growth or retention cannot yet be
attributed to these changes without analytics access. The generic official patch index lists
Update 44, while its PC-specific index returned an older cached entry; individual release notes
were checked directly before drawing conclusions about freshness.

All twelve previous Forma snapshots matched the English baseline's structure/date. Translation
therefore updates seventeen changed/new fields and preserves 147 unchanged fields per locale.
Stable section IDs prevent the inserted reward section from shifting translations onto the wrong
content. Existing translation functions, SDK, pacing and validation are reused; source metadata
and destinations come from reviewed English. Generated wording still receives independent checks
for dates, eligibility, event status and descriptive headings before publication.

The Forma relic board now renders its existing heading, introduction, farming explanation and
contextual guide/map links in the server HTML. Interactive filters and results retain their client
boundary and fallback table. Client and server Vue compilation passed; a focused server render
confirmed one H1, the expected locale-prefixed links, explanation and table for EN/ES routes.
This preserves the existing layout and does not imply that the board's English UI has been localized.

### Validation and release

Local blocking tests passed: 548 API tests, 37 frontend tests and 26 guide regression tests
(611 total). The i18n compilation guard and generated repository-map check also passed.
Final guide validation checked 25 guides with zero failures. All twelve Forma snapshots are
current and preserve exactly 147 unchanged fields while updating seventeen fields each.
Independent review checked the gift's quantity, dates and eligibility, the ended event and
localized headings; precise reviewed date-format equivalents were retained instead of
replacing valid local notation with English dates. Targeted translation repairs addressed
incorrect game terms and ambiguous singular labels. Forma's title and description now match
the revised guide in all thirteen SEO entries. The remaining translation follow-up queue is
unrelated to Forma and is not represented as completed. The final diff passed whitespace checks.
All intended content, metadata, interface and documentation changes are included before the
full API/frontend/live deployment. The final workflow result and public production checks
are reported in the task; no documentation-only commit is left after that deployment.

### Follow-up priorities

Update Riven/Kuva guidance for the newly released Trait Locking rules before treating the old
cycling cost/stat-count statements as universal; distinguish the still-unreleased Splicing feature.
Continue the builds locale gap and board localization. Recheck the dated login offer around
October 7 and the separate Forma eligibility deadline rather than retaining undated availability
claims. Keep monitoring current data and use connected analytics to measure complete windows.

## 2026-09-24 13:01 UTC — Riven Trait Locking and current Kuva budgeting

This draft was paused before translation and deployment. Work resumed on September 30;
the continuation below records the new source review and production baseline for release.

### Baseline and opportunity

The preceding Forma iteration deployed commit `586d240` successfully in
[run 35999247193](https://github.com/eduair94/warframe/actions/runs/35999247193).
Its public verification passed all 21 checks at 12:35 UTC, including the new frontend asset,
all thirteen Forma guides and the newly server-rendered Forma board explanations.
This iteration began clean and synchronized with main; no deployment or guide refresh was active.

Ordinary public requests at 13:02 UTC confirmed API/Mongo, frontend, the current `BFzQWRPh.js`
asset and live feed were healthy. The catalogue contained 3,873 valid timestamps, a median age
of 174 seconds, 3,675 records under ten minutes old and none older than a day. Market analytics
contained 3,873 items and were generated about eighteen seconds before the check.
Riven and Kuva guides in English and Spanish returned 200 with self canonicals, index/follow,
26 hreflang aliases and localized headings. Their visible and Article review dates were July 18;
the server-rendered content did not cover Trait Locking. Eighteen related internal destinations
were checked and returned the expected pages without observed broken links.

Supermetrics was retried once and still returned UNAUTHORIZED, requiring reconnection. No
traffic/query statistics or property timezone were available; the complete 7-day and 28-day
comparison windows remain those recorded above. Browser authentication timeouts were not
repeated. Unavailable analytics are not zero traffic, and this iteration claims no traffic gain.

The content opportunity is a newly released mechanic that changes both the instructions and
the resource budget for an existing search topic. The hypothesis is that current, concrete
answers to locking and cycling-cost questions help readers act correctly and retain useful
visitors. It is not a measured ranking, click-through or retention effect.

### Source review and changes

[Update 44](https://www.warframe.com/en/patch-notes/pc/44-0-0) establishes that Trait Locking
is live, allows one existing trait to remain during cycling, doubles the Kuva charge and fixes
the positive/negative layout while active. Closing the menu removes the lock. Its
[developer workshop](https://forums.warframe.com/topic/1523869-riven-expansion-trait-locking-riven-splicing/)
is supplementary; the release notes take precedence over previews. Splicing remains separately
announced for the later Glacial Defiance release, with a dated statement rather than current
availability or invented acquisition details.

The original base cost and selection mechanics were checked against
[Hotfix 19.0.6](https://www.warframe.com/en/patch-notes/pc/19-0-6), and the ordinary 3,500 cap
against [Update 19.4](https://www.warframe.com/en/patch-notes/pc/19-4-1). The doubled 7,000
cost and 35,000-Kuva budget example follow directly from those inputs; they predict spending,
not the number of good rolls. The
[September Disposition announcement](https://forums.warframe.com/topic/1523355-september-2026-riven-dispositions/)
supports removing universal price predictions and the suggestion that cycling changes
weapon Disposition. The Riven article also clarifies equipping the challenged Mod and avoids
ranking rolls solely by the number of stat lines. Current primary sources precede older references.

Kuva's related spending advice is updated alongside the Riven article to avoid contradicting
the new feature. The registry summary no longer describes the Kuva resource as fuel for
obtaining Kuva weapons. The substantive source review justifies updating these two guide dates;
other guide dates remain unchanged. Source details and validation are completed before release.

### Translation safeguards

Before editing, all twelve Kuva snapshots matched their English baseline. Ten Riven snapshots
also matched; Polish and Ukrainian omitted only the final sentence/link in one paragraph.
History confirmed this was a localized omission rather than a different English structure.
The delta process preserves fields only when stable section ID, subpath and English text match;
the two omitted paragraphs are explicitly refreshed. It does not discard otherwise usable
Polish or Ukrainian translations. The existing SDK and shared request pacing are reused, with
raw responses preserved for independent review; suspicious numerical formatting is reviewed
for exact equivalence instead of automatically regenerating valid local notation.

### Release and next review

All intended content, metadata and this record will be committed before the full API/frontend/live
deployment. The task will report the final workflow and public checks without a trailing
documentation-only commit. Recheck the Splicing release when announced, continue the builds
translation gap and unresolved guide drift, and restore analytics access for outcome measurement.

## 2026-09-30 — Riven/Kuva review resumed with current release notes

### Current production and measurement baseline

The work resumed on `ac98bc3`, preserving the intervening outage-runbook changes. That commit
was deployed successfully by [run 36539300826](https://github.com/eduair94/warframe/actions/runs/36539300826)
on September 29 at 07:56 UTC. No competing deploy or guide refresh was active at resumption.
The September 29 provider network outage had recovered; this iteration does not switch hosts
or claim the separate, still-unrouted edge outage Worker is protecting the public hostnames.

At approximately 16:51 UTC, public API/Mongo, frontend, current `BFzQWRPh.js` asset and live
feed were healthy. API uptime was 118,461 seconds; all three server processes were online.
The catalogue had 3,892 valid timestamps, median age 145 seconds, 3,697 under ten minutes,
none in the future and one older than a day. Market analytics were about thirty seconds old.
The deployed service worker still used the public API origin and its intended cache exclusions.

The exceptional record was Perrin Arm Guards, last priced September 26 at 12:36:51 UTC.
Read-only checks at 16:55–16:57 UTC found that the upstream item, page, orders and statistics
all returned 200: one seller offered 25 platinum but was offline, and closed-trade statistics
were empty. Excluding offline sellers leaves no valid current price, so the importer correctly
preserves the last valid timestamp rather than inventing freshness. The stored order book also
retains its former 200-platinum offer and seller presence. Although the UI shows its real age,
an explicit stale state and suppression of old presence/contact actions remain a follow-up.
Distinguish last checked from last valid price in that work; do not substitute an offline quote
for a currently available offer or delete a valid upstream item.

Supermetrics was retried once on September 30 and returned UNAUTHORIZED. Search Console/GA4
statistics and property timezone remain unavailable. The intended complete comparison windows
are September 23–29 versus September 16–22 (seven days), and September 2–29 versus August 5–
September 1 (28 days), subject to the property timezone when access is restored. These are
measurement windows, not results; unavailable analytics do not establish zero traffic or growth.

### Additional substantive source review

The official patch index still listed [44.0.2](https://www.warframe.com/en/patch-notes/pc/44-0-2)
as the latest PC hotfix during this review. The September 29 update to the
[Glacial Defiance announcement](https://forums.warframe.com/topic/1523427-psa-glacial-defiance-release-window-outdated/)
announces October 7, 2026. Both the Riven article and its FAQ now date that upcoming Splicing
status explicitly. Trait Locking is already available. The article also covers shotgun Zoom
traits and the invalid-roll fixes and completed Kuva refund script in 44.0.2.

Kuva now distinguishes regular Kuva from Entropic Kuva and explains Melica's exchange:
10,500 regular Kuva per purchase, four weekly purchases, a calculated 42,000 maximum subject
to currency and remaining purchases. It names the shop locations and quest requirements
without inventing an Entropic Kuva price. [44.0.1](https://www.warframe.com/en/patch-notes/pc/44-0-1)
and 44.0.2 ground the new Entropic Eximus resistance and drop-fix advice. The guide corrects
the old Prime-relic claim for Requiem Fissures, explains the one-minute/200-base-Kuva Harvester
objective, separates eligible booster rewards from vendor bundles, and replaces unmeasured
Kuva-per-hour promises with explicit cycling budgets. Companion, access and Survival details
were also checked against official Updates 37.0, 35.0 and 22.17.

These substantive reviews justify September 30 dates for these two guides only. English
content was frozen before translation. The reviewed delta is 72 changed Riven fields with
79 preserved fields, and 97 changed Kuva fields with 59 preserved fields per locale. The
translation process refreshes the 169 changed fields and retains 138 fields only where the
English text and stable structural path match. Twenty-four snapshots and the corresponding
26 localized SEO entries are included in the release scope.
Large initial translation requests did not all produce a usable cache. The remaining work
uses cached batches of up to forty fields; some successful small batches still took more
than two minutes. Two workers share the existing minimum thirteen-second start gate,
with the existing quota/access stop rules and no model or account change. Independent review
identified specific terminology and meaning errors for small SDK-backed repairs rather than
regenerating valid translations or accepting numerical integrity as proof of linguistic quality.
A Simplified Chinese batch that echoed English was rejected and retried in isolation. A
temporary provider 503 affected the final Polish chunks; the successful chunks were retained
and the missing portion recovered through the paced retry. Repeated open-ended precision
requests also introduced unrelated wording errors. After all generators stopped, the remaining
reviewer-approved substring corrections in generated fields were applied by a helper
that asserted one exact match for each old span and recorded before/after hashes. Surrounding
text was preserved; this final normalization did not relax the content or translation guards.

### Validation and release

Fresh September 30 local checks passed: 548 API tests, 37 frontend tests and 26 guide
regression tests (611 total), plus i18n compilation and the generated repository-map check.
At 17:00 UTC, all twelve distinct internal destinations in the final English articles returned
200 with appropriate page titles and self canonicals, without redirects or observed soft 404s.
That inspection also found four linked tools whose H1 was absent from initial HTML because
of their client boundary. This iteration moves the existing localized Riven estimator heading,
eyebrow and introduction into the server render. Its dynamic estimate card, filters, results
and disclaimer retain client boundaries, and the existing fallback table remains available.
No wording, translation keys, estimator calculations or styling are changed. The same rendering
opportunity on `/endo`, `/flip` and `/relics-value` remains in the follow-up queue.
Focused client/server compilation and an actual vue-i18n server render passed for English
and Spanish: exactly one localized H1, introduction, eyebrow and fallback table, with the
dynamic card and estimator excluded from server output. A normalized mounted-DOM comparison
matched the previous page, the script and styles were unchanged, and the reused keys existed
in all thirteen locales. The production verification covers all thirteen estimator pages.
The 37 frontend regression tests also passed again after the page-boundary change.
Both independent locale reviewers approved the final twenty-four files: 2,028 changed field
pairs match their reviewed caches and frozen English, and 1,656 unchanged fields are retained.
Final guide validation checked all 25 guides with zero failures; Riven and Kuva no longer
appear in the translation follow-up queue. The remaining queue is builds in twelve locales,
Archon Shards in Russian, Focus and Resources in Simplified Chinese, and Standing in Polish.
The 26 title/description pairs now derive from the current localized guides and were reviewed
for content and usable length; Kuva descriptions retain the concrete sources and booster advice.
Repository-map and whitespace checks passed. The prepared public verification covers 26 guide
pages, thirteen estimator pages and six service/data checks, reading visible server HTML rather
than accepting embedded hydration data as page content.

All intended content, rendering, metadata and documentation changes are included before the
full API/frontend/live deployment. The task reports its observed workflow result and public
checks, without leaving a final documentation-only commit undeployed. The absence of connected
analytics still prevents a measured traffic or ranking claim.

The first full release, commit `d1cd993`, completed successfully in
[workflow 36755064198](https://github.com/eduair94/warframe/actions/runs/36755064198).
All 26 guide pages and six service/data checks passed at the public edge. The initial
45-check pass nevertheless found a real pre-existing rendering failure: only four of thirteen
Riven estimator pages contained weapon rows. French HTML captured a `429 Too Many Requests`
from the internal `/riven_weapons` fetch; the nine affected locale pages had empty
fallback tables despite valid headings and metadata. Concurrent localized SSR reads, plus
eight cache-warmer reads every 45 seconds, shared the API's 60-request loopback bucket.
The frontend's stale-while-revalidate cache could then retain the incomplete HTML. Slowing
the verification would hide the concurrency defect, so this iteration continues with a
targeted fix and a second full release before the final public verification.

The correction separates direct local GET reads from the public quota without increasing
the public limit. Eligibility requires the actual socket peer to be an exact loopback address,
a literal loopback Host with the expected port, no proxy/Cloudflare headers (including empty
ones), and no `/me` or `/build_*` route. POST and HEAD remain limited. Only the general
limiter receives this exception; authentication and sync limiters remain independent.
This deliberately does not use `req.ip` or `req.hostname`. Cloudflared also connects locally,
so checking the socket alone would incorrectly exempt public requests. The Host and header
checks reject that traffic; see the [Cloudflare header reference](https://developers.cloudflare.com/fundamentals/reference/http-headers/).
The existing broad `trust proxy` setting and its effect on client-supplied forwarding chains
remain a separate hardening task, not a security property claimed by this fix.
The focused suite passed all 89 cases, including real requests through the production
Express wrapper: over 60 internal reads remain available, the 61st public read still gets
429, empty/spoofed proxy headers do not activate the exception, and writes, account reads,
admin tokens and the independent sync/user limits remain enforced. A separate reviewer
also checked encoded and normalized route variants against the protected handlers.
The production TypeScript build and repository-map check passed.
The complete API suite then passed 637 tests across 46 suites. Together with the unchanged
37 frontend and 26 guide regression checks from this iteration, that is 700 distinct tests.
All correction code, regression tests and this deployment evidence are committed before
the second full API/frontend/live release. Final public verification uses the original
45 checks and concurrency of three, retaining the first failed pass as diagnostic evidence.

### Next review

Recheck Splicing and the dated Forma offer on October 7. Continue the twelve-locale builds
gap and remaining guide structure drift; restore analytics access before attributing traffic
changes. The exceptional stale order-book presentation and separate edge outage routing
remain concrete follow-up items, along with validating the proxy trust chain, without
manufacturing data freshness or recovery coverage.

## 2026-10-22 — released Splicing, Kuva vendors and honest market freshness

The interrupted October 21 review resumed on October 22 against production/main commit
`77ccb83`, whose full deployment succeeded in
[run 38171193350](https://github.com/eduair94/warframe/actions/runs/38171193350).
The daily maintenance schedule remains active; no duplicate schedule or quarterly refresh
was launched. The October 1 automated guide refresh failed safely with missing grounding
and provider timeouts, leaving all 25 guides unchanged. Its evidence requirements stay intact.

### Source review and useful content

The official PC index still lists Update 44.1.2 + 2.1 (October 15) as the latest release at
this review. Three guides received substantive October 22 reviews against
[Update 44.1](https://www.warframe.com/en/patch-notes/pc/44-1-0),
[44.1.1](https://www.warframe.com/en/patch-notes/pc/44-1-1),
[44.1.2](https://www.warframe.com/en/patch-notes/pc/44-1-2), the
[Riven expansion explanation](https://forums.warframe.com/topic/1523869-riven-expansion-trait-locking-riven-splicing/),
the [completed Kuva refund](https://forums.warframe.com/topic/1527399-psa-spliced-riven-kuva-cost-doubling-resolved-script-complete/)
and [Update 44.0](https://www.warframe.com/en/patch-notes/pc/44-0-0).

- Riven Splicing is now described as released. The guide distinguishes protection of a
  spliced trait without a Kuva surcharge from an additional ordinary Trait Lock that
  doubles cycling cost, explains layout restrictions and removal, and gives The Icebind's
  eligibility requirements. It identifies the corrected cycling-cost bug and completed
  refund without suggesting the historical bug is a current mechanic.
- Kuva now compares the actual 44.1 vendor bundles and their stated purchase limits.
  Hunhow requires both Emerald and Crimson Talents; an unstated Acrithis limit is not
  presented as unlimited. Vendor purchases do not receive Resource Booster multiplication.
  A practical calculation connects three 14,000-Kuva bundles to twelve ordinary capped-cost
  cycles or six cycles with ordinary Trait Locking, without inventing farming rates.
- Forma marks the Banshee giveaway as ended and retains the separate December 31, 2026
  deadline for eligible accounts' one-time built Forma. Previous Banshee recipients are
  not promised another reward. The expired Plague Star event remains dated reference material.

The growth hypothesis is that accurate answers to current player questions and clear links
to relevant tools improve useful search visits and return use. It is not a measured traffic
result. Publication dates and unrelated guide review dates are preserved.

English was frozen before localization: 22 changed Riven fields, 44 Kuva fields and seven
Forma fields per locale. The 36 localized snapshots refresh 876 fields and preserve 5,136
unchanged fields by matching both the stable structural path and exact previous English.
Complete cached translations were retained through provider failures. Repeated temporary
Gemini errors were followed by an explicit daily quota response; further model requests
stopped. The repository's existing `tr-file.mjs --engine free` backend completed only the
missing content and the four notice messages, with destinations, game names and numeric
values protected. Detected full or partial English fallbacks received isolated repairs.
Independent review corrected literal gameplay mistranslations and checked every changed
field against the frozen source. Exact substring corrections are bounded to one match and
record before/after hashes; numeric format exceptions require an exact reviewed field pair.
The metadata entries derive from each current localized guide, rather than keeping old
announcements in search descriptions.

### Market data and rendering

The service baseline passed 24 of 25 checks: frontend/API/Mongo/live availability, canonical
and structured-data origins, sitemaps, robots, linked routes and current service-worker
configuration were healthy. Price freshness failed independently. At approximately
13:02–13:04 UTC on October 22, all 3,892 catalogue records were over a day old; the newest
recorded price was `2026-10-18T03:04:14.479Z`, approximately 106 hours old. A recently
generated analytics response does not make its underlying prices current.

Read-only checks found the separate sync processes and Mongo tunnel working, but
warframe.market returned a 403 Cloudflare challenge. The existing price circuit breaker
pauses between probes, and [monitor issue #6](https://github.com/eduair94/warframe/issues/6)
already tracks this failure. No proxy/account rotation, forced retry or cooldown reset was
used. Provider access remains an external blocker; the release does not claim to repair it.

A shared market notice uses the existing catalogue's recorded price timestamps. It warns
when even the newest valid price is older than three hours, rejects future dates and shows
a separate unknown-date message when freshness cannot be determined. Empty catalogues
do not create an unsupported warning. The recorded date is displayed explicitly in UTC.
The SSR clock is serialized for hydration, a minute timer updates elapsed age and is cleaned
up on unmount, and reactive route gating removes the notice from guide pages even if the
store retains market data. No additional catalogue requests or polling were introduced.

The existing localized titles, eyebrows and introductions of `/endo`, `/flip` and
`/relics-value` now render in initial server HTML. Dynamic controls and results retain their
client behavior and existing fallback tables. Actual Vue SSR checks passed 52 locale/mode
combinations; eight mounted comparisons covered English/Spanish and empty market data.
The notice's focused checks cover hydration, changing catalogue data, timer cleanup and
156 route combinations across thirteen locales. Unknown dates do not assert a known age.

### Validation and remaining measurement access

The root unit suite passed 679 tests in 52 suites, guide regression checks passed 26 tests,
frontend regression checks passed 37 tests, and the backend production TypeScript build
passed: 742 distinct automated tests. The notice's nine logic cases are included in that
total. Existing advisory lint/typecheck debt is not described as a passing project-wide gate.
Final offline checks passed all 25 guide validations, the 13-locale i18n compile gate and
the generated repository-map check. Both locale reviewers verified the written snapshots
against the approved cache hashes: all 876 changed fields match and 5,136 unchanged fields
remain intact. All 39 guide title/description pairs were reviewed; a German ordinal-date
sentence split was corrected so the Forma deadline retains December 2026. Public release
verification covers 39 guide pages and 39 tool pages in addition to service/data checks.

The next review should prioritize restoring authorized upstream price access, the existing
twenty-guide 90-day review queue and the remaining translation gaps (builds in twelve
locales, Archon Shards in Russian, Focus/Resources in Simplified Chinese and Standing in
Polish). Those dates and gaps remain visible rather than being reset by this release.

Supermetrics discovery still returned UNAUTHORIZED during the October 21 attempt; GA4 and
Search Console require reauthentication before property data can be read. No analytics
were retrieved, and missing access is not zero traffic. Once access is restored, compare
complete October 15–21 versus October 8–14 and September 24–October 21 versus
August 27–September 23 windows, adjusting to the property's actual timezone. Do not infer
ranking or traffic gains from a successful deployment.

All intended code, content, localization, metadata and documentation changes are committed
before the complete API/frontend/live workflow. The task's release report records the final
workflow and public verification rather than leaving a documentation-only commit undeployed.

## October 23, 2026 — Hotfix 44.1.3 and Endo follow-up

The October 22 release completed its full API/frontend/live deployment in
[run 39789962475](https://github.com/eduair94/warframe/actions/runs/39789962475)
at `6bd835421417c1303babecb6eab268fdfde230b2`. All 39 localized guide pages passed
public checks. Endo's initial HTML exposed an existing edge case: valid liquidity filters
could leave a bare empty table. A Spanish browser check also found that its guide link
opened the English route. This iteration makes loading errors, no data and no matching
filters explicit in all 13 locales, and preserves the selected language on that link.
It retains the existing filters and calculations. Actual Vue rendering passed 104
locale/state scenarios plus 13 localized guide destinations.

### New official information

[Hotfix 44.1.3](https://www.warframe.com/en/patch-notes/pc/44-1-3), released October 22
after the previous review, removes weapon-specific Riven Dispositions. Every Riven now
uses the stat-range multiplier equivalent to the former 1.2. It also restores Riven
trading and caps combined Ammo Efficiency at 75%, with explicit Infinite Ammo effects
remaining separate. Riven and Mods explanations now reflect those rules; comparison
advice points to current in-game values and current asking prices.

Kuva and Forma explain the all-player login inbox of two built Forma and 100,000 Kuva,
available through December 31, 2026 at 11:59 p.m. ET. The separate compensation for
players who installed a Splicer before the hotfix is distinguished from that gift;
delivery by script is not presented as already completed. The earlier Banshee reward
retains its own eligibility. The released patch's two Forma supersede the earlier
workshop's one-Forma announcement.

Four English guides received substantive reviews dated October 23. Localization uses
41 changed fields per language: 492 refreshed fields across 48 snapshots, with 8,028
unchanged fields and publication dates preserved. Game names, numeric values, links,
eligibility conditions and deadlines received explicit translation review. Targeted
provider repairs and 633 exact reviewed corrections address mistranslated mechanics,
gift conditions and timezones; 24 exact numeric-format equivalents are recorded
separately. Search descriptions and the guide directory are updated
with the same facts. No new filler pages or unsupported traffic claims are introduced.

### Riven metadata and data recovery

The public Riven weapon feed still carried 389 obsolete multipliers among 420 weapons.
The importer, weapon list and detail response now expose the common 1.2 value while
retaining the legacy field name for compatibility. Regression checks ensure that stored
auction attributes, asking prices and Endo values are not rescaled. The UI calls this
a shared stat multiplier and explains that saved listings can predate the change.
The estimator's price and grade calculations remain based on the stored listings.

The user's subsequent fixes to fixed proxy egress and nested CDN reads are preserved.
At this iteration's baseline, the successful full deployment
[39898267223](https://github.com/eduair94/warframe/actions/runs/39898267223) served
`78204679ed5c271261fcb49c104de41ef00eecd4`; all three application processes were online.
New prices had resumed: the newest record was about 44 seconds old, 874 of 3,892
catalogue prices were under three hours old, and 3,018 remained over a day old.
Endo again had a real row meeting its default liquidity filters. These are recovery
measurements, not proof of fully current catalogue coverage. The October 22 complete
upstream freeze is historical, not the current diagnosis.

The existing notice detects an old newest timestamp. It does not measure full coverage:
one fresh record can hide it while many other prices remain old. A subsequent improvement
should show fresh/stale/unknown counts from the same catalogue without new polling.
Post-deploy checks continue to report coverage independently and distinguish actual
table rows from localized empty/error messages.

### Release verification and follow-up

The local backend suite passed 702 tests in 55 suites, the frontend suite passed
37 tests and guide regression checks passed 26 tests. The backend production build
and 13-locale message compilation passed. All 25 guide validations and the generated
repository-map check passed; the four changed guides have no translation follow-up
warnings. The new Riven metadata cases are included
in those backend totals. Another 26 actual localized disclaimer renders verify the
shared multiplier with no weapon selected and with obsolete selected metadata.
Existing advisory lint/typecheck debt is not described as a clean project-wide gate.

All intended documentation is included before the full deployment; the completion
report records the final workflow and fresh public service/page checks. The active daily
10:00 Montevideo maintenance heartbeat already requires this full deployment process.
GA4/Search Console access has not been restored or measured in this iteration, so no
traffic or ranking improvement is claimed. Once available, compare complete October
16–22 versus October 9–15 and September 25–October 22 versus August 28–September 24,
adjusting to the property's actual timezone. The existing overdue guide review queue
and untranslated content gaps remain visible. Historical research articles for external
Riven tools also need a separate source review following the Disposition change; the
updated directory guidance asks readers to confirm 44.1.3 support before using their
range estimates and does not claim those external tools have already updated.

## October 23, 2026 — Endo accuracy and catalogue coverage

The daily follow-up starts from the successful full deployment
[39902201087](https://github.com/eduair94/warframe/actions/runs/39902201087),
commit `7167704e5f76276204c6ad2b4e71ad85fea8ba7b`. At 13:03 UTC all three
application processes were online. Of 3,892 catalogue prices, 3,761 were updated
within three hours, 131 were older and 67 were over a day old. The newest record
was about 49 seconds old. Endo's English and Spanish pages each rendered 40 real
item rows. Recovery is substantially broader than the preceding release, but
recent activity alone does not establish that every price is current.

### Endo guide review

The guide now states the 40,920-Endo cost of taking a standard rank-10 Primed mod
from unranked to maximum, replacing the incorrect approximately 140,000 figure.
It distinguishes a Mod Drop Chance Booster's effect on enemy drop probability
from pickup amounts, reward tables and sculpture conversion values. Arbitration
Endo rewards are random alternatives, rather than guaranteed on every rotation;
access comes from the Eris Junction Focus Lens task. Disruption grants a reward
per completed round, not per defended conduit. Arbitration Shield Drones can
drop Endo and Vitus Essence from separate tables.

Sources include the [official PC drop tables](https://www.warframe.com/droptables),
dated October 22 when downloaded, and official Updates
[35.5](https://www.warframe.com/en/patch-notes/pc/35-5-0),
[39](https://www.warframe.com/en/patch-notes/pc/39-0-0),
[41.1](https://www.warframe.com/en/patch-notes/pc/41-1-0) and
[40](https://www.warframe.com/en/patch-notes/pc/40-0-0).
Fusion costs and sculpture socket values were cross-checked with the linked
Warframe Wiki tables. Unsupported hourly rates, universal fastest-farm claims,
fixed Maroo week assignments and cheap-trade promises are removed. The guide
compares accessible farms, explains reward probabilities and directs readers to
check current offers and exact conversion previews. Archon Hunt access and
sculpture vendor descriptions are corrected. Hotfix 44.1.3 remains the latest
official patch found during this review.

The substantive review updates Endo's review date to October 23. All 87 changed
display fields are localized in twelve snapshots: 1,044 refreshed strings, with
1,608 unchanged strings and publication metadata preserved. Post-generation
semantic review applies 803 exact corrections and records 212 exact numeric-format
equivalences. It checks probabilities, conditions, drop mechanics, costs, names
and links rather than relying only on automatic shape checks. The English
directory summary and all 13 search
descriptions use the corrected scope and costs. No new pages are created solely
to target keyword variations.

### Honest partial coverage

The market notice now counts fresh, stale and unknown timestamps in the existing
catalogue pass. Mixed coverage displays all three counts instead of disappearing
as soon as one recent item exists. Three hours exactly is fresh; older records
are stale; invalid or future dates are unknown. An empty catalogue and a fully
fresh catalogue remain silent. All-stale and all-unknown states retain their
existing messages. This uses the existing payload and serialized SSR clock,
with no extra requests or polling. All 13 locales have reviewed copy.

### Validation and next measurement

The backend suite passes 706 tests in 55 suites, the frontend suite passes 37
tests and guide refresh regression checks pass 26 tests: 769 automated tests.
The production backend build and locale message compilation pass. All 25 guide
validations and the generated repository-map check pass; Endo has no translation
follow-up warnings. The freshness
component also passes actual client/server compilation, all 13 localized SSR
renders, clock consistency, reactive catalogue updates, timer cleanup and 156
route-gating checks. Existing advisory lint/typecheck debt remains separate
from these passing checks.

All intended content, translations, code and documentation are committed before
the complete API/frontend/live deployment. Public verification after deployment
checks the released revision, processes, health, assets/live service, all 13 Endo
guide pages and representative Endo tool pages. Coverage counts are compared
with each page's own SSR payload rather than a different API snapshot.

One Supermetrics discovery attempt again returned UNAUTHORIZED. GA4 and Search
Console require reauthentication; no traffic values or ranking gains are inferred.
Once accessible, compare complete October 16–22 versus October 9–15 and
September 25–October 22 versus August 28–September 24 in the property timezone.
The remaining overdue guides, translation gaps and external Riven-tool research
remain on the review queue; unrelated review dates are preserved. The existing
daily 10:00 Montevideo maintenance automation remains active.

## October 24, 2026 — Stable mission indexation and current Riven tools

The iteration starts from the successful full deployment
[39962615356](https://github.com/eduair94/warframe/actions/runs/39962615356),
commit `a6cdf3e77b5c583c2e03cfd5c4e8f0ff54e660dc`. At approximately 21:29 UTC,
all three application processes and ten public health/asset/SEO checks passed.
The catalogue had 3,772 of 3,892 prices within three hours (96.9%), 120 older
and 18 over one day, with no invalid timestamps. Endo had 52 mods meeting its
default filters and 40 real SSR rows in both English and Spanish. Availability
and recent activity do not establish that every catalogue price is current.

### Mission pages should not disappear when prices move

The baseline English and Spanish sitemaps disagreed on four mission URLs.
Falling Glory returned HTTP 200 with `noindex` despite publishing 19 rewards
across three rotations: its best reward value was approximately 0.6003 platinum,
below the previous one-platinum indexation threshold. Saya's Visions had also
disappeared from a sitemap snapshot while its current page was indexable.
This coupled discovery of useful farming information to changing market prices.

Mission list and detail responses now use the same stable content rule: node
metadata, or at least two distinct named rewards with finite probabilities above
zero and at most 100 percent. Blank, malformed and duplicate-only tables do not
qualify. Normalization prevents repeated casing, spacing or full-width text from
counting as different outcomes. Non-tradeable blueprints, Credits and Endo can
still answer farming questions. This minimum is our content safeguard, not a
Google ranking requirement. Existing curated-note exceptions remain intact.

On the saved 435-mission snapshot, the rule changes API eligibility from 295 to
432: 137 existing pages become eligible and none lose eligibility. No routes or
filler pages are added. List and detail decisions agree for all 435 missions at
prices of 30, 0.6 and zero platinum (1,305 comparisons); prices, rewards and slugs
are preserved. The three excluded tables each contain only one distinct valid
reward. Search-engine crawling, actual index inclusion and traffic gains remain
unmeasured. Public verification checks sitemap/page agreement after the existing
API caches refresh; no cache namespace or broad invalidation is introduced.

### Riven tool descriptions and search metadata

The [official patch index](https://www.warframe.com/en/patch-notes) still lists
[Hotfix 44.1.3](https://www.warframe.com/en/patch-notes/pc/44-1-3) as the latest
patch, and the [news index](https://www.warframe.com/en/news) has no newer lead
article than October 19. Eleven obsolete weapon-Disposition statements in the
Semlar Riven Calculator, Samodeus and Frame Hub research records are corrected.
Two absolute security guarantees in Semlar's record are replaced with bounded
observations about its public browser access. This is a targeted correction;
unrelated guide review dates and historical source statements are preserved.

[Semlar's calculator](https://semlar.com/rivencalc) still displays a Dispositions
section, and [Samodeus's developer listing](https://top.gg/bot/333058936859000832)
does not establish support for the new rules. Their compatibility remains
unverified; neither is declared incompatible solely for lacking evidence.
Frame Hub now redirects to [Voidforge](https://void-forge.org/), whose
[Riven Grader](https://void-forge.org/riven-calculator) explicitly describes
standardized 1.2x ranges. The text attributes this statement to the tool without
claiming an independent calculation test. The directory updates the brand and
destination while preserving `/tools/frame-hub`; old-domain facts and the
historical screenshot are removed so they are not attributed to the new site.

The thirteen changed English fields and six source labels/snippets are translated
through the repository's translation tool and reviewed across all twelve other
languages: 228 generated strings reviewed, thirteen exact semantic repairs,
and numeric fidelity checked, including localized decimal separators. Only the
selected fields and new source entries are replaced; other
research records, tiers and metadata are preserved. Tool-page search titles now
use the existing localized overview label, and descriptions use the localized
summary without the appended English boilerplate. SoftwareApplication markup
no longer identifies Void Ledger as publisher of third-party tools; the explicit
self-listing retains its publisher identity.

### Endo language and verification

The Spanish browser baseline visibly said “precios actualizados 7 minutes ago”.
Endo now formats relative update times in all thirteen languages using native
Intl formatting. It reuses the existing serialized market clock and minute
timer, responds to language/feed changes, and rejects invalid, impossible,
timezone-free or future timestamps. No requests, timers or language bundles
are added. SSR and hydration share the same clock, and concurrent requests do
not mutate a global date-library locale.

All blocking local checks pass: 716 backend tests in 55 suites, 42 frontend
tests and 26 guide regressions, totaling 784. The backend production build,
locale-message compiler, 25 guide validations and repository-map check pass.
Focused checks also cover actual Endo bindings, all thirteen language outputs,
clock/timer lifecycle, and client/server compilation of the affected Vue pages.
Existing advisory lint/typecheck debt is not represented as a clean project-wide
gate. All intended code, translations and documentation are committed before
the final complete API/frontend/live workflow. The completion report and
automation memory record its outcome and public release evidence.

One Supermetrics discovery attempt again returned UNAUTHORIZED. GA4/Search
Console are unavailable, not zero. Once access is restored, compare complete
October 17–23 versus October 10–16, and September 26–October 23 versus August
29–September 25, using the property's timezone. The daily automation remains
active. Remaining leads include overdue guides and translation gaps, outdated
Duviri mission-note requirements, missing node facts in the sampled mission
responses, and historical tool-research community references that require a
separate relevance review. None of their review dates was advanced here.

## October 25, 2026 — Price transport recovery and Duviri review

The initial production revision is `6baa4fb7b4ee050b189cc86371f46bd0f6b77d24`,
with API, frontend and live feed online and no duplicate deployment running.
Only 149 of 3,892 catalogue prices are within three hours (3.8%); the median
age is approximately six hours. Recent individual updates do not establish
healthy bulk coverage. English and Spanish Endo still render 40 real rows,
with 53 mods meeting the default filters. Nine of ten general checks pass;
catalogue freshness is the failing check.

The bulk synchronization host's fixed egress session has exhausted its 1,024
file descriptors, including 1,016 sockets in FIN_WAIT2. Its price loop records
zero successful updates and hundreds of skipped items. A targeted restart of
the existing egress tunnel at 13:04:51 UTC restores the transport without
changing request limits, credentials, security settings or process topology.
By 13:11:46, the same price loop has saved 240 updates and the session uses 21
descriptors with no FIN_WAIT2 sockets. This demonstrates resumed processing,
not full catalogue freshness or proof that every historical price is current.

Code inspection also finds an unclosed per-attempt Undici dispatcher and error
paths with unread response bodies. GET and POST now destroy their owned
dispatcher in a finally block, including successful parsing, parse failures,
connection failures, refusals and retries. Destroying incomplete streams avoids
waiting indefinitely for an error body. Fixed egress selection, rate limiting,
backoff and refusal handling are preserved. Six new tests include real local
connections and an unfinished error response, plus retry and refusal cases.
The focused suite passes 14 tests; the complete backend suite passes 722 tests
in 55 suites and the production build passes. Frontend tests pass 42 cases;
guide regressions pass 26, locale compilation and repository-map checks pass.
Existing advisory lint/type debt is separate from these blocking checks.

The transport repair is released first while the source-reviewed Duviri
translations are prepared. Its exact committed revision is also installed on
the existing synchronization host, using Node 24 and restarting only the two
existing continuous price/auction jobs. The final content release follows the
same complete API/frontend/live workflow; no final commit is left undeployed.
Public verification and exact release proofs are retained in `tmp/oct25-*` and
the maintenance memory after the workflows complete.

A separate investigation finds no stored node-metadata document and no scheduled
`sync_nodes` entry; the absence of mission facts is not a diagnosed join bug.
That bootstrap gap remains a next-iteration priority. One analytics discovery
returns UNAUTHORIZED: GA4/Search Console are unavailable, not zero traffic.
Once accessible, compare complete October 18–24 against October 11–17 and
September 27–October 24 against August 30–September 26, in the property timezone.

### Duviri: current access, useful reward choices and search copy

The official patch and news indexes still lead with Hotfix 44.1.3 and the
October 19 PMCFQ streamer schedule. The existing Duviri guide, reviewed in July,
repeatedly promises immediate access without Star Chart progress. Its Spanish
page and search description reproduce that error. Other statements confuse the
weekly Warframe reward choice with playable equipment, promise repeated Steel
Essence earnings, treat each Kullervo/Orowyrm fight as a separate Bane reward,
and describe every Decree as having no downside.

The revised guide answers concrete planning questions: complete the Uranus
Junction and quest; choose a weekly reward before the Circuit run; distinguish
borrowed equipment from earned blueprints; obtain normal blueprints at tiers
2/5/8/10; choose Steel Path rewards in order for tiers 5/10; and recognize the
25 Steel Essence reward at tier 9. It explains the additional normal Circuit
and Lone Story completions for Duviri Steel Path, the separate Zariman
requirement for installing adapters, Spiteful Decree penalties and useful
Opportunity milestones. Lone Story is included and later Isleweaver access is
distinguished from the guide's original-mode scope. Unsupported time promises
and hostile squad assumptions are replaced with practical goal/extraction advice.

Kullervo's Bane requires both Kullervo and the Orowyrm in the same session.
The guide retains and specifies the final recipe's 10 Pathos Clamps after
checking current WFCD item/resource identifiers. It does not invent an exact
Bane purchase price from an unverified source. Existing video availability,
titles and channels pass all four oEmbed checks; a new adjacent note explains
that older visual walkthroughs can differ from the current reviewed rules.
That check does not claim a complete factual review of every video.

Primary evidence includes the [current quest guide](https://www.warframe.com/en/guides/quests/the-duviri-paradox),
[quest-access change](https://www.warframe.com/en/patch-notes/pc/36-0-8),
[current base Steel Path scope](https://www.warframe.com/en/patch-notes/pc/38-5-3),
[Duviri completion tracking](https://www.warframe.com/en/patch-notes/pc/33-5-6),
[Circuit reward definitions](https://www.warframe.com/en/patch-notes/pc/33-0-0),
[Kullervo and Spiteful Decrees](https://www.warframe.com/en/patch-notes/pc/33-5-0),
[alternative Circuit rewards](https://www.warframe.com/en/patch-notes/pc/34-0-0),
[Isleweaver](https://www.warframe.com/en/patch-notes/pc/39-0-0) and current
[WFCD crafting data](https://raw.githubusercontent.com/WFCD/warframe-items/master/data/json/Warframes.json).
Historical launch statements are superseded by the later access updates.

The central search description removes the immediate-access claim, the directory
summary and reading time agree with the guide, and contextual links now lead
directly to the existing Circuit tracker. No new keyword-variant pages are added.
Five Duviri mission-note replacements correct their access/reward descriptions
and the obsolete Steel Path Armor multiplier, preserving their existing
English-only design. All 16 Duviri rows select the right note, while all 419
other mission rows retain their previous notes.

The separate node-metadata feasibility check finds that blindly scheduling the
existing importer would expose incorrect facts: eight Archwing rows use the
wrong Steel Path level increment, Circuit is labelled Free Roam, and Vesper
Relay conflicts with Follie's Hunt drop content. Eleven newer joined nodes lack
some facts. Source compatibility and safe joins must be addressed before that
bootstrap; the importer was not run against production.

The English guide and all twelve localized snapshots now share the October 25
source review. Only the 60 changed display fields per locale are replaced;
63 unchanged translations are preserved. Including each localized search
description, all 732 generated strings receive semantic review, with 304
corrections for meaning, grammar and formatting. This catches a rank-6/rank-4
mix-up, extraction instructions, reward-choice confusion and literal translations
of game mechanics. Five locales use the existing Gemini translator; after its
Korean request fails with a transient fetch error, the project's built-in free
backend generates the remaining seven with protected names, numbers and URLs.
One English echo is regenerated. French "Modes" is an explicitly checked shared
word, not untranslated prose. All final quantities, links and balanced bold
markers pass; the twelve descriptions are at most 160 characters. Snapshot
deep-equality checks preserve unrelated copy and synchronize sources, dates,
videos and destinations. No other guide receives a new review date.

The urgent full deployment
[40196572721](https://github.com/eduair94/warframe/actions/runs/40196572721)
successfully releases `ff942ed20cd551511e4764e57601620f81042053` at 13:19 UTC.
Its public verification finds API, frontend and live online at that exact SHA.
By 13:38 UTC, 1,202 of 3,892 prices are within three hours (30.9%), up from
149 at baseline. Both egress sessions use twelve file descriptors; the restarted
price loop records 759 successful updates and no errors. The median remains
about six hours and the freshness threshold still fails: recovery is ongoing.

Validation for the iteration passes 722 backend, 42 frontend and 26 guide
regressions (790 tests), backend compilation and the locale/repository checks.
The final content snapshots pass the guide validator and locale compilation
again. Eighteen other guides remain in the overdue review queue; follow-up
translation gaps remain documented rather than silently assigned fresh dates.
The final commit includes this record before the complete production workflow.
After release, the prepared checks compare all thirteen public guide pages with
their frozen reviewed snapshots, verify mission notes and public health, and
exercise Spanish guide-to-Circuit navigation on mobile and desktop. Exact final
release and recovery measurements will be retained in ignored evidence and the
maintenance memory; this paragraph does not pre-claim those post-deploy results.

## 2026-11-02 — Endo estimates, current Ducats and Steel Path

Starting production revision `9f574fb` preserves the October 27–28 egress,
socket and locale/freshness-banner changes. Public baseline checks pass 10/10:
3,672 of 3,893 prices (94.3%) are under three hours old, 221 are older and twelve
exceed a day; median age is 51.4 minutes. The live socket is connected and the
bounded sync log has no 429/403 errors. Historical statistics can still be older.

The hypothesis is that reliable calculations and current answers improve the
usefulness of existing search landing pages. No traffic effect is claimed.
One Supermetrics discovery returns UNAUTHORIZED, so Search Console and GA4 need
reauthentication. Once available, compare complete October 26–November 1 against
October 19–25, and October 5–November 1 against September 7–October 4, using the
property timezone.

### Endo and Ducat calculations

The default Endo table used historical maximum-rank averages. Observed Ammo Drum
data has a 99,999p average, 6p current lowest ask and 2p buy-in, producing a
99,997p default margin. The default now uses the current ask, estimating 4p on
that same snapshot. Explicit average and instant-sale modes remain available.
Each mode requires its own positive, finite quote; missing quotes no longer
silently substitute another model. Localized help explains listing versus sale
uncertainty, buy-order execution and historical outliers. This does not identify
the cause of the extreme upstream average or guarantee execution at an ask.

[Hotfix 44.1.4](https://www.warframe.com/en/patch-notes/pc/44-1-4)
reduced Nami Skyla Prime Blade from 100 to 65 Ducats. Its nested stored value is
still 100 and the top-level field is missing. Only 58 stored items have that
field; the current bulk catalogue supplies 757 positive values, comprising 594
individual parts and 163 assembled sets. Previously enriched items were skipped
indefinitely. The importer now refreshes Ducats from its existing bulk response,
validates exact identity and updates that field alone with compare-and-set and
no upsert. Absent or malformed source values preserve stored data; explicit zero
is valid. No per-item request is added. The calculator excludes assembled sets
and requires positive valid exchange values and market prices.

The Ducat page's existing heading and introduction now render in the initial
server response, ahead of the real fallback table. Previously the entire hero
was client-only, leaving the initial HTML without an H1. Interactive controls
retain their client rendering. The regression renders the actual templates
with English and Spanish messages and checks the heading and data rows.

A bounded production refresh is prepared for after deployment: committed helper,
exact revision checks, guarded writes, saved restore plan and verification of
unchanged metadata. It does not write prices, rosters or timestamps. The actual
public coverage and refreshed values will be checked after release.

### Steel Path content and search intent

The revised guide uses 17 Digital Extremes sources. The
[current base unlock](https://www.warframe.com/en/patch-notes/pc/38-5-3)
excludes Zariman, Albrecht's Laboratories and Höllvania. Corrections cover
standard +150% health/shields, the removed armor multiplier, separate Archwing
and Railjack modifiers, six daily Incursions and their access conditions,
Acolyte pickups versus fixed rewards, Retriever mods, current shield gating,
Overguard, Toxin/Slash and Operator recovery. Circuit Incarnon adapters are
distinct from Teshin purchases. The
[Railjack revision](https://www.warframe.com/en/patch-notes/pc/43-0-6)
awards two Essence on mission completion, replacing its initial Eximus drops.
Unsupported fastest-farm and build guarantees are removed.

Central search copy, the directory summary and contextual Circuit links agree
with the revised content. All four existing videos pass oEmbed availability,
title and channel checks; an adjacent note warns of superseded walkthrough
rules. This is not a factual review of the videos. Only Steel Path receives the
November 2 source-review date. Twelve localized snapshots and search descriptions
are updated from the English source while unrelated translations are preserved.
The Endo help is localized alongside them; meaning, numbers, links, placeholders
and snapshot consistency are checked before release.

The initial Gemini call failed with a transport error. The built-in free
translator completed eleven locales and part of Ukrainian, then returned a rate
refusal. Requests were stopped; a cooldown check still returned 429. As an
explicit exception to the normal generator-only workflow, 34 remaining or
partially translated Ukrainian strings are completed locally against the reviewed
English and existing Ukrainian copy, with a separate independent review. They
are not represented as successful provider translations. All locales receive
semantic review, including the default Endo model and search descriptions;
English fallback prose is not accepted as completed localization.

The integrated review covers 1,044 localized strings, with 812 semantic
corrections to provider output or incomplete Ukrainian text. Each locale updates
85 guide fields while preserving 68 unrelated fields, plus its search description
and Endo explanation. All twelve descriptions stay within 160 characters;
links, placeholders, numerical values and formatting pass integrity checks.
The independent Ukrainian pass adds four clarifications to unlock scope and
thousands formatting, with no outstanding factual blocker.

The latest official patch is 44.1.4.1 (October 28); Tau is announced for December,
not already released. These checks do not justify filler pages or unrelated
review-date changes. Node-metadata work remains deferred: unchanged sources have
two incompatible joins, eleven incomplete entries and eight Archwing level
adjustments requiring a separate repair.

Local validation passes 740 backend, 51 frontend and 26 guide tests (817 total),
including the actual Endo query/model selection, guarded metadata writes and
English/Spanish Ducat server rendering. Backend production compilation passes.
The final guide validator, locale compiler and generated repository-map check
also pass. Seventeen other guides remain in the review queue; existing unrelated
translation follow-ups retain their original dates.

The first full release `1e480121fac5e77ca66089b7f6dddb996622883b`
([workflow 41395728158](https://github.com/eduair94/warframe/actions/runs/41395728158))
passes at 05:52:20 UTC. All thirteen public guide snapshots and their metadata
match the reviewed sources. Endo's browser check confirms the current-ask default,
missing-bid exclusion and explicit historical-average option. The sync checkout
advances to the same SHA without changing four worker/tunnel PIDs or six critical
compiled transport modules. The guarded Ducat refresh changes 699 values: all
match their expected results and none of nine protected metadata fields changes.
Coverage rises from 58 to 757 positive values; Nami Blade is 65 and its set is 235.
One concurrent price-loop update is observed; the refresh writes no price fields.

Production verification then detects a filter regression: 157 individual parts
carry inherited `set` tags (and even `set: true`), including Tigris Prime Receiver,
Helios Prime Carapace and Equinox Prime Blueprint. Treating those tags as assembled
sets hides valid offers. The follow-up identifies assembled sets by their canonical
`_set` slug, retaining those individual parts. Actual catalogue fixtures extend
the regression coverage. On the captured catalogue the corrected filter yields
593 eligible offers: 594 individual parts, less one without a positive ask.
All 163 assembled sets stay excluded; nine focused frontend regressions pass.
This correction receives a second complete deployment; the metadata refresh is
already applied and must not be repeated.

All intended code and documentation are committed before the final full
API/frontend/live workflow. Final gates, release proof, the Ducat refresh and
public/browser results are retained in ignored `tmp/nov02-*` evidence and
maintenance memory. This entry does not pre-claim post-deployment results.

## 2026-11-02 afternoon — crawlable tool introductions and factual corrections

The read-only 13:04 UTC baseline is healthy: ten public checks pass, the live
socket is connected, and API/sync checkouts match `df2b90f953e6f49629875de676ef7869ba1b53e4`.
Of 3,893 catalogue entries, 3,745 (96.2%) have a usable price less than three
hours old. Fourteen are over a day old. All fourteen were attempted during the
12:35 UTC loop and skipped by the existing all-zero quote guard. Three bounded
source checks confirm absent or offline-only orders. These timestamps describe
the last usable quote, not the last fetch attempt; there is no evidence here
of a stopped worker. Quote-attempt provenance remains a separate follow-up.
The morning Ducat refresh remains applied and is not repeated.

Analytics discovery returns unauthorized. GA4/Search Console traffic and
conversion comparisons remain unavailable, rather than zero. The acquisition
hypothesis is that clear, accurate introductions in server-rendered HTML make
these useful tools easier to understand and index. No traffic uplift is claimed.

### Eight tool pages available before JavaScript

All sixteen public baseline snapshots (English and Spanish for eight tools)
have real tables, correct canonicals and language alternates, but no H1 or
introduction. The comparison, screener, movers, volatility, timing, vault-spikes,
vaulted and vaulted-worth pages now render their existing localized heading and
introduction on the server. Dynamic hero offers, filters and tables preserve
their client behavior and existing fallback data. Independent template review
confirms the client hierarchy and bindings are preserved. Eight regressions
render the actual templates in English and Spanish with populated and empty
data, checking one localized H1 before the real table and client boundaries.

The three vaulted introductions are also corrected. Owned relics can still be
opened, Prime Resurgence can return selected relics, and vaulted status does not
guarantee higher prices. Aya purchases relics rather than completed Prime gear;
availability, drop chances and player time matter when comparing routes. These
claims are grounded in the [Prime Resurgence page](https://www.warframe.com/en/prime-resurgence),
the [official FAQ](https://forums.warframe.com/topic/1285421-prime-resurgence-dev-workshop-faq/)
and [Update 44](https://forums.warframe.com/topic/1523956-update-44-iceblade-of-narin/).

### Targeted Arcanes corrections

Twenty-five fields are corrected against ten primary Digital Extremes sources.
Primary/Secondary adapters are distinguished from Melee adapters and the
Whispers in the Walls segment requirement. The 21-copy progression applies to
arcanes reaching Rank 5, rather than every arcane family. Acrithis's rotating
Duviri selection and Opportunity Rank 9 requirement replace false claims that
she directly sells Eidolon staples. The guide distinguishes the Quills, Vox
Solaris and Cavalero, and corrects Molt Efficiency and Deadhead effects.
Randomized Arcane Dissolution packs are not described as guaranteed purchases.
An independent pass verifies every replacement against its cited official source.

This is a partial factual correction: other recommendations, market claims and
the full video content have not received a complete review. The full-guide
review date stays July 18, 2026, and its overdue notice remains honest. Ten
official source links are added consistently to all localized snapshots.
Each locale preserves 143 unrelated guide fields and updates only the 25
reviewed fields, plus the three tool introductions. All 336 localized strings
receive independent semantic review, with 287 corrections to the drafts.
Numbers, Markdown destinations, emphasis and snapshot integrity pass; canonical
vendor/place names in one table cell deliberately remain unchanged.

The repository translator's Gemini request times out after 30 seconds with no
quota/access response. Its existing free engine then supplies 320 successful
drafts, using sequential requests spaced at least two seconds apart. Two
Traditional Chinese requests return HTTP 500, including one paced retry, and
requests stop. As a documented exception to the normal generator-only process,
the final sixteen Traditional Chinese fields are adapted locally from reviewed
Simplified Chinese and English, then independently reviewed. They are not
reported as provider-generated. Two Polish/Japanese fields rejected for damaged
name placeholders are recovered from saved provider responses and corrected.
No access/rate refusal, alternate account or proxy workaround is involved.

### Mission metadata safeguards

List and detail builders now require compatible mission types before joining
node facts by location. Explicit verified aliases retain Dark Sector, Mirror
Defense, Orokin Sabotage and Archwing matches. Conflicting, missing or malformed
types no longer attach unrelated levels or factions. Archwing Steel Path ranges
use the [official +50 modifier](https://www.warframe.com/en/patch-notes/pc/28-1-0);
other supported star-chart missions retain +100. Twenty-four new regressions
cover real source pairs, conflicts, malformed types, list/detail parity and
preserved reward-based indexability.

Production currently has no stored node-metadata document. These guards do not
claim newly visible public node facts. A source dry run preserves 180 compatible
joins while rejecting two actual conflicts and eleven missing modes. A further
source-identity mismatch requires an importer repair before activation. No
node import, metadata write or new importer schedule is performed this cycle.

The latest visible official patch remains 44.1.4.1 (October 28); Tau is announced
for December. No newer announcement since the morning check warrants a news
page. The daily maintenance schedule remains active.

Local regression validation passes 764 backend tests, 59 frontend tests and
26 guide tests (849 total). Backend production compilation also passes. The
final locale compiler, snapshot integrity check and repository-map validation
pass after applying the reviewed translations. The eight actual-template SSR
tests also pass again with the final introductions. All 25 guides validate;
the seventeen overdue reviews and unrelated translation follow-ups retain
their existing dates and remain visible in the maintenance queue.

All intended changes and this record precede the final complete API/frontend/
live deployment. Local gates and final public/browser release evidence are
recorded before reporting success; ignored `tmp/nov02pm-*` artifacts preserve
this cycle separately from the morning release. Deployment outcomes will also
be retained in maintenance memory without leaving a later documentation commit
undeployed.

The first complete release, `25f87e3a638a13451b3c1f37ba6f1ada168b8215`, passes
[workflow 41454874086](https://github.com/eduair94/warframe/actions/runs/41454874086)
with gates at 13:42:38 UTC and deployment at 13:46:19 UTC. Browser inspection
also exposes two existing contradictions in the vaulted-worth tooltip and
methodology notice: both still describe Aya as purchasing a completed Prime.
The follow-up corrects those two strings in all thirteen locales. They explain
that the Varzia signal is inferred from related relic data, current offerings
must be checked in game, and opening a relic does not guarantee a specific part.
Adjacent code comments are corrected; verdict calculations are unchanged.

The additional localization batch stops immediately on a provider HTTP 429.
Five successful drafts are preserved (Spanish/Portuguese and the German tooltip),
and nineteen remaining fields are completed locally from the frozen English
and previously reviewed locale vocabulary. This is a documented exception,
not a successful provider translation or an attempt to bypass the refusal.
All twenty-four translations pass independent review, with eight corrections.
The locale compiler, eight tool-template regressions and repository-map check
pass again after the follow-up; every other message value is preserved.
The final follow-up includes this documentation before another complete deploy;
its outcome and public verification remain in ignored evidence and memory.

## 2026-11-03–04 — Honest set comparisons and upstream freshness incident

This iteration resumes the unfinished November 3 change before starting another
release. The last deployed revision remains `3e3d665` until the complete workflow
for this batch succeeds. No duplicate deployment or metadata refresh is started.

### Comparison accuracy and useful search content

The public comparison previously treated absent component quotes as zero:
Amesha, Elytron and Riot-848 could show a 100% saving, while Rauta's partial
component total produced an unsupported recommendation. The backend now checks
the assembled set and every required component separately for the acquisition
(ask) and resale (bid) sides. Missing or invalid quotes and invalid quantities
produce unavailable totals and differences. Known prices and searchable rows
remain visible. Finite legacy subtotals are retained for compatibility, while
the authoritative comparison fields are nullable and include directional
coverage counts. Fully priced comparisons and genuine zero differences retain
their meaning. Overflow cannot produce Infinity/NaN in the API response.

The page excludes incomplete comparisons from highlighted savings, opportunity
filters and acquisition statistics; unknown values sort after valid negative
differences. Desktop, mobile and the crawlable server table display localized
unavailable labels rather than free components. Old cached API responses without
directional coverage fail closed until refreshed. Analytics navigation verdicts
also distinguish unavailable from an even comparison. A new server-rendered
methodology paragraph explains these rules in all thirteen locales. This adds
useful context to an existing tool rather than creating a thin search page.

Three new English strings receive 36 generated translations through the existing
`tr-file.mjs` workflow. Gemini's first request times out after 30 seconds without
an access/quota response; the existing free engine then completes 36/36 drafts
with sequential requests spaced by two seconds. No refusal is bypassed. An
independent semantic review corrects 31 drafts, including mistranslations of
market quotes as textual quotations and of a set as the game. Five drafts are
preserved. All previous message values remain unchanged. The locale compiler
passes, and no guide review dates are advanced.

### Availability, source access and measurement limits

The November 3 baseline passes 10/10 public checks: 3,832 of 3,893 price records
(98.4%) are under three hours old, nine exceed a day, and the live socket is
connected. Those observations are historical, not today's health result.

At 13:02 UTC on November 4, public endpoints still answer HTTP 200 but the
freshness check fails: none of 3,893 quotes is under three hours old, the newest
is approximately 10 hours 40 minutes old, the median is 745.5 minutes, and thirteen
exceed a day. The live socket is disconnected with zero orders per minute.
Existing logs show genuine upstream Cloudflare HTTP 403 challenges on price,
auction and live REST reads, plus rejected WebSocket handshakes. Fixed egress
listeners are present, configuration files are unchanged since October 27, and
critical compiled transport hashes still match the successful November 2 build.
The existing fifteen-minute cooldowns remain active. This is an upstream access
restriction, not evidence that missing quotes should be replaced by zero.

Diagnosis is bounded and read-only: no extra Warframe Market probes, proxy
changes, alternate access path, metadata import or worker restart is used to
evade the refusal. The normal complete release remains required, but workflow
success alone will not be reported as recovery of upstream data or the feed.
Postdeploy freshness and socket status must be reported separately. Raw account
data and credentials are not included in the public evidence.

GA4/Search Console discovery returns unauthorized once per review and stops.
Traffic is unavailable, not zero; complete seven- and twenty-eight-day windows
cannot be compared. Neither traffic uplift nor field Core Web Vitals improvement
is claimed. The bounded November 3 SEO sample finds no urgent robots/canonical
blocker; English and Spanish sitemaps each contain 1,583 URLs including 432
missions. These timings and responses are not a field performance benchmark.

### Official sources and next content priorities

The November 4 checks of the [official news index](https://www.warframe.com/en/news)
and [patch index](https://www.warframe.com/en/patch-notes) find no newer released
patch than [44.1.4.1, October 28](https://www.warframe.com/en/patch-notes/pc/44-1-4).
The [November 2 Devstream 198 recap](https://www.warframe.com/en/news/devstream-198-overview)
describes Tau and future Prime availability; these announcements are not treated
as already playable mechanics. No filler news page or date-only refresh is made.

Next content corrections remain Railjack's Rising Tide prerequisite, reactor/
Plexus distinction and Update 43/43.0.6 additions. Primary references are the
[Second Dream guide](https://www.warframe.com/en/guides/quests/the-second-dream),
[Railjack 29.10.0 release notes](https://forums.warframe.com/topic/1253565-update-29100-corpus-proxima-the-new-railjack/),
[Update 43](https://www.warframe.com/en/patch-notes/pc/43-0-0) and
[Hotfix 43.0.6](https://www.warframe.com/en/patch-notes/pc/43-0-6).
The `/vaulted-worth` search description also needs to qualify its inferred
Resurgence flag. Seventeen overdue guide reviews stay visible; these outstanding
items are not represented as completed by the comparator change.

Local blocking checks pass: 801 backend tests, 72 frontend tests and 26 guide
tests (899 total), plus guide validation, locale compilation and the current
repository map. Validation evidence is recorded in ignored `tmp/nov04-*` files. It includes
direction-specific backend regressions, actual-page server/desktop/mobile
rendering in English and Spanish, old-cache handling, the full frontend suite,
guide validation and regression tests, locale compilation and the repository
map check. Independent frontend review finds no high-confidence regression and
passes 42 adversarial cases. Browser checks after deployment remain necessary:
template stubs do not prove hydration or responsive layout.

All intended code and this record precede the final complete API/frontend/live
deployment. The workflow outcome, exact deployed SHA, public page/assets checks,
browser results and unresolved upstream health status will be stored in ignored
release evidence and automation memory, without leaving a later documentation
commit undeployed.

## November 5–7, 2026 — Railjack source review and accurate Prime Vault metadata

This iteration began November 5 and resumed November 7 before committing or
deploying. The previous production revision remained `a1c6839`; no duplicate
deployment or schedule was started. The existing daily 10:00 Montevideo heartbeat
remains active. The hypothesis is that reliable answers to Railjack unlock,
crew, equipment and reward questions, connected to relevant calculators, improve
search usefulness and retention. Traffic uplift has not been measured.

### Content and search changes

The complete English Railjack guide was read against thirteen primary references.
Sixty-six existing prose fields were corrected and three current-mechanics blocks
added. The guide now distinguishes The Second Dream/Rising Tide ownership from
The Archwing access to other players' crews; removes obsolete multi-day repair
timers; separates Reactor ability bonuses, Plating health/armor and Plexus mods;
corrects crew competencies and Command thresholds; and removes guaranteed
one-shot kills or automated-farming promises. Uranus Proxima instructions explain
Solo selection before entering Pontis Tower and the Archwing restriction. Steel
Path guidance includes +50 enemy levels, two Steel Essence per completion, the
separate fifty-Essence completion reward and its node exclusions. Recruitment
copy tells readers to check the Talent currency required by each offer rather
than assuming the currencies are interchangeable.

The guide retains its eight section anchors, eight FAQs and four creator videos.
All four video oEmbed endpoints were available on November 5; their contents were
not fully watched, and an adjacent note explains that old videos can show obsolete
mechanics. Twelve primary source links replace the old Reddit/general-wiki
footer. The complete text review date is November 5, preserved through the
November 7 release; unrelated guide dates are unchanged. Reading time is ten
minutes in both the article and registry. Existing internal tools and guide
destinations remain intact, with more precise link descriptions and price
estimates explicitly separated from guaranteed sale proceeds.

The 69 changed/additional fields are synchronized in all twelve translated
snapshots: 828 localized fields, with 78 other translatable fields preserved in
each language. Independent reviews cover every translated field. A first
translation-provider request for the separate metadata change returned HTTP429
and stopped immediately: no retries or provider switching. This iteration uses
a bounded local editorial exception to the repository's generator workflow,
with transparent provenance, independent semantic review and structural
validation. No successful provider translations are claimed, and generated
`app/i18n/locales/*.json` files were not edited manually.

The centralized `/vaulted-worth` search metadata now offers prices and buying
signals, calls the Prime Resurgence indication inferred, and directs readers to
check Varzia's current relic offerings. All thirteen title/description pairs,
including the English fallback overlay, are consistent. The actual SEO resolver
passes all locale/prefix/trailing-slash checks; other routes' metadata is
unchanged. Descriptions range from 72 to 159 characters. No new thin pages,
unverified news summaries or new rich-result promises were added.

Primary references include the official
[Second Dream](https://www.warframe.com/en/guides/quests/the-second-dream) and
[Rising Tide](https://www.warframe.com/en/guides/quests/rising-tide) quest guides,
[Railjack support article](https://support.warframe.com/hc/en-us/articles/38820115630093-Railjack),
[29.10 Railjack retrofit](https://forums.warframe.com/topic/1253565-update-29100-corpus-proxima-the-new-railjack/),
[30.9 timers](https://www.warframe.com/en/patch-notes/pc/30-9-0),
[30.9.4 timer correction](https://www.warframe.com/en/patch-notes/pc/30-9-4),
[Update 43](https://www.warframe.com/en/patch-notes/pc/43-0-0), and
[43.0.6 Steel Essence correction](https://www.warframe.com/en/patch-notes/pc/43-0-6).
The ignored source-review manifest records the remaining sources and claim paths.
On November 7 the official news and patch indexes still list 44.1.4.1 (October 28)
as the latest patch and November 2 as the newest news. No newer Railjack mechanic
was found. Tau remains a future December release; no future content was presented
as already available. Sixteen other guides remain in the overdue review queue,
and unrelated translation follow-ups remain visible in the existing validator.

### Availability, freshness and measurement limits

At 05:45 UTC November 7, the bounded public checks return HTTP200 in all ten
requests and MongoDB is available. The content-freshness gate fails: all 3,893
stored price records exceed a day, the newest is approximately 75.4 hours old,
and the median is 77.1 hours. The latest recorded quote remains November 4 at
02:21:35 UTC. The live socket is disconnected with zero orders per minute.
Existing logs show ongoing upstream HTTP403 refusals for prices, auctions and
live transport. No additional Warframe Market request, alternate egress,
credential change or access bypass was attempted. Four offbox worker PIDs
remain unchanged. A successful code deployment will not be reported as source
recovery without separate evidence.

Endo still has 46 eligible ask-based opportunities and forty visible server rows
in each sampled English/Spanish page. Ducat invariants remain 594 eligible parts,
757 positive values, Nami Skyla Blade65/set235, without repeating the previous
metadata refresh. These numerical checks do not certify price freshness.
GA4/Search Console discovery returned unauthorized once on November 7 and
stopped. Traffic data are unavailable, not zero; no seven-/twenty-eight-day
comparison or field Core Web Vitals improvement is claimed.

### Validation and release

The unchanged backend passed 801 tests and its production TypeScript build during
the November 5 preparation. After all translated snapshots were integrated, 72 frontend and 26 guide tests
passed, along with locale compilation, all 25 guide integrity checks and the
repository-map gate: 899 passing tests across the unchanged backend and final
frontend/guide suites. Production checks
will verify the 13 Railjack pages and 13 vaulted-worth metadata pages, visible
content rather than payload-only strings, canonical/hreflang/indexability,
Article/FAQ agreement, internal links and sampled JS/CSS, plus browser behavior.

All intended source and this record are committed before the complete
API/frontend/live deployment. The final workflow outcome, exact API/sync revision,
public/browser evidence and upstream freshness are recorded in ignored release
files and automation memory. No later tracked documentation edit is left
undeployed. Remaining priorities include the other overdue guides, importer
identity validation and upstream access recovery through supported access.

## November 7, 2026, daily review — truthful live status and crawlable market heading

The 13:00 UTC heartbeat starts after the earlier Railjack release completed at
05:56 UTC. Local, origin, API and sync are all on `ce49797`, with no active or
queued deployment. This is a new bounded iteration, not a duplicate release.
The hypothesis is that accurate observation times and understandable source
availability improve trust and retention, while an initial HTML heading makes
the live page's purpose accessible to readers and crawlers without JavaScript.
No traffic increase or ranking change has been measured.

### Findings and corrections

The availability baseline passes all ten HTTP checks and MongoDB is up, but all
3,893 prices exceed one day; median age is approximately 84.4 hours. The latest
quote remains November 4 at 02:21:35 UTC. Existing logs still show upstream 403
refusals and the new-orders socket is disconnected. No additional upstream
probe, egress change, credential change or access workaround was attempted.
The four offbox process IDs and six transport-related compiled hashes match the
previous release. Endo and Ducat regression checks still pass with retained prices.

The live service nevertheless reported `feedUp=true` with zero books and no
observed update. Both its gateway and poller initialized optimistically; a
pending sweep could wait through source cooldowns for hours before publishing a
failure. They now begin unconfirmed, publish the first resolved fetch result,
and treat an empty subscription set as unavailable. A successful empty order
book is still a valid observation. Source availability also expires after three
minutes without a received snapshot or delta, even if a request remains pending.
This limit affects status and signals, not polling cadence or retry behavior.

Reading a stored book previously assigned it a new `updatedAt`, so reconnecting
or reopening an item could display old prices as updated now. The store now
records time only when receiving a snapshot or delta. Reads and rank/star
metadata recomputation preserve it; Mongo write-through uses that same observed
time. The global pulse likewise records received data rather than its two-second
broadcast time. Online-trader reports have a separate timestamp: a new order
cannot refresh old trader counts, and unknown counts are not shown as zero.

The browser receives independent book and order-source status. Its own Socket.IO
connection alone no longer turns the indicator green. Disconnects and reconnects
require source confirmation again, and a reopened upstream socket must receive
new data before old pulse values can appear. Trading badges, advice and active
counts require a confirmed source and an individual book observation no older
than three minutes. Stored prices and their real age remain available for
inspection. The existing localized connecting label is reused in all languages;
no translation-provider request or generated-locale edit was required.

The live page's single localized H1 and introduction now render outside
`ClientOnly`, before its existing server-rendered catalogue table. Canonicals,
hreflang, metadata and route paths remain unchanged. The global stale-price
notice remains visible. Correction to earlier operational notes: `liveItems`
counts requested/hot subscriptions, not retained order books; `bookCount` is the
book count. Neither count proves that the source is available.

### Sources, validation and release

The [official news index](https://www.warframe.com/en/news) and
[patch index](https://www.warframe.com/en/patch-notes) show no newer development
than the earlier review: latest visible news November 2 and latest patch
[44.1.4.1, October 28](https://www.warframe.com/en/patch-notes/pc/44-1-4).
No guide review date was changed. A future relic-guide correction should
distinguish Common from Uncommon Forma rewards, as documented in
[Update 36.1](https://www.warframe.com/en/patch-notes/pc/36-1-0); the other sixteen
overdue guide reviews remain queued. GA4/Search Console discovery already
returned unauthorized earlier today and was not retried without an access
change. Seven-/twenty-eight-day traffic comparisons and field CWV are unavailable.

Local checks pass: 849 backend tests, 112 frontend tests and 26 guide tests
(987 total), API production build, locale compilation, guide integrity and
repository-map validation. New regressions exercise pending requests, initial
unknown state, quiet but valid feeds, invalid source messages, independent
online-report age, reconnection, future timestamps, the exact three-minute
boundary, per-item expiry and recovery. Actual frontend source is exercised in
all thirteen languages, including one server-rendered H1 before catalogue rows.
Independent source/state-machine reviews pass; mocks and server rendering do
not replace a real browser check.

All intended source and this entry precede the final complete API/frontend/live
deployment. Exact release SHA, workflow outcome, sync alignment, public live
pages/assets, Socket.IO source-status and browser availability will be recorded
in ignored `tmp/nov07pm-*` evidence and automation memory. A successful deployment
does not imply that upstream access or price freshness recovered.
