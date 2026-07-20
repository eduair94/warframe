<template>
  <div class="an rl">
    <!-- Visually-hidden H1 keeps the entity keyword for SEO; the visible name is the Cinzel hero below. -->
    <h1 class="rl-sr">{{ relicName ? t('relicDetail.h1Titled', { name: relicName }) : t('relicDetail.h1Fallback') }}</h1>

    <div class="an-console rl-console">
      <!-- Top bar: relic picker + refinement -->
      <div class="rl-topbar">
        <div class="rl-crumbs">
          {{ t('relicLedger.eyebrowShort') }}
          <span v-if="relicName" class="rl-crumbs__sep" aria-hidden="true"></span>
          <b v-if="relicName">{{ displayName }}</b>
        </div>
        <div class="rl-controls">
          <v-autocomplete
            v-model="pick"
            :items="allSets"
            :item-title="(el) => localItemName(el)"
            item-value="url_name"
            :label="t('relicsValue.filters.search')"
            density="compact"
            hide-details
            variant="outlined"
            prepend-inner-icon="mdi-magnify"
            class="rl-pick"
            @update:model-value="onPick"
          ></v-autocomplete>
          <div class="rl-refine">
            <span class="rl-refine__lbl">{{ t('relicsValue.filters.refinement') }}</span>
            <v-btn-toggle v-model="refinement" mandatory density="comfortable" class="rl-seg" @update:model-value="onRefinementChange">
              <v-btn value="Intact" size="small">{{ t('relicsValue.filters.intact') }}</v-btn>
              <v-btn value="Radiant" size="small">{{ t('relicsValue.filters.radiant') }}</v-btn>
            </v-btn-toggle>
          </div>
        </div>
      </div>

      <!-- Empty state: no relic chosen -->
      <div v-if="!relicSlug" class="rl-state">
        <span class="rl-state__node" aria-hidden="true"></span>
        <p>{{ t('relicLedger.pickPrompt') }}</p>
      </div>

      <!-- Not found -->
      <div v-else-if="loadError || !relic" class="rl-state">
        <span class="rl-state__node" aria-hidden="true"></span>
        <p>{{ t('relicLedger.notFound', { name: displayName }) }}</p>
        <nuxt-link class="rl-state__link" :to="localePath('/relics-value')">{{ t('relicLedger.browseAll') }} →</nuxt-link>
      </div>

      <template v-else>
        <!-- Hero: name + verdict -->
        <div class="rl-hero">
          <div class="rl-hero__text">
            <div class="rl-eyebrow">{{ t('relicLedger.eyebrow') }}</div>
            <div class="rl-name">
              <img
                v-if="hasHeadThumb"
                :key="headThumb"
                class="rl-name__thumb"
                :src="headThumb"
                :alt="displayName"
                loading="lazy"
                @error="onImgError"
              />
              {{ displayName }}
              <span v-if="relic.vaulted" class="rl-badge rl-badge--vault">{{ t('relicsValue.tags.vaultedBadge') }}</span>
              <span v-else-if="relic.resurgence" class="rl-badge rl-badge--res" :title="t('relicsValue.tags.resurgenceTitle')">{{ t('relicsValue.tags.resurgence') }}</span>
            </div>
            <div class="rl-meta">
              <span>{{ t('relicLedger.meta.tier', { tier: relic.tier }) }}</span><span class="rl-meta__dot"></span>
              <span>{{ t('relicLedger.meta.drops', { n: relic.rewards.length }) }}</span><span class="rl-meta__dot"></span>
              <span>{{ t('relicLedger.meta.relicVol', { n: fmtInt(mkt.volume) }) }}</span>
              <template v-if="mix.vaulted"><span class="rl-meta__dot"></span><span class="rl-vtag">{{ t('relicLedger.meta.partsVaulted', { n: mix.vaulted, total: relic.rewards.length }) }}</span></template>
            </div>
            <p class="rl-lede">{{ verdict.lede }}</p>
          </div>

          <div class="rl-verdict" :class="'is-' + verdict.side">
            <div class="rl-verdict__lbl">{{ t('relicLedger.verdict.the') }} — {{ refinementLabel }}</div>
            <div class="rl-verdict__call">{{ verdict.call }}</div>
            <p class="rl-verdict__because">{{ verdict.because }}</p>
          </div>
        </div>

        <!-- Three-way ledger: crack | sell | keep -->
        <div class="rl-ledger">
          <div class="rl-pan rl-pan--crack" :class="{ win: verdict.side === 'crack' }">
            <div class="rl-pan__k"><span class="rl-pan__glyph"></span> {{ t('relicsValue.dialog.crackFor', { refinement: refinementLabel }) }}
              <span v-if="verdict.side === 'crack'" class="rl-pan__tag">▲ {{ t('relicLedger.best') }}</span>
            </div>
            <div class="rl-pan__v">{{ fmtEv(open) }}<small>{{ t('relicLedger.avgPerRelic') }}</small></div>
            <div class="rl-pan__note">{{ t('relicsValue.dialog.crackNote') }} · {{ t('relicLedger.rawShort', { n: fmtEv(openRaw) }) }}</div>
          </div>
          <div class="rl-pan rl-pan--sell" :class="{ win: verdict.side === 'sell' }">
            <div class="rl-pan__k"><span class="rl-pan__glyph"></span> {{ t('relicsValue.dialog.sellNow') }}
              <span v-if="verdict.side === 'sell'" class="rl-pan__tag">▲ {{ t('relicLedger.best') }}</span>
            </div>
            <div class="rl-pan__v">{{ fmtEv(sellNow) }}<small>p</small></div>
            <div class="rl-pan__note">{{ t('relicsValue.dialog.sellNote') }}</div>
          </div>
          <div class="rl-pan rl-pan--keep" :class="{ win: verdict.side === 'keep' }">
            <div class="rl-pan__k"><span class="rl-pan__glyph"></span> {{ t('relicLedger.keep.label') }}
              <span v-if="verdict.side === 'keep'" class="rl-pan__tag">▲ {{ t('relicLedger.lean') }}</span>
            </div>
            <div class="rl-pan__v rl-pan__v--word">{{ farmable ? t('relicLedger.keep.farmable') : t('relicLedger.keep.vaulted') }}</div>
            <div class="rl-pan__note">{{ farmable ? t('relicLedger.keep.farmableNote') : t('relicLedger.keep.vaultedNote') }}</div>
          </div>
        </div>

        <p v-if="bidInflated" class="rl-flag">
          {{ t('relicLedger.bidFlag', { bid: fmtPlat(mkt.buy), rate: fmtEv(sellNow), mult: bidMult }) }}
        </p>

        <!-- Reward odds & payout: the signature -->
        <section class="rl-sec">
          <div class="rl-sec__head">
            <div class="rl-sec__title">{{ t('relicLedger.odds.title') }}</div>
            <div class="rl-sec__hint">{{ t('relicLedger.odds.hint') }}</div>
          </div>

          <div class="rl-legend">
            <span class="rl-lg"><i :style="{ background: rarityColor('Rare') }"></i>{{ t('relicLedger.rarity.rare') }}</span>
            <span class="rl-lg"><i :style="{ background: rarityColor('Uncommon') }"></i>{{ t('relicLedger.rarity.uncommon') }}</span>
            <span class="rl-lg"><i :style="{ background: rarityColor('Common') }"></i>{{ t('relicLedger.rarity.common') }}</span>
            <span class="rl-lg rl-lg--muted">{{ t('relicLedger.odds.legend') }}</span>
          </div>

          <ul class="rl-drops">
            <li
              v-for="(d, i) in sortedRewards"
              :key="d.url_name || d.item_name || i"
              class="rl-drop"
              :class="[rarityClass(d), { 'is-forma': isForma(d) }]"
            >
              <span class="rl-drop__node">
                <img :src="rewardThumb(d)" :alt="localItemName(d)" loading="lazy" @error="onNodeImgError" />
                <i class="rl-drop__diamond" :style="{ background: rarityColor(trueRarity(d)) }"></i>
              </span>

              <div class="rl-drop__name">
                <a
                  v-if="d.url_name"
                  :href="'https://warframe.market/items/' + d.url_name"
                  target="_blank"
                  rel="noopener"
                  @click="onRewardMarket(d)"
                >{{ localItemName(d) }}</a>
                <span v-else class="rl-plain">{{ localItemName(d) }}</span>
                <span class="rl-drop__sub">
                  <span class="rl-rar">{{ localRarity(d) }}</span>
                  <span v-if="rewardVaulted(d)" class="rl-vtag">{{ t('relicsValue.tags.vaulted') }}</span>
                  <span v-if="isForma(d)" class="rl-vtag rl-vtag--forma">{{ t('relicLedger.untradeable') }}</span>
                </span>
              </div>

              <div class="rl-drop__chance">
                <div class="rl-big">{{ chanceOf(d) }}<span>%</span></div>
                <div class="rl-alt">{{ t('relicLedger.altChance', { ref: otherRefShort, n: altChanceOf(d) }) }}</div>
              </div>

              <div class="rl-drop__bar">
                <div class="rl-bar-track"><div class="rl-bar-fill" :style="{ width: barWidth(d) + '%' }"></div></div>
                <div class="rl-bar-cap">
                  <span>{{ t('relicLedger.odds.share') }}</span>
                  <b>{{ isForma(d) ? '—' : t('relicLedger.odds.shareVal', { pct: sharePct(d), n: fmtEv(contribOf(d)) }) }}</b>
                </div>
              </div>

              <div class="rl-drop__val">
                <div class="rl-p">{{ isForma(d) ? '—' : fmtEv(rewardBasis(d)) + 'p' }}</div>
                <div class="rl-v" :class="{ 'is-thin': isThin(d) }">{{ isForma(d) ? t('relicLedger.noMarket') : t('relicsValue.dialog.volShort') + ' ' + fmtInt(d.volume) }}</div>
              </div>

              <button
                class="rl-drop__drops"
                type="button"
                :title="t('relicsValue.dialog.whereDrops', { name: localItemName(d) })"
                :aria-label="t('relicsValue.dialog.whereDrops', { name: localItemName(d) })"
                @click="openDrops(d)"
              >
                <v-icon size="17">mdi-map-marker-radius-outline</v-icon>
              </button>
            </li>
          </ul>

          <div class="rl-odds-foot">
            <span class="rl-odds-foot__k">{{ t('relicLedger.odds.sortedBy') }}</span>
            <div class="rl-totals">
              <div class="rl-t"><div class="rl-t__lbl">{{ t('relicsValue.card.realizableEv') }}</div><div class="rl-t__num">{{ fmtEv(open) }}p</div></div>
              <div class="rl-t rl-t--raw"><div class="rl-t__lbl">{{ t('relicsValue.card.rawEv') }}</div><div class="rl-t__num">{{ fmtEv(openRaw) }}p</div></div>
            </div>
          </div>
        </section>

        <!-- Relic market book -->
        <section class="rl-sec">
          <div class="rl-sec__head">
            <div class="rl-sec__title">{{ t('relicLedger.book.title') }}</div>
            <div class="rl-sec__hint">warframe.market</div>
          </div>
          <div class="rl-book">
            <div class="rl-cell rl-cell--hi">
              <div class="rl-cell__k">{{ t('relicLedger.book.clearsAt') }}</div>
              <div class="rl-cell__v">{{ fmtEv(mkt.avgPrice || sellNow) }}<small>p</small></div>
              <div class="rl-cell__sub">{{ t('relicLedger.book.clearsSub') }}</div>
            </div>
            <div class="rl-cell">
              <div class="rl-cell__k">{{ t('relicsValue.dialog.market.topBid') }}</div>
              <div class="rl-cell__v">{{ fmtPlat(mkt.buy) }}<small>p</small></div>
              <div class="rl-cell__sub" :class="{ 'is-warn': bidInflated }">{{ bidInflated ? t('relicLedger.book.bidWarn', { mult: bidMult }) : t('relicLedger.book.bidSub') }}</div>
            </div>
            <div class="rl-cell">
              <div class="rl-cell__k">{{ t('relicsValue.dialog.market.lowAsk') }}</div>
              <div class="rl-cell__v">{{ fmtPlat(mkt.sell) }}<small>p</small></div>
              <div class="rl-cell__sub">{{ t('relicLedger.book.askSub') }}</div>
            </div>
            <div class="rl-cell">
              <div class="rl-cell__k">{{ t('relicsValue.dialog.market.vol48h') }}</div>
              <div class="rl-cell__v">{{ fmtInt(mkt.volume) }}</div>
              <div class="rl-cell__sub">{{ liquidityLabel }}</div>
            </div>
          </div>
        </section>

        <!-- References -->
        <section class="rl-sec">
          <div class="rl-sec__head">
            <div class="rl-sec__title">{{ t('relicLedger.refs.title') }}</div>
            <div class="rl-sec__hint">{{ t('relicLedger.refs.hint') }}</div>
          </div>
          <div class="rl-refs">
            <a v-if="wikiUrl" class="rl-ref" :href="wikiUrl" target="_blank" rel="noopener noreferrer" @click="onWikiOpen">
              <span class="rl-ref__ico"></span> {{ t('relicsValue.dialog.footer.wiki') }} — {{ displayName }} <span class="rl-ref__arw">↗</span>
            </a>
            <a class="rl-ref" :href="'https://warframe.market/items/' + relic.url_name" target="_blank" rel="noopener noreferrer" @click="onRelicMarket">
              <span class="rl-ref__ico"></span> {{ t('relicsValue.dialog.footer.market') }} <span class="rl-ref__arw">↗</span>
            </a>
            <a class="rl-ref" :href="dropTableUrl" target="_blank" rel="noopener noreferrer" @click="onDropTableOpen">
              <span class="rl-ref__ico"></span> {{ t('relicLedger.refs.dropTable') }} <span class="rl-ref__arw">↗</span>
            </a>
          </div>
        </section>

        <v-alert class="rl-disclaimer" type="info" density="compact">
          {{ t('relicLedger.howToRead') }}
        </v-alert>
      </template>
    </div>

    <!-- Support the project — same donation links as the home page (the heart
         FAB in the layout opens the full donation dialog on every page). -->
    <div class="rl-donate">
      <span class="rl-donate__lbl">{{ t('relic_help_donate') }}</span>
      <a
        class="rl-donate__logo"
        target="_blank"
        rel="noopener"
        :aria-label="t('home.donate.paypalAria')"
        href="https://ko-fi.com/cambio_uruguay"
      >
        <picture>
          <source srcset="/img/paypal_icon.webp" type="image/webp" />
          <img src="/img/paypal_icon.png" alt="PayPal" width="44" height="44" />
        </picture>
      </a>
      <a
        class="rl-donate__logo"
        target="_blank"
        rel="noopener"
        :aria-label="t('home.donate.mercadopagoAria')"
        href="https://mpago.la/19j46vX"
      >
        <picture>
          <source srcset="/img/mercadopago_icon.webp" type="image/webp" />
          <img src="/img/mercadopago_icon.png" alt="Mercado Pago" width="44" height="44" />
        </picture>
      </a>
    </div>

    <DropLocationsDialog v-model="dropsDialog" :item-name="dropsItem" :thumb="dropsThumb" />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import {
  RELIC_CHANCES,
  trueRarity,
  useRelicValue,
  type RelicReward,
  type RelicRow,
} from '~/composables/useRelicValue'

