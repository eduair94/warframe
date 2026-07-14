import './env';
import * as http from 'http';
import { Server, Socket } from 'socket.io';
import WebSocket from 'ws';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { MongooseServer } from './database';
import WarframeUndici from './warframe-undici';
import { ItemService } from './services/ItemService';
import { PriceHistoryService } from './services/PriceHistoryService';
import { readLiveConfig } from './services/live/LiveConfig';
import { LiveStore } from './services/live/LiveStore';
import { FairValueService } from './services/live/FairValueService';
import { SubscriptionManager } from './services/live/SubscriptionManager';
import { HotPoller } from './services/live/HotPoller';
import { LiveGateway } from './services/live/LiveGateway';
import { LiveUpdate, LiveBook } from './services/live/LiveTypes';
import {
  WfmNewOrders,
  subscribeNewOrdersMsg,
  WFM_SOCKET_URL,
  WFM_SUBPROTOCOL,
} from './services/live/WfmNewOrders';

const BROWSER_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36';

async function main() {
  const cfg = readLiveConfig(process.env);
  console.log('[live] starting', { port: cfg.port, feedMode: cfg.feedMode });
  await MongooseServer.startConnectionPromise();

  if (cfg.feedMode === 'off') {
    console.log('[live] LIVE_FEED_MODE=off — feed disabled, health-only server');
  }

  // --- domain services reusing the proven stack ---
  const wf = new WarframeUndici({ useProxies: process.env.PROXY_LESS !== 'true' });
  const itemService = new ItemService();
  // WarframeUndici already registers the price-history collection (BaseWarframeClient
  // exposes it as `dbPriceHistory`); reuse it rather than re-registering the model.
  const priceHistory = new PriceHistoryService((wf as any).dbPriceHistory);

  const store = new LiveStore(cfg.platform);
  const fairValue = new FairValueService({
    getItems: (urls) => itemService.getItemsByUrlNames(urls),
    getHistory: (url) => priceHistory.getHistory(url),
  });
  const subs = new SubscriptionManager({
    maxSubscriptions: cfg.maxSubscriptions,
    hotFloor: cfg.hotFloorList,
  });

  // Poller is the shippable source. BaseWarframeClient.getItemOrders(url) already
  // delegates to MarketService.getItemOrders and returns { payload: { orders } }.
  const poller = new HotPoller({
    intervalMs: cfg.pollIntervalMs,
    concurrency: cfg.pollConcurrency,
    fetchOrders: async (url) => {
      const res: any = await (wf as any).getItemOrders(url);
      return (res && res.payload && res.payload.orders) || [];
    },
  });

  const io = new Server({ cors: { origin: cfg.corsOrigin } });

  const gateway = new LiveGateway({
    feed: poller,
    store, fairValue, subs,
    config: {
      halfVolume: cfg.fvHalfVolume,
      baseBandPct: cfg.baseBandPct,
      maxBandPct: cfg.maxBandPct,
      confMin: cfg.confMin,
      thinVolume: cfg.thinVolume,
    },
    broadcast: (url: string, u: LiveUpdate) => io.to(`item:${url}`).emit('update', u),
    writeThrough: (url: string, book: LiveBook) => writeThrough(itemService, url, book).catch(() => {}),
  });

  // --- wf.market live socket: global new-orders firehose -> market pulse ---
  // Cloudflare-gated, so route the handshake through the same proxy pool the REST
  // poller uses (a direct connect gets 403). One persistent connection, auto-reconnect.
  const itemById = new Map<string, { url_name?: string; item_name?: string; thumb?: string }>();
  const newOrders = new WfmNewOrders({ resolveItem: (id) => itemById.get(id) || null });
  let wfmUp = false;
  let wfmReconnecting = false;

  async function loadItemIndex(): Promise<void> {
    try {
      const all = (await itemService.getAllItems()) as any[];
      itemById.clear();
      for (const it of all) {
        if (it && it.id) {
          itemById.set(String(it.id), { url_name: it.url_name, item_name: it.item_name, thumb: it.thumb });
        }
      }
    } catch (e: any) {
      console.error('[live] item index load failed', e?.message);
    }
  }

  function scheduleWfmReconnect(): void {
    if (wfmReconnecting) return;
    wfmReconnecting = true;
    setTimeout(() => { wfmReconnecting = false; connectWfmSocket(); }, 4000);
  }
  async function connectWfmSocket(): Promise<void> {
    if (cfg.feedMode === 'off' || !cfg.newOrders) return;
    let proxy: string | null = null;
    try { proxy = await (wf as any).getHttpService().getProxyManager().getProxy(); } catch {}
    const opts: any = { origin: 'https://warframe.market', headers: { 'User-Agent': BROWSER_UA } };
    if (proxy) opts.agent = new HttpsProxyAgent(String(proxy));
    const ws = new WebSocket(WFM_SOCKET_URL, [WFM_SUBPROTOCOL], opts);
    ws.on('open', () => {
      wfmUp = true;
      ws.send(subscribeNewOrdersMsg(cfg.platform));
      console.log('[live] wfm socket open (newOrders)');
    });
    ws.on('message', (d: WebSocket.RawData) => { newOrders.ingest(d.toString()); });
    ws.on('close', () => { wfmUp = false; scheduleWfmReconnect(); });
    ws.on('error', () => { wfmUp = false; try { ws.terminate(); } catch {} });
  }

  io.on('connection', (socket: Socket) => {
    if (cfg.newOrders) socket.emit('pulse', newOrders.getPulse());
    socket.on('subscribe', (msg: { url_name?: string }) => {
      const url = (msg && msg.url_name || '').toString();
      if (!url) return;
      socket.join(`item:${url}`);
      const current = gateway.handleSubscribe(url);
      if (current) socket.emit('update', current);
      // Fire-and-forget FV warm-up so the next poll tick has a real baseline
      // instead of falling back to `hold` for up to fvRefreshMs.
      fairValue.load([url]).catch(() => {});
    });
    socket.on('unsubscribe', (msg: { url_name?: string }) => {
      const url = (msg && msg.url_name || '').toString();
      if (!url) return;
      socket.leave(`item:${url}`);
      gateway.handleUnsubscribe(url);
    });
  });

  // Health endpoint on the same http server.
  const httpServer = http.createServer((req, res) => {
    if (req.url && req.url.startsWith('/health')) {
      const pulse = newOrders.getPulse();
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({
        ...gateway.health(),
        wfmSocket: wfmUp,
        online: pulse.online,
        ordersPerMin: pulse.ordersPerMin,
      }));
      return;
    }
    res.statusCode = 404;
    res.end('not found');
  });
  io.attach(httpServer);
  httpServer.listen(cfg.port, () => console.log(`[live] listening on ${cfg.port}`));

  // Prime + periodically refresh the fair-value baseline for the live set (and the
  // itemId->item index the new-orders ticker resolves against).
  const refresh = async () => {
    try { await fairValue.load(subs.liveSet()); } catch (e: any) { console.error('[live] FV refresh failed', e?.message); }
    if (cfg.newOrders) loadItemIndex();
  };
  await refresh();
  setInterval(refresh, cfg.fvRefreshMs);

  // wf.market live socket + market-pulse broadcast to every connected client.
  if (cfg.newOrders && cfg.feedMode !== 'off') {
    await loadItemIndex();
    connectWfmSocket();
    setInterval(() => io.emit('pulse', newOrders.getPulse()), 2000);
  }

  if (cfg.feedMode !== 'off') await gateway.start();
}

async function writeThrough(itemService: ItemService, url: string, book: LiveBook): Promise<void> {
  if (!book || (book.bestBuy <= 0 && book.bestSell <= 0)) return;
  // getAnUpdateEntry replaces the whole `market` subdoc wholesale, so read the
  // current item first and merge — otherwise volume/avg_price/last_completed
  // (populated by the daily sync) get clobbered on every live tick.
  const current = await itemService.getItemByUrlName(url);
  if (!current) return; // never inject a partial item doc for an unknown url_name
  const prevMarket = (current && (current as any).market) || {};
  await itemService.saveItemByUrlName(url, {
    market: {
      ...prevMarket,
      buy: book.bestBuy,
      sell: book.bestSell,
      buyAvg: Math.round(book.buyAvg),
      sellAvg: Math.round(book.sellAvg),
    },
    priceUpdate: new Date(),
  } as any);
}

main().catch((e) => {
  console.error('[live] fatal', e);
  process.exit(1);
});
