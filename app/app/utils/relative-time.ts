const formatters = new Map<string, Intl.RelativeTimeFormat>()
const localeTags: Record<string, string> = {
  en: 'en-US', es: 'es-ES', pt: 'pt-BR', de: 'de-DE', fr: 'fr-FR', ru: 'ru-RU',
  ko: 'ko-KR', ja: 'ja-JP', 'zh-hans': 'zh-Hans', 'zh-hant': 'zh-Hant',
  pl: 'pl-PL', it: 'it-IT', uk: 'uk-UA',
}

/** A recorded update must be an actual instant, with an explicit timezone. */
export function parseRecordedTimestamp(value: unknown, nowMs: number): number | null {
  if (!Number.isFinite(nowMs) || typeof value !== 'string') return null
  const match = /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})(?:\.\d{1,3})?(Z|[+-]\d{2}:\d{2})$/.exec(value)
  if (!match) return null
  const timestamp = Date.parse(value)
  if (!Number.isFinite(timestamp) || timestamp > nowMs) return null
  const zone = match[2]!
  const offset = zone === 'Z' ? 0
    : (Number(zone.slice(1, 3)) * 60 + Number(zone.slice(4, 6))) * (zone[0] === '+' ? 1 : -1)
  // Date.parse can normalize impossible dates, such as February 30, into March.
  if (new Date(timestamp + offset * 60_000).toISOString().slice(0, 19) !== match[1]) return null
  return timestamp
}

// Months and years are approximate elapsed durations, as with dayjs.fromNow().
const units: readonly [Intl.RelativeTimeFormatUnit, number][] = [
  ['year', 365 * 86_400_000], ['month', 30 * 86_400_000], ['day', 86_400_000],
  ['hour', 3_600_000], ['minute', 60_000], ['second', 1_000],
]

/** Locale is explicit: concurrent SSR requests never change a shared language. */
export function formatRelativeTime(timestampMs: number, nowMs: number, locale: string): string {
  if (!Number.isFinite(timestampMs) || !Number.isFinite(nowMs) || timestampMs > nowMs) return ''
  const tag = Object.hasOwn(localeTags, locale) ? localeTags[locale]! : localeTags.en!
  let formatter = formatters.get(tag)
  if (!formatter) {
    formatter = new Intl.RelativeTimeFormat(tag, { numeric: 'auto' })
    formatters.set(tag, formatter)
  }
  const elapsed = nowMs - timestampMs
  const [unit, duration] = units.find(([, duration]) => elapsed >= duration) ?? units[units.length - 1]!
  return formatter.format(-Math.floor(elapsed / duration), unit)
}
