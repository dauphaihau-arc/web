import type { ComputedRef } from 'vue';
import { resolveMyShopId } from '../utils/resolve-my-shop-id';
import { shopCouponApi } from '~/domains/shop/api/coupon/coupon.api';
import type { ListShopCouponsRequest, ListShopCouponsResponse } from '~/domains/shop/api/coupon/contracts/coupon.contract';

export function useShopGetCoupons(queryParams: ComputedRef<ListShopCouponsRequest>) {
  const queryClient = useQueryClient();
  return useQuery<ListShopCouponsResponse>({
    queryKey: ['shop-get-coupons', queryParams],
    queryFn: async () => {
      const shopId = await resolveMyShopId(queryClient);
      return shopCouponApi.list(shopId, queryParams.value);
    },
  });
}
