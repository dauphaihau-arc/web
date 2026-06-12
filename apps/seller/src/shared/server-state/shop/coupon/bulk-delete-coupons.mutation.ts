import { resolveMyShopId } from '../resolve-my-shop-id';
import { toastCustom } from '~/shared/config/toast';
import { shopCouponApi } from '~/shared/api/shop/coupon/coupon.api';
import type { BulkDeleteShopCouponsRequest } from '~/shared/api/shop/coupon/contracts/coupon.contract';

export function useShopBulkDeleteCoupons() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationKey: ['shop-bulk-delete-coupons'],
    mutationFn: async (payload: BulkDeleteShopCouponsRequest) => {
      const shopId = await resolveMyShopId(queryClient);
      return shopCouponApi.bulkDelete(shopId, payload);
    },
    onSuccess(result) {
      queryClient.invalidateQueries({ queryKey: ['shop-get-coupons'] });

      if (result.failed.length === 0) {
        toast.add({
          ...toastCustom.success,
          title: 'Coupons deleted',
          description: `${result.succeeded_ids.length} coupon(s) deleted.`,
        });
        return;
      }

      toast.add({
        ...(result.succeeded_ids.length > 0 ? toastCustom.warning : toastCustom.error),
        title: result.succeeded_ids.length > 0 ?
          'Coupons deleted with some failures' :
          'Failed to delete coupons',
        description: `${result.succeeded_ids.length} succeeded, ${result.failed.length} failed.`,
      });
    },
    onError() {
      toast.add({
        ...toastCustom.error,
        title: 'Failed to delete coupons',
      });
    },
  });
}
