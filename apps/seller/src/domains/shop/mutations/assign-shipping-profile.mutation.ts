import { resolveMyShopId } from '../utils/resolve-my-shop-id';
import { shopProductApi } from '~/domains/shop/api/product/product.api';
import { SHOP_PRODUCT_DETAIL_QUERY_KEY } from '../queries/product/detail.query';
import type { AssignShippingProfileBody } from '~/domains/shop/api/product/contracts/update-product.contract';

export function useAssignShippingProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ['shop-assign-shipping-profile'],
    mutationFn: async (input: Omit<AssignShippingProfileBody, 'idempotency_key'> & {
      productId: string
    }) => {
      const shopId = await resolveMyShopId(queryClient);
      const { productId, shippingProfileId } = input;
      return shopProductApi.assignShippingProfile(shopId, productId, {
        idempotency_key: crypto.randomUUID(),
        shippingProfileId,
      });
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: [SHOP_PRODUCT_DETAIL_QUERY_KEY, variables.productId] });
      queryClient.invalidateQueries({ queryKey: ['shop-get-products'] });
    },
  });
}
