import { LiveStore } from './LiveStore';
import { FairValueService } from './FairValueService';
import { SubscriptionManager } from './SubscriptionManager';
import { computeVerdict, VerdictOpts } from './VerdictEngine';
import { WfmFeed, FeedSnapshot, FeedDelta, FeedStatus } from './WfmFeed';
import { LiveUpdate, LiveBook } from './LiveTypes';

export interface LiveHealth {
  feedUp: boolean;
  feedSource: 'poller' | 'socket';
  liveItems: number;
  bookCount: number;
  lastUpdateAt: number;
}

export interface LiveGatewayDeps {
  feed: WfmFeed;
  store: LiveStore;
  fairValue: FairValueService;
  subs: SubscriptionManager;
  config: VerdictOpts;
  broadcast(url: string, u: LiveUpdate): void;
  writeThrough(url: string, book: LiveBook): void;
}

/**
 * The hub. Wires feed events into the store, computes a verdict against the
 * cached fair value, and fans the result out via injected broadcast/writeThrough
 * callbacks. No socket/Mongo code here so it unit-tests cleanly.
 */
export class LiveGateway {
  private health_: LiveHealth = {
    feedUp: true, feedSource: 'poller', liveItems: 0, bookCount: 0, lastUpdateAt: 0,
  };

  constructor(private readonly d: LiveGatewayDeps) {
    d.feed.on('snapshot', (s: FeedSnapshot) => this.onSnapshot(s));
    d.feed.on('delta', (delta: FeedDelta) => this.onDelta(delta));
    d.feed.on('status', (st: FeedStatus) => {
      this.health_.feedUp = st.up;
      this.health_.feedSource = st.source;
    });
  }

  onSnapshot(s: FeedSnapshot): LiveUpdate | null {
    this.applyVariant(s.url_name);
    this.d.store.applySnapshot(s);
    return this.emitFor(s.url_name);
  }
  onDelta(delta: FeedDelta): LiveUpdate | null {
    this.applyVariant(delta.url_name);
    this.d.store.applyDelta(delta);
    return this.emitFor(delta.url_name);
  }

  /** Push the item's rank + Ayatan star capacity from the fair-value metadata into the
   *  store so the book prices the right tier (max rank / filled sculpture). */
  private applyVariant(url: string): void {
    const fv = this.d.fairValue.get(url);
    this.d.store.setRank(url, fv?.maxRank);
    this.d.store.setStars(url, fv?.maxAmberStars, fv?.maxCyanStars);
  }

  buildUpdate(url: string): LiveUpdate | null {
    const book = this.d.store.getBook(url);
    if (!book) return null;
    const fv = this.d.fairValue.get(url) ?? {
      url_name: url, avg_price: 0, medianHistory: 0, volatility: null, dataDays: 0, volume: 0,
    };
    const verdict = computeVerdict(book, fv, this.d.config);
    return { url_name: url, book, verdict };
  }

  private emitFor(url: string): LiveUpdate | null {
    const update = this.buildUpdate(url);
    if (!update) return null;
    this.d.broadcast(url, update);
    this.d.writeThrough(url, update.book);
    this.health_.bookCount = this.d.store.size();
    this.health_.lastUpdateAt = update.book.updatedAt;
    return update;
  }

  handleSubscribe(url: string): LiveUpdate | null {
    this.d.subs.addViewer(url);
    this.syncLiveSet();
    return this.buildUpdate(url);
  }
  handleUnsubscribe(url: string): void {
    this.d.subs.removeViewer(url);
    this.syncLiveSet();
  }

  private syncLiveSet(): void {
    const live = this.d.subs.liveSet();
    this.health_.liveItems = live.length;
    this.d.feed.setLiveSet(live);
  }

  health(): LiveHealth { return { ...this.health_ }; }

  async start(): Promise<void> {
    this.syncLiveSet();
    this.d.feed.start();
  }
}
