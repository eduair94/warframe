<!-- app/app/pages/tools/[slug].vue — per-tool detail page -->
<template>
  <div class="an td" v-if="tool">
    <article class="an-console">
      <!-- Breadcrumb -->
      <nav class="td-crumb">
        <NuxtLink :to="localePath('/tools')">{{ t('toolDetail.back') }}</NuxtLink>
        <span class="td-crumb__sep">/</span>
        <span class="td-crumb__cat">{{ t('communityTools.sections.' + tool.category) }}</span>
      </nav>

      <!-- Hero -->
      <header class="td-hero">
        <div class="td-hero__shot">
          <img v-if="tool.screenshot" :src="tool.screenshot" :alt="tool.name" width="1000" height="625" />
          <div v-else class="td-hero__shot--none">{{ tool.name }}</div>
        </div>
        <div class="td-hero__text">
          <div class="td-hero__badges">
            <span v-if="tool.self" class="an-chip td-self">★ {{ t('toolDetail.self.thisSite') }}</span>
            <span class="an-chip td-tier" :class="'is-' + (research?.tier || 'niche')">{{ tierLabel }}</span>
            <span v-if="tool.verified" class="an-chip td-verified">✓ {{ t('communityTools.verified') }}</span>
            <span class="an-chip td-safety" :class="'is-' + (research?.safety.rating || 'safe')">{{ safetyLabel }}</span>
          </div>
          <h1 class="an-title td-title">{{ tool.name }}</h1>
          <p class="td-oneliner">{{ research?.oneLiner || desc }}</p>
          <div class="td-plats">
            <span v-for="p in tool.platforms" :key="p" class="an-chip ct-plat">{{ t('communityTools.platform.' + p) }}</span>
          </div>
          <div class="td-hero__actions">
            <a class="ct-visit" :href="tool.url" target="_blank" rel="noopener nofollow">{{ t('communityTools.visit') }}</a>
            <a v-if="tool.github" class="ct-sub" :href="'https://github.com/' + tool.github" target="_blank" rel="noopener nofollow">{{ t('communityTools.viewGithub') }}</a>
            <NuxtLink class="ct-sub" :to="localePath('/tools/best')">{{ t('toolDetail.index.bestGuideCta') }}</NuxtLink>
          </div>
          <div v-if="tool.caveat === 'rmt'" class="ct-warn ct-warn--rmt td-warn">⚠ {{ t('communityTools.caveat.rmt') }}</div>
          <div v-else-if="tool.caveat === 'partial'" class="ct-warn ct-warn--partial td-warn">{{ t('communityTools.caveat.partial') }}</div>
        </div>
      </header>

      <!-- Cross-reference to this site (enhancer / alternative) -->
      <aside v-if="selfRel" class="td-selfref" :class="'is-' + selfRel.type">
        <div class="td-selfref__label">
          {{ selfRel.type === 'enhancer' ? t('toolDetail.self.enhancerLabel') : t('toolDetail.self.altLabel') }}
        </div>
        <div class="td-selfref__body">
          <strong>Warframe Market Analytics</strong> — {{ selfRel.reason }}
        </div>
        <NuxtLink class="td-selfref__cta" :to="localePath(selfRel.href)">{{ t('toolDetail.self.cta') }} →</NuxtLink>
      </aside>

      <div class="td-body">
        <div class="td-main">
          <!-- Overview -->
          <section class="td-sec">
            <h2 class="td-sec__title">{{ t('toolDetail.sections.overview') }}</h2>
            <p class="td-prose">{{ research?.overview || desc }}</p>
            <p v-if="research?.bestFor" class="td-bestfor">
              <strong>{{ t('toolDetail.bestFor') }}:</strong> {{ research.bestFor }}
            </p>
          </section>

          <!-- Key features -->
          <section v-if="research?.keyFeatures?.length" class="td-sec">
            <h2 class="td-sec__title">{{ t('toolDetail.sections.features') }}</h2>
            <ul class="td-list">
              <li v-for="(f, i) in research.keyFeatures" :key="i">{{ f }}</li>
            </ul>
          </section>

          <!-- Pros / cons -->
          <section v-if="research?.pros?.length || research?.cons?.length" class="td-sec">
            <h2 class="td-sec__title">{{ t('toolDetail.sections.prosCons') }}</h2>
            <div class="td-proscons">
              <div v-if="research?.pros?.length" class="td-pc td-pc--pro">
                <div class="td-pc__h">{{ t('toolDetail.pros') }}</div>
                <ul><li v-for="(p, i) in research.pros" :key="i">{{ p }}</li></ul>
              </div>
              <div v-if="research?.cons?.length" class="td-pc td-pc--con">
                <div class="td-pc__h">{{ t('toolDetail.cons') }}</div>
                <ul><li v-for="(c, i) in research.cons" :key="i">{{ c }}</li></ul>
              </div>
            </div>
          </section>

          <!-- Community sentiment -->
          <section v-if="research?.sentimentSummary" class="td-sec">
            <h2 class="td-sec__title">{{ t('toolDetail.sections.community') }}</h2>
            <p class="td-prose">{{ research.sentimentSummary }}</p>
          </section>

          <!-- Reddit: specific threads when available, always a live search link -->
          <section class="td-sec">
            <h3 class="td-sub__title">{{ t('toolDetail.sections.reddit') }}</h3>
            <ul v-if="research?.reddit?.length" class="td-links">
              <li v-for="(r, i) in research.reddit" :key="i" class="td-link">
                <span class="td-dot" :class="'is-' + r.sentiment" :title="r.sentiment"></span>
                <div class="td-link__body">
                  <a :href="r.url" target="_blank" rel="noopener nofollow">{{ r.title }}</a>
                  <span v-if="r.subreddit" class="td-link__meta">r/{{ r.subreddit.replace(/^r\//, '') }}</span>
                  <p v-if="r.snippet" class="td-link__snip">“{{ r.snippet }}”</p>
                </div>
              </li>
            </ul>
            <a class="td-reddit-cta" :href="redditSearchUrl" target="_blank" rel="noopener nofollow">
              {{ t('toolDetail.sections.reddit') }} · r/Warframe →
            </a>
          </section>

          <!-- YouTube — embedded facade players; link fallback for non-video URLs -->
          <section v-if="youtubeVideos.length" class="td-sec">
            <h3 class="td-sub__title">{{ t('toolDetail.sections.youtube') }}</h3>
            <div class="td-videos">
              <template v-for="(v, i) in youtubeVideos" :key="i">
                <YouTubeEmbed
                  v-if="v.id"
                  :id="v.id"
                  :title="v.title || tool.name"
                  :channel="ytChannel(v.channel)"
                  max="100%"
                />
                <a
                  v-else
                  class="td-link td-vid-fallback"
                  :href="v.url"
                  target="_blank"
                  rel="noopener nofollow"
                >
                  <span class="td-yt">▶</span>
                  <span class="td-link__body">{{ v.title || v.url }}</span>
                </a>
              </template>
            </div>
          </section>

          <!-- Other reviews / feedback -->
          <section v-if="research?.trustpilot || research?.otherReviews?.length" class="td-sec">
            <h3 class="td-sub__title">{{ t('toolDetail.sections.reviews') }}</h3>
            <ul class="td-links">
              <li v-if="research?.trustpilot" class="td-link">
                <div class="td-link__body">
                  <a :href="research.trustpilot.url" target="_blank" rel="noopener nofollow">Trustpilot</a>
                  <span class="td-link__meta">
                    <template v-if="research.trustpilot.rating != null">★ {{ research.trustpilot.rating }}</template>
                    <template v-if="research.trustpilot.reviewCount != null"> · {{ research.trustpilot.reviewCount }} reviews</template>
                  </span>
                </div>
              </li>
              <li v-for="(o, i) in research.otherReviews" :key="i" class="td-link">
                <div class="td-link__body">
                  <a :href="o.url" target="_blank" rel="noopener nofollow">{{ o.source }}</a>
                  <span v-if="o.rating" class="td-link__meta">{{ o.rating }}</span>
                  <p v-if="o.snippet" class="td-link__snip">“{{ o.snippet }}”</p>
                </div>
              </li>
            </ul>
          </section>

          <!-- No external data notice -->
          <section v-if="research && research.dataConfidence === 'low' && !hasSources" class="td-sec">
            <p class="td-nodata">{{ t('toolDetail.noData') }}</p>
          </section>
        </div>

        <!-- Sidebar -->
        <aside class="td-side">
          <!-- Verdict -->
          <div class="an-card td-verdict">
            <div class="td-verdict__tier" :class="'is-' + (research?.tier || 'niche')">{{ tierLabel }}</div>
            <p v-if="research?.tierReason" class="td-verdict__reason">{{ research.tierReason }}</p>
          </div>

          <!-- Safety -->
          <div v-if="research?.safety" class="an-card td-safetybox" :class="'is-' + research.safety.rating">
            <div class="td-side__h">{{ t('toolDetail.sections.safety') }}</div>
            <div class="td-safety__rating">{{ safetyLabel }}</div>
            <p class="td-safety__notes">{{ research.safety.notes }}</p>
          </div>

          <!-- Community & social links -->
          <div v-if="tool.social" class="an-card td-socials">
            <div class="td-side__h">{{ t('communityTools.social.title') }}</div>
            <ToolSocials :social="tool.social" variant="full" />
          </div>

          <!-- Facts -->
          <div class="an-card td-facts">
            <div class="td-side__h">{{ t('toolDetail.sections.facts') }}</div>
            <dl class="td-dl">
              <div><dt>{{ t('toolDetail.facts.category') }}</dt><dd>{{ t('communityTools.sections.' + tool.category) }}</dd></div>
              <div><dt>{{ t('toolDetail.facts.platforms') }}</dt><dd>{{ tool.platforms.map((p) => t('communityTools.platform.' + p)).join(', ') }}</dd></div>
              <div v-if="tool.openSource"><dt>{{ t('toolDetail.facts.source') }}</dt><dd>{{ t('communityTools.card.openSource') }}</dd></div>
              <div v-if="tool.domain?.created"><dt>{{ t('toolDetail.facts.established') }}</dt><dd>{{ yearOf(tool.domain.created) }}<template v-if="tool.domain.ageYears != null"> ({{ tool.domain.ageYears }}y)</template></dd></div>
              <div v-if="tool.repo"><dt>GitHub</dt><dd>★ {{ tool.repo.stars }} · {{ rel(tool.repo.lastCommit) }}<template v-if="tool.repo.archived"> · archived</template></dd></div>
              <div v-if="research?.dataConfidence"><dt>{{ t('toolDetail.facts.confidence') }}</dt><dd>{{ t('toolDetail.confidence.' + research.dataConfidence) }}</dd></div>
            </dl>
          </div>
        </aside>
      </div>

      <!-- Related -->
      <section v-if="related.length" class="td-related">
        <h2 class="td-sec__title">{{ t('toolDetail.sections.related') }}</h2>
        <div class="td-related__grid">
          <NuxtLink v-for="rt in related" :key="rt.slug" class="an-card td-rel" :to="localePath('/tools/' + rt.slug)">
            <span class="td-rel__name">{{ rt.name }}</span>
            <span class="td-rel__desc">{{ toolDesc(rt.slug) }}</span>
          </NuxtLink>
        </div>
      </section>

      <v-alert class="an-disclaimer" type="info" density="compact">{{ t('communityTools.disclaimer') }}</v-alert>
    </article>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted } from 'vue'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { TOOLS } from '~/data/tools'
import { getResearch, SELF_SLUG, selfRelation } from '~/data/toolResearch'

dayjs.extend(relativeTime)
const { t, te } = useI18n()
const localePath = useLocalePath()
const route = useRoute()

const slug = computed(() => String(route.params.slug || ''))
const tool = computed(() => TOOLS.find((x) => x.slug === slug.value))

// Unknown slug → 404 (SSR-correct status).
if (!tool.value) {
  throw createError({ statusCode: 404, statusMessage: 'Tool not found', fatal: true })
}

const research = computed(() => getResearch(slug.value))
const desc = computed(() => {
  const key = 'communityTools.desc.' + slug.value
  return te(key) ? t(key) : (research.value?.oneLiner || tool.value?.name || '')
})

const tierLabel = computed(() => t('toolDetail.tier.' + (research.value?.tier || 'niche')))
const safetyLabel = computed(() => t('toolDetail.safety.' + (research.value?.safety.rating || 'safe')))
const hasSources = computed(
  () => !!(research.value?.reddit?.length || research.value?.youtube?.length || research.value?.otherReviews?.length || research.value?.trustpilot),
)

// Extract an 11-char YouTube video id from watch / youtu.be / embed / shorts
// URLs. Returns '' for anything that isn't a single video (channels, playlists,
// search) so those degrade to a plain link.
function ytId(url: string): string {
  const m = String(url || '').match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/,
  )
  return m ? m[1] : ''
}
// Drop the generic "YouTube" placeholder channel so the embed shows no label
// rather than a meaningless one.
function ytChannel(c?: string): string {
  return c && c.toLowerCase() !== 'youtube' ? c : ''
}
// Pre-resolve each review video's embeddable id (empty → link fallback).
const youtubeVideos = computed(() =>
  (research.value?.youtube || []).map((v) => ({ ...v, id: ytId(v.url) })),
)

// Live r/Warframe search for this tool — a deterministic, always-valid link so
// readers can jump to real Reddit discussion (specific threads are listed above
// when we have verified ones).
const redditSearchUrl = computed(
  () => `https://www.reddit.com/r/Warframe/search/?q=${encodeURIComponent(tool.value?.name || '')}&restrict_sr=1&sort=relevance`,
)

// Cross-reference to THIS site when the current tool is one we enhance or offer
// an alternative to (never on our own page).
const selfRel = computed(() =>
  tool.value && tool.value.slug !== SELF_SLUG ? selfRelation(tool.value.slug) : undefined,
)

// Localized per-tool blurb with an English research fallback (covers tools with
// no communityTools.desc key, e.g. our own self-listing).
function toolDesc(s: string): string {
  const key = 'communityTools.desc.' + s
  return te(key) ? t(key) : getResearch(s)?.oneLiner || ''
}

const related = computed(() =>
  TOOLS.filter((x) => x.category === tool.value?.category && x.slug !== slug.value)
    .sort((a, b) => Number(b.featured || false) - Number(a.featured || false))
    .slice(0, 4),
)

function yearOf(iso: string) { return new Date(iso).getUTCFullYear() }
function rel(iso: string) { return dayjs(iso).fromNow() }

// Per-page SEO override (layout owns canonical/hreflang). Bakes the tool name +
// one-liner into title/description + the OG card.
useSeoPage({
  title: () => `${tool.value?.name} — Review, Guide & Community Feedback (Warframe)`,
  description: () =>
    `${research.value?.oneLiner || desc.value} What it does, key features, Reddit and YouTube feedback, safety and whether it's worth using for Warframe.`,
  ogType: 'article',
})

function finishLoading(attempt = 0) {
  nextTick(() => {
    const el = document.getElementById('spinner-wrapper')
    if (el) el.style.display = 'none'
    else if (attempt < 20) finishLoading(attempt + 1)
  })
}
onMounted(() => finishLoading())
</script>

<style scoped>
.td-crumb { padding: 18px 30px 0; font-family: var(--font-hud); font-size: 0.8rem; color: var(--ink-dim); }
.td-crumb a { color: var(--gold-ink); text-decoration: none; }
.td-crumb a:hover { text-decoration: underline; }
.td-crumb__sep { margin: 0 8px; opacity: 0.5; }

.td-hero { display: grid; grid-template-columns: minmax(0, 420px) 1fr; gap: 26px; padding: 18px 30px 24px; align-items: start; }
.td-hero__shot { aspect-ratio: 16 / 10; background: rgba(0, 0, 0, 0.35); overflow: hidden; border: 1px solid var(--orokin-line); }
.td-hero__shot img { width: 100%; height: 100%; object-fit: cover; object-position: top; display: block; }
.td-hero__shot--none { display: flex; align-items: center; justify-content: center; height: 100%; color: var(--ink-dim); font-family: var(--font-hud); padding: 12px; text-align: center; }
.td-hero__badges { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 10px; }
.td-title { margin: 0 0 6px; }
.td-oneliner { color: #cdd2e4; font-size: 1rem; line-height: 1.55; margin: 0 0 12px; }
.td-plats { display: flex; flex-wrap: wrap; gap: 5px; margin-bottom: 14px; }
.td-hero__actions { display: flex; flex-wrap: wrap; gap: 8px; }
.td-hero__actions .ct-visit { flex: 0 0 auto; }
.td-warn { margin-top: 14px; }

.td-tier { text-transform: uppercase; font-weight: 800; letter-spacing: 0.06em; }
.td-tier.is-essential, .td-verdict__tier.is-essential { background: var(--energy) !important; color: #06201f !important; }
.td-tier.is-recommended, .td-verdict__tier.is-recommended { background: var(--orokin) !important; color: #17130a !important; }
.td-tier.is-situational, .td-tier.is-niche { background: rgba(255,255,255,0.1) !important; color: var(--ink) !important; }
.td-tier.is-avoid, .td-verdict__tier.is-avoid { background: rgba(217,138,138,0.2) !important; color: #f0d2d2 !important; }
.td-verified { background: rgba(79, 179, 191, 0.16) !important; color: var(--energy) !important; }
.td-safety.is-safe { color: var(--energy) !important; }
.td-safety.is-caution { color: var(--orokin) !important; }
.td-safety.is-risky { color: var(--rose) !important; }
.td-self { background: linear-gradient(90deg, var(--orokin), var(--gold-ink)) !important; color: #17130a !important; font-weight: 800; text-transform: uppercase; letter-spacing: 0.06em; }

.td-selfref { margin: 0 30px 8px; padding: 16px 18px; display: flex; flex-direction: column; gap: 8px; background: rgba(79, 179, 191, 0.06); border: 1px solid rgba(79, 179, 191, 0.32); border-left: 3px solid var(--energy); clip-path: polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px); }
.td-selfref.is-enhancer { background: rgba(200, 168, 92, 0.07); border-color: var(--orokin-line); border-left-color: var(--orokin); }
.td-selfref__label { font-family: var(--font-hud); text-transform: uppercase; letter-spacing: 0.1em; font-size: 0.72rem; color: var(--energy); }
.td-selfref.is-enhancer .td-selfref__label { color: var(--gold-ink); }
.td-selfref__body { color: #dfe3f0; font-size: 0.94rem; line-height: 1.55; }
.td-selfref__body strong { color: var(--ink); }
.td-selfref__cta { align-self: flex-start; font-family: var(--font-hud); font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; font-size: 0.8rem; color: #17130a; background: var(--orokin); text-decoration: none; padding: 8px 16px; clip-path: polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px); }
.td-selfref__cta:hover { background: var(--gold-ink); }
@media (max-width: 860px) { .td-selfref { margin-left: 16px; margin-right: 16px; } }

.td-body { display: grid; grid-template-columns: 1fr minmax(0, 300px); gap: 26px; padding: 8px 30px 24px; align-items: start; }
.td-sec { padding: 16px 0; border-top: 1px solid rgba(255, 255, 255, 0.06); }
.td-sec:first-child { border-top: none; }
.td-sec__title { font-family: var(--font-display); font-size: 1.25rem; color: var(--gold-ink); margin: 0 0 12px; }
.td-sub__title { font-family: var(--font-hud); text-transform: uppercase; letter-spacing: 0.08em; font-size: 0.9rem; color: var(--energy); margin: 0 0 10px; }
.td-prose { color: #cdd2e4; font-size: 0.94rem; line-height: 1.6; margin: 0 0 10px; }
.td-bestfor { color: var(--ink); font-size: 0.92rem; line-height: 1.55; margin: 6px 0 0; }
.td-list { margin: 0; padding-left: 20px; color: #cdd2e4; font-size: 0.92rem; line-height: 1.7; }

.td-proscons { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.td-pc__h { font-family: var(--font-hud); text-transform: uppercase; letter-spacing: 0.06em; font-size: 0.8rem; margin-bottom: 6px; }
.td-pc ul { margin: 0; padding-left: 18px; font-size: 0.9rem; line-height: 1.6; color: #cdd2e4; }
.td-pc--pro .td-pc__h { color: var(--energy); }
.td-pc--con .td-pc__h { color: var(--rose); }

.td-links { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 12px; }
.td-link { display: flex; gap: 10px; }
.td-link__body { min-width: 0; }
.td-link__body a { color: var(--ink); font-size: 0.94rem; text-decoration: none; border-bottom: 1px solid var(--orokin-line); }
.td-link__body a:hover { color: var(--gold-ink); }
.td-link__meta { display: inline-block; margin-left: 8px; font-family: var(--font-hud); font-size: 0.74rem; color: var(--ink-dim); }
.td-link__snip { margin: 4px 0 0; color: var(--ink-dim); font-size: 0.86rem; line-height: 1.5; font-style: italic; }
.td-dot { flex: none; width: 10px; height: 10px; border-radius: 50%; margin-top: 5px; }
.td-dot.is-positive { background: var(--energy); }
.td-dot.is-mixed { background: var(--orokin); }
.td-dot.is-negative { background: var(--rose); }
.td-yt { color: var(--rose); font-size: 0.9rem; margin-top: 2px; }
/* Review videos → responsive grid of 16:9 facade players (1-up mobile, 2-up wide) */
.td-videos { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 16px; }
.td-vid-fallback { display: flex; align-items: center; gap: 8px; }
.td-reddit-cta { display: inline-block; margin-top: 10px; font-family: var(--font-hud); font-size: 0.84rem; color: var(--energy); text-decoration: none; }
.td-reddit-cta:hover { color: var(--gold-ink); text-decoration: underline; }
.td-nodata { color: var(--ink-dim); font-style: italic; font-size: 0.9rem; }

.td-side { display: flex; flex-direction: column; gap: 16px; position: sticky; top: 84px; }
.td-side__h { font-family: var(--font-hud); text-transform: uppercase; letter-spacing: 0.08em; font-size: 0.8rem; color: var(--ink-dim); margin-bottom: 8px; }
.td-verdict { padding: 16px; }
.td-verdict__tier { display: inline-block; font-family: var(--font-hud); font-weight: 800; text-transform: uppercase; letter-spacing: 0.06em; font-size: 0.82rem; padding: 4px 12px; margin-bottom: 10px; clip-path: polygon(7px 0, 100% 0, 100% calc(100% - 7px), calc(100% - 7px) 100%, 0 100%, 0 7px); }
.td-verdict__tier.is-situational, .td-verdict__tier.is-niche { background: rgba(255,255,255,0.1); color: var(--ink); }
.td-verdict__reason { color: #cdd2e4; font-size: 0.9rem; line-height: 1.55; margin: 0; }
.td-safetybox { padding: 16px; }
.td-safetybox.is-caution { border-color: var(--orokin-line); }
.td-safetybox.is-risky { border-color: rgba(217, 138, 138, 0.5); }
.td-safety__rating { font-family: var(--font-display); font-size: 1.05rem; margin-bottom: 6px; }
.td-safetybox.is-safe .td-safety__rating { color: var(--energy); }
.td-safetybox.is-caution .td-safety__rating { color: var(--orokin); }
.td-safetybox.is-risky .td-safety__rating { color: var(--rose); }
.td-safety__notes { color: #cdd2e4; font-size: 0.88rem; line-height: 1.55; margin: 0; }
.td-facts { padding: 16px; }
.td-socials { padding: 16px; }
.td-dl { margin: 0; }
.td-dl > div { display: flex; justify-content: space-between; gap: 12px; padding: 5px 0; border-bottom: 1px solid rgba(255,255,255,0.05); font-size: 0.86rem; }
.td-dl > div:last-child { border-bottom: none; }
.td-dl dt { color: var(--ink-dim); font-family: var(--font-hud); }
.td-dl dd { color: var(--ink); margin: 0; text-align: right; }

.td-related { padding: 8px 30px 24px; border-top: 1px solid rgba(255, 255, 255, 0.06); }
.td-related__grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 14px; }
.td-rel { display: flex; flex-direction: column; gap: 6px; padding: 14px; text-decoration: none; }
.td-rel__name { font-family: var(--font-display); color: var(--gold-ink); font-size: 1rem; }
.td-rel__desc { color: var(--ink-dim); font-size: 0.84rem; line-height: 1.5; }
.td-rel:hover { border-color: var(--orokin-line); }

@media (max-width: 860px) {
  .td-hero { grid-template-columns: 1fr; }
  .td-body { grid-template-columns: 1fr; }
  .td-side { position: static; }
  .td-proscons { grid-template-columns: 1fr; }
  .td-hero, .td-body, .td-related, .td-crumb { padding-left: 16px; padding-right: 16px; }
}
</style>
