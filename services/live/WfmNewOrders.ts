/**
 * Consumes warframe.market's public live socket (wss://ws.warframe.market/socket,
 * subprotocol "wfm") to power the /live "market pulse": online-trader counts, a
 * live orders/min rate, and a rolling ticker of the newest published orders.
 *
 * This module is the PURE state machine (ingest raw messages -> pulse); the actual
 * WebSocket connection (through the fixed WFM egress, WFM_PROXY_URL) is wired in live.ts and
 * feeds messages here via ingest(). That keeps this unit-testable with no IO.
 */

export const WFM_SOCKET_URL = 'wss://ws.warframe.market/socket';
export const WFM_SUBPROTOCOL = 'wfm';
/** Cloudflare challenges a socket handshake with no User-Agent (ws sends none by default). */
export const WFM_SOCKET_USER_AGENT = 'warframe-analytics/1.0 (+https://warframe-app.digitalshopuy.com)';

const RECONNECT_BASE_MS = 4_000;
const RECONNECT_MAX_MS = 15 * 60_000;

/**
 * Delay before reconnecting after `failures` consecutive failed or short-lived
 * connections: 4 s, doubling, capped at 15 minutes (the REST breaker's
 * cooldown). A fixed 4 s retry made ~21,600 handshakes a day while Cloudflare
 * refused the API host.
 */
export function wfmSocketReconnectDelayMs(failures: number): number {
  return Math.min(RECONNECT_BASE_MS * 2 ** Math.max(0, failures), RECONNECT_MAX_MS);
}

/** The subscribe command the site sends to open the global new-orders feed. */
export function subscribeNewOrdersMsg(platform: string): string {
  return JSON.stringify({
    route: '@wfm|cmd/subscribe/newOrders',
    payload: { platform, crossplay: true },
    id: 'live',
  });
}

export interface RecentOrder {
  itemId: string;
  url_name: string;
  item_name: string;
  thumb: string;
  type: 'buy' | 'sell';
  platinum: number;
  quantity: number;
  rank?: number;
  platform: string;
  at: number; // epoch ms (order createdAt)
}

export interface OnlineReport {
  connections: number;
  authorizedUsers: number;
}

export interface MarketPulse {
  online: OnlineReport;
  onlineUpdatedAt: number; // last valid online report received; 0 before any report
  ordersPerMin: number;
  recent: RecentOrder[]; // newest first, capped
  updatedAt: number; // last valid source data received, epoch ms; 0 before any data
}

/** Accept numeric source fields without treating null, booleans or blanks as zero. */
function sourceNumber(value: unknown): number {
  if (typeof value !== 'number' && (typeof value !== 'string' || !value.trim())) return NaN;
  return Number(value);
}

export interface WfmNewOrdersOpts {
  /** itemId (wf.market id) -> our item metadata; null if unknown to us. */
  resolveItem: (itemId: string) => { url_name?: string; item_name?: string; thumb?: string } | null;
  recentCap?: number;
  now?: () => number;
}

export class WfmNewOrders {
  private online: OnlineReport = { connections: 0, authorizedUsers: 0 };
  private onlineUpdatedAt = 0;
  private recent: RecentOrder[] = [];
  private stamps: number[] = []; // arrival times (ms) of every order, for orders/min
  private updatedAt = 0;
  private readonly resolveItem: WfmNewOrdersOpts['resolveItem'];
  private readonly cap: number;
  private readonly now: () => number;

  constructor(o: WfmNewOrdersOpts) {
    this.resolveItem = o.resolveItem;
    this.cap = o.recentCap ?? 25;
    this.now = o.now ?? (() => Date.now());
  }

  /** Feed one raw socket frame. Returns the route (for logging) or null. */
  ingest(raw: string): string | null {
    let m: any;
    try { m = JSON.parse(raw); } catch { return null; }
    const route = m && m.route;
    if (route === '@wfm|event/reports/online' && m.payload) {
      const connections = sourceNumber(m.payload.connections);
      const authorizedUsers = sourceNumber(m.payload.authorizedUsers);
      if (!Number.isFinite(connections) || connections < 0 ||
          !Number.isFinite(authorizedUsers) || authorizedUsers < 0) return route;
      this.online = {
        connections,
        authorizedUsers,
      };
      const receivedAt = this.now();
      this.updatedAt = receivedAt;
      this.onlineUpdatedAt = receivedAt;
    } else if (route === '@wfm|event/subscriptions/newOrder' && m.payload) {
      this.addOrder(m.payload);
    }
    return route || null;
  }

  private addOrder(p: any): void {
    if (!p || (p.type !== 'buy' && p.type !== 'sell')) return;
    const platinum = sourceNumber(p.platinum);
    const quantity = p.quantity === undefined ? 1 : sourceNumber(p.quantity);
    if (typeof p.itemId !== 'string' || !p.itemId.trim() ||
        !Number.isFinite(platinum) || platinum <= 0 ||
        !Number.isFinite(quantity) || quantity <= 0) return;
    const receivedAt = this.now();
    this.updatedAt = receivedAt;
    // Count every order toward the activity rate, even ones we can't name.
    this.stamps.push(receivedAt);
    const item = p.itemId ? this.resolveItem(String(p.itemId)) : null;
    if (!item || !item.url_name) return; // ticker only shows items we can name
    const at = Date.parse(p.createdAt) || receivedAt;
    this.recent.unshift({
      itemId: String(p.itemId || ''),
      url_name: item.url_name,
      item_name: item.item_name || item.url_name,
      thumb: item.thumb || '',
      type: p.type,
      platinum,
      quantity,
      rank: typeof p.rank === 'number' ? p.rank : undefined,
      platform: String((p.user && p.user.platform) || p.platform || 'pc'),
      at,
    });
    if (this.recent.length > this.cap) this.recent.length = this.cap;
  }

  getPulse(): MarketPulse {
    const cut = this.now() - 60_000;
    this.stamps = this.stamps.filter((t) => t >= cut);
    return {
      online: this.online,
      onlineUpdatedAt: this.onlineUpdatedAt,
      ordersPerMin: this.stamps.length,
      recent: this.recent.slice(),
      updatedAt: this.updatedAt,
    };
  }
}
