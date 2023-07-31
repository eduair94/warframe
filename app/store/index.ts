export const state = () => ({
  items: [],
  locations: [],
  fortex: {}
})

export const mutations = {
  setItems(state: any, payload: any) {
    state.items = payload
  },
  setLocations(state: any, payload: any) {
    state.locations = payload
  },
  setFortex(state: any, payload: any) {
    state.fortex = payload
  },
}

export const actions = {
  setItems(vuexContext: any, payload: any) {
    vuexContext.commit('setItems', payload)
  },
  setLocations(vuexContext: any, payload: any) {
    vuexContext.commit('setLocations', payload)
  },
  setFortex(vuexContext: any, payload: any) {
    vuexContext.commit('setFortex', payload)
  },
}

export const getters = {
  all_items(state: any): boolean {
    return state.items
  },
  locations(state: any) {
    return state.locations
  },
  fortex(state: any) {
    return state.fortex
  }
}
