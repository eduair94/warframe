<template>
  <div class="an go">
    <client-only>
      <template #fallback>
        <!-- Goals live in localStorage, so the server has nothing player-specific
             to render. Ship the static explainer instead of an empty console (and
             never a skeleton crawlers would index as thin). -->
        <div class="an-console">
          <header class="an-hero">
            <div class="an-hero__text">
              <div class="an-eyebrow">{{ t('goals.eyebrow') }}</div>
              <i18n-t keypath="goals.hero.title" tag="h1" class="an-title">
                <template #sets><span class="accent-b">{{ t('goals.hero.titleSets') }}</span></template>
                <template #plan><span class="accent-a">{{ t('goals.hero.titlePlan') }}</span></template>
              </i18n-t>
              <p class="an-lede">{{ t('goals.hero.lede') }}</p>
            </div>
          </header>
          <div class="an-empty">{{ t('goals.fallback') }}</div>
        </div>
      </template>

      <div class="an-console">
        <!-- Hero -->
        <header class="an-hero">
          <div class="an-hero__text">
            <div class="an-eyebrow">{{ t('goals.eyebrow') }}</div>
            <i18n-t keypath="goals.hero.title" tag="h1" class="an-title">
              <template #sets><span class="accent-b">{{ t('goals.hero.titleSets') }}</span></template>
              <template #plan><span class="accent-a">{{ t('goals.hero.titlePlan') }}</span></template>
            </i18n-t>
            <p class="an-lede">{{ t('goals.hero.lede') }}</p>
            <p v-if="!auth.signedIn" class="go-sync">
              {{ t('goals.syncCta') }}
              <nuxt-link :to="localePath('/account')" @click="trackAction('goals_sync_cta')">{{ t('goals.syncCtaLink') }} →</nuxt-link>
            </p>
          </div>
          <div v-if="closest" class="an-hero__deal">
            <div class="an-hero__deal-label">{{ t('goals.hero.dealLabel') }}</div>
            <div class="an-hero__deal-plat">{{ closest.pct }}<span>%</span></div>
            <nuxt-link class="an-hero__deal-name" :to="localePath('/set/' + closest.goal.url_name)">
              {{ closest.name }} →
            </nuxt-link>
            <div class="an-hero__deal-sub">
              {{ t('goals.hero.dealSub', { n: closest.missingUnits }, closest.missingUnits) }}
            </div>
          </div>
        </header>

        <!-- Stats -->
        <div class="an-stats">
          <div class="an-stat">
            <div class="an-stat__num">{{ stats.active }}</div>
            <div class="an-stat__lbl">{{ t('goals.stats.active') }}</div>
          </div>
          <div class="an-stat">
            <div class="an-stat__num">{{ stats.partsNeeded.toLocaleString() }}</div>
            <div class="an-stat__lbl">{{ t('goals.stats.parts') }}</div>
          </div>
          <div class="an-stat">
            <div class="an-stat__num is-alt">{{ fmtPlat(stats.platToFinish) }}p</div>
            <div class="an-stat__lbl">{{ t('goals.stats.plat') }}</div>
          </div>
          <div class="an-stat">
            <div class="an-stat__num is-good">{{ stats.done }}</div>
            <div class="an-stat__lbl">{{ t('goals.stats.done') }}</div>
          </div>
        </div>

        <!-- Goal picker -->
        <section class="an-filters">
          <div class="an-filters__row">
            <v-autocomplete
              v-model="picker"
              :items="pickerItems"
              item-title="name"
              item-value="url_name"
              return-object
              density="compact"
              hide-details
              auto-select-first
              clearable
              prepend-inner-icon="mdi-target"
              :label="t('goals.picker.label')"
              :no-data-text="t('goals.picker.noMatches')"
              :menu-props="{ maxHeight: 360 }"
              class="an-search go-picker"
              @update:model-value="onPick"
            >
              <template #item="{ props: itemProps, item }">
                <v-list-item v-bind="itemProps" :title="item.raw.name">
                  <template #prepend>
                    <v-avatar size="28" rounded="0">
                      <v-img :src="itemThumb({ urlName: item.raw.url_name, itemName: item.raw.item_name, thumb: item.raw.thumb })" />
                    </v-avatar>
                  </template>
                </v-list-item>
              </template>
            </v-autocomplete>
          </div>
        </section>

        <!-- Empty state -->
        <div v-if="!activePlans.length && !doneGoals.length" class="an-empty go-empty">
          <div class="go-empty__title">{{ t('goals.empty.title') }}</div>
          <p class="go-empty__text">{{ t('goals.empty.text') }}</p>
          <div class="go-empty__lbl">{{ t('goals.empty.suggest') }}</div>
          <div class="go-empty__sug">
            <button v-for="s in suggestions" :key="s.url_name" class="go-sug" @click="addGoalFor(s, 'suggestion')">
              <img class="go-sug__thumb" :src="s.thumbUrl" :alt="s.name" loading="lazy" />
              <span>{{ s.name }}</span>
            </button>
          </div>
        </div>

        <!-- Active goals -->
        <div v-else class="go-list">
          <section v-for="plan in activePlans" :key="plan.goal.id" class="go-goal">
            <header class="go-goal__head">
              <img class="an-thumb go-goal__thumb" :src="plan.thumb" :alt="plan.name" loading="lazy" />
              <div class="go-goal__title">
                <nuxt-link class="go-goal__name" :to="localePath('/set/' + plan.goal.url_name)">{{ plan.name }}</nuxt-link>
                <div class="go-bar" :class="{ 'is-full': plan.pct >= 100 }">
                  <i :style="{ width: plan.pct + '%' }"></i>
                </div>
                <div class="go-goal__meta">
                  <b>{{ plan.pct }}%</b>
                  <span v-if="!plan.loading && !plan.error">{{ t('goals.goal.progress', { owned: plan.ownedParts, total: plan.requiredParts }) }}</span>
                </div>
              </div>
              <div class="go-goal__acts">
                <button class="go-icon" :title="t('goals.goal.markDone')" :aria-label="t('goals.goal.markDone')" @click="markDone(plan.goal)">
                  <v-icon size="18">mdi-check</v-icon>
                </button>
                <button class="go-icon go-icon--danger" :title="t('goals.goal.remove')" :aria-label="t('goals.goal.remove')" @click="removeGoal(plan.goal)">
                  <v-icon size="18">mdi-close</v-icon>
                </button>
              </div>
            </header>

            <!-- Per-goal load state: shimmer, never a spinner (the page itself is live) -->
            <div v-if="plan.loading" class="go-skel">
              <div class="go-skel__lbl">{{ t('goals.goal.loading') }}</div>
              <div v-for="n in 4" :key="n" class="go-skel__bar"></div>
            </div>

            <div v-else-if="plan.error" class="go-state">
              <v-icon size="20" color="#d98a8a">mdi-alert-circle-outline</v-icon>
              <span>{{ t('goals.goal.error') }}</span>
              <button class="go-retry" @click="loadSet(plan.goal.url_name, true)">{{ t('goals.goal.retry') }}</button>
            </div>

            <template v-else>
              <!-- Cost summary -->
              <div class="go-blocks">
                <div class="an-block" :class="{ 'is-pick': plan.cheaper === 'set' }">
                  <div class="an-block__lbl">{{ t('goals.cost.buySet') }}</div>
                  <div class="go-block__num">{{ plan.setCost > 0 ? fmtPlat(plan.setCost) + 'p' : t('goals.cost.none') }}</div>
                </div>
                <div class="an-block" :class="{ 'is-pick': plan.cheaper === 'parts' }">
                  <div class="an-block__lbl">{{ t('goals.cost.buyParts') }}</div>
                  <div class="go-block__num">{{ fmtPlat(plan.partsCost) }}p</div>
                  <div class="go-block__note">{{ t('goals.cost.missingUnits', { n: plan.missingUnits }, plan.missingUnits) }}</div>
                  <div v-if="plan.unpriced" class="go-block__note an-warn">
                    {{ t('goals.cost.unpriced', { n: plan.unpriced }, plan.unpriced) }}
                  </div>
                </div>
                <div class="an-block go-block--verdict">
                  <div class="an-block__lbl">{{ t('goals.cost.cheapest') }}</div>
                  <span class="pill" :class="plan.verdictPill">
                    {{ plan.cheaper === 'done' ? '0' : fmtPlat(plan.cheapest) }}p
                    <b>{{ verdictText(plan) }}</b>
                  </span>
                </div>
              </div>

              <!-- Parts checklist -->
              <div class="an-tablewrap">
                <table class="an-table is-cards go-parts">
                  <thead>
                    <tr>
                      <th class="col-name">{{ t('goals.table.part') }}</th>
                      <th>{{ t('goals.table.needed') }}</th>
                      <th>{{ t('goals.table.owned') }}</th>
                      <th>{{ t('goals.table.stillNeed') }}</th>
                      <th>{{ t('goals.table.priceEach') }}</th>
                      <th>{{ t('goals.table.costToFinish') }}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="part in plan.parts" :key="part.url_name" :class="{ 'is-have': part.missing === 0 }">
                      <td class="col-name" :data-label="t('goals.table.part')">
                        <div class="go-part">
                          <img class="an-thumb go-part__thumb" :src="part.thumb" :alt="part.name" loading="lazy" />
                          <span class="go-part__name">
                            {{ part.name }}
                            <v-icon v-if="part.missing === 0" class="go-tick" size="14" :title="t('goals.table.have')">mdi-check-circle</v-icon>
                          </span>
                        </div>
                      </td>
                      <td class="an-num" :data-label="t('goals.table.needed')">{{ part.need }}</td>
                      <td :data-label="t('goals.table.owned')">
                        <div class="go-qty">
                          <button
                            class="go-qty__btn"
                            :disabled="part.owned <= 0"
                            :aria-label="t('goals.table.minus')"
                            :title="t('goals.table.minus')"
                            @click="bump(part, -1)"
                          >
                            <v-icon size="14">mdi-minus</v-icon>
                          </button>
                          <span class="go-qty__n an-num">{{ part.owned }}</span>
                          <button
                            class="go-qty__btn"
                            :aria-label="t('goals.table.plus')"
                            :title="t('goals.table.plus')"
                            @click="bump(part, 1)"
                          >
                            <v-icon size="14">mdi-plus</v-icon>
                          </button>
                        </div>
                      </td>
                      <td class="an-num" :data-label="t('goals.table.stillNeed')">
                        <span :class="part.missing ? 'down' : 'up'">{{ part.missing }}</span>
                      </td>
                      <td class="an-num" :data-label="t('goals.table.priceEach')">{{ part.price > 0 ? fmtPlat(part.price) + 'p' : '—' }}</td>
                      <td class="an-num an-strong" :data-label="t('goals.table.costToFinish')">
                        {{ part.missing && part.price > 0 ? fmtPlat(part.cost) + 'p' : '—' }}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <!-- The differentiator: which relics actually cover what is missing -->
              <section v-if="plan.missingUnits > 0" class="go-farm">
                <div class="go-farm__head">
                  <span class="go-farm__title">{{ t('goals.farm.title') }}</span>
                  <span class="go-farm__sub">{{ t('goals.farm.sub') }}</span>
                </div>

                <div v-if="relicsLoading" class="go-skel">
                  <div class="go-skel__lbl">{{ t('goals.farm.loading') }}</div>
                  <div v-for="n in 3" :key="n" class="go-skel__bar"></div>
                </div>
                <div v-else-if="!plan.relics.length" class="go-farm__none">{{ t('goals.farm.none') }}</div>
                <ul v-else class="go-farm__list">
                  <li v-for="relic in plan.relics" :key="relic.url_name" class="go-relic">
                    <nuxt-link class="an-name go-relic__name" :to="localePath('/relic/' + relic.url_name)">
                      <img class="an-thumb" :src="relic.thumb" :alt="relic.name" loading="lazy" />
                      <span>
                        {{ relic.name }}
                        <span v-if="relic.vaulted" class="an-badge an-badge--vault">{{ t('goals.farm.vaulted') }}</span>
                        <span v-else-if="relic.resurgence" class="an-badge an-badge--resurgence">{{ t('goals.farm.resurgence') }}</span>
                        <small class="an-sub">{{ t('goals.farm.covers', { n: relic.covers.length }, relic.covers.length) }}</small>
                      </span>
                    </nuxt-link>
                    <div class="go-relic__covers">
                      <span v-for="cover in relic.covers" :key="cover.url_name" class="an-chip go-cover">
                        {{ cover.name }} <b>{{ fmtPct(cover.chance) }}%</b>
                      </span>
                    </div>
                    <button class="go-icon go-icon--map" :title="t('goals.farm.drops')" :aria-label="t('goals.farm.drops')" @click="openDrops(relic)">
                      <v-icon size="18">mdi-map-marker-radius-outline</v-icon>
                    </button>
                  </li>
                </ul>
              </section>

              <div v-else class="go-farm__done">
                <v-icon size="18" color="#35d6d0">mdi-check-decagram-outline</v-icon>
                {{ t('goals.goal.complete') }}
              </div>
            </template>
          </section>

          <!-- Completed goals collapse to one line each -->
          <section v-if="doneGoals.length" class="go-donelist">
            <div class="go-donelist__lbl">{{ t('goals.done.title') }}</div>
            <div v-for="goal in doneGoals" :key="goal.id" class="go-donerow">
              <v-icon size="16" color="#35d6d0">mdi-check-circle-outline</v-icon>
              <nuxt-link class="go-donerow__name" :to="localePath('/set/' + goal.url_name)">{{ goalName(goal) }}</nuxt-link>
              <button class="go-undo" @click="reopen(goal)">{{ t('goals.done.undo') }}</button>
              <button class="go-icon go-icon--danger" :title="t('goals.done.remove')" :aria-label="t('goals.done.remove')" @click="removeGoal(goal)">
                <v-icon size="16">mdi-close</v-icon>
              </button>
            </div>
          </section>
        </div>
      </div>

      <v-alert class="an-disclaimer" color="blue-darken-4" type="info" density="compact">
        {{ t('goals.disclaimer') }}
      </v-alert>

      <DropLocationsDialog v-model="dropsDialog" :item-name="dropsItem" :thumb="dropsThumb" />
    </client-only>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useDisplay } from 'vuetify'
