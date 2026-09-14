/**
 * Public market reads must revalidate the browser's HTTP cache: Cloudflare can
 * extend its max-age to hours even while the edge/API refresh every minute.
 * Keep SSR requests unchanged, and keep HTTP storage plus the service worker's
 * NetworkFirst offline fallback. No custom headers or cache-busting URLs.
 */
export function fetchMarketData<T = unknown>(url: string, options?: Parameters<typeof $fetch>[1]) {
  return $fetch<T>(url, typeof window === 'undefined'
    ? options
    : { ...options, cache: options?.cache ?? 'no-cache' })
}
