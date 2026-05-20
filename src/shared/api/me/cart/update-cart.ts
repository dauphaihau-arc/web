import type { CartResponse } from './cart.shared';
import type { Cart } from '~/shared/models/cart';
import type { Coupon } from '~/shared/models/coupon';
import type { ProductInventory } from '~/shared/models/product';
import type { Shop } from '~/shared/models/shop';

export type UpdateCartRequest = Partial<{
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

export type UpdateCartResponse = CartResponse;
