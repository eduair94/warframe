/**
 * @fileoverview How this project identifies itself to warframe.market
 * @module services/WfmIdentity
 *
 * warframe.market's third-party rules (https://docs.warframe.market/docs/rules/overview/):
 *
 *   "Every application should use a dedicated and descriptive User-Agent header."
 *   "Do not disguise your application as a regular browser or another application."
 *   "Applications that hide their identity, impersonate browsers, or intentionally
 *    make traffic difficult to classify may be blocked."
 *
 * Until 2026-11 every request here carried randomized Chrome user-agents,
 * `sec-ch-ua*` / `sec-fetch-*`, a forged `Origin` and `Referer` of
 * https://warframe.market, `x-requested-with`, a fake session id and a shuffled
 * TLS cipher order. Each IP that sent that traffic was challenged by Cloudflare
 * and stayed challenged for weeks (.11 2026-10-02, .10 10-18, box83 10-25,
 * box147 11-03). So every warframe.market request (REST through undici or axios,
 * and the live WebSocket) now sends the same honest identity and nothing that
 * imitates a browser.
 *
 * Only the warframe.market API host is affected. Other hosts keep their headers.
 */

/** Bump when the client's request behaviour changes, so warframe.market can tell versions apart. */
export const WFM_CLIENT_VERSION = '2.0.0';

const SITE_URL = 'https://warframe-app.digitalshopuy.com';
const REPO_URL = 'https://github.com/eduair94/warframe';

/** Dedicated, descriptive User-Agent in the format the warframe.market rules give as an example. */
export function wfmUserAgent(env: NodeJS.ProcessEnv = process.env): string {
  const override = env.WFM_USER_AGENT?.trim();
  if (override) return override;
  return `WarframeMarketAnalytics/${WFM_CLIENT_VERSION} (+${SITE_URL}; ${REPO_URL})`;
}

/**
 * Caller headers that keep their meaning on warframe.market (documented global
 * headers, request bodies, auth). Anything else a caller passes is dropped, so
 * no code path can reintroduce browser imitation for this host.
 */
const PASS_THROUGH = new Set(['language', 'platform', 'crossplay', 'content-type', 'authorization']);

/**
 * Complete header set for one warframe.market request.
 *
 * No `Cache-Control: no-cache` either: endpoints such as `/v2/orders/recent`
 * are cached upstream for a minute, and bypassing that cache costs their
 * origin a request for nothing.
 */
export function wfmRequestHeaders(
  custom: Record<string, unknown> = {},
  env: NodeJS.ProcessEnv = process.env
): Record<string, string> {
  const headers: Record<string, string> = {
    'User-Agent': wfmUserAgent(env),
    Accept: 'application/json',
    'Accept-Encoding': 'gzip, deflate, br',
  };
  for (const [name, value] of Object.entries(custom)) {
    if (value === undefined || value === null) continue;
    if (PASS_THROUGH.has(name.toLowerCase())) headers[name] = String(value);
  }
  return headers;
}
