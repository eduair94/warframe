import type { FaqItem, FaqCategory } from '~/data/faq'

// Lazy loaders for the generated FAQ locale overrides (data/faq.locales/<locale>.json).
const overrides = import.meta.glob('../data/faq.locales/*.json')

/**
 * Localized FAQ content ({ faqs, categories }) for the current locale — the
 * machine-translated override when present, else the canonical English arrays.
 * Awaited in /faq so SSR emits the right language (and the FAQPage JSON-LD too).
 */
export async function useLocalizedFaq(
  enFaqs: FaqItem[],
  enCats: FaqCategory[],
): Promise<{ faqs: FaqItem[]; categories: FaqCategory[] }> {
  const { locale } = useI18n()
  const loc = locale.value
  if (!loc || loc === 'en') return { faqs: enFaqs, categories: enCats }
  const key = `../data/faq.locales/${loc}.json`
  const loader = overrides[key]
  if (!loader) return { faqs: enFaqs, categories: enCats }
  try {
    const mod = (await loader()) as { default?: { faqs: FaqItem[]; categories: FaqCategory[] } } & {
      faqs: FaqItem[]
      categories: FaqCategory[]
    }
    const d = mod.default ?? mod
    return { faqs: d.faqs ?? enFaqs, categories: d.categories ?? enCats }
  } catch {
    return { faqs: enFaqs, categories: enCats }
  }
}
