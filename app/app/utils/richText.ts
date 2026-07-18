// Minimal, safe inline rich-text used by the knowledge-center pages. Expands a
// tiny known grammar over ESCAPED text — never passes raw HTML through — so it's
// safe to v-html the result. Inputs are our own authored guide/FAQ data.
//   **bold**            -> <strong>
//   `code`              -> <code>
//   [label](/route)     -> internal <a> (SPA nav happens via a global click
//                          handler is NOT set; these are plain <a> so they do a
//                          normal navigation — fine for content links, and the
//                          locale prefix is applied by the caller where needed)
//   [label](https://…)  -> external <a target=_blank rel=noopener>
export function escapeHtml(s: string): string {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

export function renderRich(input: string): string {
  let s = escapeHtml(input)
  // internal links first (start with a single slash)
  s = s.replace(/\[([^\]]+)\]\((\/[^)]+)\)/g, (_m, label, href) => `<a class="ga-inline" href="${href}">${label}</a>`)
  // external links
  s = s.replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, (_m, label, href) => `<a class="ga-inline" href="${href}" target="_blank" rel="noopener">${label}</a>`)
  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  s = s.replace(/`([^`]+)`/g, '<code>$1</code>')
  return s
}

/** Strip the rich grammar down to plain text (for JSON-LD, meta, aria). */
export function stripRich(input: string): string {
  return String(input || '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
}
