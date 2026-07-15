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
