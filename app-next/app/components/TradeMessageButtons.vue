<template>
  <div class="trade-message-buttons">
    <p class="text-caption text-grey mb-1">
      Warframe has no public API for its in-game chat, so nothing can post there automatically -
      copy a ready-to-paste trade message instead.
    </p>
    <div class="d-flex flex-wrap gap-10">
      <v-btn size="small" variant="outlined" color="green" :disabled="!sellPrice" @click="copy('sell')">
        <v-icon start size="small">mdi-content-copy</v-icon>
        Copy WTS message
      </v-btn>
      <v-btn size="small" variant="outlined" color="blue" :disabled="!buyPrice" @click="copy('buy')">
        <v-icon start size="small">mdi-content-copy</v-icon>
        Copy WTB message
      </v-btn>
      <span v-if="copied" class="text-caption text-green align-self-center">Copied!</span>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'TradeMessageButtons',
  props: {
    itemName: { type: String, required: true },
    sellPrice: { type: Number, default: 0 },
    buyPrice: { type: Number, default: 0 },
  },
  data() {
    return { copied: false };
  },
  methods: {
    buildMessage(direction: 'sell' | 'buy'): string {
      // WTS/WTB is the standard shorthand Warframe traders use in-game -
      // this mirrors that convention so the message pastes in unedited.
      const price = direction === 'sell' ? this.sellPrice : this.buyPrice;
      const verb = direction === 'sell' ? 'WTS' : 'WTB';
      return `${verb} ${this.itemName} :platinum: ${price} (price check warframe.market)`;
    },
    async copy(direction: 'sell' | 'buy') {
      const message = this.buildMessage(direction);
      try {
        if (navigator.clipboard) {
          await navigator.clipboard.writeText(message);
        } else {
          // Fallback for browsers without the async Clipboard API
          const el = document.createElement('textarea');
          el.value = message;
          el.style.position = 'fixed';
          el.style.opacity = '0';
          document.body.appendChild(el);
          el.select();
          document.execCommand('copy');
          document.body.removeChild(el);
        }
        this.copied = true;
        setTimeout(() => {
          this.copied = false;
        }, 2000);
      } catch (e) {
        // Clipboard permission denied or unavailable - nothing else to do
      }
    },
  },
});
</script>

<style scoped>
.gap-10 {
  gap: 10px;
}
</style>
