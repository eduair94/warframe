<!-- /mission — hub (searchable drop-source table) and /mission/<slug> — detail
     (farm value first, then node facts, then "how to get here"). Data-driven from
     WFCD via /missions + /mission/:slug; curated access notes merged client-side. -->
<template>
  <div class="an ms">
    <h1 class="ms-sr">{{ slug ? displayTitle : t('mission.hubTitle') }}</h1>

    <!-- ===== DETAIL ===== -->
    <template v-if="slug">
      <div v-if="detailError || !detail" class="an-console ms-state">
        <p>{{ t('mission.notFound', { slug: prettify(slug) }) }}</p>
        <nuxt-link :to="localePath('/mission')">{{ t('mission.browseAll') }} →</nuxt-link>
      </div>

      <div v-else class="an-console ms-detail">
        <header class="an-hero">
          <div class="an-hero__text">
            <div class="an-eyebrow">{{ detail.planet }}</div>
            <h2 class="an-title accent-a">{{ detail.location }}</h2>
            <p class="an-lede">
              <span v-if="detail.gameMode && detail.gameMode !== 'Normal'" class="ms-badge">{{ detail.gameMode }}</span>
              <span v-if="detail.node?.missionType">{{ detail.node.missionType }}</span>
            </p>
          </div>
          <div class="an-hero__deal">
            <div class="an-hero__deal-label">{{ t('mission.bestValue') }}</div>
            <div class="an-hero__deal-plat">{{ fmtPlat(detail.bestValue) }}p</div>
          </div>
        </header>

        <!-- Node facts -->
        <div class="an-stats">
          <div class="an-stat">
            <div class="an-stat__num">{{ detail.node ? detail.node.faction : '—' }}</div>
            <div class="an-stat__lbl">{{ t('mission.faction') }}</div>
          </div>
          <div class="an-stat">
            <div class="an-stat__num">{{ detail.node ? detail.node.missionType : '—' }}</div>
            <div class="an-stat__lbl">{{ t('mission.missionType') }}</div>
          </div>
          <div class="an-stat">
            <div class="an-stat__num is-alt">
              {{ detail.node ? detail.node.minLevel + '–' + detail.node.maxLevel : '—' }}
            </div>
            <div class="an-stat__lbl">{{ t('mission.enemyLevel') }}</div>
          </div>
          <div class="an-stat" v-if="detail.node">
            <div class="an-stat__num is-gold">
              {{ detail.node.steelPath.minLevel }}–{{ detail.node.steelPath.maxLevel }}
            </div>
            <div class="an-stat__lbl">{{ t('mission.steelPath') }}</div>
          </div>
        </div>
        <p v-if="!detail.node" class="ms-activity">{{ t('mission.activity') }}</p>

        <!-- Rewards -->
        <section class="ms-rewards">
          <h3 class="ms-h3">{{ t('mission.rewards') }}</h3>
          <div v-for="(rot, ri) in detail.rotations" :key="'rot' + ri" class="ms-rot">
            <div v-if="rot.rotation" class="ms-rot__lbl">{{ t('mission.rotation', { r: rot.rotation }) }}</div>
            <ul class="ms-list">
              <li v-for="(rw, wi) in rot.rewards" :key="'rw' + wi" class="ms-row">
                <img class="an-thumb" :src="itemThumb({ itemName: rw.itemName, thumb: rw.thumb, urlName: rw.url_name })" :alt="rw.itemName" @error="onImgError" />
                <button class="ms-row__name" type="button" @click="openDrops(rw.itemName, rw.thumb)">{{ localName('items', rw.url_name, rw.itemName) }}</button>
                <span class="ms-row__chance"><i class="ms-dot" :style="{ background: rarityColor(rw.rarity) }"></i>{{ fmtChance(rw.chance) }}%</span>
                <span class="ms-row__plat">{{ rw.tradeable ? fmtPlat(rw.price) + 'p' : '—' }}</span>
              </li>
            </ul>
            <p v-if="!rot.rewards.length" class="an-empty">{{ t('mission.noRewards') }}</p>
          </div>
        </section>

        <!-- How to get here (curated) -->
        <section v-if="note" class="ms-note">
          <h3 class="ms-h3">{{ t('mission.howToGet') }}</h3>
          <p class="ms-note__access">{{ note.access }}</p>
          <ul v-if="note.tips?.length" class="ms-note__tips">
            <li v-for="(tip, ti) in note.tips" :key="'tip' + ti">{{ tip }}</li>
          </ul>
          <div v-if="note.related?.length" class="ms-note__rel">
            <span class="ms-note__rel-lbl">{{ t('mission.relatedLinks') }}</span>
            <nuxt-link v-for="(r, xi) in note.related" :key="'rel' + xi" :to="localePath(r.to)" class="an-chip">{{ r.label }}</nuxt-link>
          </div>
        </section>

        <footer class="ms-foot">
          <a v-if="wikiHref" :href="wikiHref" target="_blank" rel="noopener noreferrer" class="ms-foot__wiki">{{ t('mission.wiki') }} ↗</a>
        </footer>
      </div>
    </template>

    <!-- ===== HUB ===== -->
    <template v-else>
      <div class="an-console ms-hub">
        <header class="an-hero">
          <div class="an-hero__text">
            <div class="an-eyebrow">{{ t('mission.eyebrow') }}</div>
            <h2 class="an-title">{{ t('mission.hubTitle') }}</h2>
            <p class="an-lede">{{ t('mission.hubLede') }}</p>
          </div>
        </header>
        <div class="an-filters"><div class="an-filters__row">
          <input v-model="q" class="an-search an-field" :placeholder="t('mission.searchPlaceholder')" />
        </div></div>
        <div class="an-tablewrap">
          <table class="an-table">
            <thead><tr>
              <th class="col-name">{{ t('mission.col.node') }}</th>
              <th>{{ t('mission.col.planet') }}</th>
              <th>{{ t('mission.col.type') }}</th>
              <th>{{ t('mission.col.faction') }}</th>
              <th>{{ t('mission.col.level') }}</th>
              <th class="an-num">{{ t('mission.col.value') }}</th>
            </tr></thead>
            <tbody>
              <tr v-for="row in filteredRows" :key="row.slug">
                <td><nuxt-link :to="localePath('/mission/' + row.slug)" class="ms-link">{{ row.location }}</nuxt-link></td>
                <td>{{ row.planet }}</td>
                <td>{{ row.missionType || (row.gameMode !== 'Normal' ? row.gameMode : '—') }}</td>
                <td>{{ row.faction || '—' }}</td>
                <td>{{ row.minLevel != null ? row.minLevel + '–' + row.maxLevel : '—' }}</td>
                <td class="an-num an-strong">{{ fmtPlat(row.bestValue) }}p</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>

    <DropLocationsDialog v-model="dropsDialog" :item-name="dropsItem" :thumb="dropsThumb" />
  </div>
