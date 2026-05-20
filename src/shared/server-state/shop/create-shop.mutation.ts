import { shopApi } from '~/shared/api/shop/shop.api';
import type { CreateShopRequest } from '~/shared/api/shop/shop.api';
import type { UserAuthenticated } from '~/shared/api/auth/login';

export function useCreateShop() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ['create-shop'],
    mutationFn: (body: CreateShopRequest) => {
      return shopApi.create(body);
    },
    onSuccess(data) {
      const dataUserAuth = queryClient.getQueryData<{ user: UserAuthenticated }>(['current-user']);

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
    },
  });
}