const base = useApiBase() as string
const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const localePath = useLocalePath()
const { localItemName } = useLocalizedName()
const { itemThumb, THUMB_PLACEHOLDER } = useItemThumb()
const { trackAction, trackDialog, trackFilter, trackMarketOpen, trackSelectItem, trackViewItem } = useAnalytics()

const items = useItemsStore()
const allSets = computed(() => items.allRelics)

const relicSlug = computed(() => route.params.relic as string | undefined)
const relicName = computed(() => prettifySlug(relicSlug.value))

// Entity-specific SEO — overrides the layout's generic /relic title/description
// + OG card. Canonical/hreflang stay centralised in the layout.
const relicSeo = PAGE_SEO['/relic']
useSeoPage({
  // prettifySlug('lith_t11_relic') already yields "Lith T11 Relic" — don't append
  // "Relic" again (that produced "Lith T11 Relic Relic").
  title: () =>
    relicName.value
      ? `${relicName.value} — Rewards, Drop Odds & Platinum Value (Warframe)`
      : relicSeo?.title ?? '',
  description: () =>
    relicName.value
      ? `Every drop the ${relicName.value} yields with real drop chances, plus the expected platinum from cracking it (Intact & Radiant) versus selling it — so you can decide to open, sell, or keep.`
      : relicSeo?.description ?? '',
})

