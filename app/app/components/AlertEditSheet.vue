<template>
  <component
    :is="mobile ? VBottomSheet : VDialog"
    v-model="open"
    :max-width="mobile ? undefined : 540"
    :scrim="true"
  >
    <v-card v-if="entry" class="aes">
      <div class="aes__head">
        <div class="d-flex align-center" style="min-width: 0">
          <v-img
            :src="itemThumb({ urlName: entry.url_name, itemName: entry.item_name, thumb: entry.thumb })"
            width="36"
            height="36"
            class="mr-2 flex-0-0"
            cover
          />
          <div class="text-truncate">
            <div class="text-subtitle-1 font-weight-bold text-truncate">{{ entry.name }}</div>
            <div class="text-caption text-medium-emphasis">
              {{ entry.currentSell != null ? entry.currentSell + 'p ' + t('portfolio.sheet.now') : t('portfolio.sheet.noPrice') }}
            </div>
          </div>
        </div>
        <v-btn icon variant="text" size="small" :aria-label="t('portfolio.sheet.close')" @click="open = false">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </div>

      <!-- Price context first: sparkline + ATL so users pick a realistic target. -->
      <div v-if="sparkPoints" class="aes__spark">
        <svg :viewBox="`0 0 ${SPARK_W} ${SPARK_H}`" preserveAspectRatio="none" class="aes__sparksvg">
          <polyline :points="sparkPoints" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round" />
        </svg>
        <span v-if="entry.atl != null" class="text-caption text-medium-emphasis aes__atl">
          {{ t('portfolio.sheet.atl') }} ~{{ Math.round(entry.atl) }}p
        </span>
      </div>

      <v-card-text class="aes__body">
        <!-- Direction: which single threshold this target arms. Both persist independently. -->
        <div class="text-caption text-medium-emphasis mb-1">{{ t('portfolio.sheet.directionLabel') }}</div>
        <v-btn-toggle v-model="direction" mandatory divided density="comfortable" color="primary" class="aes__dir mb-4">
          <v-btn value="below" size="large" class="flex-1-1">
            <v-icon start>mdi-arrow-down-bold</v-icon>{{ t('portfolio.sheet.below') }}
          </v-btn>
          <v-btn value="above" size="large" class="flex-1-1">
            <v-icon start>mdi-arrow-up-bold</v-icon>{{ t('portfolio.sheet.above') }}
          </v-btn>
        </v-btn-toggle>

        <!-- Target: pre-filled + presets + stepper (minimise typing). -->
        <v-number-input
          v-model="target"
          :label="t('portfolio.sheet.targetLabel')"
          :min="0"
          control-variant="split"
          density="comfortable"
          variant="outlined"
          suffix="p"
          hide-details
          class="mb-2"
        />
        <div class="aes__presets mb-4">
          <v-chip
            v-for="p in presets"
            :key="p.label"
            size="small"
            variant="tonal"
            :disabled="p.value == null"
            @click="target = p.value ?? target"
          >
            {{ p.label }}
          </v-chip>
        </div>

        <!-- All-time-low alert (long-history signal warframe.market lacks). -->
        <v-switch
          v-model="atl"
          color="#4caf7d"
          density="compact"
          hide-details
          inset
          :label="t('portfolio.sheet.atlToggle')"
          class="mb-2"
        />

        <v-text-field
          v-model.number="qty"
          type="number"
          inputmode="numeric"
          :min="0"
          :label="t('portfolio.sheet.ownedQty')"
          density="comfortable"
          variant="outlined"
          hide-details
        />
      </v-card-text>

      <v-card-actions class="aes__actions">
        <v-btn variant="text" color="error" @click="onDelete">
          <v-icon start>mdi-trash-can-outline</v-icon>{{ t('portfolio.sheet.remove') }}
        </v-btn>
        <v-spacer />
        <v-btn color="primary" variant="flat" size="large" @click="onSave">
          {{ t('portfolio.sheet.save') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </component>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useDisplay } from 'vuetify'
import { VBottomSheet, VDialog } from 'vuetify/components'

interface AlertEntry {
  url_name: string
  item_name: string
  name: string
  thumb?: string
  currentSell?: number | null
  spark?: number[]
  atl?: number | null
  ownedQty?: number
  alertBelow?: number | null
  alertAbove?: number | null
  alertAtl?: boolean
}

const props = defineProps<{ modelValue: boolean; entry: AlertEntry | null }>()
const emit = defineEmits<{
  'update:modelValue': [boolean]
  save: [{ url_name: string; alertBelow: number | null; alertAbove: number | null; alertAtl: boolean; ownedQty: number }]
  delete: [string]
}>()

const { t } = useI18n()
const { mobile } = useDisplay()
const { itemThumb } = useItemThumb()

const open = computed({
  get: () => props.modelValue,
  set: (v: boolean) => emit('update:modelValue', v),
})

// Local, editable copies; both directional thresholds are kept so toggling
// direction never discards the other side's value.
const below = ref<number | null>(null)
const above = ref<number | null>(null)
const atl = ref(false)
const qty = ref(0)
const direction = ref<'below' | 'above'>('below')

// The one visible target field maps onto whichever direction is active.
const target = computed<number | null>({
  get: () => (direction.value === 'below' ? below.value : above.value),
  set: (v: number | null) => {
    const val = v == null || Number.isNaN(v) ? null : v
    if (direction.value === 'below') below.value = val
    else above.value = val
  },
})

// Seed locals whenever a new entry opens the sheet.
watch(
  () => [props.modelValue, props.entry?.url_name] as const,
  ([openNow]) => {
    if (!openNow || !props.entry) return
    below.value = props.entry.alertBelow ?? null
    above.value = props.entry.alertAbove ?? null
    atl.value = !!props.entry.alertAtl
    qty.value = props.entry.ownedQty ?? 0
    // Default to whichever direction already has a value, else "below" (the
    // common "tell me when it gets cheap" case).
    direction.value = above.value != null && below.value == null ? 'above' : 'below'
    // Pre-fill a sensible default (−10% of current) for a brand-new alert so the
    // target field is never blank — the #1 documented mobile pain point. Local
    // only; nothing is persisted until the user hits Save.
    const cur = props.entry.currentSell
    if (below.value == null && above.value == null && typeof cur === 'number' && cur > 0) {
      below.value = Math.max(0, Math.round(cur * 0.9))
    }
  },
  { immediate: true },
)

const presets = computed(() => {
  const cur = props.entry?.currentSell
  if (cur == null) return [{ label: t('portfolio.sheet.presetCurrent'), value: null as number | null }]
  const round = (n: number) => Math.max(0, Math.round(n))
  return direction.value === 'below'
    ? [
        { label: '-10%', value: round(cur * 0.9) },
        { label: '-20%', value: round(cur * 0.8) },
        { label: t('portfolio.sheet.presetCurrent'), value: round(cur) },
      ]
    : [
        { label: '+10%', value: round(cur * 1.1) },
        { label: '+20%', value: round(cur * 1.2) },
        { label: t('portfolio.sheet.presetCurrent'), value: round(cur) },
      ]
})

const SPARK_W = 240
const SPARK_H = 40
const sparkPoints = computed<string | null>(() => {
  const pts = (props.entry?.spark || []).filter((n) => typeof n === 'number')
  if (pts.length < 2) return null
  const min = Math.min(...pts)
  const max = Math.max(...pts)
  const range = max - min || 1
  const step = SPARK_W / (pts.length - 1)
  return pts.map((v, i) => `${(i * step).toFixed(1)},${(SPARK_H - (SPARK_H - 2) * ((v - min) / range) - 1).toFixed(1)}`).join(' ')
})

function onSave() {
  if (!props.entry) return
  emit('save', {
    url_name: props.entry.url_name,
    alertBelow: below.value,
    alertAbove: above.value,
    alertAtl: atl.value,
    ownedQty: qty.value || 0,
  })
  open.value = false
}
function onDelete() {
  if (!props.entry) return
  emit('delete', props.entry.url_name)
  open.value = false
}
</script>

<style scoped>
.aes {
  border-radius: 14px 14px 0 0;
}
.aes__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 12px 12px 8px 16px;
}
.aes__spark {
  position: relative;
  padding: 0 16px 4px;
  color: rgba(var(--v-theme-primary), 0.75);
}
.aes__sparksvg {
  width: 100%;
  height: 40px;
  display: block;
}
.aes__atl {
  position: absolute;
  right: 16px;
  bottom: 4px;
}
.aes__body {
  padding-top: 8px;
}
.aes__dir {
  width: 100%;
}
.aes__dir :deep(.v-btn) {
  flex: 1 1 0;
}
.aes__presets {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.aes__actions {
  padding: 8px 16px 16px;
}
/* Bottom-sheet card sits flush to the screen bottom on mobile. */
</style>
