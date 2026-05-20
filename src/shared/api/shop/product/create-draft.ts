import type { ProductInventory } from '~/shared/models/product';
import type {
  ProductShippingCharge,
  ProductVariantTypes,
  ProductWhoMade
} from '~/shared/config/enums/product';

export type CreateDraftProductRequestImage = {
  storage_key: string
  rank: number
};

export type CreateDraftProductRequestAttribute = {
  category_attribute_id: string
  selected_option_id?: string
  selected_text?: string
};

export type CreateDraftProductRequestVariant = {
  client_key: string
  option_value_1: string
  option_value_2?: string
};

export type CreateDraftProductRequestInventory = Pick<ProductInventory, 'price' | 'sku' | 'stock'> & {
  variant_client_key?: string
  sale_price?: number
};

export type CreateDraftProductRequestShipping = {
  origin_country: string
  origin_zip: string
  process_time_label: string
  destinations: {
    country_code: string
    delivery_time_label: string
    service: string
    charge_type: ProductShippingCharge
  }[]
};

export type CreateDraftProductRequest = {
  category_id: string
  title: string
  description: string
  who_made: ProductWhoMade
  is_digital: boolean
  non_taxable?: boolean
  variant_type: ProductVariantTypes
  variant_group_name?: string
  variant_sub_group_name?: string
  images?: CreateDraftProductRequestImage[]
  attributes?: CreateDraftProductRequestAttribute[]
  variants?: CreateDraftProductRequestVariant[]
  inventory: CreateDraftProductRequestInventory[]
  shipping: CreateDraftProductRequestShipping
};

export type CreateDraftProductResponse = {
  id: string
  shop_id: string
  category_id?: string
  title: string
  description: string
  who_made: ProductWhoMade
  is_digital: boolean
  variant_type?: ProductVariantTypes
  variant_group_name?: string
  variant_sub_group_name?: string
  images: {
    id: string
    storage_key: string
    rank: number
    url?: string
  }[]
  attributes: {
    id: string
    category_attribute_id: string
    selected_option_id?: string
    selected_text?: string
  }[]
  variants: {
    id: string
    name: string
    option_value_1?: string
    option_value_2?: string
    rank: number
  }[]
  inventory: {
    id: string
    product_variant_id?: string
    sku?: string
    stock: number
    price: number
    sale_price?: number
  }[]
  shipping?: {
    id: string
    origin_country: string
    origin_zip: string
    process_time_label: string
    destinations: {
      id: string
      country_code: string
      delivery_time_label: string
      service: string
      charge_type: ProductShippingCharge
      rank: number
    }[]
  }
};