// SSR fetch of the single relic's EV row (rewards + authoritative chances +
// market book). Server-rendered so the numbers are in the initial HTML for SEO.
const { data: relic, error } = await useAsyncData<RelicRow | null>(
  `relic-ev-${relicSlug.value || 'none'}`,
  async () => {
    if (!relicSlug.value) return null
    const r = await $fetch<any>(`${base}/relic_ev/${encodeURIComponent(relicSlug.value)}`)
    // The cached API wrapper answers a failed producer with a 200 { error } body
    // (not an HTTP error), which would slip past a plain `!relic` guard and crash
    // the template on relic.rewards. Only a well-formed EV row (with a rewards
    // array) counts as data; anything else becomes null → the not-found state.
    return r && Array.isArray(r.rewards) ? (r as RelicRow) : null
  },
  { watch: [relicSlug] },
)
const loadError = computed(() => !!error.value)

const refinement = ref('Radiant')
const refinementLabel = computed(() =>
  refinement.value === 'Radiant' ? t('relicsValue.filters.radiant') : t('relicsValue.filters.intact'),
)
const otherRefShort = computed(() =>
  (refinement.value === 'Radiant' ? t('relicsValue.filters.intact') : t('relicsValue.filters.radiant')).slice(0, 3),
)
// Refinement is the only control on this page — report the switch itself, never
// the numbers it re-derives (those recompute on every toggle).
function onRefinementChange(v: string | null) {
  if (v) trackFilter('refinement', v)
}

