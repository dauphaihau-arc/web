import type { NitroFetchOptions, NitroFetchRequest } from 'nitropack';
import type { CreateDraftProductResponse } from './create-draft';
import type { Product } from '~/shared/models/product';

export type DetailShopProductRequest = {
  id: Product['id']
  options?: NitroFetchOptions<NitroFetchRequest>
};

export type DetailShopProductResponse = CreateDraftProductResponse;
