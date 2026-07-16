<template>
  <div class="an eg">
    <article class="an-console">
      <!-- ───────────────────────── Hero ───────────────────────── -->
      <header class="an-hero">
        <div class="an-hero__text">
          <div class="an-eyebrow">{{ t('guideEndo.eyebrow') }}</div>
          <i18n-t keypath="guideEndo.hero.title" tag="h1" class="an-title">
            <template #cheapest><span class="accent-a">{{ t('guideEndo.hero.titleCheapest') }}</span></template>
            <template #platinum><span class="accent-b">{{ t('guideEndo.hero.titlePlatinum') }}</span></template>
          </i18n-t>
          <i18n-t keypath="guideEndo.hero.lede" tag="p" class="an-lede">
            <template #trash><strong>{{ t('guideEndo.hero.ledeTrash') }}</strong></template>
            <template #tool><NuxtLink class="eg-inline" to="/endo">{{ t('guideEndo.hero.toolName') }}</NuxtLink></template>
          </i18n-t>
        </div>
        <div class="an-hero__deal">
          <div class="an-hero__deal-label">{{ t('guideEndo.hero.dealLabel') }}</div>
          <div class="an-hero__deal-plat">
            {{ bestRiven ? fmt1(bestRiven.epp) : '300+' }}<span> {{ t('guideEndo.hero.dealUnit') }}</span>
          </div>
          <NuxtLink class="an-hero__deal-name" to="/endo">
            {{ bestRiven ? bestRiven.weapon : t('guideEndo.hero.dealFallbackName') }}
          </NuxtLink>
          <div class="an-hero__deal-sub">
            {{ bestRiven ? t('guideEndo.hero.dealSub', { rolls: bestRiven.rolls, endo: fmt(bestRiven.endo), buyout: fmt(bestRiven.buyout) }) : t('guideEndo.hero.dealSubFallback') }}
          </div>
        </div>
      </header>

      <!-- ───────────────────── Live proof strip ───────────────────── -->
      <div class="an-stats">
        <div class="an-stat">
          <div class="an-stat__num is-good">{{ bestRiven ? fmt1(bestRiven.epp) : '~300' }}</div>
          <div class="an-stat__lbl">{{ t('guideEndo.stats.bestRiven') }}</div>
        </div>
        <div class="an-stat">
          <div class="an-stat__num is-alt">{{ bestSculpture ? fmt1(bestSculpture.epp) : '~40' }}</div>
          <div class="an-stat__lbl">{{ t('guideEndo.stats.bestSculpture') }}</div>
        </div>
        <div class="an-stat">
          <div class="an-stat__num is-gold">{{ multiplier ? multiplier + '×' : '5–10×' }}</div>
          <div class="an-stat__lbl">{{ t('guideEndo.stats.moreEndo') }}</div>
        </div>
        <div class="an-stat">
          <div class="an-stat__num">+200</div>
          <div class="an-stat__lbl">{{ t('guideEndo.stats.perReroll') }}</div>
        </div>
      </div>

      <!-- ───────────────────────── TL;DR ───────────────────────── -->
      <section class="eg-tldr">
        <span class="eg-tldr__tag">{{ t('guideEndo.tldr.tag') }}</span>
        <i18n-t keypath="guideEndo.tldr.body" tag="span">
          <template #tool><NuxtLink class="eg-inline" to="/endo">{{ t('guideEndo.hero.toolName') }}</NuxtLink></template>
          <template #sortCol><b>Endo / Plat Sell</b></template>
        </i18n-t>
      </section>

      <!-- ─────────────────── Why rivens win ─────────────────── -->
      <section class="eg-section">
        <div class="eg-section__title">{{ t('guideEndo.why.title') }}</div>
        <p class="eg-p">{{ t('guideEndo.why.p1') }}</p>

        <div class="eg-formula">
          <div class="eg-formula__eq">
            Endo = 100 × (MR − 8) &nbsp;+&nbsp; ⌊22.5 × 2<sup>Rank</sup>⌋
            &nbsp;+&nbsp; <b>200 × Re-rolls</b> &nbsp;−&nbsp; 7
          </div>
          <ul class="eg-formula__legend">
            <i18n-t keypath="guideEndo.why.legendRerolls" tag="li">
              <template #term><b>{{ t('guideEndo.why.termRerolls') }}</b></template>
              <template #bonus><b>+200 Endo</b></template>
            </i18n-t>
            <i18n-t keypath="guideEndo.why.legendRank" tag="li">
              <template #term><b>{{ t('guideEndo.why.termRank') }}</b></template>
              <template #val><b>5,760 Endo</b></template>
            </i18n-t>
            <i18n-t keypath="guideEndo.why.legendMr" tag="li">
              <template #term><b>MR</b></template>
            </i18n-t>
          </ul>
        </div>

        <i18n-t keypath="guideEndo.why.p2" tag="p" class="eg-p">
          <template #payout><b>100×8 + 5,760 + 200×20 − 7 = 10,553 Endo</b></template>
          <template #endoCol><b>Endo</b></template>
        </i18n-t>
      </section>

      <!-- ─────────────────── Ayatan comparison ─────────────────── -->
      <section class="eg-section">
        <div class="eg-section__title">{{ t('guideEndo.ayatan.title') }}</div>
        <p class="eg-p">{{ t('guideEndo.ayatan.p') }}</p>
        <div class="an-tablewrap">
          <table class="an-table eg-table">
            <thead>
              <tr>
                <th class="col-name">{{ t('guideEndo.ayatan.thName') }}</th>
                <th>{{ t('guideEndo.ayatan.thEndo') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="s in sculptureRef" :key="s.name">
                <td class="col-name">{{ s.name }}</td>
                <td class="an-num an-strong">{{ fmt(s.endo) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p class="eg-note">{{ t('guideEndo.ayatan.note') }}</p>
      </section>

      <!-- ─────────────────── Step by step ─────────────────── -->
      <section class="eg-section">
        <div class="eg-section__title">{{ t('guideEndo.steps.title') }}</div>
        <ol class="eg-steps">
          <li>
            <div class="eg-step__h">{{ t('guideEndo.steps.s1h') }}</div>
            <i18n-t keypath="guideEndo.steps.s1p" tag="p">
              <template #page><NuxtLink class="eg-inline" to="/endo">{{ t('guideEndo.steps.s1pPageLink') }}</NuxtLink></template>
              <template #best><b>{{ t('guideEndo.steps.s1pBest') }}</b></template>
              <template #sculpture><b>{{ t('guideEndo.steps.s1pSculpture') }}</b></template>
            </i18n-t>
          </li>
          <li>
            <div class="eg-step__h">{{ t('guideEndo.steps.s2h') }}</div>
            <i18n-t keypath="guideEndo.steps.s2p" tag="p">
              <template #col><b>Endo / Plat Sell</b></template>
            </i18n-t>
          </li>
          <li>
            <div class="eg-step__h">{{ t('guideEndo.steps.s3h') }}</div>
            <i18n-t keypath="guideEndo.steps.s3p" tag="p">
              <template #rerolls><b>Re rolls</b></template>
              <template #buy><b>Buy</b></template>
            </i18n-t>
          </li>
          <li>
            <div class="eg-step__h">{{ t('guideEndo.steps.s4h') }}</div>
            <i18n-t keypath="guideEndo.steps.s4p" tag="p">
              <template #mods><b>Mods</b></template>
              <template #actions><b>{{ t('guideEndo.steps.menuActions') }}</b></template>
              <template #dissolve><b>{{ t('guideEndo.steps.menuDissolve') }}</b></template>
            </i18n-t>
          </li>
        </ol>
      </section>

      <!-- ─────────────────── Live worked example ─────────────────── -->
      <section v-if="bestRiven" class="eg-section">
        <div class="eg-section__title">{{ t('guideEndo.example.title') }}</div>
        <div class="eg-example">
          <div class="eg-example__side eg-example__side--win">
            <div class="eg-example__tag">{{ t('guideEndo.example.tagRiven') }}</div>
            <NuxtLink class="eg-example__name" to="/endo">{{ bestRiven.weapon }}<span v-if="bestRiven.name"> {{ bestRiven.name }}</span></NuxtLink>
            <div class="eg-example__big">{{ fmt1(bestRiven.epp) }}<span> {{ t('guideEndo.example.unit') }}</span></div>
            <div class="eg-example__meta">
              {{ t('guideEndo.example.metaRiven', { endo: fmt(bestRiven.endo), rolls: bestRiven.rolls, buyout: fmt(bestRiven.buyout) }) }}
            </div>
          </div>
          <div class="eg-example__vs">{{ t('guideEndo.example.vs') }}</div>
          <div class="eg-example__side">
            <div class="eg-example__tag">{{ t('guideEndo.example.tagAyatan') }}</div>
            <div class="eg-example__name">{{ bestSculpture ? bestSculpture.name : t('guideEndo.example.sculptureFallbackName') }}</div>
            <div class="eg-example__big eg-example__big--dim">{{ bestSculpture ? fmt1(bestSculpture.epp) : '~40' }}<span> {{ t('guideEndo.example.unit') }}</span></div>
            <div class="eg-example__meta">
              {{ bestSculpture ? t('guideEndo.example.metaSculpture', { endo: fmt(bestSculpture.endo), sell: fmt(bestSculpture.sell) }) : t('guideEndo.example.sculptureFallbackMeta') }}
            </div>
          </div>
        </div>
        <i18n-t v-if="multiplier" keypath="guideEndo.example.punch" tag="p" class="eg-punch">
          <template #mult><b>{{ multiplier }}×</b></template>
        </i18n-t>
      </section>

      <!-- ───────────────────────── CTA ───────────────────────── -->
      <div class="eg-cta">
        <NuxtLink class="eg-cta__btn" to="/endo">
          {{ t('guideEndo.cta') }}
        </NuxtLink>
      </div>
    </article>

    <v-alert class="an-disclaimer bg-blue-darken-4" type="info" density="compact">
      <i18n-t keypath="guideEndo.disclaimer.body" tag="span">
        <template #table><NuxtLink class="eg-inline" to="/endo">{{ t('guideEndo.disclaimer.tableLink') }}</NuxtLink></template>
      </i18n-t>
    </v-alert>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted } from 'vue'

const { t } = useI18n()
const base = useApiBase()
const store = useItemsStore()

// Fully-socketed (Amber + Cyan) Endo values — same constants the /endo tool uses,
// so this guide and the live table always agree.
const sculptures: Record<string, number> = {
  anasa: 3450,
  ayr: 1425,
  hemakara: 2600,
  kitha: 3000,
  orta: 2700,
  piv: 1725,
  sah: 1500,
  valana: 1575,
  vaya: 1800,
  zambuka: 2600,
}

// Static reference table (highest-value first) for the comparison section.
const sculptureRef = [
  { name: 'Anasa', endo: 3450 },
  { name: 'Kitha', endo: 3000 },
  { name: 'Orta', endo: 2700 },
  { name: 'Hemakara', endo: 2600 },
  { name: 'Zambuka', endo: 2600 },
  { name: 'Vaya', endo: 1800 },
  { name: 'Piv', endo: 1725 },
  { name: 'Valana', endo: 1575 },
  { name: 'Sah', endo: 1500 },
  { name: 'Ayr', endo: 1425 },
]

// ---- Live best riven deal (same endpoint the /endo table uses) ----
const { data: rivenData } = await useAsyncData('endo-guide-rivens', () =>
  $fetch<any[]>(`${base}/rivens`).catch(() => []),
)
const bestRiven = computed(() => {
  const arr = Array.isArray(rivenData.value) ? rivenData.value : []
  const rows = arr
    .map((r: any) => {
      const it = r?.items || {}
      const buyout = Number(it.buyout_price) || 0
      const endo = Number(it.endo) || 0
      const epp = Number(it.endoPerPlat) || (buyout ? endo / buyout : 0)
      return {
        id: it.id,
        weapon: r?.item_name || '',
        name: it?.item?.name || '',
        rolls: Number(it?.item?.re_rolls) || 0,
        buyout,
        endo,
        epp,
      }
    })
    .filter((r) => r.epp > 0 && r.buyout > 0 && r.endo > 0)
  if (!rows.length) return null
  return rows.reduce((a, b) => (a.epp > b.epp ? a : b))
})

// ---- Live best sculpture deal (mirrors /endo's loadItems maths) ----
const bestSculpture = computed(() => {
  const rows = (store.allItems || [])
    .filter((el: any) => el.item_name && el.item_name.includes('Sculpture'))
    .map((el: any) => {
      const key = (el.url_name || '').split('_')[1] ?? ''
      const endo = sculptures[key] ?? 0
      const sell = Number(el?.market?.sell) || 0
      return { name: el.item_name.replace(' Sculpture', ''), endo, sell, epp: sell ? endo / sell : 0 }
    })
    .filter((r: any) => r.epp > 0)
  if (!rows.length) return null
  return rows.reduce((a: any, b: any) => (a.epp > b.epp ? a : b))
})

const multiplier = computed(() => {
  if (!bestRiven.value || !bestSculpture.value || !bestSculpture.value.epp) return 0
  return Math.round((bestRiven.value.epp / bestSculpture.value.epp) * 10) / 10
})

function fmt(n: number): string {
  return Math.round(Number(n) || 0).toLocaleString('en-US')
}
function fmt1(n: number): string {
  return (Math.round((Number(n) || 0) * 10) / 10).toLocaleString('en-US')
}

// Project rule: hide the global loading spinner once mounted (bounded retry).
function finishLoading(attempt = 0) {
  nextTick(() => {
    const el = document.getElementById('spinner-wrapper')
    if (el) el.style.display = 'none'
    else if (attempt < 20) finishLoading(attempt + 1)
  })
}
onMounted(() => {
  finishLoading()
})
</script>

<style scoped>
.eg-inline {
  color: var(--gold-ink);
  text-decoration: none;
  border-bottom: 1px solid rgba(200, 168, 92, 0.4);
}
.eg-inline:hover {
  color: #f4e2b4;
}

/* ---- Prose sections --------------------------------------------------- */
.eg-section {
  padding: 8px 30px 22px;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
}
.eg-section__title {
  font-family: var(--font-display);
  font-size: 1.28rem;
  color: var(--gold-ink);
  margin: 22px 0 12px;
  letter-spacing: 0.01em;
}
.eg-p {
  color: #cdd2e4;
  line-height: 1.68;
  font-size: 0.97rem;
  margin: 0 0 14px;
  max-width: 74ch;
}
.eg-p b,
.eg-punch b {
  color: var(--gold-ink);
  font-weight: 700;
}
.eg-note {
  color: var(--ink-dim);
  font-family: var(--font-hud);
  font-size: 0.84rem;
  letter-spacing: 0.02em;
  margin: 10px 0 0;
  max-width: 74ch;
}

/* ---- TL;DR callout ---------------------------------------------------- */
.eg-tldr {
  margin: 22px 30px 4px;
  padding: 16px 20px;
  background: rgba(53, 214, 208, 0.08);
  border: 1px solid rgba(53, 214, 208, 0.32);
  clip-path: polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px);
  color: #d7e6ea;
  line-height: 1.62;
  font-size: 0.95rem;
}
.eg-tldr__tag {
  display: inline-block;
  font-family: var(--font-hud);
  font-weight: 700;
  letter-spacing: 0.14em;
  color: var(--energy);
  font-size: 0.72rem;
  margin-right: 10px;
  vertical-align: middle;
}
.eg-tldr b {
  color: var(--energy-hi);
}

/* ---- Formula box ------------------------------------------------------ */
.eg-formula {
  margin: 6px 0 16px;
  background: rgba(0, 0, 0, 0.28);
  border: 1px solid var(--orokin-line);
  clip-path: polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px);
  padding: 18px 20px;
}
.eg-formula__eq {
  font-family: var(--font-hud);
  font-size: 1.02rem;
  color: var(--ink);
  letter-spacing: 0.02em;
  text-align: left;
  padding: 6px 0 14px;
  border-bottom: 1px solid var(--line);
  overflow-x: auto;
}
.eg-formula__eq b {
  color: var(--energy);
}
.eg-formula__legend {
  list-style: none;
  padding: 0;
  margin: 14px 0 0;
  display: flex;
  flex-direction: column;
  gap: 9px;
}
.eg-formula__legend li {
  position: relative;
  padding-left: 18px;
  color: #cdd2e4;
  font-size: 0.9rem;
  line-height: 1.55;
}
.eg-formula__legend li::before {
  content: '';
  position: absolute;
  left: 2px;
  top: 8px;
  width: 6px;
  height: 6px;
  background: var(--orokin);
  transform: rotate(45deg);
}
.eg-formula__legend b {
  color: var(--gold-ink);
}

/* ---- Comparison table (reuses .an-table) ------------------------------ */
.eg-table {
  min-width: 0;
  max-width: 460px;
}

/* ---- Steps ------------------------------------------------------------ */
.eg-steps {
  list-style: none;
  counter-reset: eg;
  padding: 0;
  margin: 6px 0 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.eg-steps li {
  counter-increment: eg;
  position: relative;
  padding: 2px 0 0 54px;
  min-height: 40px;
}
.eg-steps li::before {
  content: counter(eg);
  position: absolute;
  left: 0;
  top: 0;
  width: 38px;
  height: 38px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-hud);
  font-weight: 700;
  font-size: 1.1rem;
  color: #17130a;
  background: var(--orokin);
  clip-path: polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px);
}
.eg-step__h {
  font-family: var(--font-hud);
  font-weight: 700;
  letter-spacing: 0.04em;
  color: var(--gold-ink);
  font-size: 1rem;
  margin-bottom: 4px;
  padding-top: 6px;
}
.eg-steps p {
  color: #cdd2e4;
  line-height: 1.6;
  font-size: 0.93rem;
  margin: 0;
  max-width: 70ch;
}
.eg-steps b {
  color: var(--gold-ink);
  font-weight: 600;
}

