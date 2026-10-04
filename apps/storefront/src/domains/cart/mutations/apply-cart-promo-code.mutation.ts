import type { MutationOptions } from '@tanstack/vue-query';
import type { FetchError } from 'ofetch';
import { cartApi } from '~/domains/cart/api/cart.api';
import type { ApplyCartPromoCodeRequest, ApplyCartPromoCodeResponse } from '~/domains/cart/api/contracts/cart.contract';
import { toastCustom } from '~/shared/config/toast';

/**
 * Applies one promo code for one shop and returns the validated promo code
 * selection the server accepted. The response is authoritative: callers must
 * persist the returned codes instead of the codes they guessed locally.
 */
export function useApplyCartPromoCode(
  options?: MutationOptions<ApplyCartPromoCodeResponse, FetchError, ApplyCartPromoCodeRequest>,
) {
  const toast = useToast();
  return useMutation({
    onError() {
      toast.add({
        ...toastCustom.error,
        title: 'Apply promo code failed',
      });
    },
    ...options,
    mutationFn: (body: ApplyCartPromoCodeRequest) => cartApi.applyPromoCode(body),
  });
}
