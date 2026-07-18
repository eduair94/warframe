<!-- /circuit — "Circuit & Incarnon rotation this week". The Duviri Circuit resets
     every Monday 00:00 UTC; this page computes the active Warframe + Incarnon
     Genesis rotation from the clock (data/circuit.ts) so it updates passively,
     and cross-checks the live worldState API (warframestat.us) to self-correct
     the highlighted week if Digital Extremes shifts a pool. The full rotation
     schedules render server-side (SEO) with THIS WEEK highlighted; only the live
     countdown is client-side. -->
<template>
  <div class="an cir">
    <div class="an-console">
      <header class="an-hero">
        <div class="an-hero__text">
          <div class="an-eyebrow">{{ t('circuit.eyebrow') }}</div>
          <h1 class="an-title">{{ t('circuit.title') }}</h1>
          <p class="an-lede">{{ t('circuit.lede') }}</p>
          <div class="cir-reset">
            <span class="cir-reset__lbl">{{ t('circuit.resets') }}</span>
            <span class="cir-reset__date">{{ resetDate }}</span>
            <client-only>
              <span v-if="countdown" class="cir-reset__in">· {{ countdown }}</span>
            </client-only>
          </div>
        </div>
      </header>

      <!-- This week -->
      <section class="cir-now">
        <div class="cir-now__col">
          <div class="cir-now__h">
            <span class="cir-now__tag cir-now__tag--sp">{{ t('circuit.steelPath') }}</span>
            {{ t('circuit.incarnonThisWeek') }}
            <span class="cir-now__group">{{ t('circuit.group', { g: nowState_group }) }}</span>
          </div>
          <div class="cir-chips">
            <span v-for="w in incarnonsNow" :key="w" class="cir-chip cir-chip--sp">{{ w }}</span>
          </div>
          <p class="cir-now__note">{{ t('circuit.incarnonNote') }}</p>
        </div>
        <div class="cir-now__col">
          <div class="cir-now__h">
            <span class="cir-now__tag">{{ t('circuit.normal') }}</span>
            {{ t('circuit.warframesThisWeek') }}
          </div>
          <div class="cir-chips">
            <span v-for="f in warframesNow" :key="f" class="cir-chip">{{ f }}</span>
          </div>
          <p class="cir-now__note">{{ t('circuit.warframeNote') }}</p>
        </div>
      </section>

      <!-- Incarnon full rotation -->
      <section class="cir-sec">
        <h2 class="cir-sec__title">{{ t('circuit.incarnonScheduleTitle') }}</h2>
        <p class="cir-sec__sub">{{ t('circuit.incarnonScheduleSub') }}</p>
        <div class="an-tablewrap">
          <table class="an-table cir-table">
            <thead>
              <tr>
                <th>{{ t('circuit.col.group') }}</th>
                <th>{{ t('circuit.col.weapons') }}</th>
                <th>{{ t('circuit.col.when') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(grp, i) in INCARNON_ROTATION" :key="i" :class="{ 'is-now': i === hardIdx }">
                <td class="cir-grp">{{ INCARNON_GROUP_LABELS[i] }}</td>
                <td>
                  <span v-for="w in grp" :key="w" class="cir-inline">{{ w }}</span>
                </td>
                <td class="cir-when">{{ whenLabel(i, hardIdx, INCARNON_ROTATION.length) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- Warframe full rotation -->
      <section class="cir-sec">
        <h2 class="cir-sec__title">{{ t('circuit.warframeScheduleTitle') }}</h2>
        <p class="cir-sec__sub">{{ t('circuit.warframeScheduleSub') }}</p>
        <div class="an-tablewrap">
          <table class="an-table cir-table">
            <thead>
              <tr>
                <th>{{ t('circuit.col.week') }}</th>
                <th>{{ t('circuit.col.warframes') }}</th>
                <th>{{ t('circuit.col.when') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(wk, i) in NORMAL_ROTATION" :key="i" :class="{ 'is-now': i === normalIdx }">
                <td class="cir-grp">{{ i + 1 }}</td>
                <td>
                  <span v-for="f in wk" :key="f" class="cir-inline">{{ f }}</span>
                </td>
                <td class="cir-when">{{ whenLabel(i, normalIdx, NORMAL_ROTATION.length) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section class="cir-sec cir-sec--links">
        <NuxtLink class="cir-link" :to="localePath('/guides/duviri')">{{ t('circuit.duviriGuide') }} →</NuxtLink>
        <NuxtLink class="cir-link" :to="localePath('/guides/steel-path')">{{ t('circuit.steelPathGuide') }} →</NuxtLink>
      </section>

      <v-alert class="an-disclaimer bg-blue-darken-4" type="info" density="compact">
        {{ t('circuit.disclaimer') }}
      </v-alert>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import {
  NORMAL_ROTATION,
  INCARNON_ROTATION,
  INCARNON_GROUP_LABELS,
  circuitState,
  matchRotationIndex,
} from '~/data/circuit'

const { t, locale } = useI18n()
const localePath = useLocalePath()

// SSR-stable "now" (server value transfers to client → no hydration mismatch on
// the highlighted week). The live countdown uses a separate client-only tick.
const nowState = useState<number>('circuit-now', () => Date.now())
const state = computed(() => circuitState(nowState.value))

// Live worldState cross-check (self-corrects the highlight if DE shifts a pool).
// warframestat blocks bot fetches without a UA; server-side fetch with one works.
const { data: cycle } = await useAsyncData('circuit-duviri-cycle', () =>
  $fetch<any>('https://api.warframestat.us/pc/duviriCycle', {
    headers: {
      'user-agent':
        'Mozilla/5.0 (compatible; WarframeMarketAnalytics/1.0; +https://warframe-app.digitalshopuy.com)',
    },
    timeout: 4000,
  }).catch(() => null),
)
function apiChoices(key: string, cat: string): string[] | undefined {
  const arr = (cycle.value && cycle.value.choices) || []
  const found = arr.find((c: any) => c.categoryKey === key || c.category === cat)
  return found && Array.isArray(found.choices) ? found.choices : undefined
}
const apiNormalIdx = computed(() => matchRotationIndex(NORMAL_ROTATION, apiChoices('EXC_NORMAL', 'normal')))
const apiHardIdx = computed(() => matchRotationIndex(INCARNON_ROTATION, apiChoices('EXC_HARD', 'hard')))

// Prefer the live API index when it matched a known group; else the clock.
const normalIdx = computed(() => (apiNormalIdx.value >= 0 ? apiNormalIdx.value : state.value.normalIdx))
const hardIdx = computed(() => (apiHardIdx.value >= 0 ? apiHardIdx.value : state.value.hardIdx))

const warframesNow = computed(() => NORMAL_ROTATION[normalIdx.value])
const incarnonsNow = computed(() => INCARNON_ROTATION[hardIdx.value])
const nowState_group = computed(() => INCARNON_GROUP_LABELS[hardIdx.value])

const resetDate = computed(() => {
  const d = new Date(state.value.nextResetMs)
  try {
    return d.toLocaleDateString(locale.value === 'en' ? 'en-US' : locale.value, {
      weekday: 'long',
      day: 'numeric',
      month: 'short',
      timeZone: 'UTC',
    })
  } catch {
    return d.toUTCString().slice(0, 16)
  }
})

// "in N weeks" / "this week" / "next week" label per rotation row.
function whenLabel(i: number, current: number, len: number): string {
  const diff = ((i - current) % len + len) % len
  if (diff === 0) return t('circuit.when.now')
  if (diff === 1) return t('circuit.when.next')
  return t('circuit.when.inWeeks', { n: diff })
}

// Live countdown (client only — avoids SSR/hydration drift on the ticking text).
const tick = ref(0)
const mounted = ref(false)
let timer: ReturnType<typeof setInterval> | undefined
const countdown = computed(() => {
  if (!mounted.value) return ''
  let ms = state.value.nextResetMs - tick.value
  if (ms <= 0) return t('circuit.when.now')
  const d = Math.floor(ms / 86400000)
  ms -= d * 86400000
  const h = Math.floor(ms / 3600000)
  ms -= h * 3600000
  const m = Math.floor(ms / 60000)
  return t('circuit.countdown', { d, h, m })
})

// SEO: this page's title/description come from PAGE_SEO via the layout.

function finishLoading(attempt = 0) {
  nextTick(() => {
    const el = document.getElementById('spinner-wrapper')
    if (el) el.style.display = 'none'
    else if (attempt < 20) finishLoading(attempt + 1)
  })
}
onMounted(() => {
  mounted.value = true
  tick.value = Date.now()
  timer = setInterval(() => (tick.value = Date.now()), 30000)
  finishLoading()
})
onBeforeUnmount(() => {
  if (timer) clearInterval(timer)
})
</script>

<style scoped>
.cir-reset {
  margin-top: 16px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  font-family: 'Rajdhani', sans-serif;
}
.cir-reset__lbl {
  text-transform: uppercase;
  letter-spacing: 0.12em;
  font-size: 0.72rem;
  color: #9aa0b4;
}
.cir-reset__date {
  color: #e7cf95;
  font-weight: 700;
  letter-spacing: 0.02em;
}
.cir-reset__in {
  color: #35d6d0;
  font-weight: 600;
}

/* This-week cards */
.cir-now {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  padding: 8px 30px 18px;
}
.cir-now__col {
  background: linear-gradient(160deg, rgba(200, 168, 92, 0.07), rgba(0, 0, 0, 0.22));
  border: 1px solid rgba(200, 168, 92, 0.22);
  clip-path: polygon(13px 0, 100% 0, 100% calc(100% - 13px), calc(100% - 13px) 100%, 0 100%, 0 13px);
  padding: 16px 18px;
}
.cir-now__h {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  font-family: 'Cinzel', serif;
  color: #e7cf95;
  font-size: 1.05rem;
  margin-bottom: 12px;
}
.cir-now__tag {
  font-family: 'Rajdhani', sans-serif;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  font-size: 0.64rem;
  padding: 2px 8px;
  background: rgba(255, 255, 255, 0.08);
  color: #b6bcd0;
  clip-path: polygon(4px 0, 100% 0, 100% calc(100% - 4px), calc(100% - 4px) 100%, 0 100%, 0 4px);
}
.cir-now__tag--sp {
  background: rgba(217, 138, 138, 0.18);
  color: #e6a3a3;
}
.cir-now__group {
  margin-left: auto;
  font-family: 'Rajdhani', sans-serif;
  color: #9aa0b4;
  font-size: 0.82rem;
}
.cir-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.cir-chip {
  font-family: 'Rajdhani', sans-serif;
  font-weight: 600;
  font-size: 0.92rem;
  padding: 6px 12px;
  color: #eef1f8;
  background: rgba(53, 214, 208, 0.1);
  border: 1px solid rgba(53, 214, 208, 0.3);
  clip-path: polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px);
}
.cir-chip--sp {
  background: rgba(200, 168, 92, 0.12);
  border-color: rgba(200, 168, 92, 0.4);
  color: #f4e2b4;
}
.cir-now__note {
  color: #9aa0b4;
  font-size: 0.82rem;
  line-height: 1.5;
  margin: 12px 0 0;
}

/* Schedule tables */
.cir-sec {
  padding: 10px 30px 8px;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
}
.cir-sec__title {
  font-family: 'Cinzel', serif;
  font-size: 1.35rem;
  color: #e7cf95;
  margin: 20px 0 4px;
}
.cir-sec__sub {
  color: #9aa0b4;
  font-size: 0.9rem;
  margin: 0 0 14px;
  max-width: 72ch;
}
.cir-table .cir-grp {
  font-family: 'Rajdhani', sans-serif;
  font-weight: 700;
  color: #c8a85c;
  width: 64px;
}
.cir-inline {
  display: inline-block;
  margin: 2px 6px 2px 0;
  color: #dfe3f0;
}
.cir-inline:not(:last-child)::after {
  content: '·';
  color: #565b74;
  margin-left: 6px;
}
.cir-when {
  font-family: 'Rajdhani', sans-serif;
  color: #9aa0b4;
  white-space: nowrap;
}
.cir-table tr.is-now {
  background: rgba(53, 214, 208, 0.08) !important;
}
.cir-table tr.is-now .cir-grp {
  color: #35d6d0;
}
.cir-table tr.is-now .cir-when {
  color: #35d6d0;
  font-weight: 700;
}

.cir-sec--links {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  padding-top: 18px;
  padding-bottom: 6px;
}
.cir-link {
  font-family: 'Rajdhani', sans-serif;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  font-size: 0.86rem;
  color: #e7cf95;
  text-decoration: none;
}
.cir-link:hover {
  color: #f4e2b4;
}

@media (max-width: 640px) {
  .cir-now {
    grid-template-columns: 1fr;
    padding-left: 16px;
    padding-right: 16px;
  }
  .cir-sec {
    padding-left: 16px;
    padding-right: 16px;
  }
}
</style>