import { RELIC_CHANCES, trueRarity, type RelicReward, type RelicRow } from '~/composables/useRelicValue'

const { t } = useI18n()
const localePath = useLocalePath()
const { trackAction, trackDialog } = useAnalytics()
const { localItemName, localName } = useLocalizedName()
const { itemThumb } = useItemThumb()
const base = useApiBase()
const { mobile } = useDisplay()
const isMobile = computed(() => mobile.value)

const ud = useUserData()
const auth = useAuthStore()
const itemsStore = useItemsStore()
const allItems = computed<any[]>(() => itemsStore.allItems as any[])

/**
 * A set is anything whose canonical English name ends in " Set" — the same test
 * the catalogue store uses (`allSets`). Detection must stay on `item_name`, not
 * the localized label.
 */
const setItems = computed<any[]>(() =>
  allItems.value.filter((i) => i.url_name && typeof i.item_name === 'string' && i.item_name.endsWith(' Set')),
)

// Relic drop tables + prices, fetched ONCE for the whole page. Every goal's farm
// plan is derived from this one payload rather than a request per goal.
const { data: relicData, status: relicStatus } = await useAsyncData('goals-relics-ev', () =>
  $fetch<{ relics: RelicRow[] }>(`${base}/relics_ev`),
)
const relics = computed<RelicRow[]>(() => relicData.value?.relics ?? [])
const relicsLoading = computed(() => relicStatus.value === 'pending')

