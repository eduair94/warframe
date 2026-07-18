/**
 * @fileoverview Service for localized game-noun name dictionaries
 * @module services/TranslationService
 *
 * Single Responsibility: store and serve `{ slug -> localized name }` maps that
 * localize every Warframe game noun (items, riven weapons/attributes,
 * lich/sister weapons/quirks/ephemeras, locations, npcs, missions) into the
 * languages warframe.market publishes.
 *
 * Design: English is the canonical language (already stored as `item_name` on
 * each item), so this collection only holds the NON-EN dictionaries. Each
 * document is one (scope, lang) pair:
 *
 *   { scope: 'items', lang: 'de', map: { 'mirage_prime_set': 'Mirage Prime: Set', ... }, updatedAt }
 *
 * The collector (sync_translations.ts) writes these; the API's /i18n/:scope/:lang
 * route reads them; the frontend resolves a display name via the English
 * `url_name` key with an English fallback.
 */

import { Schema } from 'mongoose';
import { COLLECTIONS, TRANSLATION_SCOPE_NAMES, TRANSLATION_LANGS } from '../constants';
import { MongooseServer } from '../database';

/** A flat dictionary: language-independent key (slug) -> localized display name. */
export type TranslationMap = Record<string, string>;

export class TranslationService {
  private readonly db: MongooseServer;

  constructor() {
    this.db = MongooseServer.getInstance(
      COLLECTIONS.TRANSLATIONS,
      new Schema(
        {
          scope: { type: String },
          lang: { type: String },
          map: { type: Schema.Types.Mixed },
          updatedAt: { type: Date }
        },
        { strict: false }
      )
    );
    // One document per (scope, lang); the collector upserts on this pair.
    this.db
      .ensureIndex({ scope: 1, lang: 1 }, { unique: true })
      .catch(() => {});
  }

  /** Whitelist guard so the public route can't be used to probe arbitrary keys. */
  static isValidScope(scope: string): boolean {
    return (TRANSLATION_SCOPE_NAMES as readonly string[]).includes(scope);
  }

  /** `en` is the base language (no dictionary needed); everything else must be a known lang. */
  static isValidLang(lang: string): boolean {
    return (TRANSLATION_LANGS as readonly string[]).includes(lang);
  }

  /**
   * Reads the `{ key -> name }` dictionary for one (scope, lang). Returns an
   * empty object for `en`, unknown pairs, or a not-yet-collected dictionary —
   * callers always fall back to the English name, so `{}` is safe.
   */
  async getMap(scope: string, lang: string): Promise<TranslationMap> {
    if (lang === 'en') return {};
    if (!TranslationService.isValidScope(scope) || !TranslationService.isValidLang(lang)) {
      return {};
    }
    const doc: any = await this.db.findEntry({ scope, lang });
    return (doc && doc.map) || {};
  }

  /**
   * Upserts the dictionary for one (scope, lang). Called by the collector.
   */
  async saveMap(scope: string, lang: string, map: TranslationMap): Promise<void> {
    await this.db.getAnUpdateEntry(
      { scope, lang },
      { scope, lang, map, updatedAt: new Date() }
    );
  }
}
