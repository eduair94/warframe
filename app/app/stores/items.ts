import { defineStore } from 'pinia'

export interface WarframeItem {
  item_name: string
  tags: string[]
  /** warframe.market url slug, e.g. "ash_prime_set" */
  url_name?: string
  /** warframe.market thumb path, e.g. "items/images/en/thumbs/x.<hash>.128x128.png" */
  thumb?: string
  [key: string]: unknown
}

interface ItemsState {
  items: WarframeItem[]
  locations: any[]
  fortex: Record<string, any>
}

export const useItemsStore = defineStore('items', {
  state: (): ItemsState => ({
    items: [],
    locations: [], // dead: never filled anywhere in the app (parity only)
    fortex: {},     // dead: never filled anywhere in the app (parity only)
  }),
  getters: {
    // old snake_case getter names -> camelCase (see SHARED CODE CONVENTIONS)
    allItems: (state): WarframeItem[] => state.items,
    allRelics: (state): WarframeItem[] =>
      state.items.filter((el) => el.tags.includes('relic')),
    allSets: (state): WarframeItem[] =>
      state.items.filter((el) => el.item_name.includes(' Set')),
    // Cross-reference maps: the riven list and drop tables carry STALE thumb
    // hashes (warframe.market rotates them); the freshly-synced catalog has the
    // current thumb. Look items up by url_name (preferred) or item_name to show
    // a working thumbnail. Used via the useItemThumb() composable.
    thumbByUrlName: (state): Record<string, string> => {
      const m: Record<string, string> = {}
      for (const i of state.items) if (i.url_name && i.thumb) m[i.url_name] = i.thumb
      return m
    },
    thumbByName: (state): Record<string, string> => {
      const m: Record<string, string> = {}
      for (const i of state.items) if (i.item_name && i.thumb) m[i.item_name] = i.thumb
      return m
    },
    // NOTE: old getters `locations`/`fortex` cannot be Pinia getters — they would
    // collide with the same-named state keys. They are dead passthroughs, so consumers
    // read `store.locations` / `store.fortex` directly off state (identical syntax).
  },
  actions: {
    // sole live fill path: default-layout SSR fetch calls this (was store.dispatch('setItems', data))
    setItems(payload: WarframeItem[]) {
      this.items = payload
    },
    // dead parity actions — no caller exists; keep so a future feature can fill them
    setLocations(payload: any[]) {
      this.locations = payload
    },
    setFortex(payload: Record<string, any>) {
      this.fortex = payload
    },
  },
})
