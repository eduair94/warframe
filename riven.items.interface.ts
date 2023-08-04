interface RivenItems {
  payload: Payload;
}

interface Payload {
  items: Item[];
}

interface Item {
  icon: string;
  group: string;
  mastery_level: number;
  id: string;
  riven_type: string;
  url_name: string;
  thumb: string;
  icon_format?: string;
  item_name: string;
}

export { RivenItems };
