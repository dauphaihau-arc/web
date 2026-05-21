import type { Coupon, PercentOff } from '~/shared/models/coupon';
import type { Order, OrderShopProduct } from '~/shared/models/order';
import type { Product, ProductInventory } from '~/shared/models/product';
import type { Shop } from '~/shared/models/shop';
import type { Override } from '~/shared/contracts/utils';
import type { Payment } from '~/shared/contracts/payment';

export type ResponseGetOrderShopsProduct = Override<OrderShopProduct, {
  product: Pick<Product, 'shipping' | 'id'> & {
    slug: string
    shop: {
      slug: string
    }
    variant_group_name?: string
    variant_sub_group_name?: string
  }
  inventory: Pick<ProductInventory, 'variant'>
  percent_coupon: Pick<PercentOff, 'percent_off'> | null
}>;

export type OrderShopShipping = {
  shipping_status: Order['shipping_status']
  updated_at: Order['updated_at']
  to_country: string
  from_countries: string[]
  estimated_delivery: Date
};

export type OrderShopResource = {
  shop: Pick<Shop, 'id' | 'shop_name'> & {
    slug: string
  }
  payment: Pick<Payment, 'type' | 'card_funding' | 'card_last4' | 'card_brand'>
  products: ResponseGetOrderShopsProduct[]
  promo_coupons: Pick<Coupon, 'id' | 'code'>[]
  shipping: OrderShopShipping
} & Pick<Order, 'id' | 'subtotal' | 'total_shipping_fee' | 'total' | 'total_discount' | 'note' | 'created_at'>;