const {
  ev,
  evRaw,
  relicSellNow,
  effectivePrice,
  rewardBasis,
  rewardVaulted,
  dropMix,
  isVaulted,
  isFarmable,
  fmtPlat,
} = useRelicValue(refinement)

const displayName = computed(() => relic.value?.relicName || relicName.value || '')
const mkt = computed<any>(() => relic.value?.relic || {})
const open = computed(() => (relic.value ? ev(relic.value) : 0))
const openRaw = computed(() => (relic.value ? evRaw(relic.value) : 0))
const sellNow = computed(() => relicSellNow(relic.value))
const mix = computed(() => dropMix(relic.value))
const farmable = computed(() => isFarmable(relic.value))

// Fixed refinement chance for a drop's TRUE rarity (from WFCD chance, not label).
function chanceTable(refKey: string) {
  return RELIC_CHANCES[refKey] ?? RELIC_CHANCES.Intact ?? {}
}
function fmtChance(c: number): string {
  return c >= 10 ? c.toFixed(0) : c.toFixed(2).replace(/\.?0+$/, '')
}
function chanceOf(r: RelicReward): string {
  return fmtChance(Number(chanceTable(refinement.value)[trueRarity(r)]) || 0)
}
function altChanceOf(r: RelicReward): string {
  const other = refinement.value === 'Radiant' ? 'Intact' : 'Radiant'
  return fmtChance(Number(chanceTable(other)[trueRarity(r)]) || 0)
}
// Realizable plat this drop adds to the relic's EV (chance × liquidity-weighted value).
function contribOf(r: RelicReward): number {
  return ((Number(chanceTable(refinement.value)[trueRarity(r)]) || 0) / 100) * effectivePrice(r)
}

// Drops ranked by realizable contribution — the earners on top.
const sortedRewards = computed<RelicReward[]>(() =>
  [...(relic.value?.rewards || [])].sort((a, b) => contribOf(b) - contribOf(a)),
)
const totalContrib = computed(() => sortedRewards.value.reduce((s, r) => s + contribOf(r), 0) || 1)
const maxContrib = computed(() => Math.max(0, ...sortedRewards.value.map(contribOf)))
function sharePct(r: RelicReward): number {
  return Math.round((contribOf(r) / totalContrib.value) * 100)
}
function barWidth(r: RelicReward): number {
  if (maxContrib.value <= 0) return 0
  const c = contribOf(r)
  return c > 0 ? Math.max(2, (c / maxContrib.value) * 100) : 0
}

// Verdict — crack vs sell, with the keep overlay for a vaulted relic.
const bidInflated = computed(() => {
  const bid = Number(mkt.value.buy) || 0
  return bid > 0 && sellNow.value > 0 && bid > sellNow.value * 1.35
})
const bidMult = computed(() => {
  const s = sellNow.value
  return s > 0 ? Math.round(((Number(mkt.value.buy) || 0) / s) * 10) / 10 : 0
})

const verdict = computed(() => {
  const o = open.value
  const s = sellNow.value
  const vaulted = isVaulted(relic.value)
  const edge = o - s
  const lede = t('relicLedger.lede', {
    refinement: refinementLabel.value,
    open: fmtEv(o),
    sell: fmtEv(s),
  })
  if (Math.abs(edge) < 0.5) {
    if (vaulted)
      return {
        side: 'keep',
        call: t('relicLedger.verdict.leanKeep'),
        because: t('relicLedger.because.keepLine', { open: fmtEv(o), sell: fmtEv(s) }),
        lede,
      }
    return {
      side: 'even',
      call: t('relicsValue.verdict.even'),
      because: t('relicLedger.because.even', { open: fmtEv(o), sell: fmtEv(s) }),
      lede,
    }
  }
  if (edge >= 0.5)
    return {
      side: 'crack',
      call: t('relicsValue.verdict.crack'),
      because: t(vaulted ? 'relicLedger.because.crackVaulted' : 'relicLedger.because.crack', {
        n: fmtEv(edge),
        open: fmtEv(o),
        sell: fmtEv(s),
      }),
      lede,
    }
  return {
    side: 'sell',
    call: t('relicsValue.verdict.sell'),
    because: t(vaulted ? 'relicLedger.because.sellVaulted' : 'relicLedger.because.sell', {
      n: fmtEv(-edge),
      open: fmtEv(o),
      sell: fmtEv(s),
    }),
    lede,
  }
})

// Market-book liquidity blurb from 48h volume.
const liquidityLabel = computed(() => {
  const v = Number(mkt.value.volume) || 0
  if (v >= 200) return t('relicLedger.book.veryLiquid')
  if (v >= 30) return t('relicLedger.book.liquid')
  if (v > 0) return t('relicLedger.book.thin')
  return t('relicLedger.book.untraded')
})

// Rarity presentation
function rarityColor(rarity: string): string {
  const r = (rarity || '').toLowerCase()
  if (r === 'legendary') return '#35d6d0'
  if (r === 'rare') return '#e7cf95'
  if (r === 'uncommon') return '#b6c0cc'
  return '#c08457'
}
function rarityClass(r: RelicReward): string {
  return 'r-' + trueRarity(r).toLowerCase()
}
function localRarity(r: RelicReward): string {
  const key = trueRarity(r).toLowerCase()
  return t('relicLedger.rarity.' + (key === 'common' || key === 'uncommon' || key === 'rare' ? key : 'common'))
}
function isForma(r: RelicReward): boolean {
  return /forma/i.test(r.item_name || '')
}
function isThin(r: RelicReward): boolean {
  const v = Number(r.volume) || 0
  return v > 0 && v < 12
}

