import { shopApi } from '~/domains/shop/api/shop.api';
import type { CurrentUserEnvelope } from '~/domains/auth/api/contracts/auth-user.contract';
import type { CreateShopRequest } from '~/domains/shop/api/contracts/shop.contract';
import { currentUserQueryOptions } from '~/domains/me/queries/current-user.query';

export function useCreateShop() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ['create-shop'],
    mutationFn: (body: CreateShopRequest) => {
      return shopApi.create(body);
    },
    async onSuccess(data) {
      const dataUserAuth = queryClient.getQueryData<CurrentUserEnvelope>(['current-user']);

      queryClient.setQueryData(['my-shop'], data);

      if (dataUserAuth) {
        queryClient.setQueryData(['current-user'], {
          user: {
            ...dataUserAuth.user,
            shop: {
              id: data.id,
              shop_name: data.shop_name,
            },
          },
        });
      }

      await queryClient.fetchQuery(currentUserQueryOptions);
    },
  });
}
