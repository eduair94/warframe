<template>
  <v-dialog v-model="dialog" max-width="90vw" :fullscreen="mobile" @click:outside="close">
    <v-card>
      <v-card-title class="d-flex justify-space-between align-center">
        Item Comparison
        <v-btn icon @click="close">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>
      <v-card-text>
        <v-data-table :headers="compareHeaders" :items="props.items ?? []" hide-default-footer class="elevation-1">
          <template #item.item_name="{ item }">
            <div class="d-flex justify-start align-center py-2">
              <img class="mr-3" width="40px" :src="'https://warframe.market/static/assets/' + item.thumb" />
              <a class="no_link white--text" target="_blank" :href="'https://warframe.market/items/' + item.url_name"
                >{{ item.item_name }}</a
              >
            </div>
          </template>
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
            <LastTransactionCell :last-completed="item.market.last_completed" />
          </template>
        </v-data-table>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="primary" variant="text" @click="close">Close</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { useDisplay } from 'vuetify';
import LastTransactionCell from './LastTransactionCell.vue';

const { mobile } = useDisplay();

const dialog = defineModel<boolean>({ required: true });

const props = defineProps<{
  items?: any[];
  headers?: { title: string; key: string; [k: string]: any }[];
}>();

const compareHeaders = computed(() => {
  // The parent hands us the full main-table header set. Drop the columns this
  // dialog has no cell slot for: tags/priceUpdate/drops.
  const allowed = [
    'item_name',
    'market.buy',
    'market.sell',
    'market.buyAvg',
    'market.sellAvg',
    'market.avg_price',
    'market.last_completed',
    'market.diff',
    'market.volume',
  ];
  return (props.headers ?? []).filter((h) => allowed.includes(h.key));
});

function close() {
  dialog.value = false;
}

function fixPrice(price: number) {
  if (!price) return 0;
  return Math.round(price * 100) / 100;
}
</script>