// Thumbs
const headThumb = computed(() =>
  relic.value
    ? itemThumb({ urlName: relic.value.url_name, itemName: relic.value.relicName, thumb: relic.value.thumb })
    : THUMB_PLACEHOLDER,
)
const hasHeadThumb = computed(() => headThumb.value !== THUMB_PLACEHOLDER)
function rewardThumb(r: RelicReward): string {
  return itemThumb({ urlName: r.url_name, itemName: r.item_name, thumb: r.thumb })
}

// References
const wikiUrl = computed(() =>
  relic.value ? itemWikiUrl(relic.value.relicName + ' (Relic)') : '',
)
const dropTableUrl = computed(() => {
  const name = relic.value ? relic.value.relicName + ' Relic' : ''
  return `https://drops.warframestat.us/#/search/${encodeURIComponent(name)}/relics/regex`
})
// The delegated outbound-click listener already logs these hrefs; these hooks
// add the one thing it cannot know — which relic/drop the link belongs to.
function onWikiOpen() {
  trackAction('wiki_open', { item_name: displayName.value })
}
function onRelicMarket() {
  trackMarketOpen(displayName.value)
}
function onDropTableOpen() {
  trackAction('drop_table_open', { item_name: displayName.value })
}
function onRewardMarket(r: RelicReward) {
  trackMarketOpen(r.item_name || '', { source: 'relic_drops' })
}

// Drop-locations dialog
const dropsDialog = ref(false)
const dropsItem = ref('')
const dropsThumb = ref('')
function openDrops(r: RelicReward) {
  dropsItem.value = r.item_name || ''
  dropsThumb.value = r.thumb || ''
  dropsDialog.value = true
  trackDialog('drop_locations', { item_name: r.item_name || '' })
}

// Relic picker → navigate
const pick = ref<string | null>(null)
function onPick(v: string | null) {
  if (v && v !== relicSlug.value) {
    const picked = allSets.value.find((r: any) => r.url_name === v)
    trackSelectItem(picked?.item_name || v, { source: 'picker' })
    router.push(localePath('/relic/' + v))
  }
}

function fmtInt(n: any): string {
  return String(Math.round(Number(n) || 0))
}
// EV/price format: whole plat with thousands separators at ≥10p, one decimal
// below — so a low-value relic's crack-vs-sell edge (e.g. 4.9 vs 4.6) stays
// visible instead of both collapsing to "5p". Used for every derived plat number
// on this page; the market book's live order prices stay whole via fmtPlat.
function fmtEv(n: any): string {
  const v = Number(n) || 0
  return v >= 10 ? Math.round(v).toLocaleString('en-US') : (Math.round(v * 10) / 10).toString()
}

function onImgError(e: Event) {
  const img = e.target as HTMLImageElement | null
  if (img) img.style.display = 'none'
}
// A drop thumb that fails to load hides itself, revealing the rarity diamond behind it.
function onNodeImgError(e: Event) {
  const img = e.target as HTMLImageElement | null
  if (img) img.style.visibility = 'hidden'
}

// view_item closes the item funnel that starts at the picker or the ledger, so
// it must fire once per relic actually shown. Keyed on the slug because the
// refinement toggle re-derives `open` — without the guard every flip would
// re-report the same relic.
let viewedSlug = ''
function reportView() {
  const slug = relicSlug.value
  const row = relic.value
  if (!slug || slug === viewedSlug || !row) return
  // On a client-side pick the route changes before the refetch lands — wait for
  // the row that actually belongs to this slug so the event isn't mislabelled.
  if (row.url_name && row.url_name !== slug) return
  viewedSlug = slug
  trackViewItem(row.relicName || slug, { refinement: refinement.value, ev: open.value })
}
watch([relicSlug, relic], reportView)

onMounted(() => {
  const el = document.getElementById('spinner-wrapper')
  if (el) el.style.display = 'none'
  reportView()
})
</script>

<style scoped>
/* Wraps the analytics.css "Orokin Void Ledger" tokens (--void/--orokin/--energy,
   Cinzel/Rajdhani) — this component styles the relic-specific ledger on top. */
.rl {
  padding: 16px 0 40px;
}
.rl-sr {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
.rl-console {
  max-width: 1080px;
  margin: 0 auto;
}

/* Top bar */
.rl-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px 24px;
  flex-wrap: wrap;
  padding: 16px 26px;
  border-bottom: 1px solid var(--line);
  background: rgba(0, 0, 0, 0.18);
}
.rl-crumbs {
  font-family: var(--font-hud);
  text-transform: uppercase;
  letter-spacing: 0.22em;
  font-size: 0.66rem;
  color: var(--ink-dim);
  display: flex;
  align-items: center;
  gap: 9px;
}
.rl-crumbs b {
  color: var(--orokin);
  font-weight: 600;
}
.rl-crumbs__sep {
  width: 4px;
  height: 4px;
  background: var(--ink-faint, #626884);
  transform: rotate(45deg);
}
.rl-controls {
  display: flex;
  align-items: center;
  gap: 14px 18px;
  flex-wrap: wrap;
}
.rl-pick {
  min-width: 210px;
  max-width: 260px;
}
.rl-refine {
  display: inline-flex;
  align-items: center;
  gap: 10px;
}
.rl-refine__lbl {
  font-family: var(--font-hud);
  text-transform: uppercase;
  letter-spacing: 0.14em;
  font-size: 0.64rem;
  color: var(--ink-dim);
}

/* Empty / not-found states */
.rl-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 60px 24px;
  text-align: center;
  color: var(--ink-dim);
  font-family: var(--font-hud);
}
.rl-state__node {
  width: 12px;
  height: 12px;
  background: var(--orokin);
  transform: rotate(45deg);
  box-shadow: 0 0 12px rgba(200, 168, 92, 0.6);
}
.rl-state__link {
  color: var(--energy);
  text-decoration: none;
  font-weight: 600;
  letter-spacing: 0.05em;
}
.rl-state__link:hover {
  color: var(--energy-hi);
}