</template>

<script setup lang="ts">
import { missionNote } from '~/data/missionNotes'

interface Reward { itemName: string; url_name: string; thumb: string; rarity: string; chance: number; price: number; tradeable: boolean }
interface Rotation { rotation: string | null; value: number; rewards: Reward[] }
interface Detail {
  slug: string; planet: string; location: string; gameMode: string; isEvent: boolean
  node: { faction: string; missionType: string; minLevel: number; maxLevel: number; steelPath: { minLevel: number; maxLevel: number }; wikiLink: string } | null
  rotations: Rotation[]; bestValue: number; indexable: boolean
}
interface ListRow { slug: string; planet: string; location: string; gameMode: string; faction: string | null; missionType: string | null; minLevel: number | null; maxLevel: number | null; bestValue: number; indexable: boolean }

const { t } = useI18n()
const route = useRoute()
const localePath = useLocalePath()
const base = useApiBase() as string
const { localName } = useLocalizedName()
const { itemThumb } = useItemThumb()

const slug = computed(() => route.params.slug as string | undefined)

// Hub list
const { data: listData } = await useAsyncData('missions', async () => {
  const r = await $fetch<any>(`${base}/missions`)
  return r && Array.isArray(r.rows) ? r : { rows: [] }
})
const rows = computed<ListRow[]>(() => listData.value?.rows ?? [])
const q = ref('')
const filteredRows = computed(() => {
  const s = q.value.trim().toLowerCase()
  if (!s) return rows.value
  return rows.value.filter((r) =>
    (r.location + ' ' + r.planet + ' ' + (r.missionType || '') + ' ' + (r.faction || '')).toLowerCase().includes(s),
  )
})

// Detail
const { data: detail, error: detailErr } = await useAsyncData<Detail | null>(
  () => `mission-${slug.value || 'none'}`,
  async () => {
    if (!slug.value) return null
    const r = await $fetch<any>(`${base}/mission/${encodeURIComponent(slug.value)}`)
    return r && Array.isArray(r.rotations) ? (r as Detail) : null
  },
  { watch: [slug] },
)
const detailError = computed(() => !!detailErr.value)
const displayTitle = computed(() => (detail.value ? `${detail.value.location} — ${detail.value.planet}` : ''))

