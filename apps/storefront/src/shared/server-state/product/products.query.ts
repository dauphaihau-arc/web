import type { UseQueryOptions } from '@tanstack/vue-query';
import type { ComputedRef } from 'vue';
import { productApi } from '~/shared/api/product/product.api';
import type {
  GetProductsRequest,
  GetProductsResponse
} from '~/shared/api/product/contracts/product.contract';

export function useGetProducts(
  params: ComputedRef<GetProductsRequest | undefined>,
  options?: Partial<UseQueryOptions<GetProductsResponse>>
) {
  return useQuery<GetProductsResponse>({
    enabled: !!params.value,
    ...options,
    queryKey: ['get-products', params],
    queryFn: () => {
      return productApi.getList(params.value) as Promise<GetProductsResponse>;
    },
  });
}

export function useGetProductsByMultiQueries(queries?: GetProductsRequest[]) {
  return useQueries({
    queries: queries?.map(qp => ({
      queryKey: [qp.category_id],
      queryFn: async () => {
        const res = await productApi.getList(qp) as GetProductsResponse;
        return {
          ...res,
          category_id: qp.category_id,
        };
      },
    })) ?? [],
  });
}
