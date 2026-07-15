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
});
