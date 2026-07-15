<template>
  <v-tooltip v-if="v" location="bottom">
    <template #activator="{ props: tip }">
      <span v-bind="tip" class="mvb" :class="'mvb--' + v.verdict">
        <v-icon size="14" :color="iconColor">{{ icon }}</v-icon>
        <strong>{{ label }}</strong>
        <span v-if="!compact && dealText" class="mvb__deal">{{ dealText }}</span>
        <span class="mvb__conf" :style="{ opacity: confOpacity }" :title="t('components.verdict.confidence')">●</span>
      </span>
    </template>
    <div class="mvb__tip">
      <div><strong>{{ label }}</strong> — {{ v.reason }}</div>
      <div>{{ t('components.verdict.tip.fairValue', { value: round(v.fv) }) }}</div>
      <div>{{ t('components.verdict.tip.bestSellBuy', { sell: round(v.bestSell), buy: round(v.bestBuy) }) }}</div>
      <div>{{ t('components.verdict.tip.flipConfidence', { margin: round(v.flipMargin), conf: Math.round(v.confidence * 100) }) }}</div>
    </div>
  </v-tooltip>
  <span v-else class="mvb mvb--hold"><strong>—</strong></span>
</template>

<script setup lang="ts">
import type { Verdict } from '~/utils/liveTypes'

const props = withDefaults(
  defineProps<{ verdict?: Verdict | null; compact?: boolean }>(),
  { verdict: null, compact: false },
)

const { t } = useI18n()

const v = computed(() => props.verdict)

const ICONS: Record<string, string> = {
  buy: 'mdi-trending-down',
  sell: 'mdi-trending-up',
  fair: 'mdi-approximately-equal',
  hold: 'mdi-help',
}
const COLORS: Record<string, string> = { buy: '#4caf7d', sell: '#d4af5a', fair: '#8aa2a2', hold: '#667' }

const label = computed(() => {
  const verdict = v.value?.verdict ?? 'hold'
  return verdict === 'hold' ? '—' : t(`components.verdict.labels.${verdict}`)
})
const icon = computed(() => ICONS[v.value?.verdict ?? 'hold'] ?? 'mdi-help')
const iconColor = computed(() => COLORS[v.value?.verdict ?? 'hold'] ?? '#667')

const dealText = computed(() => {
  const cur = v.value
  if (!cur || cur.verdict === 'hold' || cur.verdict === 'fair') return ''
  if (cur.verdict === 'buy') return t('components.verdict.under', { pct: Math.round(cur.dealPct * 100) })
  if (cur.fv > 0) return t('components.verdict.over', { pct: Math.round(((cur.bestBuy - cur.fv) / cur.fv) * 100) })
  return ''
})

const confOpacity = computed(() => 0.35 + 0.65 * (v.value?.confidence ?? 0))

function round(n: number): number {
  return Math.round(n || 0)
}
</script>

<style scoped>
.mvb {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 1px 8px;
  border-radius: 10px;
  font-size: 12px;
  line-height: 18px;
  white-space: nowrap;
}
.mvb--buy {
  background: rgba(76, 175, 125, 0.16);
  color: #4caf7d;
}
.mvb--sell {
  background: rgba(212, 175, 90, 0.16);
  color: #d4af5a;
}
.mvb--fair {
  background: rgba(138, 162, 162, 0.12);
  color: #9fb3b3;
}
.mvb--hold {
  background: rgba(102, 119, 119, 0.12);
  color: #8895a0;
}
.mvb__deal {
  opacity: 0.85;
}
.mvb__conf {
  font-size: 9px;
}
.mvb__tip {
  font-size: 12px;
  line-height: 1.5;
}
</style>
