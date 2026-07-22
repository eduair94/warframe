import "./env";
import { Request } from 'express';
import server from "./Express/ExpressSetup";
import { serverConfig } from "./Express/config";
import { MongooseServer } from "./database";
import { Warframe } from "./warframe";
import { startCacheWarmer } from "./services/CacheWarmer";
import { TranslationService } from "./services/TranslationService";
import { PushAlertService } from "./services/PushAlertService";
import { parseSubscribeBody } from "./services/pushValidate";
import { firebaseAuth } from "./services/firebaseToken";
import { UserDataService } from "./services/UserDataService";
import { isSection } from "./services/userValidate";
import type { AuthedRequest } from "./Express/Express.interface";

async function main() {
    await MongooseServer.startConnectionPromise();
    console.log("Start express");
    const m = new Warframe();
    server.getJsonCache('/', async (req: Request): Promise<any> => {
        const results = await m.getItemsDatabaseServer();
        return results;
    });
    server.getJson('set/:url_name', async (req: Request): Promise<any> => {
        const url_name = req.params.url_name;
        const results = await m.getSet(url_name);
        return results;
    });
    // Set DETAIL page bundle: the set, every part with its quantity_for_set,
    // full market blocks (median / moving_avg / min-max / depth ladder) and each
    // item's daily price series — one cached request instead of the 5-12 the
    // page would otherwise fan out. `/set/:url_name` above is left untouched.
    server.getJson('set_full/:url_name', async (req: Request): Promise<any> => {
        const url_name = req.params.url_name;
        return m.getSetFull(url_name);
    });
    server.getJsonCache('sets_comparison', async (req: Request): Promise<any> => {
        const sets = await m.getSetsComparison();
        return { sets };
    });
    server.getJsonCache('relics_ev', async (req: Request): Promise<any> => {
        const relics = await m.getRelicsEv();
        return { relics };
    });
    server.getJson('rivens', async (req: Request): Promise<any> => {
        return m.rivenMods();
    });   
    server.getJson('relics', async (req: Request): Promise<any> => {
        return m.relics();
    });
    // i18n: localized `{ slug -> name }` dictionary for one game-noun scope +
    // language. English needs no dictionary (names are already the canonical
    // `item_name`). Scope/lang are whitelisted so the cache (keyed by URL) can't
    // be flooded with arbitrary keys. Cached like the other read aggregates.
    server.getJsonCache('i18n/:scope/:lang', async (req: Request): Promise<any> => {
        const { scope, lang } = req.params;
        if (!TranslationService.isValidScope(scope) || !TranslationService.isValidLang(lang)) {
            return { scope, lang, map: {} };
        }
        const map = await m.getTranslations(scope, lang);
        return { scope, lang, map };
    });
    server.getJsonProtected('build_relics', async (req: Request): Promise<any> => {
         return m.buildRelics();
    });
    server.getJson('relic/:url_name', async (req: Request): Promise<any> => {
        const url_name = req.params.url_name;
        const results = await m.getRelic(url_name);
        return results;
    });
    // Single relic's "open vs sell vs keep" EV row — the payload the relic detail
    // page renders (rewards with authoritative WFCD chances, per-part vault flags,
    // the relic's market book). Cached like the other read aggregates; keyed by
    // url_name so a relic page and its value-board row stay in lockstep.
    server.getJsonCache('relic_ev/:url_name', async (req: Request): Promise<any> => {
        const url_name = req.params.url_name;
        return m.getRelicEv(url_name);
    });
    // Stored order-book depth plus per-rank prices for ranked items. Fetched on
    // demand by the order dialog and expandable home-table rows.
    server.getJson('orders/:url_name', async (req: Request): Promise<any> => {
        const url_name = req.params.url_name;
        return m.getOrderBook(url_name);
    });
    // Star Chart: planets → nodes ranked by expected plat/run (WFCD drop chances
    // joined with live market prices). Cached like the other aggregate views.
    server.getJsonCache('drops/map', async (req: Request): Promise<any> => {
        return m.getDropsMap();
    });
    // Drop-locations dialog: where a single item drops (missions + relics).
    server.getJsonCache('drops/item/:name', async (req: Request): Promise<any> => {
        const name = req.params.name;
        return m.getItemDrops(name);
    });
    // Refreshes the WFCD drop-data backup in Mongo (protected: triggers a real fetch).
    server.getJsonProtected('build_drops', async (req: Request): Promise<any> => {
        return m.syncDrops();
    });
    // Mission hub: every drop source with node facts + best plat/run.
    server.getJsonCache('missions', async (req: Request): Promise<any> => {
        return m.getMissionList();
    });
    // Mission detail: one node/activity — reward table, facts, freshness.
    server.getJsonCache('mission/:slug', async (req: Request): Promise<any> => {
        const slug = String(req.params.slug || '');
        // Whitelist the slug: the cache key is req.originalUrl, so reject junk.
        if (!/^[a-z0-9-]+$/.test(slug)) return null;
        return m.getMissionDetail(slug);
    });
    // Refreshes the node-metadata backup in Mongo (protected: triggers a real fetch).
    server.getJsonProtected('build_nodes', async (req: Request): Promise<any> => {
        return m.syncNodes();
    });
    server.getJson('price_history/:url_name', async (req: Request): Promise<any> => {
        const url_name = req.params.url_name;
        const results = await m.getPriceHistory(url_name);
        return results;
    });
    // Cross-item analytics feed (Screener, Top Movers, Volatility, Buy/Sell
    // timing, Vault Spikes). One document per item joined with its daily price
    // history - cached like the other aggregate views.
    server.getJsonCache('market_analytics', async (req: Request): Promise<any> => {
        return m.getMarketAnalytics();
    });
    // Endo Exchange (mod flipping): every rank-able mod with a stored per-rank
    // flip ladder, for the endo->plat tool. Cached like the other aggregates;
    // the client (useEndoValue) computes best buy-rank / profit / plat-per-endo.
    server.getJsonCache('endo_flip', async (req: Request): Promise<any> => {
        return m.getEndoFlip();
    });
    // Riven fair-value page: weapon picker list + one weapon's auction corpus.
    server.getJsonCache('riven_weapons', async (req: Request): Promise<any> => {
        const weapons = await m.getRivenWeaponsList();
        return { weapons };
    });
    server.getJson('riven_value/:weapon', async (req: Request): Promise<any> => {
        const weapon = req.params.weapon;
        const results = await m.getRivenValueData(weapon);
        return results || { url_name: weapon, items: [] };
    });

    // --- Web Push price alerts (Spec B) ---
    // Anonymous per-device subscriptions + a background evaluator that pushes when
    // a watched item crosses a threshold (tab closed). No accounts. Disabled unless
    // VAPID keys are set. See services/PushAlertService.
    const pushAlerts = new PushAlertService(serverConfig.port);
    const pushSubs = pushAlerts.subscriptions();
    // Public VAPID key the browser needs to create a PushSubscription (+ whether
    // the feature is on at all, so the UI can degrade to foreground-only).
    server.getJson('push/public-key', async (_req: Request): Promise<any> => {
        return { key: pushAlerts.getPublicKey(), enabled: pushAlerts.isEnabled() };
    });
    // Create/update this device's subscription + alert thresholds. Validated in the
    // handler (Express.postJson's validation branch never sends a response).
    server.postJson('push/subscribe', async (req: Request): Promise<any> => {
        const parsed = parseSubscribeBody(req.body);
        if ('error' in parsed) return { error: parsed.error };
        // Optional: a signed-in device tags its subscription with its uid so the
        // user can see which of their devices are subscribed. Never required —
        // anonymous subscriptions keep working exactly as before, and a bad
        // token is ignored rather than failing the subscribe.
        const idToken = typeof req.body?.idToken === 'string' ? req.body.idToken : '';
        if (idToken && firebaseAuth.isEnabled()) {
            const verified = await firebaseAuth.verify(idToken).catch(() => null);
            if (verified) parsed.value.uid = verified.uid;
        }
        const doc = await pushSubs.upsert(parsed.value);
        return { ok: true, count: doc.alerts.length };
    });
    server.postJson('push/unsubscribe', async (req: Request): Promise<any> => {
        const deviceId = typeof req.body?.deviceId === 'string' ? req.body.deviceId.trim() : '';
        if (!deviceId) return { error: 'deviceId required' };
        await pushSubs.remove(deviceId);
        return { ok: true };
    });

    // Foundry tracker: the mastery/build catalogue (every masterable item, its
    // components and the aggregated resource requirements). One big, static-ish
    // payload — cached like the other aggregates; the per-user progress on top
    // of it lives in the account document, never here.
    server.getJsonCache('foundry/catalogue', async (_req: Request): Promise<any> => {
        return m.getFoundryCatalogue();
    });
    // Rebuilds the Foundry catalogue from WFCD (protected: triggers a real fetch).
    server.getJsonProtected('build_foundry', async (_req: Request): Promise<any> => {
        return m.syncFoundry();
    });

    // --- Tenno accounts (Firebase Auth: magic link + Google) ---
    // Optional sign-in that turns the local-first tools (watchlist, vault,
    // farming goals, trade ledger) into cloud-synced ones. Every route below is
    // UNCACHED and per-user (see Express.getJsonAuth / postJsonAuth); the whole
    // feature stays off unless FIREBASE_PROJECT_ID is set, exactly like Web Push
    // stays off without VAPID keys. See services/firebaseToken.
    const users = new UserDataService();
    // Public: lets the client decide whether to load the Firebase SDK at all.
    server.getJson('auth/config', async (_req: Request): Promise<any> => {
        return { enabled: firebaseAuth.isEnabled(), projectId: firebaseAuth.getProjectId() };
    });
    // The whole account payload in one read — every account page renders from it.
    server.getJsonAuth('me', async (req: AuthedRequest): Promise<any> => {
        const locale = typeof req.query.locale === 'string' ? req.query.locale : undefined;
        const doc = await users.getOrCreate(req.user, locale);
        return { ok: true, user: doc };
    });
    // Replace ONE section (watchlist | vault | goals | trades | settings).
    server.postJsonAuth('me/sync', async (req: AuthedRequest): Promise<any> => {
        const section = req.body?.section;
        if (!isSection(section)) return { error: 'unknown section' };
        const data = await users.saveSection(req.user, section, req.body?.value);
        return { ok: true, section, updatedAt: data.updatedAt };
    });
    // First sign-in on a device: union the local snapshot with the stored copy
    // (newest wins per entry, never destructive). See services/userMerge.
    server.postJsonAuth('me/merge', async (req: AuthedRequest): Promise<any> => {
        const locale = typeof req.body?.locale === 'string' ? req.body.locale : undefined;
        const doc = await users.merge(req.user, req.body?.data, locale);
        return { ok: true, user: doc };
    });
    server.postJsonAuth('me/profile', async (req: AuthedRequest): Promise<any> => {
        const doc = await users.saveProfile(req.user, {
            displayName: req.body?.displayName,
            locale: req.body?.locale,
        });
        return { ok: true, user: doc };
    });
    // Data-deletion request: drops the entire account document.
    server.postJsonAuth('me/delete', async (req: AuthedRequest): Promise<any> => {
        await users.remove(req.user.uid);
        return { ok: true };
    });

    // Keep the heavy aggregate routes permanently warm so their stale copy never
    // ages out — otherwise a cold ~20s recompute reaches Cloudflare and times out
    // to a 502. See services/CacheWarmer.ts.
    startCacheWarmer(serverConfig.port);

    // Evaluate alerts periodically (after the cache warmer has primed analytics).
    pushAlerts.startInterval(Number(process.env.PUSH_EVAL_INTERVAL_MS) || 90000);
}

main();
