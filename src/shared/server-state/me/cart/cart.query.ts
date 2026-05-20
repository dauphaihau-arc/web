import type { UseQueryOptions } from '@tanstack/vue-query';
import { meCartApi } from '~/shared/api/me/cart/me-cart.api';
import type { GetCartResponse } from '~/shared/api/me/cart/get-cart';
import { useGetCurrentUser } from '~/shared/server-state/me/current-user.query';
import type { Cart } from '~/shared/models/cart';

export function useGetCart(
  params?: { cart_id: Cart['id'] },
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