// --------------------------------------------------------------- set bundles
interface SetState {
  loading: boolean
  error: boolean
  set: any | null
  parts: any[]
}

// One /set_full request per goal, cached for the life of the page. Kept in a ref
// (not useAsyncData) because the number of goals is user-driven and composables
// cannot be called in a loop.
const setCache = ref<Record<string, SetState>>({})

async function loadSet(urlName: string, force = false): Promise<void> {
  if (!urlName) return
  if (!force && setCache.value[urlName]) return
  setCache.value = { ...setCache.value, [urlName]: { loading: true, error: false, set: null, parts: [] } }
  try {
    const res = await $fetch<any>(`${base}/set_full/${urlName}`)
    // The cached API wrapper answers a FAILED producer with HTTP 200 and a
    // `{ error }` body, never an error status — so `$fetch` resolves happily.
    // Without this check a failed lookup renders as a set with zero parts, i.e.
    // a goal that looks 100% complete.
    if (!res?.set || !Array.isArray(res.parts)) throw new Error(res?.error || 'bad set bundle')
    setCache.value = {
      ...setCache.value,
      [urlName]: { loading: false, error: false, set: res.set, parts: res.parts },
    }
  } catch {
    setCache.value = { ...setCache.value, [urlName]: { loading: false, error: true, set: null, parts: [] } }
  }
}

