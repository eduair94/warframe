import { describe, expect, it } from '@jest/globals';
import { proxyLabel, readWfmProxyUrl } from './WfmProxy';

describe('fixed warframe.market proxy configuration', () => {
  it('is optional and accepts HTTP(S) and SSH SOCKS egress', () => {
    expect(readWfmProxyUrl({})).toBeNull();
    expect(readWfmProxyUrl({ WFM_PROXY_URL: ' ' })).toBeNull();
    for (const url of ['http://localhost:8888/', 'https://localhost:8888/', 'socks5h://127.0.0.1:27028']) {
      expect(readWfmProxyUrl({ WFM_PROXY_URL: url })).toBe(url);
    }
    expect(readWfmProxyUrl({ WFM_PROXY_URL: 'socks5://127.0.0.1:27028' }))
      .toBe('socks5h://127.0.0.1:27028');
  });

  it('preserves valid authentication without exposing it in labels', () => {
    const url = 'socks5://sync:secret%40value@127.0.0.1:27028';
    expect(readWfmProxyUrl({ WFM_PROXY_URL: url })).toBe(url.replace('socks5:', 'socks5h:'));
    expect(proxyLabel(url)).toBe('socks5://127.0.0.1:27028');
  });

  it.each([
    'invalid-secret', 'file:///secret', 'ftp://user:secret@host',
    'http://user:secret@host/path', 'http://user:secret@host?token=secret',
    'http://user:secret@host#secret', 'socks5://user:%ZZsecret@host:1080',
  ])('rejects malformed egress without echoing credentials: case %#', (url) => {
    let error: Error | undefined;
    try { readWfmProxyUrl({ WFM_PROXY_URL: url }); } catch (e) { error = e as Error; }
    expect(error?.message).toMatch(/WFM_PROXY_URL/);
    expect(error?.message).not.toContain('secret');
  });
});
