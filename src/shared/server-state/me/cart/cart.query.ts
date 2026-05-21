import type { UseQueryOptions } from '@tanstack/vue-query';
import { meCartApi } from '~/shared/api/me/cart/me-cart.api';
import type { GetCartResponse } from '~/shared/api/me/cart/contracts/cart.contract';
import { useGetCurrentUser } from '~/shared/server-state/me/current-user.query';

export function useGetCart(
  params?: { cart_id: string },
  queryOptions?: Partial<UseQueryOptions<GetCartResponse>>
) {
  const { data: dataUserAuth } = useGetCurrentUser();
  return useQuery<GetCartResponse>({
    ...queryOptions,
    enabled: !!dataUserAuth.value?.user,
    queryKey: ['get-cart', params?.cart_id ?? 'my-cart'],
    queryFn: () => {
      return meCartApi.get(params ?? undefined);
    },
    retry: 1,
  });
}