// Fetch on demand: a new goal (or a reopened one) pulls its bundle, completed
// goals never do. The key includes `done` so reopening triggers the load.
watch(
  () => ud.goals.value.map((g: any) => `${g.url_name}:${g.done ? 1 : 0}`).join('|'),
  () => {
    for (const goal of ud.goals.value) if (!goal.done) void loadSet(goal.url_name)
  },
  { immediate: true },
)

// ------------------------------------------------------------------ matching
/**
 * Drop-table names and market names disagree about the word "Blueprint" (the
 * tables list "Ash Prime Neuroptics Blueprint" where the market sells "Ash Prime
 * Neuroptics"), so names are compared with that suffix stripped from both sides.
 * `url_name` is always tried first — it is exact when both feeds carry it.
 */
function normName(s: string | undefined | null): string {
  return String(s || '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\s*blueprint$/, '')
    .trim()
}

/** Intact drop chance for a reward, falling back to its rarity bucket's anchor. */
function chanceOf(reward: RelicReward): number {
  const c = Number(reward?.chance)
  if (Number.isFinite(c) && c > 0) return c
  return RELIC_CHANCES['Intact']?.[trueRarity(reward)] ?? 0
}

// A relic you can still farm from a fissure beats an equally-covering vaulted
// one, which can only be bought — so dropping relics get a ranking bonus rather
// than being filtered out entirely (a vaulted relic you already own still works).
const DROPPING_BONUS = 1.5

interface CoverPart {
  url_name: string
  name: string
  chance: number
}
interface FarmRelic {
  url_name: string
  name: string
  relicName: string
  thumb: string
  vaulted: boolean
  resurgence: boolean
  score: number
  covers: CoverPart[]
}
interface PartRow {
  url_name: string
  item_name: string
  name: string
  thumb: string
  need: number
  owned: number
  missing: number
  price: number
  cost: number
}

/**
 * Relics ranked by how much of the missing list they cover: every matching
 * reward contributes its drop chance weighted by how many of that part are still
 * needed (the weight is the outstanding count, so a part you need twice is worth
 * twice as much on a relic that drops it).
 */
function farmRelicsFor(missing: PartRow[]): FarmRelic[] {
  if (!missing.length || !relics.value.length) return []
  const byUrl = new Map<string, PartRow>()
  const byName = new Map<string, PartRow>()
  for (const part of missing) {
    byUrl.set(part.url_name, part)
    byName.set(normName(part.item_name), part)
  }

  const out: FarmRelic[] = []
  for (const relic of relics.value) {
    const covers: CoverPart[] = []
    const seen = new Set<string>()
    let score = 0
    for (const reward of relic.rewards || []) {
      const hit =
        (reward.url_name ? byUrl.get(reward.url_name) : undefined) || byName.get(normName(reward.item_name))
      if (!hit || seen.has(hit.url_name)) continue
      seen.add(hit.url_name)
      const chance = chanceOf(reward)
      covers.push({ url_name: hit.url_name, name: hit.name, chance })
      score += (chance / 100) * hit.missing
    }
    if (!covers.length) continue
    const dropping = relic.vaulted === false
    covers.sort((a, b) => b.chance - a.chance)
    out.push({
      url_name: relic.url_name,
      name: localName('items', relic.url_name, relic.relicName),
      relicName: relic.relicName,
      thumb: itemThumb({ urlName: relic.url_name, itemName: relic.relicName, thumb: relic.thumb }),
      vaulted: !!relic.vaulted,
      resurgence: !!relic.resurgence,
      score: score * (dropping ? DROPPING_BONUS : 1),
      covers,
    })
  }
  out.sort((a, b) => b.score - a.score)
  // Five is the useful depth on desktop; a phone drowns in it.
  return out.slice(0, isMobile.value ? 3 : 5)
}

// --------------------------------------------------------------------- plans
interface GoalPlan {
  goal: any
  name: string
  thumb: string
  loading: boolean
  error: boolean
  parts: PartRow[]
  requiredParts: number
  ownedParts: number
  missingUnits: number
  unpriced: number
  pct: number
  setCost: number
  partsCost: number
  cheapest: number
  cheaper: 'set' | 'parts' | 'done'
  verdictPill: string
  relics: FarmRelic[]
}

/** Lowest ask for a /set_full node — what you PAY to acquire it. */
function askOf(node: any): number {
  return Math.max(0, Number(node?.market?.sell) || 0)
}

function goalName(goal: any): string {
  return localName('items', goal.url_name, goal.item_name) || goal.item_name
}

function buildPlan(goal: any): GoalPlan {
  const state = setCache.value[goal.url_name]
  const empty: GoalPlan = {
    goal,
    name: goalName(goal),
    thumb: itemThumb({ urlName: goal.url_name, itemName: goal.item_name }),
    loading: !state || state.loading,
    error: !!state?.error,
    parts: [],
    requiredParts: 0,
    ownedParts: 0,
    missingUnits: 0,
    unpriced: 0,
    pct: 0,
    setCost: 0,
    partsCost: 0,
    cheapest: 0,
    cheaper: 'parts',
    verdictPill: 'pill--even',
    relics: [],
  }
  if (!state || state.loading || state.error) return empty

  const parts: PartRow[] = (state.parts || []).map((node: any) => {
    const need = Math.max(1, Math.round(Number(node.quantity_for_set) || 1))
    const owned = Math.max(0, Math.round(Number(ud.vault.value[node.url_name]?.qty) || 0))
    const missing = Math.max(0, need - owned)
    const price = askOf(node)
    return {
      url_name: node.url_name,
      item_name: node.item_name,
      name: localItemName(node) || node.item_name,
      thumb: itemThumb({ urlName: node.url_name, itemName: node.item_name, thumb: node.thumb }),
      need,
      owned,
      missing,
      price,
      cost: missing * price,
    }
  })

  const requiredParts = parts.reduce((sum, p) => sum + p.need, 0)
  const missingUnits = parts.reduce((sum, p) => sum + p.missing, 0)
  const ownedParts = requiredParts - missingUnits
  const unpriced = parts.filter((p) => p.missing > 0 && p.price <= 0).length
  const partsCost = parts.reduce((sum, p) => sum + p.cost, 0)
  const setCost = askOf(state.set)

  // Buying the assembled set only competes when it is actually priced; with a
  // full inventory neither route costs anything.
  let cheaper: 'set' | 'parts' | 'done' = 'parts'
  if (missingUnits === 0) cheaper = 'done'
  else if (setCost > 0 && setCost < partsCost) cheaper = 'set'

  const cheapest = cheaper === 'set' ? setCost : cheaper === 'parts' ? partsCost : 0

  return {
    ...empty,
    loading: false,
    error: false,
    parts,
    requiredParts,
    ownedParts,
    missingUnits,
    unpriced,
    pct: requiredParts > 0 ? Math.min(100, Math.round((ownedParts / requiredParts) * 100)) : 0,
    setCost,
    partsCost,
    cheapest,
    cheaper,
    // Farming/filling the gaps is the "good" outcome; buying it assembled is the
    // gold alternative; a finished set is neutral.
    verdictPill: cheaper === 'done' ? 'pill--even' : cheaper === 'parts' ? 'pill--good' : 'pill--alt',
    relics: farmRelicsFor(parts.filter((p) => p.missing > 0)),
  }
}

const activeGoals = computed<any[]>(() => ud.goals.value.filter((g: any) => !g.done))
const doneGoals = computed<any[]>(() => ud.goals.value.filter((g: any) => !!g.done))
const goalUrls = computed<Set<string>>(() => new Set(ud.goals.value.map((g: any) => g.url_name)))
const activePlans = computed<GoalPlan[]>(() => activeGoals.value.map(buildPlan))

const stats = computed(() => ({
  active: activeGoals.value.length,
  partsNeeded: activePlans.value.reduce((sum, p) => sum + p.missingUnits, 0),
  platToFinish: activePlans.value.reduce((sum, p) => sum + p.cheapest, 0),
  done: doneGoals.value.length,
}))

// The hero highlights the goal you are nearest to finishing — the one worth one
// more run. Fully-loaded goals only, so a pending fetch can't win at 0%.
const closest = computed<GoalPlan | null>(() => {
  let best: GoalPlan | null = null
  for (const plan of activePlans.value) {
    if (plan.loading || plan.error || plan.requiredParts === 0) continue
    if (!best || plan.pct > best.pct) best = plan
  }
  return best
})

function verdictText(plan: GoalPlan): string {
  if (plan.cheaper === 'done') return t('goals.cost.verdictDone')
  if (plan.cheaper === 'set') return t('goals.cost.verdictSet')
  const saving = plan.setCost > 0 ? plan.setCost - plan.partsCost : 0
  return saving > 0
    ? `${t('goals.cost.verdictParts')} · ${t('goals.cost.saves', { plat: fmtPlat(saving) })}`
    : t('goals.cost.verdictParts')
}

// ------------------------------------------------------------------- picker
const picker = ref<any>(null)

// Localized name baked in so the typeahead matches what the player reads.
const pickerItems = computed<any[]>(() =>
  setItems.value.map((i) => ({
    url_name: i.url_name,
    item_name: i.item_name,
    name: localItemName(i) || i.item_name,
    thumb: i.thumb,
  })),
)

// Empty-state seeds: the busiest sets on the board right now, taken from the
// live catalogue rather than a hardcoded list that would age badly.
const suggestions = computed<any[]>(() =>
  setItems.value
    .filter((i) => !goalUrls.value.has(i.url_name))
    .slice()
    .sort((a, b) => (Number(b?.market?.volume) || 0) - (Number(a?.market?.volume) || 0))
    .slice(0, 3)
    .map((i) => ({
      url_name: i.url_name,
      item_name: i.item_name,
      name: localItemName(i) || i.item_name,
      thumbUrl: itemThumb({ urlName: i.url_name, itemName: i.item_name, thumb: i.thumb }),
    })),
)

function addGoalFor(item: any, source: string): void {
  if (!item?.url_name) return
  const created = ud.addGoal({ url_name: item.url_name, item_name: item.item_name || item.name })
  if (created) {
    trackAction('goal_add', { url_name: item.url_name, source })
    void loadSet(item.url_name)
  }
  picker.value = null
}

function onPick(value: any): void {
  if (!value) return
  addGoalFor(value, 'picker')
}

// -------------------------------------------------------------- goal actions
function markDone(goal: any): void {
  ud.updateGoal(goal.id, { done: true })
  trackAction('goal_done', { url_name: goal.url_name })
}

function reopen(goal: any): void {
  ud.updateGoal(goal.id, { done: false })
  trackAction('goal_reopen', { url_name: goal.url_name })
}

function removeGoal(goal: any): void {
  ud.removeGoal(goal.id)
  trackAction('goal_remove', { url_name: goal.url_name })
}

// The owned column writes straight into the shared vault, so ticking a part off
// here also updates /vault and /portfolio.
function bump(part: PartRow, delta: number): void {
  ud.adjustVaultQty({ url_name: part.url_name, item_name: part.item_name }, delta)
  trackAction('goal_part_qty', { url_name: part.url_name, delta })
}

// ------------------------------------------------------------- drops dialog
const dropsDialog = ref(false)
const dropsItem = ref('')
const dropsThumb = ref('')

function openDrops(relic: FarmRelic): void {
  // Drop nodes are indexed under the full English item name ("Axi S8 Relic"),
  // but `relicName` is the bare label — suffix it so the nodes resolve.
  const bare = (relic.relicName || '').trim()
  dropsItem.value = /relic$/i.test(bare) ? bare : `${bare} Relic`
  dropsThumb.value = ''
  dropsDialog.value = true
  trackDialog('drop_locations', { item_name: dropsItem.value, covers: relic.covers.length })
}

// ------------------------------------------------------------------ display
/** Drop chances are sub-percent-precise; one decimal is the honest resolution. */
function fmtPct(n: number): string {
  const v = Number(n) || 0
  return (Math.round(v * 10) / 10).toLocaleString(undefined, { maximumFractionDigits: 1 })
}

// Hide the global loading spinner once mounted (project rule). Bounded retry so
// a missing #spinner-wrapper element can't recurse forever.
function finishLoading(attempt = 0) {
  nextTick(() => {
    const el = document.getElementById('spinner-wrapper')
    if (el) el.style.display = 'none'
    else if (attempt < 20) finishLoading(attempt + 1)
  })
}

onMounted(() => {
  ud.start()
  finishLoading()
})
</script>

<style scoped>
/* Sign-in nudge under the hero — informative, never a gate. */
.go-sync {
  margin-top: 14px;
  font-family: var(--font-hud);
  font-size: 0.82rem;
  letter-spacing: 0.04em;
  color: var(--ink-dim);
}
.go-sync a {
  color: var(--energy);
  text-decoration: none;
  font-weight: 700;
  margin-left: 6px;
}
.go-sync a:hover {
  color: var(--gold-ink);
}

.go-picker {
  max-width: 460px;
}

/* ---- Goal cards ------------------------------------------------------- */
.go-list {
  display: flex;
  flex-direction: column;
  gap: 18px;
  padding: 4px 18px 22px;
}
/* A goal is its own reliquary panel. Deliberately NOT .an-console — nesting the
   console shell would double the bevel, the border and the diamond node. */
.go-goal {
  position: relative;
  background: linear-gradient(180deg, rgba(25, 28, 48, 0.9) 0%, rgba(11, 12, 20, 0.9) 100%);
  border: 1px solid var(--orokin-line);
  clip-path: polygon(14px 0, 100% 0, 100% calc(100% - 14px), calc(100% - 14px) 100%, 0 100%, 0 14px);
  padding: 16px 18px 18px;
}
.go-goal__head {
  display: flex;
  align-items: center;
  gap: 14px;
}
.go-goal__thumb {
  width: 54px;
  height: 54px;
}
.go-goal__title {
  flex: 1;
  min-width: 0;
}
.go-goal__name {
  font-family: var(--font-display);
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--gold-ink) !important;
  text-decoration: none;
}
.go-goal__name:hover {
  color: var(--energy-hi) !important;
}
.go-goal__meta {
  display: flex;
  align-items: baseline;
  gap: 10px;
  font-family: var(--font-hud);
  font-size: 0.76rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--ink-dim);
  margin-top: 5px;
}
.go-goal__meta b {
  color: var(--gold-ink);
  font-size: 0.92rem;
  font-variant-numeric: tabular-nums;
}
.go-goal__acts {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: none;
}

