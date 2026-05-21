import type { Category } from '~/shared/api/category/category';
import type { RequestGetListParams } from '~/shared/contracts/common';

export type GetProductsRequest = Partial<{
  category_id: Category['id']
  shop_id: string
  search: string
  title: string
  is_digital: boolean
  who_made: string
  order: string
}> & RequestGetListParams;

export type GetProductsResponseItem = {
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

export type GetProductsResponse = {
  items: GetProductsResponseItem[]
  meta: {
    page: number
    limit: number
    total: number
    total_pages: number
    has_next_page: boolean
    has_previous_page: boolean
  }
};
