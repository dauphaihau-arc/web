import type { Cart } from '~/shared/models/cart';
import type {
  Product, ProductCombineVariant, ProductImage, ProductInventory, ProductSingleVariant
} from '~/shared/models/product';
import type { Shop } from '~/shared/models/shop';
import type { User } from '~/shared/models/user';

export type CartProductItem = {
  id: string
  quantity: number
  is_selected: boolean
  unit_price: number
  product: Pick<Product, 'id' | 'title'> & {
    slug: string
    shop: {
      slug: string
    }
    variant_type: Product['variant_type']
    variant_group_name?: ProductSingleVariant['variant_group_name']
    variant_sub_group_name?: ProductCombineVariant['variant_sub_group_name']
    image_url?: ProductImage['relative_url']
  }
  inventory: {
    id: ProductInventory['id']
    price: ProductInventory['price']
    sale_price?: ProductInventory['price']
    stock: ProductInventory['stock']
    sku?: ProductInventory['sku']
    variant_name?: ProductInventory['variant']
  }
};

export type CartShopGroup = {
  shop: {
    id: Shop['id']
    name: Shop['shop_name']
  }
  items: CartProductItem[]
  total_price: number
  total_shipping_fee: number
};

export type CartSummary = {
  subtotal_price: number
  total_discount: number
  subtotal_after_discount: number
  total_shipping_fee: number
  total_price: number
  total_selected_quantity: number
  total_quantity: number
};

export type CartRecentItem = {
  item_id: string
  product: Pick<Product, 'id' | 'title'> & {
    slug: string
    shop: {
      slug: string
    }
    image_url?: ProductImage['relative_url']
  }
  inventory: {
    variant_name?: ProductInventory['variant']
  }
  quantity: number
};

export type CartResource = {
  id: Cart['id']
  user_id: User['id']
  is_temp: boolean
  shop_groups: CartShopGroup[]
  recent_items: CartRecentItem[]
  total_quantity: number
};

export type CartResponse = {
  cart: CartResource | null
  summary: CartSummary
};