/* Progress meter — gold fill on a hairline void track. */
.go-bar {
  position: relative;
  height: 6px;
  margin-top: 9px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid var(--line);
  overflow: hidden;
}
.go-bar i {
  display: block;
  height: 100%;
  background: linear-gradient(90deg, rgba(200, 168, 92, 0.55), var(--orokin));
  box-shadow: 0 0 10px rgba(200, 168, 92, 0.45);
  transition: width 0.25s ease;
}
.go-bar.is-full i {
  background: linear-gradient(90deg, rgba(53, 214, 208, 0.5), var(--energy));
  box-shadow: 0 0 10px rgba(53, 214, 208, 0.45);
}

/* ---- Square HUD icon buttons ------------------------------------------ */
.go-icon {
  flex: none;
  color: var(--energy);
  background: transparent;
  border: 1px solid rgba(53, 214, 208, 0.35);
  width: 30px;
  height: 30px;
  display: grid;
  place-items: center;
  cursor: pointer;
  clip-path: polygon(5px 0, 100% 0, 100% calc(100% - 5px), calc(100% - 5px) 100%, 0 100%, 0 5px);
  transition: color 0.15s ease, border-color 0.15s ease, background 0.15s ease;
}
.go-icon:hover {
  color: var(--gold-ink);
  border-color: rgba(200, 168, 92, 0.5);
  background: rgba(200, 168, 92, 0.08);
}
.go-icon--danger {
  color: var(--rose);
  border-color: rgba(217, 138, 138, 0.35);
}
.go-icon--danger:hover {
  color: #f0a8a8;
  border-color: rgba(217, 138, 138, 0.6);
  background: rgba(217, 138, 138, 0.1);
}
.go-icon--map {
  align-self: center;
}

