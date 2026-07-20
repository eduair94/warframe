import { OrderCalculator, IOrderData } from './OrderCalculator';

const o = (p: Partial<IOrderData> & Pick<IOrderData, 'order_type' | 'platinum'>): IOrderData => ({
  user: { status: 'ingame' },
  ...p,
});

describe('OrderCalculator', () => {
  describe('dominantSubtype', () => {
    it('returns the subtype with the most orders', () => {
      const orders: IOrderData[] = [
        o({ order_type: 'sell', platinum: 10, subtype: 'radiant' }),
        o({ order_type: 'sell', platinum: 12, subtype: 'radiant' }),
        o({ order_type: 'buy', platinum: 8, subtype: 'radiant' }),
        o({ order_type: 'sell', platinum: 4, subtype: 'intact' }),
      ];
      expect(OrderCalculator.dominantSubtype(orders)).toBe('radiant');
    });

    it('returns undefined when no order carries a subtype', () => {
      const orders: IOrderData[] = [
        o({ order_type: 'sell', platinum: 10 }),
        o({ order_type: 'buy', platinum: 8 }),
      ];
      expect(OrderCalculator.dominantSubtype(orders)).toBeUndefined();
    });

    it('breaks ties deterministically (lexicographically smallest)', () => {
      const orders: IOrderData[] = [
        o({ order_type: 'sell', platinum: 10, subtype: 'radiant' }),
        o({ order_type: 'sell', platinum: 4, subtype: 'intact' }),
      ];
      expect(OrderCalculator.dominantSubtype(orders)).toBe('intact');
    });
  });

  describe('depthLadder', () => {
    it('aggregates quantity by price and sorts best-first per side', () => {
      const orders: IOrderData[] = [
        o({ order_type: 'buy', platinum: 30, quantity: 2, subtype: 'intact' }),
        o({ order_type: 'buy', platinum: 30, quantity: 3, subtype: 'intact' }), // same price -> summed
        o({ order_type: 'buy', platinum: 10, quantity: 5, subtype: 'intact' }),
        o({ order_type: 'sell', platinum: 40, quantity: 1, subtype: 'intact' }),
        o({ order_type: 'sell', platinum: 35, quantity: 4, subtype: 'intact' }),
      ];
      const d = OrderCalculator.depthLadder(orders, 'intact');
      // Buy: highest first, 30 merged to qty 5 over 2 orders
      expect(d.buy).toEqual([
        { price: 30, quantity: 5, orders: 2 },
        { price: 10, quantity: 5, orders: 1 },
      ]);
      // Sell: lowest first
      expect(d.sell).toEqual([
        { price: 35, quantity: 4, orders: 1 },
        { price: 40, quantity: 1, orders: 1 },
      ]);
    });

    it('keeps only the requested subtype and defaults missing quantity to 1', () => {
      const orders: IOrderData[] = [
        o({ order_type: 'buy', platinum: 20, subtype: 'intact' }), // no quantity -> 1
        o({ order_type: 'buy', platinum: 99, quantity: 7, subtype: 'radiant' }), // wrong variant -> dropped
      ];
      const d = OrderCalculator.depthLadder(orders, 'intact');
      expect(d.buy).toEqual([{ price: 20, quantity: 1, orders: 1 }]);
      expect(d.sell).toEqual([]);
    });

    it('caps each side to maxLevels', () => {
      const orders: IOrderData[] = Array.from({ length: 30 }, (_, i) =>
        o({ order_type: 'sell', platinum: i + 1, quantity: 1 }),
      );
      const d = OrderCalculator.depthLadder(orders, undefined, 15);
      expect(d.sell).toHaveLength(15);
      expect(d.sell[0]!.price).toBe(1); // cheapest kept
    });
  });

  describe('subtype filtering', () => {
    it('prices both sides at the requested subtype, ignoring other variants', () => {
      const orders: IOrderData[] = [
        o({ order_type: 'sell', platinum: 5, subtype: 'intact' }),   // wrong variant -> ignored
        o({ order_type: 'sell', platinum: 30, subtype: 'radiant' }),
        o({ order_type: 'sell', platinum: 22, subtype: 'radiant' }),
        o({ order_type: 'buy', platinum: 18, subtype: 'radiant' }),
        o({ order_type: 'buy', platinum: 40, subtype: 'intact' }),   // wrong variant -> ignored
      ];
      const prices = OrderCalculator.calculatePrices(orders, { subtype: 'radiant' });
      expect(prices.sell).toBe(22); // cheapest radiant sell, not the 5p intact
      expect(prices.buy).toBe(18);  // highest radiant buy, not the 40p intact
    });

    it('falls back to any variant when no order matches the requested subtype', () => {
      const orders: IOrderData[] = [
        o({ order_type: 'sell', platinum: 9, subtype: 'intact' }),
        o({ order_type: 'buy', platinum: 6, subtype: 'intact' }),
      ];
      const prices = OrderCalculator.calculatePrices(orders, { subtype: 'radiant' });
      expect(prices.sell).toBe(9);
      expect(prices.buy).toBe(6);
    });
  });

  describe('credibility band (bulk/bait fencing)', () => {
    // Reproduces the Ayatan-sculpture bug: bulk BUYERS bid far above the going
    // rate for huge quantities that never fill, and used to set `buy`.
    it('drops bulk/bait bids above goingRate × BAIT_CEIL from the best buy', () => {
      const orders: IOrderData[] = [
        o({ order_type: 'buy', platinum: 42, quantity: 8286 }), // bulk bait
        o({ order_type: 'buy', platinum: 40, quantity: 500 }),  // bait
        o({ order_type: 'buy', platinum: 20, quantity: 3 }),    // still above 1.5×
        o({ order_type: 'buy', platinum: 18, quantity: 1 }),    // credible top bid
        o({ order_type: 'buy', platinum: 15, quantity: 1 }),
        o({ order_type: 'sell', platinum: 10, quantity: 1 }),
      ];
      const prices = OrderCalculator.calculatePrices(orders, { fenceOutliers: true, goingRate: 12 }); // ceil = 18
      expect(prices.buy).toBe(18); // NOT 42
    });

    it('drops troll-low asks below goingRate × TROLL_FLOOR from the best sell', () => {
      const orders: IOrderData[] = [
        o({ order_type: 'sell', platinum: 1, quantity: 1 }),  // troll (< 1.5)
        o({ order_type: 'sell', platinum: 8, quantity: 1 }),  // credible cheapest
        o({ order_type: 'sell', platinum: 10, quantity: 1 }),
        o({ order_type: 'buy', platinum: 6, quantity: 1 }),
      ];
      const prices = OrderCalculator.calculatePrices(orders, { fenceOutliers: true, goingRate: 10 }); // floor = 1.5
      expect(prices.sell).toBe(8); // NOT 1
    });

    it('derives the reference from the median ask when no goingRate is given', () => {
      const orders: IOrderData[] = [
        o({ order_type: 'buy', platinum: 42, quantity: 9000 }), // bait
        o({ order_type: 'buy', platinum: 12, quantity: 1 }),    // credible
        o({ order_type: 'sell', platinum: 8, quantity: 1 }),
        o({ order_type: 'sell', platinum: 10, quantity: 1 }),   // median ask = 10 -> ceil 15
        o({ order_type: 'sell', platinum: 12, quantity: 1 }),
      ];
      const prices = OrderCalculator.calculatePrices(orders, { fenceOutliers: true }); // no goingRate
      expect(prices.buy).toBe(12); // 42 fenced out by the median-ask reference
      expect(prices.sell).toBe(8);
    });

    it('is opt-in: without fenceOutliers the raw best bid is kept (shared callers unchanged)', () => {
      const orders: IOrderData[] = [
        o({ order_type: 'buy', platinum: 42, quantity: 8286 }),
        o({ order_type: 'buy', platinum: 18, quantity: 1 }),
        o({ order_type: 'sell', platinum: 10, quantity: 1 }),
      ];
      const prices = OrderCalculator.calculatePrices(orders, { goingRate: 12 }); // no fenceOutliers
      expect(prices.buy).toBe(42);
    });

    it('never zeroes out a side: a fully-baited book still returns a best bid', () => {
      const orders: IOrderData[] = [
        o({ order_type: 'buy', platinum: 90, quantity: 100 }),
        o({ order_type: 'buy', platinum: 80, quantity: 100 }),
        o({ order_type: 'sell', platinum: 10, quantity: 1 }),
      ];
      const prices = OrderCalculator.calculatePrices(orders, { fenceOutliers: true, goingRate: 10 }); // ceil 15, all bids above
      expect(prices.buy).toBe(90); // safety: don't hide the only bids we have
    });
  });

  describe('topOrders', () => {
    const named = (
      p: Partial<IOrderData> & Pick<IOrderData, 'order_type' | 'platinum'>,
      status = 'ingame',
      ingame_name = 'Trader',
    ): IOrderData => ({ user: { status, ingame_name }, ...p });

    it('returns the best named orders per side, buy desc / sell asc, capped', () => {
      const orders: IOrderData[] = [
        named({ order_type: 'sell', platinum: 10, quantity: 2 }, 'ingame', 'AskA'),
        named({ order_type: 'sell', platinum: 8, quantity: 1 }, 'online', 'AskB'),
        named({ order_type: 'sell', platinum: 12, quantity: 3 }, 'ingame', 'AskC'),
        named({ order_type: 'buy', platinum: 6, quantity: 1 }, 'ingame', 'BidA'),
        named({ order_type: 'buy', platinum: 9, quantity: 5 }, 'online', 'BidB'),
      ];
      const top = OrderCalculator.topOrders(orders, { goingRate: 10, count: 2 });
      expect(top.sell.map((r) => r.platinum)).toEqual([8, 10]); // lowest first
      expect(top.sell[0]).toMatchObject({ platinum: 8, quantity: 1, ingame_name: 'AskB', status: 'online' });
      expect(top.buy.map((r) => r.platinum)).toEqual([9, 6]); // highest first
    });

    it('excludes offline users (cannot be whispered)', () => {
      const orders: IOrderData[] = [
        named({ order_type: 'sell', platinum: 5 }, 'offline', 'Sleeper'),
        named({ order_type: 'sell', platinum: 9 }, 'ingame', 'Awake'),
      ];
      const top = OrderCalculator.topOrders(orders, { goingRate: 9 });
      expect(top.sell).toHaveLength(1);
      expect(top.sell[0]!.ingame_name).toBe('Awake');
    });

    it('applies the same credibility band, so a bulk-bait bid is not a "best buyer"', () => {
      const orders: IOrderData[] = [
        named({ order_type: 'buy', platinum: 42, quantity: 8286 }, 'ingame', 'BulkBuyer'),
        named({ order_type: 'buy', platinum: 18, quantity: 1 }, 'ingame', 'RealBuyer'),
        named({ order_type: 'sell', platinum: 10 }, 'ingame', 'Seller'),
      ];
      const top = OrderCalculator.topOrders(orders, { goingRate: 12 }); // ceil 18
      expect(top.buy.map((r) => r.ingame_name)).toEqual(['RealBuyer']);
    });

    it('keeps only the requested subtype and defaults missing quantity to 1', () => {
      const orders: IOrderData[] = [
        named({ order_type: 'sell', platinum: 20, subtype: 'radiant' }, 'ingame', 'R'),
        named({ order_type: 'sell', platinum: 5, subtype: 'intact' }, 'ingame', 'I'),
      ];
      const top = OrderCalculator.topOrders(orders, { subtype: 'radiant', goingRate: 20 });
      expect(top.sell).toEqual([{ platinum: 20, quantity: 1, ingame_name: 'R', status: 'ingame' }]);
    });

    // Consistency with the headline price: a filled Ayatan sculpture must not mix
    // in the cheap empty-sculpture orders (which the star-filtered header excludes).
    it('prices sculptures at the filled star tier, excluding empty sculptures', () => {
      const orders: IOrderData[] = [
        named({ order_type: 'sell', platinum: 12, amber_stars: 0, cyan_stars: 0 }, 'ingame', 'Empty'),
        named({ order_type: 'sell', platinum: 45, amber_stars: 1, cyan_stars: 4 }, 'ingame', 'Filled'),
      ];
      const top = OrderCalculator.topOrders(orders, { goingRate: 45, maxAmberStars: 1, maxCyanStars: 4 });
      expect(top.sell.map((r) => r.ingame_name)).toEqual(['Filled']);
    });

    it('falls back to any star tier when no filled sculpture is listed', () => {
      const orders: IOrderData[] = [
        named({ order_type: 'sell', platinum: 12, amber_stars: 0, cyan_stars: 0 }, 'ingame', 'Empty'),
      ];
      const top = OrderCalculator.topOrders(orders, { goingRate: 12, maxAmberStars: 1, maxCyanStars: 4 });
      expect(top.sell.map((r) => r.ingame_name)).toEqual(['Empty']);
    });
  });
});
