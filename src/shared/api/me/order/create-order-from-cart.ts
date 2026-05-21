import type { CreateOrderResponse } from './create-order.shared';
import type { MarketCurrencies } from '~/shared/config/enums/market';
import type { Coupon } from '~/shared/models/coupon';
import type { Order } from '~/shared/models/order';
import type { Shop } from '~/shared/models/shop';

export type CreateOrderFromCartRequest = {
  currency?: MarketCurrencies
  payment_type: Order['payment_type']
  user_address_id: string
  addition_info_shop_carts?: {
    shop_id: Shop['id']
    promo_codes: Coupon['code'][]
    note: Order['note']
  }[]
};

export type CreateOrderFromCartResponse = CreateOrderResponse;
