interface Riven {
  payload: Payload;
}

interface Payload {
  auctions: Auction[];
}

interface Auction {
  visible: boolean;
  item: Item;
  starting_price: number;
  buyout_price?: number;
  minimal_reputation: number;
  note: string;
  owner: Owner;
  platform: string;
  closed: boolean;
  top_bid?: number;
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
  avatar?: string;
  last_seen: string;
  ingame_name: string;
  locale: string;
  status: string;
  id: string;
  region: string;
}

interface Item {
  mod_rank?: number;
  re_rolls?: number;
  polarity?: string;
  name?: string;
  attributes?: Attribute[];
  type: string;
  mastery_level?: number;
  weapon_url_name: string;
  having_ephemera?: boolean;
  element?: string;
  quirk?: string;
  damage?: number;
}

interface Attribute {
  positive: boolean;
  value: number;
  url_name: string;
}

export { Riven };
