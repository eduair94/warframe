import { parseRecordedTimestamp } from './relative-time.ts'

/** Display the UTC calendar date of a recorded repository update. */
export function formatRepositoryDate(iso: string, locale: string): string {
  const timestamp = parseRecordedTimestamp(iso, Number.MAX_SAFE_INTEGER)
  return timestamp === null ? '—' : formatGuideReviewDate(new Date(timestamp).toISOString().slice(0, 10), locale)
}

/** A guide review is a calendar date, not a moment in the reader's timezone. */
export function formatGuideReviewDate(iso: string, locale: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso

  const date = new Date(`${iso}T00:00:00.000Z`)
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== iso) return iso

  try {
    return date.toLocaleDateString(locale === 'en' ? 'en-US' : locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      timeZone: 'UTC',
    })
  } catch {
    return iso
  }
}
