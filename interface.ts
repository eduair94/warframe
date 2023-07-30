interface WarframeItems {
  payload: Payload;
}

interface Payload {
  items: Item[];
}

interface Item {
  item_name: string;
  id: string;
  thumb: string;
  url_name: string;
  vaulted?: boolean;
}

interface OrdersWarframe {
  payload: Payload;
}

interface Payload {
  orders: Order[];
}

interface Order {
  visible: boolean;
  platform: string;
  creation_date: string;
  quantity: number;
  last_update: string;
  order_type: string;
  user: User;
  platinum: number;
  id: string;
  region: string;
}

interface User {
  reputation: number;
  locale: string;
  avatar?: string;
  ingame_name: string;
  last_seen: string;
  id: string;
  region: string;
  status: string;
}

interface StatisticsWarframe {
  payload: Payload;
}

interface Payload {
  statistics_closed: Statisticsclosed;
  statistics_live: Statisticslive;
}

interface Statisticslive {
  '48hours': _48hour2[];
  '90days': _48hour2[];
}

interface _48hour2 {
  datetime: string;
  volume: number;
  min_price: number;
  max_price: number;
  avg_price: number;
  wa_price: number;
  median: number;
  order_type: string;
  id: string;
  mod_rank: number;
}

interface Statisticsclosed {
  '48hours': _48hour[];
  '90days': _48hour[];
}

interface _48hour {
  datetime: string;
  volume: number;
  min_price: number;
  max_price: number;
  open_price: number;
  closed_price: number;
  avg_price: number;
  wa_price: number;
  median: number;
  donch_top: number;
  donch_bot: number;
  id: string;
  mod_rank: number;
  moving_avg?: number;
}

interface WarframeItemSingle {
  payload: Payload;
}

interface Payload {
  item: Item;
}

interface Item {
  id: string;
  items_in_set: Itemsinset[];
}

interface Itemsinset {
  id: string;
  thumb: string;
  mod_max_rank: number;
  url_name: string;
  rarity: string;
  icon_format: string;
  sub_icon?: any;
  icon: string;
  tags: string[];
  trading_tax: number;
  en: En;
  ru: En;
  ko: En;
  fr: En;
  sv: En;
  de: En;
  'zh-hant': En;
  'zh-hans': En;
  pt: En;
  es: En;
  pl: En;
  cs: En;
  uk: En;
}

interface En {
  item_name: string;
  description: string;
  wiki_link: string;
  drop: any[];
}

export { Item, OrdersWarframe, StatisticsWarframe, WarframeItemSingle, WarframeItems };

