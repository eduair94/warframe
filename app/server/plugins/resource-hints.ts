// SSR was hinting hundreds of unused route/locale chunks on every guide.
// Keep render-critical preloads and let NuxtLink prefetch on hover/focus.
// The bundled renderer does not honor manifest.prefetch=false, so filter its
// generated head tags before they are sent (and before Nitro caches the HTML).
export function removeSpeculativeScripts(head: string): string {
  return head.replace(/<link\b[^>]*>/gi, (tag) => {
    const attrs = new Map<string, string>()
    for (const match of tag.matchAll(/([\w-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g)) {
      attrs.set(match[1]!.toLowerCase(), match[2] ?? match[3] ?? match[4] ?? '')
    }
    return attrs.get('rel')?.toLowerCase() === 'prefetch'
      && attrs.get('as')?.toLowerCase() === 'script'
      && attrs.get('href')?.startsWith('/_nuxt/')
      ? '' : tag
  })
}

export default defineNitroPlugin((nitro) => {
  nitro.hooks.hook('render:html', (html) => {
    html.head = html.head.map(removeSpeculativeScripts)
  })
})
