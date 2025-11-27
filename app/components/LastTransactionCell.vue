<template>
  <div>
    <div
      v-if="lastCompleted"
      class="last-transaction-cell"
      @click="$emit('click')"
    >
      {{ fixPrice(lastCompleted.avg_price) }}
      <v-icon v-if="showIcon" small color="primary">mdi-information-outline</v-icon>
    </div>
    <div v-else>-</div>
  </div>
</template>

<script lang="ts">
import Vue, { PropType } from 'vue';

interface LastCompleted {
  datetime: string;
  volume: number;
  avg_price: number;
  min_price: number;
  max_price: number;
  open_price: number;
  closed_price: number;
}

export default Vue.extend({
  name: 'LastTransactionCell',
  props: {
    lastCompleted: {
      type: Object as PropType<LastCompleted | null>,
      default: null,
    },
    showIcon: {
      type: Boolean,
      default: false,
    },
    clickable: {
      type: Boolean,
      default: false,
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
.last-transaction-cell {
  cursor: pointer;
  text-decoration: underline;
  color: #1976d2;
}
</style>
