/**
 * Resolves the API base URL for DATA FETCHES.
 *
 * On the SERVER (SSR) this returns the INTERNAL origin (127.0.0.1:3529 by
 * default). SSR data fetches then hit the API directly on the same box instead
 * of the public Cloudflare URL — which previously round-tripped every SSR fetch
 * (including the ~2 MB item catalogue pulled on every page load via app.vue) out
 * to the edge, through the tunnel, back to this very box, and all the way back,
 * transferring the payload twice over the public internet per render.
 *
 * On the CLIENT it returns the PUBLIC apiURL, which is the origin the browser
 * must actually reach.
 *
 * ONLY use the result for $fetch / useFetch / useAsyncData. NEVER interpolate it
 * into markup the browser loads (href/src/etc.) — on the server the value is a
 * localhost URL the browser can't reach.
 */
export function useApiBase(): string {
  const config = useRuntimeConfig()
  if (import.meta.server) {
    return (config.apiInternal as string) || (config.public.apiURL as string)
  }
  return config.public.apiURL as string
}
