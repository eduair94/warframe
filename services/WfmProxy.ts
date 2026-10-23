/** Explicit, stable egress for warframe.market; independent of the rotating proxy pool. */
export function readWfmProxyUrl(env: NodeJS.ProcessEnv = process.env): string | null {
  const value = env.WFM_PROXY_URL?.trim();
  if (!value) return null;

  try {
    const url = new URL(value);
    if (
      !['http:', 'https:', 'socks5:', 'socks5h:'].includes(url.protocol) ||
      !url.hostname ||
      (url.pathname !== '' && url.pathname !== '/') ||
      url.search || url.hash
    ) throw new Error('Invalid proxy URL');
    // Reject malformed credentials before transport libraries can echo the URL.
    decodeURIComponent(url.username);
    decodeURIComponent(url.password);
    // The SSH key restricts forwarding to api.warframe.market:443. Preserve
    // that hostname for SOCKS CONNECT: axios's socks5 scheme resolves locally
    // and would forward an IP that SSH correctly rejects. Undici already
    // resolves at the proxy, so both clients now use the same DNS behavior.
    if (url.protocol === 'socks5:') url.protocol = 'socks5h:';
    return url.toString();
  } catch {
    // Never include the value: authenticated proxy URLs contain secrets.
    throw new Error('WFM_PROXY_URL must be an HTTP, HTTPS, or SOCKS5 proxy URL without a path, query, or fragment');
  }
}

/** Credential-free proxy label for transport logs. */
export function proxyLabel(proxy: string | null): string {
  if (!proxy) return 'direct';
  try {
    const url = new URL(proxy);
    return `${url.protocol}//${url.host}`;
  } catch {
    return 'configured proxy';
  }
}
