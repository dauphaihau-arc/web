import type { UseQueryOptions } from '@tanstack/vue-query';
import type { ComputedRef } from 'vue';
import { productApi } from '~/shared/api/product/product.api';
import type {
  GetProductsParams,
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
      return productApi.getList(params.value) as Promise<ResponseGetProducts>;
    },
  });
}

export function useGetProductsByMultiQueries(queries?: GetProductsParams[]) {
  return useQueries({
    queries: queries?.map(qp => ({
      queryKey: [qp.category_id],
      queryFn: async () => {
        const res = await productApi.getList(qp) as ResponseGetProducts;
        return {
          ...res,
          category_id: qp.category_id,
        };
      },
    })) ?? [],
  });
}
