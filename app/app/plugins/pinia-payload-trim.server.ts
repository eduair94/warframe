/**
 * Keeps the item catalogue out of the Pinia hydration payload.
 *
 * @pinia/nuxt serialises the whole store tree into the HTML document on
 * `app:rendered` so the client can restore it. The items store holds the full
 * ~3 800-item catalogue, so every document carried it a SECOND time — once as
 * the packed `app-items` async-data payload, once again expanded inside
 * `payload.pinia`. That doubled the biggest thing on the page.
 *
 * It is pure duplication: app.vue's setup runs on the client too, and it fills
 * the store from the packed payload (`unpackCatalogue`) before any page
 * component renders. So the serialised copy is never the source of truth — it
 * is only weight.
 *
 * This plugin is server-only and runs after @pinia/nuxt's own `app:rendered`
 * hook, replacing the catalogue with an empty array in the payload copy. The
 * live store is left untouched (a shallow clone is written to the payload), and
 * every other store still hydrates normally.
 */
export default defineNuxtPlugin({
  name: 'pinia-payload-trim',
  enforce: 'post',
  hooks: {
    'app:rendered'() {
      const nuxtApp = useNuxtApp()
      const pinia = nuxtApp.payload.pinia as Record<string, any> | undefined
      if (!pinia?.items?.items?.length) return
      nuxtApp.payload.pinia = {
        ...pinia,
        items: { ...pinia.items, items: [] },
      }
    },
  },
})