/* ---- Live worked example --------------------------------------------- */
.eg-example {
  display: flex;
  align-items: stretch;
  gap: 14px;
  flex-wrap: wrap;
  margin-top: 4px;
}
.eg-example__side {
  flex: 1 1 240px;
  background: rgba(0, 0, 0, 0.25);
  border: 1px solid var(--line);
  clip-path: polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px);
  padding: 16px 18px;
}
.eg-example__side--win {
  border-color: var(--orokin-line);
  background: linear-gradient(160deg, rgba(200, 168, 92, 0.1), rgba(0, 0, 0, 0.25));
}
.eg-example__tag {
  font-family: var(--font-hud);
  text-transform: uppercase;
  letter-spacing: 0.14em;
  font-size: 0.66rem;
  color: var(--ink-dim);
  margin-bottom: 8px;
}
.eg-example__name {
  display: block;
  font-family: var(--font-display);
  color: var(--ink) !important;
  font-weight: 600;
  text-decoration: none;
  font-size: 1.04rem;
  margin-bottom: 8px;
}
a.eg-example__name:hover {
  color: var(--gold-ink) !important;
}
.eg-example__big {
  font-family: var(--font-hud);
  font-weight: 700;
  font-size: 2.1rem;
  line-height: 1;
  color: var(--energy);
  font-variant-numeric: tabular-nums;
}
.eg-example__big--dim {
  color: var(--ink-dim);
}
.eg-example__big span {
  font-size: 0.9rem;
  opacity: 0.7;
}
.eg-example__meta {
  font-family: var(--font-hud);
  color: var(--ink-dim);
  font-size: 0.78rem;
  letter-spacing: 0.02em;
  margin-top: 6px;
}
.eg-example__vs {
  align-self: center;
  font-family: var(--font-display);
  color: var(--ink-dim);
  font-size: 1.1rem;
}
.eg-punch {
  margin: 16px 0 0;
  font-size: 1.02rem;
  color: #cdd2e4;
}

/* ---- CTA -------------------------------------------------------------- */
.eg-cta {
  padding: 10px 30px 34px;
}
.eg-cta__btn {
  display: inline-flex;
  align-items: center;
  font-family: var(--font-hud);
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  font-size: 0.92rem;
  color: #17130a;
  background: var(--orokin);
  text-decoration: none;
  padding: 13px 24px;
  clip-path: polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px);
  transition: background 0.15s ease;
}
.eg-cta__btn:hover {
  background: var(--gold-ink);
}

@media (max-width: 600px) {
  .eg-section,
  .eg-cta {
    padding-left: 18px;
    padding-right: 18px;
  }
  .eg-tldr {
    margin-left: 18px;
    margin-right: 18px;
  }
  .eg-example__vs {
    width: 100%;
    text-align: center;
  }
}
</style>
