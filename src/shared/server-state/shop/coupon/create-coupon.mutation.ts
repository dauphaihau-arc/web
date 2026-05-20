import { resolveMyShopId } from '../resolve-my-shop-id';
import { shopCouponApi } from '~/shared/api/shop/coupon/coupon.api';
import type { CreateShopCouponRequest } from '~/shared/api/shop/coupon/create';

export function useShopCreateCoupon() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ['shop-create-coupon'],
    mutationFn: async (body: CreateShopCouponRequest) => {
      const shopId = await resolveMyShopId(queryClient);
      return shopCouponApi.create(shopId, body);
    },
  });
}