/* ---- Load / error states ---------------------------------------------- */
.go-skel {
  padding: 16px 2px 4px;
}
.go-skel__lbl {
  font-family: var(--font-hud);
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  color: var(--ink-dim);
  margin-bottom: 12px;
}
.go-skel__bar {
  height: 13px;
  margin-bottom: 9px;
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0.04) 0%,
    rgba(200, 168, 92, 0.14) 50%,
    rgba(255, 255, 255, 0.04) 100%
  );
  background-size: 220% 100%;
  animation: go-shimmer 1.5s ease-in-out infinite;
}
.go-skel__bar:nth-child(3) {
  width: 82%;
}
.go-skel__bar:nth-child(4) {
  width: 64%;
}
.go-skel__bar:nth-child(5) {
  width: 73%;
}
@keyframes go-shimmer {
  0% {
    background-position: 120% 0;
  }
  100% {
    background-position: -20% 0;
  }
}
@media (prefers-reduced-motion: reduce) {
  .go-skel__bar {
    animation: none;
  }
}
.go-state {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 16px;
  font-family: var(--font-hud);
  font-size: 0.86rem;
  color: var(--ink-dim);
}
.go-retry {
  font-family: var(--font-hud);
  font-size: 0.74rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--energy);
  background: transparent;
  border: 1px solid rgba(53, 214, 208, 0.4);
  padding: 3px 12px;
  cursor: pointer;
  clip-path: polygon(5px 0, 100% 0, 100% calc(100% - 5px), calc(100% - 5px) 100%, 0 100%, 0 5px);
}
.go-retry:hover {
  color: var(--gold-ink);
  border-color: rgba(200, 168, 92, 0.5);
}

