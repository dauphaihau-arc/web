import { resolveMyShopId } from '../utils/resolve-my-shop-id';
import { shopCouponApi } from '~/domains/shop/api/coupon/coupon.api';
import type { CreateShopCouponRequest } from '~/domains/shop/api/coupon/contracts/coupon.contract';

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
