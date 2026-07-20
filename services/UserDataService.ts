/**
 * @fileoverview Mongo persistence for signed-in player accounts.
 * @module services/UserDataService
 *
 * ONE document per Firebase uid (collection `warframe-users`) holding the whole
 * synced payload. A single `GET /me` therefore serves every account page —
 * /account, /vault, /goals and /ledger all read from the same in-memory store
 * on the client, and a page navigation costs zero requests.
 *
 * Everything written here has already been through services/userValidate, so
 * the caps in USER_LIMITS bound the document far below Mongo's 16 MB ceiling.
 */

import mongoose from "mongoose";
import { MongooseServer } from "../database";
import { COLLECTIONS } from "../constants";
import { emptyUserData, type UserData, type UserDoc } from "./userTypes";
import { mergeUserData } from "./userMerge";
import { sanitizeLocale, sanitizeSection, sanitizeUserData, str } from "./userValidate";
import type { VerifiedUser } from "./firebaseToken";

const Schema = mongoose.Schema;

export class UserDataService {
  private db: any;

  constructor() {
    this.db = MongooseServer.getInstance(
      COLLECTIONS.USERS,
      new Schema({ uid: { type: String, unique: true } }, { strict: false })
    );
    // Unique per account; sparse so a legacy doc without the field can't block it.
    this.db.ensureIndex?.({ uid: 1 }, { unique: true, sparse: true }).catch(() => {});
  }

  private async findDoc(uid: string): Promise<UserDoc | null> {
    const rows = ((await this.db.allEntries({ uid })) as UserDoc[]) || [];
    return rows[0] || null;
  }

  /** Normalises a stored doc (or a missing one) into a complete UserDoc. */
  private shape(uid: string, user: VerifiedUser, prev: UserDoc | null, locale?: string): UserDoc {
    const now = new Date().toISOString();
    return {
      uid,
      email: user.email ?? prev?.email ?? null,
      displayName: user.name ?? prev?.displayName ?? null,
      photoURL: user.picture ?? prev?.photoURL ?? null,
      provider: user.provider ?? prev?.provider ?? null,
      locale: locale ? sanitizeLocale(locale) : prev?.locale || "en",
      createdAt: prev?.createdAt || now,
      lastSeen: now,
      data: prev?.data ? sanitizeUserData(prev.data, now) : emptyUserData(now),
    };
  }

  /**
   * Read-or-create. Called by GET /me on every page load, so it also refreshes
   * the profile fields off the (authoritative) token claims and stamps lastSeen.
   *
   * The write is deliberately split: profile fields are `$set`, but `data` and
   * `createdAt` are `$setOnInsert`. A plain whole-document write here would
   * re-save the copy this request read a round trip earlier, silently reverting
   * any `/me/sync` that landed in between — and GET /me runs on every page load,
   * so that race is not hypothetical.
   */
  async getOrCreate(user: VerifiedUser, locale?: string): Promise<UserDoc> {
    const prev = await this.findDoc(user.uid);
    const doc = this.shape(user.uid, user, prev, locale);
    const { data, createdAt, ...profile } = doc;
    await this.db.getAnUpdateEntry(
      { uid: user.uid },
      { $set: profile, $setOnInsert: { createdAt, data } }
    );
    return doc;
  }

  /**
   * Replace exactly one section. Returns the whole data blob as it now stands.
   *
   * Only `data.<section>` is written, so two devices syncing different sections
   * concurrently cannot overwrite each other. `section` has already been
   * validated against USER_SECTIONS by the route, so the dotted path is not
   * attacker-controlled.
   */
  async saveSection(user: VerifiedUser, section: string, value: any): Promise<UserData> {
    const clean = sanitizeSection(section, value);
    if (clean === undefined) throw new Error("unknown section");
    const prev = await this.findDoc(user.uid);
    const now = new Date().toISOString();
    const data: UserData = prev?.data ? sanitizeUserData(prev.data, now) : emptyUserData(now);
    (data as any)[section] = clean;
    data.updatedAt = now;
    const { data: _ignored, createdAt, ...profile } = this.shape(user.uid, user, prev);
    await this.db.getAnUpdateEntry(
      { uid: user.uid },
      {
        $set: { ...profile, [`data.${section}`]: clean, "data.updatedAt": now },
        // On INSERT the other sections must exist too, or the document would be
        // created with only the section that happened to sync first. The synced
        // section itself is excluded — Mongo rejects $set and $setOnInsert
        // touching the same path.
        $setOnInsert: Object.fromEntries(
          Object.entries({
            createdAt,
            "data.watchlist": data.watchlist,
            "data.vault": data.vault,
            "data.goals": data.goals,
            "data.trades": data.trades,
            "data.foundry": data.foundry,
            "data.settings": data.settings,
          }).filter(([key]) => key !== `data.${section}`)
        ),
      }
    );
    return data;
  }

  /**
   * Union a client snapshot with the stored copy (first sign-in on a device).
   * Never destructive — see services/userMerge for the newest-wins rules.
   */
  async merge(user: VerifiedUser, incoming: any, locale?: string): Promise<UserDoc> {
    const prev = await this.findDoc(user.uid);
    const now = new Date().toISOString();
    const data = mergeUserData(prev?.data, incoming, now);
    const doc: UserDoc = { ...this.shape(user.uid, user, prev, locale), data };
    await this.db.getAnUpdateEntry({ uid: user.uid }, doc);
    return doc;
  }

  /** Profile-only patch (display name / preferred locale). Never touches `data`. */
  async saveProfile(
    user: VerifiedUser,
    patch: { displayName?: any; locale?: any }
  ): Promise<UserDoc> {
    const prev = await this.findDoc(user.uid);
    const doc = this.shape(user.uid, user, prev, patch.locale);
    const name = str(patch.displayName, 60);
    if (name) doc.displayName = name;
    const { data, createdAt, ...profile } = doc;
    await this.db.getAnUpdateEntry(
      { uid: user.uid },
      { $set: profile, $setOnInsert: { createdAt, data } }
    );
    return doc;
  }

  /** Wipe everything we hold for this account (data-deletion request). */
  async remove(uid: string): Promise<void> {
    await this.db.deleteEntry({ uid });
  }
}
