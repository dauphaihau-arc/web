import type { Category } from '~/types/category';
import type { RequestGetListParams } from '~/types/common';
import type { Shop } from '~/types/shop';
import type {
  Product,
  ProductInventory,
  ProductShipping
} from '~/types/product';
import type { Coupon, PercentOff } from '~/types/coupon';

// region get products
export type GetProductsParams = Partial<{
  categoryId: Category['id']
  shopId: string
  search: string
  title: string
  isDigital: boolean
  whoMade: string
  order: string
}> & RequestGetListParams;

export type ResponseGetProducts_Product = {
  id: string
  shop: {
    id: string
    publicId?: string
    shopName: string
  }
  categoryId?: Category['id']
  title: string
  slug: string
  image?: {
    storageKey: string
    url?: string
  }
  variantType?: string
  inventory?: {
    price: number
    salePrice?: number
    stock: number
    sku?: string
  }
  createdAt: string | Date
};

export type ResponseGetProducts = {
  items: ResponseGetProducts_Product[]
  meta: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNextPage: boolean
    hasPreviousPage: boolean
  }
};
// endregion

// region get detail product
export type ResponseGetDetailProduct_Inventory = Pick<ProductInventory, 'id' | 'stock' | 'price' | 'variant'> & {
  sale_price: ProductInventory['price']
};

type DetailProduct = {
  shop: Pick<Shop, 'id' | 'shop_name'>
  shipping: Pick<ProductShipping, 'country' | 'process_time'>
  variant_group_name?: string
  variant_sub_group_name?: string
  inventories: ResponseGetDetailProduct_Inventory[]
} & Pick<Product, 'id' | 'title' | 'description' | 'variant_type' | 'images' | 'category'>;

export type ResponseGetDetailProduct = {
  product: DetailProduct
  percent_coupon?: Pick<Coupon, 'start_date' | 'end_date'> & Pick<PercentOff, 'percent_off'>
  free_ship_coupon?: Pick<Coupon, 'start_date' | 'end_date'>
};
// endregion
