import type { Product } from '~/shared/models/product';

export type RemoveProductRequest = {
  id: Product['id']
};

export type RemoveProductResponse = undefined;
