/**
 * Background Web Push evaluator (Spec B). Runs in the REST process (server.ts)
 * on an interval, like CacheWarmer. Each pass:
 *   1. self-fetches the already-warm /market_analytics (one cheap request) for
 *      sell + pctFromAtl + atl per item,
 *   2. evaluates every stored subscription's alerts (pure pushEval),
 *   3. sends a Web Push per crossing and persists the updated notified flags,
 *   4. prunes subscriptions whose endpoint is gone (404/410).
 *
 * Disabled unless VAPID keys are configured — the feature flag is "keys present".
 */
import axios from "axios";
import webpush from "web-push";
import { PushSubscriptionService } from "./PushSubscriptionService";
import { evaluateSubscription, type PriceMap } from "./pushEval";

export class PushAlertService {
  private enabled = false;
  private publicKey = "";
  private timer: NodeJS.Timeout | null = null;

  constructor(
    private port: number,
    private subs: PushSubscriptionService = new PushSubscriptionService()
  ) {
    const pub = process.env.VAPID_PUBLIC_KEY;
    const priv = process.env.VAPID_PRIVATE_KEY;
    const subject = process.env.VAPID_SUBJECT || "mailto:admin@warframe-app.local";
    if (pub && priv) {
      try {
        webpush.setVapidDetails(subject, pub, priv);
        this.enabled = true;
        this.publicKey = pub;
      } catch (e: any) {
        console.error("[push] invalid VAPID config — Web Push disabled:", e?.message);
      }
    } else {
      console.warn("[push] VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY not set — Web Push disabled");
    }
  }

  isEnabled(): boolean {
    return this.enabled;
  }
  getPublicKey(): string {
    return this.publicKey;
  }

  /** Expose the subscription store so routes reuse the same instance. */
  subscriptions(): PushSubscriptionService {
    return this.subs;
  }

  async fetchPriceMap(): Promise<PriceMap | null> {
    try {
      const res = await axios.get(`http://127.0.0.1:${this.port}/market_analytics`, {
        timeout: 60000,
      });
      const items: any[] = res.data?.items || [];
      const map: PriceMap = {};
      for (const it of items) {
        if (!it?.url_name) continue;
        map[it.url_name] = { sell: it.sell, pctFromAtl: it.pctFromAtl, atl: it.atl };
      }
      return map;
    } catch (e: any) {
      console.error("[push] market_analytics fetch failed:", e?.message);
      return null;
    }
  }

  private async send(sub: { endpoint: string; keys: { p256dh: string; auth: string } }, payload: object): Promise<void> {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: sub.keys },
        JSON.stringify(payload)
      );
    } catch (e: any) {
      const code = e?.statusCode;
      // 404 Not Found / 410 Gone => the push subscription is dead; drop it.
      if (code === 404 || code === 410) {
        await this.subs.removeByEndpoint(sub.endpoint).catch(() => {});
      } else {
        console.error("[push] send failed", code, e?.body || e?.message);
      }
    }
  }

  async runOnce(): Promise<void> {
    if (!this.enabled) return;
    const subs = await this.subs.all().catch(() => [] as any[]);
    if (!subs || !subs.length) return;
    const priceMap = await this.fetchPriceMap();
    if (!priceMap) return;
    for (const sub of subs) {
      if (!sub?.endpoint || !sub?.keys?.p256dh) continue;
      const { pushes, changed, alerts } = evaluateSubscription(sub.alerts || [], priceMap, sub.locale);
      for (const p of pushes) {
        await this.send(sub, p);
      }
      if (changed) {
        await this.subs.saveAlerts(sub.deviceId, alerts).catch(() => {});
      }
    }
  }

  /** Start the periodic evaluation loop (no-op if the feature is disabled). */
  startInterval(ms: number): void {
    if (!this.enabled || this.timer) return;
    const run = () => this.runOnce().catch((e) => console.error("[push] run error", e?.message));
    // Let the cache warmer prime /market_analytics before the first pass.
    setTimeout(run, 8000);
    this.timer = setInterval(run, ms);
    console.log(`[push] Web Push evaluator started (every ${ms}ms)`);
  }

  stop(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }
}
