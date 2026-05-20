import type { Category } from '~/shared/types/category';
import type { RequestGetListParams } from '~/shared/types/common';

// region get products
export type GetProductsParams = Partial<{
  category_id: Category['id']
  shop_id: string
  search: string
  title: string
  is_digital: boolean
  who_made: string
  order: string
}> & RequestGetListParams;

export type ResponseGetProductsProduct = {
  id: string
  shop: {
    id: string
    public_id?: string
    shop_name: string
    slug: string
  }
  category_id?: Category['id']
  title: string
  slug: string
  image?: {
    storage_key: string
    url?: string
  }
  variant_type?: string
  inventory?: {
    price: number
    sale_price?: number
    stock: number
    sku?: string
  }
  created_at: string | Date
};

export type ResponseGetProducts = {
  items: ResponseGetProductsProduct[]
  meta: {
    page: number
    limit: number
    total: number
    total_pages: number
    has_next_page: boolean
    has_previous_page: boolean
  }
};
// endregion

export type ResponseGetDetailProduct = {
  id: string
  shop: {
    id: string
    public_id?: string
    shop_name: string
    slug: string
  }
  category_id?: Category['id']
  title: string
  slug: string
  description: string
  who_made: string
  is_digital: boolean
  variant_type?: string
  variant_group_name?: string
  variant_sub_group_name?: string
  images: Array<{
    id: string
    storage_key: string
    url?: string
    rank: number
  }>
  variants: Array<{
    id: string
    name: string
    option_value_1?: string
    option_value_2?: string
    image_storage_key?: string
    rank: number
  }>
  inventory: Array<{
    id: string
    product_variant_id?: string
    sku?: string
    stock: number
    price: number
    sale_price?: number
  }>
  shipping?: {
    origin_country: string
    process_time_label: string
    destinations: Array<{
      id: string
      country_code: string
      delivery_time_label: string
      service: string
      charge_type: string
      rank: number
    }>
  }
};
