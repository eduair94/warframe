interface Auction {
  payload: Payload;
}

interface Payload {
  auctions: Auction[];
}

interface Auction {
  note: string;
  minimal_reputation: number;
  visible: boolean;
  buyout_price?: any;
  item: Item;
  starting_price: number;
  owner: Owner;
  platform: string;
  closed: boolean;
  top_bid?: any;
  winner?: any;
  is_marked_for?: any;
  marked_operation_at?: any;
  created: string;
  updated: string;
  note_raw: string;
  is_direct_sell: boolean;
  id: string;
  private: boolean;
}

interface Owner {
  reputation: number;
  locale: string;
  avatar?: any;
  last_seen: string;
  ingame_name: string;
  status: string;
  id: string;
  region: string;
}

interface Item {
  re_rolls: number;
  polarity: string;
  mod_rank: number;
  type: string;
  mastery_level: number;
  name: string;
  attributes: Attribute[];
  weapon_url_name: string;
}

interface Attribute {
  positive: boolean;
  value: number;
  url_name: string;
}

export { Auction };
