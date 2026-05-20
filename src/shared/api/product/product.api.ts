import type { NitroFetchOptions, NitroFetchRequest } from 'nitropack';
import type { GetDetailProductBySlugResponse } from './detail-by-slug';
import type { GetProductsRequest, GetProductsResponse } from './list';
import { apiClient } from '~/shared/lib/api-client';

export const productApi = {
  getDetailBySlug(
    shopSlug: string,
    productSlug: string,
    options?: NitroFetchOptions<NitroFetchRequest>
  ) {
    return apiClient.get<GetDetailProductBySlugResponse>(
      `/products/by-slug/${shopSlug}/${productSlug}`,
      undefined,
      options
    );
  },

  getList(params?: GetProductsRequest) {
    return apiClient.get<GetProductsResponse>(
      '/products',
      params
    );
  },
};
