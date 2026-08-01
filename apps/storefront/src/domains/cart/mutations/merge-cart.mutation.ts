import type { MutationOptions } from '@tanstack/vue-query';
import type { FetchError } from 'ofetch';
import { cartApi } from '~/domains/cart/api/cart.api';
import type { GetCartResponse } from '~/domains/cart/api/contracts/cart.contract';

export function useMergeCart(
  options?: MutationOptions<GetCartResponse, FetchError, void>
) {
  return useMutation({
    ...options,
    mutationKey: ['merge-cart'],
    mutationFn: () => cartApi.merge(),
  });
}
