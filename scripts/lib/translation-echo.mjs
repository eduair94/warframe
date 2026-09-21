const normalize = (value) => value.normalize('NFC').replace(/\s+/g, ' ').trim()

/** Catch a provider returning the English article; this is not language detection. */
export function assertTranslationNotEcho(source, translated, language) {
  if (/^(?:en(?:-|$)|English\b)/i.test(language)) return
  // Leave malformed batches to the caller's existing shape/length validation.
  if (!Array.isArray(translated) || translated.length !== source.length) return

  let prose = 0, echoed = 0
  for (let index = 0; index < source.length; index++) {
    const original = normalize(source[index])
    // Short headings, item names, numeric tables and links can legitimately stay
    // identical. Require several substantial prose fields before rejecting.
    if (original.length < 80 || (original.match(/[a-z]+(?:'[a-z]+)?/gi) || []).length < 12
      || !/[.!?](?:\s|$)/.test(original)) continue
    prose++
    if (typeof translated[index] === 'string' && normalize(translated[index]) === original) echoed++
  }
  if (prose >= 5 && echoed / prose >= 0.8) {
    throw new Error(`Translation source echo for ${language}: ${echoed}/${prose} long prose fields remain English; existing snapshot preserved`)
  }
}
