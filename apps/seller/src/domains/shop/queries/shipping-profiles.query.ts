import type { ComputedRef, Ref } from 'vue';
import { ShippingProfileStatuses } from '@arc/enums/shipping';
import { resolveMyShopId } from '../utils/resolve-my-shop-id';
import { shopShippingProfileApi } from '~/domains/shop/api/shipping-profile/shipping-profile.api';
import type {
  ListShippingProfilesRequest,
  ShippingProfileListResponse,
} from '~/domains/shop/api/shipping-profile/contracts/shipping-profile.contract';

export const SHOP_SHIPPING_PROFILES_QUERY_KEY = 'shop-shipping-profiles';

const SHIPPING_PROFILE_PICKER_PAGE_SIZE = 100;

/**
 * Profile pickers (Product create/edit) need every profile a Product could hold
 * or already holds: the assignable ones, plus an archived profile an unpublished
 * Product still references, so the existing assignment stays visible and
 * disabled instead of rendering as an unknown value.
 */
export const SHIPPING_PROFILE_PICKER_QUERY: ListShippingProfilesRequest = {
  page: 1,
  limit: SHIPPING_PROFILE_PICKER_PAGE_SIZE,
  status: [
    ShippingProfileStatuses.ACTIVE,
    ShippingProfileStatuses.DRAFT,
    ShippingProfileStatuses.ARCHIVED,
  ],
};

export function useShopShippingProfiles(
  queryParams: Ref<ListShippingProfilesRequest> | ComputedRef<ListShippingProfilesRequest>,
) {
  const queryClient = useQueryClient();
  return useQuery<ShippingProfileListResponse>({
    queryKey: [SHOP_SHIPPING_PROFILES_QUERY_KEY, queryParams],
    queryFn: async () => {
      const shopId = await resolveMyShopId(queryClient);
      return shopShippingProfileApi.list(shopId, queryParams.value);
    },
  });
}
