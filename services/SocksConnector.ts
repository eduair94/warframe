/**
 * @fileoverview undici-compatible connector for SOCKS5 proxies
 * @module services/SocksConnector
 *
 * undici's ProxyAgent only speaks HTTP CONNECT proxies - a socks5:// URI
 * silently falls through to a plain (non-proxied) connection. This builds a
 * custom `connect` function (the shape undici's Agent/ProxyAgent `connect`
 * option accepts) that tunnels through a SOCKS5 proxy via the `socks`
 * package, then upgrades to TLS itself for https targets.
 */

import * as tls from "tls";
import { SocksClient } from "socks";

type ConnectOptions = {
  hostname: string;
  protocol: string;
  port: string;
  servername?: string;
};
type ConnectCallback = (err: Error | null, socket: any) => void;

/**
 * Builds an undici `connect` function that tunnels through the given
 * socks5:// proxy URL (e.g. "socks5://user:pass@host:1080").
 *
 * @param proxyUrl - socks5:// proxy URL
 * @param tlsOptions - extra TLS options merged into the https upgrade (e.g. anti-detection cipher rotation)
 */
export function createSocksConnector(proxyUrl: string, tlsOptions: Record<string, unknown> = {}) {
  const url = new URL(proxyUrl);
  const proxyHost = url.hostname;
  const proxyPort = parseInt(url.port, 10) || 1080;
  const userId = url.username ? decodeURIComponent(url.username) : undefined;
  const password = url.password ? decodeURIComponent(url.password) : undefined;

  return function connect(options: ConnectOptions, callback: ConnectCallback): void {
    const destinationPort = parseInt(options.port, 10) || (options.protocol === "https:" ? 443 : 80);

    SocksClient.createConnection({
      proxy: { host: proxyHost, port: proxyPort, type: 5, userId, password },
      command: "connect",
      destination: { host: options.hostname, port: destinationPort },
      timeout: 15000,
    })
      .then(({ socket }) => {
        if (options.protocol !== "https:") {
          callback(null, socket);
          return;
        }

        const tlsSocket = tls.connect({
          socket,
          servername: options.servername || options.hostname,
          ...tlsOptions,
        });
        tlsSocket.once("secureConnect", () => callback(null, tlsSocket));
        tlsSocket.once("error", (err) => callback(err, null));
      })
      .catch((err) => callback(err instanceof Error ? err : new Error(String(err)), null));
  };
}
