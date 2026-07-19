<template>
  <span v-if="!path" class="spark spark--empty" :aria-label="emptyLabel">—</span>
  <span v-else class="spark" :class="'is-' + direction" role="img" :aria-label="ariaLabel">
    <svg :width="width" :height="height" :viewBox="`0 0 ${width} ${height}`" preserveAspectRatio="none" focusable="false">
      <path :d="areaPath" class="spark__area" />
      <path :d="path" class="spark__line" />
      <circle :cx="lastX" :cy="lastY" r="1.9" class="spark__dot" />
    </svg>
  </span>
</template>

<script setup lang="ts">
/**
 * Tiny inline price sparkline for the set ledger.
 *
 * Hand-rolled SVG rather than a chart library: the ledger renders one per row,
 * and the existing PriceHistoryChart is a 320x90 Material-blue block built for
 * the home dialog. Colour follows the series direction using the Orokin tokens
 * (cyan up / rose down / dim flat), matching the .up/.down/.flat conventions in
 * analytics.css.
 */
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    /** Series values, oldest first. */
    values?: number[]
    direction?: 'up' | 'down' | 'flat'
    width?: number
    height?: number
    /** Accessible description; the raw numbers are meaningless to a screen reader. */
    ariaLabel?: string
    emptyLabel?: string
  }>(),
  { values: () => [], direction: 'flat', width: 68, height: 22, ariaLabel: '', emptyLabel: '' },
)

/** Finite, positive points only — a 0 or NaN would flatten the whole scale. */
const clean = computed(() => (props.values || []).map((v) => Number(v)).filter((v) => Number.isFinite(v) && v > 0))

interface Pt {
  x: number
  y: number
}

const points = computed<Pt[]>(() => {
  const vals = clean.value
  if (vals.length < 2) return []
  const min = Math.min(...vals)
  const max = Math.max(...vals)
  // 1px inset top and bottom so the stroke and the end dot are never clipped.
  const pad = 2
  const usableH = Math.max(1, props.height - pad * 2)
  const span = max - min
  const stepX = props.width / (vals.length - 1)
  return vals.map((v, i) => ({
    x: +(i * stepX).toFixed(2),
    // A perfectly flat series has no span; centre it instead of dividing by 0.
    y: +(pad + (span === 0 ? usableH / 2 : (1 - (v - min) / span) * usableH)).toFixed(2),
  }))
})

const path = computed(() => {
  const pts = points.value
  if (!pts.length) return ''
  return pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x} ${p.y}`).join(' ')
})

/** Closed copy of the line, filled with a faint wash for legibility at 22px. */
const areaPath = computed(() => {
  const pts = points.value
  if (!pts.length) return ''
  const first = pts[0] as Pt
  const last = pts[pts.length - 1] as Pt
  return `${path.value} L${last.x} ${props.height} L${first.x} ${props.height} Z`
})

const lastX = computed(() => (points.value.length ? (points.value[points.value.length - 1] as Pt).x : 0))
const lastY = computed(() => (points.value.length ? (points.value[points.value.length - 1] as Pt).y : 0))
</script>

<style scoped>
.spark {
  display: inline-flex;
  align-items: center;
  line-height: 0;
  /* Token fallbacks keep the component usable outside an .an subtree. */
  --spark: var(--ink-dim, #868ca6);
}
.spark--empty {
  color: var(--ink-dim, #868ca6);
  font-size: 0.8rem;
  line-height: 1;
}
.spark.is-up {
  --spark: var(--energy, #35d6d0);
}
.spark.is-down {
  --spark: var(--rose, #d98a8a);
}
.spark__line {
  fill: none;
  stroke: var(--spark);
  stroke-width: 1.4;
  stroke-linejoin: round;
  stroke-linecap: round;
  /* preserveAspectRatio="none" scales the stroke with the box; opt out. */
  vector-effect: non-scaling-stroke;
}
.spark__area {
  fill: var(--spark);
  opacity: 0.12;
  stroke: none;
}
.spark__dot {
  fill: var(--spark);
}
</style>
