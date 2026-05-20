import type { CartResponse } from './cart.shared';
import type { Cart } from '~/shared/models/cart';

export type GetCartRequest = {
  cart_id?: Cart['id']
};

export type GetCartResponse = CartResponse;
