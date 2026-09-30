import type { MutationOptions } from '@tanstack/vue-query';
import type { FetchError } from 'ofetch';
import { cartApi } from '~/domains/cart/api/cart.api';
import type { ApplyCartCouponRequest, ApplyCartCouponResponse } from '~/domains/cart/api/contracts/cart.contract';
import { toastCustom } from '~/shared/config/toast';

/**
 * Applies one coupon for one shop and returns the validated promo code
 * selection the server accepted. The response is authoritative: callers must
 * persist the returned codes instead of the codes they guessed locally.
 */
export function useApplyCartCoupon(
  options?: MutationOptions<ApplyCartCouponResponse, FetchError, ApplyCartCouponRequest>,
) {
  const toast = useToast();
  return useMutation({
    onError() {
      toast.add({
        ...toastCustom.error,
        title: 'Apply coupon failed',
      });
    },
    ...options,
    mutationFn: (body: ApplyCartCouponRequest) => cartApi.applyCoupon(body),
  });
}
