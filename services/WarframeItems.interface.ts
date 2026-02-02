export interface WarframeItemsResponse {
  apiVersion: string;
  data: WarframeItemV2[];
  error: null;
}

/**
 * V2 API item structure from Warframe Market
 * Note: This differs from the database/v1 format:
 * - v2 uses 'slug' instead of 'url_name'
 * - v2 uses 'i18n.en.name' instead of 'item_name'
 * - v2 uses 'i18n.en.thumb' instead of 'thumb'
 */
export interface WarframeItemV2 {
  id: string;
  slug: string;
  gameRef: string;
  tags: string[];
  i18n: I18n;
  maxRank?: number;
  bulkTradable?: boolean;
  ducats?: number;
  subtypes?: string[];
  maxAmberStars?: number;
  maxCyanStars?: number;
  baseEndo?: number;
  endoMultiplier?: number;
  vaulted?: boolean;
}

interface I18n {
  en: En;
}

interface En {
  name: string;
  icon: string;
  thumb: string;
  subIcon?: string;
}