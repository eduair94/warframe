import type { Request } from "express";

type InternalReadRequest = Pick<Request, "method" | "headers" | "path"> & {
  socket: Pick<Request["socket"], "remoteAddress" | "localPort">;
};

const LOOPBACK_ADDRESSES = new Set([
  "127.0.0.1",
  "::1",
  "::ffff:127.0.0.1",
]);
const LOOPBACK_HOST = /^(?:127\.0\.0\.1|\[::1\])(?::([0-9]{1,5}))?$/;
const PROXY_HEADER = /^(?:forwarded|x-forwarded-.*|cf-.*|x-real-ip|cdn-loop|true-client-ip|via)$/i;

/**
 * SSR and cache warming use direct loopback reads and must not share the public
 * IP quota. Cloudflared also connects locally, so the socket alone is not enough:
 * require a literal loopback Host for this listening port and reject every
 * proxy marker, even if empty.
 * Never use req.ip/hostname here: trust proxy can derive them from client input.
 * Keep writes, account routes and mutating build routes under their limiters.
 */
export function isDirectInternalRead(req: InternalReadRequest): boolean {
  if (req.method !== "GET" || !LOOPBACK_ADDRESSES.has(req.socket.remoteAddress)) {
    return false;
  }
  if (/^\/(?:build_|me(?:\/|$))/i.test(req.path)) return false;

  const host = req.headers.host;
  if (typeof host !== "string") return false;
  const match = LOOPBACK_HOST.exec(host);
  if (!match) return false;
  const port = match[1] === undefined ? 80 : Number(match[1]);
  if (port < 1 || port > 65535 || port !== req.socket.localPort) return false;

  return !Object.keys(req.headers).some((name) => PROXY_HEADER.test(name));
}
