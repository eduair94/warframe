import type { PageSeo } from './seo'

// Localized SEO copy overlay: PAGE_SEO_I18N[locale][path] = { title, description }.
// English lives in PAGE_SEO (seo.ts) and is the fallback for any locale/path not
// present here. Keys are the SAME normalized paths PAGE_SEO uses ('/', '/comparison',
// '/set', …). Populated per-locale by the translation pass; empty locales simply
// fall back to English, so it is always safe for this to be partial.
export const PAGE_SEO_I18N: Record<string, Record<string, PageSeo>> = {
  // filled per locale, e.g.
  // es: { '/comparison': { title: '…', description: '…' }, … },
}
