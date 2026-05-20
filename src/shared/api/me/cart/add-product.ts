import type { CartResponse } from './cart.shared';
import type { ProductInventory, ProductVariant } from '~/shared/models/product';

export type AddProductToCartRequest = {
  inventory_id: ProductInventory['id']
  quantity: number
  variant_id?: ProductVariant['id']
  is_temp?: boolean
};

export type AddProductToCartResponse = CartResponse;
