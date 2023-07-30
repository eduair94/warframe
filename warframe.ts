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
    async getItemsDatabaseServer() {
        const entries = await this.db.allEntries({});
        return entries.map(({item_name, thumb, market}) => {
            return {item_name, thumb, market}
        })
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
        const res = await axios.get(url).then(res => res.data);
        const itemSet = item.items_in_set[0];
        let max_rank = itemSet.mod_max_rank;
        console.log("Max Rank", max_rank);
        const { volume } = await this.getWarframeItemStatistics(item, max_rank);
        return { ...this.getWarframeItemBuySellPrice(res, max_rank), volume };
    }
    async getWarframeItemStatistics(item: Item, max_rank: number | undefined): Promise<{volume:number}> {
        const url = `https://api.warframe.market/v1/items/${item.url_name}/statistics`;
        const res: StatisticsWarframe = await axios.get(url).then(res => res.data);
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