/* Hero */
.rl-hero {
  display: grid;
  grid-template-columns: 1fr minmax(280px, 360px);
  gap: 26px;
  padding: 30px 26px 24px;
  align-items: center;
}
.rl-eyebrow {
  font-family: var(--font-hud);
  text-transform: uppercase;
  letter-spacing: 0.32em;
  font-size: 0.68rem;
  color: var(--orokin);
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}
.rl-eyebrow::before {
  content: '';
  width: 5px;
  height: 5px;
  background: var(--orokin);
  transform: rotate(45deg);
}
.rl-name {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: clamp(1.9rem, 4.6vw, 3rem);
  line-height: 1.06;
  color: var(--gold-ink);
  letter-spacing: 0.01em;
  text-wrap: balance;
  display: flex;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
}
.rl-name__thumb {
  width: 48px;
  height: 48px;
  object-fit: contain;
  background: rgba(0, 0, 0, 0.35);
  border: 1px solid var(--orokin-line);
  clip-path: polygon(7px 0, 100% 0, 100% calc(100% - 7px), calc(100% - 7px) 100%, 0 100%, 0 7px);
}
.rl-badge {
  font-family: var(--font-hud);
  font-size: 0.62rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  padding: 3px 9px;
  border-radius: 4px;
  transform: translateY(-3px);
}
.rl-badge--vault {
  background: rgba(138, 143, 163, 0.16);
  color: #c2c8dc;
  border: 1px solid rgba(138, 143, 163, 0.42);
}
.rl-badge--res {
  background: rgba(159, 122, 234, 0.16);
  color: #c4b0ee;
  border: 1px solid rgba(159, 122, 234, 0.42);
}
.rl-meta {
  font-family: var(--font-hud);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 0.82rem;
  color: var(--ink-dim);
  margin-top: 12px;
  display: flex;
  gap: 8px 15px;
  flex-wrap: wrap;
  align-items: center;
}
.rl-meta__dot {
  width: 4px;
  height: 4px;
  background: var(--ink-faint, #626884);
  transform: rotate(45deg);
}
.rl-lede {
  color: var(--ink-dim);
  font-size: 0.94rem;
  line-height: 1.6;
  margin: 16px 0 0;
  max-width: 54ch;
}

/* Verdict plate */
.rl-verdict {
  position: relative;
  border: 1px solid var(--orokin-line);
  background: linear-gradient(160deg, rgba(200, 168, 92, 0.1), rgba(200, 168, 92, 0.02));
  clip-path: polygon(16px 0, 100% 0, 100% calc(100% - 16px), calc(100% - 16px) 100%, 0 100%, 0 16px);
  padding: 20px 22px 18px;
  text-align: center;
}
.rl-verdict.is-keep {
  background: linear-gradient(160deg, rgba(159, 122, 234, 0.16), rgba(159, 122, 234, 0.02));
  border-color: rgba(159, 122, 234, 0.4);
}
.rl-verdict.is-crack {
  background: linear-gradient(160deg, rgba(53, 214, 208, 0.1), rgba(53, 214, 208, 0.02));
  border-color: rgba(53, 214, 208, 0.36);
}
.rl-verdict__lbl {
  font-family: var(--font-hud);
  text-transform: uppercase;
  letter-spacing: 0.16em;
  font-size: 0.62rem;
  color: var(--ink-dim);
}
.rl-verdict__call {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 1.9rem;
  line-height: 1.1;
  margin: 4px 0 2px;
  color: var(--gold-ink);
}
.rl-verdict.is-crack .rl-verdict__call {
  color: var(--energy-hi);
}
.rl-verdict.is-keep .rl-verdict__call {
  color: #b79cf0;
}
.rl-verdict__because {
  font-size: 0.78rem;
  color: var(--ink-dim);
  line-height: 1.45;
  margin: 6px 0 0;
}
.rl-verdict__because :deep(b) {
  color: var(--ink);
  font-weight: 600;
}

/* Three-way ledger */
.rl-ledger {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  padding: 0 26px;
}
.rl-pan {
  position: relative;
  border: 1px solid var(--line);
  background: rgba(255, 255, 255, 0.015);
  padding: 16px 16px 14px;
  clip-path: polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px);
  transition: border-color 0.2s, background 0.2s;
}
.rl-pan__k {
  font-family: var(--font-hud);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  font-size: 0.66rem;
  color: var(--ink-dim);
  display: flex;
  align-items: center;
  gap: 7px;
  flex-wrap: wrap;
}
.rl-pan__glyph {
  width: 8px;
  height: 8px;
  transform: rotate(45deg);
  flex: none;
}
.rl-pan--crack .rl-pan__glyph {
  background: var(--energy);
}
.rl-pan--sell .rl-pan__glyph {
  background: var(--orokin);
}
.rl-pan--keep .rl-pan__glyph {
  background: #b79cf0;
}
.rl-pan__tag {
  font-family: var(--font-hud);
  font-size: 0.56rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  margin-left: auto;
}
.rl-pan--crack .rl-pan__tag {
  color: var(--energy-hi);
}
.rl-pan--sell .rl-pan__tag {
  color: var(--gold-ink);
}
.rl-pan--keep .rl-pan__tag {
  color: #b79cf0;
}
.rl-pan__v {
  font-family: var(--font-display);
  font-size: 1.7rem;
  line-height: 1.1;
  margin-top: 8px;
  color: var(--ink);
  font-variant-numeric: tabular-nums;
}
.rl-pan__v--word {
  font-size: 1.5rem;
}
.rl-pan__v small {
  font-family: var(--font-hud);
  font-size: 0.9rem;
  color: var(--ink-dim);
  margin-left: 2px;
}
.rl-pan__note {
  font-size: 0.72rem;
  color: var(--ink-faint, #626884);
  margin-top: 6px;
  line-height: 1.4;
}
.rl-pan--crack.win {
  border-color: rgba(53, 214, 208, 0.4);
  background: rgba(53, 214, 208, 0.06);
}
.rl-pan--crack.win .rl-pan__v {
  color: var(--energy-hi);
}
.rl-pan--sell.win {
  border-color: var(--orokin-line);
  background: rgba(200, 168, 92, 0.07);
}
.rl-pan--sell.win .rl-pan__v {
  color: var(--gold-ink);
}
.rl-pan--keep.win {
  border-color: rgba(159, 122, 234, 0.4);
  background: rgba(159, 122, 234, 0.12);
}
.rl-pan--keep.win .rl-pan__v {
  color: #b79cf0;
}

/* Bid-inflation flag */
.rl-flag {
  margin: 12px 26px 0;
  font-family: var(--font-hud);
  font-size: 0.78rem;
  color: var(--gold-ink);
  background: rgba(200, 168, 92, 0.06);
  border: 1px solid var(--orokin-dim);
  border-left: 2px solid var(--orokin);
  padding: 9px 14px;
  line-height: 1.45;
}

/* Section frame */
.rl-sec {
  padding: 26px 26px 0;
}
.rl-sec__head {
  display: flex;
  align-items: baseline;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 4px;
}
.rl-sec__title {
  font-family: var(--font-hud);
  text-transform: uppercase;
  letter-spacing: 0.16em;
  font-size: 0.82rem;
  color: var(--orokin);
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 9px;
}
.rl-sec__title::before {
  content: '';
  width: 6px;
  height: 6px;
  background: var(--orokin);
  transform: rotate(45deg);
}
.rl-sec__hint {
  font-size: 0.74rem;
  color: var(--ink-faint, #626884);
}

/* Odds & payout */
.rl-legend {
  display: flex;
  gap: 8px 18px;
  flex-wrap: wrap;
  align-items: center;
  font-size: 0.7rem;
  color: var(--ink-dim);
  padding: 14px 0 12px;
  border-bottom: 1px solid var(--line);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}
.rl-lg {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.rl-lg i {
  width: 8px;
  height: 8px;
  transform: rotate(45deg);
}
.rl-lg--muted {
  color: var(--ink-faint, #626884);
  letter-spacing: 0.04em;
}
.rl-drops {
  list-style: none;
  padding: 0;
  margin: 0;
}
.rl-drop {
  display: grid;
  grid-template-columns: 34px minmax(150px, 1.4fr) 92px 1.6fr 82px 34px;
  align-items: center;
  gap: 14px;
  padding: 13px 6px;
  position: relative;
  border-bottom: 1px solid var(--line);
}
.rl-drop::before {
  content: '';
  position: absolute;
  left: 0;
  top: 8px;
  bottom: 8px;
  width: 3px;
}
.rl-drop.r-rare::before {
  background: #e7cf95;
}
.rl-drop.r-uncommon::before {
  background: #b6c0cc;
}
.rl-drop.r-common::before {
  background: #c08457;
}
.rl-drop:hover {
  background: rgba(200, 168, 92, 0.035);
}
.rl-drop.is-forma {
  opacity: 0.72;
}
.rl-drop__node {
  position: relative;
  width: 32px;
  height: 32px;
  display: grid;
  place-items: center;
  border: 1px solid var(--orokin-dim);
  background: rgba(0, 0, 0, 0.35);
  clip-path: polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px);
}
.rl-drop__node img {
  position: relative;
  z-index: 1;
  width: 26px;
  height: 26px;
  object-fit: contain;
}
.rl-drop__diamond {
  position: absolute;
  width: 10px;
  height: 10px;
  transform: rotate(45deg);
  z-index: 0;
}
.rl-drop__name {
  min-width: 0;
}
.rl-drop__name a {
  font-weight: 600;
  font-size: 0.95rem;
  color: #dfe3f0;
  text-decoration: none;
}
.rl-drop__name a:hover {
  color: var(--energy-hi);
  text-decoration: underline;
}
.rl-plain {
  color: var(--ink-dim);
  font-weight: 600;
  font-size: 0.95rem;
}
.rl-drop__sub {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 3px;
  font-size: 0.72rem;
  color: var(--ink-dim);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.rl-rar {
  font-weight: 600;
}
.r-rare .rl-rar {
  color: #e7cf95;
}
.r-uncommon .rl-rar {
  color: #b6c0cc;
}
.r-common .rl-rar {
  color: #c08457;
}
.rl-vtag {
  font-size: 0.56rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: #c2c8dc;
  background: rgba(138, 143, 163, 0.16);
  border: 1px solid rgba(138, 143, 163, 0.4);
  border-radius: 3px;
  padding: 0 5px;
}
.rl-vtag--forma {
  color: var(--energy);
  border-color: rgba(53, 214, 208, 0.4);
  background: rgba(53, 214, 208, 0.06);
}
.rl-drop__chance {
  text-align: right;
}
.rl-big {
  font-family: var(--font-hud);
  font-weight: 700;
  font-size: 1.15rem;
  color: var(--ink);
  font-variant-numeric: tabular-nums;
}
.r-rare .rl-big {
  color: #e7cf95;
}
.rl-big span {
  font-size: 0.72rem;
  color: var(--ink-dim);
}
.rl-alt {
  font-size: 0.62rem;
  color: var(--ink-faint, #626884);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-variant-numeric: tabular-nums;
}
.rl-drop__bar {
  min-width: 0;
}
.rl-bar-track {
  height: 10px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--line);
  overflow: hidden;
}
.rl-bar-fill {
  height: 100%;
  width: 0;
  transition: width 0.5s cubic-bezier(0.22, 1, 0.36, 1);
}
.r-rare .rl-bar-fill {
  background: linear-gradient(90deg, rgba(231, 207, 149, 0.55), #e7cf95);
}
.r-uncommon .rl-bar-fill {
  background: linear-gradient(90deg, rgba(182, 192, 204, 0.5), #b6c0cc);
}
.r-common .rl-bar-fill {
  background: linear-gradient(90deg, rgba(192, 132, 87, 0.5), #c08457);
}
.rl-bar-cap {
  display: flex;
  justify-content: space-between;
  margin-top: 5px;
  font-size: 0.66rem;
  color: var(--ink-faint, #626884);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.rl-bar-cap b {
  color: var(--ink-dim);
  font-variant-numeric: tabular-nums;
}
.rl-drop__val {
  text-align: right;
}
.rl-p {
  font-family: var(--font-hud);
  font-weight: 600;
  font-size: 0.98rem;
  color: var(--ink);
  font-variant-numeric: tabular-nums;
}
.rl-v {
  font-size: 0.64rem;
  color: var(--ink-faint, #626884);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.rl-v.is-thin {
  color: var(--rose);
}
.rl-drop__drops {
  flex: none;
  color: var(--energy);
  background: transparent;
  border: 1px solid rgba(53, 214, 208, 0.3);
  border-radius: 6px;
  width: 30px;
  height: 30px;
  display: grid;
  place-items: center;
  cursor: pointer;
  transition: color 0.15s, border-color 0.15s, background 0.15s;
}
.rl-drop__drops:hover {
  color: var(--gold-ink);
  border-color: rgba(212, 175, 90, 0.5);
  background: rgba(212, 175, 90, 0.08);
}
.rl-drop__drops:focus-visible {
  outline: 2px solid var(--energy);
  outline-offset: 2px;
}
.rl-odds-foot {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  padding: 14px 6px 0;
  flex-wrap: wrap;
  gap: 6px 16px;
}
.rl-odds-foot__k {
  font-family: var(--font-hud);
  text-transform: uppercase;
  letter-spacing: 0.12em;
  font-size: 0.72rem;
  color: var(--ink-dim);
}
.rl-totals {
  display: flex;
  gap: 22px;
  flex-wrap: wrap;
}
.rl-t {
  text-align: right;
}
.rl-t__lbl {
  font-size: 0.62rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--ink-faint, #626884);
}
.rl-t__num {
  font-family: var(--font-display);
  font-size: 1.15rem;
  color: var(--gold-ink);
  font-variant-numeric: tabular-nums;
}
.rl-t--raw .rl-t__num {
  color: var(--ink-dim);
}

/* Market book */
.rl-book {
  margin-top: 14px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 1px;
  background: var(--line);
  border: 1px solid var(--line);
}
.rl-cell {
  background: var(--voidglass);
  padding: 14px 16px;
}
.rl-cell__k {
  font-family: var(--font-hud);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  font-size: 0.62rem;
  color: var(--ink-dim);
}
.rl-cell__v {
  font-family: var(--font-hud);
  font-weight: 600;
  font-size: 1.25rem;
  color: var(--ink);
  margin-top: 4px;
  font-variant-numeric: tabular-nums;
}
.rl-cell--hi .rl-cell__v {
  color: var(--gold-ink);
}
.rl-cell__v small {
  font-size: 0.7rem;
  color: var(--ink-dim);
}
.rl-cell__sub {
  font-size: 0.62rem;
  color: var(--ink-faint, #626884);
  margin-top: 2px;
}
.rl-cell__sub.is-warn {
  color: var(--gold-ink);
}

/* References */
.rl-refs {
  margin-top: 14px;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}
.rl-ref {
  display: inline-flex;
  align-items: center;
  gap: 9px;
  padding: 10px 15px;
  border: 1px solid var(--line);
  background: rgba(255, 255, 255, 0.015);
  color: var(--ink-dim);
  text-decoration: none;
  font-family: var(--font-hud);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 0.76rem;
  font-weight: 600;
  transition: color 0.15s, border-color 0.15s, background 0.15s;
}
.rl-ref:hover {
  color: var(--energy-hi);
  border-color: rgba(53, 214, 208, 0.4);
  background: rgba(53, 214, 208, 0.04);
}
.rl-ref__ico {
  width: 13px;
  height: 13px;
  transform: rotate(45deg);
  flex: none;
  background: var(--orokin);
}
.rl-ref:hover .rl-ref__ico {
  background: var(--energy);
}
.rl-ref__arw {
  margin-left: 2px;
  color: var(--ink-faint, #626884);
  font-size: 0.8rem;
}

.rl-disclaimer {
  margin: 22px 26px 24px;
}

/* Donation */
.rl-donate {
  max-width: 1080px;
  margin: 18px auto 0;
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px 20px;
  flex-wrap: wrap;
}
.rl-donate__lbl {
  font-family: var(--font-hud);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  font-size: 0.72rem;
  color: var(--ink-dim);
}
.rl-donate__logo {
  display: inline-flex;
  line-height: 0;
  transition: transform 0.15s ease, filter 0.15s ease;
}
.rl-donate__logo img {
  width: 44px;
  height: 44px;
  object-fit: contain;
  border-radius: 6px;
}
.rl-donate__logo:hover {
  transform: translateY(-2px);
  filter: brightness(1.12);
}
.rl-donate__logo:focus-visible {
  outline: 2px solid var(--energy);
  outline-offset: 2px;
}

@media (max-width: 760px) {
  .rl-hero {
    grid-template-columns: 1fr;
  }
  .rl-ledger {
    grid-template-columns: 1fr;
  }
  .rl-drop {
    grid-template-columns: 32px 1fr 74px 34px;
    row-gap: 10px;
  }
  .rl-drop__bar {
    grid-column: 1 / -1;
    order: 5;
  }
  .rl-drop__val {
    grid-column: 2 / 4;
    text-align: left;
  }
}

@media (prefers-reduced-motion: reduce) {
  .rl-bar-fill {
    transition: none;
  }
}
</style>
