/**
 * Persistence for Web Push subscriptions + their alert thresholds (Spec B).
 * One document per anonymous, client-generated `deviceId` (no accounts). The
 * watchlist thresholds — client-side localStorage in the UI — are mirrored here
 * so PushAlertService can evaluate them with the tab closed.
 */
import mongoose from "mongoose";
import { MongooseServer } from "../database";
import { COLLECTIONS } from "../constants";
import {
  mergeAlerts,
  hasAnyCondition,
  type StoredAlert,
  type IncomingAlert,
} from "./pushEval";

const Schema = mongoose.Schema;

export interface WebPushSubscription {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

export interface PushSubDoc {
  deviceId: string;
  endpoint: string;
  keys: { p256dh: string; auth: string };
  alerts: StoredAlert[];
  locale?: string;
  createdAt?: string;
  lastSeen?: string;
}

export interface UpsertInput {
  deviceId: string;
  subscription: WebPushSubscription;
  alerts: IncomingAlert[];
  locale?: string;
}

export class PushSubscriptionService {
  private db: any;

  constructor() {
    this.db = MongooseServer.getInstance(
      COLLECTIONS.PUSH_SUBSCRIPTIONS,
      new Schema({ deviceId: { type: String, unique: true } }, { strict: false })
    );
    // Unique per device; sparse so a legacy doc without the field can't block it.
    this.db.ensureIndex?.({ deviceId: 1 }, { unique: true, sparse: true }).catch(() => {});
  }

  async all(): Promise<PushSubDoc[]> {
    return (await this.db.allEntries({})) as PushSubDoc[];
  }

  /**
   * Create or update a device's subscription + alerts. Preserves the per-alert
   * `notified*` flags for thresholds that didn't change (see mergeAlerts), so a
   * routine re-sync never re-fires a still-armed alert.
   */
  async upsert(input: UpsertInput): Promise<PushSubDoc> {
    const existing = ((await this.db.allEntries({ deviceId: input.deviceId })) as PushSubDoc[]) || [];
    const prev = existing[0];
    const incoming = (input.alerts || []).filter(hasAnyCondition);
    const alerts = mergeAlerts(prev?.alerts || [], incoming);
    const doc: PushSubDoc = {
      deviceId: input.deviceId,
      endpoint: input.subscription.endpoint,
      keys: {
        p256dh: input.subscription.keys.p256dh,
        auth: input.subscription.keys.auth,
      },
      alerts,
      locale: input.locale || prev?.locale || "en",
      createdAt: prev?.createdAt || new Date().toISOString(),
      lastSeen: new Date().toISOString(),
    };
    await this.db.getAnUpdateEntry({ deviceId: input.deviceId }, doc);
    return doc;
  }

  async remove(deviceId: string): Promise<void> {
    await this.db.deleteEntry({ deviceId });
  }

  /** Drop a dead subscription discovered during a push send (404/410). */
  async removeByEndpoint(endpoint: string): Promise<void> {
    await this.db.deleteEntry({ endpoint });
  }

  /** Persist updated notified flags after an evaluation pass. */
  async saveAlerts(deviceId: string, alerts: StoredAlert[]): Promise<void> {
    await this.db.updateOne({ deviceId }, { alerts, lastSeen: new Date().toISOString() });
  }
}
