import type { ComputedRef } from 'vue';
import { resolveMyShopId } from '../resolve-my-shop-id';
import { shopCouponApi } from '~/shared/api/shop/coupon/coupon.api';
import type { ListShopCouponsRequest, ListShopCouponsResponse } from '~/shared/api/shop/coupon/list';

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
