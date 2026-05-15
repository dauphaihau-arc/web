export const PRODUCT_CONFIG = {
  MIN_CHAR_TITLE: 2,
  MAX_CHAR_TITLE: 10000,
  MIN_CHAR_DESCRIPTION: 2,
  MAX_CHAR_DESCRIPTION: 10000,
  MIN_IMAGES: 1,
  MAX_IMAGES: 10,
  MIN_PRICE: 0.2,
  MAX_PRICE: 50000,
  MIN_STOCK: 0,
  MAX_STOCK: 999,
  LOW_STOCK: 5,
  MAX_CHAR_VARIANT_GROUP_NAME: 14,
  MAX_CHAR_VARIANT_NAME: 20,
  MAX_CHAR_SKU: 32,
  MAX_TAGS: 11,
  MIN_CHAR_TAG: 2,
  MAX_CHAR_TAG: 21,
};

export const PRODUCT_SHIPPING_CONFIG = {
  MAX_DAYS_DELIVERY: 45,
};

export enum PRODUCT_SHIPPING_OTHER_COUNTRIES_OPTIONS {
  EVERYWHERE = 'everywhere'
}

export enum PRODUCT_STATES {
  ACTIVE = 'active', // currently for sale.
  INACTIVE = 'inactive', // When updating a product
  DRAFT = 'draft', //  if product in any other state cannot be moved to draft
  REMOVED = 'removed', // product has been removed by its owner.
  // SOLD_OUT = 'sold_out',
  // EXPIRED = 'expired',
  UNAVAILABLE = 'unavailable' // The Product has been removed by Arc admin for unspecified reasons. Products in this state may be missing some information which is normally required.
}

export enum PRODUCT_WHO_MADE {
  I_DID = 'i_did',
  COLLECTIVE = 'collective',
  SOMEONE_ELSE = 'someone_else'
}

export enum PRODUCT_VARIANT_TYPES {
  NONE = 'none',
  SINGLE = 'single',
  COMBINE = 'combine'
}

export const PRODUCT_REGEX_SLUG = /^[a-z0-9]+(?:(?:-|_)+[a-z0-9]+)*$/;
export const PRODUCT_REGEX_NOT_URL = /^(?!http.*$).*/;

export const productWhoMadeOpts = [
  {
    id: PRODUCT_WHO_MADE.I_DID,
    label: 'I did',
  },
  {
    id: PRODUCT_WHO_MADE.COLLECTIVE,
    label: 'A member of my shop',
  },
  {
    id: PRODUCT_WHO_MADE.SOMEONE_ELSE,
    label: 'Another company or person',
  },
];

export const isDigitalOpts = [
  { value: false, label: 'Physical', help: 'A tangible product that you will ship to buyers.' },
  { value: true, label: 'Digital', help: 'A digital file that buyers will download.' },
];

export enum PRODUCT_SHIPPING_CHARGE {
  FIXED_PRICE = 'fixed_price',
  FREE_SHIPPING = 'free_shipping'
}

export enum PRODUCT_SHIPPING_SERVICES {
  OTHER = 'other'
}

export enum MARKET_GET_PRODUCTS_SORT_BY {
  OTHER = 'other'
}
