<template>
  <v-dialog
    v-model="dialog"
    max-width="90vw"
    :fullscreen="$vuetify.breakpoint.mobile"
    @click:outside="close"
  >
    <v-card dark>
      <v-card-title class="d-flex justify-space-between align-center">
        Item Comparison
        <v-btn icon @click="close">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>
      <v-card-text>
        <v-data-table
          :headers="headers"
          :items="items"
          hide-default-footer
          class="elevation-1"
        >
          <template #item.market.buyAvg="{ item }">
            {{ fixPrice(item.market.buyAvg) }}
          </template>
          <template #item.market.sellAvg="{ item }">
            {{ fixPrice(item.market.sellAvg) }}
          </template>
          <template #item.market.avg_price="{ item }">
            {{ fixPrice(item.market.avg_price) }}
          </template>
          <template #item.market.last_completed="{ item }">
            <LastTransactionCell
              :last-completed="item.market.last_completed"
            />
          </template>
        </v-data-table>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="primary" text @click="close">Close</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import Vue from 'vue';
import LastTransactionCell from './LastTransactionCell.vue';

export default Vue.extend({
  name: 'ItemComparison',
  components: {
    LastTransactionCell,
  },
  props: {
    value: {
      type: Boolean,
      required: true,
    },
    items: {
      type: Array,
      default: () => [],
    },
    headers: {
      type: Array,
      default: () => [],
    },
  },
  computed: {
    dialog: {
      get(): boolean {
        return this.value
      },
      set(val: boolean) {
        this.$emit('input', val)
      },
    },
  },
  methods: {
    close() {
      this.$emit('input', false)
    },
    fixPrice(price: number) {
      if (!price) return 0
      return Math.round(price * 100) / 100
    },
  },
})
</script>
