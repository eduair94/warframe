/**
 * @fileoverview warframe.market requests identify the project and never imitate a browser
 */

import { describe, it, expect } from '@jest/globals';
import { WFM_CLIENT_VERSION, wfmRequestHeaders, wfmUserAgent } from './WfmIdentity';

const BROWSER_HEADERS = [
  'origin', 'referer', 'sec-ch-ua', 'sec-ch-ua-mobile', 'sec-ch-ua-platform',
  'sec-fetch-dest', 'sec-fetch-mode', 'sec-fetch-site', 'x-requested-with',
  'x-session-id', 'priority', 'dnt', 'cache-control', 'pragma',
];

describe('wfmUserAgent', () => {
  it('names the project, its version, the site and the repository', () => {
    const ua = wfmUserAgent({});
    expect(ua).toBe(
      `WarframeMarketAnalytics/${WFM_CLIENT_VERSION} (+https://warframe-app.digitalshopuy.com; https://github.com/eduair94/warframe)`
    );
    expect(ua).not.toMatch(/Mozilla|Chrome|Safari|AppleWebKit|Gecko/);
  });

  it('accepts an explicit override and ignores a blank one', () => {
    expect(wfmUserAgent({ WFM_USER_AGENT: 'Custom/1.0 (+https://x.test)' })).toBe('Custom/1.0 (+https://x.test)');
    expect(wfmUserAgent({ WFM_USER_AGENT: '   ' })).toMatch(/^WarframeMarketAnalytics\//);
  });
});

describe('wfmRequestHeaders', () => {
  it('sends only the honest identity and JSON accept headers by default', () => {
    const headers = wfmRequestHeaders({}, {});
    expect(Object.keys(headers).sort()).toEqual(['Accept', 'Accept-Encoding', 'User-Agent']);
    expect(headers.Accept).toBe('application/json');
  });

  it('keeps the documented warframe.market headers a caller passes', () => {
    const headers = wfmRequestHeaders({ Language: 'ko', Platform: 'pc', Crossplay: 'true', 'Content-Type': 'application/json' }, {});
    expect(headers).toMatchObject({ Language: 'ko', Platform: 'pc', Crossplay: 'true', 'Content-Type': 'application/json' });
  });

  it('drops browser-imitation headers and a caller-supplied user-agent', () => {
    const custom: Record<string, string> = { 'user-agent': 'Mozilla/5.0 Chrome/120' };
    for (const name of BROWSER_HEADERS) custom[name] = 'x';
    const headers = wfmRequestHeaders(custom, {});
    const names = Object.keys(headers).map((n) => n.toLowerCase());
    for (const name of BROWSER_HEADERS) expect(names).not.toContain(name);
    expect(headers['User-Agent']).toMatch(/^WarframeMarketAnalytics\//);
    expect(names.filter((n) => n === 'user-agent')).toHaveLength(1);
  });

  it('skips null and undefined values', () => {
    expect(wfmRequestHeaders({ Language: undefined, Platform: null }, {})).not.toHaveProperty('Language');
  });
});
