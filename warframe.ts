import axios from "axios";
import { MongooseServer, Schema } from "./database";
import { Item, OrdersWarframe, StatisticsWarframe, WarframeItemSingle, WarframeItems } from "./interface";
class Warframe {
    db: MongooseServer;
    constructor() {
        this.db = MongooseServer.getInstance('warframe-items', new Schema({
          id: { type: String, unique: true },
        },
        { strict: false }))
    }
    async saveItem(id: string, item:any) {
        await this.db.getAnUpdateEntry({id}, item)
    }
    async getItemsDatabase() {
        return await this.db.allEntries({});
    }
    async getWarframeItems() : Promise<WarframeItems> {
        const res = await axios.get('https://api.warframe.market/v1/items').then(res => res.data);
        return res;
    }
    async getSingleItemData(item: Item): Promise<WarframeItemSingle> {
        const url = `https://api.warframe.market/v1/items/${item.url_name}`;
        const res = await axios.get(url).then(res => res.data);
        return res;
    }
    async getWarframeItemOrders(item: Item): Promise<{buy: number, sell:number, volume:number}> {
        const url = `https://api.warframe.market/v1/items/${item.url_name}/orders`;
        console.log(url);
        const res = await axios.get(url).then(res => res.data);
        const { volume } = await this.getWarframeItemStatistics(item);
        return { ...this.getWarframeItemBuySellPrice(res), volume };
    }
    async getWarframeItemStatistics(item: Item): Promise<{volume:number}> {
        const url = `https://api.warframe.market/v1/items/${item.url_name}/statistics`;
        const res: StatisticsWarframe = await axios.get(url).then(res => res.data);
        const volume = res.payload.statistics_closed['48hours'].reduce((prev, curr) => prev + curr.volume, 0);
        return {
            volume
        };
    }
    getWarframeItemBuySellPrice(data: OrdersWarframe) {
        const orders = data.payload.orders;
        const buyOrders = orders.filter(order => order.order_type === 'buy' && order.user.status === 'ingame');
        const sellOrders = orders.filter(order => order.order_type === 'sell' && order.user.status === 'ingame');
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