const note = computed(() =>
  detail.value ? missionNote(detail.value.slug, detail.value.gameMode, detail.value.planet) : null,
)
const wikiHref = computed(() => (detail.value?.node ? nodeWikiUrl(detail.value.node.wikiLink) : ''))

// A page is noindex when it has no node facts AND no curated note AND no value.
const shouldIndex = computed(
  () => !slug.value || !!(detail.value && (detail.value.indexable || note.value)),
)

// SEO: runtime title from the node; robots noindex for thin activity pages.
const missionSeo = PAGE_SEO['/mission']
useSeoPage({
  title: () =>
    slug.value && detail.value
      ? `${detail.value.location} (${detail.value.planet}) — Drops, Enemy Levels & Access | Warframe`
      : missionSeo?.title ?? '',
  description: () =>
    slug.value && detail.value
      ? `Where ${detail.value.location} sits on the Warframe star chart: full reward table with platinum value, enemy levels, faction, Steel Path scaling and how to unlock it.`
      : missionSeo?.description ?? '',
})
useHead(() => (shouldIndex.value ? {} : { meta: [{ name: 'robots', content: 'noindex' }] }))

// Reused helpers
function prettify(s?: string) { return prettifySlug(s) }
function rarityColor(r: string): string {
  const k = (r || '').toLowerCase()
  if (k === 'legendary') return '#35d6d0'
  if (k === 'rare') return '#e7cf95'
  if (k === 'uncommon') return '#b6c0cc'
  return '#c08457'
}
function fmtChance(v: number) { return v >= 10 ? v.toFixed(0) : v.toFixed(2) }
function onImgError(e: Event) { (e.target as HTMLImageElement).src = THUMB_PLACEHOLDER }

// Drop dialog reuse
const dropsDialog = ref(false)
const dropsItem = ref('')
const dropsThumb = ref('')
function openDrops(name: string, thumb: string) { dropsItem.value = name; dropsThumb.value = thumb || ''; dropsDialog.value = true }

onMounted(() => {
  const el = document.getElementById('spinner-wrapper')
  if (el) el.style.display = 'none'
})
</script>

<style scoped>
.ms-sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); }
.ms-badge { display: inline-block; padding: 1px 8px; margin-right: 8px; border-radius: 4px; background: var(--orokin-dim); color: var(--gold-ink); font-family: var(--font-hud); font-size: 0.8rem; }
.ms-activity { color: var(--ink-dim); font-style: italic; margin: 4px 0 0; }
.ms-h3 { font-family: var(--font-display); color: var(--gold-ink); font-size: 1.1rem; margin: 24px 0 12px; }
.ms-rot__lbl { color: var(--energy); font-family: var(--font-hud); font-size: 0.85rem; margin: 12px 0 6px; }
.ms-list { list-style: none; margin: 0; padding: 0; }
.ms-row { display: grid; grid-template-columns: 34px 1fr auto auto; align-items: center; gap: 12px; padding: 6px 0; border-bottom: 1px solid var(--line); }
.ms-row__name { background: none; border: none; color: var(--ink); text-align: left; cursor: pointer; font: inherit; padding: 0; }
.ms-row__name:hover { color: var(--energy-hi, #7af0ea); }
.ms-row__chance { color: var(--ink-dim); font-family: var(--font-hud); }
.ms-row__plat { color: var(--gold-ink); font-family: var(--font-hud); min-width: 56px; text-align: right; }
.ms-dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; margin-right: 6px; }
.ms-note__access { color: var(--ink); line-height: 1.6; }
.ms-note__tips { color: var(--ink-dim); }
.ms-note__rel { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; margin-top: 12px; }
.ms-note__rel-lbl { color: var(--ink-dim); font-family: var(--font-hud); font-size: 0.85rem; }
.ms-foot { margin-top: 24px; padding-top: 16px; border-top: 1px solid var(--orokin-line); }
.ms-foot__wiki { color: var(--energy); text-decoration: none; font-family: var(--font-hud); }
.ms-link, .ms-link:visited { color: var(--gold-ink); text-decoration: none; }
.ms-link:hover { color: var(--energy-hi, #7af0ea); }
.ms-state { text-align: center; padding: 48px 16px; }
</style>
