import { resolveMyShopId } from '../utils/resolve-my-shop-id';
import { shopShippingProfileApi } from '~/domains/shop/api/shipping-profile/shipping-profile.api';
import { SHOP_SHIPPING_PROFILES_QUERY_KEY } from '../queries/shipping-profiles.query';
import type {
  CreateShippingProfileRequestBody,
  UpdateShippingProfileRequestBody,
} from '~/domains/shop/api/shipping-profile/contracts/shipping-profile.contract';

function nextIdempotencyKey() {
  return crypto.randomUUID();
}

export function useCreateShippingProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ['shop-create-shipping-profile'],
    mutationFn: async (body: Omit<CreateShippingProfileRequestBody, 'idempotency_key'>) => {
      const shopId = await resolveMyShopId(queryClient);
      return shopShippingProfileApi.create(shopId, {
        ...body,
        idempotency_key: nextIdempotencyKey(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [SHOP_SHIPPING_PROFILES_QUERY_KEY] });
    },
  });
}

export function useUpdateShippingProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ['shop-update-shipping-profile'],
    mutationFn: async (input: {
      id: string
      body: Omit<UpdateShippingProfileRequestBody, 'idempotency_key'>
    }) => {
      const shopId = await resolveMyShopId(queryClient);
      return shopShippingProfileApi.update(shopId, input.id, {
        ...input.body,
        idempotency_key: nextIdempotencyKey(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [SHOP_SHIPPING_PROFILES_QUERY_KEY] });
    },
  });
}

export function useSetDefaultShippingProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ['shop-set-default-shipping-profile'],
    mutationFn: async (input: { id: string, isDefault: boolean }) => {
      const shopId = await resolveMyShopId(queryClient);
      return input.isDefault
        ? shopShippingProfileApi.setDefault(shopId, input.id)
        : shopShippingProfileApi.clearDefault(shopId, input.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [SHOP_SHIPPING_PROFILES_QUERY_KEY] });
    },
  });
}

export function useArchiveShippingProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ['shop-archive-shipping-profile'],
    mutationFn: async (shippingProfileId: string) => {
      const shopId = await resolveMyShopId(queryClient);
      return shopShippingProfileApi.archive(shopId, shippingProfileId, nextIdempotencyKey());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [SHOP_SHIPPING_PROFILES_QUERY_KEY] });
    },
  });
}
