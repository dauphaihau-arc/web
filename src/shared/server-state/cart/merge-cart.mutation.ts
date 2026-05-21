import type { MutationOptions } from '@tanstack/vue-query';
import type { FetchError } from 'ofetch';
import { cartApi } from '~/shared/api/cart/cart.api';
import type { GetCartResponse } from '~/shared/api/cart/contracts/cart.contract';

export function useMergeCart(
  options?: MutationOptions<GetCartResponse, FetchError, void>
) {
  return useMutation({
    ...options,
    mutationKey: ['merge-cart'],
    mutationFn: () => cartApi.merge(),
  });
}
