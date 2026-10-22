<template>
  <aside
    v-if="freshness.status === 'stale' || freshness.status === 'unknown'"
    class="market-freshness"
    role="status"
    aria-atomic="true"
    aria-labelledby="market-freshness-title"
  >
    <strong id="market-freshness-title" class="market-freshness__title">{{ t('marketFreshness.title') }}</strong>
    <p v-if="freshness.status === 'stale'">{{ t('marketFreshness.body') }}</p>
    <i18n-t v-if="freshness.latestUpdate" keypath="marketFreshness.latest" tag="p" class="market-freshness__date">
      <template #time>
        <time :datetime="freshness.latestUpdate">{{ marketTimestampUtc(freshness.latestUpdate) }}</time>
      </template>
    </i18n-t>
    <p v-else class="market-freshness__date">{{ t('marketFreshness.unknown') }}</p>
  </aside>
</template>

<script setup lang="ts">
import { catalogueFreshness, marketTimestampUtc } from '~/utils/market-freshness'

const items = useItemsStore()
const { t } = useI18n()
// Nuxt serializes this clock with SSR, so hydration makes the same decision.
const clock = useState<number>('market-freshness-clock', () => Date.now())
const freshness = computed(() => catalogueFreshness(items.allItems, clock.value))
let timer: ReturnType<typeof setInterval> | undefined

onMounted(() => {
  clock.value = Date.now()
  timer = setInterval(() => { clock.value = Date.now() }, 60_000)
})
onBeforeUnmount(() => {
  if (timer !== undefined) clearInterval(timer)
})
</script>

<style scoped>
.market-freshness {
  margin: 0 0 1rem;
  padding: 0.85rem 1rem;
  border: 1px solid rgba(212, 175, 90, 0.35);
  border-left: 3px solid #d4af5a;
  border-radius: 6px;
  background: rgba(212, 175, 90, 0.06);
  color: #d2d6e0;
  line-height: 1.5;
}
.market-freshness__title { color: #e6c773; }
.market-freshness p { margin: 0.25rem 0 0; }
.market-freshness__date { font-size: 0.875rem; color: #aeb5c7; }
</style>
