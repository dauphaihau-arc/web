import type { CartResponse } from './cart.shared';
import type { ProductInventory } from '~/shared/models/product';

export type DeleteCartProductRequest = {
  inventory_id: ProductInventory['id']
};

export type DeleteCartProductResponse = CartResponse;
