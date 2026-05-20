import type { CreateOrderResponse } from './create-order.shared';
import type { MarketCurrencies } from '~/shared/config/enums/market';
import type { Cart } from '~/shared/models/cart';
import type { Coupon } from '~/shared/models/coupon';
import type { Order } from '~/shared/models/order';
import type { Payment } from '~/shared/types/payment';

export type CreateOrderForBuyNowRequest = {
  cart_id: Cart['id']
  payment_type: Payment['type']
  user_address_id: string
  currency?: MarketCurrencies
  note?: Order['note']
  promo_codes?: Coupon['code'][]
};

export type CreateOrderForBuyNowResponse = CreateOrderResponse;
