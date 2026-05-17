import type { NitroFetchOptions, NitroFetchRequest } from 'nitropack';
import type { UseQueryOptions } from '@tanstack/vue-query';
import type { ComputedRef } from 'vue';
import { RESOURCES } from '~/shared/config/enums/resources';
import type { Product } from '~/shared/types/product';
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
      return useCustomFetch.get<ResponseGetProducts>(
        RESOURCES.PRODUCTS,
        params.value
      );
    },
  });
}

export function useGetDetailProduct(
  id: Product['id'],
  options?: NitroFetchOptions<NitroFetchRequest>
) {
  return useQuery({
    enabled: !!id,
    queryKey: ['get-detail-product', id],
    queryFn: () => {
      return useCustomFetch.get<ResponseGetDetailProduct>(
        `${RESOURCES.PRODUCTS}/${id}`,
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
        const res = await useCustomFetch.get<ResponseGetProducts>(
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
