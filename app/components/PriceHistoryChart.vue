<template>
  <div class="price-history-chart">
    <div v-if="points.length < 2" class="empty-state">
      <v-icon small color="grey">mdi-chart-line</v-icon>
      <span>Not enough history yet - check back after a couple of days.</span>
    </div>
    <template v-else>
      <div class="trend-row">
        <span class="trend-badge" :class="trendClass">
          <v-icon small :color="trendColor">{{ trendIcon }}</v-icon>
          {{ trendLabel }}
        </span>
        <span class="range-label">{{ points.length }}-day avg price trend</span>
      </div>

      <svg
        :viewBox="`0 0 ${width} ${height}`"
        class="chart-svg"
        role="img"
        :aria-label="`Average price over the last ${points.length} days, from ${fixPrice(points[0].avg_price)} to ${fixPrice(points[points.length - 1].avg_price)} platinum`"
      >
        <title>Price history</title>
        <line
          :x1="padding"
          :y1="height - padding"
          :x2="width - padding"
          :y2="height - padding"
          class="baseline"
        />
        <polyline :points="linePoints" class="price-line" />
        <circle :cx="lastX" :cy="lastY" r="4" class="endpoint" />
      </svg>

      <!-- Accessible data table fallback, mirrors the chart -->
      <details class="table-fallback">
        <summary>View as table</summary>
        <v-simple-table dense>
          <template #default>
            <thead>
              <tr>
                <th>Date</th>
                <th>Avg Price</th>
                <th>Buy</th>
                <th>Sell</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="p in reversedPoints" :key="p.date">
                <td>{{ p.date }}</td>
                <td>{{ fixPrice(p.avg_price) }}</td>
                <td>{{ fixPrice(p.buy) }}</td>
                <td>{{ fixPrice(p.sell) }}</td>
              </tr>
            </tbody>
          </template>
        </v-simple-table>
      </details>
    </template>
  </div>
</template>

<script lang="ts">
import Vue, { PropType } from 'vue';

interface PricePoint {
  date: string;
  buy: number;
  sell: number;
  avg_price: number;
  volume: number;
}

interface Trend {
  direction: 'up' | 'down' | 'flat';
  changePercent: number;
}

export default Vue.extend({
  name: 'PriceHistoryChart',
  props: {
    points: {
      type: Array as PropType<PricePoint[]>,
      default: () => [],
    },
    trend: {
      type: Object as PropType<Trend | null>,
      default: null,
    },
  },
  data() {
    return {
      width: 320,
      height: 90,
      padding: 8,
    };
  },
  computed: {
    reversedPoints(): PricePoint[] {
      return [...this.points].reverse();
    },
    priceRange(): { min: number; max: number } {
      const prices = this.points.map((p) => p.avg_price);
      const min = Math.min(...prices);
      const max = Math.max(...prices);
      // Avoid a zero-height range collapsing the line to a flat midline
      return min === max ? { min: min - 1, max: max + 1 } : { min, max };
    },
    linePoints(): string {
      const { min, max } = this.priceRange;
      const usableWidth = this.width - this.padding * 2;
      const usableHeight = this.height - this.padding * 2;
      const n = this.points.length;

      return this.points
        .map((p, i) => {
          const x = this.padding + (n === 1 ? 0 : (i / (n - 1)) * usableWidth);
          const t = (p.avg_price - min) / (max - min);
          const y = this.padding + (1 - t) * usableHeight;
          return `${x.toFixed(1)},${y.toFixed(1)}`;
        })
        .join(' ');
    },
    lastX(): number {
      return this.width - this.padding;
    },
    lastY(): number {
      const { min, max } = this.priceRange;
      const last = this.points[this.points.length - 1];
      const usableHeight = this.height - this.padding * 2;
      const t = (last.avg_price - min) / (max - min);
      return this.padding + (1 - t) * usableHeight;
    },
    trendIcon(): string {
      if (!this.trend) return 'mdi-minus';
      return { up: 'mdi-trending-up', down: 'mdi-trending-down', flat: 'mdi-trending-neutral' }[this.trend.direction];
    },
    trendColor(): string {
      if (!this.trend) return 'grey';
      return { up: 'green', down: 'red', flat: 'grey' }[this.trend.direction];
    },
    trendClass(): string {
      return this.trend ? `trend-${this.trend.direction}` : '';
    },
    trendLabel(): string {
      if (!this.trend) return '';
      const pct = Math.abs(this.trend.changePercent).toFixed(1);
      if (this.trend.direction === 'flat') return `Flat (±${pct}%)`;
      return `${this.trend.direction === 'up' ? '+' : '-'}${pct}%`;
    },
  },
  methods: {
    fixPrice(price: number): number {
      if (!price) return 0;
      return Math.round(price * 100) / 100;
    },
  },
});
</script>

<style scoped>
.price-history-chart {
  width: 100%;
}
.empty-state {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #9e9e9e;
  font-size: 0.85rem;
  padding: 12px 0;
}
.trend-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
}
.trend-badge {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  font-weight: 600;
  font-size: 0.85rem;
}
.trend-up {
  color: #2e7d32;
}
.trend-down {
  color: #c62828;
}
.trend-flat {
  color: #757575;
}
.range-label {
  font-size: 0.75rem;
  color: #9e9e9e;
}
.chart-svg {
  width: 100%;
  height: 90px;
  display: block;
}
.baseline {
  stroke: rgba(128, 128, 128, 0.25);
  stroke-width: 1;
}
.price-line {
  fill: none;
  stroke: #1976d2;
  stroke-width: 2;
  stroke-linejoin: round;
  stroke-linecap: round;
}
.endpoint {
  fill: #1976d2;
}
.table-fallback {
  margin-top: 6px;
  font-size: 0.8rem;
}
.table-fallback summary {
  cursor: pointer;
  color: #1976d2;
}
</style>
