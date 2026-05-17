import type {
  Product,
  ProductCombineVariant,
  ProductImage,
  ProductInventory,
  ProductSingleVariant,
  ProductVariant
} from '~/shared/types/product';
import type { Coupon } from '~/shared/types/coupon';
import type { Shop } from '~/shared/types/shop';
import type { Cart } from '~/shared/types/cart';
import type { User } from '~/shared/types/user';

export type CartProductItem = {
  id: string
  quantity: number
  is_selected: boolean
  unit_price: number
  product: Pick<Product, 'id' | 'title'> & {
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

export type ResponseGetCart = {
  cart: CartResource | null
  summary: CartSummary
};

export type ResponseGetCartProductCart = CartProductItem;
export type ResponseGetCartShopCart = CartShopGroup;
export type ResponseGetCartSummaryOrder = CartSummary;

export type UpdateCartBody = Partial<{
  cart_id: Cart['id']
  inventory_id: ProductInventory['id']
  is_select_order: boolean
  quantity: number
  addition_info_temp_cart: {
    promo_codes: Coupon['code'][]
    note?: string
  }
  addition_info_shop_carts: {
    shop_id: Shop['id']
    promo_codes?: Coupon['code'][]
    note?: string
  }[]
}>;

export type ResponseUpdateCart = ResponseGetCart;

export type AddProductToCartBody = {
  inventory_id: ProductInventory['id']
  quantity: number
  variant_id?: ProductVariant['id']
  is_temp?: boolean
};

export type ResponseAddProductToCartBody = ResponseGetCart;

export type ResponseDeleteProductCart = ResponseGetCart;