/* ---- Cost summary ------------------------------------------------------ */
.go-blocks {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-top: 16px;
}
.go-blocks .an-block.is-pick {
  border-color: var(--orokin-line);
  background: linear-gradient(160deg, rgba(200, 168, 92, 0.1), rgba(0, 0, 0, 0.25));
}
.go-block__num {
  font-family: var(--font-hud);
  font-size: 1.32rem;
  font-weight: 700;
  line-height: 1.1;
  font-variant-numeric: tabular-nums;
  color: var(--ink);
}
.go-block__note {
  font-family: var(--font-hud);
  font-size: 0.72rem;
  letter-spacing: 0.04em;
  color: var(--ink-dim);
  margin-top: 5px;
}
.go-block--verdict {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
}

/* ---- Parts checklist --------------------------------------------------- */
.an-tablewrap {
  padding: 12px 0 4px;
}
/* Prose-ish rows: let the part name take the width it needs on desktop (the
   shared `.is-cards` rule fixes the layout to equal columns, which starves it).
   Below 760px `.is-cards` turns every row into a labelled card. */
.an-table.go-parts {
  table-layout: auto;
}
.an-table.go-parts thead th.col-name {
  width: 36%;
}
.go-parts tbody tr.is-have {
  opacity: 0.55;
}
.go-parts tbody tr.is-have:hover {
  opacity: 1;
}
.go-part {
  display: flex;
  align-items: center;
  gap: 11px;
  min-width: 0;
}
.go-part__thumb {
  width: 34px;
  height: 34px;
}
.go-part__name {
  font-weight: 600;
  min-width: 0;
}
.go-tick {
  color: var(--energy);
  margin-left: 6px;
  vertical-align: middle;
}
.go-qty {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  justify-content: flex-end;
}
.go-qty__btn {
  width: 24px;
  height: 24px;
  display: grid;
  place-items: center;
  color: var(--ink-dim);
  background: transparent;
  border: 1px solid var(--line);
  cursor: pointer;
  clip-path: polygon(4px 0, 100% 0, 100% calc(100% - 4px), calc(100% - 4px) 100%, 0 100%, 0 4px);
  transition: color 0.15s ease, border-color 0.15s ease;
}
.go-qty__btn:hover:not(:disabled) {
  color: var(--gold-ink);
  border-color: rgba(200, 168, 92, 0.5);
}
.go-qty__btn:disabled {
  opacity: 0.3;
  cursor: default;
}
.go-qty__n {
  min-width: 22px;
  text-align: center;
  font-size: 0.95rem;
  color: var(--ink);
}

