import type { Category } from '~/shared/api/category/categories';

export type GetDetailProductBySlugResponse = {
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
