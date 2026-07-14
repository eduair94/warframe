<template>
  <div class="my-4">
    <h1 class="text-h4 mb-2">My Portfolio</h1>
    <p class="text-body-2 mb-4">
      Track items you own or want to watch, and get a browser notification when their sell
      price crosses a threshold you set — or when an item hits its <strong>all-time low</strong>
      in our long price history (something warframe.market's 90-day chart can't tell you).
      This is stored only in this browser (no account needed) - clearing your browser data
      clears your list.
    </p>

    <v-card class="pa-4 mb-4" outlined>
      <div class="d-flex flex-wrap align-center gap-10">
        <v-combobox
          v-model="itemToAdd"
          label="Add an item to your portfolio"
          class="add-input"
          :items="allItems.map((el) => el.item_name)"
          hide-details
          dense
          outlined
        ></v-combobox>
        <v-btn color="primary" :disabled="!itemToAdd" @click="addItem">
          <v-icon left small>mdi-plus</v-icon> Add
        </v-btn>
        <v-btn
          v-if="notificationPermission !== 'granted'"
          color="secondary"
          outlined
          @click="enableAlerts"
        >
          <v-icon left small>mdi-bell-outline</v-icon>
          Enable price alerts
        </v-btn>
        <span v-else class="text-caption d-flex align-center">
          <v-icon small color="green" class="mr-1">mdi-bell-check</v-icon>
          Alerts enabled - checked whenever this page is open
        </span>
      </div>
    </v-card>

    <v-alert v-if="notificationPermission === 'unsupported'" type="info" dense outlined>
      Your browser doesn't support notifications. Thresholds are still saved and shown here.
    </v-alert>

    <div v-if="!watchlist.length" class="text-body-2 grey--text">
      Your portfolio is empty. Search for an item above to start tracking it.
    </div>

    <v-simple-table v-else class="portfolio-table">
      <template #default>
        <thead>
          <tr>
            <th>Item</th>
            <th>Owned Qty</th>
            <th>Sell Price</th>
            <th>Value</th>
            <th>Alert Below</th>
            <th>Alert Above</th>
            <th>At All-Time Low</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="entry in enrichedWatchlist" :key="entry.url_name">
            <td>
              <nuxt-link :to="'/set/' + entry.url_name" class="no_link">{{ entry.item_name }}</nuxt-link>
            </td>
            <td>
              <v-text-field
                :value="entry.ownedQty"
                type="number"
                dense
                hide-details
                style="width: 80px"
                @change="(v) => setField(entry.url_name, 'ownedQty', Number(v) || 0)"
              ></v-text-field>
            </td>
            <td>{{ entry.currentSell != null ? entry.currentSell : '-' }}</td>
            <td>{{ entry.value != null ? entry.value.toFixed(0) : '-' }}</td>
            <td>
              <v-text-field
                :value="entry.alertBelow"
                type="number"
                dense
                hide-details
                placeholder="none"
                style="width: 90px"
                @change="(v) => setField(entry.url_name, 'alertBelow', v === '' ? null : Number(v))"
              ></v-text-field>
            </td>
            <td>
              <v-text-field
                :value="entry.alertAbove"
                type="number"
                dense
                hide-details
                placeholder="none"
                style="width: 90px"
                @change="(v) => setField(entry.url_name, 'alertAbove', v === '' ? null : Number(v))"
              ></v-text-field>
            </td>
            <td>
              <div class="d-flex align-center">
                <v-checkbox
                  :input-value="entry.alertAtl"
                  dense
                  hide-details
                  class="ma-0 pa-0 atl-check"
                  color="#4caf7d"
                  @change="(v) => setField(entry.url_name, 'alertAtl', !!v)"
                ></v-checkbox>
                <span v-if="entry.pctFromAtl != null" class="text-caption" :class="entry.pctFromAtl <= 3 ? 'green--text' : 'grey--text'">
                  {{ entry.pctFromAtl <= 3 ? 'at low!' : '+' + entry.pctFromAtl.toFixed(0) + '%' }}
                </span>
                <span v-else class="text-caption grey--text">—</span>
              </div>
            </td>
            <td>
              <v-btn icon small @click="removeItem(entry.url_name)">
                <v-icon small>mdi-close</v-icon>
              </v-btn>
            </td>
          </tr>
        </tbody>
        <tfoot>
          <tr>
            <td colspan="3" class="text-right font-weight-bold">Total portfolio value:</td>
            <td class="font-weight-bold">{{ totalValue.toFixed(0) }}p</td>
            <td colspan="4"></td>
          </tr>
        </tfoot>
      </template>
    </v-simple-table>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { mapGetters } from 'vuex';