/* ---- Farm plan --------------------------------------------------------- */
.go-farm {
  margin-top: 18px;
  border-top: 1px solid var(--orokin-line);
  padding-top: 16px;
}
.go-farm__head {
  display: flex;
  align-items: baseline;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 12px;
}
.go-farm__title {
  font-family: var(--font-hud);
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.16em;
  color: var(--orokin);
}
.go-farm__sub {
  font-family: var(--font-hud);
  font-size: 0.78rem;
  color: var(--ink-dim);
  letter-spacing: 0.02em;
}
.go-farm__none,
.go-farm__done {
  display: flex;
  align-items: center;
  gap: 9px;
  font-family: var(--font-hud);
  font-size: 0.86rem;
  color: var(--ink-dim);
  letter-spacing: 0.02em;
  margin-top: 16px;
  padding: 12px 14px;
  background: rgba(0, 0, 0, 0.25);
  border: 1px solid var(--line);
  clip-path: polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px);
}
.go-farm__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.go-relic {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 9px 12px;
  background: rgba(0, 0, 0, 0.22);
  border: 1px solid var(--line);
  clip-path: polygon(9px 0, 100% 0, 100% calc(100% - 9px), calc(100% - 9px) 100%, 0 100%, 0 9px);
}
.go-relic:hover {
  border-color: var(--orokin-line);
}
.go-relic__name {
  flex: 0 0 250px;
  min-width: 0;
}
.go-relic__name .an-thumb {
  width: 38px;
  height: 38px;
}
.go-relic__covers {
  flex: 1 1 auto;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  min-width: 0;
}
.go-cover {
  background: rgba(53, 214, 208, 0.1);
  border: 1px solid rgba(53, 214, 208, 0.28);
  color: #cfe6e6;
  letter-spacing: 0.02em;
}
.go-cover b {
  color: var(--energy-hi);
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  margin-left: 5px;
}
.an-badge--vault {
  background: rgba(138, 143, 163, 0.18);
  color: #b6bcd0;
  border: 1px solid rgba(138, 143, 163, 0.4);
}
/* Prime Resurgence (Varzia) relic — obtainable, but not from a fissure run. */
.an-badge--resurgence {
  background: rgba(159, 122, 234, 0.16);
  color: #c4b0ee;
  border: 1px solid rgba(159, 122, 234, 0.42);
}

/* ---- Completed goals --------------------------------------------------- */
.go-donelist {
  margin-top: 6px;
  padding-top: 16px;
  border-top: 1px solid var(--line);
}
.go-donelist__lbl {
  font-family: var(--font-hud);
  font-size: 0.68rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.16em;
  color: var(--ink-dim);
  margin-bottom: 10px;
}
.go-donerow {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 7px 12px;
  margin-bottom: 6px;
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid var(--line);
  clip-path: polygon(7px 0, 100% 0, 100% calc(100% - 7px), calc(100% - 7px) 100%, 0 100%, 0 7px);
}
.go-donerow__name {
  flex: 1;
  min-width: 0;
  font-family: var(--font-display);
  font-size: 0.95rem;
  color: var(--ink-dim) !important;
  text-decoration: none;
}
.go-donerow__name:hover {
  color: var(--gold-ink) !important;
}
.go-undo {
  font-family: var(--font-hud);
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--energy);
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 2px 4px;
}
.go-undo:hover {
  color: var(--gold-ink);
}

/* ---- Empty state ------------------------------------------------------- */
.go-empty__title {
  font-family: var(--font-display);
  font-size: 1.1rem;
  letter-spacing: 0.1em;
  color: var(--gold-ink);
  text-transform: uppercase;
  margin-bottom: 10px;
}
.go-empty__text {
  max-width: 580px;
  margin: 0 auto 22px;
  line-height: 1.6;
}
.go-empty__lbl {
  font-family: var(--font-hud);
  font-size: 0.66rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.16em;
  color: var(--orokin);
  margin-bottom: 12px;
}
.go-empty__sug {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: center;
}
.go-sug {
  display: inline-flex;
  align-items: center;
  gap: 9px;
  padding: 6px 14px 6px 7px;
  background: rgba(200, 168, 92, 0.08);
  border: 1px solid var(--orokin-line);
  color: var(--gold-ink);
  font-family: var(--font-hud);
  font-size: 0.84rem;
  font-weight: 600;
  letter-spacing: 0.03em;
  cursor: pointer;
  clip-path: polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px);
  transition: background 0.15s ease, color 0.15s ease;
}
.go-sug:hover {
  background: rgba(200, 168, 92, 0.2);
  color: #fff;
}
.go-sug__thumb {
  width: 30px;
  height: 30px;
  object-fit: contain;
}

@media (max-width: 760px) {
  .go-list {
    padding: 4px 12px 20px;
  }
  .go-goal {
    padding: 14px 12px 16px;
  }
  .go-blocks {
    grid-template-columns: 1fr;
  }
  .go-relic {
    flex-wrap: wrap;
  }
  .go-relic__name {
    flex: 1 1 100%;
  }
  .go-relic__covers {
    flex: 1 1 auto;
  }
}
</style>
