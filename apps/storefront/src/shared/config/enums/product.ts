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

export enum ProductShippingOtherCountriesOptions {
  EVERYWHERE = 'everywhere'
}

export enum ProductStates {
  ACTIVE = 'active', // currently for sale.
  INACTIVE = 'inactive', // When updating a product
  DRAFT = 'draft', //  if product in any other state cannot be moved to draft
  REMOVED = 'removed', // product has been removed by its owner.
  // SOLD_OUT = 'sold_out',
  // EXPIRED = 'expired',
  UNAVAILABLE = 'unavailable' // The Product has been removed by Arc admin for unspecified reasons. Products in this state may be missing some information which is normally required.
}

export enum ProductWhoMade {
  I_DID = 'i_did',
  COLLECTIVE = 'collective',
  SOMEONE_ELSE = 'someone_else'
}

export enum ProductVariantTypes {
  NONE = 'none',
  SINGLE = 'single',
  COMBINE = 'combine'
}

export const PRODUCT_REGEX_SLUG = /^[a-z0-9]+(?:(?:-|_)+[a-z0-9]+)*$/;
export const PRODUCT_REGEX_NOT_URL = /^(?!http.*$).*/;

export const productWhoMadeOpts = [
  {
    id: ProductWhoMade.I_DID,
    label: 'I did',
  },
  {
    id: ProductWhoMade.COLLECTIVE,
    label: 'A member of my shop',
  },
  {
    id: ProductWhoMade.SOMEONE_ELSE,
    label: 'Another company or person',
  },
];

export const isDigitalOpts = [
  { value: false, label: 'Physical', help: 'A tangible product that you will ship to buyers.' },
  { value: true, label: 'Digital', help: 'A digital file that buyers will download.' },
];

export enum ProductShippingCharge {
  FIXED_PRICE = 'fixed_price',
  FREE_SHIPPING = 'free_shipping'
}

export enum ProductShippingServices {
  OTHER = 'other'
}

export enum MarketGetProductsSortBy {
  OTHER = 'other'
}
