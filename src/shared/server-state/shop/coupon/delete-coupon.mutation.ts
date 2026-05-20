import { resolveMyShopId } from '../resolve-my-shop-id';
import { toastCustom } from '~/shared/config/toast';
import { shopCouponApi } from '~/shared/api/shop/coupon/coupon.api';
import type { Product } from '~/shared/models/product';

export function useShopDeleteCoupon() {
  const queryClient = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationKey: ['shop-delete-coupon'],
    mutationFn: async (id: Product['id']) => {
      const shopId = await resolveMyShopId(queryClient);
      return shopCouponApi.delete(shopId, id);
    },
    onSuccess() {
      toast.add({
        ...toastCustom.success,
        title: 'Delete coupon success',
      });
    },
    onError() {
      toast.add({
        ...toastCustom.error,
        title: 'Delete coupon failed',
      });
    },
  });
}