import {
  checkAlerts,
  getWatchlist,
  removeFromWatchlist,
  requestNotificationPermission,
  toggleWatch,
  updateEntry,
  WatchlistEntry,
} from '../services/portfolio';

export default Vue.extend({
  name: 'PortfolioPage',
  async asyncData({ $axios, $config }: any) {
    // Long-history analytics (atl / pctFromAtl) power the all-time-low alert -
    // a signal warframe.market can't give (its chart caps at 90 days).
    try {
      const data = await $axios.get(`${$config.apiURL}/market_analytics`).then((res: any) => res.data);
      return { analytics: (data && data.items) || [] };
    } catch (e) {
      return { analytics: [] };
    }
  },
  data() {
    return {
      watchlist: [] as WatchlistEntry[],
      analytics: [] as any[],
      itemToAdd: '',
      notificationPermission: 'default' as string,
      alertInterval: null as ReturnType<typeof setInterval> | null,
    };
  },
  computed: {
    ...mapGetters({ allItems: 'all_items' }),
    itemsByName(): Record<string, any> {
      const map: Record<string, any> = {};
      (this.allItems as any[]).forEach((i) => {
        map[i.item_name] = i;
      });
      return map;
    },
    itemsByUrlName(): Record<string, any> {
      const map: Record<string, any> = {};
      (this.allItems as any[]).forEach((i) => {
        map[i.url_name] = i;
      });
      return map;
    },
    analyticsByUrl(): Record<string, any> {
      const map: Record<string, any> = {};
      (this.analytics as any[]).forEach((a) => {
        map[a.url_name] = { atl: a.atl, pctFromAtl: a.pctFromAtl };
      });
      return map;
    },
    enrichedWatchlist() {
      return this.watchlist.map((entry) => {
        const live = this.itemsByUrlName[entry.url_name];
        const currentSell = live?.market?.sell ?? null;
        const a = this.analyticsByUrl[entry.url_name];
        return {
          ...entry,
          currentSell,
          value: currentSell != null ? currentSell * (entry.ownedQty || 0) : null,
          pctFromAtl: a && typeof a.pctFromAtl === 'number' ? a.pctFromAtl : null,
        };
      });
    },
    totalValue(): number {
      return this.enrichedWatchlist.reduce((sum, e) => sum + (e.value || 0), 0);
    },
  },
  mounted() {
    this.refresh();
    if (typeof window !== 'undefined' && 'Notification' in window) {
      this.notificationPermission = Notification.permission;
    } else {
      this.notificationPermission = 'unsupported';
    }
    if (this.notificationPermission === 'granted') {
      this.runAlertCheck();
      // Re-check periodically while the tab stays open - there's no push
      // infrastructure, so this only fires while the page is open (see
      // ANTI_DETECTION_README limitations noted for R1 in the audit).
      this.alertInterval = setInterval(() => this.runAlertCheck(), 60000);
    }
  },
  beforeDestroy() {
    if (this.alertInterval) clearInterval(this.alertInterval);
  },
  methods: {
    refresh() {
      this.watchlist = getWatchlist();
    },
    addItem() {
      const item = this.itemsByName[this.itemToAdd as any];
      if (!item) return;
      toggleWatch({ url_name: item.url_name, item_name: item.item_name });
      this.itemToAdd = '';
      this.refresh();
    },
    removeItem(urlName: string) {
      removeFromWatchlist(urlName);
      this.refresh();
    },
    setField(urlName: string, field: keyof WatchlistEntry, value: any) {
      updateEntry(urlName, { [field]: value } as any);
      this.refresh();
    },
    async enableAlerts() {
      const result = await requestNotificationPermission();
      this.notificationPermission = result;
      if (result === 'granted') {
        this.runAlertCheck();
        if (!this.alertInterval) {
          this.alertInterval = setInterval(() => this.runAlertCheck(), 60000);
        }
      }
    },
    runAlertCheck() {
      checkAlerts(this.allItems as any[], this.analyticsByUrl);
    },
  },
});
</script>

<style scoped>
.add-input {
  max-width: 320px;
}
.portfolio-table th,
.portfolio-table td {
  white-space: nowrap;
}
.atl-check {
  flex: 0 0 auto;
  margin-right: 4px !important;
}
</style>
