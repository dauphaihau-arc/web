import type { UseQueryOptions } from '@tanstack/vue-query';
import { cartApi } from '~/shared/api/cart/cart.api';
import type { GetCartResponse } from '~/shared/api/cart/contracts/cart.contract';

export function useGetCart(
  params?: { cart_id: string },
  queryOptions?: Partial<UseQueryOptions<GetCartResponse>>
) {
  const enabled = (queryOptions as { enabled?: boolean } | undefined)?.enabled ?? true;

  return useQuery<GetCartResponse>({
    ...queryOptions,
    enabled,
    queryKey: ['get-cart', params?.cart_id ?? 'my-cart'],
    queryFn: () => cartApi.get(params ?? undefined),
    retry: 1,
  });
}
