<template>
  <v-card variant="outlined" class="alert-card" :class="{ 'alert-card--low': atLow }">
    <div class="alert-card__top">
      <v-img
        :src="itemThumb({ urlName: entry.url_name, itemName: entry.item_name, thumb: entry.thumb })"
        width="44"
        height="44"
        class="alert-card__thumb"
        cover
      />
      <div class="alert-card__id">
        <nuxt-link :to="'/set/' + entry.url_name" class="alert-card__name">{{ entry.name }}</nuxt-link>
        <div class="alert-card__price">
          <span v-if="entry.currentSell != null">{{ entry.currentSell }}p</span>
          <span v-else class="text-medium-emphasis">{{ t('portfolio.card.noPrice') }}</span>
          <span v-if="entry.value != null" class="text-medium-emphasis"> · {{ entry.value.toFixed(0) }}p {{ t('portfolio.card.value') }}</span>
        </div>
      </div>
      <v-btn
        icon="mdi-close"
        variant="text"
        size="x-small"
        class="alert-card__del"
        :aria-label="t('portfolio.card.remove')"
        @click="emit('delete', entry.url_name)"
      />
    </div>

    <div class="alert-card__conds">
      <v-chip v-if="entry.alertBelow != null" size="small" variant="tonal" color="info" prepend-icon="mdi-arrow-down-bold">
        {{ entry.alertBelow }}p
      </v-chip>
      <v-chip v-if="entry.alertAbove != null" size="small" variant="tonal" color="warning" prepend-icon="mdi-arrow-up-bold">
        {{ entry.alertAbove }}p
      </v-chip>
      <v-chip v-if="entry.alertAtl" size="small" variant="tonal" color="#4caf7d" prepend-icon="mdi-chart-line-variant">
        {{ t('portfolio.card.atl') }}
      </v-chip>
      <span v-if="!hasCondition" class="text-caption text-medium-emphasis alert-card__none">
        {{ t('portfolio.card.noAlerts') }}
      </span>
      <v-chip v-if="atLow" size="small" color="#4caf7d" variant="flat" prepend-icon="mdi-flash">
        {{ t('portfolio.card.atLowNow') }}
      </v-chip>
    </div>

    <v-btn
      block
      variant="tonal"
      color="primary"
      size="small"
      class="alert-card__edit"
      prepend-icon="mdi-tune-variant"
      @click="emit('edit', entry)"
    >
      {{ hasCondition ? t('portfolio.card.edit') : t('portfolio.card.setUp') }}
    </v-btn>
  </v-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface AlertEntry {
  url_name: string
  item_name: string
  name: string
  thumb?: string
  currentSell?: number | null
  value?: number | null
  alertBelow?: number | null
  alertAbove?: number | null
  alertAtl?: boolean
  pctFromAtl?: number | null
}

const props = defineProps<{ entry: AlertEntry }>()
const emit = defineEmits<{ edit: [AlertEntry]; delete: [string] }>()

const { t } = useI18n()
const { itemThumb } = useItemThumb()

const hasCondition = computed(
  () => props.entry.alertBelow != null || props.entry.alertAbove != null || !!props.entry.alertAtl,
)
// "At its low right now" — same 3% threshold the alert engine uses.
const atLow = computed(() => props.entry.pctFromAtl != null && props.entry.pctFromAtl <= 3)
</script>

<style scoped>
.alert-card {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px;
  height: 100%;
  border-radius: 12px;
}
.alert-card--low {
  border-color: #4caf7d;
}
.alert-card__top {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}
.alert-card__thumb {
  border-radius: 8px;
  flex: 0 0 auto;
}
.alert-card__id {
  min-width: 0;
  flex: 1 1 auto;
}
.alert-card__name {
  display: block;
  font-weight: 600;
  color: rgb(var(--v-theme-on-surface));
  text-decoration: none;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.alert-card__name:hover {
  text-decoration: underline;
}
.alert-card__price {
  font-size: 0.8rem;
}
.alert-card__del {
  flex: 0 0 auto;
  align-self: flex-start;
}
.alert-card__conds {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
  min-height: 24px;
}
.alert-card__edit {
  margin-top: auto;
}
</style>
