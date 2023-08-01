import axios, { AxiosInstance } from "axios";
import axiosRetry from 'axios-retry';
import { ProxyAgent } from "proxy-agent";
import { SocksProxyAgent } from "socks-proxy-agent";
import proxies from "./Express/Proxies";
import { sleep } from "./Express/config";
import { MongooseServer, Schema } from "./database";
import { Item, OrdersWarframe, StatisticsWarframe, WarframeItemSingle, WarframeItems } from "./interface";
import privateProxy from "./proxy";

class Warframe {
    db: MongooseServer;
    axios: AxiosInstance;
    constructor() {
        this.db = MongooseServer.getInstance('warframe-items', new Schema({
          id: { type: String, unique: true },
        },
        { strict: false }))
        const proxy = new SocksProxyAgent(privateProxy);
        this.axios = axios.create({
            httpAgent: proxy,
            httpsAgent: proxy
        });
        axiosRetry(axios, {
            retryDelay: axiosRetry.exponentialDelay, onRetry: (retryCount, error, requestConfig) => {
                console.log("Retry", retryCount);
            }
         });
    }
    async saveItem(id: string, item:any) {
        await this.db.getAnUpdateEntry({id}, item)
    }
    async getSet(url_name: string) {
        const res:any = await this.getSingleItemDB({url_name} as any);
        const items = res.items_in_set.filter((el:any)=> el.url_name !== url_name).map(el => el.url_name);
        const results = await this.db.allEntries({ url_name: { $in: items } });
        const itemByParts = JSON.parse(JSON.stringify(res));
        itemByParts.item_name = `${res.item_name} by Parts`;
        itemByParts.market.buy = results.reduce((prev: any, curr: any) => prev + curr.market.buy, 0);
        itemByParts.market.sell = results.reduce((prev: any, curr: any) => prev + curr.market.sell, 0);
        return { set: [this.processItem(res), this.processItem(itemByParts) ], items: results.map(el=> this.processItem(el)) }
    }
    processItem(item:Item) {
        const { item_name, thumb, market, url_name, items_in_set } = item;
        const { tags } = items_in_set[0];
        return {item_name, thumb, market: {...market, diff: market.sell - market.buy}, url_name, tags, set: items_in_set.length > 1}
    }
    async getItemsDatabaseServer() {
        const entries = await this.db.allEntries({});
        return entries.map((item:Item) => {
            return this.processItem(item);
        })
    }
    async getItemsDatabase() {
        return await this.db.allEntries({});
    }
    async getItemsDatabaseDate() {
        return await this.db.allEntriesSort({}, {priceUpdate: 1});
    }
    async getWarframeItems() : Promise<WarframeItems> {
        const res = await this.axios.get('https://api.warframe.market/v1/items').then(res => res.data);
        return res;
    }
    async getSingleItemDB(item: Item) {
        return this.db.findEntry({ url_name: item.url_name });
    }
    async getSingleItemData(item: Item): Promise<WarframeItemSingle> {
        const url = `https://api.warframe.market/v1/items/${item.url_name}`;
        const res = await this.axios.get(url).then(res => res.data);
        return res;
    }
    async getWarframeItemOrders(item: Item, att = 0): Promise<{ buy: number, sell: number, volume: number }> {
        try {
            const proxy: any = proxies.getProxy();
            const httpAgent = new ProxyAgent(proxy);
            const url = `https://api.warframe.market/v1/items/${item.url_name}/orders`;
            const res = await this.axios.get(url, {
                httpAgent: httpAgent,
                httpsAgent: httpAgent
            }).then(res => res.data);
            const itemSet = item.items_in_set[0];
            let max_rank = itemSet.mod_max_rank;
            const { volume } = await this.getWarframeItemStatistics(item, max_rank, httpAgent);
            return { ...this.getWarframeItemBuySellPrice(res, max_rank), volume };
        } catch (e) {
            await sleep(1000);
            return this.getWarframeItemOrders(item);
        }    
    }
    async getWarframeItemStatistics(item: Item, max_rank: number | undefined, httpAgent:ProxyAgent): Promise<{volume:number}> {
        const url = `https://api.warframe.market/v1/items/${item.url_name}/statistics`;
        const res: StatisticsWarframe = await this.axios.get(url, {
            httpAgent: httpAgent,
            httpsAgent: httpAgent
        }).then(res => res.data);
        const volume = res.payload.statistics_closed['48hours'].reduce((prev, curr) => (max_rank === undefined || curr.mod_rank === max_rank) ? prev + curr.volume: prev, 0);
        return {
            volume
        };
    }
    getWarframeItemBuySellPrice(data: OrdersWarframe, max_rank: number | undefined) {
        const orders = data.payload.orders;
        const buyOrders = orders.filter(order => order.order_type === 'buy' && order.user.status === 'ingame' && (max_rank === undefined || order.mod_rank === max_rank));
        const sellOrders = orders.filter(order => order.order_type === 'sell' && order.user.status === 'ingame' && (max_rank === undefined || order.mod_rank === max_rank));
        // Find the lowest buy order by the property platinum
        let buyPlat = 0;
        if (buyOrders.length) {
            const lowestBuyOrder = buyOrders.reduce((prev, curr) => prev.platinum > curr.platinum ? prev : curr);   
            buyPlat = lowestBuyOrder.platinum;
        }
        // Same for sell Orders.
        let sellPlat = 0;
        if (sellOrders.length) {
            const lowestSellOrder = sellOrders.reduce((prev, curr) => prev.platinum < curr.platinum ? prev : curr); 
            sellPlat = lowestSellOrder.platinum;
        }
        return {
            buy: buyPlat,
            sell: sellPlat
        }
    }
}

export { Warframe };
