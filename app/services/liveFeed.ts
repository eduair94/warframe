/**
 * Browser-only singleton wrapper over one Socket.IO connection to the
 * warframe-live server. Pages subscribe by url_name and get {book, verdict}
 * pushes; the socket auto-reconnects. SSR-safe: every entry short-circuits
 * off-browser so asyncData/SSR never touches it.
 */
import { io, Socket } from 'socket.io-client';

export interface LiveBook {
  url_name: string; bestBuy: number; bestSell: number; buyAvg: number; sellAvg: number;
  onlineBuyCount: number; onlineSellCount: number; updatedAt: number;
}
export interface Verdict {
  url_name: string; verdict: 'buy' | 'sell' | 'fair' | 'hold'; score: number; confidence: number;
  fv: number; bestBuy: number; bestSell: number; dealPct: number; flipMargin: number; reason: string;
}
export interface LiveUpdate { url_name: string; book: LiveBook; verdict: Verdict; }

type Cb = (u: LiveUpdate) => void;

const isBrowser = () => typeof window !== 'undefined';
let socket: Socket | null = null;
const listeners = new Map<string, Set<Cb>>();

export function getLiveUrl(): string {
  if (isBrowser() && (window as any).$nuxt?.$config?.liveURL) return (window as any).$nuxt.$config.liveURL;
  return 'http://localhost:3530';
}

function ensureSocket(): Socket | null {
  if (!isBrowser()) return null;
  if (socket) return socket;
  socket = io(getLiveUrl(), { transports: ['websocket'], reconnection: true });
  socket.on('update', (u: LiveUpdate) => {
    const set = listeners.get(u.url_name);
    if (set) set.forEach((cb) => cb(u));
  });
  socket.on('connect', () => {
    // re-subscribe every active room after a reconnect
    listeners.forEach((_set, url) => socket!.emit('subscribe', { url_name: url }));
  });
  return socket;
}

export function subscribe(url_name: string, cb: Cb): () => void {
  if (!isBrowser() || !url_name) return () => {};
  const s = ensureSocket();
  let set = listeners.get(url_name);
  if (!set) { set = new Set(); listeners.set(url_name, set); }
  const firstForUrl = set.size === 0;
  set.add(cb);
  if (s && firstForUrl && s.connected) s.emit('subscribe', { url_name });
  return () => {
    const cur = listeners.get(url_name);
    if (!cur) return;
    cur.delete(cb);
    if (cur.size === 0) {
      listeners.delete(url_name);
      if (s) s.emit('unsubscribe', { url_name });
    }
  };
}

export function isConnected(): boolean {
  if (!isBrowser()) return false;
  return !!socket && socket.connected;
}
