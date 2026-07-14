/**
 * Consumes warframe.market's public live socket (wss://ws.warframe.market/socket,
 * subprotocol "wfm") to power the /live "market pulse": online-trader counts, a
 * live orders/min rate, and a rolling ticker of the newest published orders.
 *
 * This module is the PURE state machine (ingest raw messages -> pulse); the actual
 * WebSocket connection (proxy-routed to pass Cloudflare) is wired in live.ts and
 * feeds messages here via ingest(). That keeps this unit-testable with no IO.
 */

export const WFM_SOCKET_URL = 'wss://ws.warframe.market/socket';
export const WFM_SUBPROTOCOL = 'wfm';

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
  ordersPerMin: number;
  recent: RecentOrder[]; // newest first, capped
  updatedAt: number;
}

export interface WfmNewOrdersOpts {
  /** itemId (wf.market id) -> our item metadata; null if unknown to us. */
  resolveItem: (itemId: string) => { url_name?: string; item_name?: string; thumb?: string } | null;
  recentCap?: number;
  now?: () => number;
}

export class WfmNewOrders {
  private online: OnlineReport = { connections: 0, authorizedUsers: 0 };
  private recent: RecentOrder[] = [];
  private stamps: number[] = []; // arrival times (ms) of every order, for orders/min
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
      this.online = {
        connections: Number(m.payload.connections) || 0,
        authorizedUsers: Number(m.payload.authorizedUsers) || 0,
      };
    } else if (route === '@wfm|event/subscriptions/newOrder' && m.payload) {
      this.addOrder(m.payload);
    }
    return route || null;
  }

  private addOrder(p: any): void {
    if (!p || (p.type !== 'buy' && p.type !== 'sell')) return;
    // Count every order toward the activity rate, even ones we can't name.
    this.stamps.push(this.now());
    const item = p.itemId ? this.resolveItem(String(p.itemId)) : null;
    if (!item || !item.url_name) return; // ticker only shows items we can name
    const at = Date.parse(p.createdAt) || this.now();
    this.recent.unshift({
      itemId: String(p.itemId || ''),
      url_name: item.url_name,
      item_name: item.item_name || item.url_name,
      thumb: item.thumb || '',
      type: p.type,
      platinum: Number(p.platinum) || 0,
      quantity: Number(p.quantity) || 1,
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
      ordersPerMin: this.stamps.length,
      recent: this.recent.slice(),
      updatedAt: this.now(),
    };
  }
}
