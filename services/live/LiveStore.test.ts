import { LiveStore } from './LiveStore';
import { NormalizedOrder } from './LiveTypes';

const ord = (p: Partial<NormalizedOrder> & { id: string }): NormalizedOrder => ({
  order_type: 'sell', platinum: 10, quantity: 1, visible: true, platform: 'pc',
  user: { id: 'u' + p.id, status: 'ingame' }, ...p,
});

describe('LiveStore', () => {
  it('computes best online buy/sell from a snapshot (ingame preferred)', () => {
    const s = new LiveStore('pc');
    const book = s.applySnapshot({ url_name: 'x', orders: [
      ord({ id: '1', order_type: 'sell', platinum: 20, user: { id: 'a', status: 'ingame' } }),
      ord({ id: '2', order_type: 'sell', platinum: 15, user: { id: 'b', status: 'ingame' } }),
      ord({ id: '3', order_type: 'sell', platinum: 9,  user: { id: 'c', status: 'offline' } }), // ignored
      ord({ id: '4', order_type: 'buy',  platinum: 12, user: { id: 'd', status: 'ingame' } }),
      ord({ id: '5', order_type: 'buy',  platinum: 8,  user: { id: 'e', status: 'ingame' } }),
    ]});
    expect(book.bestSell).toBe(15);
    expect(book.bestBuy).toBe(12);
    expect(book.onlineSellCount).toBe(2);
    expect(book.onlineBuyCount).toBe(2);
  });

  it('raises bestSell when the cheapest seller goes offline (presence delta)', () => {
    const s = new LiveStore('pc');
    s.applySnapshot({ url_name: 'x', orders: [
      ord({ id: '1', order_type: 'sell', platinum: 15, user: { id: 'b', status: 'ingame' } }),
      ord({ id: '2', order_type: 'sell', platinum: 20, user: { id: 'a', status: 'ingame' } }),
    ]});
    const book = s.applyDelta({ url_name: 'x', presence: [{ userId: 'b', status: 'offline' }] });
    expect(book.bestSell).toBe(20);
  });

  it('applies upserts and removes', () => {
    const s = new LiveStore('pc');
    s.applySnapshot({ url_name: 'x', orders: [
      ord({ id: '1', order_type: 'sell', platinum: 20, user: { id: 'a', status: 'ingame' } }),
    ]});
    let book = s.applyDelta({ url_name: 'x', upserts: [
      ord({ id: '2', order_type: 'sell', platinum: 11, user: { id: 'b', status: 'ingame' } }),
    ]});
    expect(book.bestSell).toBe(11);
    book = s.applyDelta({ url_name: 'x', removeIds: ['2'] });
    expect(book.bestSell).toBe(20);
  });

  it('ignores wrong-platform and invisible orders', () => {
    const s = new LiveStore('pc');
    const book = s.applySnapshot({ url_name: 'x', orders: [
      ord({ id: '1', order_type: 'sell', platinum: 5, platform: 'xbox', user: { id: 'a', status: 'ingame' } }),
      ord({ id: '2', order_type: 'sell', platinum: 7, visible: false, user: { id: 'b', status: 'ingame' } }),
      ord({ id: '3', order_type: 'sell', platinum: 13, user: { id: 'c', status: 'ingame' } }),
    ]});
    expect(book.bestSell).toBe(13);
  });
});
