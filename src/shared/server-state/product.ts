import type { NitroFetchOptions, NitroFetchRequest } from 'nitropack';
import type { UseQueryOptions } from '@tanstack/vue-query';
import type { ComputedRef } from 'vue';
import { RESOURCES } from '~/shared/config/enums/resources';
import { apiClient } from '~/shared/lib/api-client';
import type {
  GetProductsParams,
  ResponseGetDetailProduct,
  ResponseGetProducts
} from '~/shared/types/request-api/product';

export function useGetProducts(
  params: ComputedRef<GetProductsParams | undefined>,
  options?: Partial<UseQueryOptions<ResponseGetProducts>>
) {
  return useQuery<ResponseGetProducts>({
    enabled: !!params.value,
    ...options,
    queryKey: ['get-products', params],
    queryFn: () => {
      return apiClient.get<ResponseGetProducts>(
        RESOURCES.PRODUCTS,
        params.value
      );
    },
  });
}

export function useGetDetailProductBySlug(
  shopSlug: string,
  productSlug: string,
  options?: NitroFetchOptions<NitroFetchRequest>
) {
  return useQuery({
    enabled: !!shopSlug && !!productSlug,
    queryKey: ['get-detail-product-by-slug', shopSlug, productSlug],
    queryFn: () => {
      return apiClient.get<ResponseGetDetailProduct>(
        `${RESOURCES.PRODUCTS}/by-slug/${shopSlug}/${productSlug}`,
        undefined,
        options
      );
    },
  });
}

export function useGetProductsByMultiQueries(queries?: GetProductsParams[]) {
  return useQueries({
    queries: queries?.map(qp => ({
      queryKey: [qp.category_id],
      queryFn: async () => {
        const res = await apiClient.get<ResponseGetProducts>(
          RESOURCES.PRODUCTS,
          qp
        );
        return {
          ...res,
          category_id: qp.category_id,
        };
      },
    })) ?? [],
  });
}
